export const GOOGLE_FONT_FAMILIES = [
  "Outfit",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Raleway",
  "DM Sans",
  "Manrope",
  "Work Sans",
] as const;

export type GoogleFontFamily = (typeof GOOGLE_FONT_FAMILIES)[number];

export type AppearanceSettings = {
  primaryColor: string;
  secondaryColor: string;
  headingFont: GoogleFontFamily;
  bodyFont: GoogleFontFamily;
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  primaryColor: "#f1bb1b",
  secondaryColor: "#ffeaac",
  headingFont: "Outfit",
  bodyFont: "Inter",
};

export function isGoogleFontFamily(value: unknown): value is GoogleFontFamily {
  return (
    typeof value === "string" &&
    GOOGLE_FONT_FAMILIES.some((font) => font === value)
  );
}

export function isAppearanceSettings(
  value: unknown,
): value is AppearanceSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Record<string, unknown>;

  return (
    typeof settings.primaryColor === "string" &&
    /^#[\da-f]{6}$/i.test(settings.primaryColor) &&
    typeof settings.secondaryColor === "string" &&
    /^#[\da-f]{6}$/i.test(settings.secondaryColor) &&
    isGoogleFontFamily(settings.headingFont) &&
    isGoogleFontFamily(settings.bodyFont)
  );
}
