import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db";
import ContactSubmission, {
  type IContactSubmission,
} from "@/lib/models/ContactSubmission.model";
import {
  contactAdminUpdateSchema,
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";
import { toContactListItem } from "@/lib/submissions/query";

export const GET = withAuth(
  async (_req, { params }) => {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Submission not found." },
        { status: 404 },
      );
    }

    await connectDB();
    const doc = await ContactSubmission.findById(id).lean<
      IContactSubmission & { _id: unknown }
    >();
    if (!doc) {
      return NextResponse.json(
        { message: "Submission not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item: toContactListItem(doc) });
  },
  { permission: PERMISSIONS.AllContactUsSubmissionsView },
);

export const PATCH = withAuth(
  async (req: NextRequest, { user, params }) => {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Submission not found." },
        { status: 404 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = contactAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: firstZodErrorMessage(parsed.error),
          fieldErrors: zodErrorToFieldErrors(parsed.error),
        },
        { status: 400 },
      );
    }

    await connectDB();
    const doc = await ContactSubmission.findById(id);
    if (!doc) {
      return NextResponse.json(
        { message: "Submission not found." },
        { status: 404 },
      );
    }

    if (parsed.data.status) {
      doc.status = parsed.data.status;
    }
    if (parsed.data.adminNote !== undefined) {
      doc.adminNote = parsed.data.adminNote;
    }
    doc.handledBy = getAuthUserId(user.id);
    await doc.save();

    return NextResponse.json({
      success: true,
      item: toContactListItem(doc),
    });
  },
  { permission: PERMISSIONS.AllContactUsSubmissionsEdit },
);
