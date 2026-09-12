"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Users,
  Star,
  Award,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PlanFeature {
  id: string;
  feature_text: string;
  feature_description?: string;
  is_included: boolean;
}

interface PricingPlan {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  price: number;
  currency: string;
  billing_period: string;
  icon?: string;
  button_text: string;
  button_action: string;
  is_featured: boolean;
  is_popular: boolean;
  badge_text?: string;
  features: PlanFeature[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Star,
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
};

function AffiliatePricingContent() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAffiliatePlans() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/pricing/plans?category=affiliate-management");
        if (!res.ok) throw new Error("Failed to fetch affiliate management plans");
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load Affiliate Management pricing plans.");
      } finally {
        setLoading(false);
      }
    }
    fetchAffiliatePlans();
  }, []);

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Users className="h-6 w-6 text-[#818CF8]" />;
    const IconComp = iconMap[iconName] || Users;
    return <IconComp className="h-6 w-6 text-[#818CF8]" />;
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#818CF8]/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Breadcrumbs */}
          <nav className="flex items-center justify-center gap-2 text-xs font-semibold text-[#94A3B8] mb-6">
            <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <Link href="/directory-pricing" className="hover:text-[#F8FAFC] transition-colors">
              Pricing
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span className="text-[#818CF8]">Affiliate Management</span>
          </nav>

          {/* Title & Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 text-xs font-bold text-[#818CF8]">
              <Users className="h-3.5 w-3.5" />
              Dedicated Affiliate Growth Packages
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Affiliate Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#C084FC]">Pricing</span>
            </h1>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              Scale your affiliate program, track performance, and automate payouts with our specialized iGaming affiliate management packages.
            </p>
          </motion.div>
        </section>

        {/* ERROR STATE */}
        {error && (
          <div className="max-w-md mx-auto my-10 p-6 rounded-2xl bg-[#151C2C] border border-[#EF4444]/30 text-center space-y-4">
            <p className="text-sm font-semibold text-[#EF4444]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-white hover:bg-white/[0.1] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* PRICING CARDS GRID */}
        {!error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[520px] rounded-3xl bg-[#151C2C]" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 bg-[#151C2C] rounded-3xl border border-white/[0.08] space-y-3">
                <Users className="h-10 w-10 text-[#818CF8] mx-auto opacity-70" />
                <h3 className="text-lg font-bold text-white">No Affiliate Plans Found</h3>
                <p className="text-xs text-[#94A3B8]">
                  Please check back later or contact our team for custom affiliate management packages.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                {plans.map((plan, idx) => {
                  const isFeatured = plan.is_featured || plan.is_popular;
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.08 }}
                      className={cn(
                        "relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 group",
                        isFeatured
                          ? "bg-gradient-to-b from-[#1E1B4B] via-[#111726] to-[#0F1524] border-2 border-[#818CF8] shadow-[0_12px_45px_rgba(129,140,248,0.25)] scale-[1.02] z-10"
                          : "bg-[#151C2C] border border-white/[0.08] hover:border-white/[0.18] hover:shadow-2xl"
                      )}
                    >
                      {/* Badge */}
                      {plan.badge_text && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-[#6366F1]/40">
                            <Sparkles className="h-3 w-3" />
                            {plan.badge_text}
                          </span>
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Header */}
                        <div className="space-y-3 pt-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#818CF8] p-0.5 shadow-lg shadow-[#6366F1]/25">
                            <div className="w-full h-full bg-[#111726] rounded-[14px] flex items-center justify-center">
                              {renderIcon(plan.icon)}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-2xl font-black text-white group-hover:text-[#818CF8] transition-colors">
                              {plan.name}
                            </h3>
                            <p className="text-xs text-[#94A3B8] mt-1 font-medium">
                              {plan.short_description}
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="border-t border-b border-white/[0.06] py-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                              {plan.price > 0
                                ? `${plan.currency}${plan.price.toLocaleString()}`
                                : "Custom"}
                            </span>
                            {plan.price > 0 && (
                              <span className="text-xs font-semibold text-[#94A3B8]">
                                {plan.billing_period}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <Link
                          href={plan.button_action || "/register"}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold transition-all cursor-pointer shadow-md",
                            isFeatured
                              ? "bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white hover:shadow-lg hover:shadow-[#6366F1]/40 hover:scale-[1.02] active:scale-[0.98]"
                              : "bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.12]"
                          )}
                        >
                          <span>{plan.button_text || "Get Started"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        {/* Features List */}
                        <div className="space-y-3.5 pt-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                            Package Includes:
                          </p>
                          <ul className="space-y-2.5">
                            {plan.features.map((feature) => (
                              <li key={feature.id} className="flex items-start gap-2.5 text-xs">
                                {feature.is_included ? (
                                  <div className="mt-0.5 h-4 w-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center shrink-0">
                                    <Check className="h-3 w-3" />
                                  </div>
                                ) : (
                                  <div className="mt-0.5 h-4 w-4 rounded-full bg-white/[0.05] text-[#64748B] flex items-center justify-center shrink-0">
                                    <X className="h-3 w-3" />
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    feature.is_included
                                      ? "text-[#F8FAFC] font-medium"
                                      : "text-[#64748B] line-through"
                                  )}
                                >
                                  {feature.feature_text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* COMPARISON MATRIX TABLE */}
            {plans.length > 0 && (
              <div className="space-y-6 pt-20 max-w-7xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Affiliate Plan Comparison</h2>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Compare features across Basic, Professional, and Enterprise affiliate management tiers.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C] shadow-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-[#111726]">
                        <th className="p-4 sm:p-6 text-sm font-bold text-white">Feature Access</th>
                        {plans.map((p) => (
                          <th key={p.id} className="p-4 sm:p-6 text-center text-sm font-extrabold text-[#818CF8]">
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {Array.from(
                        new Set(plans.flatMap((p) => p.features.map((f) => f.feature_text)))
                      ).map((featureName, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-4 sm:p-5 font-semibold text-[#F8FAFC]">
                            {featureName}
                          </td>
                          {plans.map((p) => {
                            const hasFeature = p.features.find((f) => f.feature_text === featureName);
                            return (
                              <td key={p.id} className="p-4 sm:p-5 text-center">
                                {hasFeature ? (
                                  hasFeature.is_included ? (
                                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E]/15 text-[#22C55E]">
                                      <Check className="h-3.5 w-3.5" />
                                    </div>
                                  ) : (
                                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-[#64748B]">
                                      <X className="h-3.5 w-3.5" />
                                    </div>
                                  )
                                ) : (
                                  <span className="text-[#64748B]">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function AffiliatePricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
          <Skeleton className="h-12 w-48 bg-[#151C2C] rounded-2xl" />
        </div>
      }
    >
      <AffiliatePricingContent />
    </Suspense>
  );
}
