export const HERO_SLIDES_SETTINGS_ID = "hero-slides";
export const MAX_HERO_SLIDES = 8;
export const HERO_LOCALES = ["en", "hi"] as const;
export type HeroLocale = (typeof HERO_LOCALES)[number];

export const HERO_SLIDE_LIMITS = {
  title: 100,
  description: 300,
  buttonLabel: 40,
  buttonUrl: 300,
};

export type HeroSlideText = {
  title: string;
  description: string;
  buttonLabel: string;
};

export type HeroSlide = {
  id: string;
  mediaType: "image" | "video";
  mediaPublicId: string;
  posterPublicId: string | null; // videos only
  isActive: boolean;
  buttonUrl: string; // "" = no button
  translations: Partial<Record<HeroLocale, HeroSlideText>>;
};

export type HeroSlideView = HeroSlide & {
  mediaUrl: string;
  posterUrl: string | null;
};

export function isValidButtonUrl(url: string) {
  return url === "" || /^\/(?!\/)/.test(url) || /^https:\/\//i.test(url);
}

export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

/** Locale text with per-field fallback to English. */
export function resolveHeroSlideText(
  slide: Pick<HeroSlide, "translations">,
  locale: string,
): HeroSlideText {
  const en = slide.translations.en;
  const loc = slide.translations[locale as HeroLocale];
  return {
    title: loc?.title || en?.title || "",
    description: loc?.description || en?.description || "",
    buttonLabel: loc?.buttonLabel || en?.buttonLabel || "",
  };
}

/** Splits "Hey, *Water Warrior*!" into plain and highlighted parts. */
export function splitHeroTitle(title: string) {
  return title
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), highlight: true }
        : { text: part, highlight: false },
    );
}
