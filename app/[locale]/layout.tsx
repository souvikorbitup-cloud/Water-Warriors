import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";
import { SITE_URL } from "@/i18n/seo";
import AppProviders from "@/components/AppProviders";
import { cn } from "@/lib/utils";
import "./../globals.css";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps) {
  const locale = getAppLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const metadata: Metadata = buildPageMetadata({
    locale,
    href: "/",
    title: t("titleDefault"),
    description: t("description"),
  });

  return {
    ...metadata,
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("titleDefault"),
      template: t("titleTemplate"),
    },
    keywords: ["Water Warriors AI"],
    authors: [{ name: "Water Warriors AI" }],
    creator: "Water Warriors AI",
    icons: { icon: "/favicon.ico" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const appLocale = getAppLocale((await params).locale);
  setRequestLocale(appLocale);
  const messages = await getMessages();
  const t = await getTranslations("Common");

  return (
    <html
      lang={appLocale}
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full bg-white flex flex-col">
        <NextIntlClientProvider locale={appLocale} messages={messages}>
          <AppProviders loadingLabel={t("loading")}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
