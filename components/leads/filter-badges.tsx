"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface FilterBadgesProps {
  filters: string[];
}

export function FilterBadges({ filters }: FilterBadgesProps) {
  if (filters.length === 0) return null;

  return (
    <Card className="w-full p-4 backdrop-blur-sm bg-white/95 border-2 border-slate-200 shadow-xl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground font-serif">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="uppercase tracking-wide text-xs font-bold">AI Filters:</span>
        </div>
        {filters.map((filter, index) => (
          <Badge key={index} variant="secondary" className="text-xs sm:text-sm font-medium">
            {filter}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
