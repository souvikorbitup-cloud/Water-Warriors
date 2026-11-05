import { setRequestLocale } from "next-intl/server";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/sign-in",
    titleKey: "signInTitle",
    descriptionKey: "signInDescription",
  });
}

export default async function AuthLayout({ children, params }: LayoutProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  return children;
}
