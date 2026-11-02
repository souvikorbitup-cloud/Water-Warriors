"use client";

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
import type { DemoVideoSettings } from "@/lib/appearance/demo-video";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

function isDemoVideoSettings(value: unknown): value is DemoVideoSettings {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    (typeof s.videoPublicId === "string" || s.videoPublicId === null) &&
    (typeof s.videoUrl === "string" || s.videoUrl === null)
  );
}

export default function DemoVideoForm({
  initialSettings,
}: {
  initialSettings: DemoVideoSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
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

  async function saveSettings() {
    if (!videoFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch("/api/demo-video", {
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
            : "Could not update demo video.";
        throw new Error(message);
      }

      if (!isDemoVideoSettings(result)) {
        throw new Error("The server returned invalid demo video settings.");
      }

      setSettings(result);
      selectVideo(null);
      setInputKey((key) => key + 1);
      toast.success("Demo video updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update demo video.",
      );
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = videoObjectUrl ?? settings.videoUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Demo Video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the video shown when visitors click &ldquo;Click here for a
          demo&rdquo; on the homepage.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Demo video</CardTitle>
          <CardDescription>
            Choose a video file to replace the current demo video.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl ? (
            <video
              key={previewUrl}
              className="aspect-video w-full rounded-lg bg-muted object-cover"
              src={previewUrl}
              controls
              muted
              playsInline
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              No demo video uploaded yet.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="demo-video">Replace demo video</Label>
            <input
              key={`video-${inputKey}`}
              id="demo-video"
              type="file"
              accept="video/*"
              onChange={(e) => selectVideo(e.target.files?.[0] ?? null)}
              disabled={saving}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex max-w-2xl justify-end">
        <PrimaryButton
          btnType="solid-primary"
          type="button"
          onClick={() => void saveSettings()}
          disabled={saving || !videoFile}
        >
          {saving ? "Uploading..." : "Save demo video"}
        </PrimaryButton>
      </div>
    </div>
  );
}
