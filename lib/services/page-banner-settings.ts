import "server-only";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import {
  BANNER_LOCALES,
  BANNER_PAGES,
  PAGE_BANNERS_SETTINGS_ID,
  type BannerPage,
  type BannerText,
  type PageBannerMap,
  type PageBannerSettings,
} from "@/lib/appearance/page-banners";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

type StoredPage = {
  imagePublicId?: string | null;
  translations?: Record<string, Partial<BannerText>>;
};
type PageBannersDocument = {
  _id: string;
  pages?: Record<string, StoredPage>;
};

function normalize(stored?: StoredPage): PageBannerSettings {
  const imagePublicId =
    typeof stored?.imagePublicId === "string" ? stored.imagePublicId : null;
  const translations: PageBannerSettings["translations"] = {};
  for (const locale of BANNER_LOCALES) {
    const t = stored?.translations?.[locale];
    if (t) {
      translations[locale] = {
        heading: typeof t.heading === "string" ? t.heading : "",
        highlight: typeof t.highlight === "string" ? t.highlight : "",
        description: typeof t.description === "string" ? t.description : "",
      };
    }
  }
  return {
    imagePublicId,
    imageUrl: imagePublicId ? getCloudinaryUrl(imagePublicId, "image") : null,
    translations,
  };
}

export async function getAllPageBanners(): Promise<PageBannerMap> {
  const collection = await getSiteSettingsCollection();
  const doc = await collection.findOne<PageBannersDocument>({
    _id: PAGE_BANNERS_SETTINGS_ID,
  });
  return Object.fromEntries(
    BANNER_PAGES.map((p) => [p, normalize(doc?.pages?.[p])]),
  ) as PageBannerMap;
}

export async function getPageBanner(page: BannerPage) {
  const collection = await getSiteSettingsCollection();
  const doc = await collection.findOne<PageBannersDocument>({
    _id: PAGE_BANNERS_SETTINGS_ID,
  });
  return normalize(doc?.pages?.[page]);
}

export async function savePageBanner(
  page: BannerPage,
  data: {
    imagePublicId: string | null;
    translations: PageBannerSettings["translations"];
  },
) {
  const collection = await getSiteSettingsCollection();
  await collection.updateOne(
    { _id: PAGE_BANNERS_SETTINGS_ID },
    { $set: { [`pages.${page}`]: data, updatedAt: new Date() } },
    { upsert: true },
  );
}
