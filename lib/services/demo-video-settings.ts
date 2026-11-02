import "server-only";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import {
  DEMO_VIDEO_SETTINGS_ID,
  type DemoVideoSettings,
} from "@/lib/appearance/demo-video";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

type DemoVideoDocument = {
  _id: string;
  videoPublicId?: string | null;
  updatedAt?: Date;
};

export async function getDemoVideoSettings(): Promise<DemoVideoSettings> {
  const collection = await getSiteSettingsCollection();
  const document = await collection.findOne<DemoVideoDocument>({
    _id: DEMO_VIDEO_SETTINGS_ID,
  });
  const videoPublicId =
    typeof document?.videoPublicId === "string" ? document.videoPublicId : null;

  return {
    videoPublicId,
    videoUrl: videoPublicId ? getCloudinaryUrl(videoPublicId, "video") : null,
  };
}

export async function saveDemoVideoSettings(
  settings: Pick<DemoVideoSettings, "videoPublicId">,
): Promise<void> {
  const collection = await getSiteSettingsCollection();

  await collection.updateOne(
    { _id: DEMO_VIDEO_SETTINGS_ID },
    { $set: { ...settings, updatedAt: new Date() } },
    { upsert: true },
  );
}
