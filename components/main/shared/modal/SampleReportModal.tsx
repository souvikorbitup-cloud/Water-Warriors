"use client";

import PopModal from "./PopModal";

interface SampleReportModalProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to the shared sample report PDF used across the site */
  pdfUrl?: string;
}

/** Single "sample report" pop-up, shared by every section that offers the PDF preview. */
export default function SampleReportModal({
  open,
  onClose,
  pdfUrl = "/sample-report.pdf",
}: SampleReportModalProps) {
  return (
    <PopModal
      open={open}
      onClose={onClose}
      title="Sample report"
      className="max-w-5xl"
    >
      <iframe src={pdfUrl} title="Sample report" className="h-[80vh] w-full" />
      <p className="border-t px-4 py-2 text-center text-xs">
        Can&rsquo;t see the PDF?{" "}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open it in a new tab
        </a>
        .
      </p>
    </PopModal>
  );
}
