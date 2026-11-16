import { Suspense, ReactNode } from "react";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";

import MainBanner from "./MainBanner";
import { DEFAULT_HERO_FALLBACK_IMAGE_URL } from "@/lib/appearance/hero-banner";
import {
  BANNER_LOCALES,
  type BannerLocale,
  type BannerPage,
} from "@/lib/appearance/page-banners";
import { getPageBanner } from "@/lib/services/page-banner-settings";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MainbannerSectionProps {
  page: BannerPage;
  heading: ReactNode; // default heading (from translations)
  description: string; // default description
  breadcrumbs: BreadcrumbItem[];
  classes?: string;
}

export default function MainbannerSection({
  page,
  ...props
}: MainbannerSectionProps) {
  return (
    <Suspense
      fallback={
        <MainBanner
          {...props}
          fallbackImageUrl={DEFAULT_HERO_FALLBACK_IMAGE_URL}
        />
      }
    >
      <DynamicMainBanner page={page} {...props} />
    </Suspense>
  );
}

async function DynamicMainBanner({
  page,
  heading,
  description,
  breadcrumbs,
  classes,
}: MainbannerSectionProps) {
  await connection();

  const locale = (await getLocale()) as BannerLocale;
  const banner = await getPageBanner(page);
  const custom = BANNER_LOCALES.includes(locale)
    ? banner.translations[locale]
    : undefined;

  const resolvedHeading =
    custom?.heading || custom?.highlight ? (
      <>
        {custom.heading}
        {custom.heading && custom.highlight && <br />}
        {custom.highlight && (
          <span className="text-primary">{custom.highlight}</span>
        )}
      </>
    ) : (
      heading
    );

  return (
    <MainBanner
      heading={resolvedHeading}
      description={custom?.description || description}
      breadcrumbs={breadcrumbs}
      fallbackImageUrl={banner.imageUrl ?? DEFAULT_HERO_FALLBACK_IMAGE_URL}
      classes={classes}
    />
  );
}
