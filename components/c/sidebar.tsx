"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit3,
  Trash2,
  DollarSign,
  Zap,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation, UsageStats } from "./types";

interface AssistantSidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  usageStats: UsageStats | null;
  loadingStats: boolean;
  usagePeriod: "24h" | "7d" | "30d";
  onUsagePeriodChange: (period: "24h" | "7d" | "30d") => void;
}

export function AssistantSidebar({
  conversations,
  activeConvId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  usageStats,
  loadingStats,
  usagePeriod,
  onUsagePeriodChange,
}: AssistantSidebarProps) {
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isUsageStatsOpen, setIsUsageStatsOpen] = useState(true);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRenameConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setRenamingConvId(id);
      setRenameValue(conv.title);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      onRenameConversation(id, renameValue.trim());
    }
    setRenamingConvId(null);
    setRenameValue("");
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Recent Chats Section */}
          <Collapsible open={isConversationsOpen} onOpenChange={setIsConversationsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-slate-900">
              <span>Recent Chats</span>
              {isConversationsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      activeConvId === conv.id
                        ? "bg-amber-50 text-amber-900"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    {renamingConvId === conv.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(conv.id);
                          if (e.key === "Escape") setRenamingConvId(null);
                        }}
                        className="flex-1 bg-white border border-amber-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        autoFocus
                      />
                    ) : (
                      <>
                        <div
                          onClick={() => onConversationSelect(conv.id)}
                          className="flex-1 truncate text-sm"
                        >
                          {conv.title}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => startRenameConversation(conv.id)}
                            >
                              <Edit3 className="h-3 w-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteConversation(conv.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* AI Usage Stats Section */}
          <Collapsible open={isUsageStatsOpen} onOpenChange={setIsUsageStatsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-slate-900">
              <span>AI Usage Stats</span>
              {isUsageStatsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3">
                {/* Period Selector */}
                <select
                  value={usagePeriod}
                  onChange={(e) =>
                    onUsagePeriodChange(e.target.value as "24h" | "7d" | "30d")
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  </div>
                ) : usageStats ? (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-amber-700 font-medium">
                          Total Cost
                        </span>
                        <DollarSign className="h-3 w-3 text-amber-600" />
                      </div>
                      <div className="text-lg font-bold text-amber-900">
                        ${usageStats.estimatedCost}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">
                        {usageStats.totalCalls} calls
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-purple-700 font-medium">
                          Tokens Used
                        </span>
                        <Zap className="h-3 w-3 text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {(usageStats.totalTokens / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        {usageStats.successCalls} successful
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-blue-700 font-medium">
                          Avg Response
                        </span>
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        {(usageStats.avgDurationMs / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        ${usageStats.costPerCall}/call
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No usage data available
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
