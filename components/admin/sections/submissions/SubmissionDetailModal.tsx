"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/admin/shared/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import { readApiError } from "@/lib/submissions/api-error";
import type { FilterOption } from "@/components/admin/shared/filters/SubmissionsFilter";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

export type DetailField = {
  label: string;
  value: string;
};

function SubmissionEditForm<
  T extends { id: string; status: string; adminNote: string; message: string },
>({
  item,
  fields,
  statusOptions,
  canEdit,
  endpoint,
  onClose,
  onUpdated,
}: {
  item: T;
  fields: DetailField[];
  statusOptions: FilterOption[];
  canEdit: boolean;
  endpoint: string;
  onClose: () => void;
  onUpdated: (item: T) => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote);
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      const response = await fetch(`${endpoint}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not update this submission.",
        );
        throw new Error(message);
      }
      const result = (await response.json()) as { item: T };
      onUpdated(result.item);
      toast.success("Submission updated.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update this submission.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-6 space-y-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {field.label}
            </dt>
            <dd className="mt-1 wrap-break-word text-sm text-heading">
              {field.value || "-"}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </dt>
          <dd className="mt-1">
            <StatusBadge status={item.status} />
          </dd>
        </div>
      </dl>

      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Message
        </p>
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-heading">
          {item.message}
        </p>
      </div>

      {canEdit ? (
        <>
          <div>
            <Label htmlFor="submission-status">Update status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                id="submission-status"
                className="mt-2 h-10! w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-99999">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="submission-note">Internal note</Label>
            <Textarea
              id="submission-note"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              maxLength={1000}
              className="mt-2 min-h-24"
              placeholder="Add a short note for other admins"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <PrimaryButton
              type="button"
              btnType="outline"
              className="border-border"
              onClick={onClose}
            >
              Close
            </PrimaryButton>
            <PrimaryButton
              type="submit"
              btnType="solid-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </>
      ) : item.adminNote ? (
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Internal note
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-heading">
            {item.adminNote}
          </p>
        </div>
      ) : null}
    </form>
  );
}

export default function SubmissionDetailModal<
  T extends { id: string; status: string; adminNote: string; message: string },
>({
  open,
  onClose,
  item,
  fields,
  statusOptions,
  canEdit,
  endpoint,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  item: T | null;
  fields: DetailField[];
  statusOptions: FilterOption[];
  canEdit: boolean;
  endpoint: string;
  onUpdated: (item: T) => void;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">
        Submission details
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review the full message and update its workflow status.
      </p>

      {item ? (
        <SubmissionEditForm
          key={item.id}
          item={item}
          fields={fields}
          statusOptions={statusOptions}
          canEdit={canEdit}
          endpoint={endpoint}
          onClose={onClose}
          onUpdated={onUpdated}
        />
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No submission selected.
        </p>
      )}
    </Modal>
  );
}
