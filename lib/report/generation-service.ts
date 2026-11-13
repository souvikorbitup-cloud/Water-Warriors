import "server-only";

import { connectDB } from "@/lib/db";
import ReportSession from "@/lib/models/ReportSession.model";
import { RUNOFF_COEFFICIENT } from "@/lib/report/constants";
import {
  getAverageAnnualRainfall,
  getFiveMonthForecast,
  getHydrogeologyAnalysis,
  getMapSnapshotType,
  GeminiGenerationError,
  reverseGeocode,
} from "@/lib/report/providers";
import type { ReportLocation } from "@/lib/report/types";

const RETRY_DELAYS_MS = [10_000, 30_000];

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
  step: "location" | "rainfall" | "analysis" | "forecast",
  value: unknown,
): Promise<void> {
  await ReportSession.updateOne(
    { orderId },
    { $set: { [`steps.${step}`]: "complete", [step]: value } },
  );
}

async function generateAnalysisWithRetries(
  orderId: string,
  location: ReportLocation,
  areaSqm: number,
  rainfallMm: number,
  potentialLitres: number,
): Promise<string[]> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await getHydrogeologyAnalysis(
        location,
        areaSqm,
        rainfallMm,
        potentialLitres,
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

export async function generateReport(orderId: string): Promise<void> {
  await connectDB();
  const report = await ReportSession.findOne({ orderId });
  if (!report) throw new Error("Report session was not found.");

  const failures: string[] = [];

  try {
    const mapSnapshotType = await getMapSnapshotType();
    await ReportSession.updateOne({ orderId }, { $set: { mapSnapshotType } });
  } catch (error) {
    failures.push(`Map settings: ${getErrorMessage(error)}`);
  }

  let location = report.location;
  if (report.steps.location !== "complete") {
    try {
      location = await reverseGeocode(report.centroid);
      await updateStep(orderId, "location", location);
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Location: ${message}`);
      console.error(`Report location lookup failed for ${orderId}:`, error);
      await ReportSession.updateOne(
        { orderId },
        { $set: { "steps.location": "failed" } },
      );
    }
  }

  let rainfallMm = report.annualRainfallMm;
  let potentialLitres = report.potentialLitres;
  if (report.steps.rainfall !== "complete") {
    try {
      rainfallMm = await getAverageAnnualRainfall(report.centroid);
      potentialLitres = report.areaSqm * rainfallMm * RUNOFF_COEFFICIENT;
      await ReportSession.updateOne(
        { orderId },
        {
          $set: {
            annualRainfallMm: rainfallMm,
            potentialLitres,
            runoffCoefficient: RUNOFF_COEFFICIENT,
            "steps.rainfall": "complete",
          },
        },
      );
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Rainfall: ${message}`);
      console.error(`Report rainfall lookup failed for ${orderId}:`, error);
      await ReportSession.updateOne(
        { orderId },
        { $set: { "steps.rainfall": "failed" } },
      );
    }
  }

  const prerequisitesAvailable =
    location !== undefined &&
    rainfallMm !== undefined &&
    potentialLitres !== undefined;
  if (report.steps.analysis !== "complete") {
    if (
      prerequisitesAvailable &&
      location &&
      rainfallMm !== undefined &&
      potentialLitres !== undefined
    ) {
      try {
        const analysis = await generateAnalysisWithRetries(
          orderId,
          location,
          report.areaSqm,
          rainfallMm,
          potentialLitres,
        );
        await updateStep(orderId, "analysis", analysis);
      } catch (error) {
        const message = getErrorMessage(error);
        failures.push(`Hydrogeology analysis: ${message}`);
        console.error(`Report analysis failed for ${orderId}:`, error);
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
      await ReportSession.updateOne(
        { orderId },
        { $set: { "steps.analysis": "failed" } },
      );
    }
  }

  if (report.steps.forecast !== "complete") {
    try {
      const forecast = await getFiveMonthForecast(
        report.centroid,
        report.areaSqm,
        RUNOFF_COEFFICIENT,
      );
      await updateStep(orderId, "forecast", forecast);
    } catch (error) {
      const message = getErrorMessage(error);
      failures.push(`Seasonal forecast: ${message}`);
      console.error(`Report forecast failed for ${orderId}:`, error);
      await ReportSession.updateOne(
        { orderId },
        { $set: { "steps.forecast": "failed" } },
      );
    }
  }

  const finalReport = await ReportSession.findOne({ orderId });
  if (!finalReport) throw new Error("Report session was not found.");

  const ready =
    finalReport.steps.location === "complete" &&
    finalReport.steps.rainfall === "complete" &&
    finalReport.steps.analysis === "complete" &&
    finalReport.steps.forecast === "complete" &&
    Boolean(finalReport.mapSnapshotType);
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
}
