import { Suspense } from "react";
import { connection } from "next/server";
import {
  DEFAULT_HERO_FALLBACK_IMAGE_URL,
  DEFAULT_HERO_VIDEO_URL,
} from "@/lib/appearance/hero-banner";
import { getHeroBannerSettings } from "@/lib/services/hero-banner-settings";
import {
  HeroSection,
  IntroSection,
  LocationSection,
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
      <IntroSection />
      <LocationSection />
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
