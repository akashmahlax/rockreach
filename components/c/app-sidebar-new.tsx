"use client"

import * as React from "react"
import {
  Edit3,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UIMessage } from "ai"

// Define Conversation type locally to avoid circular deps or import issues
interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export function AppSidebarNew({
  user,
  conversations,
  activeConvId,
  isLoadingConversations,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  ...props
}: AppSidebarProps) {
  const router = useRouter()
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameConversation(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue("")
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue("")
  }

  return (
    <Sidebar collapsible="icon" {...props} className={cn("flex flex-col h-full", props.className)}>
      <SidebarHeader className="shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onNewConversation}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plus className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">New Chat</span>
                <span className="truncate text-xs">Start a fresh conversation</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto min-h-0 flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: "Search Leads", url: "/leads/search", icon: Search },
                { title: "My Leads", url: "/leads", icon: Users },
                { title: "Campaigns", url: "/email/campaigns", icon: Mail },
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingConversations ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton disabled className="animate-pulse bg-sidebar-accent/50" />
                  </SidebarMenuItem>
                ))
              ) : conversations.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No history yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    {renamingId === conv.id ? (
                      <div className="flex items-center gap-2 p-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename()
                            if (e.key === "Escape") cancelRename()
                          }}
                          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveRename}>
                          <Plus className="h-3 w-3 rotate-45" />
                        </Button>
                      </div>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={activeConvId === conv.id}
                        className="group/button"
                      >
                        <button onClick={() => router.push(`/c/${conv.id}`)}>
                          <span>{conv.title}</span>
                        </button>
                      </SidebarMenuButton>
                    )}
                    {!renamingId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-48"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem onClick={() => startRename(conv)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteConversation(conv.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="shrink-0 border-t border-sidebar-border bg-sidebar">
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent transition-colors group">
                <Avatar className="h-8 w-8 rounded-lg ring-1 ring-sidebar-border shrink-0">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
                </div>
                <MoreVertical className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg"
              side="top"
              align="end"
              sideOffset={8}
              alignOffset={0}
              avoidCollisions={true}
              collisionPadding={8}
            >
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center w-full cursor-pointer">
                  <span className="mr-2">❓</span>
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/shortcuts" className="flex items-center w-full cursor-pointer">
                  <span className="mr-2">⌨️</span>
                  Keyboard Shortcuts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = "/api/auth/signout"}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

