"use client";

import { useTranslations } from "next-intl";
import { Download, Lightbulb } from "lucide-react";
import PrimaryButton from "../../shared/button/PrimaryButton";
import type { PdfQuality } from "@/components/pdf/report/pdf.types";

export interface ForecastRow {
  month: string;
  rainfall: string;
  potential: string;
  /** Highlighted (summary) row */
  highlight?: boolean;
}

interface ForecastProjectionSectionProps {
  title?: string;
  period?: string;
  rows?: ForecastRow[];
  tip?: string;
  forecastNote?: string;
  forecastSource?: string;
  disclaimer?: string;
  ctaTitle?: string;
  ctaText?: string;
  downloadLabel?: string;
  highQualityLabel?: string;
  onDownload?: () => void;
  onHighQualityDownload?: () => void;
  downloadDisabled?: boolean;
  highQualityDisabled?: boolean;
  downloadingQuality?: PdfQuality | null;
}

export default function ForecastProjectionSection({
  title,
  period,
  rows,
  tip,
  forecastNote,
  forecastSource,
  disclaimer,
  ctaTitle,
  ctaText,
  downloadLabel,
  highQualityLabel,
  onDownload,
  onHighQualityDownload,
  downloadDisabled = false,
  highQualityDisabled = false,
  downloadingQuality = null,
}: ForecastProjectionSectionProps) {
  const t = useTranslations("Report");
  const resolvedTitle = title ?? t("forecastTitle");
  const resolvedPeriod = period ?? t("forecastPeriodPending");
  const resolvedTip = tip ?? t("tip");
  const resolvedForecastNote = forecastNote ?? t("forecastNote");
  const resolvedForecastSource = forecastSource ?? t("forecastSource");
  const resolvedDisclaimer = disclaimer ?? t("disclaimer");
  const resolvedCtaTitle = ctaTitle ?? t("ctaTitle");
  const resolvedCtaText = ctaText ?? t("ctaText");
  const resolvedDownloadLabel = downloadLabel ?? t("downloadPdf");
  const resolvedHighQualityLabel =
    highQualityLabel ?? t("downloadHighQualityPdf");
  const resolvedRows = rows ?? [];

  return (
    <section className="container-y-pad overflow-hidden bg-linear-to-b from-secondary/40 to-background to-30%">
      <div className="my-container-x">
        {/* Heading */}
        <div className="mx-auto flex flex-col items-center text-center">
          <h2 className="max-w-3xl text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
            {resolvedTitle}
          </h2>
          <p className="mt-5 rounded-full border border-border bg-background px-6 py-2.5 text-base text-paragraph sm:mt-6 sm:py-3 sm:text-lg lg:px-7 lg:py-2 lg:text-base">
            {resolvedPeriod}
          </p>
        </div>

        {/* Forecast table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-paragraph/60 sm:mt-10 sm:rounded-3xl lg:mt-12">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-primary text-heading">
                <th className="w-[28%] px-3 py-3 text-xs leading-tight font-semibold sm:w-[25%] sm:px-8 sm:py-4 sm:text-lg lg:text-xl">
                  {t("month")}
                </th>
                <th className="w-[32%] px-3 py-3 text-xs leading-tight font-semibold sm:w-[35%] sm:px-8 sm:py-4 sm:text-lg lg:text-xl">
                  {t("forecastedRainfall")}
                </th>
                <th className="px-3 py-3 text-xs leading-tight font-semibold sm:px-8 sm:py-4 sm:text-lg lg:text-xl">
                  {t("harvestingPotential")}
                </th>
              </tr>
            </thead>
            <tbody>
              {resolvedRows.length > 0 ? (
                resolvedRows.map(
                  ({ month, rainfall, potential, highlight }, i) => (
                    <tr
                      key={`${month}-${i}`}
                      className={
                        highlight
                          ? "bg-secondary font-semibold text-heading"
                          : i % 2 === 1
                            ? "bg-foreground/5 text-paragraph"
                            : "bg-background text-paragraph"
                      }
                    >
                      <td
                        className={`border-r border-paragraph/60 px-3 py-2.5 text-xs sm:px-8 sm:py-4 sm:text-base lg:text-lg ${highlight ? "" : "font-medium"}`}
                      >
                        {month}
                      </td>
                      <td className="border-r border-paragraph/60 px-3 py-2.5 text-xs sm:px-8 sm:py-4 sm:text-base lg:text-lg">
                        {rainfall}
                      </td>
                      <td className="px-3 py-2.5 text-xs sm:px-8 sm:py-4 sm:text-base lg:text-lg">
                        {potential}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="bg-background px-3 py-5 text-center text-sm text-paragraph sm:px-8 sm:py-7"
                  >
                    {t("forecastPending")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tip banner */}
        {/* <div className="mt-8 flex items-center gap-6 rounded-3xl bg-primary px-6 py-8 sm:mt-10 sm:gap-10 sm:rounded-4xl sm:px-10 sm:py-7 lg:gap-12 lg:px-12 lg:py-6">
          <Lightbulb
            aria-hidden
            className="size-9 shrink-0 fill-heading text-heading sm:size-11 lg:size-12"
            strokeWidth={1.5}
          />
          <p className="text-base leading-normal text-heading sm:text-lg lg:text-base">
            {resolvedTip}
          </p>
        </div> */}

        {/* Notes */}
        <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-5 lg:mt-8 lg:space-y-4">
          <div className="rounded-3xl border border-border bg-background p-6 text-sm leading-relaxed sm:px-8 sm:py-6 sm:text-base lg:rounded-2xl lg:py-5 lg:text-[15px]">
            <p>{resolvedForecastNote}</p>
            <p className="mt-2 font-semibold lg:mt-3">
              {resolvedForecastSource}
            </p>
          </div>
          <p className="rounded-3xl border border-border bg-background p-6 text-sm leading-relaxed sm:px-8 sm:py-6 sm:text-base lg:rounded-2xl lg:py-5 lg:text-[15px]">
            {resolvedDisclaimer}
          </p>
        </div>

        {/* CTA banner */}
        <div className="relative isolate mt-10 flex min-h-52 flex-col justify-start overflow-hidden rounded-[20px] p-5 sm:mt-14 sm:min-h-64 sm:p-8 lg:mt-20 lg:min-h-87.5 lg:justify-center lg:px-14 lg:py-10">
          {/* Background image */}
          <div
            className="absolute inset-0 -z-20 bg-[url('/section-images/rain-collect-process-mobile.png')] bg-cover bg-right bg-no-repeat md:bg-[url('/section-images/rain-collect-process-desktop.png')]"
            aria-hidden="true"
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 -z-10 bg-linear-to-r from-black/80 via-black/50 to-transparent"
            aria-hidden="true"
          />

          {/* Content */}
          <h3 className="max-w-[75%] text-xl leading-tight font-semibold text-white sm:max-w-md sm:text-3xl lg:max-w-2xl lg:text-[40px] lg:leading-[1.2]">
            {resolvedCtaTitle}
          </h3>

          <p className="mt-3 max-w-[62%] text-sm leading-normal text-white sm:mt-4 sm:max-w-md sm:text-base lg:mt-5 lg:max-w-140">
            {resolvedCtaText}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 print:hidden sm:mt-10">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <PrimaryButton
              btnType="solid-primary"
              onClick={onHighQualityDownload}
              disabled={highQualityDisabled}
              endIcon={<Download className="size-4.5" strokeWidth={1.5} />}
            >
              {downloadingQuality === "high"
                ? t("preparingPdf")
                : resolvedDownloadLabel}
            </PrimaryButton>
            {/* <PrimaryButton
              btnType="outline"
              onClick={onHighQualityDownload}
              disabled={highQualityDisabled}
              endIcon={<Download className="size-4.5" strokeWidth={1.5} />}
            >
              {downloadingQuality === "high"
                ? t("preparingPdf")
                : resolvedHighQualityLabel}
            </PrimaryButton> */}
          </div>
        </div>
      </div>
    </section>
  );
}
