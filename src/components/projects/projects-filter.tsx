"use client";

import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES, PROJECT_STATUS_META } from "@/lib/status";

const ALL = "ALL";

/**
 * Search and status filter. State lives in the URL rather than in React, so a
 * filtered view is shareable, survives a refresh, and lets the server
 * component do the filtering against the database.
 */
export function ProjectsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? ALL;

  const [search, setSearch] = useState(currentSearch);

  // Debounced so typing does not fire a navigation per keystroke.
  useEffect(() => {
    if (search === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}` as Route);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentSearch, pathname, router, searchParams]);

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon
          className="text-text-tertiary pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects…"
          aria-label="Search projects"
          className="pl-8"
        />
      </div>

      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {PROJECT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {PROJECT_STATUS_META[value].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
