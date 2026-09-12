"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  Users,
  MessageSquare,
  Briefcase,
  Eye,
  Contact,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  companiesViewed: number;
  contactsRevealed: number;
  connections: number;
  messages: number;
  opportunities: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

const statCards = [
  {
    key: "credits",
    label: "Contact Credits Remaining",
    icon: Contact,
    meta: "Live Balance",
    trend: "Active Plan",
    iconBg: "from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA]",
    glow: "shadow-[0_0_20px_rgba(79,107,255,0.45)]",
    cardBorder: "hover:border-[#4F6BFF]/60 hover:shadow-[0_12px_36px_rgba(79,107,255,0.2)]",
  },
  {
    key: "companiesViewed",
    label: "Companies Viewed",
    icon: Eye,
    meta: "Marketplace Insights",
    trend: "+14.2% this month",
    iconBg: "from-[#38BDF8] via-[#0284C7] to-[#60A5FA]",
    glow: "shadow-[0_0_20px_rgba(56,189,248,0.45)]",
    cardBorder: "hover:border-[#38BDF8]/60 hover:shadow-[0_12px_36px_rgba(56,189,248,0.2)]",
  },
  {
    key: "contactsRevealed",
    label: "Contacts Revealed",
    icon: TrendingUp,
    meta: "Unlocked Profiles",
    trend: "Verified Direct Access",
    iconBg: "from-[#818CF8] via-[#6366F1] to-[#A78BFA]",
    glow: "shadow-[0_0_20px_rgba(129,140,248,0.45)]",
    cardBorder: "hover:border-[#818CF8]/60 hover:shadow-[0_12px_36px_rgba(129,140,248,0.2)]",
  },
  {
    key: "connections",
    label: "Connections",
    icon: Users,
    meta: "B2B Network",
    trend: "Active Partners",
    iconBg: "from-[#22D3EE] via-[#0891B2] to-[#38BDF8]",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.45)]",
    cardBorder: "hover:border-[#22D3EE]/60 hover:shadow-[0_12px_36px_rgba(34,211,238,0.2)]",
  },
  {
    key: "messages",
    label: "Messages",
    icon: MessageSquare,
    meta: "Direct Discussions",
    trend: "0 Unread",
    iconBg: "from-[#C084FC] via-[#9333EA] to-[#E879F9]",
    glow: "shadow-[0_0_20px_rgba(192,132,252,0.45)]",
    cardBorder: "hover:border-[#C084FC]/60 hover:shadow-[0_12px_36px_rgba(192,132,252,0.2)]",
  },
  {
    key: "opportunities",
    label: "Business Opportunities",
    icon: Briefcase,
    meta: "High Value Deals",
    trend: "Market Opportunities",
    iconBg: "from-[#34D399] via-[#059669] to-[#10B981]",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.45)]",
    cardBorder: "hover:border-[#34D399]/60 hover:shadow-[0_12px_36px_rgba(52,211,153,0.2)]",
  },
];

const quickActions = [
  {
    label: "Browse Marketplace",
    description: "Discover verified iGaming operators, affiliates & providers.",
    href: "/app/marketplace",
    icon: Store,
    gradient: "from-[#4F6BFF] to-[#3B54E6]",
    glow: "shadow-[0_0_15px_rgba(79,107,255,0.3)]",
  },
  {
    label: "View Contacts",
    description: "Manage and reach out to your unlocked B2B decision makers.",
    href: "/app/contacts",
    icon: Users,
    gradient: "from-[#0284C7] to-[#38BDF8]",
    glow: "shadow-[0_0_15px_rgba(56,189,248,0.3)]",
  },
  {
    label: "Messages & Deals",
    description: "Connect instantly with your saved business connections.",
    href: "/app/messages",
    icon: MessageSquare,
    gradient: "from-[#9333EA] to-[#C084FC]",
    glow: "shadow-[0_0_15px_rgba(192,132,252,0.3)]",
  },
];

