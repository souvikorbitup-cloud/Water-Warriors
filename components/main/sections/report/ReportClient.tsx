"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { Children, Family, Tanker, Tree } from "@/components/icons";
import ForecastProjectionSection, {
  type ForecastRow,
} from "@/components/main/sections/report/ForecastProjectionSection";
import RainwaterPotentialSection, {
  type ImpactStat,
} from "@/components/main/sections/report/RainwaterPotentialSection";
import RechargeMattersSection from "@/components/main/sections/report/RechargeMattersSection";
import ReportCTASection from "@/components/main/sections/report/ReportCTASection";
import ReportOverviewSection from "@/components/main/sections/report/ReportOverviewSection";
import {
  createStaticMapUrl,
  type MapSnapshotType,
} from "@/lib/maps/static-map-url";
import { numberToIndianWords } from "@/lib/report/format";
import { REPORT_IMPACT_ASSUMPTIONS } from "@/lib/report/constants";
import { reportSessionResponseSchema } from "@/lib/report/schemas";
import type { ReportSessionData } from "@/lib/report/types";

const mapSnapshotTypes = new Set<MapSnapshotType>([
  "roadmap",
  "satellite",
  "terrain",
  "hybrid",
]);

function isMapSnapshotType(
  value: string | undefined,
): value is MapSnapshotType {
  return value !== undefined && mapSnapshotTypes.has(value as MapSnapshotType);
}

