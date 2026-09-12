"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Crown,
  Layers,
  Zap,
  Server,
  Cpu,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Star,
  Award,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PricingCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: number;
  show_on_public_page: number;
  is_plus_layout: number;
}

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

interface PlusBenefit {
  id: string;
  title: string;
  description: string;
  display_order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  Sparkles,
  Crown,
  Zap,
  Server,
  Cpu,
  ShieldCheck,
  Star,
  Award,
};

function DirectoryPricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PricingCategory | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plusBenefits, setPlusBenefits] = useState<PlusBenefit[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        setError(null);
        const res = await fetch("/api/pricing/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        const activeCats: PricingCategory[] = data.categories || [];
        setCategories(activeCats);

        if (activeCats.length > 0) {
          const categoryQuery = searchParams.get("category");
          const found = activeCats.find((c) => c.slug === categoryQuery) || activeCats[0];
          setSelectedCategory(found);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load pricing categories. Please try again.");
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [searchParams]);

  // 2. Fetch plans & plus benefits when selected category changes
  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchCategoryData() {
      try {
        setLoadingPlans(true);
        setError(null);

        if (selectedCategory?.is_plus_layout) {
          const res = await fetch("/api/pricing/plus-benefits");
          if (res.ok) {
            const data = await res.json();
            setPlusBenefits(data.benefits || []);
          }
        }

        const plansRes = await fetch(`/api/pricing/plans?category=${selectedCategory?.slug}`);
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load pricing details.");
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchCategoryData();
  }, [selectedCategory]);

  const handleTabChange = (cat: PricingCategory) => {
    setSelectedCategory(cat);
    router.push(`/directory-pricing?category=${cat.slug}`, { scroll: false });
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Sparkles className="h-6 w-6 text-[#60A5FA]" />;
    const IconComp = iconMap[iconName] || Sparkles;
    return <IconComp className="h-6 w-6 text-[#60A5FA]" />;
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4F6BFF]/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Breadcrumbs */}
          <nav className="flex items-center justify-center gap-2 text-xs font-semibold text-[#94A3B8] mb-6">
            <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span className="text-[#60A5FA]">Directory Pricing</span>
          </nav>

          {/* Main Title & Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 text-xs font-bold text-[#60A5FA]">
              <Sparkles className="h-3.5 w-3.5" />
              Transparent & Flexible B2B Packages
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Directory <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#818CF8]">Pricing</span>
            </h1>
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              {selectedCategory?.description ||
                "Choose the right visibility and partnership package for your business across our global iGaming B2B network."}
            </p>
          </motion.div>

          {/* DYNAMIC CATEGORY TABS */}
          <div className="mt-10 flex justify-center">
            {loadingCategories ? (
              <div className="flex gap-2 bg-[#0D1220] p-1.5 rounded-full border border-[#252A3A]">
                <Skeleton className="h-10 w-28 rounded-full bg-[#151C2C]" />
                <Skeleton className="h-10 w-32 rounded-full bg-[#151C2C]" />
                <Skeleton className="h-10 w-24 rounded-full bg-[#151C2C]" />
              </div>
            ) : (
              <div className="inline-flex flex-wrap justify-center gap-2 bg-[#0D1220]/90 p-2 rounded-full border border-[#252A3A]/80 shadow-2xl backdrop-blur-xl">
                {categories.map((cat) => {
                  const isActive = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleTabChange(cat)}
                      className={cn(
                        "rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2",
                        isActive
                          ? cat.is_plus_layout
                            ? "bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-white shadow-lg shadow-[#4F6BFF]/30 scale-105"
                            : "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/25 scale-105"
                          : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {cat.is_plus_layout && <Zap className="h-4 w-4 text-[#F59E0B]" />}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

        {/* CONTENT AREA */}
        {!error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            {/* SPECIAL PLUS EXPERIENCE LAYOUT */}
            {selectedCategory?.is_plus_layout ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-16"
              >
                {/* PLUS Hero Section */}
                <div className="relative rounded-3xl bg-gradient-to-b from-[#182137] via-[#111726] to-[#0F1524] border border-white/[0.1] p-8 sm:p-14 shadow-2xl overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F6BFF]/15 rounded-full blur-3xl pointer-events-none" />

                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs font-black text-[#F59E0B] tracking-wider uppercase mb-4">
                    <Zap className="h-4 w-4" />
                    Exclusive Placement Package
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Exclusive Visibility. <span className="text-[#60A5FA]">Maximum Impact.</span>
                  </h2>
                  <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto mt-4 leading-relaxed">
                    The most valuable real estate across iGaming Connect, reserved for single operator & provider partners at a time.
                  </p>

                  <div className="mt-8 flex justify-center gap-4">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-[#4F6BFF]/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <span>Apply for PLUS Access</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Numbered PLUS Placements */}
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-white">Placements Only PLUS Includes</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Premium guaranteed exposure across our entire global B2B directory.
                    </p>
                  </div>

                  {loadingPlans ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl bg-[#151C2C]" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {plusBenefits.map((benefit, idx) => (
                        <motion.div
                          key={benefit.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8 rounded-2xl bg-[#151C2C] border border-white/[0.08] hover:border-[#4F6BFF]/40 hover:bg-[#1A2235] transition-all group"
                        >
                          <span className="text-4xl sm:text-5xl font-black text-[#60A5FA] opacity-40 group-hover:opacity-100 transition-opacity font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                              {benefit.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-[#94A3B8]">
                              {benefit.description}
                            </p>
                          </div>
                          <span className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 text-[11px] font-bold text-[#60A5FA]">
                            Guaranteed Spot
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feature Comparison Matrix Table */}
                {plans.length > 0 && (
                  <div className="space-y-6 pt-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-white">Full Feature Comparison Matrix</h3>
                      <p className="text-xs text-[#94A3B8]">
                        Compare all tier packages side-by-side.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C] shadow-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.08] bg-[#111726]">
                            <th className="p-4 sm:p-6 text-sm font-bold text-white">Feature Access</th>
                            {plans.map((p) => (
                              <th key={p.id} className="p-4 sm:p-6 text-center text-sm font-extrabold text-[#60A5FA]">
                                {p.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {/* Aggregate unique feature names */}
                          {Array.from(
                            new Set(
                              plans.flatMap((p) => p.features.map((f) => f.feature_text))
                            )
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
              </motion.div>
            ) : (
              /* STANDARD PRICING CARDS GRID LAYOUT */
              <div>
                {loadingPlans ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-[520px] rounded-3xl bg-[#151C2C]" />
                    ))}
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-16 bg-[#151C2C] rounded-3xl border border-white/[0.08] space-y-3">
                    <Sparkles className="h-10 w-10 text-[#60A5FA] mx-auto opacity-70" />
                    <h3 className="text-lg font-bold text-white">No Pricing Plans Available</h3>
                    <p className="text-xs text-[#94A3B8]">
                      There are currently no active plans for this category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
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
                              ? "bg-gradient-to-b from-[#182238] via-[#111726] to-[#0F1524] border-2 border-[#4F6BFF] shadow-[0_12px_45px_rgba(79,107,255,0.25)] scale-[1.02] z-10"
                              : "bg-[#151C2C] border border-white/[0.08] hover:border-white/[0.18] hover:shadow-2xl"
                          )}
                        >
                          {/* Featured / Popular Badge */}
                          {plan.badge_text && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-[#4F6BFF]/40">
                                <Sparkles className="h-3 w-3" />
                                {plan.badge_text}
                              </span>
                            </div>
                          )}

                          <div className="space-y-6">
                            {/* Card Header */}
                            <div className="space-y-3 pt-2">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F6BFF] to-[#3B54E6] p-0.5 shadow-lg shadow-[#4F6BFF]/25">
                                <div className="w-full h-full bg-[#111726] rounded-[14px] flex items-center justify-center">
                                  {renderIcon(plan.icon)}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-2xl font-black text-white group-hover:text-[#60A5FA] transition-colors">
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
                                  ? "bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-white hover:shadow-lg hover:shadow-[#4F6BFF]/40 hover:scale-[1.02] active:scale-[0.98]"
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
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function DirectoryPricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
          <Skeleton className="h-12 w-48 bg-[#151C2C] rounded-2xl" />
        </div>
      }
    >
      <DirectoryPricingContent />
    </Suspense>
  );
}
