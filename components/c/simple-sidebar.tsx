"use client";

import * as React from "react";
import { Plus, MoreVertical, Search, Users, Mail, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";

interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
}

interface SimpleSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  conversations: Conversation[];
  activeConvId: string | null;
  isLoadingConversations: boolean;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}

export function SimpleSidebar({
  user,
  conversations,
  activeConvId,
  isLoadingConversations,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}: SimpleSidebarProps) {
  const router = useRouter();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border">
      {/* Header - New Chat Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Chat</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-2 border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Platform
        </div>
        <nav className="space-y-1">
          <Link
            href="/leads/search"
            className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search Leads</span>
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>My Leads</span>
          </Link>
          <Link
            href="/email/campaigns"
            className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>Campaigns</span>
          </Link>
        </nav>
      </div>

      {/* Recent Chats - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Recent Chats
        </div>
        <div className="space-y-1">
          {isLoadingConversations ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-md bg-muted/50 animate-pulse"
              />
            ))
          ) : conversations.length === 0 ? (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              No chats yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex items-center gap-2 px-2 py-2 rounded-md transition-colors",
                  activeConvId === conv.id
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                {renamingId === conv.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => router.push(`/c/${conv.id}`)}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {conv.title}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => startRename(conv)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteConversation(conv.id)}
                          className="text-destructive focus:text-destructive"
                        >
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
      </div>

      {/* Footer - User Profile */}
      <div className="p-3 border-t border-border">
        <DropdownMenu   >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.name || "User"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email || ""}
                </div>
              </div>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer m-1 rounded-none border dark:border-slate-600 border-slate-200 dark:bg-slate-800 bg-slate-200">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild >
              <Link href="/help" className="cursor-pointer m-1 rounded-none border dark:border-slate-600 border-slate-200 dark:bg-slate-800 bg-slate-200">
                 Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (window.location.href = "/api/auth/signout")}
              className="text-destructive focus:text-destructive cursor-pointer m-1 rounded-none border dark:border-slate-600 border-slate-200 dark:bg-slate-800 bg-slate-200"
            >
              <LogOut className="mr-2 h-4 w-4 " />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
