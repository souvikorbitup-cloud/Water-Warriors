import { NextResponse } from "next/server";
import {
  getVisitorCount,
  incrementVisitorCount,
} from "@/lib/services/visitor-count";

export async function GET() {
  try {
    const count = await getVisitorCount();
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load the visitor count:", error);
    return NextResponse.json(
      { message: "Could not load the visitor count." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST() {
  try {
    const count = await incrementVisitorCount();
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not increment the visitor count:", error);
    return NextResponse.json(
      { message: "Could not increment the visitor count." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
