import { NextRequest, NextResponse } from "next/server";
import { fetchStaticMapPng, StaticMapError } from "@/lib/maps/static-map";

const STATIC_MAP_SIZE = 640;
const STATIC_MAP_SCALE = 2;

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

  const mapZoom = Math.round(zoom);

  try {
    const image = await fetchStaticMapPng({
      center: { lat, lng },
      zoom: mapZoom,
      width: STATIC_MAP_SIZE,
      height: STATIC_MAP_SIZE,
      scale: STATIC_MAP_SCALE,
      styles: [
        "feature:all|element:labels|visibility:off",
        "feature:poi|element:labels|visibility:off",
        "feature:transit|visibility:off",
        "feature:administrative|visibility:off",
        "feature:road|element:geometry|color:0xffffff",
      ],
    });
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
      {
        status: error instanceof StaticMapError ? error.status : 502,
      },
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
