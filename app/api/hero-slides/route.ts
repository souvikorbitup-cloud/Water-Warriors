import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  HERO_LOCALES,
  HERO_SLIDE_LIMITS as LIMITS,
  MAX_HERO_SLIDES,
  isValidButtonUrl,
  type HeroSlide,
  type HeroSlideText,
} from "@/lib/appearance/hero-slides";
import {
  createHeroSlide,
  deleteHeroSlide,
  getHeroSlideById,
  getHeroSlides,
  reorderHeroSlides,
  toHeroSlideView,
  updateHeroSlide,
} from "@/lib/services/hero-slides";

const MEGABYTE = 1024 * 1024;
const maxBytes = (v: string | undefined, fallbackMb: number) => {
  const mb = Number(v);
  return (Number.isFinite(mb) && mb > 0 ? mb : fallbackMb) * MEGABYTE;
};
const MAX_VIDEO_BYTES = maxBytes(
  process.env.NEXT_PUBLIC_MAX_VIDEO_MEGA_BYTES,
  200,
);
const MAX_IMAGE_BYTES = maxBytes(
  process.env.NEXT_PUBLIC_MAX_PHOTO_MEGA_BYTES,
  10,
);

const noStore = { "Cache-Control": "no-store" };
const permission = { permission: PERMISSIONS.appearanceManage };
const bad = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

type MediaType = "image" | "video";
type SlideData = Pick<
  HeroSlide,
  "mediaType" | "isActive" | "buttonUrl" | "translations"
>;

async function readForm(request: NextRequest) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

function parseData(raw: FormDataEntryValue | null): SlideData | null {
  if (typeof raw !== "string") return null;
  try {
    const d = JSON.parse(raw);
    if (d.mediaType !== "image" && d.mediaType !== "video") return null;
    const buttonUrl = String(d.buttonUrl ?? "").trim();
    if (buttonUrl.length > LIMITS.buttonUrl || !isValidButtonUrl(buttonUrl)) {
      return null;
    }
    const translations: HeroSlide["translations"] = {};
    for (const locale of HERO_LOCALES) {
      const t = d.translations?.[locale];
      if (!t) continue;
      const value: HeroSlideText = {
        title: String(t.title ?? "").trim(),
        description: String(t.description ?? "").trim(),
        buttonLabel: String(t.buttonLabel ?? "").trim(),
      };
      if (
        value.title.length > LIMITS.title ||
        value.description.length > LIMITS.description ||
        value.buttonLabel.length > LIMITS.buttonLabel
      ) {
        return null;
      }
      translations[locale] = value;
    }
    if (!translations.en?.title) return null; // English is the fallback
    return {
      mediaType: d.mediaType,
      isActive: d.isActive !== false,
      buttonUrl,
      translations,
    };
  } catch {
    return null;
  }
}

function fileError(file: File, type: MediaType): string | null {
  const limit = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (
    !file.type.startsWith(`${type}/`) ||
    file.size === 0 ||
    file.size > limit
  ) {
    return `Choose a non-empty ${type} under ${limit / MEGABYTE}MB.`;
  }
  return null;
}

async function upload(file: File, type: MediaType) {
  const uploaded = await uploadToCloudinary(
    Buffer.from(await file.arrayBuffer()),
    "hero-slides",
    type,
  );
  return uploaded.public_id as string;
}

async function removeAsset(publicId: string | null, type: MediaType) {
  if (!publicId) return;
  try {
    await deleteFromCloudinary(publicId, type);
  } catch (error) {
    console.error("Failed to delete hero slide asset:", error);
  }
}

const INVALID_DATA = "Invalid slide data. An English title is required.";

