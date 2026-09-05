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
  { key: "credits", label: "Contact Credits Remaining", icon: Contact, color: "text-neon-cyan" },
  { key: "companiesViewed", label: "Companies Viewed", icon: Eye, color: "text-neon-purple" },
  { key: "contactsRevealed", label: "Contacts Revealed", icon: TrendingUp, color: "text-neon-pink" },
  { key: "connections", label: "Connections", icon: Users, color: "text-accent" },
  { key: "messages", label: "Messages", icon: MessageSquare, color: "text-secondary" },
  { key: "opportunities", label: "Business Opportunities", icon: Briefcase, color: "text-yellow-400" },
];

const quickActions = [
  { label: "Browse Marketplace", href: "/app/marketplace", icon: Store, color: "from-neon-purple to-neon-cyan" },
  { label: "View Contacts", href: "/app/contacts", icon: Users, color: "from-neon-pink to-neon-purple" },
  { label: "Messages", href: "/app/messages", icon: MessageSquare, color: "from-neon-cyan to-accent" },
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

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your account.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <Card className="group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">
                        {stat.key === "credits"
                          ? (wallet?.balance ?? 0)
                          : stat.key === "contactsRevealed"
                            ? (stats?.contactsRevealed ?? 0)
                            : stat.key === "companiesViewed"
                              ? (stats?.companiesViewed ?? 0)
                              : stat.key === "connections"
                                ? (stats?.connections ?? 0)
                                : stat.key === "messages"
                                  ? (stats?.messages ?? 0)
                                  : (stats?.opportunities ?? 0)}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover:bg-primary/20 ${stat.color}`}
                  >
                    <stat.icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                    >
                      <div className="w-2 h-2 rounded-full bg-neon-cyan shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No recent activity yet. Start exploring!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/5 group"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}
                    >
                      <action.icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {action.label}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:text-foreground transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