export default function DashboardHomePage() {
  const { user, wallet } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        setStats({
          companiesViewed: 0,
          contactsRevealed: 0,
          connections: 0,
          messages: 0,
          opportunities: 0,
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const getMetricValue = (key: string) => {
    if (key === "credits") return wallet?.balance ?? 0;
    if (key === "contactsRevealed") return stats?.contactsRevealed ?? 0;
    if (key === "companiesViewed") return stats?.companiesViewed ?? 0;
    if (key === "connections") return stats?.connections ?? 0;
    if (key === "messages") return stats?.messages ?? 0;
    return stats?.opportunities ?? 0;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-gradient-to-r from-[#172036] via-[#111726] to-[#151C2D] border border-white/[0.09] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-[#4F6BFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F6BFF]/15 border border-[#4F6BFF]/30 text-xs font-bold text-[#60A5FA]">
              <span className="h-2 w-2 rounded-full bg-[#60A5FA] animate-pulse" />
              GLOBAL B2B NETWORK • LIVE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-[#94A3B8]">
              Verified Enterprise Tier
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F8FAFC]">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "Arsad"} 👋
          </h2>
          <p className="text-[#94A3B8] text-sm max-w-xl">
            Here's what's happening across your iGaming network today. Access verified business leads, opportunities, and messages in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/app/marketplace"
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] px-5 py-3 text-xs font-extrabold text-white shadow-[0_0_25px_rgba(79,107,255,0.4)] hover:shadow-[0_0_35px_rgba(79,107,255,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Store className="h-4.5 w-4.5" />
            <span>Explore Marketplace</span>
          </Link>
          <Link
            href="/app/contacts"
            className="flex items-center gap-2 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-xs font-bold text-[#F8FAFC] hover:bg-white/[0.1] transition-all cursor-pointer"
          >
            <Contact className="h-4.5 w-4.5 text-[#60A5FA]" />
            <span>My Contacts</span>
          </Link>
        </div>
      </motion.div>

      {/* 6 SaaS Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <div className={`bg-gradient-to-b from-[#182137] to-[#0F1524] border border-white/[0.09] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${stat.cardBorder} transition-all duration-300 relative overflow-hidden group`}>
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-[#94A3B8]">
                    {stat.label}
                  </p>
                  {loading ? (
                    <Skeleton className="h-10 w-24 bg-[#1A2235] rounded-xl" />
                  ) : (
                    <div>
                      <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getMetricValue(stat.key)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-[#60A5FA]">
                          {stat.meta}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          • {stat.trend}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Glowing Gradient Icon Container */}
                <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${stat.iconBg} p-0.5 ${stat.glow} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                  <div className="w-full h-full bg-[#0F1524] rounded-[14px] flex items-center justify-center text-white">
                    <stat.icon size={22} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured B2B Offers Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-gradient-to-b from-[#182137] to-[#0F1524] border border-white/[0.09] rounded-3xl p-6 sm:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.4)] space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#34D399]/20 to-[#059669]/20 border border-[#34D399]/30 text-[#34D399]">
              <Store size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#F8FAFC]">Featured B2B Offers & Deals</h3>
              <p className="text-xs text-[#94A3B8]">Direct CPA & RevShare campaigns from verified operators</p>
            </div>
          </div>
          <Link
            href="/app/offers"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#60A5FA] hover:text-[#4F6BFF] transition-colors"
          >
            <span>View All Offers</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <FeaturedOffersWidget />
      </motion.div>

      {/* Main Content Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-gradient-to-b from-[#182137] to-[#0F1524] border border-white/[0.09] rounded-3xl p-6 sm:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.4)] space-y-6 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <h3 className="text-base font-extrabold text-[#F8FAFC] flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#4F6BFF]/20 to-[#3B54E6]/20 border border-[#4F6BFF]/30 text-[#60A5FA]">
                  <Clock size={18} />
                </div>
                Network Activity Feed
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] text-[11px] font-bold text-[#60A5FA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Real-time
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2 flex-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-[#1A2235] rounded-2xl" />
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3 flex-1">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 rounded-2xl p-3.5 bg-[#111726] border border-white/[0.05] transition-all hover:border-white/[0.12] hover:bg-white/[0.03]"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#60A5FA] shrink-0 shadow-[0_0_10px_#60A5FA]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#F8FAFC] truncate">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#182137] to-[#111726] border border-white/[0.12] flex items-center justify-center text-[#60A5FA] shadow-2xl">
                  <Clock size={32} className="opacity-90 drop-shadow-[0_0_10px_#60A5FA]" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#F8FAFC]">
                    No recent activity yet
                  </p>
                  <p className="text-xs text-[#94A3B8] max-w-sm mt-1 leading-relaxed">
                    Explore the marketplace, view verified contacts, or connect with key iGaming partners to populate your feed.
                  </p>
                </div>
                <Link
                  href="/app/marketplace"
                  className="mt-2 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-[#4F6BFF]/40 transition-all cursor-pointer"
                >
                  <span>Browse Marketplace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="bg-gradient-to-b from-[#182137] to-[#0F1524] border border-white/[0.09] rounded-3xl p-6 sm:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.4)] space-y-6 h-full flex flex-col justify-between">
            <div className="border-b border-white/[0.07] pb-4">
              <h3 className="text-base font-extrabold text-[#F8FAFC]">Quick Actions</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Key platform tools to streamline your B2B networking.
              </p>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-4 rounded-2xl p-4 bg-[#111726] border border-white/[0.06] transition-all duration-200 hover:border-[#4F6BFF]/60 hover:bg-[#172036] hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} p-0.5 ${action.glow} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                    <div className="w-full h-full bg-[#111726] rounded-[14px] flex items-center justify-center text-white">
                      <action.icon size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] group-hover:text-[#60A5FA] transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] group-hover:text-white group-hover:bg-[#4F6BFF] transition-all">
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeaturedOffersWidget() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedOffers() {
      try {
        const res = await fetch("/api/offers?status=active&limit=3");
        if (res.ok) {
          const data = await res.json();
          setOffers(data.offers || []);
        }
      } catch (err) {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedOffers();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl bg-[#1A2235]" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-6 bg-[#111726] rounded-2xl border border-white/[0.04] text-xs text-[#94A3B8]">
        No active offers currently featured.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {offers.map((offer) => (
        <Link
          key={offer.id}
          href={`/app/offers/${offer.slug}`}
          className="group flex flex-col justify-between p-4 rounded-2xl bg-[#111726] border border-white/[0.06] hover:border-[#4F6BFF]/50 transition-all space-y-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-[#34D399]/20 text-[#34D399] text-[10px] font-black">
                {offer.payout_type}: {offer.currency}{offer.payout}
              </span>
              <span className="text-[10px] font-semibold text-[#60A5FA]">
                {offer.geo || "Global"}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#60A5FA] transition-colors">
              {offer.title}
            </h4>
            <p className="text-[11px] text-[#94A3B8] line-clamp-2">
              {offer.description}
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] pt-2 border-t border-white/[0.04]">
            <span>{offer.company_name || offer.brand || "Verified Operator"}</span>
            <span className="text-[#60A5FA] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View Deal</span>
              <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}


