"use client";

import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

export async function createReportPdfBlob(
  document: ReactElement<DocumentProps>,
): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  return pdf(document).toBlob();
}

export function createSafePdfFileName(fileName: string): string {
  const baseName = fileName
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return `${baseName || "water-warriors-report"}.pdf`;
}

export function downloadPdfBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  try {
    link.href = url;
    link.download = createSafePdfFileName(fileName);
    window.document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
