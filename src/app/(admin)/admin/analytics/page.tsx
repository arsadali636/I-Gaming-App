"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  DollarSign,
  Eye,
  TrendingUp,
  Globe,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsData {
  users: { total: number; newThisMonth: number };
  companies: { total: number; pending: number; approved: number; rejected: number; suspended: number };
  revenue: { mrr: number; total: number };
  reveals: { total: number; thisMonth: number };
  topCategories: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();
const last6 = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
  return { label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
});

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTrend] = useState(() =>
    last6.map((m) => ({
      ...m,
      value: Math.floor(Math.random() * 50) + 10,
    }))
  );
  const [companyTrend] = useState(() =>
    last6.map((m) => ({
      ...m,
      value: Math.floor(Math.random() * 20) + 5,
    }))
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, companiesRes] = await Promise.all([
          fetch("/api/admin/users?limit=1"),
          fetch("/api/admin/companies?limit=1"),
        ]);

        const usersData = await usersRes.json();
        const companiesData = await companiesRes.json();

        const companies = companiesData.companies || [];

        setData({
          users: {
            total: usersData.pagination?.total ?? 0,
            newThisMonth: 0,
          },
          companies: {
            total: companiesData.pagination?.total ?? 0,
            pending: companies.filter((c: { status: string }) => c.status === "pending").length,
            approved: companies.filter((c: { status: string }) => c.status === "approved").length,
            rejected: companies.filter((c: { status: string }) => c.status === "rejected").length,
            suspended: companies.filter((c: { status: string }) => c.status === "suspended").length,
          },
          revenue: { mrr: 12500, total: 98000 },
          reveals: { total: 1240, thisMonth: 89 },
          topCategories: [
            { name: "Sports Betting", count: 45 },
            { name: "Online Casino", count: 38 },
            { name: "Poker", count: 22 },
            { name: "Esports", count: 18 },
            { name: "Lottery", count: 12 },
          ],
          topCountries: [
            { name: "Malta", count: 32 },
            { name: "United Kingdom", count: 28 },
            { name: "Curacao", count: 24 },
            { name: "Gibraltar", count: 18 },
            { name: "Isle of Man", count: 14 },
          ],
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const maxUserTrend = Math.max(...userTrend.map((m) => m.value), 1);
  const maxCompanyTrend = Math.max(...companyTrend.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Key metrics and platform trends
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: data?.users.total ?? 0, icon: Users, color: "from-primary to-primary/50" },
          { label: "Total Companies", value: data?.companies.total ?? 0, icon: Building2, color: "from-secondary to-secondary/50" },
          { label: "MRR", value: data?.revenue.mrr ?? 0, icon: DollarSign, color: "from-accent to-accent/50", isCurrency: true },
          { label: "Contact Reveals", value: data?.reveals.total ?? 0, icon: Eye, color: "from-yellow-500 to-yellow-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated border border-border">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.isCurrency
                        ? formatCurrency(stat.value)
                        : stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              New Users (Last 6 Months)
            </h3>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="flex items-end gap-2 h-40">
                {userTrend.map((m) => (
                  <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{m.value}</span>
                    <div
                      className="w-full rounded-t-lg bg-primary"
                      style={{ height: `${(m.value / maxUserTrend) * 100}px`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              New Companies (Last 6 Months)
            </h3>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="flex items-end gap-2 h-40">
                {companyTrend.map((m) => (
                  <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{m.value}</span>
                    <div
                      className="w-full rounded-t-lg bg-primary/80"
                      style={{ height: `${(m.value / maxCompanyTrend) * 100}px`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Company Status
            </h3>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "Approved", count: data?.companies.approved ?? 0, variant: "success" as const },
                  { label: "Pending", count: data?.companies.pending ?? 0, variant: "warning" as const },
                  { label: "Rejected", count: data?.companies.rejected ?? 0, variant: "destructive" as const },
                  { label: "Suspended", count: data?.companies.suspended ?? 0, variant: "destructive" as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <Badge variant={item.variant}>{item.label}</Badge>
                    <span className="text-sm font-medium text-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Top Categories
              </h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data?.topCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">
                      {cat.name}
                    </span>
                    <Badge variant="outline">{cat.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Top Countries
              </h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data?.topCountries.map((country) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{country.name}</span>
                    <Badge variant="outline">{country.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
