import { setRequestLocale } from "next-intl/server";
import { CheckoutSection } from "@/components/main/sections/report";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function PaymentStepPage({
  params,
  searchParams,
}: PageProps) {
  const [{ locale: requestedLocale }, { attempt }] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = getAppLocale(requestedLocale);
  setRequestLocale(locale);

  return (
    <>
      <CheckoutSection
        key={typeof attempt === "string" ? attempt : "default"}
      />
    </>
  );
}
