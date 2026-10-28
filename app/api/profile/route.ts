import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserCollection, getAuthUserId } from "@/lib/auth/auth";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import {
  isValidName,
  isValidIndianPhone,
  normalizeIndianPhone,
  sanitizeName,
} from "@/lib/auth/validation";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const GET = withAuth(
  async (_req, { user }) => {
    return NextResponse.json({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      mobile: user.mobile ?? "",
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      profilePicUrl: user.profilePublicId
        ? getCloudinaryUrl(user.profilePublicId, "image")
        : null,
    });
  },
  { permission: PERMISSIONS.profileView },
);

const MAX_BYTES = process.env.NEXT_PUBLIC_MAX_AVATAR_MEGA_BYTES
  ? parseInt(process.env.NEXT_PUBLIC_MAX_AVATAR_MEGA_BYTES, 10) * 1024 * 1024
  : 5 * 1024 * 1024; // Default to 5MB if not set

/**
 * Updates name/mobile (JSON) and/or a new profile picture (multipart) for the
 * CURRENTLY authenticated user only — there is no userId in the body, it is
 * always derived from the verified server session, so one user can never
 * edit another's profile via this route.
 */
export const PATCH = withAuth(
  async (req: NextRequest, { user }) => {
    const contentType = req.headers.get("content-type") ?? "";
    const setFields: Record<string, unknown> = {};
    let previousProfilePublicId: string | null = null;

    async function applyPhone(rawPhone: string) {
      if (!isValidIndianPhone(rawPhone)) {
        return {
          ok: false as const,
          message: "Invalid Indian phone number.",
          status: 400,
        };
      }
      const mobile = normalizeIndianPhone(rawPhone) as string;

      const existingPhoneOwner = await getAuthUserCollection().findOne({
        mobile,
        _id: { $ne: getAuthUserId(user.id) },
      });

      if (existingPhoneOwner) {
        return {
          ok: false as const,
          message:
            "This phone number is already registered to another account.",
          status: 409,
        };
      }

      setFields.mobile = mobile;
      return { ok: true as const };
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const firstNameRaw = form.get("firstName");
      const lastNameRaw = form.get("lastName");
      const phoneRaw = form.get("mobile");
      const file = form.get("profilePic");

      if (typeof firstNameRaw === "string" && firstNameRaw.length > 0) {
        const firstName = sanitizeName(firstNameRaw);
        if (!isValidName(firstName)) {
          return NextResponse.json(
            { message: "Invalid first name." },
            { status: 400 },
          );
        }
        setFields.firstName = firstName;
      }

      if (typeof lastNameRaw === "string" && lastNameRaw.length > 0) {
        const lastName = sanitizeName(lastNameRaw);
        if (!isValidName(lastName)) {
          return NextResponse.json(
            { message: "Invalid last name." },
            { status: 400 },
          );
        }
        setFields.lastName = lastName;
      }

      if (typeof phoneRaw === "string" && phoneRaw.length > 0) {
        const result = await applyPhone(phoneRaw);
        if (!result.ok) {
          return NextResponse.json(
            { message: result.message },
            { status: result.status },
          );
        }
      }

      if (file instanceof File) {
        previousProfilePublicId = user.profilePublicId ?? null;
        if (file.size > MAX_BYTES) {
          return NextResponse.json(
            {
              message: "Image must be under " + MAX_BYTES / 1024 / 1024 + "MB.",
            },
            { status: 400 },
          );
        }
        if (!file.type.startsWith("image/")) {
          return NextResponse.json(
            { message: "File must be an image." },
            { status: 400 },
          );
        }

        const { public_id } = await uploadToCloudinary(
          Buffer.from(await file.arrayBuffer()),
          "user-profiles",
          "image",
        );
        // Store ONLY the Cloudinary public_id — never a URL
        setFields.profilePublicId = public_id;
      }
    } else {
      let body: { firstName?: string; lastName?: string; mobile?: string };
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { message: "Invalid request body." },
          { status: 400 },
        );
      }

      if (body.firstName !== undefined) {
        const firstName = sanitizeName(body.firstName);
        if (!isValidName(firstName)) {
          return NextResponse.json(
            { message: "Invalid first name." },
            { status: 400 },
          );
        }
        setFields.firstName = firstName;
      }

      if (body.lastName !== undefined) {
        const lastName = sanitizeName(body.lastName);
        if (!isValidName(lastName)) {
          return NextResponse.json(
            { message: "Invalid last name." },
            { status: 400 },
          );
        }
        setFields.lastName = lastName;
      }

      if (body.mobile !== undefined) {
        const result = await applyPhone(body.mobile);
        if (!result.ok) {
          return NextResponse.json(
            { message: result.message },
            { status: result.status },
          );
        }
      }
    }

    if (Object.keys(setFields).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updateResult = await getAuthUserCollection().updateOne(
      { _id: getAuthUserId(user.id) },
      { $set: { ...setFields, updatedAt: new Date() } },
    );

    if (updateResult.matchedCount !== 1) {
      return NextResponse.json(
        { message: "Authenticated user record not found." },
        { status: 404 },
      );
    }

    const newProfilePublicId = setFields.profilePublicId;
    if (
      typeof newProfilePublicId === "string" &&
      previousProfilePublicId &&
      previousProfilePublicId !== newProfilePublicId
    ) {
      try {
        await deleteFromCloudinary(previousProfilePublicId);
      } catch (error) {
        console.error(
          "Failed to delete previous profile image from Cloudinary:",
          error,
        );
      }
    }

    return NextResponse.json({ success: true });
  },
  { permission: PERMISSIONS.profileEdit },
);
