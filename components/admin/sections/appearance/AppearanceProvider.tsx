"use client";

import { useEffect, type ReactNode } from "react";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  isAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/appearance/settings";

export const APPEARANCE_SETTINGS_UPDATED_EVENT = "appearance-settings-updated";

function applyAppearanceSettings(settings: AppearanceSettings) {
  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--secondary", settings.secondaryColor);
  root.style.setProperty(
    "--font-heading-family",
    `"${settings.headingFont}", sans-serif`,
  );
  root.style.setProperty(
    "--font-body-family",
    `"${settings.bodyFont}", sans-serif`,
  );

  const fontFamilies = [...new Set([settings.headingFont, settings.bodyFont])];
  const query = new URLSearchParams();
  for (const family of fontFamilies) {
    query.append("family", `${family}:wght@400;500;600;700`);
  }
  query.set("display", "swap");

  let fontStylesheet = document.getElementById(
    "appearance-google-fonts",
  ) as HTMLLinkElement | null;
  if (!fontStylesheet) {
    fontStylesheet = document.createElement("link");
    fontStylesheet.id = "appearance-google-fonts";
    fontStylesheet.rel = "stylesheet";
    document.head.append(fontStylesheet);
  }
  fontStylesheet.href = `https://fonts.googleapis.com/css2?${query.toString()}`;
}

export default function AppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    applyAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS);

    const handleSettingsUpdated = (event: Event) => {
      const settings = (event as CustomEvent<unknown>).detail;
      if (isAppearanceSettings(settings)) {
        applyAppearanceSettings(settings);
      }
    };

    window.addEventListener(
      APPEARANCE_SETTINGS_UPDATED_EVENT,
      handleSettingsUpdated,
    );

    const controller = new AbortController();
    void fetch("/api/appearance", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Appearance settings request failed (${response.status}).`,
          );
        }

        const settings: unknown = await response.json();
        if (!isAppearanceSettings(settings)) {
          throw new Error("The server returned invalid appearance settings.");
        }
        applyAppearanceSettings(settings);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Could not load appearance settings.", error);
      });

    return () => {
      controller.abort();
      window.removeEventListener(
        APPEARANCE_SETTINGS_UPDATED_EVENT,
        handleSettingsUpdated,
      );
    };
  }, []);

  return children;
}
