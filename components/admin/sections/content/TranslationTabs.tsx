"use client";

import { useState, type ReactNode } from "react";
import { localeNames, type AppLocale } from "@/i18n/routing";
import { CONTENT_LOCALES } from "@/lib/content/client-form";
import { cn } from "@/lib/utils";

export default function TranslationTabs({
  renderLocale,
}: {
  renderLocale: (locale: AppLocale) => ReactNode;
}) {
  const [active, setActive] = useState<AppLocale>(CONTENT_LOCALES[0]);

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-200">
        {CONTENT_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActive(locale)}
            className={cn(
              "cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === locale
                ? "border-primary text-heading"
                : "border-transparent text-muted-foreground hover:text-heading",
            )}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
      <div className="pt-4">{renderLocale(active)}</div>
    </div>
  );
}
