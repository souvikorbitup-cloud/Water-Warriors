import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  firstZodErrorMessage,
  zodErrorToFieldErrors,
} from "@/lib/submissions/schemas";
import type { z } from "zod";

export const noStoreHeaders = { "Cache-Control": "no-store" };

export function jsonError(message: string, status: number, extra?: object) {
  return NextResponse.json({ message, ...extra }, { status });
}

export function invalidIdResponse() {
  return jsonError("Record not found.", 404);
}

export function notFoundResponse(entity = "Record") {
  return jsonError(`${entity} not found.`, 404);
}

export function invalidBodyResponse() {
  return jsonError("Invalid request body.", 400);
}

export function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function zodFailure(error: z.ZodError) {
  return NextResponse.json(
    {
      message: firstZodErrorMessage(error),
      fieldErrors: zodErrorToFieldErrors(error),
    },
    { status: 400 },
  );
}

export function duplicateKeyMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    return "A record with this value already exists.";
  }
  return null;
}

export function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export function mongooseValidationMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name?: string }).name === "ValidationError" &&
    "message" in error &&
    typeof (error as { message?: string }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return null;
}
