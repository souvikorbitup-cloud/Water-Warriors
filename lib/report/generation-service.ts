import "server-only";

import { connectDB } from "@/lib/db";
import {
  getBillingOrder,
  type BillingOrderDocument,
} from "@/lib/billing/billing-service";
import ReportSession, {
  type IReportSession,
} from "@/lib/models/ReportSession.model";
import {
  REPORT_IMPACT_ASSUMPTIONS,
  RUNOFF_COEFFICIENT,
} from "@/lib/report/constants";
import {
  getPolygonAreaSquareMeters,
  getPolygonCentroid,
} from "@/lib/report/geometry";
import {
  getAverageAnnualRainfall,
  deleteHydrogeologyAnalysisCache,
  getFiveMonthForecast,
  getHydrogeologyAnalysis,
  getMapSnapshotType,
  GeminiGenerationError,
  reverseGeocode,
} from "@/lib/report/providers";
import type {
  ReportForecastMonth,
  ReportAnalysisResult,
  ReportLocale,
  ReportLocation,
  ReportSessionData,
} from "@/lib/report/types";

const RETRY_DELAYS_MS = [10_000, 30_000];
type ReportStep = keyof IReportSession["steps"];

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isRetryableAnalysisError(error: unknown): boolean {
  if (error instanceof GeminiGenerationError) return error.retryable;
  return (
    !(error instanceof Error) ||
    !error.message.includes("GEMINI_API_KEY is not configured.")
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Report generation failed.";
}

async function updateStep(
  orderId: string,
  step: ReportStep,
  value: unknown,
  persistDetails: boolean,
  analysisLocale?: ReportLocale,
  waterValueRupeesPerKilolitre?: number,
  waterValueIsLocationBased?: boolean,
): Promise<void> {
  await ReportSession.updateOne(
    { orderId },
    { $set: { [`steps.${step}`]: "complete" } },
  );
  if (persistDetails) {
    const detailFields: Record<string, unknown> = { [step]: value };
    if (step === "analysis" && analysisLocale) {
      detailFields.analysisLocale = analysisLocale;
    }
    if (step === "analysis" && waterValueRupeesPerKilolitre !== undefined) {
      detailFields.waterValueRupeesPerKilolitre = waterValueRupeesPerKilolitre;
    }
    if (step === "analysis" && waterValueIsLocationBased !== undefined) {
      detailFields.waterValueIsLocationBased = waterValueIsLocationBased;
    }
    const unsetFields: Record<string, ""> = {};
    if (step === "analysis" && waterValueRupeesPerKilolitre === undefined) {
      unsetFields.waterValueRupeesPerKilolitre = "";
    }
    if (step === "analysis" && waterValueIsLocationBased === undefined) {
      unsetFields.waterValueIsLocationBased = "";
    }
    await ReportSession.updateOne(
      { orderId, analyticsConsent: true },
      {
        $set: detailFields,
        ...(Object.keys(unsetFields).length > 0 ? { $unset: unsetFields } : {}),
      },
    );
  }
}

async function setStepFailed(orderId: string, step: ReportStep): Promise<void> {
  await ReportSession.updateOne(
    { orderId },
    { $set: { [`steps.${step}`]: "failed" } },
  );
}

async function generateAnalysisWithRetries(
  orderId: string,
  location: ReportLocation,
  areaSqm: number,
  rainfallMm: number,
  potentialLitres: number,
  persistDetails: boolean,
  locale: ReportLocale,
): Promise<ReportAnalysisResult> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await getHydrogeologyAnalysis(
        location,
        areaSqm,
        rainfallMm,
        potentialLitres,
        persistDetails,
        locale,
      );
    } catch (error) {
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined || !isRetryableAnalysisError(error)) throw error;

      await ReportSession.updateOne(
        { orderId },
        {
          $set: {
            status: "retrying",
            lastError: getErrorMessage(error),
          },
        },
      );
      await wait(delay);
    }
  }

  throw new Error("Hydrogeology analysis retries were exhausted.");
}

