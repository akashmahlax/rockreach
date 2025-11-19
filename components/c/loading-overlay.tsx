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
    <div className="flex items-center gap-3 py-4 px-1">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      {activeStep && (
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          {activeStep.label}...
        </span>
      )}
    </div>
  );
}
