"use client";

import { Modal } from "@/components/admin/shared/modal";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { Trash2 } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-10 flex justify-end gap-2">
        <PrimaryButton
          type="button"
          btnType="outline"
          className="border-border"
          onClick={onClose}
          disabled={confirming}
        >
          {cancelLabel}
        </PrimaryButton>
        <PrimaryButton
          type="button"
          btnType="solid-destructive"
          onClick={onConfirm}
          disabled={confirming}
          endIcon={<Trash2 aria-hidden />}
        >
          {confirming ? "Deleting..." : confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
