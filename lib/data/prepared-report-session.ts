import { z } from "zod";
import {
  reportSessionResponseSchema,
  rooftopSelectionSchema,
} from "@/lib/report/schemas";
import type { ReportLocale, ReportSessionData } from "@/lib/report/types";

export const PREPARED_REPORT_STORAGE_PREFIX = "ww-report-session:";
const PREPARED_REPORT_VERSION = 2;
const PREPARED_REPORT_TTL_MS = 24 * 60 * 60 * 1000;

const preparedReportSchema = z.object({
  version: z.literal(PREPARED_REPORT_VERSION),
  generatedAt: z.number().finite(),
  expiresAt: z.number().finite(),
  locale: z.enum(["en", "hi"]),
  input: z.object({
    customerName: z.string(),
    selection: rooftopSelectionSchema,
    couponCode: z.string().nullable(),
  }),
  report: reportSessionResponseSchema,
});

export type PreparedReportInput = z.infer<typeof preparedReportSchema>["input"];

function isCompleteReport(
  report: ReportSessionData,
  locale: ReportLocale,
): boolean {
  return Boolean(
    report.status === "ready" &&
    report.steps.location === "complete" &&
    report.steps.rainfall === "complete" &&
    report.steps.analysis === "complete" &&
    report.steps.forecast === "complete" &&
    report.annualRainfallMm !== undefined &&
    report.potentialLitres !== undefined &&
    report.location &&
    (report.analysis?.length ?? 0) >= 3 &&
    report.analysisLocale === locale &&
    report.forecast?.length === 5 &&
    report.mapSnapshotType,
  );
}

export function readPreparedReport(
  orderId: string,
  locale?: ReportLocale,
): {
  report: ReportSessionData;
  input: PreparedReportInput;
  locale: ReportLocale;
} | null {
  const key = `${PREPARED_REPORT_STORAGE_PREFIX}${orderId}`;

  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    const result = preparedReportSchema.safeParse(parsed);
    if (
      !result.success ||
      result.data.report.orderId !== orderId ||
      result.data.generatedAt > Date.now() ||
      result.data.expiresAt <= Date.now() ||
      result.data.expiresAt - result.data.generatedAt !==
        PREPARED_REPORT_TTL_MS ||
      (locale !== undefined && result.data.locale !== locale) ||
      !isCompleteReport(result.data.report, result.data.locale)
    ) {
      window.sessionStorage.removeItem(key);
      console.warn("Ignoring invalid or expired prepared report data.");
      return null;
    }

    return {
      report: result.data.report,
      input: result.data.input,
      locale: result.data.locale,
    };
  } catch (error) {
    console.warn(
      "Could not restore the prepared report from this session.",
      error,
    );
    try {
      window.sessionStorage.removeItem(key);
    } catch (removeError) {
      console.warn(
        "Could not clear invalid prepared report data.",
        removeError,
      );
    }
    return null;
  }
}

export function savePreparedReport(
  report: ReportSessionData,
  locale: ReportLocale,
  input: PreparedReportInput,
): void {
  if (!isCompleteReport(report, locale)) {
    throw new Error("The generated report is incomplete.");
  }

  const generatedAt = Date.now();
  const preparedReport = preparedReportSchema.parse({
    version: PREPARED_REPORT_VERSION,
    generatedAt,
    expiresAt: generatedAt + PREPARED_REPORT_TTL_MS,
    locale,
    input,
    report,
  });
  window.sessionStorage.setItem(
    `${PREPARED_REPORT_STORAGE_PREFIX}${report.orderId}`,
    JSON.stringify(preparedReport),
  );

  const stored = readPreparedReport(report.orderId, locale);
  if (!stored) {
    throw new Error(
      "Could not verify the prepared report in this browser tab.",
    );
  }
}
