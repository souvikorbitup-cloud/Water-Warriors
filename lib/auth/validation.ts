import { z } from "zod";

const INDIAN_PHONE_REGEX = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export const emailSchema = z.string().trim().toLowerCase().email();
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);
export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{M}' .-]+$/u)
  .transform((value) => value.replace(/\s+/g, " "));
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(INDIAN_PHONE_REGEX)
  .transform((value) => {
    const match = value.replace(/[\s-]/g, "").match(INDIAN_PHONE_REGEX);
    return match ? `+91${match[1]}` : value;
  });

export function normalizeIndianPhone(raw: string): string | null {
  const result = indianPhoneSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function isValidIndianPhone(raw: string): boolean {
  return normalizeIndianPhone(raw) !== null;
}

export function isValidEmail(raw: string): boolean {
  return emailSchema.safeParse(raw).success;
}

export function normalizeEmail(raw: string): string {
  const result = emailSchema.safeParse(raw);
  return result.success ? result.data : raw.trim().toLowerCase();
}

export function sanitizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function isValidName(raw: string): boolean {
  return nameSchema.safeParse(raw).success;
}

export function isValidOTPFormat(raw: string): boolean {
  return otpSchema.safeParse(raw).success;
}
