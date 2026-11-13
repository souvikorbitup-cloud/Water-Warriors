import { NextRequest, NextResponse } from "next/server";
import {
  getBillingQuote,
  InvalidCouponError,
} from "@/lib/billing/billing-service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? undefined;
  try {
    const quote = await getBillingQuote(code);
    return NextResponse.json(quote, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof InvalidCouponError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400, headers: noStoreHeaders },
      );
    }

    console.error("Could not calculate the billing quote:", error);
    return NextResponse.json(
      { message: "Could not load the current plan price." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
