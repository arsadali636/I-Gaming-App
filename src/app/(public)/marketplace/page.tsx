"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyCard from "@/components/marketplace/company-card";
import { apiClient } from "@/lib/api-client";

const CATEGORIES = [
  "Platform Providers",
  "Sportsbook Providers",
  "Sportsbook APIs",
  "Casino APIs",
  "Operators",
  "Affiliates",
];

const COUNTRIES = [
  "Malta",
  "United Kingdom",
  "Germany",
  "Sweden",
  "Denmark",
  "Netherlands",
  "Spain",
  "Italy",
  "France",
  "Portugal",
  "Romania",
  "Bulgaria",
  "Greece",
  "Cyprus",
  "Isle of Man",
  "Gibraltar",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Poland",
  "Czech Republic",
  "Croatia",
  "Ireland",
  "Iceland",
  "Switzerland",
  "Austria",
  "Ukraine",
  "India",
  "Japan",
  "Australia",
  "Canada",
  "Brazil",
  "Mexico",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Singapore",
  "Philippines",
  "South Korea",
];

const MARKETS = [
  "Europe",
  "North America",
  "South America",
  "Asia Pacific",
  "Africa",
  "Middle East",
  "Global",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "verified", label: "Verified First" },
];

interface Company {
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  categories?: string[];
  country?: string | null;
  is_verified?: boolean;
  is_featured?: boolean;
}

interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (selectedCategories.length)
        params.set("category", selectedCategories[0]);
      if (selectedCountry) params.set("country", selectedCountry);
      if (selectedMarket) params.set("market", selectedMarket);
      if (verifiedOnly) params.set("verified", "true");
      params.set("page", String(page));
      params.set("page_size", "12");

      const json = await apiClient.get<any>(`/api/v1/companies/?${params.toString()}`);
      const results = Array.isArray(json) ? json : json.results || [];
      const totalCount = json.count ?? results.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / 12));

      setData({
        companies: results,
        total: totalCount,
        page,
        per_page: 12,
        total_pages: totalPages,
      });
    } catch {
      setData({ companies: [], total: 0, page: 1, per_page: 12, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, selectedCountry, selectedMarket, verifiedOnly, sortBy, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedCountry, selectedMarket, verifiedOnly, sortBy]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedCountry("");
    setSelectedMarket("");
    setVerifiedOnly(false);
    setSortBy("relevance");
  };

  const activeFilterCount =
    selectedCategories.length +
    (selectedCountry ? 1 : 0) +
    (selectedMarket ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  return (
    <div className="min-h-screen">
      <section className="py-12 border-b border-glass-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mb-6">
              Browse verified iGaming companies, providers, and partners across
              50+ regulated markets.
            </p>
            <div className="relative max-w-2xl">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search companies, categories, or markets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {data && (
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{data.total}</span>{" "}
                companies found
              </p>
            )}
          </div>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-44"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-8">
          <aside
            className={cn(
              "w-64 flex-shrink-0 space-y-6",
              "lg:block",
              sidebarOpen
                ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl p-6 overflow-y-auto block lg:relative lg:bg-transparent lg:backdrop-blur-none"
                : "hidden"
            )}
          >
            {sidebarOpen && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Categories
                </h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-[11px] text-primary hover:text-primary/80"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-all",
                        selectedCategories.includes(cat)
                          ? "bg-primary border-primary"
                          : "border-border group-hover:border-primary/50"
                      )}
                    >
                      {selectedCategories.includes(cat) && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Country
              </h3>
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Market
              </h3>
              <Select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
              >
                <option value="">All Markets</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div className="glass-card p-5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-foreground">
                  Verified Only
                </span>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    "relative w-10 h-6 rounded-full transition-colors",
                    verifiedOnly ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
                      verifiedOnly && "translate-x-4"
                    )}
                  />
                </button>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters ({activeFilterCount})
              </Button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="glass-card p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-1.5 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.companies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.companies.map((company, i) => (
                    <CompanyCard key={company.slug} company={company} index={i} />
                  ))}
                </div>

                {data.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === data.total_pages ||
                          Math.abs(p - page) <= 2
                      )
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1)
                          acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        typeof p === "string" ? (
                          <span
                            key={`dots-${i}`}
                            className="px-2 text-muted-foreground"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => setPage(p)}
                            className="h-9 w-9 text-xs"
                          >
                            {p}
                          </Button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPage((p) => Math.min(data.total_pages, p + 1))
                      }
                      disabled={page === data.total_pages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                  <Search size={28} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No companies found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters or search terms to find what
                  you&apos;re looking for.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
