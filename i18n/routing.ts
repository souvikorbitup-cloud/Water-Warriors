import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  alternateLinks: true,
});

export type AppLocale = (typeof routing.locales)[number];

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
};

export const localeOpenGraph: Record<AppLocale, string> = {
  en: "en_IN",
  hi: "hi_IN",
};
