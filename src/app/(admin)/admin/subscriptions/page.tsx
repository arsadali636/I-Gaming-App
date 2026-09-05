"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  user?: { full_name: string; email: string } | null;
  plans?: { name: string; price: number; credits: number } | null;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  active: "success",
  canceled: "destructive",
  past_due: "warning",
  trialing: "default",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [viewSub, setViewSub] = useState<Subscription | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Subscription Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage user subscriptions
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
              <option value="trialing">Trialing</option>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No subscriptions found</p>
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
                        Plan
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Period
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Credits
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-foreground">
                            {sub.user?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sub.user?.email ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {sub.plans?.name ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant[sub.status] || "default"}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {sub.current_period_end
                            ? formatDate(sub.current_period_end)
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {sub.plans?.credits ?? 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(sub.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewSub(sub)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {sub.user?.full_name ?? "Unknown"}
                      </p>
                      <Badge variant={statusVariant[sub.status] || "default"}>
                        {sub.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{sub.plans?.name ?? "—"} plan</span>
                      <span>{sub.plans?.credits ?? 0} credits</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(sub.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewSub(sub)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewSub} onOpenChange={() => setViewSub(null)}>
        <DialogContent onClose={() => setViewSub(null)}>
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Subscription for {viewSub?.user?.full_name}
            </DialogDescription>
          </DialogHeader>
          {viewSub && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <p className="text-foreground">
                    {viewSub.plans?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Price</span>
                  <p className="text-foreground">
                    {viewSub.plans?.price
                      ? formatCurrency(viewSub.plans.price)
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p>
                    <Badge
                      variant={statusVariant[viewSub.status] || "default"}
                    >
                      {viewSub.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Credits</span>
                  <p className="text-foreground">
                    {viewSub.plans?.credits ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Created</span>
                  <p className="text-foreground">
                    {formatDate(viewSub.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Period End
                  </span>
                  <p className="text-foreground">
                    {viewSub.current_period_end
                      ? formatDate(viewSub.current_period_end)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
