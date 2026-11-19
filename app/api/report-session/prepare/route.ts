import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingOrder } from "@/lib/billing/billing-service";
import ReportSession from "@/lib/models/ReportSession.model";
import {
  getOrderIdFromReportCookie,
  REPORT_ACCESS_COOKIE,
} from "@/lib/report/access";
import {
  reportLocaleSchema,
  reportSessionResponseSchema,
} from "@/lib/report/schemas";
import { generateReport } from "@/lib/report/generation-service";
import {
  claimReportGeneration,
  createCheckoutReportSession,
} from "@/lib/report/report-session-service";

const requestBodySchema = z.object({
  locale: reportLocaleSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid report preparation request." },
      { status: 400 },
    );
  }

  const parsedBody = requestBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Invalid report preparation request." },
      { status: 400 },
    );
  }

  const orderId = getOrderIdFromReportCookie(
    (await cookies()).get(REPORT_ACCESS_COOKIE)?.value,
  );
  if (!orderId) {
    return NextResponse.json(
      { message: "Checkout report access could not be verified." },
      { status: 403 },
    );
  }

  try {
    const order = await getBillingOrder(orderId);
    if (!order || order.status !== "created") {
      return NextResponse.json(
        { message: "A valid unpaid checkout order is required." },
        { status: 409 },
      );
    }

    await createCheckoutReportSession(order);
    if (!(await claimReportGeneration(orderId, parsedBody.data.locale))) {
      return NextResponse.json(
        {
          message:
            "Report generation is already in progress. Please retry shortly.",
        },
        { status: 409 },
      );
    }

    const report = await generateReport(orderId, parsedBody.data.locale, true);
    const parsedReport = reportSessionResponseSchema.safeParse(report);
    if (
      !parsedReport.success ||
      report.status !== "ready" ||
      report.analysisLocale !== parsedBody.data.locale ||
      (report.analysis?.length ?? 0) < 3 ||
      report.forecast?.length !== 5 ||
      report.steps.location !== "complete" ||
      report.steps.rainfall !== "complete" ||
      report.steps.analysis !== "complete" ||
      report.steps.forecast !== "complete" ||
      report.annualRainfallMm === undefined ||
      report.potentialLitres === undefined ||
      !report.location ||
      !report.mapSnapshotType
    ) {
      return NextResponse.json(
        {
          message: "Could not generate the complete report. Please try again.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(`Could not prepare report for checkout ${orderId}:`, error);
    await ReportSession.updateOne(
      { orderId },
      {
        $set: {
          status: "failed",
          lastError:
            error instanceof Error
              ? error.message
              : "Report generation failed.",
        },
      },
    );
    return NextResponse.json(
      { message: "Could not generate the complete report. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
