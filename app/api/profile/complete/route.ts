import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  type ServerSessionUser,
} from "@/lib/auth/auth-server-utils";
import { getAuthUserCollection, getAuthUserId } from "@/lib/auth/auth";
import {
  isValidName,
  isValidIndianPhone,
  normalizeIndianPhone,
  sanitizeName,
} from "@/lib/auth/validation";
import { AuthError } from "@/lib/auth/auth-server-utils";

export async function POST(req: NextRequest) {
  let user: ServerSessionUser;
  try {
    user = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }
    throw err;
  }

  let body: { firstName?: string; lastName?: string; mobile?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  const firstName = sanitizeName(body.firstName ?? "");
  const lastName = sanitizeName(body.lastName ?? "");
  const mobileRaw = (body.mobile ?? "").trim();

  if (!isValidName(firstName) || !isValidName(lastName)) {
    return NextResponse.json(
      { message: "Please provide a valid first and last name." },
      { status: 400 },
    );
  }
  if (!isValidIndianPhone(mobileRaw)) {
    return NextResponse.json(
      { message: "Please provide a valid Indian phone number." },
      { status: 400 },
    );
  }

  const mobile = normalizeIndianPhone(mobileRaw) as string;
  const authUserId = getAuthUserId(user.id);

  const users = getAuthUserCollection();
  const existingPhoneOwner = await users.findOne({
    mobile,
    _id: { $ne: authUserId },
  });
  if (existingPhoneOwner) {
    return NextResponse.json(
      {
        message: "This phone number is already registered to another account.",
      },
      { status: 409 },
    );
  }

  const updateResult = await users.updateOne(
    { _id: authUserId },
    {
      $set: {
        firstName,
        lastName,
        mobile,
        isProfileComplete: true,
        updatedAt: new Date(),
      },
    },
  );

  if (updateResult.matchedCount !== 1) {
    return NextResponse.json(
      { message: "Authenticated user record not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
