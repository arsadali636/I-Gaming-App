"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Flag,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  companies: { total: number; pending: number; approved: number; suspended: number };
  activeSubscriptions: number;
  revenueThisMonth: number;
  pendingVerifications: number;
  openReports: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user?: { full_name: string } | null;
}

const statCards = [
  { key: "totalUsers" as const, label: "Total Users", icon: Users, color: "from-primary to-primary/50" },
  { key: "companies" as const, label: "Total Companies", icon: Building2, color: "from-secondary to-secondary/50" },
  { key: "activeSubscriptions" as const, label: "Active Subscriptions", icon: CreditCard, color: "from-accent to-accent/50" },
  { key: "revenueThisMonth" as const, label: "Revenue This Month", icon: DollarSign, color: "from-green-500 to-green-600" },
  { key: "pendingVerifications" as const, label: "Pending Verifications", icon: ShieldCheck, color: "from-yellow-500 to-yellow-600" },
  { key: "openReports" as const, label: "Open Reports", icon: Flag, color: "from-destructive to-destructive/50" },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, companiesRes, verificationRes, reportsRes, auditRes] =
          await Promise.all([
            fetch("/api/admin/users?limit=1"),
            fetch("/api/admin/companies?limit=1"),
            fetch("/api/admin/verification?status=pending&limit=1"),
            fetch("/api/admin/reports?status=pending&limit=1"),
            fetch("/api/admin/audit?limit=10"),
          ]);

        const usersData = await usersRes.json();
        const companiesData = await companiesRes.json();
        const verificationData = await verificationRes.json();
        const reportsData = await reportsRes.json();
        const auditData = await auditRes.json();

        const companies = companiesData.companies || [];
        const pending = companies.filter(
          (c: { status: string }) => c.status === "pending"
        ).length;
        const approved = companies.filter(
          (c: { status: string }) => c.status === "approved"
        ).length;
        const suspended = companies.filter(
          (c: { status: string }) => c.status === "suspended"
        ).length;

        setStats({
          totalUsers: usersData.pagination?.total ?? 0,
          companies: {
            total: companiesData.pagination?.total ?? 0,
            pending,
            approved,
            suspended,
          },
          activeSubscriptions: 0,
          revenueThisMonth: 0,
          pendingVerifications: verificationData.pagination?.total ?? 0,
          openReports: reportsData.pagination?.total ?? 0,
        });

        setActivity(auditData.logs || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function getStatValue(key: string) {
    if (!stats) return "";
    switch (key) {
      case "totalUsers":
        return stats.totalUsers.toLocaleString();
      case "companies":
        return stats.companies.total.toLocaleString();
      case "activeSubscriptions":
        return stats.activeSubscriptions.toLocaleString();
      case "revenueThisMonth":
        return formatCurrency(stats.revenueThisMonth);
      case "pendingVerifications":
        return stats.pendingVerifications.toLocaleString();
      case "openReports":
        return stats.openReports.toLocaleString();
      default:
        return "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and key metrics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {getStatValue(stat.key)}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.companies && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Company Status Breakdown
            </h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                <Badge variant="success">
                  Approved: {stats.companies.approved}
                </Badge>
                <Badge variant="warning">
                  Pending: {stats.companies.pending}
                </Badge>
                <Badge variant="destructive">
                  Suspended: {stats.companies.suspended}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-glass-bg/30 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {item.user?.full_name ?? "System"}{" "}
                        <span className="text-muted-foreground">
                          {item.action.replace(/_/g, " ")}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {item.entity_type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
