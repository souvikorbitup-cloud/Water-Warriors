"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/admin/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { readApiError } from "@/lib/submissions/api-error";
import { testimonialInputSchema } from "@/lib/content/schemas";
import { emptyTestimonialTranslations } from "@/lib/content/client-form";
import type { TestimonialDetail, TestimonialListItem } from "@/types/content";
import type { ITestimonialTranslation } from "@/lib/models/Testimonial.model";
import TranslationTabs from "./TranslationTabs";
import ImageField from "./ImageField";
import FieldError from "./FieldError";

const emptyForm = {
  fullName: "",
  order: "",
  isPublished: false,
  translations: emptyTestimonialTranslations(),
};

export default function TestimonialFormModal({
  open,
  item,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: TestimonialDetail | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (item: TestimonialListItem) => void;
}) {
  const isEdit = item !== null;
  const [fullName, setFullName] = useState(emptyForm.fullName);
  const [order, setOrder] = useState(emptyForm.order);
  const [isPublished, setIsPublished] = useState(emptyForm.isPublished);
  const [translations, setTranslations] = useState(emptyForm.translations);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setImageFile(null);
    setRemoveImage(false);
    if (item) {
      setFullName(item.fullName);
      setOrder(String(item.order));
      setIsPublished(item.isPublished);
      setTranslations({
        ...emptyTestimonialTranslations(),
        ...item.translations,
      });
    } else {
      setFullName("");
      setOrder("");
      setIsPublished(true);
      setTranslations(emptyTestimonialTranslations());
    }
  }, [open, item]);

  function updateTranslation(
    locale: keyof typeof translations,
    field: keyof ITestimonialTranslation,
    value: string,
  ) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [field]: value },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving) return;

    const parsed = testimonialInputSchema.safeParse({
      fullName,
      order: order === "" ? undefined : order,
      isPublished,
      translations,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join(".") || "form";
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const formData = new FormData();
      formData.set("fullName", parsed.data.fullName);
      formData.set("isPublished", String(parsed.data.isPublished));
      formData.set("translations", JSON.stringify(parsed.data.translations));
      if (parsed.data.order !== undefined) {
        formData.set("order", String(parsed.data.order));
      }
      if (imageFile) formData.set("image", imageFile);
      if (isEdit && removeImage && !imageFile)
        formData.set("removeImage", "true");

      const response = await fetch(
        isEdit
          ? `/api/admin/testimonials/${item.id}`
          : "/api/admin/testimonials",
        { method: isEdit ? "PATCH" : "POST", body: formData },
      );
      if (!response.ok) {
        const { message, fieldErrors: nextErrors } = await readApiError(
          response,
          "Could not save testimonial.",
        );
        if (nextErrors) setFieldErrors(nextErrors);
        throw new Error(message);
      }
      const result = (await response.json()) as { item: TestimonialListItem };
      toast.success(isEdit ? "Testimonial updated." : "Testimonial created.");
      onSaved(result.item);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save testimonial.",
      );
    } finally {
      setSaving(false);
    }
  }

  const readOnly = !canEdit;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">
        {isEdit ? "Edit testimonial" : "Add testimonial"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEdit
          ? "Update the testimonial details and translations."
          : "Create a testimonial in English and Hindi."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="testimonial-name">Full name</Label>
          <Input
            id="testimonial-name"
            className="mt-2 h-10"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={readOnly || saving}
            maxLength={100}
          />
          <FieldError message={fieldErrors.fullName} />
        </div>

        <ImageField
          id="testimonial-image"
          label="Photo"
          name={fullName}
          currentUrl={removeImage ? "" : (item?.imageUrl ?? "")}
          disabled={readOnly || saving}
          onFileChange={(file) => {
            setImageFile(file);
            if (file) setRemoveImage(false);
          }}
          onRemove={() => {
            setImageFile(null);
            setRemoveImage(true);
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="testimonial-order">Display order</Label>
            <Input
              id="testimonial-order"
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
          <label className="mt-7 flex items-center gap-2 text-sm text-heading">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              disabled={readOnly || saving}
              className="size-4 accent-primary"
            />
            Published
          </label>
        </div>

        <TranslationTabs
          renderLocale={(locale) => (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`testimonial-role-${locale}`}>Job role</Label>
                <Input
                  id={`testimonial-role-${locale}`}
                  className="mt-2 h-10"
                  value={translations[locale].jobRole}
                  onChange={(event) =>
                    updateTranslation(locale, "jobRole", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={100}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.jobRole`]}
                />
              </div>
              <div>
                <Label htmlFor={`testimonial-message-${locale}`}>Message</Label>
                <Textarea
                  id={`testimonial-message-${locale}`}
                  className="mt-2 min-h-28"
                  value={translations[locale].message}
                  onChange={(event) =>
                    updateTranslation(locale, "message", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={1000}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.message`]}
                />
              </div>
            </div>
          )}
        />

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
