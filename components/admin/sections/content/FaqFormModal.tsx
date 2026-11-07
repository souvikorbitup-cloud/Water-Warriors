"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/admin/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { readApiError } from "@/lib/submissions/api-error";
import { faqInputSchema } from "@/lib/content/schemas";
import { emptyFaqTranslations } from "@/lib/content/client-form";
import { FAQ_GROUPS, type FaqGroup } from "@/lib/content/constants";
import type { FaqDetail, FaqListItem } from "@/types/content";
import type { IFaqTranslation } from "@/lib/models/Faq.model";
import TranslationTabs from "./TranslationTabs";
import FieldError from "./FieldError";

const GROUP_LABELS: Record<FaqGroup, string> = {
  contact: "Contact",
  general: "General",
};

export default function FaqFormModal({
  open,
  item,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: FaqDetail | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (item: FaqListItem) => void;
}) {
  const isEdit = item !== null;
  const [group, setGroup] = useState<FaqGroup>("contact");
  const [order, setOrder] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [translations, setTranslations] = useState(emptyFaqTranslations());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    if (item) {
      setGroup(item.group);
      setOrder(String(item.order));
      setIsPublished(item.isPublished);
      setTranslations({
        ...emptyFaqTranslations(),
        ...item.translations,
      });
    } else {
      setGroup("contact");
      setOrder("");
      setIsPublished(true);
      setTranslations(emptyFaqTranslations());
    }
  }, [open, item]);

  function updateTranslation(
    locale: keyof typeof translations,
    field: keyof IFaqTranslation,
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

    const parsed = faqInputSchema.safeParse({
      group,
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
      setFieldErrors(errors);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const response = await fetch(
        isEdit ? `/api/admin/faqs/${item.id}` : "/api/admin/faqs",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!response.ok) {
        const { message, fieldErrors: nextErrors } = await readApiError(
          response,
          "Could not save FAQ.",
        );
        if (nextErrors) setFieldErrors(nextErrors);
        throw new Error(message);
      }
      const result = (await response.json()) as { item: FaqListItem };
      toast.success(isEdit ? "FAQ updated." : "FAQ created.");
      onSaved(result.item);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save FAQ.",
      );
    } finally {
      setSaving(false);
    }
  }

  const readOnly = !canEdit;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">
        {isEdit ? "Edit FAQ" : "Add FAQ"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEdit
          ? "Update this FAQ and its translations."
          : "Create a question and answer in English and Hindi."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="faq-group">Group</Label>
            <Select
              value={group}
              onValueChange={(value) => setGroup(value as FaqGroup)}
              disabled={readOnly || saving}
            >
              <SelectTrigger id="faq-group" className="mt-2 h-10! w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-99999">
                {FAQ_GROUPS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {GROUP_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.group} />
          </div>
          <div>
            <Label htmlFor="faq-order">Display order</Label>
            <Input
              id="faq-order"
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

        <TranslationTabs
          renderLocale={(locale) => (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`faq-question-${locale}`}>Question</Label>
                <Input
                  id={`faq-question-${locale}`}
                  className="mt-2 h-10"
                  value={translations[locale].question}
                  onChange={(event) =>
                    updateTranslation(locale, "question", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={300}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.question`]}
                />
              </div>
              <div>
                <Label htmlFor={`faq-answer-${locale}`}>Answer</Label>
                <Textarea
                  id={`faq-answer-${locale}`}
                  className="mt-2 min-h-32"
                  value={translations[locale].answer}
                  onChange={(event) =>
                    updateTranslation(locale, "answer", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={2000}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.answer`]}
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
