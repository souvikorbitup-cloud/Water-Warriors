"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type FilterOption = {
  value: string;
  label: string;
};

const ALL_VALUE = "all";

export default function SubmissionsFilter({
  search,
  onSearchChange,
  status,
  statusOptions,
  onStatusChange,
  sort,
  sortOptions,
  onSortChange,
  extraFilters,
  onReset,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  statusOptions: FilterOption[];
  onStatusChange: (value: string) => void;
  sort: string;
  sortOptions: FilterOption[];
  onSortChange: (value: string) => void;
  extraFilters?: ReactNode;
  onReset: () => void;
}) {
  const [draftSearch, setDraftSearch] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setDraftSearch(search);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchChange(draftSearch.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:grid-cols-[1fr_auto]"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:col-span-1">
          <Label htmlFor="submissions-search" className="text-heading">
            Search
          </Label>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="submissions-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Name, email or message"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="submissions-status" className="text-heading">
            Status
          </Label>
          <Select
            value={status || ALL_VALUE}
            onValueChange={(value) =>
              onStatusChange(value === ALL_VALUE ? "" : value)
            }
          >
            <SelectTrigger
              id="submissions-status"
              className="mt-2 h-10! w-full"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {extraFilters}

        <div>
          <Label htmlFor="submissions-sort" className="text-heading">
            Sort by
          </Label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger id="submissions-sort" className="mt-2 h-10! w-full">
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" className="h-10 px-4 cursor-pointer">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-3 cursor-pointer"
          onClick={() => {
            setDraftSearch("");
            onReset();
          }}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </form>
  );
}
