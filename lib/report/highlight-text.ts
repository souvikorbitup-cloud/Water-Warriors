export type ReportTextSegment = {
  text: string;
  emphasize: boolean;
};

export function stripLeadingReportBullet(text: string): string {
  return text.replace(/^\s*(?:[•·●▪▫‣⁃]\s*|[-–—]\s+)/u, "").trimStart();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitReportText(
  text: string,
  importantTerms: readonly string[] = [],
): ReportTextSegment[] {
  const cleanText = stripLeadingReportBullet(text);
  const markedSegments: ReportTextSegment[] = [];
  const boldMatcher = /\*\*([\s\S]+?)\*\*/gu;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = boldMatcher.exec(cleanText)) !== null) {
    if (match.index > cursor) {
      markedSegments.push({
        text: cleanText.slice(cursor, match.index),
        emphasize: false,
      });
    }
    markedSegments.push({ text: match[1] ?? "", emphasize: true });
    cursor = match.index + match[0].length;
  }

  if (cursor < cleanText.length) {
    markedSegments.push({
      text: cleanText.slice(cursor),
      emphasize: false,
    });
  }
  if (markedSegments.some((segment) => segment.emphasize)) {
    return markedSegments;
  }

  const terms = [...new Set(importantTerms.map((term) => term.trim()))]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp);
  const numericPattern =
    "[0-9०-९]+(?:,[0-9०-९]{2,3})*(?:\\.[0-9०-९]+)?(?:\\s*(?:square\\s+metres?|square\\s+meters?|sq\\.?\\s*m(?:etres?|eters?)?|m²|litres?|liters?|metres?|meters?|लीटर|वर्ग\\s*मीटर|मीटर))?";
  const pattern = [...terms, numericPattern].join("|");
  const matcher = new RegExp(pattern, "giu");
  const segments: ReportTextSegment[] = [];
  cursor = 0;

  while ((match = matcher.exec(cleanText)) !== null) {
    if (match.index > cursor) {
      segments.push({
        text: cleanText.slice(cursor, match.index),
        emphasize: false,
      });
    }
    segments.push({ text: match[0], emphasize: true });
    cursor = match.index + match[0].length;
  }

  if (cursor < cleanText.length) {
    segments.push({
      text: cleanText.slice(cursor),
      emphasize: false,
    });
  }

  return segments.length > 0
    ? segments
    : [{ text: cleanText, emphasize: false }];
}
