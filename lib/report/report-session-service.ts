import "server-only";

import type { MongoServerError } from "mongodb";
import { connectDB } from "@/lib/db";
import ReportSession, {
  type IReportSession,
} from "@/lib/models/ReportSession.model";
import {
  getBillingOrder,
  saveBillingOrderRooftopSelection,
  type BillingOrderDocument,
} from "@/lib/billing/billing-service";
import {
  getPolygonAreaSquareMeters,
  getPolygonCentroid,
} from "@/lib/report/geometry";
import { RUNOFF_COEFFICIENT } from "@/lib/report/constants";
import { deleteHydrogeologyAnalysisCache } from "@/lib/report/providers";
import type { ReportLocale, ReportSessionData } from "@/lib/report/types";

function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export function toReportSessionData(
  document: IReportSession,
  order: BillingOrderDocument,
  includeDetails = true,
): ReportSessionData {
  const selection = order.rooftopSelection ?? document.selection;
  if (!selection) {
    throw new Error("The paid order has no rooftop selection.");
  }
  const shouldIncludeDetails = includeDetails && document.analyticsConsent;
  const {
    orderId,
    status,
    runoffCoefficient,
    annualRainfallMm,
    potentialLitres,
    location,
    analysis,
    analysisLocale,
    forecast,
    mapSnapshotType,
    steps,
    lastError,
  } = document;

  return {
    orderId,
    status,
    customerName: order.customerName || document.customerName || "",
    selection,
    areaSqm: document.areaSqm ?? getPolygonAreaSquareMeters(selection.points),
    centroid: document.centroid ?? getPolygonCentroid(selection.points),
    runoffCoefficient: runoffCoefficient ?? RUNOFF_COEFFICIENT,
    ...(shouldIncludeDetails && annualRainfallMm !== undefined
      ? { annualRainfallMm }
      : {}),
    ...(shouldIncludeDetails && potentialLitres !== undefined
      ? { potentialLitres }
      : {}),
    ...(shouldIncludeDetails && location ? { location } : {}),
    ...(shouldIncludeDetails && analysis?.length ? { analysis } : {}),
    ...(shouldIncludeDetails && analysis?.length
      ? { analysisLocale: analysisLocale ?? "en" }
      : {}),
    ...(shouldIncludeDetails && forecast?.length ? { forecast } : {}),
    ...(shouldIncludeDetails && mapSnapshotType ? { mapSnapshotType } : {}),
    steps,
    ...(lastError ? { lastError } : {}),
  };
}

async function findOrCreateReportSession(
  order: BillingOrderDocument,
): Promise<IReportSession> {
  if (!order.rooftopSelection || order.rooftopSelection.points.length < 4) {
    throw new Error("The order has no valid rooftop selection.");
  }

  await connectDB();
  await ReportSession.init();
  const sessionFields = {
    orderId: order.orderId,
    ...(order.paymentId ? { paymentId: order.paymentId } : {}),
    analyticsConsent: false,
    status: "pending" as const,
    steps: {
      location: "pending" as const,
      rainfall: "pending" as const,
      analysis: "pending" as const,
      forecast: "pending" as const,
    },
  };

  try {
    const report = await ReportSession.findOneAndUpdate(
      { orderId: order.orderId },
      { $setOnInsert: sessionFields },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!report) throw new Error("Could not create the report session.");
    return report;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await ReportSession.findOne({ orderId: order.orderId });
    if (!existing) throw error;
    return existing;
  }
}

export async function createOrGetReportSession(
  order: BillingOrderDocument,
): Promise<IReportSession> {
  if (order.status !== "paid" || !order.paymentId) {
    throw new Error("A paid order is required to create a report session.");
  }
  return findOrCreateReportSession(order);
}

export async function createCheckoutReportSession(
  order: BillingOrderDocument,
): Promise<IReportSession> {
  if (order.status !== "created") {
    throw new Error("An unpaid checkout order is required.");
  }
  return findOrCreateReportSession(order);
}

