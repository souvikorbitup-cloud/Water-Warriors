// Plain helpers (no "use client") so they can be used from both server and client components.

export function getYouTubeId(url: string): string | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (hostname.includes("youtu.be")) return pathname.slice(1) || null;
    if (pathname.startsWith("/embed/")) return pathname.split("/")[2] ?? null;
    return searchParams.get("v");
  } catch {
    return null;
  }
}

/** "2026-10-15" -> "Oct 15" (formatted in UTC so the day never shifts by time zone) */
export function formatShortDate(iso: string, locale = "en") {
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
