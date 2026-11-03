"use client";

import { LogoLight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { footerNavLinks, socialLinks } from "@/lib/data/all_data";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import PrimaryButton from "../shared/button/PrimaryButton";

type MainFooterProps = {
  visitorCount?: number;
};

type AnalyticsConsent = "accepted" | "declined";

const ANALYTICS_CONSENT_KEY = "ww_analytics_consent";
const ANALYTICS_CONSENT_CHANGE_EVENT = "ww-analytics-consent-change";

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
  const router = useRouter();
  const pathname = usePathname();
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [consentSaveError, setConsentSaveError] = useState<string | null>(null);
  const shouldShowConsent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    needsAnalyticsConsent,
    () => false,
  );

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
    } catch (error) {
      console.error("Unable to save analytics cookie preference", error);
      setConsentSaveError(
        "We couldn't save your choice. Please check your browser settings and try again.",
      );
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
              Lorem ipsum dolor sit amet, consectetur sectetu ipsum dolor
              slit.Lorem i sdefa amet, consectetur sectetu ipsum dolor slit.
            </p>

            {/* Nav links */}
            <nav aria-label="Footer" className="mt-8 sm:mt-10">
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-8 lg:gap-x-7.5">
                {footerNavLinks.map(({ title, href }) => {
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
                        {title}
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
                    Cookie settings
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
              Visitors so far: {visitorCount}
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="mt-10 h-px w-full bg-linear-to-r from-transparent via-background/20 to-transparent sm:mt-12"
          />

          {/* Copyright */}
          <p className="mx-auto max-w-250 py-8 text-center text-xs leading-5 text-primary sm:py-10 sm:text-sm sm:leading-6 lg:text-base">
            &copy; {new Date().getFullYear()} Water Warriors AI. All rights
            reserved. All proprietary technology and processes featured on this
            site are protected under national and international patent pending
            status. Unauthorized reproduction or use is strictly prohibited.
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
              Cookies for site analytics
            </h2>
            <p
              id="analytics-consent-description"
              className="mt-2 text-sm leading-6 text-paragraph sm:text-base"
            >
              We&apos;d like to use Google Analytics cookies to understand how
              people use Water Warriors, such as which pages are visited and
              whether reports are created. We don&apos;t use them for ads. See
              our{" "}
              <Button
                className="font-semibold text-heading hover:text-primary underline decoration-primary decoration-2 underline-offset-4 bg-transparent hover:bg-transparent p-0 cursor-pointer text-sm sm:text-base"
                onClick={() => router.push("/privacy-policy")}
              >
                Privacy Policy
              </Button>
              .
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
                Decline
              </PrimaryButton>
              <PrimaryButton
                type="button"
                btnType="solid-primary"
                onClick={() => saveAnalyticsConsent("accepted")}
              >
                Accept
              </PrimaryButton>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
