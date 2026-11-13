import "server-only";

import type { MongoServerError } from "mongodb";
import { connectDB } from "@/lib/db";
import ReportSession, {
  type IReportSession,
} from "@/lib/models/ReportSession.model";
import {
  clearBillingOrderRooftopSelection,
  getBillingOrder,
  type BillingOrderDocument,
} from "@/lib/billing/billing-service";
import {
  getPolygonAreaSquareMeters,
  getPolygonCentroid,
} from "@/lib/report/geometry";
import { RUNOFF_COEFFICIENT } from "@/lib/report/constants";
import type { ReportSessionData } from "@/lib/report/types";

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
): ReportSessionData {
  const {
    orderId,
    status,
    customerName,
    selection,
    areaSqm,
    centroid,
    runoffCoefficient,
    annualRainfallMm,
    potentialLitres,
    location,
    analysis,
    forecast,
    mapSnapshotType,
    steps,
    lastError,
  } = document;

  return {
    orderId,
    status,
    customerName,
    selection,
    areaSqm,
    centroid,
    runoffCoefficient,
    ...(annualRainfallMm === undefined ? {} : { annualRainfallMm }),
    ...(potentialLitres === undefined ? {} : { potentialLitres }),
    ...(location ? { location } : {}),
    ...(analysis ? { analysis } : {}),
    ...(forecast ? { forecast } : {}),
    ...(mapSnapshotType ? { mapSnapshotType } : {}),
    steps,
    ...(lastError ? { lastError } : {}),
  };
}

export async function createOrGetReportSession(
  order: BillingOrderDocument,
): Promise<IReportSession> {
  if (order.status !== "paid" || !order.paymentId) {
    throw new Error("A paid order is required to create a report session.");
  }
  if (!order.rooftopSelection || order.rooftopSelection.points.length < 4) {
    throw new Error("The paid order has no valid rooftop selection.");
  }

  await connectDB();
  await ReportSession.init();
  const points = order.rooftopSelection.points;
  const sessionFields = {
    orderId: order.orderId,
    paymentId: order.paymentId,
    customerName: order.customerName,
    selection: order.rooftopSelection,
    areaSqm: getPolygonAreaSquareMeters(points),
    centroid: getPolygonCentroid(points),
    runoffCoefficient: RUNOFF_COEFFICIENT,
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

export async function ensurePaidReportSession(
  orderId: string,
  paymentId: string,
): Promise<IReportSession> {
  const order = await getBillingOrder(orderId);
  if (!order || order.status !== "paid" || order.paymentId !== paymentId) {
    throw new Error("A verified, paid order is required for this report.");
  }
  const session = await createOrGetReportSession(order);
  if (session.paymentId !== paymentId) {
    throw new Error(
      "Report session payment does not match the verified order.",
    );
  }
  await clearBillingOrderRooftopSelection(orderId);
  return session;
}

export async function getReportSession(
  orderId: string,
): Promise<IReportSession | null> {
  await connectDB();
  return ReportSession.findOne({ orderId });
}

export async function claimReportGeneration(orderId: string): Promise<boolean> {
  await connectDB();
  const staleBefore = new Date(Date.now() - 3 * 60 * 1000);
  const claimed = await ReportSession.findOneAndUpdate(
    {
      orderId,
      $or: [
        { status: "pending" },
        { status: "failed" },
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
