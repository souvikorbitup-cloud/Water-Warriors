import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/i18n/seo";

const publicPaths = [
  "/",
  "/about-us",
  "/leadership",
  "/education",
  "/contact-us",
  "/feedback",
  "/privacy-policy",
  "/report",
  "/checkout",
  "/sign-in",
] as const;

function localizedUrl(href: (typeof publicPaths)[number], locale: AppLocale) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => {
    const languages: Record<string, string> = {};

    for (const locale of routing.locales) {
      languages[locale] = localizedUrl(path, locale);
    }

    languages["x-default"] = localizedUrl(path, routing.defaultLocale);

    return {
      url: localizedUrl(path, routing.defaultLocale),
      lastModified: new Date(),
      alternates: {
        languages,
      },
    };
  });
}
