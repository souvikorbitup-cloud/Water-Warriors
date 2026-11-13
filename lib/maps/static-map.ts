import "server-only";

const GOOGLE_STATIC_MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap";
const REQUEST_TIMEOUT_MS = 15000;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type StaticMapRequest = {
  center: { lat: number; lng: number };
  zoom: number;
  width: number;
  height: number;
  scale: number;
  path?: string;
  styles?: string[];
};

export class StaticMapError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StaticMapError";
  }
}

function isPng(image: Uint8Array, contentType: string | null): boolean {
  if (
    contentType?.startsWith("image/png") !== true ||
    image.length < PNG_SIGNATURE.length ||
    !PNG_SIGNATURE.every((byte, index) => image[index] === byte)
  ) {
    return false;
  }

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

  return hasChunk("IHDR") && hasChunk("IDAT") && hasChunk("IEND");
}

export async function fetchStaticMapPng(
  options: StaticMapRequest,
): Promise<Uint8Array> {
  const apiKey = process.env.GOOGLE_STATIC_MAPS_API_KEY;
  if (!apiKey) {
    throw new StaticMapError(
      "GOOGLE_STATIC_MAPS_API_KEY is not configured.",
      503,
    );
  }

  const mapUrl = new URL(GOOGLE_STATIC_MAPS_URL);
  mapUrl.searchParams.set(
    "center",
    `${options.center.lat},${options.center.lng}`,
  );
  mapUrl.searchParams.set("zoom", String(Math.round(options.zoom)));
  mapUrl.searchParams.set("size", `${options.width}x${options.height}`);
  mapUrl.searchParams.set("scale", String(options.scale));
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("format", "png");
  mapUrl.searchParams.set("key", apiKey);
  if (options.path) mapUrl.searchParams.set("path", options.path);
  for (const style of options.styles ?? []) {
    mapUrl.searchParams.append("style", style);
  }

  let response: Response;
  try {
    response = await fetch(mapUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new StaticMapError(
      error instanceof Error ? error.message : "Could not reach Google Maps.",
      502,
    );
  }

  if (!response.ok) {
    throw new StaticMapError(
      `Google Static Maps returned ${response.status}.`,
      502,
    );
  }

  const image = new Uint8Array(await response.arrayBuffer());
  if (!isPng(image, response.headers.get("content-type"))) {
    throw new StaticMapError(
      "Google Static Maps returned an invalid PNG response.",
      502,
    );
  }

  return image;
}
