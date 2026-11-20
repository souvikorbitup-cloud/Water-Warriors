"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  ArrowRight,
  LocateFixed,
  MapPin,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  PenTool,
  RotateCcw,
  Satellite,
  Star,
} from "lucide-react";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { detectRoofFromPixels } from "@/lib/data/roof-detection";
import {
  readSavedLocationName,
  readSavedMapCamera,
  readSavedMapPoints,
  saveLocationName,
  saveMapCamera,
  saveMapPoints,
  type LocationCamera as MapCamera,
} from "@/lib/data/location-selection-session";
import { useRouter } from "@/i18n/navigation";

type LatLng = google.maps.LatLngLiteral;

type LocationSectionProps = {
  /** Called when the user confirms the selected area with the "Next" button. */
  onNext?: (data: { name: string; points: LatLng[] }) => void;
};

const INITIAL_CENTER: LatLng = { lat: 22.6446, lng: 88.3737 };
const INITIAL_ZOOM = 17;
const MIN_POINTS = 4;
const MIN_MAGIC_SELECTION_ZOOM = 15;
const MAX_MAGIC_SELECTION_ZOOM = 21;
// Two map clicks closer together than this are treated as one double-click.
const DOUBLE_CLICK_MS = 350;

// Google Maps overlay options can't read CSS variables, so the brand yellow (--primary) is repeated here.
const BRAND_YELLOW = "#F1BB1B";

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: "greedy",
};

const COORDS_REGEX = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

type BuildingStatus = "idle" | "loading" | "notFound" | "error" | "mapRequired";

// Ray-casting point-in-polygon test (lng = x, lat = y).
function pointInPolygon(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const crosses =
      a.lat > point.lat !== b.lat > point.lat &&
      point.lng <
        ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

// Public Overpass servers are often at capacity (502/429/504), so we try
// several of them and retry with exponential backoff before giving up.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const OVERPASS_ROUNDS = 2;
const OVERPASS_TIMEOUT_MS = 12000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

async function queryOverpass(query: string): Promise<unknown> {
  let lastError: unknown = new Error("Building lookup failed.");

  const retryableStatuses = new Set([429, 502, 503, 504]);

  for (let round = 0; round < OVERPASS_ROUNDS; round++) {
    let retryAfterMs = 0;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      const controller = new AbortController();

      const timeoutId = window.setTimeout(
        () => controller.abort(),
        OVERPASS_TIMEOUT_MS,
      );

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: new URLSearchParams({
            data: query,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const details = await response.text();

          lastError = new Error(
            `Overpass API ${response.status}: ${details.slice(0, 300)}`,
          );

          if (retryableStatuses.has(response.status)) {
            const retryAfter = response.headers.get("Retry-After");

            if (retryAfter) {
              const seconds = Number(retryAfter);
              const delay = Number.isFinite(seconds)
                ? seconds * 1000
                : Math.max(0, Date.parse(retryAfter) - Date.now());

              retryAfterMs = Math.max(retryAfterMs, delay);
            }
          }

          continue;
        }

        const data = await response.json();

        if (data.remark) {
          throw new Error(`Overpass query failed: ${data.remark}`);
        }

        return data;
      } catch (error) {
        lastError = error;

        console.warn(`Building lookup failed on ${endpoint}:`, error);
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    // Exponential backoff before retrying the servers.
    if (round < OVERPASS_ROUNDS - 1) {
      const backoff = 3000 * Math.pow(2, round);

      await sleep(Math.max(backoff, retryAfterMs));
    }
  }

  throw lastError;
}

// Looks up the OpenStreetMap building outline under a map point (Overpass API).
// Returns the footprint's corners, or null when no building is found there.
async function fetchBuildingFootprint(point: LatLng): Promise<LatLng[] | null> {
  const query = `[out:json][timeout:10];way(around:4,${point.lat},${point.lng})["building"];out geom;`;
  const json = (await queryOverpass(query)) as {
    elements?: { geometry?: { lat: number; lon: number }[] }[];
  };

  const rings = (json.elements ?? [])
    .map((element) =>
      (element.geometry ?? []).map((g) => ({ lat: g.lat, lng: g.lon })),
    )
    .map((ring) => {
      // OSM rings repeat the first node at the end; drop the duplicate.
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first && last && first.lat === last.lat && first.lng === last.lng
        ? ring.slice(0, -1)
        : ring;
    })
    .filter((ring) => ring.length >= 3);

  if (rings.length === 0) return null;
  return rings.find((ring) => pointInPolygon(point, ring)) ?? rings[0];
}

type StaticMapImageResponse = {
  image: string;
  center: LatLng;
  zoom: number;
  size: number;
  scale: number;
};

function isStaticMapImageResponse(
  value: unknown,
): value is StaticMapImageResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("image" in value) ||
    !("center" in value) ||
    !("zoom" in value) ||
    !("size" in value) ||
    !("scale" in value) ||
    typeof value.image !== "string" ||
    !value.image.startsWith("data:image/png;base64,") ||
    typeof value.center !== "object" ||
    value.center === null ||
    !("lat" in value.center) ||
    !("lng" in value.center) ||
    typeof value.center.lat !== "number" ||
    typeof value.center.lng !== "number" ||
    typeof value.zoom !== "number" ||
    typeof value.size !== "number" ||
    typeof value.scale !== "number"
  ) {
    return false;
  }

  return true;
}

