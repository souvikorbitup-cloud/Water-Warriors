"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/shared/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import {
  HERO_LOCALES,
  HERO_SLIDE_LIMITS as LIMITS,
  MAX_HERO_SLIDES,
  type HeroLocale,
  type HeroSlideText,
  type HeroSlideView,
} from "@/lib/appearance/hero-slides";

const LOCALE_LABELS: Record<HeroLocale, string> = {
  en: "English",
  hi: "हिन्दी",
};
const EMPTY_TEXT: HeroSlideText = {
  title: "",
  description: "",
  buttonLabel: "",
};

type Draft = {
  id: string | null;
  originalMediaType: "image" | "video" | null;
  mediaType: "image" | "video";
  isActive: boolean;
  buttonUrl: string;
  translations: Record<HeroLocale, HeroSlideText>;
  mediaFile: File | null;
  posterFile: File | null;
  removePoster: boolean;
  existingMediaUrl: string | null;
  existingPosterUrl: string | null;
};

function newDraft(): Draft {
  return {
    id: null,
    originalMediaType: null,
    mediaType: "image",
    isActive: true,
    buttonUrl: "",
    translations: { en: EMPTY_TEXT, hi: EMPTY_TEXT },
    mediaFile: null,
    posterFile: null,
    removePoster: false,
    existingMediaUrl: null,
    existingPosterUrl: null,
  };
}

function draftFromSlide(s: HeroSlideView): Draft {
  return {
    id: s.id,
    originalMediaType: s.mediaType,
    mediaType: s.mediaType,
    isActive: s.isActive,
    buttonUrl: s.buttonUrl,
    translations: {
      en: s.translations.en ?? EMPTY_TEXT,
      hi: s.translations.hi ?? EMPTY_TEXT,
    },
    mediaFile: null,
    posterFile: null,
    removePoster: false,
    existingMediaUrl: s.mediaUrl,
    existingPosterUrl: s.posterUrl,
  };
}

function buildFormData(d: Draft) {
  const fd = new FormData();
  if (d.id) fd.append("id", d.id);
  fd.append(
    "data",
    JSON.stringify({
      mediaType: d.mediaType,
      isActive: d.isActive,
      buttonUrl: d.buttonUrl,
      translations: d.translations,
    }),
  );
  if (d.mediaFile) fd.append("media", d.mediaFile);
  if (d.posterFile) fd.append("poster", d.posterFile);
  if (d.removePoster) fd.append("removePoster", "true");
  return fd;
}

