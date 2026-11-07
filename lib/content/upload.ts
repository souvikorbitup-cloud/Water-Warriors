import { deleteFromCloudinary } from "@/lib/cloudinary/delete";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

const MEGABYTE = 1024 * 1024;

function getMaxUploadBytes(
  value: string | undefined,
  defaultMegabytes: number,
) {
  const megabytes = Number(value);
  return Number.isFinite(megabytes) && megabytes > 0
    ? megabytes * MEGABYTE
    : defaultMegabytes * MEGABYTE;
}

export const MAX_IMAGE_BYTES = getMaxUploadBytes(
  process.env.NEXT_PUBLIC_MAX_PHOTO_MEGA_BYTES,
  10,
);

export function isOptionalFile(
  value: FormDataEntryValue | null,
): value is File | null {
  return value === null || value instanceof File;
}

export function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    return "Choose an image file.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Choose a non-empty image under ${MAX_IMAGE_BYTES / MEGABYTE}MB.`;
  }
  return null;
}

export async function uploadContentImage(file: File, folder: string) {
  return uploadToCloudinary(
    Buffer.from(await file.arrayBuffer()),
    folder,
    "image",
  );
}

export async function deleteContentImage(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await deleteFromCloudinary(publicId, "image");
  } catch (error) {
    console.error("Failed to delete content image:", error);
  }
}

export function parseBooleanField(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
}

export function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

export function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
