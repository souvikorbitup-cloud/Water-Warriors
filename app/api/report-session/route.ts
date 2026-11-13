import { NextResponse } from "next/server";
import { getCurrentAuthorizedReport } from "@/lib/report/current-session";

export async function GET() {
  const report = await getCurrentAuthorizedReport();
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
