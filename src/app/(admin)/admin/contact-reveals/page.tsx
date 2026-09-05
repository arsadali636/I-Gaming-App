"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Eye, CreditCard, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface RevealRecord {
  id: string;
  user_id: string;
  company_contact_id: string;
  revealed_at: string;
  user?: { full_name: string; email: string } | null;
  company_contact?: {
    full_name: string;
    position: string;
    company?: { name: string } | null;
  } | null;
}

export default function AdminContactRevealsPage() {
  const [reveals, setReveals] = useState<RevealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, creditsUsed: 0 });

  const fetchReveals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/credits?${params}`);
      const data = await res.json();
      setReveals(data.transactions || []);
      setStats({
        total: data.pagination?.total ?? 0,
        thisMonth: 0,
        creditsUsed: 0,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchReveals();
  }, [fetchReveals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Contact Reveal Monitoring
        </h1>
        <p className="text-muted-foreground mt-1">
          Track contact reveals across the platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reveals</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.thisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15">
                <CreditCard className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.creditsUsed.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reveals.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No contact reveals found</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Contact Revealed
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Credits Used
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reveals.map((reveal) => (
                      <tr
                        key={reveal.id}
                        className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-foreground">
                            {reveal.user?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reveal.user?.email ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-foreground">
                            {reveal.company_contact?.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reveal.company_contact?.position ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {reveal.company_contact?.company?.name ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">1 credit</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(reveal.revealed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {reveals.map((reveal) => (
                  <div
                    key={reveal.id}
                    className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {reveal.user?.full_name ?? "Unknown"}
                      </p>
                      <Badge variant="outline">1 credit</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Revealed: {reveal.company_contact?.full_name ?? "—"} at{" "}
                      {reveal.company_contact?.company?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reveal.revealed_at)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
