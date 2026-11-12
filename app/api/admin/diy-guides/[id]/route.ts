import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db";
import DiyGuide, {
  isYouTubeUrl,
  type IDiyGuide,
} from "@/lib/models/Diyguide.model";
import { diyGuideUpdateSchema } from "@/lib/content/schemas";
import { toDiyGuideDetail } from "@/lib/content/query";
import {
  duplicateKeyMessage,
  invalidIdResponse,
  isValidObjectId,
  mongooseValidationMessage,
  notFoundResponse,
  noStoreHeaders,
  omitUndefined,
  zodFailure,
} from "@/lib/content/http";
import {
  deleteContentImage,
  deleteContentVideo,
  isOptionalFile,
  parseBooleanField,
  parseJsonField,
  parseOptionalNumber,
  uploadContentImage,
  uploadContentVideo,
  validateImageFile,
  validateVideoFile,
} from "@/lib/content/upload";
import {
  DIY_GUIDE_THUMBNAIL_FOLDER,
  DIY_GUIDE_VIDEO_FOLDER,
} from "@/lib/content/constants";

function uploadedPublicId(
  media?: { source?: string; publicId?: string | null } | null,
) {
  return media?.source === "upload" ? (media.publicId ?? null) : null;
}

export const GET = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await DiyGuide.findById(id).lean<
      IDiyGuide & { _id: unknown }
    >();
    if (!doc) return notFoundResponse("DIY guide");

    return NextResponse.json(
      { item: toDiyGuideDetail(doc) },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.AllDIYGuidesView },
);

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const videoFile = form.get("videoFile");
    const thumbnailFile = form.get("thumbnailFile");
    if (!isOptionalFile(videoFile) || !isOptionalFile(thumbnailFile)) {
      return NextResponse.json(
        { message: "Invalid media upload." },
        { status: 400 },
      );
    }

    const videoError = validateVideoFile(videoFile);
    if (videoError) {
      return NextResponse.json({ message: videoError }, { status: 400 });
    }
    const thumbnailError = validateImageFile(thumbnailFile);
    if (thumbnailError) {
      return NextResponse.json({ message: thumbnailError }, { status: 400 });
    }

    await connectDB();
    const doc = await DiyGuide.findById(id);
    if (!doc) return notFoundResponse("DIY guide");

    let uploadedVideoId: string | null = null;
    let uploadedThumbnailId: string | null = null;
    const removeThumbnail = form.get("removeThumbnail") === "true";

    try {
      if (videoFile && videoFile.size > 0) {
        const uploaded = await uploadContentVideo(
          videoFile,
          DIY_GUIDE_VIDEO_FOLDER,
        );
        uploadedVideoId = uploaded.public_id;
      }
      if (thumbnailFile && thumbnailFile.size > 0) {
        const uploaded = await uploadContentImage(
          thumbnailFile,
          DIY_GUIDE_THUMBNAIL_FOLDER,
        );
        uploadedThumbnailId = uploaded.public_id;
      }
    } catch (error) {
      console.error("Failed to upload DIY guide media:", error);
      await deleteContentVideo(uploadedVideoId);
      await deleteContentImage(uploadedThumbnailId);
      return NextResponse.json(
        { message: "Could not upload media. Please try again." },
        { status: 500 },
      );
    }

    const payload: Record<string, unknown> = {};
    if (form.has("slug")) payload.slug = form.get("slug") || undefined;
    if (form.has("order"))
      payload.order = parseOptionalNumber(form.get("order"));
    if (form.has("isPublished")) {
      payload.isPublished = parseBooleanField(form.get("isPublished"));
    }
    if (form.has("durationSeconds")) {
      payload.durationSeconds =
        parseOptionalNumber(form.get("durationSeconds")) ?? null;
    }
    if (form.has("publishedAt")) {
      payload.publishedAt = form.get("publishedAt") || null;
    }
    if (form.has("translations")) {
      payload.translations = parseJsonField(form.get("translations"));
    }
    if (uploadedVideoId) {
      payload.video = {
        source: "upload",
        publicId: uploadedVideoId,
        externalUrl: null,
      };
    } else if (form.has("video")) {
      payload.video = parseJsonField(form.get("video"));
    }
    if (uploadedThumbnailId) {
      payload.thumbnail = {
        source: "upload",
        publicId: uploadedThumbnailId,
        externalUrl: null,
      };
    } else if (removeThumbnail) {
      payload.thumbnail = null;
    } else if (form.has("thumbnail")) {
      payload.thumbnail = parseJsonField(form.get("thumbnail"));
    }

    const parsed = diyGuideUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      await deleteContentVideo(uploadedVideoId);
      await deleteContentImage(uploadedThumbnailId);
      return zodFailure(parsed.error);
    }

    const previousVideoId = uploadedPublicId(doc.video);
    const previousThumbnailId = uploadedPublicId(doc.thumbnail);
    const nextVideo = parsed.data.video ?? doc.video;
    const youtubeVideo =
      nextVideo?.source === "external" && isYouTubeUrl(nextVideo.externalUrl);
    const nextThumbnail =
      "thumbnail" in parsed.data ? parsed.data.thumbnail : doc.thumbnail;
    const hasThumbnail = Boolean(
      nextThumbnail?.publicId || nextThumbnail?.externalUrl,
    );
    if (!hasThumbnail && !youtubeVideo) {
      await deleteContentVideo(uploadedVideoId);
      await deleteContentImage(uploadedThumbnailId);
      return NextResponse.json(
        {
          message: "Thumbnail is required unless the video is a YouTube URL",
          fieldErrors: {
            thumbnail:
              "Thumbnail is required unless the video is a YouTube URL",
          },
        },
        { status: 400 },
      );
    }

    try {
      const { thumbnail, ...rest } = parsed.data;
      Object.assign(doc, omitUndefined(rest as Record<string, unknown>));
      if ("thumbnail" in parsed.data) {
        if (thumbnail) doc.thumbnail = thumbnail;
        else doc.set("thumbnail", undefined);
      }
      doc.updatedBy = getAuthUserId(user.id);
      await doc.save();
    } catch (error) {
      await deleteContentVideo(uploadedVideoId);
      await deleteContentImage(uploadedThumbnailId);
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to update DIY guide:", error);
      return NextResponse.json(
        { message: "Could not update DIY guide." },
        { status: 500 },
      );
    }

    const nextVideoId = uploadedPublicId(doc.video);
    const nextThumbnailId = uploadedPublicId(doc.thumbnail);
    if (previousVideoId && previousVideoId !== nextVideoId) {
      await deleteContentVideo(previousVideoId);
    }
    if (previousThumbnailId && previousThumbnailId !== nextThumbnailId) {
      await deleteContentImage(previousThumbnailId);
    }

    return NextResponse.json({
      success: true,
      item: toDiyGuideDetail(doc),
    });
  },
  { permission: PERMISSIONS.AllDIYGuidesEdit },
);

export const DELETE = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await DiyGuide.findById(id);
    if (!doc) return notFoundResponse("DIY guide");

    await doc.softDelete();
    return NextResponse.json({ success: true });
  },
  { permission: PERMISSIONS.AllDIYGuidesEdit },
);
