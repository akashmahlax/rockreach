"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_STEPS = [
  "Understanding your query",
  "Collecting profiles from RocketReach",
  "Enriching with AI insights",
  "Validating contact data",
  "Preparing results",
];

interface AIThinkingStepperProps {
  status: "idle" | "thinking" | "results";
  currentStep: number;
}

export function AIThinkingStepper({ status, currentStep }: AIThinkingStepperProps) {
  if (status === "idle") return null;

  const isDone = status === "results";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
          <div className="rounded-xl sm:rounded-2xl bg-indigo-100 p-2 sm:p-3">
            <Loader2
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 text-indigo-600",
                status === "thinking" && "animate-spin"
              )}
            />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-500 font-serif">
              AI Progress
            </p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 font-serif">
              {status === "thinking" ? "Analyzing & assembling your list" : "Results ready"}
            </p>
          </div>
        </div>

        {/* Steps */}
        <ol className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
          {AI_STEPS.map((step, idx) => {
            const isComplete = idx < (isDone ? AI_STEPS.length : currentStep);
            const isCurrent = idx === currentStep && !isDone;

            return (
              <li key={step} className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-sm sm:text-base font-bold transition-all",
                    isComplete
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : isCurrent
                      ? "border-2 border-indigo-400 bg-indigo-50 text-indigo-600 animate-pulse"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm sm:text-base transition-colors",
                    isComplete || isCurrent ? "font-semibold text-slate-900" : "text-slate-400"
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
