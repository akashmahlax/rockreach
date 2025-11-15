"use client";

import { ThinkingStep } from "./types";

interface LoadingOverlayProps {
  isLoading: boolean;
  thinkingSteps: ThinkingStep[];
  onStop: () => void;
}

export function LoadingOverlay({ isLoading, thinkingSteps }: LoadingOverlayProps) {
  if (!isLoading) return null;

  const activeStep = thinkingSteps.find((s) => s.status === "active");

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        {activeStep && (
          <span className="text-xs text-slate-600 ml-2">
            {activeStep.label}
          </span>
        )}
      </div>
    </div>
  );
}
