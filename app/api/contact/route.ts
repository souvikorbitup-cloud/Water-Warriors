import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/lib/models/ContactSubmission.model";
import { sendMail } from "@/lib/mail/send-mail";
import { renderContactThankYouEmail } from "@/lib/mail/submission-email-templates";
import {
  hashClientIp,
  getUserAgent,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/submissions/request-meta";
import {
  contactSubmissionSchema,
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

  const parsed = contactSubmissionSchema.safeParse(body);
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
    const recentCount = await ContactSubmission.countRecentByIp(
      ipHash,
      RATE_LIMIT_WINDOW_MS,
    );

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          message:
            "Too many messages from this network. Please try again later.",
        },
        { status: 429 },
      );
    }

    const { name, email, message } = parsed.data;
    const submission = await ContactSubmission.create({
      name,
      email,
      message,
      ipHash,
      userAgent: getUserAgent(req),
      status: "new",
    });

    try {
      const { subject, html } = renderContactThankYouEmail(name);
      await sendMail({ to: email, subject, html });
    } catch (error) {
      console.error("Failed to send contact thank-you email:", error);
    }

    return NextResponse.json(
      {
        success: true,
        id: submission._id.toString(),
        message: "Thanks! Your message has been sent.",
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

    console.error("Contact submission failed:", error);
    return NextResponse.json(
      { message: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
