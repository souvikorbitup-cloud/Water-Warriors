"use client";

import { useMemo, useState } from "react";
import { Eye, MessageSquareText } from "lucide-react";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
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
import {
  FEEDBACK_STATUSES,
  FEEDBACK_TOPICS,
} from "@/lib/submissions/constants";
import { formatSubmissionDate } from "@/lib/submissions/format";
import { useSubmissionsList } from "@/lib/hooks/use-submissions-list";
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

const TOPIC_LABELS: Record<(typeof FEEDBACK_TOPICS)[number], string> = {
  property: "Property assessment",
  report: "Report questions",
  general: "General feedback",
  other: "Something else",
};

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

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  const selectedFields = useMemo(() => {
    if (!selected) return [];
    return [
      {
        label: "Name",
        value: selected.isAnonymous ? "Anonymous" : selected.name,
      },
      { label: "Email", value: selected.email },
      { label: "Topic", value: TOPIC_LABELS[selected.topic] },
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
        onSearchChange={(search) => updateParams({ search })}
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={(status) => updateParams({ status })}
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => updateParams({ sort })}
        extraFilters={
          <>
            <div>
              <Label htmlFor="feedback-topic-filter" className="text-heading">
                Topic
              </Label>
              <Select
                value={params.topic || ALL_VALUE}
                onValueChange={(value) =>
                  updateParams({ topic: value === ALL_VALUE ? "" : value })
                }
              >
                <SelectTrigger
                  id="feedback-topic-filter"
                  className="mt-2 h-10! w-full"
                >
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All topics</SelectItem>
                  {FEEDBACK_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {TOPIC_LABELS[topic]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feedback-rating-filter" className="text-heading">
                Rating
              </Label>
              <Select
                value={params.rating || ALL_VALUE}
                onValueChange={(value) =>
                  updateParams({ rating: value === ALL_VALUE ? "" : value })
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
          </>
        }
        onReset={() =>
          updateParams({
            search: "",
            status: "",
            sort: "createdAt:desc",
            topic: "",
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
        <SubmissionsTableSkeleton columns={6} />
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
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
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
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-gray-50/70">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-heading">
                        {item.isAnonymous ? "Anonymous" : item.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.email || "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-heading">
                      {TOPIC_LABELS[item.topic]}
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
    </div>
  );
}
