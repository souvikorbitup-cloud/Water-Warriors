"use client";

import { useSyncExternalStore } from "react";
import { FileDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  REPORT_SESSION_REFERENCE_CHANGE_EVENT,
  REPORT_SESSION_REFERENCE_KEY,
} from "@/lib/data/report-session";

function subscribeToReportSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(REPORT_SESSION_REFERENCE_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(REPORT_SESSION_REFERENCE_CHANGE_EVENT, onChange);
  };
}

function hasActiveReportSession(): boolean {
  try {
    return Boolean(window.sessionStorage.getItem(REPORT_SESSION_REFERENCE_KEY));
  } catch (error) {
    console.error("Could not read the active report session.", error);
    return false;
  }
}

/**
 * Floating "Download Report" button, fixed to the bottom-right of the screen.
 *
 * - sm and up (hover devices): only the yellow icon circle is visible. Hovering it
 *   (or focusing it with the keyboard) slides the "Download Report" label out to the left,
 *   and the whole control is a single link to /report.
 * - Mobile: the label is always visible, since there is no hover on touch screens.
 */
export default function DownloadReportButton() {
  const isReportSessionActive = useSyncExternalStore(
    subscribeToReportSession,
    hasActiveReportSession,
    () => false,
  );

  if (!isReportSessionActive) return null;

  return (
    <Link
      href="/report"
      aria-label="Download report"
      className="group fixed right-4 bottom-4 z-40 flex items-center focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      {/* Label: tucked under the circle, slides out to the left */}
      <span className="pointer-events-auto absolute right-6 flex h-11 translate-x-0 items-center rounded-full bg-background pr-12 pl-5 text-sm font-medium whitespace-nowrap text-heading opacity-100 shadow-lg shadow-foreground/15 transition-all duration-300 ease-out sm:pointer-events-none sm:h-12 sm:translate-x-full sm:pr-13 sm:pl-6 sm:text-base sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-visible:pointer-events-auto sm:group-focus-visible:translate-x-0 sm:group-focus-visible:opacity-100">
        Download Report
      </span>

      {/* Icon circle */}
      <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/20 transition-transform duration-300 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-active:scale-95 sm:size-16">
        <FileDown className="size-6 sm:size-7" strokeWidth={1.75} aria-hidden />
      </span>
    </Link>
  );
}