function numberFormat(locale: string, value: number, decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

function monthName(locale: string, monthStart: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthStart}T12:00:00.000Z`));
}

function getApiMessage(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }
  return null;
}

export default function ReportClient() {
  const t = useTranslations("Report");
  const locale = useLocale();
  const [report, setReport] = useState<ReportSessionData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [loadedMapImageUrl, setLoadedMapImageUrl] = useState<string | null>(
    null,
  );
  const [failedMapImageUrl, setFailedMapImageUrl] = useState<string | null>(
    null,
  );

  const loadReport = useCallback(async () => {
    const response = await fetch("/api/report-session", {
      cache: "no-store",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(getApiMessage(body) ?? t("reportNotFound"));
    }
    const parsed = reportSessionResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(t("reportLoadFailed"));
    }
    setReport(parsed.data);
    setLoadError(null);
    return parsed.data;
  }, [t]);

  const startGeneration = useCallback(async () => {
    const response = await fetch("/api/report-session/generate", {
      method: "POST",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(getApiMessage(body) ?? t("reportFailed"));
    }
    const parsed = reportSessionResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(t("reportLoadFailed"));
    }
    setReport(parsed.data);
    setLoadError(null);
    return parsed.data;
  }, [t]);

  useEffect(() => {
    let active = true;
    let pollTimer: number | undefined;
    const poll = async (isInitialRequest: boolean) => {
      if (!active) return;
      try {
        let nextReport = await loadReport();
        if (!active) return;
        if (
          isInitialRequest &&
          (nextReport.status === "pending" ||
            (generationAttempt > 0 && nextReport.status === "failed"))
        ) {
          setIsRetrying(true);
          nextReport = await startGeneration();
        }
        if (!active) return;
        if (
          nextReport.status === "generating" ||
          nextReport.status === "retrying"
        ) {
          pollTimer = window.setTimeout(() => {
            void poll(false);
          }, 5000);
        } else {
          setIsRetrying(false);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : t("reportLoadFailed"),
          );
          setIsRetrying(false);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void poll(true);

    return () => {
      active = false;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
    };
  }, [generationAttempt, loadReport, startGeneration, t]);

  const retryGeneration = () => {
    setIsRetrying(true);
    setLoadError(null);
    setGenerationAttempt((attempt) => attempt + 1);
  };

  const mapImageUrl = useMemo(() => {
    if (!report || !isMapSnapshotType(report.mapSnapshotType)) return null;
    try {
      return createStaticMapUrl({
        points: report.selection.points,
        zoom: report.selection.zoom,
        mapType: report.mapSnapshotType,
      });
    } catch (error) {
      console.error("Could not create the report map snapshot URL.", error);
      return null;
    }
  }, [report]);

  const formattedPotential =
    report?.potentialLitres === undefined
      ? undefined
      : numberFormat(locale, Math.round(report.potentialLitres));
  const formattedArea =
    report === null
      ? undefined
      : `${numberFormat(locale, report.areaSqm, 2)} sq. metres`;
  const formattedRainfall =
    report?.annualRainfallMm === undefined
      ? undefined
      : `${numberFormat(locale, report.annualRainfallMm, 1)} mm per year`;
  const harvestableInWords =
    locale.startsWith("en") && report?.potentialLitres !== undefined
      ? numberToIndianWords(Math.round(report.potentialLitres))
      : undefined;
  const calculation =
    report?.annualRainfallMm !== undefined &&
    report.potentialLitres !== undefined
      ? `(${numberFormat(locale, report.areaSqm, 2)} sq.m x ${numberFormat(locale, report.annualRainfallMm, 1)} mm x ${numberFormat(locale, report.runoffCoefficient)} = ${formattedPotential} ${t("litresUnit")})`
      : undefined;

  const impacts: ImpactStat[] | undefined =
    report?.potentialLitres === undefined
      ? undefined
      : [
          {
            label: t("impacts.0.label"),
            value: `${numberFormat(
              locale,
              Math.floor(
                report.potentialLitres /
                  (REPORT_IMPACT_ASSUMPTIONS.familySize *
                    REPORT_IMPACT_ASSUMPTIONS.litresPerPersonPerDay),
              ),
            )} ${t("daysUnit")}`,
            note: t("impacts.0.note"),
            Icon: Family,
          },
          {
            label: t("impacts.1.label"),
            value: `${numberFormat(
              locale,
              Math.floor(
                report.potentialLitres /
                  REPORT_IMPACT_ASSUMPTIONS.litresPerTreePerYear,
              ),
            )} ${t("treesUnit")}`,
            note: t("impacts.1.note"),
            Icon: Tree,
          },
          {
            label: t("impacts.2.label"),
            value: `${numberFormat(
              locale,
              Math.floor(
                report.potentialLitres /
                  REPORT_IMPACT_ASSUMPTIONS.tankerCapacityLitres,
              ),
            )} ${t("tripsUnit")}`,
            note: t("impacts.2.note"),
            Icon: Tanker,
          },
          {
            label: t("impacts.3.label"),
            value: `${numberFormat(
              locale,
              Math.floor(
                report.potentialLitres /
                  (REPORT_IMPACT_ASSUMPTIONS.litresPerChildPerSchoolDay *
                    REPORT_IMPACT_ASSUMPTIONS.schoolDaysPerYear),
              ),
            )} ${t("childrenUnit")}`,
            note: t("impacts.3.note"),
            Icon: Children,
          },
        ];

  const forecastRows: ForecastRow[] | undefined = report?.forecast
    ? [
        ...report.forecast.map((month) => ({
          month: monthName(locale, month.monthStart),
          rainfall: `${numberFormat(locale, month.rainfallMm, 1)} mm`,
          potential: `${numberFormat(locale, Math.round(month.harvestableLitres))} ${t("litresUnit")}`,
        })),
        {
          month: t("grandTotal"),
          rainfall: `${numberFormat(
            locale,
            report.forecast.reduce((sum, month) => sum + month.rainfallMm, 0),
            1,
          )} mm`,
          potential: `${numberFormat(
            locale,
            Math.round(
              report.forecast.reduce(
                (sum, month) => sum + month.harvestableLitres,
                0,
              ),
            ),
          )} ${t("litresUnit")}`,
          highlight: true,
        },
      ]
    : undefined;

  const forecastPeriod =
    report?.forecast && report.forecast.length > 0
      ? `(${monthName(locale, report.forecast[0]!.monthStart)} - ${monthName(
          locale,
          report.forecast[report.forecast.length - 1]!.monthStart,
        )})`
      : undefined;
  const locationName = report?.location
    ? [
        report.location.locality,
        report.location.city,
        report.location.district,
        report.location.state,
      ]
        .filter(
          (value, index, values) => value && values.indexOf(value) === index,
        )
        .join(", ")
    : undefined;
  const mapImageReady =
    mapImageUrl !== null && loadedMapImageUrl === mapImageUrl;
  const mapImageFailed =
    mapImageUrl !== null && failedMapImageUrl === mapImageUrl;
  const isReady = report?.status === "ready" && mapImageReady;
  const statusMessage = report
    ? report.status === "ready"
      ? mapImageFailed
        ? t("mapFailed")
        : mapImageReady
          ? t("reportReady")
          : t("mapPending")
      : report.status === "failed"
        ? t("reportFailed")
        : report.status === "retrying"
          ? t("reportRetrying")
          : t("reportGenerating")
    : isLoading
      ? t("reportLoading")
      : t("reportNotFound");

  const printReport = () => {
    setIsPreparingPdf(true);
    window.print();
    window.setTimeout(() => setIsPreparingPdf(false), 1000);
  };

  return (
    <>
      <div
        className="my-container-x mt-6 print:hidden"
        role={loadError ? "alert" : "status"}
        aria-live="polite"
      >
        <div className="rounded-2xl border border-border bg-background p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-heading">
            {!isReady && report?.status !== "failed" && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            )}
            {statusMessage}
          </div>
          {loadError && <p className="mt-2 text-destructive">{loadError}</p>}
          {report?.lastError && !isReady && (
            <p className="mt-2 text-paragraph">{report.lastError}</p>
          )}
          {(report?.status === "failed" ||
            (Boolean(loadError) && report?.status !== "ready")) && (
            <button
              type="button"
              onClick={() => void retryGeneration()}
              disabled={isRetrying}
              className="mt-3 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
            >
              {isRetrying ? t("reportRetrying") : t("retryReport")}
            </button>
          )}
        </div>
      </div>
      <ReportOverviewSection
        name={report?.customerName || undefined}
        catchmentArea={formattedArea}
        annualRainfall={formattedRainfall}
        mapImageUrl={mapImageUrl}
        mapImageFailed={mapImageFailed}
        onMapLoad={() => {
          if (mapImageUrl) setLoadedMapImageUrl(mapImageUrl);
        }}
        onMapError={() => {
          if (mapImageUrl) setFailedMapImageUrl(mapImageUrl);
        }}
      />
      <RainwaterPotentialSection
        harvestableLitres={
          formattedPotential
            ? `${formattedPotential} ${t("litresUnit")}`
            : undefined
        }
        harvestableInWords={
          harvestableInWords ? `(${harvestableInWords} litres)` : undefined
        }
        calculation={calculation}
        source={
          report?.annualRainfallMm !== undefined
            ? t("annualRainfallSource")
            : undefined
        }
        annualSavingLitres={formattedPotential}
        impacts={impacts}
      />
      <div className="relative aspect-15/4 w-full">
        <Image
          src="/section-images/report-divider-img.png"
          alt=""
          aria-hidden
          fill
          sizes="150vw"
          className="object-cover"
        />
      </div>
      <RechargeMattersSection
        litres={formattedPotential}
        location={locationName}
        analysis={report?.analysis}
      />
      <ForecastProjectionSection
        period={forecastPeriod}
        rows={forecastRows}
        onDownload={printReport}
        onPrint={printReport}
        downloadDisabled={!isReady || isPreparingPdf}
        printDisabled={!isReady || isPreparingPdf}
        downloading={isPreparingPdf}
      />
      <ReportCTASection />
    </>
  );
}
