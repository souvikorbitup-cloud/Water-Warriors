"use client";

import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";

export default function ReportLoadingScreen() {
  const t = useTranslations("Report");

  return (
    <main
      className="fixed inset-0 z-9999 flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex max-w-md flex-col items-center">
        <div className="relative mb-8 flex size-28 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border border-primary/20 animation-duration-[2.4s]" />
          <span className="absolute inset-2 animate-spin rounded-full border-2 border-primary/20 border-t-primary animation-duration-[1.6s]" />
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LoaderCircle className="size-8 animate-spin" aria-hidden />
          </span>
        </div>
        <h1 className="text-xl font-semibold text-heading sm:text-2xl">
          {t("reportGenerating")}
        </h1>
        <div aria-hidden className="mt-5 flex items-center gap-2 text-primary">
          <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
          <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
          <span className="size-2 animate-bounce rounded-full bg-current" />
        </div>
      </div>
    </main>
  );
}
