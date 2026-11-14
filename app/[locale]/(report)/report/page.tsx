import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import ReportClient from "@/components/main/sections/report/ReportClient";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";
import { getCurrentAuthorizedReport } from "@/lib/report/current-session";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/report",
    titleKey: "reportTitle",
    descriptionKey: "reportDescription",
  });
}

export default async function ReportPage({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const report = await getCurrentAuthorizedReport(false);
  if (!report) redirect("/");

  return <ReportClient />;
}
