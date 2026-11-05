import { setRequestLocale } from "next-intl/server";
import {
  ForecastProjectionSection,
  RainwaterPotentialSection,
  RechargeMattersSection,
  ReportCTASection,
  ReportOverviewSection,
} from "@/components/main/sections/report";
import Image from "next/image";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

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

  return (
    <>
      <ReportOverviewSection />
      <RainwaterPotentialSection />
      <div className="aspect-15/4 relative w-full">
        <Image
          src="/section-images/report-divider-img.png"
          alt="gradent-bg"
          aria-hidden
          fill
          sizes="150vw"
          className="object-cover"
        />
      </div>
      <RechargeMattersSection />
      <ForecastProjectionSection />
      <ReportCTASection />
    </>
  );
}
