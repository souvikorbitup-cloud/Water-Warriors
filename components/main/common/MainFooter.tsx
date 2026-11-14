"use client";

import { useTranslations } from "next-intl";
import { LogoLight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { footerNavLinks, socialLinks } from "@/lib/data/all_data";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import PrimaryButton from "../shared/button/PrimaryButton";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "@/lib/data/analytics-consent";
import {
  REPORT_SESSION_REFERENCE_HEADER,
  REPORT_SESSION_REFERENCE_KEY,
} from "@/lib/data/report-session";

const VISITOR_COUNT_SESSION_KEY = "ww_visitor_count";
const VISITOR_COUNT_CHANGE_EVENT = "ww:visitor-count-change";
let inMemoryVisitorCount: number | null = null;

type MainFooterProps = {
  visitorCount?: number;
};

type AnalyticsConsent = "accepted" | "declined";
const COPYRIGHT_YEAR = new Date().getFullYear();

function subscribeToVisitorCount(onChange: () => void) {
  window.addEventListener(VISITOR_COUNT_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener(VISITOR_COUNT_CHANGE_EVENT, onChange);
  };
}

function getVisitorCountSnapshot(fallback: number) {
  try {
    const storedCount = window.sessionStorage.getItem(
      VISITOR_COUNT_SESSION_KEY,
    );
    const parsedCount = storedCount ? Number(storedCount) : NaN;
    if (Number.isSafeInteger(parsedCount) && parsedCount >= 216) {
      return parsedCount;
    }
  } catch {
    return inMemoryVisitorCount ?? fallback;
  }

  return inMemoryVisitorCount ?? fallback;
}

function subscribeToAnalyticsConsent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);
  };
}

function needsAnalyticsConsent() {
  try {
    const consent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return consent !== "accepted" && consent !== "declined";
  } catch (error) {
    console.error("Unable to read analytics cookie preference", error);
    return true;
  }
}

