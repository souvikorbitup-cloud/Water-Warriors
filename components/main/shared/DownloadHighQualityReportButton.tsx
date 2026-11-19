"use client";

import { FileDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DownloadHighQualityReportButton({
  onClick,
  disabled,
  isPreparing,
}: {
  onClick: () => void;
  disabled: boolean;
  isPreparing: boolean;
}) {
  const t = useTranslations("Report");
  const label = isPreparing ? t("preparingPdf") : t("downloadHighQualityPdf");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("downloadHighQualityPdf")}
      aria-busy={isPreparing}
      className="group fixed right-3 bottom-18 z-40 flex items-center focus-visible:outline-none sm:right-6.5 sm:bottom-28 cursor-pointer"
    >
      <span className="pointer-events-auto absolute right-6 flex h-11 translate-x-0 items-center rounded-full bg-background pr-12 pl-5 text-sm font-medium whitespace-nowrap text-heading opacity-100 shadow-lg shadow-foreground/15 transition-all duration-300 ease-out sm:pointer-events-none sm:h-12 sm:translate-x-full sm:pr-13 sm:pl-6 sm:text-base sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-visible:pointer-events-auto sm:group-focus-visible:translate-x-0 sm:group-focus-visible:opacity-100">
        {label}
      </span>
      <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/20 transition-transform duration-300 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-active:scale-95 sm:size-16">
        <FileDown className="size-6 sm:size-7" strokeWidth={1.75} aria-hidden />
      </span>
    </button>
  );
}
