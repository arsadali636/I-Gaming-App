"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Tag,
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
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";

interface SidebarSection {
  title?: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/profile", label: "My Profile", icon: User },
      { href: "/app/offers", label: "B2B Offers", icon: Tag },
      { href: "/app/marketplace", label: "Marketplace", icon: Store },
    ],
  },
  {
    title: "NETWORK & B2B",
    items: [
      { href: "/app/contacts", label: "My Contacts", icon: Contact },
      { href: "/app/connections", label: "Connections", icon: Users },
      { href: "/app/opportunities", label: "Opportunities", icon: Briefcase },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { href: "/app/messages", label: "Messages", icon: MessageSquare },
      { href: "/app/saved", label: "Saved Items", icon: Bookmark },
    ],
  },
  {
    title: "PREMIUM ACCOUNT",
    items: [
      { href: "/app/subscription", label: "Subscription", icon: CreditCard },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#080C16] border-r border-white/[0.07] transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-4 bg-[#0A0F1E]">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all group",
              !sidebarOpen && "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] shadow-[0_0_20px_rgba(79,107,255,0.4)] group-hover:scale-105 transition-transform duration-200">
              <span className="text-xs font-black tracking-widest text-white">iG</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-[#F8FAFC] text-base font-black tracking-tight whitespace-nowrap leading-none bg-gradient-to-r from-white via-[#F8FAFC] to-[#94A3B8] bg-clip-text text-transparent">
                  iGaming Connect
                </span>
                <span className="text-[9px] font-extrabold tracking-widest text-[#60A5FA] uppercase mt-1">
                  Global B2B Network
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="hidden rounded-xl p-1.5 text-[#94A3B8] transition-colors hover:bg-white/[0.08] hover:text-[#F8FAFC] lg:flex cursor-pointer border border-transparent hover:border-white/[0.08]"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {sidebarSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              {sidebarOpen && section.title && (
                <p className="px-3 text-[10px] font-extrabold tracking-widest text-[#64748B] uppercase mb-1">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((link) => {
                  const isActive =
                    link.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(link.href);

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-[#4F6BFF]/25 via-[#4F6BFF]/12 to-transparent text-[#F8FAFC] font-bold border-l-2 border-[#4F6BFF] shadow-[inset_0_0_12px_rgba(79,107,255,0.2)]"
                            : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-[#F8FAFC]",
                          !sidebarOpen && "justify-center px-0 border-l-0"
                        )}
                        title={!sidebarOpen ? link.label : undefined}
                      >
                        <link.icon
                          className={cn(
                            "h-4.5 w-4.5 shrink-0 transition-all duration-200",
                            isActive
                              ? "text-[#60A5FA] drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] scale-110"
                              : "text-[#94A3B8] group-hover:text-[#F8FAFC] group-hover:scale-105"
                          )}
                        />
                        {sidebarOpen && <span className="tracking-wide">{link.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Account Section */}
        <div className="border-t border-white/[0.07] p-3 bg-[#0A0F1E]">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2.5 bg-[#111726] border border-white/[0.08] transition-all hover:border-[#4F6BFF]/40 hover:shadow-lg",
              !sidebarOpen && "justify-center p-1 bg-transparent border-none"
            )}
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F6BFF] to-[#3B54E6] border border-white/[0.2] text-xs font-black text-white shadow-md">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-9 w-9 rounded-xl object-cover"
                />
              ) : user ? (
                getInitials(user.full_name)
              ) : (
                "?"
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#080C16]" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-xs font-bold text-[#F8FAFC]">
                  {user?.full_name ?? "Arsad Admin"}
                </span>
                <span className="truncate text-[10px] font-medium text-[#60A5FA]">
                  {user?.email ?? "arsad123@gmail.com"}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-2 flex items-center gap-1.5">
              <Link
                href="/app/settings"
                className="flex-1 text-center rounded-lg bg-white/[0.04] border border-white/[0.06] py-1.5 text-[11px] font-semibold text-[#94A3B8] transition-colors hover:bg-white/[0.08] hover:text-[#F8FAFC]"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 px-3 py-1.5 text-[11px] font-semibold text-[#EF4444] transition-colors hover:bg-[#EF4444]/20 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit</span>
              </button>
            </div>
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

