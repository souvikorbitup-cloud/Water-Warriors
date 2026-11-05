import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import messages from "@/messages/en.json";
import { getPathname } from "@/i18n/navigation";
import { localeOpenGraph, routing, type AppLocale } from "@/i18n/routing";
import { getAppLocale } from "@/i18n/get-app-locale";

export const SITE_URL = "https://bakahu.com";
export const SITE_NAME = "Water Warriors AI";

type Href = Parameters<typeof getPathname>[0]["href"];
type MetadataKey = keyof typeof messages.Metadata;

export function getLocalizedUrl(href: Href, locale: AppLocale) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export function getLanguageAlternates(href: Href) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = getLocalizedUrl(href, locale);
  }

  languages["x-default"] = getLocalizedUrl(href, routing.defaultLocale);

  return languages;
}

export function buildPageMetadata({
  locale,
  href,
  title,
  description,
}: {
  locale: AppLocale;
  href: Href;
  title: string;
  description: string;
}): Metadata {
  const url = getLocalizedUrl(href, locale);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: getLanguageAlternates(href),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: localeOpenGraph[locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function localePageMetadata({
  locale,
  href,
  titleKey,
  descriptionKey,
}: {
  locale: string;
  href: Href;
  titleKey: MetadataKey;
  descriptionKey: MetadataKey;
}): Promise<Metadata> {
  const appLocale = getAppLocale(locale);
  const t = await getTranslations({ locale: appLocale, namespace: "Metadata" });
  return buildPageMetadata({
    locale: appLocale,
    href,
    title: t(titleKey),
    description: t(descriptionKey),
  });
}
