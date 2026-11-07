"use client";

import Image from "next/image";
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
import { formatSubmissionDate } from "@/lib/submissions/format";
import { readApiError } from "@/lib/submissions/api-error";
import { useContentList } from "@/lib/hooks/use-content-list";
import { initialsFromName } from "@/lib/content/client-form";
import type {
  ContentListResponse,
  TestimonialDetail,
  TestimonialListItem,
} from "@/types/content";
import SubmissionsTableSkeleton from "@/components/admin/sections/submissions/SubmissionsTableSkeleton";
import TestimonialFormModal from "./TestimonialFormModal";
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
  { value: "fullName:asc", label: "Name A-Z" },
  { value: "fullName:desc", label: "Name Z-A" },
];

export default function TestimonialsManager({
  canEdit,
  initialData,
}: {
  canEdit: boolean;
  initialData: ContentListResponse<TestimonialListItem>;
}) {
  const { params, data, loading, error, updateParams, refresh, setData } =
    useContentList<TestimonialListItem>("/api/admin/testimonials", initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TestimonialDetail | null>(null);
  const [formCanEdit, setFormCanEdit] = useState(true);
  const [pendingDelete, setPendingDelete] =
    useState<TestimonialListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  async function openItem(item: TestimonialListItem, edit: boolean) {
    try {
      const response = await fetch(`/api/admin/testimonials/${item.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not load testimonial.",
        );
        throw new Error(message);
      }
      const result = (await response.json()) as { item: TestimonialDetail };
      setSelected(result.item);
      setFormCanEdit(edit);
      setFormOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load testimonial.",
      );
    }
  }

  async function handleDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/testimonials/${pendingDelete.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not delete testimonial.",
        );
        throw new Error(message);
      }
      toast.success("Testimonial deleted.");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete testimonial.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">
            All Testimonials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage homepage testimonials shown on the public site.
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
            Add testimonial
          </PrimaryButton>
        ) : null}
      </div>

      <SubmissionsFilter
        search={params.search}
        onSearchChange={(search) => updateParams({ search })}
        searchPlaceholder="Name, role or message"
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={(status) => updateParams({ status })}
        statusLabel="Visibility"
        allStatusLabel="All"
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => updateParams({ sort })}
        onReset={() =>
          updateParams({
            search: "",
            status: "",
            sort: "order:asc",
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
          <p className="text-base font-medium text-heading">
            No testimonials yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a testimonial to display it on the homepage.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-gray-50/70">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-heading">
                            {initialsFromName(item.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-heading">
                            {item.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.jobRole}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top text-muted-foreground">
                      {item.preview}
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

      <TestimonialFormModal
        open={formOpen}
        item={selected}
        canEdit={formCanEdit && canEdit}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onSaved={(saved) => {
          setData((current) =>
            current
              ? {
                  ...current,
                  items: current.items.some((row) => row.id === saved.id)
                    ? current.items.map((row) =>
                        row.id === saved.id ? saved : row,
                      )
                    : [saved, ...current.items],
                  total: current.items.some((row) => row.id === saved.id)
                    ? current.total
                    : current.total + 1,
                }
              : current,
          );
          refresh();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete testimonial"
        description={`Delete “${pendingDelete?.fullName ?? "this testimonial"}”? It will be removed from the public site.`}
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
