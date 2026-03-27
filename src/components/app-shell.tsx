"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Search,
  Users,
  Zap,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  LogOut,
  ChevronRight,
  Monitor,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Search", href: "/search", icon: Search },
  { label: "IT Services", href: "/it-services", icon: Monitor },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Signals", href: "/signals", icon: Zap },
  { label: "Scrapes", href: "/scrapes", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "??";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const currentPage = navItems.find((item) => isActive(item.href));

  function renderNavLinks(options: { forMobile?: boolean }) {
    return (
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);

          if (collapsed && !options.forMobile) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    />
                  }
                >
                  <item.icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border/50 bg-card/30 transition-all duration-200 md:flex",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border/50 px-3",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <span className="text-sm font-semibold">Lead Scraper</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          {renderNavLinks({ forMobile: false })}
        </ScrollArea>
      </aside>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 px-4">
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Lead Scraper</span>
              {currentPage && (
                <>
                  <ChevronRight className="hidden size-3.5 sm:block" />
                  <span className="font-medium text-foreground">
                    {currentPage.label}
                  </span>
                </>
              )}
            </div>

            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full focus:outline-none">
                  <Avatar className="size-7 cursor-pointer">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {userEmail ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>

        <SheetContent side="left" className="w-56 p-0">
          <SheetHeader className="flex h-14 items-center border-b border-border/50 px-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <SheetTitle className="text-sm font-semibold">
                Lead Scraper
              </SheetTitle>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 py-2">
            {renderNavLinks({ forMobile: true })}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
