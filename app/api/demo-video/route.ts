import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import {
  getDemoVideoSettings,
  saveDemoVideoSettings,
} from "@/lib/services/demo-video-settings";

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
    if (!(video instanceof File)) {
      return NextResponse.json(
        { message: "Select a video to upload." },
        { status: 400 },
      );
    }

    if (
      !video.type.startsWith("video/") ||
      video.size === 0 ||
      video.size > MAX_VIDEO_BYTES
    ) {
      return NextResponse.json(
        {
          message: `Choose a non-empty video under ${MAX_VIDEO_BYTES / MEGABYTE}MB.`,
        },
        { status: 400 },
      );
    }

    const currentSettings = await getDemoVideoSettings();
    let newPublicId: string | null = null;

    try {
      const uploaded = await uploadToCloudinary(
        Buffer.from(await video.arrayBuffer()),
        "demo-video",
        "video",
      );
      newPublicId = uploaded.public_id;
      await saveDemoVideoSettings({ videoPublicId: newPublicId });
    } catch (error) {
      console.error("Failed to upload demo video:", error);

      if (newPublicId) {
        try {
          await deleteFromCloudinary(newPublicId, "video");
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded demo video:",
            cleanupError,
          );
        }
      }

      return NextResponse.json(
        { message: "Could not upload demo video. Please try again." },
        { status: 500 },
      );
    }

    if (
      currentSettings.videoPublicId &&
      currentSettings.videoPublicId !== newPublicId
    ) {
      try {
        await deleteFromCloudinary(currentSettings.videoPublicId, "video");
      } catch (error) {
        console.error("Failed to delete previous demo video:", error);
      }
    }

    return NextResponse.json(
      {
        videoPublicId: newPublicId,
        videoUrl: getCloudinaryUrl(newPublicId, "video"),
      },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.appearanceManage },
);
