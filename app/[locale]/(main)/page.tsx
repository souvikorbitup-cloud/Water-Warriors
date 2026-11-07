import { Suspense } from "react";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import {
  DEFAULT_HERO_FALLBACK_IMAGE_URL,
  DEFAULT_HERO_VIDEO_URL,
} from "@/lib/appearance/hero-banner";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";
import { getDemoVideoSettings } from "@/lib/services/demo-video-settings";
import { getPublicTestimonials } from "@/lib/content/testimonial-service";
import {
  DIYSection,
  HeroSection,
  IntroSection,
  LocationSection,
  TestimonialSection,
} from "@/components/main/sections/home";
import TestimonialSectionSkeleton from "@/components/main/sections/home/TestimonialSectionSkeleton";
import { localePageMetadata } from "@/i18n/seo";
import { getAppLocale } from "@/i18n/get-app-locale";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return localePageMetadata({
    locale,
    href: "/",
    titleKey: "homeTitle",
    descriptionKey: "homeDescription",
  });
}

export default async function Home({ params }: PageProps) {
  const locale = getAppLocale((await params).locale);
  setRequestLocale(locale);

  return (
    <>
      <Suspense
        fallback={
          <HeroSection
            videoUrl={DEFAULT_HERO_VIDEO_URL}
            fallbackImageUrl={DEFAULT_HERO_FALLBACK_IMAGE_URL}
          />
        }
      >
        <HeroBanner />
      </Suspense>
      <Suspense fallback={<IntroSection />}>
        <DemoIntro />
      </Suspense>
      <LocationSection />
      <Suspense fallback={<TestimonialSectionSkeleton />}>
        <HomeTestimonials locale={locale} />
      </Suspense>
      <DIYSection />
    </>
  );
}

async function HeroBanner() {
  await connection();
  const heroBannerSettings = await getHeroBannerSettings();

  return (
    <HeroSection
      videoUrl={heroBannerSettings.videoUrl}
      fallbackImageUrl={heroBannerSettings.fallbackImageUrl}
    />
  );
}

async function DemoIntro() {
  await connection();
  const demoVideoSettings = await getDemoVideoSettings();

  return <IntroSection demoVideoUrl={demoVideoSettings.videoUrl} />;
}

async function HomeTestimonials({ locale }: { locale: string }) {
  await connection();
  const testimonials = await getPublicTestimonials(locale);
  return <TestimonialSection testimonials={testimonials} />;
}
