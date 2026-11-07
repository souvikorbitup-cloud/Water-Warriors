import { z } from "zod";
import { routing } from "@/i18n/routing";
import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/submissions/sanitize";
import {
  CONTENT_PUBLISH_STATUSES,
  CONTENT_SORT_VALUES,
  FAQ_GROUPS,
  TEAM_GROUPS,
} from "./constants";

const CLOUDINARY_PUBLIC_ID_REGEX = /^(?!\/)[A-Za-z0-9_\-./]+(?<!\/)$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalCloudinaryId = z.preprocess((value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const cleaned = value.trim();
  return cleaned.length === 0 ? null : cleaned;
}, z.string().max(255, "Image id cannot exceed 255 characters").regex(CLOUDINARY_PUBLIC_ID_REGEX, "Store the Cloudinary public_id, not a URL").nullable());

const optionalOrder = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  },
  z.coerce
    .number({ error: "Order must be a number" })
    .int("Order must be a whole number")
    .min(0, "Order cannot be negative")
    .optional(),
);

const booleanFromUnknown = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

function localeText(options: {
  min: number;
  max: number;
  requiredMessage: string;
  minMessage: string;
  maxMessage: string;
  multiline?: boolean;
}) {
  return z
    .string({ error: options.requiredMessage })
    .transform(options.multiline ? sanitizeMultilineText : sanitizePlainText)
    .pipe(
      z
        .string()
        .min(options.min, options.minMessage)
        .max(options.max, options.maxMessage),
    );
}

const testimonialTranslationSchema = z.object({
  jobRole: localeText({
    min: 2,
    max: 100,
    requiredMessage: "Job role is required",
    minMessage: "Job role must be at least 2 characters",
    maxMessage: "Job role cannot exceed 100 characters",
  }),
  message: localeText({
    min: 10,
    max: 1000,
    requiredMessage: "Message is required",
    minMessage: "Message must be at least 10 characters",
    maxMessage: "Message cannot exceed 1000 characters",
    multiline: true,
  }),
});

const teamTranslationSchema = z.object({
  role: localeText({
    min: 2,
    max: 120,
    requiredMessage: "Role is required",
    minMessage: "Role must be at least 2 characters",
    maxMessage: "Role cannot exceed 120 characters",
  }),
  tagline: localeText({
    min: 3,
    max: 200,
    requiredMessage: "Tagline is required",
    minMessage: "Tagline must be at least 3 characters",
    maxMessage: "Tagline cannot exceed 200 characters",
  }),
  description: localeText({
    min: 10,
    max: 3000,
    requiredMessage: "Description is required",
    minMessage: "Description must be at least 10 characters",
    maxMessage: "Description cannot exceed 3000 characters",
    multiline: true,
  }),
});

const faqTranslationSchema = z.object({
  question: localeText({
    min: 3,
    max: 300,
    requiredMessage: "Question is required",
    minMessage: "Question must be at least 3 characters",
    maxMessage: "Question cannot exceed 300 characters",
  }),
  answer: localeText({
    min: 3,
    max: 2000,
    requiredMessage: "Answer is required",
    minMessage: "Answer must be at least 3 characters",
    maxMessage: "Answer cannot exceed 2000 characters",
    multiline: true,
  }),
});

function translationsSchema<T extends z.ZodType>(entry: T) {
  return z.object(
    Object.fromEntries(routing.locales.map((locale) => [locale, entry])) as {
      [K in (typeof routing.locales)[number]]: T;
    },
  );
}

export const testimonialInputSchema = z.object({
  fullName: localeText({
    min: 2,
    max: 100,
    requiredMessage: "Full name is required",
    minMessage: "Full name must be at least 2 characters",
    maxMessage: "Full name cannot exceed 100 characters",
  }),
  imagePublicId: optionalCloudinaryId.optional(),
  order: optionalOrder,
  isPublished: booleanFromUnknown.optional(),
  translations: translationsSchema(testimonialTranslationSchema),
});

export const testimonialUpdateSchema = testimonialInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const teamMemberInputSchema = z.object({
  group: z.enum(TEAM_GROUPS, { error: "Group is required" }),
  fullName: localeText({
    min: 2,
    max: 100,
    requiredMessage: "Full name is required",
    minMessage: "Full name must be at least 2 characters",
    maxMessage: "Full name cannot exceed 100 characters",
  }),
  slug: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const cleaned = value.trim().toLowerCase();
    return cleaned.length === 0 ? undefined : cleaned;
  }, z.string().max(120, "Slug cannot exceed 120 characters").regex(SLUG_REGEX, "Slug must be lowercase letters, numbers and hyphens").optional()),
  avatarPublicId: optionalCloudinaryId.optional(),
  order: optionalOrder,
  isPublished: booleanFromUnknown.optional(),
  translations: translationsSchema(teamTranslationSchema),
});

export const teamMemberUpdateSchema = teamMemberInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const faqInputSchema = z.object({
  group: z.enum(FAQ_GROUPS).optional(),
  order: optionalOrder,
  isPublished: booleanFromUnknown.optional(),
  translations: translationsSchema(faqTranslationSchema),
});

export const faqUpdateSchema = faqInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(200).optional().default(""),
  status: z
    .union([z.enum(CONTENT_PUBLISH_STATUSES), z.literal("")])
    .optional()
    .default(""),
  sort: z.enum(CONTENT_SORT_VALUES).default("order:asc"),
  group: z.string().trim().optional().default(""),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberInputSchema>;
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>;
export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;
export type ContentListQueryInput = z.infer<typeof contentListQuerySchema>;

export {
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";
