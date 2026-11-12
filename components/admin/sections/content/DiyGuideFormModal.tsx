"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Modal } from "@/components/admin/shared/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { readApiError } from "@/lib/submissions/api-error";
import { diyGuideInputSchema } from "@/lib/content/schemas";
import { emptyDiyGuideTranslations } from "@/lib/content/client-form";
import type { DiyGuideDetail, DiyGuideListItem } from "@/types/content";
import type { IDiyGuideTranslation } from "@/lib/models/Diyguide.model";
import TranslationTabs from "./TranslationTabs";
import FieldError from "./FieldError";

type MediaSource = "upload" | "external";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function initialThumbnailSource(
  item: DiyGuideDetail | null,
): MediaSource | "none" {
  if (item?.thumbnail?.source === "upload" && item.thumbnail.publicId) {
    return "upload";
  }
  if (item?.thumbnail?.source === "external" && item.thumbnail.externalUrl) {
    return "external";
  }
  return "none";
}

export default function DiyGuideFormModal({
  open,
  item,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: DiyGuideDetail | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (item: DiyGuideListItem) => void;
}) {
  const isEdit = item !== null;
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [order, setOrder] = useState(item ? String(item.order) : "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true);
  const [translations, setTranslations] = useState({
    ...emptyDiyGuideTranslations(),
    ...(item?.translations ?? {}),
  });
  const [videoSource, setVideoSource] = useState<MediaSource>(
    item?.video.source ?? "external",
  );
  const [videoUrl, setVideoUrl] = useState(item?.video.externalUrl ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailSource, setThumbnailSource] = useState<MediaSource | "none">(
    initialThumbnailSource(item),
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    item?.thumbnail?.source === "external"
      ? (item.thumbnail.externalUrl ?? "")
      : "",
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(
    item?.durationSeconds != null ? String(item.durationSeconds / 60) : "",
  );
  const [publishedAt, setPublishedAt] = useState(
    toDateInput(item?.publishedAt),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const videoPreviewRef = useRef<string | null>(null);
  const thumbnailPreviewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
      if (thumbnailPreviewRef.current) {
        URL.revokeObjectURL(thumbnailPreviewRef.current);
      }
    },
    [],
  );

  function updateTranslation(
    locale: keyof typeof translations,
    field: keyof IDiyGuideTranslation,
    value: string,
  ) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [field]: value },
    }));
  }

  function selectVideoFile(file: File | null) {
    if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
    videoPreviewRef.current = file ? URL.createObjectURL(file) : null;
    setVideoPreview(videoPreviewRef.current);
    setVideoFile(file);
  }

  function selectThumbnailFile(file: File | null) {
    if (thumbnailPreviewRef.current) {
      URL.revokeObjectURL(thumbnailPreviewRef.current);
    }
    thumbnailPreviewRef.current = file ? URL.createObjectURL(file) : null;
    setThumbnailPreview(thumbnailPreviewRef.current);
    setThumbnailFile(file);
    if (file) setRemoveThumbnail(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving) return;

    const videoPayload =
      videoSource === "upload"
        ? {
            source: "upload" as const,
            publicId:
              item?.video.source === "upload"
                ? item.video.publicId
                : "pending-upload",
            externalUrl: null,
          }
        : {
            source: "external" as const,
            publicId: null,
            externalUrl: videoUrl,
          };

    const thumbnailPayload =
      thumbnailSource === "upload"
        ? {
            source: "upload" as const,
            publicId:
              item?.thumbnail?.source === "upload" && !removeThumbnail
                ? item.thumbnail.publicId
                : thumbnailFile
                  ? "pending-upload"
                  : null,
            externalUrl: null,
          }
        : thumbnailSource === "external"
          ? {
              source: "external" as const,
              publicId: null,
              externalUrl: thumbnailUrl,
            }
          : null;

    const parsed = diyGuideInputSchema.safeParse({
      slug: slug || undefined,
      video: videoPayload,
      thumbnail: thumbnailPayload,
      durationSeconds:
        durationMinutes === ""
          ? null
          : Math.round(Number(durationMinutes) * 60),
      publishedAt: publishedAt || null,
      order: order === "" ? undefined : Number(order),
      isPublished,
      translations,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join(".") || "form";
        if (!errors[key]) errors[key] = issue.message;
      }
      if (videoSource === "upload" && !videoFile && !item?.video.publicId) {
        errors["video.publicId"] = "Choose a video file to upload.";
      }
      if (
        thumbnailSource === "upload" &&
        !thumbnailFile &&
        !(
          item?.thumbnail?.source === "upload" &&
          item.thumbnail.publicId &&
          !removeThumbnail
        )
      ) {
        errors["thumbnail.publicId"] = "Choose a thumbnail image to upload.";
      }
      setFieldErrors(errors);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    if (videoSource === "upload" && !videoFile && !item?.video.publicId) {
      setFieldErrors({ "video.publicId": "Choose a video file to upload." });
      toast.error("Choose a video file to upload.");
      return;
    }
    if (
      thumbnailSource === "upload" &&
      !thumbnailFile &&
      !(
        item?.thumbnail?.source === "upload" &&
        item.thumbnail.publicId &&
        !removeThumbnail
      )
    ) {
      setFieldErrors({
        "thumbnail.publicId": "Choose a thumbnail image to upload.",
      });
      toast.error("Choose a thumbnail image to upload.");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const formData = new FormData();
      if (parsed.data.slug) formData.set("slug", parsed.data.slug);
      formData.set("isPublished", String(parsed.data.isPublished ?? false));
      formData.set("translations", JSON.stringify(parsed.data.translations));
      if (parsed.data.order !== undefined) {
        formData.set("order", String(parsed.data.order));
      }
      if (parsed.data.durationSeconds != null) {
        formData.set("durationSeconds", String(parsed.data.durationSeconds));
      } else {
        formData.set("durationSeconds", "");
      }
      if (parsed.data.publishedAt) {
        formData.set("publishedAt", parsed.data.publishedAt.toISOString());
      } else {
        formData.set("publishedAt", "");
      }
      if (videoSource === "external") {
        formData.set("video", JSON.stringify(parsed.data.video));
      } else if (!videoFile && item?.video) {
        formData.set("video", JSON.stringify(item.video));
      }
      if (videoFile) formData.set("videoFile", videoFile);

      if (thumbnailSource === "none") {
        if (isEdit) formData.set("removeThumbnail", "true");
        formData.set("thumbnail", "null");
      } else if (thumbnailSource === "external") {
        formData.set("thumbnail", JSON.stringify(parsed.data.thumbnail));
      } else if (!thumbnailFile && item?.thumbnail && !removeThumbnail) {
        formData.set("thumbnail", JSON.stringify(item.thumbnail));
      }
      if (thumbnailFile) formData.set("thumbnailFile", thumbnailFile);

      const response = await fetch(
        isEdit ? `/api/admin/diy-guides/${item.id}` : "/api/admin/diy-guides",
        {
          method: isEdit ? "PATCH" : "POST",
          body: formData,
        },
      );
      if (!response.ok) {
        const { message, fieldErrors: nextErrors } = await readApiError(
          response,
          "Could not save DIY guide.",
        );
        if (nextErrors) setFieldErrors(nextErrors);
        throw new Error(message);
      }
      const result = (await response.json()) as { item: DiyGuideListItem };
      toast.success(isEdit ? "DIY guide updated." : "DIY guide created.");
      onSaved(result.item);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save DIY guide.",
      );
    } finally {
      setSaving(false);
    }
  }

  const readOnly = !canEdit;
  const currentThumbnail =
    thumbnailPreview ??
    (!removeThumbnail && thumbnailSource !== "none"
      ? item?.thumbnailUrl
      : "") ??
    "";
  const currentVideo = videoPreview ?? item?.videoUrl ?? "";

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">
        {isEdit ? "Edit DIY guide" : "Add DIY guide"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEdit
          ? "Update this guide, its video, and translations."
          : "Create a DIY guide with English and Hindi titles."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <TranslationTabs
          renderLocale={(locale) => (
            <div>
              <Label htmlFor={`diy-title-${locale}`}>Title</Label>
              <Input
                id={`diy-title-${locale}`}
                className="mt-2 h-10"
                value={translations[locale].title}
                onChange={(event) =>
                  updateTranslation(locale, "title", event.target.value)
                }
                disabled={readOnly || saving}
                maxLength={200}
              />
              <FieldError
                message={fieldErrors[`translations.${locale}.title`]}
              />
            </div>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="diy-slug">Slug</Label>
            <Input
              id="diy-slug"
              className="mt-2 h-10"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={readOnly || saving}
              placeholder="Auto from English title"
            />
            <FieldError message={fieldErrors.slug} />
          </div>
          <div>
            <Label htmlFor="diy-order">Display order</Label>
            <Input
              id="diy-order"
              className="mt-2 h-10"
              type="number"
              min={0}
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              disabled={readOnly || saving}
              placeholder="Auto"
            />
            <FieldError message={fieldErrors.order} />
          </div>
        </div>

        <div>
          <Label htmlFor="diy-video-source">Video source</Label>
          <Select
            value={videoSource}
            onValueChange={(value) => setVideoSource(value as MediaSource)}
            disabled={readOnly || saving}
          >
            <SelectTrigger id="diy-video-source" className="mt-2 h-10! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-99999">
              <SelectItem value="external">External URL</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
            </SelectContent>
          </Select>
          <FieldError
            message={fieldErrors.video || fieldErrors["video.source"]}
          />
        </div>

        {videoSource === "external" ? (
          <div>
            <Label htmlFor="diy-video-url">Video URL</Label>
            <Input
              id="diy-video-url"
              className="mt-2 h-10"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              disabled={readOnly || saving}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <FieldError message={fieldErrors["video.externalUrl"]} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="diy-video-file">Video file</Label>
            <input
              id="diy-video-file"
              type="file"
              accept="video/*"
              disabled={readOnly || saving}
              onChange={(event) =>
                selectVideoFile(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
            {currentVideo ? (
              <video
                src={currentVideo}
                className="mt-2 h-32 w-full rounded-lg object-cover"
                controls
              />
            ) : null}
            <FieldError message={fieldErrors["video.publicId"]} />
          </div>
        )}

        <div>
          <Label htmlFor="diy-thumb-source">Thumbnail</Label>
          <Select
            value={thumbnailSource}
            onValueChange={(value) => {
              setThumbnailSource(value as MediaSource | "none");
              if (value === "none") setRemoveThumbnail(true);
              else setRemoveThumbnail(false);
            }}
            disabled={readOnly || saving}
          >
            <SelectTrigger id="diy-thumb-source" className="mt-2 h-10! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-99999">
              <SelectItem value="none">None (YouTube only)</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.thumbnail} />
        </div>

        {thumbnailSource === "external" ? (
          <div>
            <Label htmlFor="diy-thumb-url">Thumbnail URL</Label>
            <Input
              id="diy-thumb-url"
              className="mt-2 h-10"
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
              disabled={readOnly || saving}
              placeholder="https://..."
            />
            <FieldError message={fieldErrors["thumbnail.externalUrl"]} />
          </div>
        ) : null}

        {thumbnailSource === "upload" ? (
          <div className="space-y-2">
            <Label htmlFor="diy-thumb-file">Thumbnail image</Label>
            <input
              id="diy-thumb-file"
              type="file"
              accept="image/*"
              disabled={readOnly || saving}
              onChange={(event) =>
                selectThumbnailFile(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
            {currentThumbnail ? (
              <Image
                src={currentThumbnail}
                alt=""
                width={160}
                height={90}
                unoptimized
                className="mt-2 h-24 w-40 rounded-lg object-cover"
              />
            ) : null}
            <FieldError message={fieldErrors["thumbnail.publicId"]} />
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="diy-duration">Duration (minutes)</Label>
            <Input
              id="diy-duration"
              className="mt-2 h-10"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              disabled={readOnly || saving}
              placeholder="Optional"
            />
            <FieldError message={fieldErrors.durationSeconds} />
          </div>
          <div>
            <Label htmlFor="diy-published-at">Publication date</Label>
            <Input
              id="diy-published-at"
              className="mt-2 h-10"
              type="date"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              disabled={readOnly || saving}
            />
            <FieldError message={fieldErrors.publishedAt} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-heading">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            disabled={readOnly || saving}
            className="size-4 accent-primary"
          />
          Published
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton
            type="button"
            btnType="outline"
            className="border-border"
            onClick={onClose}
          >
            {canEdit ? "Cancel" : "Close"}
          </PrimaryButton>
          {canEdit ? (
            <PrimaryButton
              type="submit"
              btnType="solid-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </PrimaryButton>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
