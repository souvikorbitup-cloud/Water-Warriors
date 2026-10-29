import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  getHeroBannerSettings,
  saveHeroBannerSettings,
} from "@/lib/services/hero-banner-settings";

const noStoreHeaders = { "Cache-Control": "no-store" };
const MEGABYTE = 1024 * 1024;

function getMaxUploadBytes(
  value: string | undefined,
  defaultMegabytes: number,
) {
  const megabytes = Number(value);
  return Number.isFinite(megabytes) && megabytes > 0
    ? megabytes * MEGABYTE
    : defaultMegabytes * MEGABYTE;
}

const MAX_VIDEO_BYTES = getMaxUploadBytes(
  process.env.NEXT_PUBLIC_MAX_VIDEO_MEGA_BYTES,
  200,
);
const MAX_IMAGE_BYTES = getMaxUploadBytes(
  process.env.NEXT_PUBLIC_MAX_PHOTO_MEGA_BYTES,
  10,
);

function isOptionalFile(
  value: FormDataEntryValue | null,
): value is File | null {
  return value === null || value instanceof File;
}

export const PUT = withAuth(
  async (request: NextRequest) => {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "Invalid upload request." },
        { status: 400 },
      );
    }

    const video = form.get("video");
    const fallbackImage = form.get("fallbackImage");
    if (!isOptionalFile(video) || !isOptionalFile(fallbackImage)) {
      return NextResponse.json(
        { message: "Invalid hero media upload." },
        { status: 400 },
      );
    }

    if (!video && !fallbackImage) {
      return NextResponse.json(
        { message: "Select a video or fallback image to upload." },
        { status: 400 },
      );
    }

    if (
      video &&
      (!video.type.startsWith("video/") ||
        video.size === 0 ||
        video.size > MAX_VIDEO_BYTES)
    ) {
      return NextResponse.json(
        {
          message: `Choose a non-empty video under ${MAX_VIDEO_BYTES / MEGABYTE}MB.`,
        },
        { status: 400 },
      );
    }

    if (
      fallbackImage &&
      (!fallbackImage.type.startsWith("image/") ||
        fallbackImage.size === 0 ||
        fallbackImage.size > MAX_IMAGE_BYTES)
    ) {
      return NextResponse.json(
        {
          message: `Choose a non-empty image under ${MAX_IMAGE_BYTES / MEGABYTE}MB.`,
        },
        { status: 400 },
      );
    }

    const currentSettings = await getHeroBannerSettings();
    let videoPublicId = currentSettings.videoPublicId;
    let fallbackImagePublicId = currentSettings.fallbackImagePublicId;
    const uploadedAssets: {
      publicId: string;
      resourceType: "image" | "video";
    }[] = [];

    try {
      if (video) {
        const uploaded = await uploadToCloudinary(
          Buffer.from(await video.arrayBuffer()),
          "hero-banner",
          "video",
        );
        videoPublicId = uploaded.public_id;
        uploadedAssets.push({
          publicId: uploaded.public_id,
          resourceType: "video",
        });
      }

      if (fallbackImage) {
        const uploaded = await uploadToCloudinary(
          Buffer.from(await fallbackImage.arrayBuffer()),
          "hero-banner",
          "image",
        );
        fallbackImagePublicId = uploaded.public_id;
        uploadedAssets.push({
          publicId: uploaded.public_id,
          resourceType: "image",
        });
      }

      await saveHeroBannerSettings({ videoPublicId, fallbackImagePublicId });
    } catch (error) {
      console.error("Failed to upload hero banner media:", error);

      for (const asset of uploadedAssets) {
        try {
          await deleteFromCloudinary(asset.publicId, asset.resourceType);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded hero media:",
            cleanupError,
          );
        }
      }

      return NextResponse.json(
        { message: "Could not upload hero media. Please try again." },
        { status: 500 },
      );
    }

    if (
      videoPublicId &&
      videoPublicId !== currentSettings.videoPublicId &&
      currentSettings.videoPublicId
    ) {
      try {
        await deleteFromCloudinary(currentSettings.videoPublicId, "video");
      } catch (error) {
        console.error("Failed to delete previous hero video:", error);
      }
    }

    if (
      fallbackImagePublicId &&
      fallbackImagePublicId !== currentSettings.fallbackImagePublicId &&
      currentSettings.fallbackImagePublicId
    ) {
      try {
        await deleteFromCloudinary(
          currentSettings.fallbackImagePublicId,
          "image",
        );
      } catch (error) {
        console.error("Failed to delete previous hero fallback image:", error);
      }
    }

    return NextResponse.json(
      {
        videoPublicId,
        fallbackImagePublicId,
        videoUrl: videoPublicId
          ? getCloudinaryUrl(videoPublicId, "video")
          : currentSettings.videoUrl,
        fallbackImageUrl: fallbackImagePublicId
          ? getCloudinaryUrl(fallbackImagePublicId, "image")
          : currentSettings.fallbackImageUrl,
      },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.appearanceManage },
);
