import "server-only";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import {
  DEFAULT_HERO_FALLBACK_IMAGE_URL,
  DEFAULT_HERO_VIDEO_URL,
  HERO_BANNER_SETTINGS_ID,
  type HeroBannerSettings,
} from "@/lib/appearance/hero-banner";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

type HeroBannerDocument = {
  _id: string;
  videoPublicId?: string | null;
  fallbackImagePublicId?: string | null;
  updatedAt?: Date;
};

export async function getHeroBannerSettings(): Promise<HeroBannerSettings> {
  const collection = await getSiteSettingsCollection();
  const document = await collection.findOne<HeroBannerDocument>({
    _id: HERO_BANNER_SETTINGS_ID,
  });
  const videoPublicId =
    typeof document?.videoPublicId === "string" ? document.videoPublicId : null;
  const fallbackImagePublicId =
    typeof document?.fallbackImagePublicId === "string"
      ? document.fallbackImagePublicId
      : null;

  return {
    videoPublicId,
    fallbackImagePublicId,
    videoUrl: videoPublicId
      ? getCloudinaryUrl(videoPublicId, "video")
      : DEFAULT_HERO_VIDEO_URL,
    fallbackImageUrl: fallbackImagePublicId
      ? getCloudinaryUrl(fallbackImagePublicId, "image")
      : DEFAULT_HERO_FALLBACK_IMAGE_URL,
  };
}

export async function saveHeroBannerSettings(
  settings: Pick<HeroBannerSettings, "videoPublicId" | "fallbackImagePublicId">,
): Promise<void> {
  const collection = await getSiteSettingsCollection();

  await collection.updateOne(
    { _id: HERO_BANNER_SETTINGS_ID },
    { $set: { ...settings, updatedAt: new Date() } },
    { upsert: true },
  );
}
