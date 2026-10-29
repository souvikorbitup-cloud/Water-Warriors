"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { HeroBannerSettings } from "@/lib/appearance/hero-banner";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

function isHeroBannerSettings(value: unknown): value is HeroBannerSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Record<string, unknown>;
  return (
    (typeof settings.videoPublicId === "string" ||
      settings.videoPublicId === null) &&
    (typeof settings.fallbackImagePublicId === "string" ||
      settings.fallbackImagePublicId === null) &&
    typeof settings.videoUrl === "string" &&
    typeof settings.fallbackImageUrl === "string"
  );
}

export default function HeroBannerForm({
  initialSettings,
}: {
  initialSettings: HeroBannerSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fallbackImageFile, setFallbackImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
      }
    },
    [],
  );

  function selectVideo(file: File | null) {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }

    videoObjectUrlRef.current = file ? URL.createObjectURL(file) : null;
    setVideoObjectUrl(videoObjectUrlRef.current);
    setVideoFile(file);
  }

  function selectFallbackImage(file: File | null) {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
    }

    imageObjectUrlRef.current = file ? URL.createObjectURL(file) : null;
    setImageObjectUrl(imageObjectUrlRef.current);
    setFallbackImageFile(file);
  }

  async function saveSettings() {
    if (!videoFile && !fallbackImageFile) {
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append("video", videoFile);
      }
      if (fallbackImageFile) {
        formData.append("fallbackImage", fallbackImageFile);
      }

      const response = await fetch("/api/hero-banner", {
        method: "PUT",
        body: formData,
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "Could not update hero media.";
        throw new Error(message);
      }

      if (!isHeroBannerSettings(result)) {
        throw new Error("The server returned invalid hero banner settings.");
      }

      setSettings(result);
      selectVideo(null);
      selectFallbackImage(null);
      setInputKey((key) => key + 1);
      toast.success("Hero banner media updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update hero media.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Hero Banner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the homepage hero video and its fallback image.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Hero video</CardTitle>
            <CardDescription>
              Choose a video file to replace the current homepage background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <video
              key={videoObjectUrl ?? settings.videoUrl}
              className="aspect-video w-full rounded-lg bg-muted object-cover"
              src={videoObjectUrl ?? settings.videoUrl}
              poster={imageObjectUrl ?? settings.fallbackImageUrl}
              controls
              muted
              playsInline
            />
            <div className="space-y-2">
              <Label htmlFor="hero-video">Replace hero video</Label>
              <input
                key={`video-${inputKey}`}
                id="hero-video"
                type="file"
                accept="video/*"
                onChange={(event) =>
                  selectVideo(event.target.files?.[0] ?? null)
                }
                disabled={saving}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fallback image</CardTitle>
            <CardDescription>
              This image is shown while the hero video is loading and on
              unsupported devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image
              src={imageObjectUrl ?? settings.fallbackImageUrl}
              alt="Hero fallback preview"
              width={1280}
              height={720}
              unoptimized
              className="aspect-video w-full rounded-lg bg-muted object-cover"
            />
            <div className="space-y-2">
              <Label htmlFor="hero-fallback">Replace fallback image</Label>
              <input
                key={`image-${inputKey}`}
                id="hero-fallback"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  selectFallbackImage(event.target.files?.[0] ?? null)
                }
                disabled={saving}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <PrimaryButton
          btnType="solid-primary"
          type="button"
          onClick={() => void saveSettings()}
          disabled={saving || (!videoFile && !fallbackImageFile)}
        >
          {saving ? "Uploading..." : "Save hero media"}
        </PrimaryButton>
      </div>
    </div>
  );
}
