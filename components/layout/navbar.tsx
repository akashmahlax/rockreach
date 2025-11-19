"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import SignIn from "@/components/auth/sign-in"
import SignOut from "@/components/auth/sign-out"
import { useTheme } from "next-themes"

interface NavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = !!user

  const getInitials = (name?: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link 
          href={isAuthenticated ? "/dashboard" : "/"} 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg font-serif">
            L
          </div>
          <span className="hidden sm:inline-block font-serif text-xl font-medium tracking-tight">LogiGrow</span>
        </Link>

        {/* Desktop Navigation - Minimal & Flat */}
        <div className="hidden md:flex items-center gap-8">
          {!isAuthenticated ? (
            <>
              <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/docs/guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/leads/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Leads
              </Link>
              <Link href="/email/campaigns" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Campaigns
              </Link>
              <Link href="/docs/guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* User Menu or Sign In */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <SignOut />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignIn />
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Theme toggle in mobile */}
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm font-medium">Theme</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? "Light" : "Dark"}
                  </Button>
                </div>
                
                <Separator />

                <div className="flex flex-col gap-2">
                  {/* Home */}
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/">Home</Link>
                  </Button>

                  {!isAuthenticated ? (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/#features">Features</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/#pricing">Pricing</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/docs/guide">Docs</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/leads/search">Search</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/email/campaigns">Campaigns</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/docs/guide">Docs</Link>
                      </Button>
                    </>
                  )}
                </div>

                {isAuthenticated && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      asChild
                      className="justify-start"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/settings">Settings</Link>
                    </Button>
                    {user.role === "admin" && (
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/admin">Admin Panel</Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => setMobileOpen(false)}
                    >
                      <SignOut />
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
