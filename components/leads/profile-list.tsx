"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";

export interface Profile {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone?: string;
  location?: string;
  tags: string[];
  linkedinUrl?: string;
}

interface ProfileListProps {
  profiles: Profile[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
}

export function ProfileList({ profiles, selectedProfileId, onSelectProfile }: ProfileListProps) {
  if (profiles.length === 0) return null;

  return (
    <Card className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 font-serif">
            Profiles
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 font-serif">
            {profiles.length} {profiles.length === 1 ? "match" : "matches"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Profile List */}
      <div className="space-y-2 sm:space-y-3 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className={cn(
              "w-full rounded-xl sm:rounded-2xl border-2 px-3 sm:px-4 py-3 sm:py-4 text-left transition-all",
              profile.id === selectedProfileId
                ? "border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-100"
                : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
            )}
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
              {profile.company}
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
              {profile.name}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 truncate">{profile.title}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
