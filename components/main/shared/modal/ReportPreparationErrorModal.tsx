"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import PopModal from "@/components/main/shared/modal/PopModal";

export default function ReportPreparationErrorModal({
  open,
  onClose,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("Checkout");

  return (
    <PopModal
      open={open}
      onClose={onClose}
      title={t("reportPreparationFailedTitle")}
      className="max-w-md"
    >
      <div className="relative overflow-hidden bg-background px-6 py-9 text-center sm:px-9">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-36 bg-linear-to-b from-primary/15 to-transparent"
        />
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <AlertCircle className="size-8" strokeWidth={1.7} aria-hidden />
        </div>
        <h2 className="relative mt-5 text-2xl font-semibold text-heading">
          {t("reportPreparationFailedTitle")}
        </h2>
        <p className="relative mt-3 text-sm leading-6 text-paragraph sm:text-base">
          {t("reportPreparationFailedDescription")}
        </p>
        <p className="relative mt-3 text-xs font-medium text-muted-foreground">
          {t("reportPreparationFailedNote")}
        </p>
        <div className="relative mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-heading transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t("close")}
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RefreshCw className="size-4" aria-hidden />
            {t("tryAgain")}
          </button>
        </div>
      </div>
    </PopModal>
  );
}
