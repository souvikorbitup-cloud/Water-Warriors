// Plain helpers (no "use client") so they can be used from both server and client components.

export function getYouTubeId(url: string): string | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (
      !/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(hostname)
    ) {
      return null;
    }
    if (hostname.includes("youtu.be")) {
      return pathname.split("/").filter(Boolean)[0] || null;
    }
    const [, kind, id] = pathname.split("/");
    if (kind && ["embed", "shorts", "live"].includes(kind)) return id || null;
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
