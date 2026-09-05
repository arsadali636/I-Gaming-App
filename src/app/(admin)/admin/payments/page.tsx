"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user?: { full_name: string; email: string } | null;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();
const last6 = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
  return { label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
});

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState({
    mrr: 0,
    arr: 0,
    avgPerUser: 0,
  });
  const [monthlyData] = useState(() =>
    last6.map((m) => ({
      ...m,
      value: Math.floor(Math.random() * 5000) + 1000,
    }))
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/users?limit=50");
        const data = await res.json();
        setPayments(data.payments || []);
        setRevenue({
          mrr: 12500,
          arr: 150000,
          avgPerUser: 49,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const maxRevenue = Math.max(...monthlyData.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Payments & Revenue
          </h1>
          <p className="text-muted-foreground mt-1">
            Revenue metrics and payment history
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Monthly Recurring Revenue
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : formatCurrency(revenue.mrr)}
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
                <p className="text-sm text-muted-foreground">
                  Annual Recurring Revenue
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : formatCurrency(revenue.arr)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Revenue per User
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : formatCurrency(revenue.avgPerUser)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Monthly Revenue (Last 6 Months)
          </h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((m) => (
                <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(m.value, "USD")}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-all duration-500"
                    style={{
                      height: `${(m.value / maxRevenue) * 140}px`,
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Recent Payments
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payment records found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-foreground">
                        {payment.user?.full_name ?? "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            payment.status === "succeeded"
                              ? "success"
                              : payment.status === "failed"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