export const POST = withAuth(async (request: NextRequest) => {
  const form = await readForm(request);
  if (!form) return bad("Invalid upload request.");

  const data = parseData(form.get("data"));
  if (!data) return bad(INVALID_DATA);

  const media = form.get("media");
  const poster = form.get("poster");
  if (!(media instanceof File))
    return bad("Choose an image or video for this slide.");
  if (poster !== null && !(poster instanceof File))
    return bad("Invalid poster image.");

  const error =
    fileError(media, data.mediaType) ??
    (poster ? fileError(poster, "image") : null);
  if (error) return bad(error);

  if ((await getHeroSlides()).length >= MAX_HERO_SLIDES) {
    return bad(`You can have up to ${MAX_HERO_SLIDES} slides.`);
  }

  const uploaded: { id: string; type: MediaType }[] = [];
  try {
    const mediaPublicId = await upload(media, data.mediaType);
    uploaded.push({ id: mediaPublicId, type: data.mediaType });

    let posterPublicId: string | null = null;
    if (poster && data.mediaType === "video") {
      posterPublicId = await upload(poster, "image");
      uploaded.push({ id: posterPublicId, type: "image" });
    }

    const slide: HeroSlide = {
      id: crypto.randomUUID(),
      ...data,
      mediaPublicId,
      posterPublicId,
    };
    await createHeroSlide(slide);
    return NextResponse.json(toHeroSlideView(slide), {
      status: 201,
      headers: noStore,
    });
  } catch (e) {
    console.error("Failed to create hero slide:", e);
    for (const a of uploaded) await removeAsset(a.id, a.type);
    return bad("Could not create the slide. Please try again.", 500);
  }
}, permission);

export const PUT = withAuth(async (request: NextRequest) => {
  const form = await readForm(request);
  if (!form) return bad("Invalid upload request.");

  const id = form.get("id");
  if (typeof id !== "string") return bad("Missing slide id.");
  const existing = await getHeroSlideById(id);
  if (!existing) return bad("Slide not found.", 404);

  const data = parseData(form.get("data"));
  if (!data) return bad(INVALID_DATA);

  const media = form.get("media");
  const poster = form.get("poster");
  const removePoster = form.get("removePoster") === "true";
  if (media !== null && !(media instanceof File)) return bad("Invalid media.");
  if (poster !== null && !(poster instanceof File))
    return bad("Invalid poster image.");

  if (data.mediaType !== existing.mediaType && !media) {
    return bad("Upload a new file when switching between image and video.");
  }
  const error =
    (media ? fileError(media, data.mediaType) : null) ??
    (poster ? fileError(poster, "image") : null);
  if (error) return bad(error);

  const uploaded: { id: string; type: MediaType }[] = [];
  try {
    let mediaPublicId = existing.mediaPublicId;
    if (media) {
      mediaPublicId = await upload(media, data.mediaType);
      uploaded.push({ id: mediaPublicId, type: data.mediaType });
    }

    let posterPublicId = existing.posterPublicId;
    if (data.mediaType === "image" || removePoster) {
      posterPublicId = null;
    }
    if (poster && data.mediaType === "video") {
      posterPublicId = await upload(poster, "image");
      uploaded.push({ id: posterPublicId, type: "image" });
    }

    const slide: HeroSlide = { id, ...data, mediaPublicId, posterPublicId };
    if (!(await updateHeroSlide(slide))) {
      throw new Error("Slide disappeared during update.");
    }

    if (mediaPublicId !== existing.mediaPublicId) {
      await removeAsset(existing.mediaPublicId, existing.mediaType);
    }
    if (posterPublicId !== existing.posterPublicId) {
      await removeAsset(existing.posterPublicId, "image");
    }
    return NextResponse.json(toHeroSlideView(slide), { headers: noStore });
  } catch (e) {
    console.error("Failed to update hero slide:", e);
    for (const a of uploaded) await removeAsset(a.id, a.type);
    return bad("Could not update the slide. Please try again.", 500);
  }
}, permission);

export const DELETE = withAuth(async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return bad("Missing slide id.");
  const existing = await getHeroSlideById(id);
  if (!existing) return bad("Slide not found.", 404);

  try {
    await deleteHeroSlide(id);
  } catch (e) {
    console.error("Failed to delete hero slide:", e);
    return bad("Could not delete the slide. Please try again.", 500);
  }
  await removeAsset(existing.mediaPublicId, existing.mediaType);
  await removeAsset(existing.posterPublicId, "image");
  return NextResponse.json({ ok: true }, { headers: noStore });
}, permission);

export const PATCH = withAuth(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  if (!Array.isArray(ids) || !ids.every((i) => typeof i === "string")) {
    return bad("Invalid order.");
  }
  try {
    await reorderHeroSlides(ids);
  } catch (e) {
    console.error("Failed to reorder hero slides:", e);
    return bad("Could not reorder slides.", 500);
  }
  return NextResponse.json(await getHeroSlides(), { headers: noStore });
}, permission);
