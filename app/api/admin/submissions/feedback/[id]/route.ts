import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withAuth } from "@/lib/auth/with-auth";
import { getAuthUserId } from "@/lib/auth/auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db";
import FeedbackSubmission, {
  type IFeedbackSubmission,
} from "@/lib/models/FeedbackSubmission.model";
import {
  feedbackAdminUpdateSchema,
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";
import { toFeedbackListItem } from "@/lib/submissions/query";

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
    const doc = await FeedbackSubmission.findById(id).lean<
      IFeedbackSubmission & { _id: unknown }
    >();
    if (!doc) {
      return NextResponse.json(
        { message: "Submission not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item: toFeedbackListItem(doc) });
  },
  { permission: PERMISSIONS.AllFeedbackSubmissionsView },
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

    const parsed = feedbackAdminUpdateSchema.safeParse(body);
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
    const doc = await FeedbackSubmission.findById(id);
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
      item: toFeedbackListItem(doc),
    });
  },
  { permission: PERMISSIONS.AllFeedbackSubmissionsEdit },
);
