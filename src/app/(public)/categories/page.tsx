"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Building2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryCard from "@/components/marketplace/category-card";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: number;
  count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Failed to load categories:", err);
      setError(err?.message || "Failed to load categories from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] pt-12 pb-24">
      {/* HERO SECTION */}
      <section className="relative py-16 overflow-hidden border-b border-[#252A3A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1220] border border-[#252A3A] text-xs text-[#22C1DC] font-semibold">
              <Sparkles size={14} className="text-[#22C1DC]" />
              <span>Explore All Industry Sectors</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F8FAFC]">
              iGaming Industry <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] to-[#22C1DC]">Categories</span>
            </h1>

            <p className="text-base sm:text-lg text-[#A1A9B8] leading-relaxed">
              Browse verified providers, platform operators, game studios, and compliance solutions grouped by industry vertical.
            </p>

            {/* SEARCH INPUT */}
            <div className="relative max-w-xl mx-auto pt-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
              />
              <Input
                placeholder="Search categories by name or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 text-sm bg-[#0D1220] border-[#252A3A] text-[#F8FAFC] placeholder:text-[#6B7280] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20 rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6B7280] hover:text-[#F8FAFC] hover:bg-[#121827]"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#121827] border border-[#252A3A] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-11 h-11 rounded-xl bg-[#171B2B]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-[#171B2B]" />
                    <Skeleton className="h-3 w-1/2 bg-[#171B2B]" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full bg-[#171B2B]" />
                <Skeleton className="h-3 w-2/3 bg-[#171B2B]" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#121827] border border-[#252A3A] max-w-lg mx-auto p-8 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
              <AlertCircle size={26} />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">
              Failed to load categories
            </h3>
            <p className="text-xs text-[#A1A9B8] mb-6">
              {error}
            </p>
            <button
              onClick={fetchCategories}
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20 transition-all"
            >
              <RefreshCw size={14} />
              Retry Loading
            </button>
          </div>
        ) : filteredCategories.length > 0 ? (
          /* Success State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((cat, index) => (
              <CategoryCard
                key={cat.id || cat.slug}
                name={cat.name}
                slug={cat.slug}
                icon={cat.icon}
                color={cat.color || "#4F46E5"}
                count={cat.count}
                description={cat.description}
                index={index}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121827] border border-[#252A3A] max-w-lg mx-auto p-8 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center mb-4">
              <Building2 size={28} className="text-[#818CF8]" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">
              {search ? `No categories match "${search}"` : "No active categories available yet"}
            </h3>
            <p className="text-xs text-[#A1A9B8] mb-6">
              {search
                ? "Try searching with a different keyword or view all categories."
                : "Active categories will appear here automatically once created by the Super Admin."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-4 py-2 rounded-xl bg-[#171B2B] text-[#F8FAFC] hover:bg-[#252A3A] text-xs font-semibold transition-colors border border-[#252A3A]"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-[#121827] p-8 sm:p-12 rounded-2xl border border-[#252A3A] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Looking for companies across all categories?
            </h2>
            <p className="text-[#A1A9B8] text-sm">
              Explore our full marketplace directory with advanced filters for country, licensing, and markets served.
            </p>
          </div>
          <Link href="/marketplace" className="shrink-0">
            <button className="px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#4F46E5]/20">
              Go to Marketplace
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
