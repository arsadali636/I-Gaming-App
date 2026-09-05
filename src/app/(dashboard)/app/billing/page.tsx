"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ExternalLink,
  Receipt,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  created_at: string;
  invoice_url?: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/billing/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices ?? []);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const handleOpenPortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {}
  };

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Billing</h2>
          <p className="text-muted-foreground mt-1">
            Manage payment methods and view invoices
          </p>
        </div>
        <Button onClick={handleOpenPortal} variant="outline" className="gap-2">
          <ExternalLink size={14} /> Manage Billing
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <CreditCard size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Payment Method
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    Stripe Managed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Manage Billing&quot; to update payment methods
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <DollarSign size={22} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {formatCurrency(totalPaid / 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoices.filter((inv) => inv.status === "paid").length} invoice{invoices.filter((inv) => inv.status === "paid").length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt size={16} className="text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={40} className="mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-base font-medium text-foreground mb-1">No invoices yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Receipt size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {invoice.description ?? "Subscription Payment"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={10} />
                        {formatDate(invoice.created_at)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(invoice.amount / 100, invoice.currency)}
                      </p>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoice_url && (
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neon-cyan hover:underline shrink-0"
                      >
                        View
                      </a>
                    )}
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
