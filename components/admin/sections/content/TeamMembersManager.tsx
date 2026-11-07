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
import { initialsFromName } from "@/lib/content/client-form";
import { TEAM_GROUPS, type TeamGroup } from "@/lib/content/constants";
import type {
  ContentListResponse,
  TeamMemberDetail,
  TeamMemberListItem,
} from "@/types/content";
import SubmissionsTableSkeleton from "@/components/admin/sections/submissions/SubmissionsTableSkeleton";
import TeamMemberFormModal from "./TeamMemberFormModal";
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

const GROUP_LABELS: Record<TeamGroup, string> = {
  leadership: "Leadership",
  technical_advisors: "Technical Advisors",
};

const ALL_VALUE = "all";

export default function TeamMembersManager({
  canEdit,
  initialData,
}: {
  canEdit: boolean;
  initialData: ContentListResponse<TeamMemberListItem>;
}) {
  const { params, data, loading, error, updateParams, refresh } =
    useContentList<TeamMemberListItem>("/api/admin/team-members", initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TeamMemberDetail | null>(null);
  const [formCanEdit, setFormCanEdit] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<TeamMemberListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  async function openItem(item: TeamMemberListItem, edit: boolean) {
    try {
      const response = await fetch(`/api/admin/team-members/${item.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not load team member.",
        );
        throw new Error(message);
      }
      const result = (await response.json()) as { item: TeamMemberDetail };
      setSelected(result.item);
      setFormCanEdit(edit);
      setFormOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load team member.",
      );
    }
  }

  async function handleDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/team-members/${pendingDelete.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const { message } = await readApiError(
          response,
          "Could not delete team member.",
        );
        throw new Error(message);
      }
      toast.success("Team member deleted.");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete team member.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Team Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage leadership and technical advisor profiles.
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
            Add member
          </PrimaryButton>
        ) : null}
      </div>

      <SubmissionsFilter
        search={params.search}
        onSearchChange={(search) => updateParams({ search })}
        searchPlaceholder="Name, role or bio"
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
            <Label htmlFor="team-group-filter" className="text-heading">
              Group
            </Label>
            <Select
              value={params.group || ALL_VALUE}
              onValueChange={(value) =>
                updateParams({ group: value === ALL_VALUE ? "" : value })
              }
            >
              <SelectTrigger
                id="team-group-filter"
                className="mt-2 h-10! w-full"
              >
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All groups</SelectItem>
                {TEAM_GROUPS.map((value) => (
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
          <p className="text-base font-medium text-heading">
            No team members yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a profile to show it on the leadership page.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
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
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        {item.avatarUrl ? (
                          <Image
                            src={item.avatarUrl}
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
                            {item.role}
                          </p>
                        </div>
                      </div>
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

      <TeamMemberFormModal
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
        title="Delete team member"
        description={`Delete “${pendingDelete?.fullName ?? "this team member"}”? It will be removed from the public site.`}
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
