"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { Children, Family, Tanker, Tree } from "@/components/icons";
import DownloadHighQualityReportButton from "@/components/main/shared/DownloadHighQualityReportButton";
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
import ReportLoadingScreen from "@/components/main/sections/report/ReportLoadingScreen";
import { numberToIndianWords } from "@/lib/report/format";
import { REPORT_IMPACT_ASSUMPTIONS } from "@/lib/report/constants";
import { reportSessionResponseSchema } from "@/lib/report/schemas";
import type { ReportSessionData } from "@/lib/report/types";
import type {
  PdfQuality,
  WaterWarriorsPdfData,
} from "@/components/pdf/report/pdf.types";
import {
  createReportPdfBlob,
  createSafePdfFileName,
  downloadPdfBlob,
} from "@/lib/report/generate-report-pdf";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "@/lib/data/analytics-consent";
import {
  REPORT_SESSION_REFERENCE_CHANGE_EVENT,
  REPORT_SESSION_REFERENCE_HEADER,
  REPORT_SESSION_REFERENCE_KEY,
} from "@/lib/data/report-session";
import {
  readPreparedReport,
  savePreparedReport,
} from "@/lib/data/prepared-report-session";
import { reportLocaleSchema } from "@/lib/report/schemas";

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

function createPdfMapImageUrl(
  report: ReportSessionData | null,
  quality: PdfQuality,
): string | null {
  if (!report || !isMapSnapshotType(report.mapSnapshotType)) return null;

  try {
    return createStaticMapUrl({
      points: report.selection.points,
      zoom: report.selection.zoom,
      mapType: report.mapSnapshotType,
      scale: quality === "high" ? 2 : 1,
    });
  } catch (error) {
    console.error("Could not create the PDF map snapshot URL.", error);
    return null;
  }
}

