import { after, NextResponse } from "next/server";
import { z } from "zod";
import ReportSession from "@/lib/models/ReportSession.model";
import { getCurrentAuthorizedReportContext } from "@/lib/report/current-session";
import {
  claimReportGeneration,
  getReportSession,
  toReportSessionData,
} from "@/lib/report/report-session-service";
import { generateReport } from "@/lib/report/generation-service";
import { REPORT_SESSION_REFERENCE_HEADER } from "@/lib/data/report-session";
import { reportLocaleSchema } from "@/lib/report/schemas";
import type { ReportLocale } from "@/lib/report/types";

const requestBodySchema = z.object({
  locale: reportLocaleSchema.default("en"),
});

export async function POST(request: Request) {
  let requestBody: unknown = {};
  const requestText = await request.text();
  if (requestText.trim()) {
    try {
      requestBody = JSON.parse(requestText);
    } catch {
      return NextResponse.json(
        { message: "Invalid report generation request." },
        { status: 400 },
      );
    }
  }
  const parsedBody = requestBodySchema.safeParse(requestBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Invalid report generation request." },
      { status: 400 },
    );
  }
  const locale: ReportLocale = parsedBody.data.locale;

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
  const claimed = await claimReportGeneration(orderId, locale);
  if (claimed && !session.analyticsConsent) {
    try {
      const report = await generateReport(orderId, locale);
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
        await generateReport(orderId, locale);
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
