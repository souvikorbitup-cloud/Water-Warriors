"use client";

import { CircleCheck } from "lucide-react";
import PopModal from "@/components/main/shared/modal/PopModal";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

export default function SubmissionSuccessModal({
  open,
  onClose,
  title,
  description,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  closeLabel: string;
}) {
  return (
    <PopModal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-md"
      light
    >
      <div className="px-6 py-10 text-center sm:px-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
          <CircleCheck className="size-7 text-heading" aria-hidden />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-heading">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
          {description}
        </p>
        <div className="mt-7 flex justify-center">
          <PrimaryButton
            btnType="solid-primary"
            type="button"
            onClick={onClose}
          >
            {closeLabel}
          </PrimaryButton>
        </div>
      </div>
    </PopModal>
  );
}
