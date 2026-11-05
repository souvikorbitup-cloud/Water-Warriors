import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/icons";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { getAppLocale } from "@/i18n/get-app-locale";
import { buildPageMetadata } from "@/i18n/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Unauthorized" });

  return buildPageMetadata({
    locale,
    href: "/unauthorized",
    title: t("title"),
    description: t("description"),
  });
}

export default async function UnauthorizedPage({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Unauthorized");
  const tCommon = await getTranslations("Common");

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <div className="flex w-full max-w-2xl flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
        <Logo className="h-26 w-26 object-contain sm:h-34 sm:w-34" />
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-paragraph sm:text-base">
          {t("description")}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <PrimaryButton href="/admin/profile" btnType="solid-primary">
            {t("backToProfile")}
          </PrimaryButton>
          <PrimaryButton
            btnType="outline"
            href="/contact-us"
            localized
            className="border-border"
          >
            {tCommon("contactSupport")}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
