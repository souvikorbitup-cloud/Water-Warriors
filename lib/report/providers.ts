import "server-only";

import { createHash } from "crypto";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";
import ReportAnalysisCache from "@/lib/models/ReportAnalysisCache.model";
import { stripLeadingReportBullet } from "@/lib/report/highlight-text";
import type {
  ReportForecastMonth,
  ReportLocale,
  ReportLocation,
  ReportAnalysisResult,
  ReportPoint,
} from "@/lib/report/types";

type JsonRecord = Record<string, unknown>;
type AnalysisBlock = { kind: "paragraph" | "point"; text: string };

const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-3.5-flash-lite"] as const;
const ANALYSIS_PROMPT_VERSION = "recharge-analysis-v5";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function isAnalysisBlock(value: unknown): value is AnalysisBlock {
  return (
    isRecord(value) &&
    (value.kind === "paragraph" || value.kind === "point") &&
    typeof value.text === "string" &&
    value.text.trim().length > 0
  );
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
  locale: ReportLocale = "en",
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
      `${ANALYSIS_PROMPT_VERSION}|${normalizedLocation}|${areaSqm.toFixed(2)}|${annualRainfallMm.toFixed(1)}|${Math.round(litres)}${locale === "hi" ? "|hi" : ""}`,
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
  potentialLitres: number,
  locale: ReportLocale,
): Promise<ReportAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const countryName =
    new Intl.DisplayNames(["en"], { type: "region" }).of(
      location.countryCode,
    ) ?? location.countryCode;
  const areaName = [
    location.locality,
    location.city,
    location.state,
    countryName,
  ]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
  const litres = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(potentialLitres));
  const roofArea = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(areaSqm);
  const openingQuestion =
    locale === "hi"
      ? `${areaName} में ${roofArea} m² की छत से हर साल ${litres} लीटर वर्षा जल कैसे मदद कर सकता है — और यहाँ जमीन में वर्षा जल वापस पहुँचाना विशेष रूप से क्यों महत्वपूर्ण है?`
      : `How can ${litres} litres of rainwater a year, from a ${roofArea} m² roof in ${areaName}, help — and why does putting rainwater back into the ground matter here in particular?`;
  const promptRules = [
    openingQuestion,
    'You are a hydrogeologist and urban water adviser who knows this region well. Write the "Why Rainwater Recharge Matters" section of a report for the household that owns this roof.',
    "Make it specific to this place. Draw on what is generally known about the area, for example:",
    "- where the area's water comes from (rivers, reservoirs, aquifers, piped supply, borewells, wells) and the pressures on it;",
    "- the local ground: soil and rock type and how readily it lets water soak in;",
    "- local concerns such as falling groundwater, salty or poor-quality groundwater, flooding, waterlogging, drought or polluted run-off;",
    "- traditional or widely used local ways of saving or recharging water.",
    "Explain why recharging the ground matters in this area and what this household's water could mean locally. Treat the litres as a potential yearly saving, not an achievement.",
    "Explain the two or three recharge or reuse methods best suited to this local ground and a typical home here, and why they suit this place. Examples include a recharge pit, recharge well, recharging an existing borewell or well, soak-away, rain garden or storage tank.",
    "Include only local cautions that genuinely apply here, such as a high water table, nearby septic tanks or sewers, contamination, salinity, foundations or slopes; say a local professional should check the site. If recharge is unsuitable or risky here, say so plainly and recommend the better local option, such as storage for household use or a traditional local method.",
    "Briefly and specifically explain how nearby neighbours, apartment societies or residents' groups can multiply the benefit through shared recharge, reviving local lakes, ponds or open ground, and whom to approach.",
    "Write about 300 to 400 words in 4 to 7 blocks. Each block should be a short paragraph or concise point of at most 110 words.",
    'Speak to the household as an adviser: say "you", "your home" and "your area"; never use "we", "our" or "us".',
    'Present local knowledge as generally known or widely reported, never as verified fact about this exact street; qualify possible effects with "can" or "may".',
    'You may name relevant local bodies by their current names. Do not invent statistics, prices, depths or percentages. Apart from the supplied litres and roof area, do not include numbers; small counts such as "two or three" and years are allowed, and rounding the supplied figures within two percent is acceptable.',
    "Do not name specific laws, regulations, schemes, subsidies, prices or dates. You may suggest checking with local bodies.",
    "Do not say the water is safe to drink or make health promises.",
    "Avoid generic filler about lower bills, property value, setting an example, raising awareness or sustainability slogans.",
    "Do not describe rainfall timing or monthly patterns, and do not mention roof or gutter cleaning, first-flush diverters or filters.",
    "Use plain text except for paired double asterisks used for emphasis. Wrap important place names and complete measured quantities, including both the number and its unit (for example, bold the whole roof-area or litres phrase, not only its digits), in **double asterisks**. Do not use any other Markdown.",
    "Point blocks must contain only their text; do not start a point with a bullet, dot or other marker.",
    locale === "hi"
      ? "Write the report in Hindi using clear Devanagari script; keep local place names and technical terms understandable."
      : "Write the report in English.",
    "You must return the metadata field waterValueRupeesPerKilolitre: the best-supported current typical residential water tariff for this location, expressed in INR per 1,000 litres. Prefer a published local water-utility tariff. If no exact local tariff is available, use the closest reliable published residential tariff from the city, district or state as a location-based estimate. Never omit this field. Do not use a generic default or copy a value from the prompt. Do not mention this metadata in the report blocks.",
  ];

  let rejectionReason: string | undefined;
  let lastError: GeminiGenerationError | undefined;
  let validAnalysisWithoutPrice: string[] | undefined;
  for (const modelId of GEMINI_MODEL_IDS) {
    const lines = [...promptRules];
    if (rejectionReason) {
      lines.push(
        `Your previous answer was rejected because: ${rejectionReason}. Write a new answer that follows every rule.`,
      );
    }
    lines.push(
      'Return JSON with required "analysis": {"blocks": [{"kind": "paragraph" | "point", "text": "..."}]} and required nonnegative numeric "waterValueRupeesPerKilolitre".',
    );

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: lines.join("\n") }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  analysis: {
                    type: "OBJECT",
                    properties: {
                      blocks: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            kind: {
                              type: "STRING",
                              enum: ["paragraph", "point"],
                            },
                            text: { type: "STRING" },
                          },
                          required: ["kind", "text"],
                        },
                      },
                    },
                    required: ["blocks"],
                  },
                  waterValueRupeesPerKilolitre: {
                    type: "NUMBER",
                    description:
                      "Residential water tariff in Indian rupees per 1,000 litres, based on the best available local or regional published rate.",
                  },
                },
                required: ["analysis", "waterValueRupeesPerKilolitre"],
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
        throw new GeminiGenerationError(
          `Hydrogeology analysis request failed (${response.status})${detail ? `: ${detail}` : "."}`,
          true,
        );
      }

      const result: unknown = await response.json();
      const parts =
        isRecord(result) &&
        Array.isArray(result.candidates) &&
        isRecord(result.candidates[0]) &&
        isRecord(result.candidates[0].content) &&
        Array.isArray(result.candidates[0].content.parts)
          ? result.candidates[0].content.parts
          : null;
      const text = parts
        ?.filter(isRecord)
        .map((part) => part.text)
        .find((part): part is string => typeof part === "string");
      if (!text) {
        rejectionReason = "the response did not contain the required JSON text";
        throw new GeminiGenerationError(
          `Hydrogeology analysis was rejected: ${rejectionReason}.`,
          true,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        rejectionReason = "the response was not valid JSON";
        throw new GeminiGenerationError(
          `Hydrogeology analysis was rejected: ${rejectionReason}.`,
          true,
        );
      }

      const blocks: unknown[] | null =
        isRecord(parsed) &&
        isRecord(parsed.analysis) &&
        Array.isArray(parsed.analysis.blocks)
          ? parsed.analysis.blocks
          : null;
      if (!blocks || !blocks.every(isAnalysisBlock)) {
        rejectionReason =
          'the JSON did not match {"analysis":{"blocks":[{"kind":"paragraph"|"point","text":"..."}]}}';
        throw new GeminiGenerationError(
          `Hydrogeology analysis was rejected: ${rejectionReason}.`,
          true,
        );
      }

      const validatedBlocks = blocks.map((block) => ({
        kind: block.kind,
        text: block.text.trim(),
      }));
      const wordCount = validatedBlocks.reduce(
        (total, block) => total + block.text.split(/\s+/).length,
        0,
      );
      const hasEmphasis = validatedBlocks.some((block) =>
        /\*\*[^*\r\n]+\*\*/u.test(block.text),
      );
      const hasUnpairedEmphasis = validatedBlocks.some(
        (block) => (block.text.match(/\*\*/g)?.length ?? 0) % 2 !== 0,
      );
      const issue =
        validatedBlocks.length < 4 || validatedBlocks.length > 7
          ? "the answer must contain four to seven blocks"
          : wordCount < 250 || wordCount > 480
            ? "the answer must contain 250 to 480 words"
            : validatedBlocks.some(
                  (block) => block.text.split(/\s+/).length > 130,
                )
              ? "each block must contain no more than 130 words"
              : validatedBlocks.some((block) =>
                    /\b(?:we|our|us)\b|हम(?:ारा|ारी|ा|े|ें)?/iu.test(
                      block.text,
                    ),
                  )
                ? 'the answer must not use "we", "our", "us", or first-person plural Hindi phrasing'
                : !hasEmphasis || hasUnpairedEmphasis
                  ? "wrap important figures with their units and place names in paired double asterisks"
                  : null;

      const numberTokens = validatedBlocks.flatMap(
        (block) =>
          block.text.match(/[0-9०-९][0-9०-९,]*(?:\.[0-9०-९]+)?/gu) ?? [],
      );
      const invalidNumber = numberTokens.find((token) => {
        const normalized = token
          .replace(/[०-९]/g, (digit) =>
            String(digit.charCodeAt(0) - "०".charCodeAt(0)),
          )
          .replace(/,/g, "");
        const value = Number(normalized);
        const withinTwoPercent = (candidate: number, expected: number) =>
          expected === 0
            ? candidate === 0
            : Math.abs(candidate - expected) <= expected * 0.02;
        return !(
          (Number.isInteger(value) && value >= 1800 && value <= 2099) ||
          withinTwoPercent(value, potentialLitres) ||
          withinTwoPercent(value, areaSqm)
        );
      });
      const rejection =
        issue ??
        (invalidNumber
          ? `the number ${invalidNumber} is not the supplied litres or roof area`
          : null);
      if (rejection) {
        rejectionReason = rejection;
        throw new GeminiGenerationError(
          `Hydrogeology analysis was rejected: ${rejection}.`,
          true,
        );
      }

      const waterValueRupeesPerKilolitre =
        isRecord(parsed) &&
        typeof parsed.waterValueRupeesPerKilolitre === "number" &&
        Number.isFinite(parsed.waterValueRupeesPerKilolitre) &&
        parsed.waterValueRupeesPerKilolitre >= 0
          ? parsed.waterValueRupeesPerKilolitre
          : undefined;
      const analysis = validatedBlocks.map((block) =>
        stripLeadingReportBullet(block.text),
      );
      if (waterValueRupeesPerKilolitre === undefined) {
        validAnalysisWithoutPrice = analysis;
        rejectionReason =
          "the response must include a nonnegative location-based waterValueRupeesPerKilolitre price per 1,000 litres";
        throw new GeminiGenerationError(
          `Hydrogeology analysis was rejected: ${rejectionReason}.`,
          true,
        );
      }
      return {
        analysis,
        waterValueRupeesPerKilolitre,
      };
    } catch (error) {
      lastError =
        error instanceof GeminiGenerationError
          ? error
          : new GeminiGenerationError(
              `Hydrogeology analysis request failed: ${error instanceof Error ? error.message : "unknown error"}`,
              true,
            );
    }
  }

  if (validAnalysisWithoutPrice) {
    return { analysis: validAnalysisWithoutPrice };
  }
  throw (
    lastError ??
    new GeminiGenerationError(
      "Hydrogeology analysis did not produce an answer.",
      true,
    )
  );
}

