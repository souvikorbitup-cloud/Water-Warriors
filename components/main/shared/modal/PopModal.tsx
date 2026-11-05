"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export default function PopModal({
  open,
  onClose,
  title,
  children,
  className = "max-w-4xl",
  light = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full overflow-hidden rounded-xl bg-background shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className={`absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full ${light ? "bg-gray-100 text-gray-400 hover:bg-gray-200" : "bg-black/60 text-white hover:bg-black/80"} transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer`}
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
