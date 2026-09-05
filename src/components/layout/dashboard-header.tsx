"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationCount = 3;

  const pageTitle =
    title ??
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "Dashboard";

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-glass-border glass px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-9 w-full rounded-lg border border-glass-border bg-background/50 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/25"
                />
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-4.5 w-4.5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-pink px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl glass border border-glass-border shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Notifications
                  </h3>
                  <button className="text-xs text-neon-cyan hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border-b border-glass-border px-4 py-3 transition-colors hover:bg-white/5"
                    >
                      <p className="text-sm text-foreground">
                        New connection request from Company {i}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {i} hour{i !== 1 ? "s" : ""} ago
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-glass-border px-4 py-2.5">
                  <button className="w-full text-center text-xs font-medium text-neon-cyan hover:underline">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan text-xs font-semibold text-white">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : user ? (
                getInitials(user.full_name)
              ) : (
                "?"
              )}
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-muted-foreground transition-transform sm:block",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl glass border border-glass-border p-1.5 shadow-xl"
              >
                <div className="border-b border-glass-border px-3 py-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.full_name ?? "Guest"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
                <a
                  href="/app"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  Profile
                </a>
                <a
                  href="/app/settings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
