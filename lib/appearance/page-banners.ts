export const BANNER_PAGES = [
  "about-us",
  "leadership",
  "feedback",
  "contact-us",
  "education",
  "privacy-policy",
] as const;
export type BannerPage = (typeof BANNER_PAGES)[number];

export const BANNER_LOCALES = ["en", "hi"] as const;
export type BannerLocale = (typeof BANNER_LOCALES)[number];

export const PAGE_BANNERS_SETTINGS_ID = "page-banners";

export const BANNER_LIMITS = { heading: 80, highlight: 80, description: 300 };

export type BannerText = {
  heading: string;
  highlight: string;
  description: string;
};

export type PageBannerSettings = {
  imagePublicId: string | null;
  imageUrl: string | null; // null -> use default fallback image
  translations: Partial<Record<BannerLocale, BannerText>>;
};

export type PageBannerMap = Record<BannerPage, PageBannerSettings>;

export function isBannerPage(v: unknown): v is BannerPage {
  return (
    typeof v === "string" && (BANNER_PAGES as readonly string[]).includes(v)
  );
}
