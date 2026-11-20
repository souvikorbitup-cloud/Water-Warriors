"use client";

import { useMemo, useState } from "react";
import { Eye, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import ConfirmDialog from "@/components/admin/shared/modal/ConfirmDialog";
import SubmissionsFilter, {
  type FilterOption,
} from "@/components/admin/shared/filters/SubmissionsFilter";
import { Button } from "@/components/ui/button";
import {
  CONTACT_REASONS,
  CONTACT_STATUSES,
  type ContactReason,
} from "@/lib/submissions/constants";
import { formatSubmissionDate } from "@/lib/submissions/format";
import { useSubmissionsList } from "@/lib/hooks/use-submissions-list";
import { readApiError } from "@/lib/submissions/api-error";
import type {
  ContactListItem,
  SubmissionsListResponse,
} from "@/types/submissions";
import SubmissionDetailModal from "./SubmissionDetailModal";
import SubmissionsTableSkeleton from "./SubmissionsTableSkeleton";

const STATUS_OPTIONS: FilterOption[] = CONTACT_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const REASON_LABELS: Record<ContactReason, string> = {
  question: "Question",
  support: "Support",
  partnership: "Partnership",
};

const REASON_OPTIONS: FilterOption[] = CONTACT_REASONS.map((reason) => ({
  value: reason,
  label: REASON_LABELS[reason],
}));

const SORT_OPTIONS: FilterOption[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A-Z" },
  { value: "name:desc", label: "Name Z-A" },
  { value: "status:asc", label: "Status A-Z" },
  { value: "status:desc", label: "Status Z-A" },
];

export default function ContactSubmissionsManager({
  canEdit,
  initialData,
}: {
  canEdit: boolean;
  initialData: SubmissionsListResponse<ContactListItem>;
}) {
  const { params, data, loading, error, updateParams, refresh, setData } =
    useSubmissionsList<ContactListItem>(
      "/api/admin/submissions/contact",
      initialData,
    );
  const [selected, setSelected] = useState<ContactListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const endpoint = "/api/admin/submissions/contact";
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
      { label: "Name", value: selected.name },
      { label: "Email", value: selected.email },
      {
        label: "Reason",
        value: selected.reason
          ? REASON_LABELS[selected.reason]
          : "Not specified",
      },
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
            Contact Us Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review messages from the Contact Us form and update their status.
          </p>
        </div>
        {typeof data?.unread === "number" && (
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
            <Mail className="size-4" />
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
        reason={params.reason}
        reasonOptions={REASON_OPTIONS}
        onReasonChange={(reason) => changeParams({ reason })}
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => changeParams({ sort })}
        onReset={() =>
          changeParams({
            search: "",
            status: "",
            reason: "",
            sort: "createdAt:desc",
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
        <SubmissionsTableSkeleton columns={canEdit ? 7 : 6} />
      ) : error ? null : empty ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-base font-medium text-heading">
            No contact submissions yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New messages from the Contact Us page will appear here.
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
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Message</th>
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
                          aria-label={`Select submission from ${item.name}`}
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
                      <p className="font-medium text-heading">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-heading">
                      {item.reason
                        ? REASON_LABELS[item.reason]
                        : "Not specified"}
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
        endpoint="/api/admin/submissions/contact"
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
