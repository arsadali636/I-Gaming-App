"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyCard from "@/components/marketplace/company-card";

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

import { apiClient } from "@/lib/api-client";

interface CategoryInfo {
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
  description: string;
}

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

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [search, setSearch] = useState("");
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
      params.set("category", slug);
      if (search) params.set("q", search);
      if (selectedCountry) params.set("country", selectedCountry);
      if (selectedMarket) params.set("market", selectedMarket);
      if (verifiedOnly) params.set("status", "verified");
      params.set("page", String(page));
      params.set("page_size", "12");

      const json = await apiClient.get<any>(`/api/v1/companies/?${params.toString()}`);
      if (json && json.results) {
        const perPage = 12;
        const total = json.count ?? json.results.length;
        const totalPages = Math.ceil(total / perPage) || 1;
        setData({
          companies: json.results.map((c: any) => ({
            name: c.name,
            slug: c.slug,
            logo_url: c.logo_url,
            description: c.description,
            categories: c.categories_detail ? c.categories_detail.map((cat: any) => cat.name) : c.categories || [],
            country: c.country_detail?.name || c.country || null,
            is_verified: c.is_verified,
            is_featured: c.is_featured,
          })),
          total,
          page,
          per_page: perPage,
          total_pages: totalPages,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [slug, search, selectedCountry, selectedMarket, verifiedOnly, sortBy, page]);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const json = await apiClient.get<any>(`/api/v1/categories/${slug}/`);
        if (json) {
          setCategory({
            name: json.name,
            slug: json.slug,
            icon: json.icon || "Building2",
            color: json.color || "#6C5CE7",
            count: json.companies_count ?? json.products_count ?? 0,
            description: json.description || "",
          });
        }
      } catch {
        // silent
      }
    }
    fetchCategory();
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCountry, selectedMarket, verifiedOnly, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCountry("");
    setSelectedMarket("");
    setVerifiedOnly(false);
    setSortBy("relevance");
  };

  const activeFilterCount =
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
            {category ? (
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${category.color}15`,
                    border: `1px solid ${category.color}30`,
                  }}
                >
                  <Building2 size={26} style={{ color: category.color }} />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    <span className="gradient-text">{category.name}</span>
                  </h1>
                  <p className="text-muted-foreground">
                    {category.count} companies
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            )}

            {category?.description && (
              <p className="text-muted-foreground max-w-xl mb-6">
                {category.description}
              </p>
            )}

            <div className="relative max-w-2xl">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={`Search ${category?.name ?? "category"} companies...`}
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

      <section className="py-6 border-b border-glass-border bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/70">
                Registered Partners
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent" />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {(data?.companies ?? []).map((company) => (
                <a
                  key={company.slug}
                  href={`/company/${company.slug}`}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-glass-border bg-white/[0.03] hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-200"
                >
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-4 h-4 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="w-4 h-4 rounded-sm bg-primary/15 text-primary text-[8px] font-bold flex items-center justify-center">
                      {company.name.charAt(0)}
                    </span>
                  )}
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {company.name}
                  </span>
                  {company.is_verified && (
                    <Check size={10} className="text-accent" />
                  )}
                </a>
              ))}
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
                companies
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
                {Array.from({ length: 9 }).map((_, i) => (
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
                  <Building2 size={28} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No companies in this category
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters or check back later for new listings.
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
