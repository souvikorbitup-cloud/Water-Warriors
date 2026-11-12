import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseContentListQuery } from "@/lib/content/query";
import { diyGuideInputSchema } from "@/lib/content/schemas";
import { createDiyGuide, listDiyGuides } from "@/lib/content/diy-guide-service";
import {
  duplicateKeyMessage,
  invalidBodyResponse,
  mongooseValidationMessage,
  noStoreHeaders,
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

export const GET = withAuth(
  async (req: NextRequest) => {
    const query = parseContentListQuery(req.nextUrl.searchParams);
    const result = await listDiyGuides(query);
    return NextResponse.json(result, { headers: noStoreHeaders });
  },
  { permission: PERMISSIONS.AllDIYGuidesView },
);

export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return invalidBodyResponse();
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

    let videoPublicId: string | null = null;
    let thumbnailPublicId: string | null = null;

    try {
      if (videoFile && videoFile.size > 0) {
        const uploaded = await uploadContentVideo(
          videoFile,
          DIY_GUIDE_VIDEO_FOLDER,
        );
        videoPublicId = uploaded.public_id;
      }
      if (thumbnailFile && thumbnailFile.size > 0) {
        const uploaded = await uploadContentImage(
          thumbnailFile,
          DIY_GUIDE_THUMBNAIL_FOLDER,
        );
        thumbnailPublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error("Failed to upload DIY guide media:", error);
      await deleteContentVideo(videoPublicId);
      await deleteContentImage(thumbnailPublicId);
      return NextResponse.json(
        { message: "Could not upload media. Please try again." },
        { status: 500 },
      );
    }

    const video = parseJsonField(form.get("video"));
    const thumbnail = parseJsonField(form.get("thumbnail"));
    const payload = {
      slug: form.get("slug") || undefined,
      video: videoPublicId
        ? { source: "upload", publicId: videoPublicId, externalUrl: null }
        : video,
      thumbnail: thumbnailPublicId
        ? {
            source: "upload",
            publicId: thumbnailPublicId,
            externalUrl: null,
          }
        : thumbnail === undefined
          ? undefined
          : thumbnail,
      durationSeconds: parseOptionalNumber(form.get("durationSeconds")),
      publishedAt: form.get("publishedAt") || undefined,
      order: parseOptionalNumber(form.get("order")),
      isPublished: parseBooleanField(form.get("isPublished")) ?? false,
      translations: parseJsonField(form.get("translations")),
    };

    const parsed = diyGuideInputSchema.safeParse(payload);
    if (!parsed.success) {
      await deleteContentVideo(videoPublicId);
      await deleteContentImage(thumbnailPublicId);
      return zodFailure(parsed.error);
    }

    try {
      const item = await createDiyGuide(parsed.data, getAuthUserId(user.id));
      return NextResponse.json({ success: true, item }, { status: 201 });
    } catch (error) {
      await deleteContentVideo(videoPublicId);
      await deleteContentImage(thumbnailPublicId);
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to create DIY guide:", error);
      return NextResponse.json(
        { message: "Could not create DIY guide." },
        { status: 500 },
      );
    }
  },
  { permission: PERMISSIONS.AllDIYGuidesEdit },
);
