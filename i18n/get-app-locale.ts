import { notFound } from "next/navigation";
import { routing, type AppLocale } from "./routing";

export function getAppLocale(locale: string): AppLocale {
  const appLocale = routing.locales.find(
    (supportedLocale) => supportedLocale === locale,
  );

  if (!appLocale) {
    notFound();
  }

  return appLocale;
}
