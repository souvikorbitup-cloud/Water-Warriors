export const HERO_BANNER_SETTINGS_ID = "hero-banner";
export const DEFAULT_HERO_VIDEO_URL = "/hero.mp4";
export const DEFAULT_HERO_FALLBACK_IMAGE_URL = "/hero-fallback.png";

export type HeroBannerSettings = {
  videoPublicId: string | null;
  fallbackImagePublicId: string | null;
  videoUrl: string;
  fallbackImageUrl: string;
};
