"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  GOOGLE_FONT_FAMILIES,
  isAppearanceSettings,
  isGoogleFontFamily,
  type AppearanceSettings,
} from "@/lib/appearance/settings";
import { APPEARANCE_SETTINGS_UPDATED_EVENT } from "@/components/admin/sections/appearance/AppearanceProvider";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

function isHexColor(value: string) {
  return /^#[\da-f]{6}$/i.test(value);
}

export default function AppearanceSettingsForm({
  initialSettings,
}: {
  initialSettings: AppearanceSettings;
}) {
  const [settings, setSettings] = useState<AppearanceSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  function updateColor(
    field: "primaryColor" | "secondaryColor",
    value: string,
  ) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch("/api/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "Could not save appearance settings.";
        throw new Error(message);
      }
      if (!isAppearanceSettings(result)) {
        throw new Error("The server returned invalid appearance settings.");
      }

      setSettings(result);
      window.dispatchEvent(
        new CustomEvent(APPEARANCE_SETTINGS_UPDATED_EVENT, {
          detail: result,
        }),
      );
      toast.success("Brand appearance updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save appearance settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const canSave = isAppearanceSettings(settings) && !saving;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">
          Brand Appearance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the colors and Google Fonts used across the site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand colors</CardTitle>
          <CardDescription>
            Choose the primary and secondary colors used by buttons, accents,
            backgrounds, and logos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {(
            [
              ["primaryColor", "Primary color"],
              ["secondaryColor", "Secondary color"],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  aria-label={`${label} picker`}
                  className="h-10 w-14 cursor-pointer p-1"
                  type="color"
                  value={
                    isHexColor(settings[field])
                      ? settings[field]
                      : DEFAULT_APPEARANCE_SETTINGS[field]
                  }
                  onChange={(event) => updateColor(field, event.target.value)}
                  disabled={saving}
                />
                <Input
                  id={field}
                  className="h-10"
                  value={settings[field]}
                  maxLength={7}
                  onChange={(event) => updateColor(field, event.target.value)}
                  aria-invalid={!isHexColor(settings[field])}
                  disabled={saving}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Select heading and body typefaces from Google Fonts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="headingFont">Heading font</Label>
            <select
              id="headingFont"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={settings.headingFont}
              onChange={(event) => {
                const font = event.target.value;
                if (isGoogleFontFamily(font)) {
                  setSettings((current) => ({
                    ...current,
                    headingFont: font,
                  }));
                }
              }}
              disabled={saving}
            >
              {GOOGLE_FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyFont">Body font</Label>
            <select
              id="bodyFont"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={settings.bodyFont}
              onChange={(event) => {
                const font = event.target.value;
                if (isGoogleFontFamily(font)) {
                  setSettings((current) => ({
                    ...current,
                    bodyFont: font,
                  }));
                }
              }}
              disabled={saving}
            >
              {GOOGLE_FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton
          btnType="solid-primary"
          onClick={() => void saveSettings()}
          disabled={!canSave}
        >
          {saving ? "Saving..." : "Save changes"}
        </PrimaryButton>
      </div>
    </div>
  );
}
