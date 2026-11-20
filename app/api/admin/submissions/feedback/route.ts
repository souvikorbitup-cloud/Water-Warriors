import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseListQuery } from "@/lib/submissions/query";
import { listFeedbackSubmissions } from "@/lib/submissions/feedback-service";
import { connectDB } from "@/lib/db";
import FeedbackSubmission from "@/lib/models/FeedbackSubmission.model";
import {
  firstZodErrorMessage,
  submissionBulkDeleteSchema,
} from "@/lib/submissions/schemas";

export const GET = withAuth(
  async (req: NextRequest) => {
    const query = parseListQuery(req.nextUrl.searchParams);
    const result = await listFeedbackSubmissions(query);
    return NextResponse.json(result);
  },
  { permission: PERMISSIONS.AllFeedbackSubmissionsView },
);

export const DELETE = withAuth(
  async (req: NextRequest) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = submissionBulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: firstZodErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    await connectDB();
    const submissions = await FeedbackSubmission.find({
      _id: { $in: parsed.data.ids },
    });
    if (submissions.length !== parsed.data.ids.length) {
      return NextResponse.json(
        { message: "One or more submissions were not found." },
        { status: 404 },
      );
    }

    await Promise.all(submissions.map((submission) => submission.softDelete()));
    return NextResponse.json({
      success: true,
      deletedCount: submissions.length,
    });
  },
  { permission: PERMISSIONS.AllFeedbackSubmissionsEdit },
);
