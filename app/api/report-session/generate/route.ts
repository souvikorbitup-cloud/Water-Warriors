import { after, NextResponse } from "next/server";
import ReportSession from "@/lib/models/ReportSession.model";
import { getCurrentAuthorizedReport } from "@/lib/report/current-session";
import {
  claimReportGeneration,
  getReportSession,
  toReportSessionData,
} from "@/lib/report/report-session-service";
import { generateReport } from "@/lib/report/generation-service";

export async function POST() {
  const report = await getCurrentAuthorizedReport();
  if (!report) {
    return NextResponse.json(
      { message: "No paid report session was found." },
      { status: 404 },
    );
  }

  const claimed = await claimReportGeneration(report.orderId);
  if (claimed) {
    after(async () => {
      try {
        await generateReport(report.orderId);
      } catch (error) {
        console.error(
          `Could not finish report generation for ${report.orderId}:`,
          error,
        );
        await ReportSession.updateOne(
          { orderId: report.orderId },
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

  const current = await getReportSession(report.orderId);
  if (!current) {
    return NextResponse.json(
      { message: "Report session was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(toReportSessionData(current), {
    status: claimed ? 202 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
