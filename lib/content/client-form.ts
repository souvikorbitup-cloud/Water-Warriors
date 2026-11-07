import { routing, type AppLocale } from "@/i18n/routing";
import type { IFaqTranslation } from "@/lib/models/Faq.model";
import type { ITeamMemberTranslation } from "@/lib/models/Teammember.model";
import type { ITestimonialTranslation } from "@/lib/models/Testimonial.model";

export const CONTENT_LOCALES = routing.locales;
export type ContentLocale = AppLocale;

export function emptyLocaleRecord<T>(
  factory: () => T,
): Record<ContentLocale, T> {
  return Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [locale, factory()]),
  ) as Record<ContentLocale, T>;
}

export function emptyTestimonialTranslations(): Record<
  ContentLocale,
  ITestimonialTranslation
> {
  return emptyLocaleRecord(() => ({ jobRole: "", message: "" }));
}

export function emptyTeamTranslations(): Record<
  ContentLocale,
  ITeamMemberTranslation
> {
  return emptyLocaleRecord(() => ({
    role: "",
    tagline: "",
    description: "",
  }));
}

export function emptyFaqTranslations(): Record<ContentLocale, IFaqTranslation> {
  return emptyLocaleRecord(() => ({ question: "", answer: "" }));
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
