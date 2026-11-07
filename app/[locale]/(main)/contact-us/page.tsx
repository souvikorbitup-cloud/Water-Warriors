import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  ContactSection,
  FAQSection,
} from "@/components/main/sections/contsct-us";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";
import FAQSectionSkeleton from "@/components/main/sections/contsct-us/FAQSectionSkeleton";
import { getPublicFaqs } from "@/lib/content/faq-service";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/contact-us",
    titleKey: "contactTitle",
    descriptionKey: "contactDescription",
  });
}

export default async function ContactUs({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Contact");
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
            label: tCommon("contactUs"),
          },
        ]}
      />
      <ContactSection />
      <Suspense fallback={<FAQSectionSkeleton />}>
        <ContactFaqs locale={locale} />
      </Suspense>
      <CTASection classes="bg-white" />
    </>
  );
}

async function ContactFaqs({ locale }: { locale: string }) {
  await connection();
  const faqs = await getPublicFaqs("contact", locale);
  return <FAQSection faqs={faqs} />;
}
