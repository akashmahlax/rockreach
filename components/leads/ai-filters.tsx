"use client";

import { Badge } from "@/components/ui/badge";

interface AIFiltersProps {
  filters: string[];
}

export function AIFilters({ filters }: AIFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 bg-white px-4 sm:px-5 py-3 sm:py-4 shadow-sm">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-500">
          AI Filters:
        </span>
        {filters.map((filter) => (
          <Badge
            key={filter}
            variant="secondary"
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm"
          >
            {filter}
          </Badge>
        ))}
      </div>
    </div>
  );
}
