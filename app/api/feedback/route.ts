import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import FeedbackSubmission from "@/lib/models/FeedbackSubmission.model";
import { sendMail } from "@/lib/mail/send-mail";
import { renderFeedbackThankYouEmail } from "@/lib/mail/submission-email-templates";
import {
  hashClientIp,
  getUserAgent,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/submissions/request-meta";
import {
  feedbackSubmissionSchema,
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = feedbackSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: firstZodErrorMessage(parsed.error),
        fieldErrors: zodErrorToFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const ipHash = hashClientIp(req);
    const recentCount = await FeedbackSubmission.countRecentByIp(
      ipHash,
      RATE_LIMIT_WINDOW_MS,
    );

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          message:
            "Too many submissions from this network. Please try again later.",
        },
        { status: 429 },
      );
    }

    const { topic, rating, name, email, message } = parsed.data;
    const submission = await FeedbackSubmission.create({
      topic,
      rating,
      name,
      email,
      message,
      ipHash,
      userAgent: getUserAgent(req),
      status: "new",
    });

    if (email) {
      try {
        const { subject, html } = renderFeedbackThankYouEmail(name);
        await sendMail({ to: email, subject, html });
      } catch (error) {
        console.error("Failed to send feedback thank-you email:", error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        id: submission._id.toString(),
        message: "Thank you! Your feedback has been submitted.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: Object.values(error.errors)[0]?.message ?? "Invalid input.",
        },
        { status: 400 },
      );
    }

    console.error("Feedback submission failed:", error);
    return NextResponse.json(
      { message: "Could not submit your feedback. Please try again." },
      { status: 500 },
    );
  }
}
