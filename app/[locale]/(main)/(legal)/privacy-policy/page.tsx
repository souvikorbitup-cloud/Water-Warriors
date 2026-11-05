import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrivacyPolicyContentSection } from "@/components/main/sections/legal";
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
    href: "/privacy-policy",
    titleKey: "privacyTitle",
    descriptionKey: "privacyDescription",
  });
}

export default async function PrivacyPolicy({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <MainbannerSection
        heading={
          <>
            {t("bannerHeading")}{" "}
            <span className="text-primary">{t("bannerHighlight")}</span>
          </>
        }
        description={t("bannerDescription")}
        classes="max-w-90 sm:max-w-150"
        breadcrumbs={[
          {
            label: tCommon("home"),
            href: "/",
          },
          {
            label: tCommon("privacyPolicy"),
          },
        ]}
      />
      <PrivacyPolicyContentSection />
      <CTASection />
    </>
  );
}
