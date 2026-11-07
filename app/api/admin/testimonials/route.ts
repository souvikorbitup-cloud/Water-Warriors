import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseContentListQuery } from "@/lib/content/query";
import { testimonialInputSchema } from "@/lib/content/schemas";
import {
  createTestimonial,
  listTestimonials,
} from "@/lib/content/testimonial-service";
import {
  duplicateKeyMessage,
  invalidBodyResponse,
  mongooseValidationMessage,
  noStoreHeaders,
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
  async (req: NextRequest) => {
    const query = parseContentListQuery(req.nextUrl.searchParams);
    const result = await listTestimonials(query);
    return NextResponse.json(result, { headers: noStoreHeaders });
  },
  { permission: PERMISSIONS.AllTestimonialsView },
);

export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return invalidBodyResponse();
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

    let imagePublicId: string | null = null;
    if (image && image.size > 0) {
      try {
        const uploaded = await uploadContentImage(
          image,
          TESTIMONIAL_IMAGE_FOLDER,
        );
        imagePublicId = uploaded.public_id;
      } catch (error) {
        console.error("Failed to upload testimonial image:", error);
        return NextResponse.json(
          { message: "Could not upload image. Please try again." },
          { status: 500 },
        );
      }
    }

    const parsed = testimonialInputSchema.safeParse({
      fullName: form.get("fullName"),
      order: parseOptionalNumber(form.get("order")),
      isPublished: parseBooleanField(form.get("isPublished")) ?? false,
      translations: parseJsonField(form.get("translations")),
      imagePublicId,
    });

    if (!parsed.success) {
      await deleteContentImage(imagePublicId);
      return zodFailure(parsed.error);
    }

    try {
      const item = await createTestimonial(parsed.data, getAuthUserId(user.id));
      return NextResponse.json({ success: true, item }, { status: 201 });
    } catch (error) {
      await deleteContentImage(imagePublicId);
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json({ message: duplicate }, { status: 409 });
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to create testimonial:", error);
      return NextResponse.json(
        { message: "Could not create testimonial." },
        { status: 500 },
      );
    }
  },
  { permission: PERMISSIONS.AllTestimonialsEdit },
);
