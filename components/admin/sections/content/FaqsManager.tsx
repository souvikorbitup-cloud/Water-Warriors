"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import SubmissionsFilter, {
  type FilterOption,
} from "@/components/admin/shared/filters/SubmissionsFilter";
import ConfirmDialog from "@/components/admin/shared/modal/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSubmissionDate } from "@/lib/submissions/format";
import { readApiError } from "@/lib/submissions/api-error";
import { useContentList } from "@/lib/hooks/use-content-list";
import { FAQ_GROUPS, type FaqGroup } from "@/lib/content/constants";
import type {
  ContentListResponse,
  FaqDetail,
  FaqListItem,
} from "@/types/content";
import SubmissionsTableSkeleton from "@/components/admin/sections/submissions/SubmissionsTableSkeleton";
import FaqFormModal from "./FaqFormModal";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

const STATUS_OPTIONS: FilterOption[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "order:asc", label: "Order (low to high)" },
  { value: "order:desc", label: "Order (high to low)" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
];

const GROUP_LABELS: Record<FaqGroup, string> = {
  contact: "Contact",
  general: "General",
};

const ALL_VALUE = "all";

export default function FaqsManager({
  canEdit,
  initialData,
}: {
  canEdit: boolean;
  initialData: ContentListResponse<FaqListItem>;
}) {
  const { params, data, loading, error, updateParams, refresh } =
    useContentList<FaqListItem>("/api/admin/faqs", initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<FaqDetail | null>(null);
  const [formCanEdit, setFormCanEdit] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<FaqListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  async function openItem(item: FaqListItem, edit: boolean) {
    try {
      const response = await fetch(`/api/admin/faqs/${item.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const { message } = await readApiError(response, "Could not load FAQ.");
        throw new Error(message);
      }
      const result = (await response.json()) as { item: FaqDetail };
      setSelected(result.item);
      setFormCanEdit(edit);
      setFormOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load FAQ.");
    }
  }

  async function handleDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/faqs/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not delete FAQ.",
        );
        throw new Error(message);
      }
      toast.success("FAQ deleted.");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete FAQ.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">All FAQs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage questions shown on the Contact page and other FAQ groups.
          </p>
        </div>
        {canEdit ? (
          <PrimaryButton
            type="submit"
            btnType="solid-primary"
            onClick={() => {
              setSelected(null);
              setFormCanEdit(true);
              setFormOpen(true);
            }}
            endIcon={<Plus className="size-4" />}
          >
            Add FAQ
          </PrimaryButton>
        ) : null}
      </div>

      <SubmissionsFilter
        search={params.search}
        onSearchChange={(search) => updateParams({ search })}
        searchPlaceholder="Question or answer"
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={(status) => updateParams({ status })}
        statusLabel="Visibility"
        allStatusLabel="All"
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => updateParams({ sort })}
        extraFilters={
          <div>
            <Label htmlFor="faq-group-filter" className="text-heading">
              Group
            </Label>
            <Select
              value={params.group || ALL_VALUE}
              onValueChange={(value) =>
                updateParams({ group: value === ALL_VALUE ? "" : value })
              }
            >
              <SelectTrigger
                id="faq-group-filter"
                className="mt-2 h-10! w-full"
              >
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All groups</SelectItem>
                {FAQ_GROUPS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {GROUP_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        onReset={() =>
          updateParams({
            search: "",
            status: "",
            sort: "order:asc",
            group: "",
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
        <SubmissionsTableSkeleton columns={6} />
      ) : error ? null : empty ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-base font-medium text-heading">No FAQs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an FAQ to display it on the public site.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Question</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-gray-50/70">
                    <td className="max-w-sm px-4 py-3 align-top">
                      <p className="font-medium text-heading">
                        {item.question}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.preview}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {GROUP_LABELS[item.group]}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge
                        status={item.isPublished ? "published" : "draft"}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {item.order}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                      {formatSubmissionDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => openItem(item, false)}
                        >
                          <Eye className="size-4" />
                          View
                        </Button>
                        {canEdit ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => openItem(item, true)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => setPendingDelete(item)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </>
                        ) : null}
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
            onPageChange={(page) => updateParams({ page })}
          />
        </>
      )}

      <FaqFormModal
        open={formOpen}
        item={selected}
        canEdit={formCanEdit && canEdit}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onSaved={() => refresh()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete FAQ"
        description={`Delete “${pendingDelete?.question ?? "this FAQ"}”? It will be removed from the public site.`}
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
