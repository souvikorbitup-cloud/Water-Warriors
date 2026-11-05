import { getTranslations, setRequestLocale } from "next-intl/server";
import FeedbackSection from "@/components/main/sections/feedback/FeedbackSection";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/feedback",
    titleKey: "feedbackTitle",
    descriptionKey: "feedbackDescription",
  });
}

export default async function Feedback({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Feedback");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <MainbannerSection
        heading={
          <>
            {t("bannerHeading")}
            <br />
            <span className="text-primary">{t("bannerHighlight")} </span>
          </>
        }
        description={t("bannerDescription")}
        classes="max-w-120 sm:max-w-180"
        breadcrumbs={[
          {
            label: tCommon("home"),
            href: "/",
          },
          {
            label: tCommon("feedback"),
          },
        ]}
      />
      <FeedbackSection />
    </>
  );
}