export default function MainFooter({ visitorCount = 216 }: MainFooterProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [consentSaveError, setConsentSaveError] = useState<string | null>(null);
  const visitorCountRequestStarted = useRef(false);
  const currentVisitorCount = useSyncExternalStore(
    subscribeToVisitorCount,
    () => getVisitorCountSnapshot(visitorCount),
    () => visitorCount,
  );
  const shouldShowConsent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    needsAnalyticsConsent,
    () => false,
  );

  useEffect(() => {
    if (visitorCountRequestStarted.current) return;
    visitorCountRequestStarted.current = true;

    let storedCount: string | null;
    try {
      storedCount = window.sessionStorage.getItem(VISITOR_COUNT_SESSION_KEY);
      if (storedCount && storedCount !== "pending") {
        const parsedCount = Number(storedCount);
        if (Number.isSafeInteger(parsedCount) && parsedCount >= 216) {
          return;
        }

        console.warn(
          "Ignoring an invalid visitor count saved for this session.",
        );
        window.sessionStorage.removeItem(VISITOR_COUNT_SESSION_KEY);
      }

      if (!storedCount || storedCount !== "pending") {
        window.sessionStorage.setItem(VISITOR_COUNT_SESSION_KEY, "pending");
      }
    } catch (error) {
      console.error(
        "Could not access session storage for the visitor count.",
        error,
      );
      return;
    }

    const method = storedCount === "pending" ? "GET" : "POST";
    void fetch("/api/visitor-count", { method, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Visitor count request failed (${response.status}).`);
        }
        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !("count" in body) ||
          typeof body.count !== "number" ||
          !Number.isSafeInteger(body.count) ||
          body.count < 216
        ) {
          throw new Error("The server returned an invalid visitor count.");
        }
        return body.count;
      })
      .then((count) => {
        inMemoryVisitorCount = count;
        try {
          window.sessionStorage.setItem(
            VISITOR_COUNT_SESSION_KEY,
            String(count),
          );
        } catch (error) {
          console.error(
            "Could not save the visitor count for this session.",
            error,
          );
        }
        window.dispatchEvent(new Event(VISITOR_COUNT_CHANGE_EVENT));
      })
      .catch((error: unknown) => {
        console.error("Could not update the visitor count.", error);
      });
  }, [visitorCount]);

  const openCookieSettings = () => {
    setConsentSaveError(null);
    setCookieSettingsOpen(true);
  };

  const saveAnalyticsConsent = (consent: AnalyticsConsent) => {
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
      window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGE_EVENT));
      setConsentSaveError(null);
      setCookieSettingsOpen(false);

      if (pathname !== "/report") {
        let reportSessionReference: string | null = null;
        try {
          reportSessionReference = window.sessionStorage.getItem(
            REPORT_SESSION_REFERENCE_KEY,
          );
        } catch (error) {
          console.warn("Could not read the active report session.", error);
        }

        if (reportSessionReference) {
          void fetch("/api/report-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [REPORT_SESSION_REFERENCE_HEADER]: reportSessionReference,
            },
            body: JSON.stringify({ accepted: consent === "accepted" }),
          })
            .then((response) => {
              if (response.status !== 404 && !response.ok) {
                throw new Error(
                  `Report consent update failed (${response.status}).`,
                );
              }
            })
            .catch((error: unknown) => {
              console.error("Could not update report-session consent.", error);
            });
        }
      }
    } catch (error) {
      console.error("Unable to save analytics cookie preference", error);
      setConsentSaveError(t("cookieSaveError"));
    }
  };

  return (
    <>
      <footer className="relative isolate overflow-hidden bg-foreground text-background">
        {/* Decorative background shape */}
        <Image
          src="/section-images/w-logo.svg"
          alt="w-logo"
          aria-hidden
          width={2000}
          height={2000}
          sizes="100vw"
          priority={false}
          className="pointer-events-none -z-20 select-none absolute h-180 left-[-50%] top-10 rotate-25"
        />
        <Image
          src="/section-images/w-logo.svg"
          alt="w-logo"
          aria-hidden
          width={2000}
          height={2000}
          sizes="100vw"
          priority={false}
          className="pointer-events-none -z-20 select-none absolute h-180 right-[-50%] -top-50"
        />

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0)_55.4%)]" />

        <div className="my-container-x">
          {/* Top content */}
          <div className="flex flex-col items-center pt-12.5 text-center sm:pt-20 lg:pt-25">
            {/* Logo: WATER text recolored to white for the dark background */}
            <Link href="/">
              <LogoLight className="h-auto w-30 sm:w-40 lg:w-50" />
            </Link>

            <p className="mt-8 max-w-140 text-sm leading-6 text-background sm:mt-10 sm:text-base">
              {t("footerDescription")}
            </p>

            {/* Nav links */}
            <nav aria-label={t("footerNavigation")} className="mt-8 sm:mt-10">
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-8 lg:gap-x-7.5">
                {footerNavLinks.map(({ titleKey, href }) => {
                  const isActive = pathname === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={`text-sm font-normal transition-colors hover:text-primary sm:text-base ${
                          isActive ? "text-primary" : "text-background"
                        }`}
                      >
                        {t(titleKey)}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Button
                    type="button"
                    onClick={openCookieSettings}
                    className={`text-sm font-normal transition-colors hover:text-primary sm:text-base text-background bg-transparent hover:bg-transparent cursor-pointer`}
                  >
                    {t("cookieSettings")}
                  </Button>
                </li>
              </ul>
            </nav>

            {/* Social icons */}
            <ul className="mt-8 flex items-center justify-center gap-3 sm:mt-10 sm:gap-4">
              {socialLinks.map(({ image, url, altText }) => (
                <li key={altText}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={altText}
                    className="flex size-9 items-center justify-center rounded-full border border-background transition-colors hover:border-primary sm:size-10"
                  >
                    {altText === "Facebook" ? (
                      <Image
                        src={image}
                        alt="Facebook"
                        width={18}
                        height={18}
                        className="size-6 sm:size-8"
                      />
                    ) : (
                      <Image
                        src={image}
                        alt={altText}
                        width={18}
                        height={18}
                        className="size-4 sm:size-6"
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>

            {/* Visitor counter */}
            <div className="mt-8 rounded-md border border-secondary px-2.5 py-1.5 text-sm font-medium text-secondary animate-color-transition sm:mt-10 sm:text-base">
              {t("visitorsSoFar", { count: currentVisitorCount })}
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="mt-10 h-px w-full bg-linear-to-r from-transparent via-background/20 to-transparent sm:mt-12"
          />

          {/* Copyright */}
          <p className="mx-auto max-w-250 py-8 text-center text-xs leading-5 text-primary sm:py-10 sm:text-sm sm:leading-6 lg:text-base">
            {t("copyright", { year: COPYRIGHT_YEAR })}
          </p>
        </div>
      </footer>
      {(cookieSettingsOpen || shouldShowConsent) && (
        <div className="fixed inset-x-0 bottom-0 z-100 px-3 pb-4">
          <section
            role="dialog"
            aria-labelledby="analytics-consent-title"
            aria-describedby="analytics-consent-description"
            className="mx-auto max-w-5xl border-t border-border bg-background px-4 py-5 text-foreground shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:px-6 sm:py-6 rounded-2xl"
          >
            <h2
              id="analytics-consent-title"
              className="text-lg font-semibold text-heading sm:text-xl"
            >
              {t("cookieTitle")}
            </h2>
            <p
              id="analytics-consent-description"
              className="mt-2 text-sm leading-6 text-paragraph sm:text-base"
            >
              {t.rich("cookieDescription", {
                privacyPolicy: (chunks) => (
                  <Button
                    className="font-semibold text-heading hover:text-primary underline decoration-primary decoration-2 underline-offset-4 bg-transparent hover:bg-transparent p-0 cursor-pointer text-sm sm:text-base"
                    onClick={() => router.push("/privacy-policy")}
                  >
                    {chunks}
                  </Button>
                ),
              })}
            </p>
            {consentSaveError && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {consentSaveError}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-3">
              <PrimaryButton
                type="button"
                btnType="outline"
                className="border-border"
                onClick={() => saveAnalyticsConsent("declined")}
              >
                {t("decline")}
              </PrimaryButton>
              <PrimaryButton
                type="button"
                btnType="solid-primary"
                onClick={() => saveAnalyticsConsent("accepted")}
              >
                {t("accept")}
              </PrimaryButton>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
