import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ComingSoonSection,
  DIYGuidesSection,
  HowItWorksStepsSection,
  KeepItWorkingSection,
  TwoWaysSection,
} from "@/components/main/sections/education";
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
    href: "/education",
    titleKey: "educationTitle",
    descriptionKey: "educationDescription",
  });
}

export default async function Education({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Education");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <MainbannerSection
        heading={
          <>
            {t("bannerHeading")}
            <br />
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
            label: tCommon("education"),
          },
        ]}
      />
      <HowItWorksStepsSection />
      <TwoWaysSection />
      <DIYGuidesSection />
      <KeepItWorkingSection />
      <ComingSoonSection />
      <CTASection classes="bg-white" />
    </>
  );
}
