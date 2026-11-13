import { NextRequest, NextResponse } from "next/server";

const STATIC_MAP_SIZE = 640;
const STATIC_MAP_SCALE = 2;
const REQUEST_TIMEOUT_MS = 15000;
const GOOGLE_STATIC_MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function createStaticMapResponse(body: unknown) {
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
  const mapZoom = Math.round(zoom);
  mapUrl.searchParams.set("center", `${lat},${lng}`);
  mapUrl.searchParams.set("zoom", String(mapZoom));
  mapUrl.searchParams.set("size", `${STATIC_MAP_SIZE}x${STATIC_MAP_SIZE}`);
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

    const image = new Uint8Array(await response.arrayBuffer());
    const hasChunk = (name: string) => {
      for (let index = 8; index <= image.length - 4; index += 1) {
        if (
          image[index] === name.charCodeAt(0) &&
          image[index + 1] === name.charCodeAt(1) &&
          image[index + 2] === name.charCodeAt(2) &&
          image[index + 3] === name.charCodeAt(3)
        ) {
          return true;
        }
      }

      return false;
    };
    const isPng =
      response.headers.get("content-type")?.startsWith("image/png") === true &&
      image.length >= PNG_SIGNATURE.length &&
      PNG_SIGNATURE.every((byte, index) => image[index] === byte) &&
      hasChunk("IHDR") &&
      hasChunk("IDAT") &&
      hasChunk("IEND");

    if (!isPng) {
      console.error("Google Static Maps returned an invalid PNG response.", {
        contentType: response.headers.get("content-type"),
        byteLength: image.length,
      });
      return NextResponse.json(
        { message: "Building detection is unavailable." },
        { status: 502 },
      );
    }

    const imageData = Buffer.from(image).toString("base64");
    return NextResponse.json(
      {
        image: `data:image/png;base64,${imageData}`,
        center: { lat, lng },
        zoom: mapZoom,
        size: STATIC_MAP_SIZE,
        scale: STATIC_MAP_SCALE,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to fetch the Google Static Map image:", error);
    return NextResponse.json(
      { message: "Building detection is unavailable." },
      { status: 502 },
    );
  }
}

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

  return createStaticMapResponse(body);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return createStaticMapResponse({
    lat: Number(searchParams.get("lat")),
    lng: Number(searchParams.get("lng")),
    zoom: Number(searchParams.get("zoom")),
  });
}
