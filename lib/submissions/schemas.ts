import { z } from "zod";
import {
  CONTACT_STATUSES,
  FEEDBACK_STATUSES,
  FEEDBACK_TOPICS,
  type ContactStatus,
  type FeedbackStatus,
  type FeedbackTopic,
} from "@/lib/submissions/constants";
import { emailSchema } from "@/lib/auth/validation";
import { sanitizeMultilineText, sanitizePlainText } from "./sanitize";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const SORT_VALUES = [
  "createdAt:desc",
  "createdAt:asc",
  "name:asc",
  "name:desc",
  "status:asc",
  "status:desc",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

const nameSchema = z
  .string()
  .transform(sanitizePlainText)
  .pipe(
    z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
  );

const optionalNameSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const cleaned = sanitizePlainText(value);
  return cleaned.length === 0 ? undefined : cleaned;
}, z.string().max(100, "Name cannot exceed 100 characters").optional());

const requiredEmailSchema = z
  .string()
  .transform((value) => sanitizePlainText(value).toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Email is required")
      .max(254, "Email cannot exceed 254 characters")
      .refine(
        (value) =>
          EMAIL_REGEX.test(value) && emailSchema.safeParse(value).success,
        "Please enter a valid email",
      ),
  );

const optionalEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return undefined;
    const cleaned = sanitizePlainText(value).toLowerCase();
    return cleaned.length === 0 ? undefined : cleaned;
  },
  z
    .string()
    .max(254, "Email cannot exceed 254 characters")
    .refine((value) => EMAIL_REGEX.test(value), "Please enter a valid email")
    .optional(),
);

const messageSchema = z
  .string()
  .transform(sanitizeMultilineText)
  .pipe(
    z
      .string()
      .min(5, "Message must be at least 5 characters")
      .max(5000, "Message cannot exceed 5000 characters"),
  );

export const contactSubmissionSchema = z.object({
  name: nameSchema,
  email: requiredEmailSchema,
  message: messageSchema,
});

export const feedbackSubmissionSchema = z.object({
  topic: z.enum(FEEDBACK_TOPICS, {
    error: "Please select a feedback topic.",
  }),
  rating: z.coerce
    .number({ error: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  name: optionalNameSchema,
  email: optionalEmailSchema,
  message: messageSchema,
});

const adminNoteSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return sanitizeMultilineText(value);
}, z.string().max(1000, "Note cannot exceed 1000 characters").optional());

export const contactAdminUpdateSchema = z
  .object({
    status: z.enum(CONTACT_STATUSES).optional(),
    adminNote: adminNoteSchema,
  })
  .refine(
    (value) => value.status !== undefined || value.adminNote !== undefined,
    {
      message: "Provide a status or admin note to update.",
    },
  );

export const feedbackAdminUpdateSchema = z
  .object({
    status: z.enum(FEEDBACK_STATUSES).optional(),
    adminNote: adminNoteSchema,
  })
  .refine(
    (value) => value.status !== undefined || value.adminNote !== undefined,
    {
      message: "Provide a status or admin note to update.",
    },
  );

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(200).optional().default(""),
  status: z.string().trim().optional().default(""),
  sort: z.enum(SORT_VALUES).default("createdAt:desc"),
  topic: z.string().trim().optional().default(""),
  rating: z.string().trim().optional().default(""),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
export type ContactAdminUpdateInput = z.infer<typeof contactAdminUpdateSchema>;
export type FeedbackAdminUpdateInput = z.infer<
  typeof feedbackAdminUpdateSchema
>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;

export function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export function isFeedbackTopic(value: string): value is FeedbackTopic {
  return (FEEDBACK_TOPICS as readonly string[]).includes(value);
}

export function zodErrorToFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function firstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
