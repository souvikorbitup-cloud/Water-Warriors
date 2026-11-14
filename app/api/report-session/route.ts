import { NextResponse } from "next/server";
import {
  getCurrentAuthorizedReport,
  updateCurrentAuthorizedReportConsent,
} from "@/lib/report/current-session";

export async function GET(request: Request) {
  const consentAccepted =
    request.headers.get("x-ww-analytics-consent") === "accepted";
  const report = await getCurrentAuthorizedReport(consentAccepted);
  if (!report) {
    return NextResponse.json(
      { message: "No paid report session was found." },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid report consent request." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("accepted" in body) ||
    typeof body.accepted !== "boolean"
  ) {
    return NextResponse.json(
      { message: "Invalid report consent request." },
      { status: 400 },
    );
  }

  const result = await updateCurrentAuthorizedReportConsent(body.accepted);
  if (!result) {
    return NextResponse.json(
      { message: "No paid report session was found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
