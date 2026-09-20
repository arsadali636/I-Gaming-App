"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
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
  LayoutDashboard,
  Tag,
  MessageSquare,
  Calendar,
  Grid,
  Store,
  Contact,
  Users,
  Briefcase,
  Bookmark,
  CreditCard,
  ExternalLink,
  Newspaper,
} from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [offersMenuOpen, setOffersMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [dbNotifications, setDbNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; is_read: number; link?: string; created_at: string }>>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
    setMoreMenuOpen(false);
    setOffersMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setDbNotifications(data.notifications || []);
        setUnreadNotifCount(data.unread_count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotifClick = async (notif: { id: string; link?: string }) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notif.id }),
      });
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch {}
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", { method: "POST" });
      setDbNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } catch {}
  };

  // Fetch real unread message count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadMessageCount(data.unread_count || 0);
        }
      } catch (err) {
        // Silent catch for background unread count fetch
      }
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const moreItems = [
    { href: "/app/feed", label: "Industry Feed", icon: Newspaper, desc: "Global B2B Activity Feed" },
    { href: "/app/marketplace", label: "Marketplace", icon: Store, desc: "B2B Company Discovery" },
    { href: "/app/contacts", label: "My Contacts", icon: Contact, desc: "Revealed Decision Makers" },
    { href: "/app/connections", label: "Connections", icon: Users, desc: "Professional Network" },
    { href: "/app/opportunities", label: "Opportunities", icon: Briefcase, desc: "B2B Deals & Demands" },
    { href: "/app/saved", label: "Saved Items", icon: Bookmark, desc: "Bookmarked Entities" },
    { href: "/app/subscription", label: "Subscription", icon: CreditCard, desc: "Plans & Credit Wallet" },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#080C16]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
      {/* LEFT: Branding & Main Navigation Bar */}
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-3">
          <Link href="/app" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] shadow-[0_0_15px_rgba(79,107,255,0.4)] group-hover:scale-105 transition-transform duration-200">
              <span className="text-[11px] font-black tracking-widest text-white">iG</span>
            </div>
            <span className="text-sm font-black tracking-tight text-white hidden md:inline">
              iGaming <span className="text-[#60A5FA]">Connect</span>
            </span>
          </Link>
        </div>

        {/* AFFPAPA-STYLE TOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 bg-[#111827]/80 p-1 rounded-2xl border border-white/[0.06]">
          {/* Hub */}
          <Link
            href="/app"
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              pathname === "/app"
                ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Hub</span>
          </Link>

          {/* Feed */}
          <Link
            href="/app/feed"
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              pathname === "/app/feed"
                ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Newspaper className="h-3.5 w-3.5" />
            <span>Feed</span>
          </Link>

          {/* Offers Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setOffersMenuOpen(!offersMenuOpen);
                setMoreMenuOpen(false);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                pathname.startsWith("/app/offers") || offersMenuOpen
                  ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Offers</span>
              <span className="rounded-full bg-[#EF4444] text-white text-[9px] font-black px-1.5 py-0.2">
                NEW
              </span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", offersMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {offersMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-[#151C2C] border border-white/[0.08] p-2 shadow-2xl z-50 backdrop-blur-xl space-y-1"
                >
                  <Link
                    href="/app/offers?type=affiliate"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-[#F8FAFC] transition-colors hover:bg-white/[0.06] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-[#60A5FA]" />
                      <span>Affiliate Offers</span>
                    </div>
                    <span className="rounded-full bg-[#EF4444] text-white text-[9px] font-black px-1.5 py-0.2">
                      NEW
                    </span>
                  </Link>

                  <Link
                    href="/app/offers?type=operator"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[#F8FAFC] transition-colors hover:bg-white/[0.06] group"
                  >
                    <Tag className="h-4 w-4 text-[#34D399]" />
                    <span>Operator Offers</span>
                  </Link>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <Link
                    href="/app/offers"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>View All Offers →</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <Link
            href="/app/messages"
            className={cn(
              "relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              pathname.startsWith("/app/messages")
                ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Messages</span>
            {unreadMessageCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-extrabold text-white">
                {unreadMessageCount}
              </span>
            )}
          </Link>

          {/* Events (Existing events page) */}
          <Link
            href="/events"
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              pathname.startsWith("/events")
                ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Events</span>
          </Link>

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                moreMenuOpen || moreItems.some((item) => pathname.startsWith(item.href))
                  ? "bg-[#4F6BFF]/20 text-[#60A5FA] border border-[#4F6BFF]/40"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>More</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", moreMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-[#151C2C] border border-white/[0.08] p-2 shadow-2xl z-50 backdrop-blur-xl"
                >
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#64748B] border-b border-white/[0.06] mb-1">
                    B2B Modules
                  </div>
                  <div className="space-y-0.5">
                    {moreItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl p-2 text-xs transition-colors hover:bg-white/[0.04]",
                          pathname.startsWith(item.href) ? "bg-[#4F6BFF]/15 text-[#60A5FA] font-bold" : "text-[#94A3B8]"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-[#60A5FA]" />
                        <div>
                          <p className="font-bold text-[#F8FAFC]">{item.label}</p>
                          <p className="text-[10px] text-[#64748B]">{item.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              pathname.startsWith("/app/settings")
                ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* RIGHT: Search, Notifications & User Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative">
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search network, offers, contacts..."
                  className="h-9 w-full rounded-xl border border-white/[0.08] bg-[#111827] pl-9 pr-8 text-xs text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#4F6BFF] transition-all shadow-lg"
                />
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111827] px-3 py-1.5 text-xs font-medium text-[#94A3B8] transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-[#F8FAFC] cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5 text-[#94A3B8]" />
              <span className="hidden sm:inline">Search...</span>
            </button>
          )}
        </div>

        {/* Notifications Trigger & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              const nextState = !notificationsOpen;
              setNotificationsOpen(nextState);
              if (nextState) fetchNotifications();
              setUserMenuOpen(false);
              setMoreMenuOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-[#111827] text-[#94A3B8] transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-[#F8FAFC] cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60A5FA] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F6BFF]" />
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-3 w-80 sm:w-96 overflow-hidden rounded-2xl bg-[#151C2C] border border-white/[0.08] shadow-2xl z-50 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 bg-[#111827]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[#F8FAFC]">
                      Notifications
                    </h3>
                    {unreadNotifCount > 0 && (
                      <span className="rounded-full bg-[#4F6BFF]/20 px-2 py-0.5 text-[10px] font-bold text-[#60A5FA]">
                        {unreadNotifCount} New
                      </span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                  {dbNotifications.length === 0 ? (
                    <div className="px-5 py-6 text-center text-xs text-[#94A3B8]">
                      No notifications yet.
                    </div>
                  ) : (
                    dbNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          "px-5 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer flex gap-3 items-start",
                          notif.is_read === 0 && "bg-[#4F6BFF]/[0.05]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 mt-1.5 rounded-full shrink-0",
                            notif.is_read === 0 ? "bg-[#4F6BFF]" : "bg-white/20"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#F8FAFC] truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="mt-1 text-[10px] text-[#64748B]">
                            {formatDate(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
              setMoreMenuOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111827] p-1 pr-2.5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F6BFF] to-[#3B54E6] text-xs font-bold text-white shadow-md">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-7 w-7 rounded-lg object-cover"
                />
              ) : user ? (
                getInitials(user.full_name)
              ) : (
                "?"
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-[#F8FAFC]">
              {user?.full_name?.split(" ")[0] ?? "Account"}
            </span>
            <ChevronDown className={cn("h-3 w-3 text-[#94A3B8] transition-transform", userMenuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-2xl bg-[#151C2C] border border-white/[0.08] p-2 shadow-2xl z-50 backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-3 py-2 mb-1.5 bg-[#111827] rounded-xl">
                  <p className="text-xs font-bold text-[#F8FAFC] truncate">
                    {user?.full_name ?? "Authenticated User"}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                    {user?.email ?? "B2B Network Member"}
                  </p>
                </div>
                <Link
                  href="/app/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-[#F8FAFC]"
                >
                  <User className="h-4 w-4 text-[#60A5FA]" />
                  My Profile
                </Link>
                <Link
                  href="/app/settings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-[#F8FAFC]"
                >
                  <Settings className="h-4 w-4 text-[#94A3B8]" />
                  Account Settings
                </Link>
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#EF4444] transition-colors hover:bg-[#EF4444]/10 cursor-pointer"
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
