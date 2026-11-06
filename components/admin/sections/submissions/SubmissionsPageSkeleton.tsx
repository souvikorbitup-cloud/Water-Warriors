import { Skeleton } from "@/components/ui/skeleton";
import SubmissionsTableSkeleton from "./SubmissionsTableSkeleton";

export default function SubmissionsPageSkeleton({
  title,
  columns,
}: {
  title: string;
  columns: number;
}) {
  return (
    <div className="space-y-6" role="status" aria-label={`Loading ${title}`}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <SubmissionsTableSkeleton columns={columns} />
    </div>
  );
}