async function detectBuildingFromMap(
  point: LatLng,
  zoom: number,
): Promise<LatLng[] | null> {
  const mapZoom = Number.isFinite(zoom)
    ? Math.min(
        Math.max(zoom, MIN_MAGIC_SELECTION_ZOOM),
        MAX_MAGIC_SELECTION_ZOOM,
      )
    : INITIAL_ZOOM;
  const response = await fetch("/api/detect-building-footprint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...point, zoom: mapZoom }),
  });

  if (!response.ok) {
    throw new Error(
      `Magic Selection image request failed (${response.status}).`,
    );
  }

  const result: unknown = await response.json();
  if (!isStaticMapImageResponse(result)) {
    throw new Error("Magic Selection returned an invalid image response.");
  }

  const image = new Image();
  image.src = result.image;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the roof detection canvas.");

  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

  return detectRoofFromPixels(pixels.data, {
    width: canvas.width,
    height: canvas.height,
    center: result.center,
    zoom: result.zoom,
    scale: result.scale,
  });
}

export default function LocationSection({ onNext }: LocationSectionProps) {
  const router = useRouter();
  const t = useTranslations("Location");
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const suggestionRequestRef = useRef(0);
  // Refs mirror the drawing state so the Google Maps listeners (click /
  // dblclick) never read a stale value between renders.
  const isDrawingRef = useRef(false);
  const lastClickRef = useRef(0);
  // How many points existed before the current click (used by double-click).
  const priorCountRef = useRef(0);
  const buildingRequestRef = useRef(0);
  // The Polygon / Polyline currently drawn on the map (managed natively).
  const shapeRef = useRef<google.maps.Polygon | google.maps.Polyline | null>(
    null,
  );

  const [name, setName] = useState(() =>
    typeof window === "undefined" ? "" : readSavedLocationName(),
  );
  const [query, setQuery] = useState("");
  const [isPlacesLoaded, setIsPlacesLoaded] = useState(false);
  const [placesLoadError, setPlacesLoadError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<LatLng[]>(() =>
    typeof window === "undefined" ? [] : readSavedMapPoints(),
  );
  const pointsRef = useRef<LatLng[]>(points);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [buildingStatus, setBuildingStatus] = useState<BuildingStatus>("idle");
  const [mapCamera] = useState<MapCamera>(() => {
    const savedCamera =
      typeof window === "undefined" ? null : readSavedMapCamera();
    return savedCamera ?? { center: INITIAL_CENTER, zoom: INITIAL_ZOOM };
  });

  // The area counts as "selected" as soon as the minimum number of points exist.
  const isAreaSelected = points.length >= MIN_POINTS;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setIsMapReady(false);
  }, []);

  const persistMapCamera = useCallback((camera?: MapCamera) => {
    if (camera) {
      saveMapCamera(camera);
      return;
    }

    const map = mapRef.current;
    const center = map?.getCenter();
    const zoom = map?.getZoom();
    if (!center || typeof zoom !== "number") return;

    saveMapCamera({
      center: { lat: center.lat(), lng: center.lng() },
      zoom,
    });
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!isPlacesLoaded || !isSearchFocused || value.length < 2) return;

    const requestId = ++suggestionRequestRef.current;
    const timeoutId = window.setTimeout(() => {
      setIsSearchingPlaces(true);
      setSuggestionError(null);
      const bounds = mapRef.current?.getBounds();

      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        ...(bounds ? { locationBias: bounds } : {}),
      }).then(
        ({ suggestions: results }) => {
          if (requestId !== suggestionRequestRef.current) return;
          setSuggestions(results);
          setActiveSuggestionIndex(-1);
          setIsSearchingPlaces(false);
        },
        (error: unknown) => {
          if (requestId !== suggestionRequestRef.current) return;
          console.error("Failed to fetch Google Places suggestions.", error);
          setSuggestions([]);
          setSuggestionError(t("suggestionsUnavailable"));
          setIsSearchingPlaces(false);
        },
      );
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      suggestionRequestRef.current += 1;
    };
  }, [isPlacesLoaded, isSearchFocused, query, t]);

  useEffect(() => {
    if (!isLoaded) return;

    let isActive = true;
    google.maps.importLibrary("places").then(
      () => {
        if (isActive) setIsPlacesLoaded(true);
      },
      (error: unknown) => {
        console.error("Failed to load Google Places library.", error);
        if (isActive) {
          setPlacesLoadError(t("placesUnavailable"));
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, [isLoaded, t]);

  // Escape exits fullscreen + lock page scroll while expanded
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen]);

  // Draw the outline / area with one native Google Maps shape. It is created
  // and removed imperatively, so nothing is ever left behind on the map
  // (the declarative <Polygon>/<Polyline> could leak a stale line).
  useEffect(() => {
    shapeRef.current?.setMap(null);
    shapeRef.current = null;

    const map = mapRef.current;
    if (!map || !isMapReady || points.length < 2) return;

    const isFinished = isAreaSelected && !isDrawing;
    const shape =
      points.length >= 3
        ? new google.maps.Polygon({
            paths: points,
            fillColor: BRAND_YELLOW,
            fillOpacity: isFinished ? 0.45 : 0.3,
            strokeColor: BRAND_YELLOW,
            strokeWeight: isFinished ? 3 : 2,
            clickable: false,
            map,
          })
        : new google.maps.Polyline({
            path: points,
            strokeColor: BRAND_YELLOW,
            strokeWeight: 2,
            clickable: false,
            map,
          });
    shapeRef.current = shape;

    return () => {
      shape.setMap(null);
      if (shapeRef.current === shape) shapeRef.current = null;
    };
  }, [points, isDrawing, isAreaSelected, isLoaded, isMapReady]);

  const flyTo = (location: LatLng, zoom = 18) => {
    setPin(location);
    persistMapCamera({ center: location, zoom });
    mapRef.current?.panTo(location);
    mapRef.current?.setZoom(zoom);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (!value || !isLoaded) return;

    const match = value.match(COORDS_REGEX);
    if (match) {
      flyTo({ lat: Number(match[1]), lng: Number(match[2]) });
      return;
    }

    new google.maps.Geocoder().geocode(
      { address: value },
      (results, status) => {
        if (status !== "OK" || !results?.[0]) return;
        const { location, viewport } = results[0].geometry;
        setPin({ lat: location.lat(), lng: location.lng() });
        mapRef.current?.fitBounds(viewport);
      },
    );
  };

  const handleSuggestionSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    setIsSearchFocused(false);
    setSuggestions([]);
    setIsSearchingPlaces(false);

    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["location", "viewport", "formattedAddress"],
      });

      const location = place.location;
      let coordinates: LatLng | null = null;
      if (location) {
        const lat =
          typeof location.lat === "function"
            ? location.lat()
            : Number(location.lat);
        const lng =
          typeof location.lng === "function"
            ? location.lng()
            : Number(location.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          coordinates = { lat, lng };
        }
      }

      if (!coordinates) {
        setSuggestionError(t("noMapLocation"));
        return;
      }

      setQuery(place.formattedAddress ?? prediction.text.text);
      setSuggestionError(null);
      setPin(coordinates);

      if (place.viewport) {
        mapRef.current?.fitBounds(place.viewport);
      } else {
        flyTo(coordinates);
      }
    } catch (error) {
      console.error("Failed to load the selected Google Place.", error);
      setSuggestionError(t("couldNotLoadPlace"));
    }
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex(
        (index) => (index <= 0 ? suggestions.length : index) - 1,
      );
    } else if (
      event.key === "Enter" &&
      activeSuggestionIndex >= 0 &&
      suggestions[activeSuggestionIndex]
    ) {
      event.preventDefault();
      void handleSuggestionSelect(suggestions[activeSuggestionIndex]);
    } else if (event.key === "Escape") {
      setIsSearchFocused(false);
      setSuggestions([]);
    }
  };

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) =>
      flyTo({ lat: coords.latitude, lng: coords.longitude }),
    );
  };

  const updatePoints = (next: LatLng[]) => {
    pointsRef.current = next;
    saveMapPoints(next);
    setPoints(next);
  };

  const updateDrawing = (next: boolean) => {
    isDrawingRef.current = next;
    setIsDrawing(next);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    persistMapCamera();
    if (!isDrawingRef.current) return;

    // A double-click fires two click events. Ignore the second one (by timing,
    // since domEvent.detail isn't reliable) so it doesn't add a duplicate point.
    const now = Date.now();
    const isSecondClickOfDoubleClick =
      now - lastClickRef.current < DOUBLE_CLICK_MS;
    lastClickRef.current = now;
    if (isSecondClickOfDoubleClick) return;

    // A new manual click cancels any building lookup still in flight.
    buildingRequestRef.current += 1;
    setBuildingStatus("idle");

    priorCountRef.current = pointsRef.current.length;
    updatePoints([
      ...pointsRef.current,
      { lat: e.latLng.lat(), lng: e.latLng.lng() },
    ]);
  };

  // Double-click:
  // Select the building footprint under the clicked map location.
  const selectBuildingAt = async (
    e: google.maps.MapMouseEvent,
    restorePoints?: LatLng[],
  ) => {
    if (!isDrawingRef.current || !e.latLng) return;

    // Prevent the default map context-menu behavior.
    e.stop();
    e.domEvent?.preventDefault();
    persistMapCamera();

    // Cancel any previous building lookup.
    const requestId = ++buildingRequestRef.current;

    if (isSatellite) {
      setBuildingStatus("mapRequired");
      return;
    }

    const target = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setBuildingStatus("loading");

    try {
      const zoom = mapRef.current?.getZoom() ?? 17;
      let footprint: LatLng[] | null = null;

      try {
        footprint = await detectBuildingFromMap(target, zoom);
      } catch (error) {
        console.warn(
          "Magic Selection failed; trying the building lookup.",
          error,
        );
      }

      if (!footprint) footprint = await fetchBuildingFootprint(target);

      // Ignore outdated requests.
      if (requestId !== buildingRequestRef.current) return;

      if (footprint && footprint.length >= MIN_POINTS) {
        // Select the actual building outline.
        updatePoints(footprint);

        // Automatically finish drawing.
        updateDrawing(false);

        setBuildingStatus("idle");
      } else {
        // Restore previously drawn points if the lookup fails.
        if (restorePoints !== undefined) {
          updatePoints(restorePoints);
        }

        setBuildingStatus("notFound");
      }
    } catch (error) {
      if (requestId !== buildingRequestRef.current) return;

      console.error("Failed to look up the building outline.", error);

      if (restorePoints !== undefined) {
        updatePoints(restorePoints);
      }

      setBuildingStatus("error");
    }
  };

  // Double-click: select the building footprint.
  const handleMapDoubleClick = async (e: google.maps.MapMouseEvent) => {
    if (!isDrawingRef.current || !e.latLng) return;

    // The first click of a double-click may already have added a point.
    // Keep the original points so they can be restored if no building is found.
    const previousPoints = pointsRef.current.slice(0, priorCountRef.current);

    await selectBuildingAt(e, previousPoints);
  };

  // Right-click: select the building footprint.
  const handleMapRightClick = async (e: google.maps.MapMouseEvent) => {
    if (!isDrawingRef.current || !e.latLng) return;

    await selectBuildingAt(e);
  };

  // Undo: remove the last point, one step at a time.
  const handleUndo = () => {
    updatePoints(pointsRef.current.slice(0, -1));
  };

  // Reset: remove the entire selected area.
  const handleReset = () => {
    buildingRequestRef.current += 1;
    setBuildingStatus("idle");
    updatePoints([]);
    updateDrawing(false);
  };

  const handleNext = () => {
    if (onNext) {
      onNext({ name, points });
      return;
    }

    router.push(`/checkout?attempt=${crypto.randomUUID()}`);
  };

  return (
    <section
      className="container-y-pad bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_20%,#FFF_100%)]"
      id="save-water"
    >
      <div className="my-container-x">
        {/* Heading + name field */}
        <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="mt-1 text-3xl leading-tight font-semibold sm:text-4xl lg:text-[40px]">
              {t("title")}
            </h2>
          </div>

          <div>
            <label
              htmlFor="report-name"
              className="block text-sm text-paragraph"
            >
              {t("nameLabel")}
            </label>
            <Input
              id="report-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                saveLocationName(e.target.value);
              }}
              placeholder={t("namePlaceholder")}
              className="mt-2 h-10.5 rounded-md border-border bg-background! px-3 text-sm"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-secondary px-4 py-5 text-sm text-paragraph sm:mt-8 sm:gap-5 sm:px-5.5 sm:py-5.5 sm:text-base">
          <p className="flex items-start gap-3">
            <MapPin className="mt-1 size-3.5 shrink-0 text-heading" />
            <span>
              {t.rich("instructionPin", {
                mapIcon: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })}
            </span>
          </p>
          <p className="flex items-start gap-3">
            <PenTool className="mt-1 size-3.5 shrink-0 text-heading" />
            <span>
              {t.rich("instructionPen", {
                penIcon: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })}
            </span>
          </p>
        </div>

        {/* Map (placeholder box keeps layout height while the map is fullscreen) */}
        <div className="relative mt-5 h-105 sm:h-125">
          <div
            className={cn(
              "overflow-hidden bg-muted",
              isFullscreen
                ? "fixed inset-0 z-100 h-screen w-screen"
                : "absolute inset-0 rounded-xl border border-border",
            )}
          >
            {loadError ? (
              <p className="flex size-full items-center justify-center p-4 text-center text-sm text-destructive">
                {t("mapsFailed")}
              </p>
            ) : !isLoaded ? (
              <div
                className="size-full animate-pulse bg-muted"
                aria-label={t("loadingMap")}
              />
            ) : (
              <GoogleMap
                mapContainerClassName="size-full"
                center={mapCamera.center}
                zoom={mapCamera.zoom}
                mapTypeId={isSatellite ? "satellite" : "roadmap"}
                options={{
                  ...MAP_OPTIONS,
                  draggableCursor: isDrawing ? "crosshair" : undefined,
                  disableDoubleClickZoom: isDrawing,
                }}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={persistMapCamera}
                onClick={handleMapClick}
                onDblClick={handleMapDoubleClick}
                onRightClick={handleMapRightClick}
              >
                {pin && <Marker position={pin} />}

                {points.map((p, i) => (
                  <Marker
                    key={`${p.lat}-${p.lng}-${i}`}
                    position={p}
                    clickable={false}
                    label={{
                      text: String(i + 1),
                      color: "#1a1a1a",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: BRAND_YELLOW,
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
                ))}
              </GoogleMap>
            )}

            {/* Search */}
            <div className="absolute top-3 right-14 left-3 z-20 sm:top-4 sm:right-auto sm:left-4 sm:w-full sm:max-w-121">
              <form
                onSubmit={handleSearch}
                className="flex h-11.5 items-center rounded-full bg-background pr-1.5 pl-4 shadow-md"
              >
                <MapPin className="mr-2.5 size-4 shrink-0 text-muted-foreground" />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchFocused(true);
                    setSuggestions([]);
                    setSuggestionError(null);
                    setIsSearchingPlaces(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    if (query.trim().length >= 2) {
                      setSuggestions([]);
                      setIsSearchingPlaces(true);
                    }
                  }}
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchLabel")}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isSearchFocused && suggestions.length > 0}
                  aria-controls="location-search-suggestions"
                  aria-activedescendant={
                    activeSuggestionIndex >= 0
                      ? `location-suggestion-${activeSuggestionIndex}`
                      : undefined
                  }
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted-foreground"
                />

                {isSearchingPlaces && (
                  <div className="mr-2 size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                )}

                <Button
                  type="submit"
                  aria-label={t("search")}
                  title={t("search")}
                  className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              {/* Suggestions dropdown */}
              {isSearchFocused &&
                (suggestions.length > 0 ||
                  isSearchingPlaces ||
                  suggestionError ||
                  (placesLoadError && query.trim().length >= 2)) && (
                  <div
                    id="location-search-suggestions"
                    role="listbox"
                    aria-label={t("suggestionsLabel")}
                    className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl shadow-black/10 animate-in fade-in-0 slide-in-from-top-1 duration-150"
                  >
                    {/* Dropdown header */}
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {t("suggestionsLabel")}
                      </span>

                      {suggestions.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {suggestions.length} results
                        </span>
                      )}
                    </div>

                    {/* Loading state */}
                    {isSearchingPlaces && suggestions.length === 0 && (
                      <div className="flex items-center gap-3 px-4 py-5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <div className="size-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-heading">
                            {t("searchingPlaces")}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Finding matching locations...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Suggestion items */}
                    {suggestions.length > 0 && (
                      <div className="max-h-72 overflow-y-auto scroll-auto p-1.5">
                        {suggestions.map((suggestion, index) => {
                          const prediction = suggestion.placePrediction;
                          if (!prediction) return null;

                          const isActive = index === activeSuggestionIndex;

                          return (
                            <Button
                              key={prediction.placeId}
                              id={`location-suggestion-${index}`}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onMouseDown={(event) => event.preventDefault()}
                              onMouseEnter={() =>
                                setActiveSuggestionIndex(index)
                              }
                              onClick={() =>
                                void handleSuggestionSelect(suggestion)
                              }
                              className={cn(
                                "group flex h-auto min-h-15 w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                                isActive
                                  ? "bg-primary/10"
                                  : "bg-transparent hover:bg-muted/70",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                                )}
                              >
                                <MapPin className="size-4" />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium leading-5 text-heading">
                                  {prediction.mainText?.text ??
                                    prediction.text.text}
                                </span>

                                {prediction.secondaryText && (
                                  <span className="mt-0.5 block truncate text-xs leading-4 text-muted-foreground">
                                    {prediction.secondaryText.text}
                                  </span>
                                )}
                              </span>

                              <ArrowRight
                                className={cn(
                                  "size-4 shrink-0 transition-all",
                                  isActive
                                    ? "translate-x-0 opacity-100 text-white"
                                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100",
                                )}
                              />
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {/* Error state */}
                    {suggestionError && suggestions.length === 0 && (
                      <div className="flex items-start gap-3 px-4 py-4">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">
                          {suggestionError}
                        </p>
                      </div>
                    )}

                    {/* Places API error */}
                    {placesLoadError &&
                      suggestions.length === 0 &&
                      !suggestionError && (
                        <div className="px-4 py-4">
                          <p className="text-sm text-destructive">
                            {placesLoadError}
                          </p>
                        </div>
                      )}

                    {/* Footer */}
                    {suggestions.length > 0 && (
                      <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2">
                        <span className="text-[10px] text-muted-foreground">
                          Select a location to move the map
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Google Maps
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Fullscreen toggle (top right) */}
            <MapControl
              label={isFullscreen ? t("exitFullScreen") : t("expandMap")}
              pressed={isFullscreen}
              onClick={() => setIsFullscreen((v) => !v)}
              className="top-3 right-3 sm:top-4 sm:right-4"
              shape="square"
            >
              {isFullscreen ? (
                <Minimize2 className="size-4.5" />
              ) : (
                <Maximize2 className="size-4.5" />
              )}
            </MapControl>

            {/* Drawing / locate / undo tools (left) */}
            <div className="absolute top-20 left-3 flex flex-col gap-3.5 sm:top-34 sm:left-5">
              <MapControl
                label={isDrawing ? t("stopPlacing") : t("placePoints")}
                pressed={isDrawing}
                onClick={() => updateDrawing(!isDrawingRef.current)}
                positioned={false}
              >
                <PenTool className="size-4.5" />
              </MapControl>
              <MapControl
                label={t("useLocation")}
                onClick={handleLocate}
                positioned={false}
              >
                <LocateFixed className="size-4.5" />
              </MapControl>
              <MapControl
                label={t("undoPoint")}
                onClick={handleUndo}
                disabled={points.length === 0}
                positioned={false}
              >
                <RotateCcw className="size-4.5" />
              </MapControl>
            </div>

            {/* Satellite / map toggle (bottom left) */}
            <MapControl
              label={isSatellite ? t("switchToMap") : t("switchToSatellite")}
              pressed={isSatellite}
              onClick={() => {
                setIsSatellite((v) => !v);
                setBuildingStatus("idle");
              }}
              className="bottom-3 left-3 sm:bottom-4 sm:left-4"
              shape="square"
            >
              {isSatellite ? (
                <MapIcon className="size-4.5" />
              ) : (
                <Satellite className="size-4.5" />
              )}
            </MapControl>

            {/* Building lookup status */}
            {buildingStatus !== "idle" && (
              <p
                role="status"
                className="absolute bottom-14 left-1/2 max-w-[90%] -translate-x-1/2 rounded-full bg-background px-3 py-1.5 text-center text-xs text-heading shadow-md sm:bottom-16 sm:text-sm"
              >
                {buildingStatus === "loading"
                  ? t("findingBuilding")
                  : buildingStatus === "mapRequired"
                    ? t("magicSelectionRequiresMap")
                    : buildingStatus === "notFound"
                      ? t("noBuildingFound")
                      : t("buildingLookupFailed")}
              </p>
            )}

            {/* Points counter (hidden once the area is selected) */}
            {isDrawing && !isAreaSelected && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1.5 text-xs whitespace-nowrap text-heading shadow-md sm:bottom-4 sm:text-sm">
                {t("pointsPlaced", { count: points.length, min: MIN_POINTS })}
              </p>
            )}

            {/* Area selected card: Reset (clear everything) / Next */}
            {isAreaSelected && (
              <div className="absolute right-3 bottom-3 z-20 w-[calc(100%-1.5rem)] max-w-70 rounded-3xl bg-[#171717] p-3 text-center text-white shadow-lg sm:right-4 sm:bottom-4">
                <p className="px-2 py-3 text-sm leading-7 text-white">
                  {t("areaSelected")}
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-muted text-sm text-heading transition-colors hover:bg-muted/80 cursor-pointer"
                  >
                    {t("reset")}
                    <RotateCcw className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                  >
                    {t("next")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary px-4 py-5 text-sm text-primary-foreground sm:items-center sm:px-5 sm:py-6 sm:text-base">
          <Star className="mt-0.5 size-3.5 shrink-0 fill-current sm:mt-0" />
          <p className="text-primary-foreground">{t("disclaimer")}.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Small round / square map control button
------------------------------------------------------------------- */

function MapControl({
  children,
  label,
  onClick,
  pressed,
  disabled,
  className,
  shape = "round",
  positioned = true,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  shape?: "round" | "square";
  positioned?: boolean;
}) {
  return (
    <Button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9.5 items-center justify-center bg-background text-heading shadow-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground/60 disabled:hover:bg-background",
        shape === "round" ? "rounded-full" : "rounded-md",
        pressed && "bg-primary hover:bg-primary/90",
        positioned && "absolute",
        className,
      )}
    >
      {children}
    </Button>
  );
}
