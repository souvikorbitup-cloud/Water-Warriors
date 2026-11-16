import "server-only";
import type { Collection } from "mongodb";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import {
  HERO_SLIDES_SETTINGS_ID,
  type HeroSlide,
  type HeroSlideView,
} from "@/lib/appearance/hero-slides";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";

type HeroSlidesDocument = {
  _id: string;
  slides?: HeroSlide[];
  updatedAt?: Date;
};

// Same collection as the other site settings, typed for the hero-slides
// document so $push / $pull / positional updates type-check.
async function getHeroSlidesCollection() {
  return (await getSiteSettingsCollection()) as unknown as Collection<HeroSlidesDocument>;
}

export function toHeroSlideView(slide: HeroSlide): HeroSlideView {
  return {
    ...slide,
    mediaUrl: getCloudinaryUrl(slide.mediaPublicId, slide.mediaType),
    posterUrl: slide.posterPublicId
      ? getCloudinaryUrl(slide.posterPublicId, "image")
      : null,
  };
}

async function readSlides(): Promise<HeroSlide[]> {
  const collection = await getHeroSlidesCollection();
  const doc = await collection.findOne({ _id: HERO_SLIDES_SETTINGS_ID });
  return Array.isArray(doc?.slides) ? doc.slides : [];
}

export async function getHeroSlides(): Promise<HeroSlideView[]> {
  return (await readSlides()).map(toHeroSlideView);
}

export async function getPublicHeroSlides(): Promise<HeroSlideView[]> {
  return (await readSlides()).filter((s) => s.isActive).map(toHeroSlideView);
}

export async function getHeroSlideById(id: string): Promise<HeroSlide | null> {
  return (await readSlides()).find((s) => s.id === id) ?? null;
}

export async function createHeroSlide(slide: HeroSlide) {
  const collection = await getHeroSlidesCollection();
  await collection.updateOne(
    { _id: HERO_SLIDES_SETTINGS_ID },
    { $push: { slides: slide }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function updateHeroSlide(slide: HeroSlide): Promise<boolean> {
  const collection = await getHeroSlidesCollection();
  const result = await collection.updateOne(
    { _id: HERO_SLIDES_SETTINGS_ID, "slides.id": slide.id },
    { $set: { "slides.$": slide, updatedAt: new Date() } },
  );
  return result.matchedCount > 0;
}

export async function deleteHeroSlide(id: string) {
  const collection = await getHeroSlidesCollection();
  await collection.updateOne(
    { _id: HERO_SLIDES_SETTINGS_ID },
    { $pull: { slides: { id } }, $set: { updatedAt: new Date() } },
  );
}

export async function reorderHeroSlides(ids: string[]) {
  const slides = await readSlides();
  const byId = new Map(slides.map((s) => [s.id, s]));
  const ordered = ids.flatMap((id) => byId.get(id) ?? []);
  const rest = slides.filter((s) => !ids.includes(s.id));
  const collection = await getHeroSlidesCollection();
  await collection.updateOne(
    { _id: HERO_SLIDES_SETTINGS_ID },
    { $set: { slides: [...ordered, ...rest], updatedAt: new Date() } },
    { upsert: true },
  );
}
