"use client";

import { Modal } from "@/components/admin/shared/modal";
import { Button } from "@/components/ui/button";

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
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6 sm:p-8">
      <h2 className="pr-12 text-xl font-semibold text-heading">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onClose}
          disabled={confirming}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="cursor-pointer"
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
