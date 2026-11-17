"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  DASHBOARD_PRESETS,
  PRESET_LABELS,
  type DashboardPreset,
} from "@/lib/dashboard/dashboard.types";

/** Keep the dashboard's remaining filters in the URL. */
export function useDashboardParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const key of ["shop", "status", "q", "page"]) next.delete(key);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() =>
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
      );
    },
    [params, pathname, router],
  );

  const reset = useCallback(
    () => startTransition(() => router.push(pathname, { scroll: false })),
    [pathname, router],
  );

  return { params, update, reset, pending };
}

const field =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const label =
  "mb-1 block text-xs font-medium text-muted-foreground";

interface Props {
  /** Resolved dates, used to pre-fill the custom range inputs. */
  resolvedFrom: string;
  resolvedTo: string;
  maxDate: string;
}

export default function DashboardFilters({
  resolvedFrom,
  resolvedTo,
  maxDate,
}: Props) {
  const { params, update, reset, pending } = useDashboardParams();

  const preset = (params.get("preset") as DashboardPreset) || "last_30";

  const [from, setFrom] = useState(params.get("from") ?? resolvedFrom);
  const [to, setTo] = useState(params.get("to") ?? resolvedTo);

  useEffect(() => {
    setFrom(params.get("from") ?? resolvedFrom);
    setTo(params.get("to") ?? resolvedTo);
  }, [params, resolvedFrom, resolvedTo]);

  const customInvalid = !from || !to || from > to;

  return (
    <section
      aria-label="Dashboard filters"
      className={`rounded-xl border border-card-border bg-card p-4 shadow-sm transition-opacity ${
        pending ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-preset" className={label}>
            Period
          </label>
          <select
            id="f-preset"
            className={field}
            value={preset}
            onChange={(e) => {
              const v = e.target.value as DashboardPreset;
              update(
                v === "custom"
                  ? { preset: v, from, to }
                  : {
                      preset: v === "last_30" ? null : v,
                      from: null,
                      to: null,
                    },
              );
            }}
          >
            {DASHBOARD_PRESETS.map((p) => (
              <option key={p} value={p}>
                {PRESET_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {preset === "custom" && (
          <>
            <div>
              <label htmlFor="f-from" className={label}>
                From
              </label>
              <input
                id="f-from"
                type="date"
                className={field}
                value={from}
                max={maxDate}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="f-to" className={label}>
                To
              </label>
              <input
                id="f-to"
                type="date"
                className={field}
                value={to}
                max={maxDate}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={customInvalid}
              onClick={() => update({ preset: "custom", from, to })}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </>
        )}

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input px-3 text-sm text-foreground hover:bg-secondary"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset
        </button>
      </div>
      {preset === "custom" && customInvalid && (
        <p className="mt-2 text-xs text-red-600">
          Pick a valid start and end date (start must not be after end).
        </p>
      )}
    </section>
  );
}
