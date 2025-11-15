"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const examples = [
    "Find 10 CTOs at Series B SaaS companies in San Francisco",
    "Lookup the contact details for john@acme.com",
    "Search for VPs of Marketing in fintech startups",
    "Draft a cold email to a Head of Sales",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h2 className="mb-2 text-3xl font-semibold text-slate-900">How can I help you today?</h2>

      <p className="mb-8 max-w-md text-slate-600">
        Ask me anything about finding leads, looking up contacts, or drafting outreach.
      </p>

      <div className="w-full max-w-2xl space-y-2">
        {examples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => onExampleClick(example)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
