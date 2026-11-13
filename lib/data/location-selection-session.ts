export const LOCATION_SESSION_KEYS = {
  camera: "water-warriors:location-map-camera",
  points: "water-warriors:location-map-points",
  name: "water-warriors:location-name",
} as const;

export type LocationPoint = {
  lat: number;
  lng: number;
};

export type LocationCamera = {
  center: LocationPoint;
  zoom: number;
};

export function readSavedMapCamera(): LocationCamera | null {
  try {
    const stored = sessionStorage.getItem(LOCATION_SESSION_KEYS.camera);
    if (!stored) return null;

    const value: unknown = JSON.parse(stored);
    if (
      typeof value !== "object" ||
      value === null ||
      !("center" in value) ||
      !("zoom" in value) ||
      typeof value.center !== "object" ||
      value.center === null ||
      !("lat" in value.center) ||
      !("lng" in value.center) ||
      typeof value.center.lat !== "number" ||
      typeof value.center.lng !== "number" ||
      typeof value.zoom !== "number" ||
      !Number.isFinite(value.center.lat) ||
      !Number.isFinite(value.center.lng) ||
      !Number.isFinite(value.zoom) ||
      value.center.lat < -85 ||
      value.center.lat > 85 ||
      value.center.lng < -180 ||
      value.center.lng > 180 ||
      value.zoom < 0 ||
      value.zoom > 22
    ) {
      return null;
    }

    return {
      center: { lat: value.center.lat, lng: value.center.lng },
      zoom: value.zoom,
    };
  } catch (error) {
    console.warn("Could not restore the saved map position.", error);
    return null;
  }
}

export function saveMapCamera(camera: LocationCamera) {
  try {
    sessionStorage.setItem(
      LOCATION_SESSION_KEYS.camera,
      JSON.stringify(camera),
    );
  } catch (error) {
    console.warn("Could not save the map position for this session.", error);
  }
}

function isValidMapPoint(value: unknown): value is LocationPoint {
  if (typeof value !== "object" || value === null) return false;
  if (!("lat" in value) || !("lng" in value)) return false;

  return (
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

export function readSavedMapPoints(): LocationPoint[] {
  try {
    const stored = sessionStorage.getItem(LOCATION_SESSION_KEYS.points);
    if (!stored) return [];

    const value: unknown = JSON.parse(stored);
    if (!Array.isArray(value) || !value.every(isValidMapPoint)) {
      console.warn("Ignoring invalid saved map points.");
      return [];
    }

    return value;
  } catch (error) {
    console.warn("Could not restore the saved map points.", error);
    return [];
  }
}

export function saveMapPoints(points: LocationPoint[]) {
  try {
    sessionStorage.setItem(
      LOCATION_SESSION_KEYS.points,
      JSON.stringify(points),
    );
  } catch (error) {
    console.warn("Could not save the map points for this session.", error);
  }
}

export function readSavedLocationName(): string {
  try {
    return sessionStorage.getItem(LOCATION_SESSION_KEYS.name) ?? "";
  } catch (error) {
    console.warn("Could not restore the location name.", error);
    return "";
  }
}

export function saveLocationName(name: string) {
  try {
    sessionStorage.setItem(LOCATION_SESSION_KEYS.name, name);
  } catch (error) {
    console.warn("Could not save the location name for this session.", error);
  }
}
