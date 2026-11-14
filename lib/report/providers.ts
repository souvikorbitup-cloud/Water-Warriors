import "server-only";

import { createHash } from "crypto";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";
import ReportAnalysisCache from "@/lib/models/ReportAnalysisCache.model";
import type {
  ReportForecastMonth,
  ReportLocation,
  ReportPoint,
} from "@/lib/report/types";

type JsonRecord = Record<string, unknown>;

const GEMINI_MODEL_ID = "gemini-3.5-flash-lite";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

async function fetchJson(url: URL, provider: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`${provider} request failed (${response.status}).`);
  }
  return response.json();
}

function getAddressComponent(
  components: unknown[],
  type: string,
  short = false,
): string {
  for (const component of components) {
    if (!isRecord(component) || !Array.isArray(component.types)) continue;
    if (!component.types.includes(type)) continue;
    const value = short ? component.short_name : component.long_name;
    return typeof value === "string" ? value : "";
  }
  return "";
}

export async function reverseGeocode(
  centroid: ReportPoint,
): Promise<ReportLocation> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEOCODING_API_KEY is not configured.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${centroid.lat},${centroid.lng}`);
  url.searchParams.set("key", apiKey);
  const result = await fetchJson(url, "Reverse geocoding");

  if (
    !isRecord(result) ||
    result.status !== "OK" ||
    !Array.isArray(result.results)
  ) {
    const reason =
      isRecord(result) && typeof result.status === "string"
        ? result.status
        : "invalid response";
    const detail =
      isRecord(result) && typeof result.error_message === "string"
        ? result.error_message.trim().slice(0, 240)
        : "";
    if (reason === "REQUEST_DENIED" && /referer restrictions/i.test(detail)) {
      throw new Error(
        "GOOGLE_GEOCODING_API_KEY has HTTP referrer restrictions. Use a server-side key restricted to the Geocoding API and, where possible, the server's IP address.",
      );
    }
    throw new Error(
      `Reverse geocoding returned ${reason}${detail ? `: ${detail}` : "."}`,
    );
  }

  const components = result.results
    .filter(isRecord)
    .flatMap((address) =>
      Array.isArray(address.address_components)
        ? address.address_components
        : [],
    );
  const locality =
    getAddressComponent(components, "locality") ||
    getAddressComponent(components, "sublocality_level_1");
  const city =
    getAddressComponent(components, "locality") ||
    getAddressComponent(components, "postal_town") ||
    getAddressComponent(components, "administrative_area_level_3");
  const district = getAddressComponent(
    components,
    "administrative_area_level_2",
  );
  const state = getAddressComponent(components, "administrative_area_level_1");
  const countryCode = getAddressComponent(components, "country", true);

  if (!locality || !city || !district || !state || !countryCode) {
    throw new Error(
      "Reverse geocoding did not return all required locality details.",
    );
  }

  return { locality, city, district, state, countryCode };
}

export async function getAverageAnnualRainfall(
  point: ReportPoint,
): Promise<number> {
  const endYear = new Date().getUTCFullYear() - 1;
  const startYear = endYear - 9;
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lng));
  url.searchParams.set("start_date", `${startYear}-01-01`);
  url.searchParams.set("end_date", `${endYear}-12-31`);
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const result = await fetchJson(url, "Historical rainfall");
  if (!isRecord(result) || !isRecord(result.daily)) {
    throw new Error("Historical rainfall returned an invalid response.");
  }

  const dates = result.daily.time;
  const values = result.daily.precipitation_sum;
  if (
    !Array.isArray(dates) ||
    !Array.isArray(values) ||
    dates.length !== values.length
  ) {
    throw new Error("Historical rainfall data is incomplete.");
  }

  const yearlyTotals = new Map<number, { total: number; days: number }>();
  dates.forEach((date, index) => {
    const value = values[index];
    if (
      typeof date !== "string" ||
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      return;
    }

    const year = Number(date.slice(0, 4));
    if (!Number.isInteger(year) || year < startYear || year > endYear) return;
    const current = yearlyTotals.get(year) ?? { total: 0, days: 0 };
    current.total += value;
    current.days += 1;
    yearlyTotals.set(year, current);
  });

  const completeYears = [...yearlyTotals.values()].filter(
    (year) => year.days >= 350,
  );
  if (completeYears.length < 8) {
    throw new Error(
      "Historical rainfall did not include enough complete years.",
    );
  }

  const average =
    completeYears.reduce((total, year) => total + year.total, 0) /
    completeYears.length;
  if (!Number.isFinite(average) || average < 0) {
    throw new Error("Historical rainfall returned an invalid annual average.");
  }
  return average;
}

function getMonthStart(date: Date, offset: number): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1),
  )
    .toISOString()
    .slice(0, 10);
}

function daysInMonth(monthStart: string): number {
  const [year, month] = monthStart.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, month ?? 1, 0)).getUTCDate();
}

export async function getFiveMonthForecast(
  point: ReportPoint,
  areaSqm: number,
  runoffCoefficient: number,
): Promise<ReportForecastMonth[]> {
  const url = new URL("https://seasonal-api.open-meteo.com/v1/seasonal");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lng));
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const result = await fetchJson(url, "Seasonal rainfall forecast");
  if (!isRecord(result) || !isRecord(result.daily)) {
    throw new Error("Seasonal forecast returned an invalid response.");
  }

  const daily = result.daily;
  const dates = daily.time;
  if (
    !Array.isArray(dates) ||
    !dates.every((date) => typeof date === "string")
  ) {
    throw new Error("Seasonal forecast dates are invalid.");
  }
  const memberKeys = Object.keys(daily).filter((key) =>
    /^precipitation_sum_member\d+$/.test(key),
  );
  const baseValues = daily.precipitation_sum;
  const members = memberKeys
    .map((key) => daily[key])
    .filter((member): member is unknown[] => Array.isArray(member));
  if (members.length === 0 && !Array.isArray(baseValues)) {
    throw new Error("Seasonal forecast precipitation values are unavailable.");
  }

  const now = new Date();
  const targetMonths = Array.from({ length: 5 }, (_, index) =>
    getMonthStart(now, index + 1),
  );

  return targetMonths.map((monthStart) => {
    const expectedDays = daysInMonth(monthStart);
    const dailyRainfall = new Map<string, number>();

    dates.forEach((date, index) => {
      if (
        typeof date !== "string" ||
        !date.startsWith(monthStart.slice(0, 7))
      ) {
        return;
      }

      const ensembleValues = members
        .map((member) => member[index])
        .filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value) && value >= 0,
        );
      const baseValue =
        Array.isArray(baseValues) &&
        typeof baseValues[index] === "number" &&
        Number.isFinite(baseValues[index])
          ? baseValues[index]
          : null;
      const rainfall =
        ensembleValues.length > 0
          ? ensembleValues.reduce((sum, value) => sum + value, 0) /
            ensembleValues.length
          : baseValue;
      if (rainfall !== null) dailyRainfall.set(date, rainfall);
    });

    if (dailyRainfall.size < expectedDays - 2) {
      throw new Error(
        `Seasonal forecast is unavailable for ${monthStart.slice(0, 7)}.`,
      );
    }

    const rainfallMm = [...dailyRainfall.values()].reduce(
      (sum, value) => sum + value,
      0,
    );
    return {
      monthStart,
      month: monthStart,
      rainfallMm,
      harvestableLitres: areaSqm * rainfallMm * runoffCoefficient,
    };
  });
}

function getAnalysisCacheKey(
  location: ReportLocation,
  areaSqm: number,
  annualRainfallMm: number,
  litres: number,
): string {
  const normalizedLocation = [
    location.locality,
    location.city,
    location.district,
    location.state,
    location.countryCode,
  ]
    .join("|")
    .toLowerCase()
    .trim();
  return createHash("sha256")
    .update(
      `${normalizedLocation}|${areaSqm.toFixed(2)}|${annualRainfallMm.toFixed(1)}|${Math.round(litres)}`,
    )
    .digest("hex");
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export class GeminiGenerationError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GeminiGenerationError";
  }
}

async function requestHydrogeologyAnalysis(
  location: ReportLocation,
  areaSqm: number,
  annualRainfallMm: number,
  potentialLitres: number,
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  "Provide a cautious, location-specific hydrogeology report for rainwater recharge.",
                  'Return only JSON matching {"analysis":["paragraph 1","paragraph 2","paragraph 3","paragraph 4"]}.',
                  "Cover soil composition, groundwater basin and aquifer behavior, suitable recharge structures, expected recharge benefits, and neighborhood benefits.",
                  "Use only defensible regional context. Clearly qualify uncertainty and do not claim site-specific soil tests, aquifer measurements, or guaranteed recharge.",
                  `Locality: ${location.locality}; city: ${location.city}; district: ${location.district}; state: ${location.state}; country code: ${location.countryCode}.`,
                  `Rooftop area: ${areaSqm.toFixed(2)} square metres.`,
                  `Average annual rainfall: ${annualRainfallMm.toFixed(1)} mm.`,
                  `Calculated potential at a 0.9 runoff coefficient: ${Math.round(potentialLitres)} litres per year.`,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              analysis: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
            },
            required: ["analysis"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    let detail = responseText.trim().slice(0, 240);
    try {
      const errorBody: unknown = JSON.parse(responseText);
      if (
        isRecord(errorBody) &&
        isRecord(errorBody.error) &&
        typeof errorBody.error.message === "string"
      ) {
        detail = errorBody.error.message.trim().slice(0, 240);
      }
    } catch {
      // Keep the bounded response text as the diagnostic.
    }
    const retryable = response.status === 429 || response.status >= 500;
    throw new GeminiGenerationError(
      `Hydrogeology analysis request failed (${response.status})${detail ? `: ${detail}` : "."}`,
      retryable,
    );
  }

  const result: unknown = await response.json();
  if (
    !isRecord(result) ||
    !Array.isArray(result.candidates) ||
    !isRecord(result.candidates[0]) ||
    !isRecord(result.candidates[0].content) ||
    !Array.isArray(result.candidates[0].content.parts)
  ) {
    throw new GeminiGenerationError(
      "Hydrogeology analysis returned an invalid response.",
      true,
    );
  }
  const text = result.candidates[0].content.parts
    .filter(isRecord)
    .map((part) => part.text)
    .find((part): part is string => typeof part === "string");
  if (!text) {
    throw new GeminiGenerationError(
      "Hydrogeology analysis did not contain text.",
      true,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiGenerationError(
      "Hydrogeology analysis returned invalid JSON.",
      true,
    );
  }
  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.analysis) ||
    parsed.analysis.length < 3 ||
    !parsed.analysis.every(
      (item) => typeof item === "string" && item.trim().length > 0,
    )
  ) {
    throw new GeminiGenerationError(
      "Hydrogeology analysis was incomplete.",
      true,
    );
  }

  return parsed.analysis.map((item) => (item as string).trim());
}

export async function getHydrogeologyAnalysis(
  location: ReportLocation,
  areaSqm: number,
  annualRainfallMm: number,
  potentialLitres: number,
  cacheResult = true,
): Promise<string[]> {
  if (!cacheResult) {
    return requestHydrogeologyAnalysis(
      location,
      areaSqm,
      annualRainfallMm,
      potentialLitres,
    );
  }

  await ReportAnalysisCache.init();
  const cacheKey = getAnalysisCacheKey(
    location,
    areaSqm,
    annualRainfallMm,
    potentialLitres,
  );
  const cached = await ReportAnalysisCache.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (cached) return cached.analysis;

  const analysis = await requestHydrogeologyAnalysis(
    location,
    areaSqm,
    annualRainfallMm,
    potentialLitres,
  );
  try {
    await ReportAnalysisCache.updateOne(
      { cacheKey },
      {
        $set: {
          analysis,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  return analysis;
}

export async function deleteHydrogeologyAnalysisCache(
  location: ReportLocation,
  areaSqm: number,
  annualRainfallMm: number,
  potentialLitres: number,
): Promise<void> {
  await ReportAnalysisCache.deleteOne({
    cacheKey: getAnalysisCacheKey(
      location,
      areaSqm,
      annualRainfallMm,
      potentialLitres,
    ),
  });
}

export async function getMapSnapshotType(): Promise<string> {
  const collection = await getSiteSettingsCollection();
  const settings = await collection.findOne<{
    _id: string;
    map_snapshot_type?: unknown;
  }>({ _id: "report-settings" });
  const snapshotType = settings?.map_snapshot_type;
  return snapshotType === "satellite" ||
    snapshotType === "terrain" ||
    snapshotType === "hybrid"
    ? snapshotType
    : "roadmap";
}
