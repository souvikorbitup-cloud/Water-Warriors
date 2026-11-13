import { NextRequest, NextResponse } from "next/server";

const STATIC_MAP_SIZE = 640;
const STATIC_MAP_SCALE = 2;
const REQUEST_TIMEOUT_MS = 15000;
const GOOGLE_STATIC_MAPS_URL =
  "https://maps.googleapis.com/maps/api/staticmap";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("lat" in body) ||
    !("lng" in body) ||
    !("zoom" in body)
  ) {
    return NextResponse.json(
      { message: "Provide valid map coordinates and zoom." },
      { status: 400 },
    );
  }

  const { lat, lng, zoom } = body;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof zoom !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(zoom) ||
    lat < -85 ||
    lat > 85 ||
    lng < -180 ||
    lng > 180 ||
    zoom < 15 ||
    zoom > 21
  ) {
    return NextResponse.json(
      { message: "Provide valid map coordinates and zoom." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GOOGLE_STATIC_MAPS_API_KEY;
  if (!apiKey) {
    console.error(
      "GOOGLE_STATIC_MAPS_API_KEY is not configured for roof detection.",
    );
    return NextResponse.json(
      { message: "Building detection is unavailable." },
      { status: 503 },
    );
  }

  const mapUrl = new URL(GOOGLE_STATIC_MAPS_URL);
  mapUrl.searchParams.set("center", `${lat},${lng}`);
  mapUrl.searchParams.set("zoom", String(Math.round(zoom)));
  mapUrl.searchParams.set(
    "size",
    `${STATIC_MAP_SIZE}x${STATIC_MAP_SIZE}`,
  );
  mapUrl.searchParams.set("scale", String(STATIC_MAP_SCALE));
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("format", "png");
  mapUrl.searchParams.set("key", apiKey);

  for (const style of [
    "feature:all|element:labels|visibility:off",
    "feature:poi|element:labels|visibility:off",
    "feature:transit|visibility:off",
    "feature:administrative|visibility:off",
    "feature:road|element:geometry|color:0xffffff",
  ]) {
    mapUrl.searchParams.append("style", style);
  }

  try {
    const response = await fetch(mapUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Google Static Maps returned ${response.status}.`);
      return NextResponse.json(
        { message: "Building detection is unavailable." },
        { status: 502 },
      );
    }

    const image = await response.arrayBuffer();
    if (response.headers.get("content-type")?.startsWith("image/png") !== true) {
      console.error("Google Static Maps did not return a PNG image.");
      return NextResponse.json(
        { message: "Building detection is unavailable." },
        { status: 502 },
      );
    }

    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to fetch the Google Static Map image:", error);
    return NextResponse.json(
      { message: "Building detection is unavailable." },
      { status: 502 },
    );
  }
}
