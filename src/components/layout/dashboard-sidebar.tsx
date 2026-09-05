"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Contact,
  Users,
  MessageSquare,
  Briefcase,
  Bookmark,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";

const sidebarLinks = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/marketplace", label: "Marketplace", icon: Store },
  { href: "/app/contacts", label: "My Contacts", icon: Contact },
  { href: "/app/connections", label: "Connections", icon: Users },
  { href: "/app/messages", label: "Messages", icon: MessageSquare },
  { href: "/app/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/app/saved", label: "Saved", icon: Bookmark },
  { href: "/app/subscription", label: "Subscription", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col glass transition-all duration-300",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-glass-border px-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 overflow-hidden transition-all",
              !sidebarOpen && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan">
              <span className="text-sm font-bold text-white">iG</span>
            </div>
            {sidebarOpen && (
              <span className="gradient-text text-lg font-bold tracking-tight whitespace-nowrap">
                iGaming Connect
              </span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground lg:flex"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                link.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-neon-purple/15 text-neon-cyan neon-glow"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      !sidebarOpen && "justify-center px-0"
                    )}
                    title={!sidebarOpen ? link.label : undefined}
                  >
                    <link.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-neon-cyan"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {sidebarOpen && <span>{link.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-glass-border p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan text-xs font-semibold text-white">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : user ? (
                getInitials(user.full_name)
              ) : (
                "?"
              )}
            </div>
            {sidebarOpen && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-foreground">
                  {user?.full_name ?? "Guest"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      />
    </>
  );
}
