import { Suspense, ReactNode } from "react";
import { connection } from "next/server";

import MainBanner from "./MainBanner";
import { DEFAULT_HERO_FALLBACK_IMAGE_URL } from "@/lib/appearance/hero-banner";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MainbannerSectionProps {
  heading: ReactNode;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  classes?: string;
}

export default function MainbannerSection({
  heading,
  description,
  breadcrumbs,
  classes,
}: MainbannerSectionProps) {
  const bannerProps = {
    heading,
    description,
    breadcrumbs,
    classes,
  };

  return (
    <Suspense
      fallback={
        <MainBanner
          {...bannerProps}
          fallbackImageUrl={DEFAULT_HERO_FALLBACK_IMAGE_URL}
        />
      }
    >
      <DynamicMainBanner {...bannerProps} />
    </Suspense>
  );
}

async function DynamicMainBanner({
  heading,
  description,
  breadcrumbs,
  classes,
}: MainbannerSectionProps) {
  await connection();

  const { fallbackImageUrl } = await getHeroBannerSettings();

  return (
    <MainBanner
      heading={heading}
      description={description}
      breadcrumbs={breadcrumbs}
      fallbackImageUrl={fallbackImageUrl}
      classes={classes}
    />
  );
}
