"use client";

import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Modal content */}
        <div
          ref={modalRef}
          className={`relative w-full rounded-3xl bg-white ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-999 flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-heading sm:top-6 sm:right-6 sm:h-11 sm:w-11"
            >
              <X size={16} />
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