async function api(method: string, body?: FormData | string, query = "") {
  const res = await fetch(`/api/hero-slides${query}`, {
    method,
    body,
    headers:
      typeof body === "string"
        ? { "Content-Type": "application/json" }
        : undefined,
  });
  const result = await res.json().catch(() => null);
  if (!res.ok) throw new Error(result?.message ?? "Request failed.");
  return result;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

const btn =
  "rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50 cursor-pointer";
const fileInput =
  "block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground";

function Thumb({ slide }: { slide: HeroSlideView }) {
  return slide.mediaType === "video" ? (
    <video
      className="aspect-video w-40 shrink-0 rounded-lg bg-muted object-cover"
      src={slide.mediaUrl}
      poster={slide.posterUrl ?? undefined}
      muted
      playsInline
      preload="metadata"
    />
  ) : (
    <Image
      src={slide.mediaUrl}
      alt=""
      width={320}
      height={180}
      unoptimized
      className="aspect-video w-40 shrink-0 rounded-lg bg-muted object-cover"
    />
  );
}

/** Modal body. Mounted only while the modal is open, so state resets each time. */
function SlideEditor({
  draft,
  setDraft,
  saving,
  onSave,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [locale, setLocale] = useState<HeroLocale>("en");
  const mediaPreview = useObjectUrl(draft.mediaFile);
  const posterPreview = useObjectUrl(draft.posterFile);
  const text = draft.translations[locale];

  const needsNewMedia =
    !draft.id || draft.mediaType !== draft.originalMediaType;
  const canSave =
    !saving &&
    draft.translations.en.title.trim() !== "" &&
    (!needsNewMedia || draft.mediaFile !== null);

  const mediaSrc =
    mediaPreview ??
    (draft.mediaType === draft.originalMediaType
      ? draft.existingMediaUrl
      : null);
  const posterSrc =
    posterPreview ?? (draft.removePoster ? null : draft.existingPosterUrl);

  function setText(field: keyof HeroSlideText, value: string) {
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [locale]: { ...text, [field]: value },
      },
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSave) onSave();
  }

  const tab = (active: boolean) =>
    `${btn} ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`;

  return (
    <>
      <h2 className="pr-12 text-xl font-semibold text-heading">
        {draft.id ? "Edit slide" : "Add slide"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {draft.id
          ? "Update this slide's media and text."
          : "Create an image or video slide with an overlay, in English and Hindi."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Media */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["image", "video"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={saving}
                  className={tab(draft.mediaType === type)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      mediaType: type,
                      mediaFile: null,
                      posterFile: null,
                    })
                  }
                >
                  {type === "image" ? "Image slide" : "Video slide"}
                </button>
              ))}
            </div>

            {mediaSrc ? (
              draft.mediaType === "video" ? (
                <video
                  key={mediaSrc}
                  className="aspect-video w-full rounded-lg bg-muted object-cover"
                  src={mediaSrc}
                  poster={posterSrc ?? undefined}
                  controls
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={mediaSrc}
                  alt="Slide preview"
                  width={1280}
                  height={720}
                  unoptimized
                  className="aspect-video w-full rounded-lg bg-muted object-cover"
                />
              )
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                No {draft.mediaType} selected
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="slide-media">
                {draft.mediaType === "video" ? "Video file" : "Image file"}
                {needsNewMedia ? " *" : ""}
              </Label>
              <input
                id="slide-media"
                key={`media-${draft.mediaType}`}
                type="file"
                accept={`${draft.mediaType}/*`}
                disabled={saving}
                className={fileInput}
                onChange={(e) =>
                  setDraft({ ...draft, mediaFile: e.target.files?.[0] ?? null })
                }
              />
            </div>

            {draft.mediaType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="slide-poster">
                  Poster image (optional, shown while the video loads)
                </Label>
                <input
                  id="slide-poster"
                  type="file"
                  accept="image/*"
                  disabled={saving}
                  className={fileInput}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      posterFile: e.target.files?.[0] ?? null,
                      removePoster: false,
                    })
                  }
                />
                {posterSrc && (
                  <button
                    type="button"
                    className="text-sm text-destructive underline"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        posterFile: null,
                        removePoster: true,
                      })
                    }
                  >
                    Remove poster
                  </button>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-heading">
              <input
                type="checkbox"
                checked={draft.isActive}
                disabled={saving}
                className="size-4 accent-primary"
                onChange={(e) =>
                  setDraft({ ...draft, isActive: e.target.checked })
                }
              />
              Show this slide on the homepage
            </label>
          </div>

          {/* Text */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {HERO_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={tab(l === locale)}
                  onClick={() => setLocale(l)}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
            {locale !== "en" && (
              <p className="text-xs text-muted-foreground">
                Empty fields fall back to the English text.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="slide-title">
                Title{locale === "en" ? " *" : ""}
              </Label>
              <Input
                id="slide-title"
                value={text.title}
                maxLength={LIMITS.title}
                disabled={saving}
                onChange={(e) => setText("title", e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Wrap words in *asterisks* to highlight them, e.g. Hey, *Water
                Warrior*!
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slide-description">Description</Label>
              <Textarea
                id="slide-description"
                rows={4}
                value={text.description}
                maxLength={LIMITS.description}
                disabled={saving}
                onChange={(e) => setText("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slide-button-label">
                Button label (optional)
              </Label>
              <Input
                id="slide-button-label"
                value={text.buttonLabel}
                maxLength={LIMITS.buttonLabel}
                disabled={saving}
                onChange={(e) => setText("buttonLabel", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slide-button-url">
                Button link (all languages)
              </Label>
              <Input
                id="slide-button-url"
                value={draft.buttonUrl}
                maxLength={LIMITS.buttonUrl}
                placeholder="/about-us or https://example.com"
                disabled={saving}
                onChange={(e) =>
                  setDraft({ ...draft, buttonUrl: e.target.value })
                }
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                The button appears only when both a label and a link are set.
                Use a path starting with / for pages on this site.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton
            type="button"
            btnType="outline"
            className="border-border"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            type="submit"
            btnType="solid-primary"
            disabled={!canSave}
          >
            {saving ? "Saving..." : draft.id ? "Save changes" : "Create"}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}

export default function HeroSlidesManager({
  initialSlides,
}: {
  initialSlides: HeroSlideView[];
}) {
  const [slides, setSlides] = useState(initialSlides);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<HeroSlideView | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function closeEditor() {
    if (!saving) setDraft(null);
  }

  function closeDelete() {
    if (!busyId) setDeleting(null);
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const saved: HeroSlideView = await api(
        draft.id ? "PUT" : "POST",
        buildFormData(draft),
      );
      setSlides((list) =>
        draft.id
          ? list.map((s) => (s.id === saved.id ? saved : s))
          : [...list, saved],
      );
      setDraft(null);
      toast.success(draft.id ? "Slide updated." : "Slide created.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save slide.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(slide: HeroSlideView) {
    setBusyId(slide.id);
    try {
      const saved: HeroSlideView = await api(
        "PUT",
        buildFormData({ ...draftFromSlide(slide), isActive: !slide.isActive }),
      );
      setSlides((list) => list.map((s) => (s.id === saved.id ? saved : s)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update slide.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const slide = deleting;
    setBusyId(slide.id);
    try {
      await api("DELETE", undefined, `?id=${encodeURIComponent(slide.id)}`);
      setSlides((list) => list.filter((s) => s.id !== slide.id));
      setDeleting(null);
      toast.success("Slide deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete slide.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const previous = slides;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
    try {
      await api("PATCH", JSON.stringify({ ids: next.map((s) => s.id) }));
    } catch (e) {
      setSlides(previous);
      toast.error(e instanceof Error ? e.message : "Could not reorder slides.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Hero Slides</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the slides shown in the homepage hero ({slides.length} /{" "}
            {MAX_HERO_SLIDES}). With no active slides, the default hero is
            shown.
          </p>
        </div>
        <PrimaryButton
          btnType="solid-primary"
          type="button"
          disabled={slides.length >= MAX_HERO_SLIDES}
          onClick={() => setDraft(newDraft())}
        >
          Add slide
        </PrimaryButton>
      </div>

      <div className="space-y-3">
        {slides.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No slides yet. Click &ldquo;Add slide&rdquo; to create one.
          </p>
        )}
        {slides.map((slide, index) => (
          <Card key={slide.id}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <Thumb slide={slide} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">
                  {index + 1}.{" "}
                  {slide.translations.en?.title?.replace(/\*/g, "")}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {slide.translations.en?.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {slide.mediaType === "video" ? "Video" : "Image"}
                  {" · "}
                  {slide.isActive ? "Visible" : "Hidden"}
                  {slide.buttonUrl && slide.translations.en?.buttonLabel
                    ? ` · Button: ${slide.translations.en.buttonLabel}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  aria-label="Move up"
                  disabled={index === 0 || busyId !== null}
                  onClick={() => void move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  aria-label="Move down"
                  disabled={index === slides.length - 1 || busyId !== null}
                  onClick={() => void move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={busyId !== null}
                  onClick={() => void toggleActive(slide)}
                >
                  {slide.isActive ? (
                    <>
                      <EyeOff className="size-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="size-4" />
                      Show
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={busyId !== null}
                  onClick={() => setDraft(draftFromSlide(slide))}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer"
                  disabled={busyId !== null}
                  onClick={() => setDeleting(slide)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / edit modal */}
      <Modal
        isOpen={draft !== null}
        onClose={closeEditor}
        className="max-h-[90vh] max-w-4xl overflow-y-auto p-6 sm:p-8"
      >
        {draft && (
          <SlideEditor
            draft={draft}
            setDraft={setDraft}
            saving={saving}
            onSave={() => void saveDraft()}
            onCancel={closeEditor}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleting !== null}
        onClose={closeDelete}
        className="max-w-md p-6 sm:p-8"
      >
        {deleting && (
          <>
            <h2 className="pr-12 text-xl font-semibold text-heading">
              Delete slide
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete &ldquo;
              {deleting.translations.en?.title?.replace(/\*/g, "") ||
                "this slide"}
              &rdquo;? Its media will be removed too. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <PrimaryButton
                type="button"
                btnType="outline"
                className="border-border"
                onClick={closeDelete}
                disabled={busyId !== null}
              >
                Cancel
              </PrimaryButton>
              <Button
                type="button"
                variant="destructive"
                className="cursor-pointer"
                disabled={busyId !== null}
                onClick={() => void confirmDelete()}
              >
                {busyId ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
