"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "@/lib/data/analytics-consent";
import {
  REPORT_SESSION_REFERENCE_CHANGE_EVENT,
  REPORT_SESSION_REFERENCE_HEADER,
  REPORT_SESSION_REFERENCE_KEY,
} from "@/lib/data/report-session";

const REPORT_SESSION_STORAGE_PREFIX = "ww-report-session:";

function subscribeToReportSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(REPORT_SESSION_REFERENCE_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(REPORT_SESSION_REFERENCE_CHANGE_EVENT, onChange);
  };
}

function getReportSessionReference(): string | null {
  try {
    return window.sessionStorage.getItem(REPORT_SESSION_REFERENCE_KEY) || null;
  } catch (error) {
    console.error("Could not read the active report session.", error);
    return null;
  }
}

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

function hasAnalyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
  } catch (error) {
    console.warn("Could not read analytics consent for report storage.", error);
    return false;
  }
}

function readSessionReport(orderId: string): ReportSessionData | null {
  const key = `${REPORT_SESSION_STORAGE_PREFIX}${orderId}`;
  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    const result = reportSessionResponseSchema.safeParse(parsed);
    if (!result.success || result.data.orderId !== orderId) {
      window.sessionStorage.removeItem(key);
      console.warn(
        "Ignoring invalid report data saved for this browser session.",
      );
      return null;
    }

    return result.data;
  } catch (error) {
    console.warn("Could not restore this browser session's report.", error);
    return null;
  }
}

function saveSessionReport(report: ReportSessionData): void {
  try {
    window.sessionStorage.setItem(
      `${REPORT_SESSION_STORAGE_PREFIX}${report.orderId}`,
      JSON.stringify(report),
    );
  } catch (error) {
    console.warn("Could not save the report for this browser session.", error);
  }
}

function hasCompleteReportDetails(report: ReportSessionData): boolean {
  return Boolean(
    report.annualRainfallMm !== undefined &&
      report.potentialLitres !== undefined &&
      report.location &&
      (report.analysis?.length ?? 0) >= 3 &&
      report.forecast?.length === 5 &&
      report.mapSnapshotType,
  );
}

