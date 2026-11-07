import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseContentListQuery } from "@/lib/content/query";
import { teamMemberInputSchema } from "@/lib/content/schemas";
import {
  createTeamMember,
  listTeamMembers,
} from "@/lib/content/team-member-service";
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
import { TEAM_MEMBER_IMAGE_FOLDER } from "@/lib/content/constants";

export const GET = withAuth(
  async (req: NextRequest) => {
    const query = parseContentListQuery(req.nextUrl.searchParams);
    const result = await listTeamMembers(query);
    return NextResponse.json(result, { headers: noStoreHeaders });
  },
  { permission: PERMISSIONS.AllTeamMembersView },
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

    let avatarPublicId: string | null = null;
    if (image && image.size > 0) {
      try {
        const uploaded = await uploadContentImage(
          image,
          TEAM_MEMBER_IMAGE_FOLDER,
        );
        avatarPublicId = uploaded.public_id;
      } catch (error) {
        console.error("Failed to upload team member image:", error);
        return NextResponse.json(
          { message: "Could not upload image. Please try again." },
          { status: 500 },
        );
      }
    }

    const parsed = teamMemberInputSchema.safeParse({
      group: form.get("group"),
      fullName: form.get("fullName"),
      slug: form.get("slug"),
      order: parseOptionalNumber(form.get("order")),
      isPublished: parseBooleanField(form.get("isPublished")) ?? false,
      translations: parseJsonField(form.get("translations")),
      avatarPublicId,
    });

    if (!parsed.success) {
      await deleteContentImage(avatarPublicId);
      return zodFailure(parsed.error);
    }

    try {
      const item = await createTeamMember(parsed.data, getAuthUserId(user.id));
      return NextResponse.json({ success: true, item }, { status: 201 });
    } catch (error) {
      await deleteContentImage(avatarPublicId);
      const duplicate = duplicateKeyMessage(error);
      if (duplicate) {
        return NextResponse.json(
          { message: "A team member with this slug already exists." },
          { status: 409 },
        );
      }
      const validation = mongooseValidationMessage(error);
      if (validation) {
        return NextResponse.json({ message: validation }, { status: 400 });
      }
      console.error("Failed to create team member:", error);
      return NextResponse.json(
        { message: "Could not create team member." },
        { status: 500 },
      );
    }
  },
  { permission: PERMISSIONS.AllTeamMembersEdit },
);
