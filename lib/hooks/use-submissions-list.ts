"use client";

import { useCallback, useState } from "react";
import { readApiError } from "@/lib/submissions/api-error";
import type { SubmissionsListResponse } from "@/types/submissions";

export type SubmissionsListParams = {
  page: number;
  limit: number;
  search: string;
  status: string;
  sort: string;
  topic?: string;
  rating?: string;
};

const DEFAULT_PARAMS: SubmissionsListParams = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sort: "createdAt:desc",
  topic: "",
  rating: "",
};

export function useSubmissionsList<T>(
  endpoint: string,
  initialData: SubmissionsListResponse<T> | null = null,
) {
  const [params, setParams] = useState<SubmissionsListParams>(DEFAULT_PARAMS);
  const [data, setData] = useState<SubmissionsListResponse<T> | null>(
    initialData,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(
    async (nextParams: SubmissionsListParams) => {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set("page", String(nextParams.page));
      searchParams.set("limit", String(nextParams.limit));
      if (nextParams.search) searchParams.set("search", nextParams.search);
      if (nextParams.status) searchParams.set("status", nextParams.status);
      if (nextParams.sort) searchParams.set("sort", nextParams.sort);
      if (nextParams.topic) searchParams.set("topic", nextParams.topic);
      if (nextParams.rating) searchParams.set("rating", nextParams.rating);

      try {
        const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const { message } = await readApiError(
            response,
            "Could not load submissions.",
          );
          throw new Error(message);
        }
        const result = (await response.json()) as SubmissionsListResponse<T>;
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load submissions.",
        );
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  const updateParams = useCallback(
    (patch: Partial<SubmissionsListParams>) => {
      const next = { ...params, ...patch };
      if (
        patch.search !== undefined ||
        patch.status !== undefined ||
        patch.sort !== undefined ||
        patch.topic !== undefined ||
        patch.rating !== undefined
      ) {
        next.page = patch.page ?? 1;
      }
      setParams(next);
      void fetchList(next);
    },
    [fetchList, params],
  );

  const refresh = useCallback(() => {
    void fetchList(params);
  }, [fetchList, params]);

  return {
    params,
    data,
    loading,
    error,
    updateParams,
    refresh,
    setData,
  };
}