function buildReportData(
  orderId: string,
  status: ReportSessionData["status"],
  order: BillingOrderDocument,
  selection: NonNullable<BillingOrderDocument["rooftopSelection"]>,
  areaSqm: number,
  centroid: { lat: number; lng: number },
  steps: ReportSessionData["steps"],
  values: {
    annualRainfallMm?: number;
    potentialLitres?: number;
    location?: ReportLocation;
    analysis?: string[];
    analysisLocale?: ReportLocale;
    waterValueRupeesPerKilolitre?: number;
    waterValueIsLocationBased?: boolean;
    forecast?: ReportForecastMonth[];
    mapSnapshotType?: string;
  },
  lastError?: string,
): ReportSessionData {
  return {
    orderId,
    status,
    customerName: order.customerName,
    selection,
    areaSqm,
    centroid,
    runoffCoefficient: RUNOFF_COEFFICIENT,
    ...values,
    steps,
    ...(lastError ? { lastError } : {}),
  };
}

export async function generateReport(
  orderId: string,
  locale: ReportLocale = "en",
  allowUnpaid = false,
): Promise<ReportSessionData> {
  await connectDB();
  const [report, order] = await Promise.all([
    ReportSession.findOne({ orderId }),
    getBillingOrder(orderId),
  ]);
  if (!report) throw new Error("Report session was not found.");
  if (
    !order ||
    (allowUnpaid
      ? order.status !== "created"
      : order.status !== "paid" || order.paymentId !== report.paymentId)
  ) {
    throw new Error("A verified, paid order is required for this report.");
  }

  const selection = order.rooftopSelection ?? report.selection;
  if (!selection || selection.points.length < 4) {
    throw new Error("The paid order has no valid rooftop selection.");
  }
  const areaSqm =
    report.areaSqm ?? getPolygonAreaSquareMeters(selection.points);
  const centroid = report.centroid ?? getPolygonCentroid(selection.points);
  const persistDetails = report.analyticsConsent === true;
  const steps: ReportSessionData["steps"] = persistDetails
    ? { ...report.steps }
    : {
        location: "pending",
        rainfall: "pending",
        analysis: "pending",
        forecast: "pending",
      };
  const failures: string[] = [];

  let mapSnapshotType = persistDetails ? report.mapSnapshotType : undefined;
  try {
    mapSnapshotType = await getMapSnapshotType();
    if (persistDetails) {
      await ReportSession.updateOne(
        { orderId, analyticsConsent: true },
        { $set: { mapSnapshotType } },
      );
    }
  } catch (error) {
    failures.push(`Map settings: ${getErrorMessage(error)}`);
  }

  let location = persistDetails ? report.location : undefined;
  if (!persistDetails || steps.location !== "complete") {
    try {
      location = await reverseGeocode(centroid);
      steps.location = "complete";
      await updateStep(orderId, "location", location, persistDetails);
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Location: ${message}`);
      console.error(`Report location lookup failed for ${orderId}:`, error);
      steps.location = "failed";
      await setStepFailed(orderId, "location");
    }
  }

  let annualRainfallMm = persistDetails ? report.annualRainfallMm : undefined;
  let potentialLitres = persistDetails ? report.potentialLitres : undefined;
  if (!persistDetails || steps.rainfall !== "complete") {
    try {
      annualRainfallMm = await getAverageAnnualRainfall(centroid);
      potentialLitres = areaSqm * annualRainfallMm * RUNOFF_COEFFICIENT;
      steps.rainfall = "complete";
      await ReportSession.updateOne(
        { orderId },
        { $set: { "steps.rainfall": "complete" } },
      );
      if (persistDetails) {
        await ReportSession.updateOne(
          { orderId, analyticsConsent: true },
          {
            $set: {
              annualRainfallMm,
              potentialLitres,
              runoffCoefficient: RUNOFF_COEFFICIENT,
            },
          },
        );
      }
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Rainfall: ${message}`);
      console.error(`Report rainfall lookup failed for ${orderId}:`, error);
      steps.rainfall = "failed";
      await setStepFailed(orderId, "rainfall");
    }
  }

  const savedAnalysisLocale = report.analysisLocale ?? "en";
  let analysis =
    persistDetails && savedAnalysisLocale === locale
      ? report.analysis
      : undefined;
  let waterValueRupeesPerKilolitre = persistDetails
    ? report.waterValueRupeesPerKilolitre
    : undefined;
  let waterValueIsLocationBased = persistDetails
    ? report.waterValueIsLocationBased
    : undefined;
  const needsWaterValueRefresh =
    persistDetails &&
    (report.waterValueIsLocationBased === undefined ||
      report.waterValueRupeesPerKilolitre === undefined);
  const prerequisitesAvailable =
    location !== undefined &&
    annualRainfallMm !== undefined &&
    potentialLitres !== undefined;
  if (
    !persistDetails ||
    steps.analysis !== "complete" ||
    savedAnalysisLocale !== locale ||
    needsWaterValueRefresh
  ) {
    if (
      prerequisitesAvailable &&
      location &&
      annualRainfallMm !== undefined &&
      potentialLitres !== undefined
    ) {
      try {
        const analysisResult = await generateAnalysisWithRetries(
          orderId,
          location,
          areaSqm,
          annualRainfallMm,
          potentialLitres,
          persistDetails,
          locale,
        );
        analysis = analysisResult.analysis;
        waterValueIsLocationBased =
          analysisResult.waterValueRupeesPerKilolitre !== undefined;
        waterValueRupeesPerKilolitre =
          analysisResult.waterValueRupeesPerKilolitre ??
          REPORT_IMPACT_ASSUMPTIONS.waterValueRupeesPerKilolitre;
        steps.analysis = "complete";
        await updateStep(
          orderId,
          "analysis",
          analysis,
          persistDetails,
          locale,
          waterValueRupeesPerKilolitre,
          waterValueIsLocationBased,
        );
      } catch (error) {
        const message = getErrorMessage(error);
        failures.push(`Hydrogeology analysis: ${message}`);
        console.error(`Report analysis failed for ${orderId}:`, error);
        steps.analysis = "failed";
        await ReportSession.updateOne(
          { orderId },
          {
            $set: {
              "steps.analysis": "failed",
              status: "generating",
            },
          },
        );
      }
    } else {
      failures.push(
        "Hydrogeology analysis requires a resolved location and annual rainfall.",
      );
      steps.analysis = "failed";
      await setStepFailed(orderId, "analysis");
    }
  }

  let forecast = persistDetails ? report.forecast : undefined;
  if (!persistDetails || steps.forecast !== "complete") {
    try {
      forecast = await getFiveMonthForecast(
        centroid,
        areaSqm,
        RUNOFF_COEFFICIENT,
      );
      steps.forecast = "complete";
      await updateStep(orderId, "forecast", forecast, persistDetails);
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Seasonal forecast: ${message}`);
      console.error(`Report forecast failed for ${orderId}:`, error);
      steps.forecast = "failed";
      await setStepFailed(orderId, "forecast");
    }
  }

  const ready =
    steps.location === "complete" &&
    steps.rainfall === "complete" &&
    steps.analysis === "complete" &&
    steps.forecast === "complete" &&
    Boolean(mapSnapshotType);
  const lastError = ready
    ? ""
    : failures.length > 0
      ? failures.join(" ")
      : "Some report sections are not available yet.";

  await ReportSession.updateOne(
    { orderId },
    {
      $set: {
        status: ready ? "ready" : "failed",
        lastError,
      },
    },
  );

  const finalSession = await ReportSession.findOne({ orderId });
  if (!finalSession) throw new Error("Report session was not found.");
  if (
    persistDetails &&
    !finalSession.analyticsConsent &&
    location &&
    annualRainfallMm !== undefined &&
    potentialLitres !== undefined
  ) {
    await deleteHydrogeologyAnalysisCache(
      location,
      areaSqm,
      annualRainfallMm,
      potentialLitres,
    );
  }

  return buildReportData(
    orderId,
    ready ? "ready" : "failed",
    order,
    selection,
    areaSqm,
    centroid,
    steps,
    {
      ...(annualRainfallMm === undefined ? {} : { annualRainfallMm }),
      ...(potentialLitres === undefined ? {} : { potentialLitres }),
      ...(location ? { location } : {}),
      ...(analysis ? { analysis } : {}),
      ...(analysis ? { analysisLocale: locale } : {}),
      ...(waterValueRupeesPerKilolitre === undefined
        ? {}
        : { waterValueRupeesPerKilolitre }),
      ...(waterValueIsLocationBased === undefined
        ? {}
        : { waterValueIsLocationBased }),
      ...(forecast ? { forecast } : {}),
      ...(mapSnapshotType ? { mapSnapshotType } : {}),
    },
    lastError,
  );
}
