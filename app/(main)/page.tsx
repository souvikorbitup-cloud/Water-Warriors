import { Suspense } from "react";
import { connection } from "next/server";
import {
  DEFAULT_HERO_FALLBACK_IMAGE_URL,
  DEFAULT_HERO_VIDEO_URL,
} from "@/lib/appearance/hero-banner";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";
import { getDemoVideoSettings } from "@/lib/services/demo-video-settings";
import {
  DIYSection,
  HeroSection,
  IntroSection,
  LocationSection,
  TestimonialSection,
} from "@/components/main/sections/home";

export default function Home() {
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
      <TestimonialSection />
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
