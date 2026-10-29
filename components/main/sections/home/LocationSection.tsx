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
import {
  GoogleMap,
  Marker,
  Polygon,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
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

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LatLng = google.maps.LatLngLiteral;

const INITIAL_CENTER: LatLng = { lat: 22.6446, lng: 88.3737 };
const MIN_POINTS = 4;

// Google Maps overlay options can't read CSS variables, so the brand yellow (--primary) is repeated here.
const BRAND_YELLOW = "#F1BB1B";

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: "greedy",
};

const COORDS_REGEX = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export default function LocationSection() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const suggestionRequestRef = useRef(0);

  const [name, setName] = useState("");
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
  const [points, setPoints] = useState<LatLng[]>([]);
  const [pin, setPin] = useState<LatLng | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
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
          setSuggestionError("Suggestions are unavailable right now.");
          setIsSearchingPlaces(false);
        },
      );
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      suggestionRequestRef.current += 1;
    };
  }, [isPlacesLoaded, isSearchFocused, query]);

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
          setPlacesLoadError("Place suggestions are unavailable right now.");
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, [isLoaded]);

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

  const flyTo = (location: LatLng, zoom = 18) => {
    setPin(location);
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
        setSuggestionError("The selected place has no map location.");
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
      setSuggestionError("Could not load the selected place. Try again.");
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

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return;
    const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPoints((prev) => [...prev, point]);
  };

  const handleReset = () => {
    setPoints([]);
    setIsDrawing(false);
  };

  return (
    <section className="container-y-pad bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_20%,#FFF_100%)]">
      <div className="my-container-x">
        {/* Heading + name field */}
        <div className="grid items-end gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <p className="inline-block border-b border-heading pb-1 text-sm text-heading">
              We value your privacy and never store your data.
            </p>
            <h2 className="mt-1 text-3xl leading-tight font-semibold sm:text-4xl lg:text-[40px]">
              Select Your Location
            </h2>
          </div>

          <div>
            <label
              htmlFor="report-name"
              className="block text-sm text-paragraph"
            >
              To include your name (optional) on the final report, please enter
              it below.
            </label>
            <Input
              id="report-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (Optional)"
              className="mt-2 h-10.5 rounded-md border-border bg-background! px-3 text-sm"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-secondary px-4 py-5 text-sm text-paragraph sm:mt-8 sm:gap-5 sm:px-5.5 sm:py-5.5 sm:text-base">
          <p className="flex items-start gap-3">
            <MapPin className="mt-1 size-3.5 shrink-0 text-heading" />
            <span>
              Select the{" "}
              <strong className="font-semibold text-heading">map icon</strong>{" "}
              to pinpoint your location, or simply enter your location in the
              search bar to get started.
            </span>
          </p>
          <p className="flex items-start gap-3">
            <PenTool className="mt-1 size-3.5 shrink-0 text-heading" />
            <span>
              Select the{" "}
              <strong className="font-semibold text-heading">pen-icon</strong>{" "}
              and tap on the map to place points (at least 4) across your
              roof-top / openarea.
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
                Google Maps failed to load. Check your API key.
              </p>
            ) : !isLoaded ? (
              <div
                className="size-full animate-pulse bg-muted"
                aria-label="Loading map"
              />
            ) : (
              <GoogleMap
                mapContainerClassName="size-full"
                center={INITIAL_CENTER}
                zoom={17}
                mapTypeId={isSatellite ? "satellite" : "roadmap"}
                options={{
                  ...MAP_OPTIONS,
                  draggableCursor: isDrawing ? "crosshair" : undefined,
                }}
                onLoad={onLoad}
                onClick={handleMapClick}
              >
                {pin && <Marker position={pin} />}

                {points.length >= 3 ? (
                  <Polygon
                    paths={points}
                    options={{
                      fillColor: BRAND_YELLOW,
                      fillOpacity: 0.3,
                      strokeColor: BRAND_YELLOW,
                      strokeWeight: 2,
                      clickable: false,
                    }}
                  />
                ) : (
                  <Polyline
                    path={points}
                    options={{
                      strokeColor: BRAND_YELLOW,
                      strokeWeight: 2,
                      clickable: false,
                    }}
                  />
                )}
                {points.map((p, i) => (
                  <Marker
                    key={`${p.lat}-${p.lng}-${i}`}
                    position={p}
                    clickable={false}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 6,
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
                  placeholder="Search by address or coordinates"
                  aria-label="Search by address or coordinates"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isSearchFocused && suggestions.length > 0}
                  aria-controls="location-search-suggestions"
                  aria-activedescendant={
                    activeSuggestionIndex >= 0
                      ? `location-suggestion-${activeSuggestionIndex}`
                      : undefined
                  }
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-heading"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  title="Search"
                  className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ArrowRight className="size-4" />
                </button>
              </form>
              {isSearchFocused &&
                (suggestions.length > 0 ||
                  isSearchingPlaces ||
                  suggestionError) && (
                  <div
                    id="location-search-suggestions"
                    role="listbox"
                    aria-label="Location suggestions"
                    className="mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
                  >
                    {isSearchingPlaces && suggestions.length === 0 && (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        Searching places...
                      </p>
                    )}
                    {suggestions.map((suggestion, index) => {
                      const prediction = suggestion.placePrediction;
                      if (!prediction) return null;

                      return (
                        <button
                          key={prediction.placeId}
                          id={`location-suggestion-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeSuggestionIndex}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onClick={() =>
                            void handleSuggestionSelect(suggestion)
                          }
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                            index === activeSuggestionIndex && "bg-accent",
                          )}
                        >
                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-heading">
                              {prediction.mainText?.text ??
                                prediction.text.text}
                            </span>
                            {prediction.secondaryText && (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {prediction.secondaryText.text}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                    {suggestionError && (
                      <p
                        role="status"
                        className="px-4 py-3 text-sm text-destructive"
                      >
                        {suggestionError}
                      </p>
                    )}
                    {/* <div className="flex justify-end border-t border-border bg-background px-3 py-2"> */}
                    {/* Use Google's hosted attribution asset rather than optimizing or rehosting it. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {/* <img
                        src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
                        alt="Powered by Google"
                        width="120"
                        height="14"
                        className="h-3.5 w-auto"
                      />
                    </div> */}
                  </div>
                )}
              {(placesLoadError || suggestionError) &&
                suggestions.length === 0 && (
                  <p
                    role="status"
                    className="mt-2 rounded-md bg-background px-3 py-1.5 text-xs text-destructive shadow-md"
                  >
                    {placesLoadError ?? suggestionError}
                  </p>
                )}
            </div>

            {/* Fullscreen toggle (top right) */}
            <MapControl
              label={
                isFullscreen ? "Exit full screen" : "Expand map to full screen"
              }
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

            {/* Drawing / locate / reset tools (left) */}
            <div className="absolute top-20 left-3 flex flex-col gap-3.5 sm:top-34 sm:left-5">
              <MapControl
                label={
                  isDrawing ? "Stop placing points" : "Place points on the map"
                }
                pressed={isDrawing}
                onClick={() => setIsDrawing((v) => !v)}
                positioned={false}
              >
                <PenTool className="size-4.5" />
              </MapControl>
              <MapControl
                label="Use my current location"
                onClick={handleLocate}
                positioned={false}
              >
                <LocateFixed className="size-4.5" />
              </MapControl>
              <MapControl
                label="Clear points"
                onClick={handleReset}
                disabled={points.length === 0}
                positioned={false}
              >
                <RotateCcw className="size-4.5" />
              </MapControl>
            </div>

            {/* Satellite / map toggle (bottom left) */}
            <MapControl
              label={
                isSatellite ? "Switch to map view" : "Switch to satellite view"
              }
              pressed={isSatellite}
              onClick={() => setIsSatellite((v) => !v)}
              className="bottom-3 left-3 sm:bottom-4 sm:left-4"
              shape="square"
            >
              {isSatellite ? (
                <MapIcon className="size-4.5" />
              ) : (
                <Satellite className="size-4.5" />
              )}
            </MapControl>

            {/* Points counter */}
            {isDrawing && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1.5 text-xs whitespace-nowrap text-heading shadow-md sm:bottom-4 sm:text-sm">
                {points.length} / {MIN_POINTS} points placed
              </p>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary px-4 py-5 text-sm text-primary-foreground sm:items-center sm:px-5 sm:py-6 sm:text-base">
          <Star className="mt-0.5 size-3.5 shrink-0 fill-current sm:mt-0" />
          <p className="text-primary-foreground">
            All measurements are approximate and intended for reference only. We
            value your privacy and never store your data.
          </p>
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
    <button
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
    </button>
  );
}
