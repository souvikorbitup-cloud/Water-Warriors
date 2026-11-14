import { after, NextResponse } from "next/server";
import ReportSession from "@/lib/models/ReportSession.model";
import { getCurrentAuthorizedReportContext } from "@/lib/report/current-session";
import {
  claimReportGeneration,
  getReportSession,
  toReportSessionData,
} from "@/lib/report/report-session-service";
import { generateReport } from "@/lib/report/generation-service";
import { REPORT_SESSION_REFERENCE_HEADER } from "@/lib/data/report-session";

export async function POST(request: Request) {
  const context = await getCurrentAuthorizedReportContext(
    request.headers.get(REPORT_SESSION_REFERENCE_HEADER) ?? "",
  );
  if (!context) {
    return NextResponse.json(
      { message: "No paid report session was found." },
      { status: 404 },
    );
  }

  const { orderId, order, session } = context;
  const claimed = await claimReportGeneration(orderId);
  if (claimed && !session.analyticsConsent) {
    try {
      const report = await generateReport(orderId);
      return NextResponse.json(report, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      console.error(`Could not generate report for ${orderId}:`, error);
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
        { message: "Could not generate the report." },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (claimed) {
    after(async () => {
      try {
        await generateReport(orderId);
      } catch (error) {
        console.error(
          `Could not finish report generation for ${orderId}:`,
          error,
        );
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
      }
    });
  }

  const current = await getReportSession(orderId);
  if (!current) {
    return NextResponse.json(
      { message: "Report session was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    toReportSessionData(
      current,
      order,
      current.analyticsConsent && session.analyticsConsent,
    ),
    {
      status: claimed ? 202 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
