"use client";

import { useMemo, useState } from "react";
import { Eye, MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import ConfirmDialog from "@/components/admin/shared/modal/ConfirmDialog";
import SubmissionsFilter, {
  type FilterOption,
} from "@/components/admin/shared/filters/SubmissionsFilter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEEDBACK_STATUSES } from "@/lib/submissions/constants";
import { formatSubmissionDate } from "@/lib/submissions/format";
import { useSubmissionsList } from "@/lib/hooks/use-submissions-list";
import { readApiError } from "@/lib/submissions/api-error";
import type {
  FeedbackListItem,
  SubmissionsListResponse,
} from "@/types/submissions";
import SubmissionDetailModal from "./SubmissionDetailModal";
import SubmissionsTableSkeleton from "./SubmissionsTableSkeleton";

const STATUS_OPTIONS: FilterOption[] = FEEDBACK_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const SORT_OPTIONS: FilterOption[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A-Z" },
  { value: "name:desc", label: "Name Z-A" },
  { value: "status:asc", label: "Status A-Z" },
  { value: "status:desc", label: "Status Z-A" },
];

const ALL_VALUE = "all";

export default function FeedbackSubmissionsManager({
  canEdit,
  initialData,
}: {
  canEdit: boolean;
  initialData: SubmissionsListResponse<FeedbackListItem>;
}) {
  const { params, data, loading, error, updateParams, refresh, setData } =
    useSubmissionsList<FeedbackListItem>(
      "/api/admin/submissions/feedback",
      initialData,
    );
  const [selected, setSelected] = useState<FeedbackListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const endpoint = "/api/admin/submissions/feedback";
  const items = data?.items ?? [];
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  function changeParams(patch: Parameters<typeof updateParams>[0]) {
    setSelectedIds([]);
    updateParams(patch);
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      const response = await fetch(
        deleteTarget.length === 1 ? `${endpoint}/${deleteTarget[0]}` : endpoint,
        {
          method: "DELETE",
          ...(deleteTarget.length > 1
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: deleteTarget }),
              }
            : {}),
        },
      );
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not delete the selected submission(s).",
        );
        throw new Error(message);
      }

      toast.success(
        deleteTarget.length === 1
          ? "Submission deleted."
          : `${deleteTarget.length} submissions deleted.`,
      );
      if (selected && deleteTarget.includes(selected.id)) setSelected(null);
      setSelectedIds([]);
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete the selected submission(s).",
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedFields = useMemo(() => {
    if (!selected) return [];
    return [
      {
        label: "Name",
        value: selected.isAnonymous ? "Anonymous" : selected.name,
      },
      { label: "Email", value: selected.email },
      { label: "Topic", value: selected.topic },
      { label: "Rating", value: `${selected.rating} / 5` },
      { label: "Received", value: formatSubmissionDate(selected.createdAt) },
      {
        label: "Last updated",
        value: selected.updatedAt
          ? formatSubmissionDate(selected.updatedAt)
          : "",
      },
    ];
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">
            Feedback Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review visitor feedback, ratings, and follow up where needed.
          </p>
        </div>
        {typeof data?.unread === "number" && (
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
            <MessageSquareText className="size-4" />
            {data.unread} new
          </span>
        )}
      </div>

      <SubmissionsFilter
        search={params.search}
        onSearchChange={(search) => changeParams({ search })}
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={(status) => changeParams({ status })}
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => changeParams({ sort })}
        extraFilters={
          <div>
            <Label htmlFor="feedback-rating-filter" className="text-heading">
              Rating
            </Label>
            <Select
              value={params.rating || ALL_VALUE}
              onValueChange={(value) =>
                changeParams({ rating: value === ALL_VALUE ? "" : value })
              }
            >
              <SelectTrigger
                id="feedback-rating-filter"
                className="mt-2 h-10! w-full"
              >
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All ratings</SelectItem>
                {["1", "2", "3", "4", "5"].map((rating) => (
                  <SelectItem key={rating} value={rating}>
                    {rating} star{rating === "1" ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        onReset={() =>
          changeParams({
            search: "",
            status: "",
            sort: "createdAt:desc",
            rating: "",
            page: 1,
          })
        }
      />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <SubmissionsTableSkeleton columns={canEdit ? 8 : 7} />
      ) : error ? null : empty ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-base font-medium text-heading">
            No feedback submissions yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New feedback from the public form will appear here.
          </p>
        </div>
      ) : (
        <>
          {canEdit && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {selectedIds.length
                  ? `${selectedIds.length} selected`
                  : "Select submissions to delete"}
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="cursor-pointer"
                disabled={selectedIds.length === 0 || deleting}
                onClick={() => setDeleteTarget(selectedIds)}
              >
                <Trash2 className="size-4" />
                Delete selected
              </Button>
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  {canEdit && (
                    <th className="w-10 px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        aria-label="Select all submissions on this page"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelectedIds(
                            event.target.checked
                              ? items.map((item) => item.id)
                              : [],
                          )
                        }
                        className="size-4 cursor-pointer accent-primary"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">Topic</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Feedback</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-gray-50/70">
                    {canEdit && (
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          aria-label={`Select submission about ${item.topic}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id),
                            )
                          }
                          className="size-4 cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-heading">
                        {item.isAnonymous ? "Anonymous" : item.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.email || "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-heading">
                      {item.topic}
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-heading">
                      {item.rating}/5
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top text-muted-foreground">
                      {item.preview}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                      {formatSubmissionDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(item)}
                          className="cursor-pointer"
                        >
                          <Eye className="size-4" />
                          View
                        </Button>
                        {canEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget([item.id])}
                            className="cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            onPageChange={(page) => changeParams({ page })}
          />
        </>
      )}

      <SubmissionDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        item={selected}
        fields={selectedFields}
        statusOptions={STATUS_OPTIONS}
        canEdit={canEdit}
        endpoint="/api/admin/submissions/feedback"
        onUpdated={(item) => {
          setSelected(item);
          setData((current) =>
            current
              ? {
                  ...current,
                  items: current.items.map((row) =>
                    row.id === item.id ? item : row,
                  ),
                }
              : current,
          );
        }}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.length === 1
            ? "Delete submission?"
            : `Delete ${deleteTarget?.length ?? 0} submissions?`
        }
        description="Deleting a submission is permanent and cannot be undone."
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
