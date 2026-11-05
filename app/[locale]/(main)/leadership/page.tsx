import { getTranslations, setRequestLocale } from "next-intl/server";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";
import TeamSection from "@/components/main/shared/section/TeamSection";
import { leadership, technicalAdvisors } from "@/lib/data/all_data";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/leadership",
    titleKey: "leadershipTitle",
    descriptionKey: "leadershipDescription",
  });
}

export default async function Leadership({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Leadership");
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
            label: tCommon("leadership"),
          },
        ]}
      />
      <TeamSection
        title={t("leadershipTitle")}
        members={leadership}
        className="mt-8 sm:mt-0"
      />
      <TeamSection
        title={t("advisorsTitle")}
        members={technicalAdvisors}
        className="bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]"
      />
      <CTASection />
    </>
  );
}
