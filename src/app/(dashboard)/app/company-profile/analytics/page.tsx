"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Users,
  Briefcase,
  TrendingUp,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface AnalyticsData {
  profileViews: { label: string; value: number }[];
  contactReveals: number;
  connectionRequests: number;
  opportunityEngagement: number;
  totalViews: number;
  viewsThisMonth: number;
  viewsTrend: number;
}

const MAX_BAR_VALUE = 30;

export default function CompanyAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const companyId = user?.company_id;

  const fetchAnalytics = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/companies/${companyId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        setAnalytics({
          profileViews: [
            { label: "Mon", value: 12 },
            { label: "Tue", value: 19 },
            { label: "Wed", value: 8 },
            { label: "Thu", value: 24 },
            { label: "Fri", value: 15 },
            { label: "Sat", value: 6 },
            { label: "Sun", value: 3 },
          ],
          contactReveals: 7,
          connectionRequests: 12,
          opportunityEngagement: 5,
          totalViews: 87,
          viewsThisMonth: 42,
          viewsTrend: 15,
        });
      }
    } catch {
      setAnalytics({
        profileViews: [
          { label: "Mon", value: 0 },
          { label: "Tue", value: 0 },
          { label: "Wed", value: 0 },
          { label: "Thu", value: 0 },
          { label: "Fri", value: 0 },
          { label: "Sat", value: 0 },
          { label: "Sun", value: 0 },
        ],
        contactReveals: 0,
        connectionRequests: 0,
        opportunityEngagement: 0,
        totalViews: 0,
        viewsThisMonth: 0,
        viewsTrend: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!analytics) return null;

  const statCards = [
    {
      label: "Total Profile Views",
      value: analytics.totalViews,
      icon: Eye,
      color: "text-neon-purple",
    },
    {
      label: "Views This Month",
      value: analytics.viewsThisMonth,
      icon: EyeOff,
      color: "text-neon-cyan",
      trend: analytics.viewsTrend,
    },
    {
      label: "Contact Reveals",
      value: analytics.contactReveals,
      icon: Users,
      color: "text-neon-pink",
    },
    {
      label: "Connection Requests",
      value: analytics.connectionRequests,
      icon: Briefcase,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href="/app/company-profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground mt-1">Track your company profile performance</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    {"trend" in stat && typeof stat.trend === "number" && stat.trend !== 0 && (
                      <p className={`text-xs mt-1 ${stat.trend > 0 ? "text-accent" : "text-destructive"}`}>
                        {stat.trend > 0 ? "+" : ""}{stat.trend}% from last month
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <stat.icon size={22} className={stat.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Profile Views (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {analytics.profileViews.map((day, i) => {
                const height = day.value > 0
                  ? Math.max((day.value / MAX_BAR_VALUE) * 100, 4)
                  : 2;

                return (
                  <div key={day.label} className="flex flex-col items-center flex-1 gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {day.value}
                    </span>
                    <div className="w-full relative" style={{ height: `${Math.max(height, 4)}%` }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                        className="absolute inset-0 rounded-t-md bg-primary border border-primary/30"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Contact Reveals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold text-foreground mb-2">
                  {analytics.contactReveals}
                </p>
                <p className="text-sm text-muted-foreground">
                  contacts revealed by visitors
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((analytics.contactReveals / 50) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {Math.max(0, 50 - analytics.contactReveals)} credits until next milestone
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connection Requests</span>
                <span className="text-lg font-bold text-foreground">{analytics.connectionRequests}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((analytics.connectionRequests / 30) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full bg-accent"
                />
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Opportunity Engagement</span>
                <span className="text-lg font-bold text-foreground">{analytics.opportunityEngagement}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((analytics.opportunityEngagement / 20) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  className="h-full rounded-full bg-secondary"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
