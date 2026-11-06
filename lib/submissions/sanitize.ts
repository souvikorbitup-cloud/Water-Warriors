export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

export function sanitizePlainText(value: string): string {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

export function sanitizeMultilineText(value: string): string {
  return stripHtml(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
