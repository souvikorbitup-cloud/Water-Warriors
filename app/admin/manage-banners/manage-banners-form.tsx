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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { DEFAULT_HERO_FALLBACK_IMAGE_URL } from "@/lib/appearance/hero-banner";
import {
  BANNER_LIMITS,
  BANNER_LOCALES,
  BANNER_PAGES,
  type BannerLocale,
  type BannerPage,
  type BannerText,
  type PageBannerMap,
  type PageBannerSettings,
} from "@/lib/appearance/page-banners";

const PAGE_LABELS: Record<BannerPage, string> = {
  leadership: "Leadership",
  feedback: "Feedback",
  education: "Education",
  "contact-us": "Contact Us",
  "about-us": "About Us",
  "privacy-policy": "Privacy Policy",
};
const LOCALE_LABELS: Record<BannerLocale, string> = {
  en: "English",
  hi: "हिन्दी",
};
const EMPTY: BannerText = { heading: "", highlight: "", description: "" };

export default function ManageBannersForm({
  initialBanners,
}: {
  initialBanners: PageBannerMap;
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [page, setPage] = useState<BannerPage>(BANNER_PAGES[0]);
  const [locale, setLocale] = useState<BannerLocale>("en");
  // Unsaved edits, keyed by page
  const [drafts, setDrafts] = useState<
    Partial<Record<BannerPage, PageBannerSettings["translations"]>>
  >({});
  const [files, setFiles] = useState<Partial<Record<BannerPage, File>>>({});
  const [removed, setRemoved] = useState<Partial<Record<BannerPage, boolean>>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  // Reset the preview when switching pages
  useEffect(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const file = files[page];
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(previewRef.current);
    setInputKey((k) => k + 1);
  }, [page, files]);

  const translations = drafts[page] ?? banners[page].translations;
  const text = translations[locale] ?? EMPTY;
  const dirty = Boolean(drafts[page] || files[page] || removed[page]);
  const currentImage = removed[page]
    ? DEFAULT_HERO_FALLBACK_IMAGE_URL
    : (previewUrl ?? banners[page].imageUrl ?? DEFAULT_HERO_FALLBACK_IMAGE_URL);

  function setField(field: keyof BannerText, value: string) {
    setDrafts((d) => ({
      ...d,
      [page]: { ...translations, [locale]: { ...text, [field]: value } },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const body = new FormData();
      body.append("page", page);
      body.append("translations", JSON.stringify(translations));
      const file = files[page];
      if (file) body.append("image", file);
      if (removed[page]) body.append("removeImage", "true");

      const res = await fetch("/api/page-banners", { method: "PUT", body });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message ?? "Could not save banner.");

      setBanners((b) => ({ ...b, [page]: result as PageBannerSettings }));
      setDrafts(({ [page]: _d, ...rest }) => rest);
      setFiles(({ [page]: _f, ...rest }) => rest);
      setRemoved(({ [page]: _r, ...rest }) => rest);
      toast.success(`${PAGE_LABELS[page]} banner updated.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save banner.");
    } finally {
      setSaving(false);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium border cursor-pointer ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-foreground"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Manage Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the image, title and description for each page banner. Empty
          fields fall back to the default text and image.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BANNER_PAGES.map((p) => (
          <button
            key={p}
            type="button"
            className={tabClass(p === page)}
            onClick={() => setPage(p)}
          >
            {PAGE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Banner image</CardTitle>
            <CardDescription>
              Shown behind the {PAGE_LABELS[page]} banner. Defaults to the hero
              fallback image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image
              src={currentImage}
              alt={`${PAGE_LABELS[page]} banner preview`}
              width={1280}
              height={720}
              unoptimized
              className="aspect-video w-full rounded-lg bg-muted object-cover"
            />
            <div className="space-y-2">
              <Label htmlFor="banner-image">Replace image</Label>
              <input
                key={inputKey}
                id="banner-image"
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFiles((s) => (f ? { ...s, [page]: f } : s));
                  if (f) setRemoved((r) => ({ ...r, [page]: false }));
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
              {(banners[page].imageUrl || files[page]) && !removed[page] && (
                <button
                  type="button"
                  className="text-sm text-destructive underline"
                  onClick={() => {
                    setFiles(({ [page]: _f, ...rest }) => rest);
                    setRemoved((r) => ({ ...r, [page]: true }));
                  }}
                >
                  Remove custom image (use default)
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banner text</CardTitle>
            <CardDescription>Edit each language separately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {BANNER_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={tabClass(l === locale)}
                  onClick={() => setLocale(l)}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-heading">Title</Label>
              <Input
                id="b-heading"
                value={text.heading}
                maxLength={BANNER_LIMITS.heading}
                onChange={(e) => setField("heading", e.target.value)}
                disabled={saving}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-highlight">
                Title highlight (second line, accent colour)
              </Label>
              <Input
                id="b-highlight"
                value={text.highlight}
                maxLength={BANNER_LIMITS.highlight}
                onChange={(e) => setField("highlight", e.target.value)}
                disabled={saving}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-description">Description</Label>
              <Textarea
                id="b-description"
                rows={4}
                value={text.description}
                maxLength={BANNER_LIMITS.description}
                onChange={(e) => setField("description", e.target.value)}
                disabled={saving}
                className="min-h-40"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <PrimaryButton
          btnType="solid-primary"
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
        >
          {saving ? "Saving..." : `Save ${PAGE_LABELS[page]} banner`}
        </PrimaryButton>
      </div>
    </div>
  );
}
