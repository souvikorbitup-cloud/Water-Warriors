import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db";
import Testimonial, { type ITestimonial } from "@/lib/models/Testimonial.model";
import { testimonialUpdateSchema } from "@/lib/content/schemas";
import { toTestimonialDetail } from "@/lib/content/query";
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
  isOptionalFile,
  parseBooleanField,
  parseJsonField,
  parseOptionalNumber,
  uploadContentImage,
  validateImageFile,
} from "@/lib/content/upload";
import { TESTIMONIAL_IMAGE_FOLDER } from "@/lib/content/constants";

export const GET = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await Testimonial.findById(id).lean<
      ITestimonial & { _id: unknown }
    >();
    if (!doc) return notFoundResponse("Testimonial");

    return NextResponse.json(
      { item: toTestimonialDetail(doc) },
      { headers: noStoreHeaders },
    );
  },
  { permission: PERMISSIONS.AllTestimonialsView },
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

    const image = form.get("image");
    if (!isOptionalFile(image)) {
      return NextResponse.json(
        { message: "Invalid image upload." },
        { status: 400 },
      );
    }

    const imageError = validateImageFile(image);
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectDB();
    const doc = await Testimonial.findById(id);
    if (!doc) return notFoundResponse("Testimonial");

    let uploadedPublicId: string | null = null;
    const removeImage = form.get("removeImage") === "true";

    try {
      if (image && image.size > 0) {
        const uploaded = await uploadContentImage(
          image,
          TESTIMONIAL_IMAGE_FOLDER,
        );
        uploadedPublicId = uploaded.public_id;
      }
    } catch (error) {
      console.error("Failed to upload testimonial image:", error);
      return NextResponse.json(
        { message: "Could not upload image. Please try again." },
        { status: 500 },
      );
    }

    const payload: Record<string, unknown> = {};
    if (form.has("fullName")) payload.fullName = form.get("fullName");
    if (form.has("order"))
      payload.order = parseOptionalNumber(form.get("order"));
    if (form.has("isPublished")) {
      payload.isPublished = parseBooleanField(form.get("isPublished"));
    }
    if (form.has("translations")) {
      payload.translations = parseJsonField(form.get("translations"));
    }
    if (uploadedPublicId) payload.imagePublicId = uploadedPublicId;
    else if (removeImage) payload.imagePublicId = null;

    const parsed = testimonialUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      await deleteContentImage(uploadedPublicId);
      return zodFailure(parsed.error);
    }

    const previousImage = doc.imagePublicId;

    try {
      Object.assign(doc, omitUndefined(parsed.data));
      doc.updatedBy = getAuthUserId(user.id);
      await doc.save();
    } catch (error) {
      await deleteContentImage(uploadedPublicId);
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to update testimonial:", error);
      return NextResponse.json(
        { message: "Could not update testimonial." },
        { status: 500 },
      );
    }

    if (
      (uploadedPublicId || removeImage) &&
      previousImage &&
      previousImage !== doc.imagePublicId
    ) {
      await deleteContentImage(previousImage);
    }

    return NextResponse.json({
      success: true,
      item: toTestimonialDetail(doc),
    });
  },
  { permission: PERMISSIONS.AllTestimonialsEdit },
);

export const DELETE = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const doc = await Testimonial.findById(id);
    if (!doc) return notFoundResponse("Testimonial");

    await doc.softDelete();
    return NextResponse.json({ success: true });
  },
  { permission: PERMISSIONS.AllTestimonialsEdit },
);
