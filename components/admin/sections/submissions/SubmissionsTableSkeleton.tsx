import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionsTableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div
      role="status"
      aria-label="Loading submissions"
      className="overflow-hidden rounded-2xl border border-gray-200"
    >
      <div
        className="hidden grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 md:grid"
        style={{ ["--cols" as string]: columns }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-3 px-4 py-4 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:items-center"
            style={{ ["--cols" as string]: columns }}
            aria-hidden
          >
            {Array.from({ length: columns }).map((__, col) => (
              <Skeleton key={col} className="h-4 w-full max-w-40" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
