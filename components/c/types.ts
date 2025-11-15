// Shared types for Assistant components

import { UIMessage } from "ai";

export interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
}

export interface ThinkingStep {
  label: string;
  status: "pending" | "active" | "complete";
}

export interface UsageStats {
  period: string;
  totalTokens: number;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  avgDurationMs: number;
  estimatedCost: string;
  costPerCall: string;
}

export interface AssistantUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}
