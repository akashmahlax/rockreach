"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Menu,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Conversation } from "./types";

interface AssistantSidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  usageStats?: unknown;
  loadingStats?: boolean;
  usagePeriod?: string;
  onUsagePeriodChange?: (period: unknown) => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AssistantSidebar({
  conversations,
  activeConvId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  user,
}: AssistantSidebarProps) {
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

  const userName = user?.name || user?.email || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="w-64 bg-[#171717] flex flex-col h-full border-r border-neutral-800 overflow-hidden">
      {/* Fixed Top Section */}
      <div className="shrink-0 border-b border-neutral-800">
        {/* Header with Menu */}
        <div className="p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            onClick={onNewConversation}
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Chats Section - with min-h-0 to allow proper flex shrinking */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-2 py-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-neutral-500 py-8 text-center">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                    activeConvId === conv.id
                      ? "bg-neutral-800 shadow-sm"
                      : "hover:bg-neutral-800/50"
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
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-600"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div
                        onClick={() => onConversationSelect(conv.id)}
                        className="flex-1 truncate text-sm text-neutral-300"
                      >
                        {conv.title}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-neutral-700 transition-all shrink-0 text-neutral-400 hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700">
                          <DropdownMenuItem
                            onClick={() => startRenameConversation(conv.id)}
                            className="text-neutral-300 focus:bg-neutral-700 focus:text-white"
                          >
                            <Edit3 className="h-3 w-3 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteConversation(conv.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-neutral-700"
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
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Bottom Section - Always visible */}
      <div className="shrink-0 border-t border-neutral-800 bg-[#171717]">
        {user && (
          <div className="p-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                {user.image && <AvatarImage src={user.image} alt={userName} />}
                <AvatarFallback className="bg-neutral-700 text-neutral-200 text-sm font-medium">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">
                  {userName}
                </p>
                {user.email && user.name && (
                  <p className="text-xs text-neutral-500 truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <Link
                href="/settings"
                className="shrink-0 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
