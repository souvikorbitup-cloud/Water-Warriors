import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  BANNER_LIMITS,
  BANNER_LOCALES,
  isBannerPage,
  type BannerText,
  type PageBannerSettings,
} from "@/lib/appearance/page-banners";
import {
  getPageBanner,
  savePageBanner,
} from "@/lib/services/page-banner-settings";

const MAX_IMAGE_BYTES =
  (Number(process.env.NEXT_PUBLIC_MAX_PHOTO_MEGA_BYTES) || 10) * 1024 * 1024;
const noStore = { "Cache-Control": "no-store" };

const bad = (message: string) =>
  NextResponse.json({ message }, { status: 400 });

function parseTranslations(
  raw: unknown,
): PageBannerSettings["translations"] | null {
  if (typeof raw !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const out: PageBannerSettings["translations"] = {};
  for (const locale of BANNER_LOCALES) {
    const t = (parsed as Record<string, Partial<BannerText>>)[locale];
    if (!t) continue;
    const heading = String(t.heading ?? "").trim();
    const highlight = String(t.highlight ?? "").trim();
    const description = String(t.description ?? "").trim();
    if (
      heading.length > BANNER_LIMITS.heading ||
      highlight.length > BANNER_LIMITS.highlight ||
      description.length > BANNER_LIMITS.description
    ) {
      return null;
    }
    out[locale] = { heading, highlight, description };
  }
  return out;
}

export const PUT = withAuth(
  async (request: NextRequest) => {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return bad("Invalid upload request.");
    }

    const page = form.get("page");
    if (!isBannerPage(page)) return bad("Unknown page.");

    const translations = parseTranslations(form.get("translations"));
    if (!translations) return bad("Invalid or too-long banner text.");

    const image = form.get("image");
    const removeImage = form.get("removeImage") === "true";
    if (image !== null && !(image instanceof File))
      return bad("Invalid image.");
    if (
      image &&
      (!image.type.startsWith("image/") ||
        image.size === 0 ||
        image.size > MAX_IMAGE_BYTES)
    ) {
      return bad(
        `Choose a non-empty image under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`,
      );
    }

    const current = await getPageBanner(page);
    let imagePublicId = removeImage ? null : current.imagePublicId;
    let uploadedId: string | null = null;

    try {
      if (image) {
        const uploaded = await uploadToCloudinary(
          Buffer.from(await image.arrayBuffer()),
          "page-banners",
          "image",
        );
        uploadedId = uploaded.public_id;
        imagePublicId = uploaded.public_id;
      }
      await savePageBanner(page, { imagePublicId, translations });
    } catch (error) {
      console.error("Failed to save page banner:", error);
      if (uploadedId) {
        await deleteFromCloudinary(uploadedId, "image").catch(() => {});
      }
      return NextResponse.json(
        { message: "Could not save banner. Please try again." },
        { status: 500 },
      );
    }

    if (current.imagePublicId && current.imagePublicId !== imagePublicId) {
      await deleteFromCloudinary(current.imagePublicId, "image").catch((e) =>
        console.error("Failed to delete previous banner image:", e),
      );
    }

    return NextResponse.json(await getPageBanner(page), { headers: noStore });
  },
  { permission: PERMISSIONS.appearanceManage },
);