export async function setReportSessionConsent(
  orderId: string,
  accepted: boolean,
): Promise<IReportSession> {
  const order = await getBillingOrder(orderId);
  const existing = await getReportSession(orderId);
  const selection = order?.rooftopSelection ?? existing?.selection;
  if (!order || !selection) {
    throw new Error("The paid order has no rooftop selection.");
  }

  if (!existing) throw new Error("Report session was not found.");
  if (!order.rooftopSelection) {
    await saveBillingOrderRooftopSelection(orderId, selection);
  }

  const analysisCache =
    !accepted &&
    existing.location &&
    existing.areaSqm !== undefined &&
    existing.annualRainfallMm !== undefined &&
    existing.potentialLitres !== undefined
      ? {
          location: existing.location,
          areaSqm: existing.areaSqm,
          annualRainfallMm: existing.annualRainfallMm,
          potentialLitres: existing.potentialLitres,
        }
      : null;

  const reportHasDetails = Boolean(
    existing.annualRainfallMm !== undefined ||
    existing.potentialLitres !== undefined ||
    Boolean(existing.customerName) ||
    existing.selection !== undefined ||
    existing.areaSqm !== undefined ||
    existing.centroid !== undefined ||
    existing.runoffCoefficient !== undefined ||
    existing.location ||
    existing.analysis?.length ||
    existing.forecast?.length ||
    existing.mapSnapshotType,
  );
  const reportHasCompleteDetails = Boolean(
    existing.annualRainfallMm !== undefined &&
    existing.potentialLitres !== undefined &&
    existing.location &&
    (existing.analysis?.length ?? 0) >= 3 &&
    existing.forecast?.length === 5 &&
    existing.mapSnapshotType,
  );
  const generationInProgress =
    existing.status === "generating" || existing.status === "retrying";
  const consentChanged = existing.analyticsConsent !== accepted;
  if (
    !consentChanged &&
    ((accepted && (reportHasCompleteDetails || existing.status !== "ready")) ||
      (!accepted && !reportHasDetails))
  ) {
    return existing;
  }
  const shouldResetGeneration =
    accepted && !reportHasCompleteDetails && !generationInProgress;

  const report = accepted
    ? await ReportSession.findOneAndUpdate(
        { orderId },
        {
          $set: {
            analyticsConsent: true,
            customerName: order.customerName,
            selection,
            areaSqm: getPolygonAreaSquareMeters(selection.points),
            centroid: getPolygonCentroid(selection.points),
            runoffCoefficient: RUNOFF_COEFFICIENT,
            ...(shouldResetGeneration
              ? {
                  status: "pending",
                  steps: {
                    location: "pending",
                    rainfall: "pending",
                    analysis: "pending",
                    forecast: "pending",
                  },
                }
              : {}),
          },
          ...(shouldResetGeneration
            ? {
                $unset: {
                  annualRainfallMm: "",
                  potentialLitres: "",
                  location: "",
                  analysis: "",
                  analysisLocale: "",
                  forecast: "",
                  mapSnapshotType: "",
                },
              }
            : {}),
        },
        { new: true },
      )
    : await ReportSession.findOneAndUpdate(
        { orderId },
        {
          $set: {
            analyticsConsent: false,
            status: generationInProgress ? existing.status : "pending",
            ...(!generationInProgress
              ? {
                  steps: {
                    location: "pending",
                    rainfall: "pending",
                    analysis: "pending",
                    forecast: "pending",
                  },
                }
              : {}),
          },
          $unset: {
            customerName: "",
            selection: "",
            areaSqm: "",
            centroid: "",
            runoffCoefficient: "",
            annualRainfallMm: "",
            potentialLitres: "",
            location: "",
            analysis: "",
            analysisLocale: "",
            forecast: "",
            mapSnapshotType: "",
            ...(!generationInProgress ? { generationStartedAt: "" } : {}),
            lastError: "",
          },
        },
        { new: true },
      );

  if (!report) throw new Error("Could not update report-session consent.");
  if (analysisCache) {
    await deleteHydrogeologyAnalysisCache(
      analysisCache.location,
      analysisCache.areaSqm,
      analysisCache.annualRainfallMm,
      analysisCache.potentialLitres,
    );
  }
  return report;
}

export async function ensurePaidReportSession(
  orderId: string,
  paymentId: string,
): Promise<IReportSession> {
  const order = await getBillingOrder(orderId);
  if (!order || order.status !== "paid" || order.paymentId !== paymentId) {
    throw new Error("A verified, paid order is required for this report.");
  }
  const session = await createOrGetReportSession(order);
  if (session.paymentId && session.paymentId !== paymentId) {
    throw new Error(
      "Report session payment does not match the verified order.",
    );
  }
  if (session.paymentId === paymentId) return session;

  await ReportSession.updateOne(
    {
      orderId,
      $or: [
        { paymentId: { $exists: false } },
        { paymentId: null },
        { paymentId: "" },
      ],
    },
    { $set: { paymentId } },
  );
  const updated = await getReportSession(orderId);
  if (!updated || updated.paymentId !== paymentId) {
    throw new Error(
      "Report session payment does not match the verified order.",
    );
  }
  return updated;
}

export async function getReportSession(
  orderId: string,
): Promise<IReportSession | null> {
  await connectDB();
  return ReportSession.findOne({ orderId });
}

export async function claimReportGeneration(
  orderId: string,
  locale: ReportLocale = "en",
): Promise<boolean> {
  await connectDB();
  const staleBefore = new Date(Date.now() - 3 * 60 * 1000);
  const claimed = await ReportSession.findOneAndUpdate(
    {
      orderId,
      $or: [
        { status: "pending" },
        { status: "failed" },
        { status: "ready", analyticsConsent: false },
        {
          status: "ready",
          analyticsConsent: true,
          $or: [
            { forecast: { $exists: false } },
            { forecast: { $size: 0 } },
            { analysis: { $exists: false } },
            { analysis: { $size: 0 } },
            { analysisLocale: { $ne: locale } },
            { location: { $exists: false } },
            { annualRainfallMm: { $exists: false } },
            { potentialLitres: { $exists: false } },
            { mapSnapshotType: { $exists: false } },
          ],
        },
        {
          status: { $in: ["generating", "retrying"] },
          generationStartedAt: { $lt: staleBefore },
        },
      ],
    },
    {
      $set: {
        status: "generating",
        generationStartedAt: new Date(),
        lastError: "",
      },
    },
    { new: true },
  );
  return claimed !== null;
}
