"use client";

import { Brain, Cog, Check, Search, User as UserIcon, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingStep } from "./types";

interface ThinkingStepsProps {
  steps: ThinkingStep[];
}

const iconMap = {
  brain: Brain,
  cog: Cog,
  check: Check,
  search: Search,
  user: UserIcon,
  mail: Mail,
  whatsapp: MessageCircle,
};

export function ThinkingSteps({ steps }: ThinkingStepsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      {steps.map((step, idx) => {
        const Icon = iconMap[step.label.toLowerCase().includes("understanding") ? "brain" :
                            step.label.toLowerCase().includes("processing") ? "cog" :
                            step.label.toLowerCase().includes("searching") ? "search" :
                            step.label.toLowerCase().includes("finding") ? "user" :
                            step.label.toLowerCase().includes("email") ? "mail" :
                            step.label.toLowerCase().includes("whatsapp") ? "whatsapp" : "check"];
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                step.status === "complete"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                  ? "bg-amber-500 text-white animate-pulse"
                  : "bg-slate-200 text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step.status === "complete"
                  ? "text-green-700"
                  : step.status === "active"
                  ? "text-amber-700"
                  : "text-slate-400"
              )}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-slate-200 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
