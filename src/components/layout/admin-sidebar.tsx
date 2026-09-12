"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Shield,
  Eye,
  CreditCard,
  DollarSign,
  Star,
  Flag,
  BarChart3,
  Settings,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/business-roles", label: "Business Roles", icon: Shield },
  { href: "/admin/company-sizes", label: "Company Sizes", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/master-data", label: "Master Data", icon: Shield },
  { href: "/admin/pricing", label: "Pricing Management", icon: DollarSign },
  { href: "/admin/offers", label: "Offers Management", icon: Tag },
  { href: "/admin/news", label: "News Management", icon: Newspaper },
  { href: "/admin/events", label: "Events Management", icon: Calendar },
  { href: "/admin/verification", label: "Verification", icon: Shield },
  { href: "/admin/contact-reveals", label: "Contact Reveals", icon: Eye },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: DollarSign },
  { href: "/admin/featured", label: "Featured", icon: Star },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#0D101C] border-r border-[#252A3A] transition-all duration-200",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#252A3A] px-4">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 overflow-hidden transition-all",
              !sidebarOpen && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F46E5]">
              <span className="text-sm font-bold text-white">iG</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-[#F8FAFC] text-lg font-bold tracking-tight whitespace-nowrap">
                  iGaming Connect
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#22C1DC]">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-[#A1A9B8] transition-colors hover:bg-[#111522] hover:text-[#F8FAFC] lg:flex cursor-pointer"
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
            {adminLinks.map((link) => {
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[rgba(79,70,229,0.12)] text-[#F8FAFC] font-semibold"
                        : "text-[#A1A9B8] hover:bg-[#111522] hover:text-[#F8FAFC]",
                      !sidebarOpen && "justify-center px-0"
                    )}
                    title={!sidebarOpen ? link.label : undefined}
                  >
                    <link.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-[#4F46E5]"
                          : "text-[#A1A9B8] group-hover:text-[#F8FAFC]"
                      )}
                    />
                    {sidebarOpen && <span>{link.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#252A3A] p-3 bg-[#090B14]">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171B2B] border border-[#252A3A] text-xs font-semibold text-[#4F46E5]">
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
                <span className="truncate text-sm font-medium text-[#F8FAFC]">
                  {user?.full_name ?? "Admin"}
                </span>
                <span className="truncate text-xs text-[#A1A9B8]">
                  {user?.email ?? ""}
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/10 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-200",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      />
    </>
  );
}

