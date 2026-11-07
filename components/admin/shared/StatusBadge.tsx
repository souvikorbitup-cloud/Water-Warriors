import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  read: "bg-amber-50 text-amber-700 ring-amber-200",
  replied: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  reviewed: "bg-violet-50 text-violet-700 ring-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  spam: "bg-rose-50 text-rose-700 ring-rose-200",
  archived: "bg-gray-100 text-gray-600 ring-gray-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 ring-gray-200",
      )}
    >
      {status}
    </span>
  );
}
