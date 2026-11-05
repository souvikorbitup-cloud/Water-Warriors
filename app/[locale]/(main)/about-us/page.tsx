import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  HowItWorksSection,
  OurMissionSection,
  ResourceSection,
} from "@/components/main/sections/about-us";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/about-us",
    titleKey: "aboutTitle",
    descriptionKey: "aboutDescription",
  });
}

export default async function AboutUs({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <MainbannerSection
        heading={
          <>
            {t("bannerHeading")} <br />
            <span className="text-primary">{t("bannerHighlight")}</span>
          </>
        }
        description={t("bannerDescription")}
        classes="max-w-80 sm:max-w-140"
        breadcrumbs={[
          {
            label: tCommon("home"),
            href: "/",
          },
          {
            label: tCommon("aboutUs"),
          },
        ]}
      />
      <OurMissionSection />
      <ResourceSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
