"use client";

import { useCallback, useState } from "react";
import { readApiError } from "@/lib/submissions/api-error";
import type { ContentListResponse } from "@/types/content";

export type ContentListParams = {
  page: number;
  limit: number;
  search: string;
  status: string;
  sort: string;
  group?: string;
};

const DEFAULT_PARAMS: ContentListParams = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sort: "order:asc",
  group: "",
};

export function useContentList<T>(
  endpoint: string,
  initialData: ContentListResponse<T> | null = null,
  initialParams: Partial<ContentListParams> = {},
) {
  const [params, setParams] = useState<ContentListParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [data, setData] = useState<ContentListResponse<T> | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(
    async (nextParams: ContentListParams) => {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set("page", String(nextParams.page));
      searchParams.set("limit", String(nextParams.limit));
      if (nextParams.search) searchParams.set("search", nextParams.search);
      if (nextParams.status) searchParams.set("status", nextParams.status);
      if (nextParams.sort) searchParams.set("sort", nextParams.sort);
      if (nextParams.group) searchParams.set("group", nextParams.group);

      try {
        const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const { message } = await readApiError(
            response,
            "Could not load records.",
          );
          throw new Error(message);
        }
        const result = (await response.json()) as ContentListResponse<T>;
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load records.",
        );
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  const updateParams = useCallback(
    (patch: Partial<ContentListParams>) => {
      const next = { ...params, ...patch };
      if (
        patch.search !== undefined ||
        patch.status !== undefined ||
        patch.sort !== undefined ||
        patch.group !== undefined
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
