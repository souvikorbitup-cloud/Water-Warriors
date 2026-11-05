import { setRequestLocale } from "next-intl/server";
import { CheckoutSection } from "@/components/main/sections/report";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/checkout",
    titleKey: "checkoutTitle",
    descriptionKey: "checkoutDescription",
  });
}

export default async function PaymentStepPage({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);

  return (
    <>
      <CheckoutSection />
    </>
  );
}
