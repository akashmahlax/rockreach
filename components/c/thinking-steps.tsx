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
    <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-lg overflow-x-auto">
      {steps.map((step, idx) => {
        const Icon = iconMap[step.label.toLowerCase().includes("understanding") ? "brain" :
                            step.label.toLowerCase().includes("processing") ? "cog" :
                            step.label.toLowerCase().includes("searching") ? "search" :
                            step.label.toLowerCase().includes("finding") ? "user" :
                            step.label.toLowerCase().includes("email") ? "mail" :
                            step.label.toLowerCase().includes("whatsapp") ? "whatsapp" : "check"];
        
        return (
          <div key={idx} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                step.status === "complete"
                  ? "bg-primary text-primary-foreground"
                  : step.status === "active"
                  ? "bg-primary/70 text-primary-foreground animate-pulse"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step.status === "complete"
                  ? "text-foreground"
                  : step.status === "active"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-border mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