export default function ReportClient() {
  const t = useTranslations("Report");
  const locale = useLocale();
  const router = useRouter();
  const reportSessionId = useSyncExternalStore(
    subscribeToReportSession,
    getReportSessionReference,
    () => undefined,
  );
  const [report, setReport] = useState<ReportSessionData | null>(null);
  const [sessionAuthorized, setSessionAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [consentRevision, setConsentRevision] = useState(0);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [loadedMapImageUrl, setLoadedMapImageUrl] = useState<string | null>(
    null,
  );
  const [failedMapImageUrl, setFailedMapImageUrl] = useState<string | null>(
    null,
  );

  const loadReport = useCallback(
    async (consentAccepted: boolean, sessionReference: string) => {
      const response = await fetch("/api/report-session", {
        cache: "no-store",
        headers: {
          "x-ww-analytics-consent": consentAccepted ? "accepted" : "declined",
          [REPORT_SESSION_REFERENCE_HEADER]: sessionReference,
        },
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 404) router.replace("/");
        throw new Error(getApiMessage(body) ?? t("reportNotFound"));
      }
      const parsed = reportSessionResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(t("reportLoadFailed"));
      }
      if (parsed.data.orderId !== sessionReference) {
        router.replace("/");
        throw new Error(t("reportNotFound"));
      }
      setSessionAuthorized(true);
      setReport(parsed.data);
      setLoadError(null);
      return parsed.data;
    },
    [router, t],
  );

  const syncReportConsent = useCallback(
    async (accepted: boolean, sessionReference: string) => {
      const response = await fetch("/api/report-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [REPORT_SESSION_REFERENCE_HEADER]: sessionReference,
        },
        body: JSON.stringify({ accepted }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 404) router.replace("/");
        throw new Error(getApiMessage(body) ?? t("reportLoadFailed"));
      }
      const parsed = reportSessionResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error(t("reportLoadFailed"));
      if (parsed.data.orderId !== sessionReference) {
        router.replace("/");
        throw new Error(t("reportNotFound"));
      }
      setSessionAuthorized(true);
      return parsed.data;
    },
    [router, t],
  );

  const startGeneration = useCallback(async (sessionReference: string) => {
    const response = await fetch("/api/report-session/generate", {
      method: "POST",
      headers: {
        [REPORT_SESSION_REFERENCE_HEADER]: sessionReference,
      },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 404) router.replace("/");
      throw new Error(getApiMessage(body) ?? t("reportFailed"));
    }
    const parsed = reportSessionResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new Error(t("reportLoadFailed"));
    }
    if (parsed.data.orderId !== sessionReference) {
      router.replace("/");
      throw new Error(t("reportNotFound"));
    }
    setSessionAuthorized(true);
    setReport(parsed.data);
    setLoadError(null);
    return parsed.data;
  }, [router, t]);

  useEffect(() => {
    if (reportSessionId === null) router.replace("/");
  }, [reportSessionId, router]);

  useEffect(() => {
    if (reportSessionId === undefined || reportSessionId === null) return;

    let active = true;
    let pollTimer: number | undefined;
    const poll = async (isInitialRequest: boolean) => {
      if (!active) return;
      try {
        const consentAccepted = hasAnalyticsConsent();
        let nextReport = await syncReportConsent(
          consentAccepted,
          reportSessionId,
        );
        if (!active) return;

        if (!consentAccepted) {
          const cachedReport =
            generationAttempt === 0
              ? readSessionReport(nextReport.orderId)
              : null;
          if (cachedReport) {
            setReport(cachedReport);
            setLoadError(null);
            setIsRetrying(false);
            return;
          }
          nextReport = await startGeneration(reportSessionId);
          if (!active) return;
          if (
            nextReport.status !== "generating" &&
            nextReport.status !== "retrying"
          ) {
            saveSessionReport(nextReport);
          }
        } else {
          nextReport = await loadReport(true, reportSessionId);
          if (!active) return;
        }

        if (
          consentAccepted &&
          ((isInitialRequest &&
            (nextReport.status === "pending" ||
              (nextReport.status === "failed" &&
                (generationAttempt > 0 ||
                  !hasCompleteReportDetails(nextReport))))) ||
            (nextReport.status === "ready" &&
              !hasCompleteReportDetails(nextReport)))
        ) {
          setIsRetrying(true);
          nextReport = await startGeneration(reportSessionId);
          if (!active) return;
        }
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

    const handleConsentChange = () => {
      setReport(null);
      setSessionAuthorized(false);
      setIsLoading(true);
      setConsentRevision((revision) => revision + 1);
    };
    window.addEventListener(
      ANALYTICS_CONSENT_CHANGE_EVENT,
      handleConsentChange,
    );
    window.addEventListener("storage", handleConsentChange);
    void poll(true);

    return () => {
      active = false;
      window.removeEventListener(
        ANALYTICS_CONSENT_CHANGE_EVENT,
        handleConsentChange,
      );
      window.removeEventListener("storage", handleConsentChange);
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
    };
  }, [
    consentRevision,
    generationAttempt,
    loadReport,
    reportSessionId,
    startGeneration,
    syncReportConsent,
    t,
  ]);

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

  if (
    reportSessionId === undefined ||
    reportSessionId === null ||
    !sessionAuthorized
  ) {
    return null;
  }

  return (
    <>
      {report?.status !== "ready" && (
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
            {(report?.status === "failed" || Boolean(loadError)) && (
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
      )}
      <ReportOverviewSection
        name={report?.customerName || undefined}
        generationFinished={
          report?.status === "ready" || report?.status === "failed"
        }
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