export async function getHydrogeologyAnalysis(
  location: ReportLocation,
  areaSqm: number,
  annualRainfallMm: number,
  potentialLitres: number,
  cacheResult = true,
  locale: ReportLocale = "en",
): Promise<ReportAnalysisResult> {
  if (!cacheResult) {
    return requestHydrogeologyAnalysis(
      location,
      areaSqm,
      potentialLitres,
      locale,
    );
  }

  await ReportAnalysisCache.init();
  const cacheKey = getAnalysisCacheKey(
    location,
    areaSqm,
    annualRainfallMm,
    potentialLitres,
    locale,
  );
  const cached = await ReportAnalysisCache.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (cached?.waterValueRupeesPerKilolitre !== undefined) {
    return {
      analysis: cached.analysis,
      waterValueRupeesPerKilolitre: cached.waterValueRupeesPerKilolitre,
    };
  }

  const analysis = await requestHydrogeologyAnalysis(
    location,
    areaSqm,
    potentialLitres,
    locale,
  );
  if (analysis.waterValueRupeesPerKilolitre === undefined) {
    return analysis;
  }

  try {
    const cacheFields: Record<string, unknown> = {
      analysis: analysis.analysis,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    if (analysis.waterValueRupeesPerKilolitre !== undefined) {
      cacheFields.waterValueRupeesPerKilolitre =
        analysis.waterValueRupeesPerKilolitre;
    }
    await ReportAnalysisCache.updateOne(
      { cacheKey },
      {
        $set: cacheFields,
        ...(analysis.waterValueRupeesPerKilolitre === undefined
          ? { $unset: { waterValueRupeesPerKilolitre: "" } }
          : {}),
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
  await ReportAnalysisCache.deleteMany({
    cacheKey: {
      $in: (["en", "hi"] as const).map((locale) =>
        getAnalysisCacheKey(
          location,
          areaSqm,
          annualRainfallMm,
          potentialLitres,
          locale,
        ),
      ),
    },
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
