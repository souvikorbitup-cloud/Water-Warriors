import type { ReportPoint } from "@/lib/report/types";

const EARTH_RADIUS_METERS = 6_378_137;

export function getPolygonAreaSquareMeters(points: ReportPoint[]): number {
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const nextPoint = points[(index + 1) % points.length];
    if (!point || !nextPoint) continue;

    let longitudeDelta = (nextPoint.lng - point.lng) * (Math.PI / 180);
    if (longitudeDelta > Math.PI) longitudeDelta -= Math.PI * 2;
    if (longitudeDelta < -Math.PI) longitudeDelta += Math.PI * 2;

    total +=
      longitudeDelta *
      (2 +
        Math.sin(point.lat * (Math.PI / 180)) +
        Math.sin(nextPoint.lat * (Math.PI / 180)));
  }

  const area = Math.abs((total * EARTH_RADIUS_METERS ** 2) / 2);
  if (!Number.isFinite(area) || area <= 0) {
    throw new Error("The selected polygon does not have a measurable area.");
  }
  return area;
}

export function getPolygonCentroid(points: ReportPoint[]): ReportPoint {
  let twiceArea = 0;
  let latitudeSum = 0;
  let longitudeSum = 0;

  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    if (!nextPoint) return;
    const cross = point.lng * nextPoint.lat - nextPoint.lng * point.lat;
    twiceArea += cross;
    latitudeSum += (point.lat + nextPoint.lat) * cross;
    longitudeSum += (point.lng + nextPoint.lng) * cross;
  });

  if (Math.abs(twiceArea) < 1e-12) {
    return points.reduce(
      (center, point) => ({
        lat: center.lat + point.lat / points.length,
        lng: center.lng + point.lng / points.length,
      }),
      { lat: 0, lng: 0 },
    );
  }

  return {
    lat: latitudeSum / (3 * twiceArea),
    lng: longitudeSum / (3 * twiceArea),
  };
}
