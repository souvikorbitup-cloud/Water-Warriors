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
import { teamMemberInputSchema } from "@/lib/content/schemas";
import { emptyTeamTranslations } from "@/lib/content/client-form";
import { TEAM_GROUPS, type TeamGroup } from "@/lib/content/constants";
import type { TeamMemberDetail, TeamMemberListItem } from "@/types/content";
import type { ITeamMemberTranslation } from "@/lib/models/Teammember.model";
import TranslationTabs from "./TranslationTabs";
import ImageField from "./ImageField";
import FieldError from "./FieldError";

const GROUP_LABELS: Record<TeamGroup, string> = {
  leadership: "Leadership",
  technical_advisors: "Technical Advisors",
};

export default function TeamMemberFormModal({
  open,
  item,
  canEdit,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: TeamMemberDetail | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (item: TeamMemberListItem) => void;
}) {
  const isEdit = item !== null;
  const [group, setGroup] = useState<TeamGroup>("leadership");
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [translations, setTranslations] = useState(emptyTeamTranslations());
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
      setGroup(item.group);
      setFullName(item.fullName);
      setSlug(item.slug);
      setOrder(String(item.order));
      setIsPublished(item.isPublished);
      setTranslations({
        ...emptyTeamTranslations(),
        ...item.translations,
      });
    } else {
      setGroup("leadership");
      setFullName("");
      setSlug("");
      setOrder("");
      setIsPublished(true);
      setTranslations(emptyTeamTranslations());
    }
  }, [open, item]);

  function updateTranslation(
    locale: keyof typeof translations,
    field: keyof ITeamMemberTranslation,
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

    const parsed = teamMemberInputSchema.safeParse({
      group,
      fullName,
      slug,
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
      formData.set("group", parsed.data.group);
      formData.set("fullName", parsed.data.fullName);
      formData.set("isPublished", String(parsed.data.isPublished));
      formData.set("translations", JSON.stringify(parsed.data.translations));
      if (parsed.data.slug) formData.set("slug", parsed.data.slug);
      if (parsed.data.order !== undefined) {
        formData.set("order", String(parsed.data.order));
      }
      if (imageFile) formData.set("image", imageFile);
      if (isEdit && removeImage && !imageFile)
        formData.set("removeImage", "true");

      const response = await fetch(
        isEdit
          ? `/api/admin/team-members/${item.id}`
          : "/api/admin/team-members",
        { method: isEdit ? "PATCH" : "POST", body: formData },
      );
      if (!response.ok) {
        const { message, fieldErrors: nextErrors } = await readApiError(
          response,
          "Could not save team member.",
        );
        if (nextErrors) setFieldErrors(nextErrors);
        throw new Error(message);
      }
      const result = (await response.json()) as { item: TeamMemberListItem };
      toast.success(isEdit ? "Team member updated." : "Team member created.");
      onSaved(result.item);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save team member.",
      );
    } finally {
      setSaving(false);
    }
  }

  const readOnly = !canEdit;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">
        {isEdit ? "Edit team member" : "Add team member"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEdit
          ? "Update this profile and its translations."
          : "Create a leadership or advisor profile in English and Hindi."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="team-group">Group</Label>
            <Select
              value={group}
              onValueChange={(value) => setGroup(value as TeamGroup)}
              disabled={readOnly || saving}
            >
              <SelectTrigger id="team-group" className="mt-2 h-10! w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-99999">
                {TEAM_GROUPS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {GROUP_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.group} />
          </div>
          <div>
            <Label htmlFor="team-name">Full name</Label>
            <Input
              id="team-name"
              className="mt-2 h-10"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={readOnly || saving}
              maxLength={100}
            />
            <FieldError message={fieldErrors.fullName} />
          </div>
        </div>

        <div>
          <Label htmlFor="team-slug">Slug</Label>
          <Input
            id="team-slug"
            className="mt-2 h-10"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={readOnly || saving}
            placeholder="Generated from name if left blank"
            maxLength={120}
          />
          <FieldError message={fieldErrors.slug} />
        </div>

        <ImageField
          id="team-image"
          label="Avatar"
          name={fullName}
          currentUrl={removeImage ? "" : (item?.avatarUrl ?? "")}
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
            <Label htmlFor="team-order">Display order</Label>
            <Input
              id="team-order"
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
                <Label htmlFor={`team-role-${locale}`}>Role</Label>
                <Input
                  id={`team-role-${locale}`}
                  className="mt-2 h-10"
                  value={translations[locale].role}
                  onChange={(event) =>
                    updateTranslation(locale, "role", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={120}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.role`]}
                />
              </div>
              <div>
                <Label htmlFor={`team-tagline-${locale}`}>Tagline</Label>
                <Input
                  id={`team-tagline-${locale}`}
                  className="mt-2 h-10"
                  value={translations[locale].tagline}
                  onChange={(event) =>
                    updateTranslation(locale, "tagline", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={200}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.tagline`]}
                />
              </div>
              <div>
                <Label htmlFor={`team-description-${locale}`}>
                  Description
                </Label>
                <Textarea
                  id={`team-description-${locale}`}
                  className="mt-2 min-h-32"
                  value={translations[locale].description}
                  onChange={(event) =>
                    updateTranslation(locale, "description", event.target.value)
                  }
                  disabled={readOnly || saving}
                  maxLength={3000}
                />
                <FieldError
                  message={fieldErrors[`translations.${locale}.description`]}
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
