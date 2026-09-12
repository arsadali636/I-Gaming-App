"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Check,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface PlanInfo {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
}

interface SubscriptionInfo {
  id: string;
  plan: PlanInfo;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const PLANS = [
  {
    name: "Starter",
    credits: 25,
    price: 49,
    features: ["25 contact reveals/month", "Basic search", "Email support"],
  },
  {
    name: "Professional",
    credits: 100,
    price: 149,
    features: ["100 contact reveals/month", "Advanced filters", "Priority support", "API access"],
    popular: true,
  },
  {
    name: "Enterprise",
    credits: 500,
    price: 499,
    features: ["500 contact reveals/month", "Unlimited search", "Dedicated support", "Custom integrations", "Team accounts"],
  },
];

export default function SubscriptionPage() {
  const { wallet, refreshWallet } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, txRes] = await Promise.allSettled([
          fetch("/api/subscription").then(r => r.ok ? r.json() : null),
          apiClient.get<any>("/api/v1/credits/history/"),
        ]);
        
        if (subRes.status === "fulfilled" && subRes.value) {
          setSubscription(subRes.value.subscription ?? null);
        }
        if (txRes.status === "fulfilled" && txRes.value) {
          const list = Array.isArray(txRes.value) ? txRes.value : txRes.value.results ?? [];
          setTransactions(list);
        }
        if (refreshWallet) {
          refreshWallet();
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshWallet]);

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {}
  };

  const totalCredits = subscription?.plan.credits ?? 0;
  const usedCredits = wallet ? wallet.total_used : 0;
  const usagePercent = totalCredits > 0 ? Math.min((usedCredits / totalCredits) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Subscription</h2>
        <p className="text-muted-foreground mt-1">Manage your plan and credits</p>
      </motion.div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current Plan
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {subscription?.plan.name ?? "Free"}
                    </h3>
                    <Badge variant={subscription?.status === "active" ? "success" : "outline"}>
                      {subscription?.status ?? "none"}
                    </Badge>
                  </div>
                  {subscription?.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Renews {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Credits Usage
                  </p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-foreground">
                      {wallet?.balance ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground mb-0.5">
                      / {totalCredits} remaining
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {usedCredits} credits used this period
                  </p>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleManageSubscription} className="gap-2">
                    <CreditCard size={16} /> Manage Subscription
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Plans */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Upgrade Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => {
            const isCurrent = subscription?.plan.name === plan.name;
            return (
              <Card
                key={plan.name}
                className={`relative hover:border-primary/30 transition-all ${
                  plan.popular ? "border-primary/40 shadow-[0_0_20px_rgba(108,92,231,0.1)]" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Zap size={10} /> Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                  <div className="flex items-end gap-1 mt-2 mb-4">
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-sm text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.credits} contact credits/month
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check size={14} className="text-accent shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button variant={plan.popular ? "default" : "outline"} className="w-full gap-2">
                      <ArrowUpRight size={14} /> Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Credit Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "credit" || tx.type === "bonus" || tx.type === "refund"
                          ? "text-accent"
                          : "text-destructive"
                      }`}
                    >
                      {tx.type === "credit" || tx.type === "bonus" || tx.type === "refund" ? "+" : "-"}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
