"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { initialsFromName } from "@/lib/content/client-form";

export default function ImageField({
  id,
  label,
  name,
  currentUrl,
  disabled,
  onFileChange,
  onRemove,
}: {
  id: string;
  label: string;
  name: string;
  currentUrl: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function selectFile(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewRef.current);
    onFileChange(file);
  }

  const src = preview ?? currentUrl;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-4">
        {src ? (
          <Image
            src={src}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="size-20 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-heading ring-1 ring-gray-200">
            {initialsFromName(name)}
          </div>
        )}
        <div className="space-y-2">
          <input
            id={id}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          />
          {(src || currentUrl) && !disabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                selectFile(null);
                onRemove();
              }}
            >
              Remove image
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
