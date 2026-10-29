import "server-only";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  isAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/appearance/settings";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

const SETTINGS_ID = "appearance";

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  const collection = await getSiteSettingsCollection();
  const document = await collection.findOne({ _id: SETTINGS_ID });

  if (!document) {
    return DEFAULT_APPEARANCE_SETTINGS;
  }

  const { _id, updatedAt, ...settings } = document;
  void _id;
  void updatedAt;

  if (!isAppearanceSettings(settings)) {
    throw new Error("Stored appearance settings are invalid.");
  }

  return settings;
}

export async function saveAppearanceSettings(
  settings: AppearanceSettings,
): Promise<void> {
  const collection = await getSiteSettingsCollection();

  await collection.updateOne(
    { _id: SETTINGS_ID },
    { $set: { ...settings, updatedAt: new Date() } },
    { upsert: true },
  );
}
