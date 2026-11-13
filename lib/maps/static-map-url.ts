import type { ReportPoint } from "@/lib/report/types";
import { getPolygonCentroid } from "@/lib/report/geometry";

export type MapSnapshotType = "roadmap" | "satellite" | "terrain" | "hybrid";

const STATIC_MAP_WIDTH = 640;
const STATIC_MAP_HEIGHT = 251;
const STATIC_MAP_PADDING = 32;
const MAX_MAP_ZOOM = 21;

function mercatorY(latitude: number): number {
  const clampedLatitude = Math.max(
    -85.05112878,
    Math.min(85.05112878, latitude),
  );
  const radians = (clampedLatitude * Math.PI) / 180;
  return (1 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / Math.PI) / 2;
}

function getPreviewZoom(
  points: ReportPoint[],
  center: ReportPoint,
  requestedZoom: number,
): number {
  const centerY = mercatorY(center.lat);
  let maxOffsetX = 0;
  let maxOffsetY = 0;

  for (const point of points) {
    let longitudeDifference = point.lng - center.lng;
    if (longitudeDifference > 180) longitudeDifference -= 360;
    if (longitudeDifference < -180) longitudeDifference += 360;

    maxOffsetX = Math.max(maxOffsetX, Math.abs(longitudeDifference / 360));
    maxOffsetY = Math.max(maxOffsetY, Math.abs(mercatorY(point.lat) - centerY));
  }

  const availableHalfWidth = STATIC_MAP_WIDTH / 2 - STATIC_MAP_PADDING;
  const availableHalfHeight = STATIC_MAP_HEIGHT / 2 - STATIC_MAP_PADDING;
  const fitZoomX =
    maxOffsetX === 0
      ? MAX_MAP_ZOOM
      : Math.log2(availableHalfWidth / (256 * maxOffsetX));
  const fitZoomY =
    maxOffsetY === 0
      ? MAX_MAP_ZOOM
      : Math.log2(availableHalfHeight / (256 * maxOffsetY));
  const fitZoom = Math.floor(Math.min(fitZoomX, fitZoomY));
  const lessZoomedRequest = Number.isFinite(requestedZoom)
    ? Math.floor(requestedZoom) - 1
    : 18;

  return Math.max(0, Math.min(MAX_MAP_ZOOM, lessZoomedRequest, fitZoom));
}

export function createStaticMapUrl({
  points,
  zoom,
  mapType,
}: {
  points: ReportPoint[];
  zoom: number;
  mapType: MapSnapshotType;
}): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.");
  }
  if (points.length < 3) {
    throw new Error("At least three points are required for a map snapshot.");
  }

  const center = getPolygonCentroid(points);
  const previewZoom = getPreviewZoom(points, center, zoom);
  const pathPoints = points.map((point) => `${point.lat},${point.lng}`);
  const firstPoint = points[0];
  if (firstPoint) pathPoints.push(`${firstPoint.lat},${firstPoint.lng}`);

  const searchParams = new URLSearchParams({
    maptype: mapType,
    size: `${STATIC_MAP_WIDTH}x${STATIC_MAP_HEIGHT}`,
    scale: "2",
    center: `${center.lat},${center.lng}`,
    zoom: String(previewZoom),
    path: [
      "fillcolor:0xFFA50040",
      "color:0xFF8C00",
      "weight:2",
      ...pathPoints,
    ].join("|"),
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${searchParams.toString()}`;
}