function numberFormat(locale: string, value: number, decimals = 0): string {
  return new Intl.NumberFormat(`${locale}-IN`, {
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
  return readPreparedReport(orderId)?.report ?? null;
}

function saveSessionReport(report: ReportSessionData): void {
  try {
    const reportLocale = reportLocaleSchema.parse(
      report.analysisLocale ?? "en",
    );
    savePreparedReport(report, reportLocale, {
      customerName: report.customerName,
      selection: report.selection,
      couponCode: null,
    });
  } catch (error) {
    console.warn("Could not save the report for this browser session.", error);
  }
}

function hasCompleteReportDetails(
  report: ReportSessionData,
  locale: string,
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
    (report.analysisLocale ?? "en") === locale &&
    report.forecast?.length === 5 &&
    report.mapSnapshotType,
  );
}

export default function ReportClient() {
  const reportSessionId = useSyncExternalStore(
    subscribeToReportSession,
    getReportSessionReference,
    () => undefined,
  );

  return (
    <ReportSessionClient
      key={reportSessionId}
      reportSessionId={reportSessionId}
    />
  );
}

function ReportSessionClient({
  reportSessionId,
}: {
  reportSessionId: string | null | undefined;
}) {
  const t = useTranslations("Report");
  const locale = reportLocaleSchema.parse(useLocale());
  const router = useRouter();
  const [report, setReport] = useState<ReportSessionData | null>(null);
  const announcedReportLanguage = useRef<string | null>(null);
  const [sessionAuthorized, setSessionAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [consentRevision, setConsentRevision] = useState(0);
  const [preparingPdfQuality, setPreparingPdfQuality] =
    useState<PdfQuality | null>(null);
  const isPreparingPdf = preparingPdfQuality !== null;
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
      if (
        parsed.data.analysisLocale &&
        hasCompleteReportDetails(parsed.data, parsed.data.analysisLocale)
      ) {
        setReport(parsed.data);
      }
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

  const startGeneration = useCallback(
    async (sessionReference: string) => {
      const response = await fetch("/api/report-session/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [REPORT_SESSION_REFERENCE_HEADER]: sessionReference,
        },
        body: JSON.stringify({ locale }),
        cache: "no-store",
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
      if (!hasCompleteReportDetails(parsed.data, locale)) {
        if (parsed.data.status === "failed" || parsed.data.status === "ready") {
          throw new Error(parsed.data.lastError || t("reportFailed"));
        }
        return parsed.data;
      }
      setReport(parsed.data);
      setLoadError(null);
      saveSessionReport(parsed.data);
      return parsed.data;
    },
    [locale, router, t],
  );

  useEffect(() => {
    if (reportSessionId === null) router.replace("/");
  }, [reportSessionId, router]);

  useEffect(() => {
    if (!report?.analysisLocale) return;

    const languageKey = `${report.orderId}:${report.analysisLocale}`;
    if (announcedReportLanguage.current === languageKey) return;
    announcedReportLanguage.current = languageKey;

    toast.success(
      t("reportLanguage", {
        language: report.analysisLocale === "hi" ? "हिन्दी" : "English",
      }),
    );
  }, [report?.analysisLocale, report?.orderId, t]);

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

        const cachedReport = readSessionReport(nextReport.orderId);
        if (cachedReport) {
          setReport(cachedReport);
          setLoadError(null);
          if (hasCompleteReportDetails(cachedReport, locale)) {
            setIsRetrying(false);
            return;
          }
        }

        if (consentAccepted) {
          nextReport = await loadReport(true, reportSessionId);
          if (!active) return;
        }

        const reportCompleteForLocale = hasCompleteReportDetails(
          nextReport,
          locale,
        );
        if (
          !isInitialRequest &&
          nextReport.status === "failed" &&
          !reportCompleteForLocale
        ) {
          throw new Error(nextReport.lastError || t("reportFailed"));
        }
        if (
          (isInitialRequest &&
            (nextReport.status === "pending" ||
              (nextReport.status === "failed" && !reportCompleteForLocale))) ||
          (nextReport.status === "ready" && !reportCompleteForLocale)
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
    locale,
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
        scale: 2,
      });
    } catch (error) {
      console.error("Could not create the report map snapshot URL.", error);
      return null;
    }
  }, [report]);

  const formattedPotential =
    report?.potentialLitres === undefined
      ? undefined
      : numberFormat(
          report.analysisLocale ?? locale,
          Math.round(report.potentialLitres),
        );
  const formattedArea =
    report === null
      ? undefined
      : `${numberFormat(
          report.analysisLocale ?? locale,
          report.areaSqm,
          2,
        )} sq. metres`;
  const formattedRainfall =
    report?.annualRainfallMm === undefined
      ? undefined
      : `${numberFormat(
          report.analysisLocale ?? locale,
          report.annualRainfallMm,
          1,
        )} mm per year`;
  const harvestableInWords =
    (report?.analysisLocale ?? locale).startsWith("en") &&
    report?.potentialLitres !== undefined
      ? numberToIndianWords(Math.round(report.potentialLitres))
      : undefined;
  const calculation =
    report?.annualRainfallMm !== undefined &&
    report.potentialLitres !== undefined
      ? `(${numberFormat(report.analysisLocale ?? locale, report.areaSqm, 2)} sq.m x ${numberFormat(report.analysisLocale ?? locale, report.annualRainfallMm, 1)} mm x ${numberFormat(report.analysisLocale ?? locale, report.runoffCoefficient, 1)} = ${formattedPotential} ${t("litresUnit")}) - 10% run-off`
      : undefined;

  const impacts = useMemo<ImpactStat[] | undefined>(() => {
    if (report?.potentialLitres === undefined) return undefined;

    return [
      {
        label: t("impacts.0.label"),
        value: `${numberFormat(
          report.analysisLocale ?? locale,
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
          report.analysisLocale ?? locale,
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
          report.analysisLocale ?? locale,
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
          report.analysisLocale ?? locale,
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
  }, [locale, report, t]);

  const forecastRows = useMemo<ForecastRow[] | undefined>(() => {
    if (!report?.forecast) return undefined;

    return [
      ...report.forecast.map((month) => ({
        month: monthName(report.analysisLocale ?? locale, month.monthStart),
        rainfall: `${numberFormat(report.analysisLocale ?? locale, month.rainfallMm, 1)} mm`,
        potential: `${numberFormat(report.analysisLocale ?? locale, Math.round(month.harvestableLitres))} ${t("litresUnit")}`,
      })),
      {
        month: t("grandTotal"),
        rainfall: `${numberFormat(
          report.analysisLocale ?? locale,
          report.forecast.reduce((sum, month) => sum + month.rainfallMm, 0),
          1,
        )} mm`,
        potential: `${numberFormat(
          report.analysisLocale ?? locale,
          Math.round(
            report.forecast.reduce(
              (sum, month) => sum + month.harvestableLitres,
              0,
            ),
          ),
        )} ${t("litresUnit")}`,
        highlight: true,
      },
    ];
  }, [locale, report, t]);

  const forecastPeriod =
    report?.forecast && report.forecast.length > 0
      ? `(${monthName(report.analysisLocale ?? locale, report.forecast[0]!.monthStart)} - ${monthName(
          report.analysisLocale ?? locale,
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

  const pdfMapImageUrl = useMemo(
    () => createPdfMapImageUrl(report, "standard"),
    [report],
  );

  const pdfData: WaterWarriorsPdfData | null = useMemo(() => {
    if (!report) return null;

    const potentialValue = formattedPotential
      ? `${formattedPotential} ${t("litresUnit")}`
      : t("notAvailable");

    const rechargeIntroduction =
      formattedPotential && locationName
        ? t("rechargeIntro", {
            litres: formattedPotential,
            location: locationName,
          })
        : "";

    return {
      locale: report.analysisLocale ?? locale,
      greeting: report.customerName
        ? t("pdfGreeting", { customerName: report.customerName })
        : t("pdfGreetingDefault"),
      thankYou: t("thankYou"),
      customerName: report.customerName || "",
      location: locationName || "",
      mapImageUrl: pdfMapImageUrl,
      rechargeBannerUrl: "/section-images/report-divider-img.png",
      overview: {
        catchmentLabel: t("catchmentLabel"),
        catchmentArea: formattedArea || t("notAvailable"),
        rainfallLabel: t("rainfallLabel"),
        annualRainfall: formattedRainfall || t("notAvailable"),
        potentialTitle: t("potentialTitle"),
        potentialDescription: t("potentialDescription"),
        potentialValue,
        potentialInWords: harvestableInWords
          ? `(${harvestableInWords} ${t("litresUnit")})`
          : undefined,
        calculation,
        source:
          report.annualRainfallMm !== undefined
            ? t("annualRainfallSource")
            : undefined,
      },
      impact: {
        title: t("impactTitle", {
          litres: formattedPotential || t("notAvailable"),
        }),
        description: t("impactDescription"),
        items: (impacts || []).map(({ label, value, note }) => ({
          label,
          value,
          note,
        })),
        assumptions: t("assumptions"),
      },
      recharge: {
        title: t("rechargeTitle"),
        introduction: rechargeIntroduction,
        paragraphs: report.analysis || [],
      },
      forecast: {
        title: t("forecastTitle"),
        period: forecastPeriod || "",
        monthLabel: t("month"),
        rainfallLabel: t("forecastedRainfall"),
        potentialLabel: t("harvestingPotential"),
        pendingLabel: t("forecastPending"),
        rows: forecastRows || [],
        tip: t("tip"),
        note: t("forecastNote"),
        source: t("forecastSource"),
        disclaimer: t("disclaimer"),
      },
    };
  }, [
    report,
    locale,
    t,
    formattedPotential,
    formattedArea,
    formattedRainfall,
    harvestableInWords,
    calculation,
    impacts,
    locationName,
    pdfMapImageUrl,
    forecastPeriod,
    forecastRows,
  ]);

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

  const buildPdfBlob = async (data: WaterWarriorsPdfData) => {
    const [{ default: WaterWarriorsReportPdf }] = await Promise.all([
      import("@/components/pdf/report/WaterWarriorsReportPdf"),
    ]);

    return createReportPdfBlob(<WaterWarriorsReportPdf data={data} />);
  };

  const downloadReport = async (quality: PdfQuality) => {
    if (!isReady || !pdfData || isPreparingPdf) return;

    setPreparingPdfQuality(quality);
    try {
      const data =
        quality === "standard"
          ? pdfData
          : {
              ...pdfData,
              mapImageUrl: createPdfMapImageUrl(report, quality),
            };
      const blob = await buildPdfBlob(data);
      const fileName = createSafePdfFileName(
        `WaterWarriors-${report?.location?.city || "Rainwater-Report"}-${report?.analysisLocale ?? locale}-${quality === "high" ? "high-quality" : "standard"}`,
      );
      downloadPdfBlob(blob, fileName);
    } catch (error) {
      console.error("Could not generate the Water Warriors PDF.", error);
      window.alert(t("pdfGenerationFailed"));
    } finally {
      setPreparingPdfQuality(null);
    }
  };

  if (
    reportSessionId === undefined ||
    reportSessionId === null ||
    !sessionAuthorized ||
    (!loadError &&
      (isLoading ||
        isRetrying ||
        report?.status === "pending" ||
        report?.status === "generating" ||
        report?.status === "retrying"))
  ) {
    return <ReportLoadingScreen />;
  }

  return (
    <>
      {report?.status !== "ready" || loadError ? (
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
            {report?.status === "failed" && !loadError && (
              <button
                type="button"
                onClick={() => void retryGeneration()}
                disabled={isRetrying}
                className="mt-3 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
              >
                {isRetrying ? t("reportRetrying") : t("retryReport")}
              </button>
            )}
            {loadError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
              >
                {t("reloadReport")}
              </button>
            )}
          </div>
        </div>
      ) : null}
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
        onDownload={() => downloadReport("standard")}
        onHighQualityDownload={() => downloadReport("high")}
        downloadDisabled={!isReady || isPreparingPdf}
        highQualityDisabled={!isReady || isPreparingPdf}
        downloadingQuality={preparingPdfQuality}
      />
      <ReportCTASection />
      {isReady && (
        <DownloadHighQualityReportButton
          onClick={() => void downloadReport("high")}
          disabled={isPreparingPdf}
          isPreparing={preparingPdfQuality === "high"}
        />
      )}
    </>
  );
}
