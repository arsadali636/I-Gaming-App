"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  RotateCcw,
  Store,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyCard from "@/components/marketplace/company-card";
import { apiClient } from "@/lib/api-client";
import { getInitials } from "@/lib/utils";

interface CategoryMaster {
  id: string;
  name: string;
  slug: string;
}

interface CountryMaster {
  id: string;
  name: string;
  code: string;
}

interface SoftwareMaster {
  id: string;
  name: string;
  slug: string;
}

interface ServiceMaster {
  id: string;
  name: string;
  slug: string;
}

interface LicenseMaster {
  id: string;
  name: string;
  slug: string;
}

interface Company {
  id?: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  categories?: any[];
  country?: any;
  is_verified?: boolean | number;
  is_featured?: boolean | number;
  topGeos?: any[];
  allGeos?: any[];
  softwareTypes?: any[];
  serviceTypes?: any[];
  licenses?: any[];
  completionPercentage?: number;
}

interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const FLAG_MAP: Record<string, string> = {
  MT: "🇲🇹", GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", SE: "🇸🇪",
  NO: "🇳🇴", FI: "🇫🇮", DK: "🇩🇰", NL: "🇳🇱", IE: "🇮🇪", EE: "🇪🇪", LV: "🇱🇻", LT: "🇱🇹",
  CY: "🇨🇾", GI: "🇬🇮", CZ: "🇨🇿", UA: "🇺🇦", IN: "🇮🇳", JP: "🇯🇵", AU: "🇦🇺", CA: "🇨🇦",
  BR: "🇧🇷", MX: "🇲🇽", AR: "🇦🇷", ZA: "🇿🇦", SG: "🇸🇬", PH: "🇵🇭", MY: "🇲🇾", VN: "🇻🇳",
};

function getFlag(code?: string): string {
  if (!code) return "🌐";
  const upper = code.toUpperCase();
  if (FLAG_MAP[upper]) return FLAG_MAP[upper];
  return "🌐";
}

const COMPANY_SIZE_OPTIONS = ["1 - 10", "11 - 50", "51 - 200", "201 - 500", "501 - 1,000"];

export default function PublicMarketplacePage() {
  const topRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMoreCountries, setShowMoreCountries] = useState(false);
  const router = useRouter();

  const handleToggleSave = () => {
    router.push("/login");
  };

  // Master options
  const [masterCategories, setMasterCategories] = useState<CategoryMaster[]>([]);
  const [masterCountries, setMasterCountries] = useState<CountryMaster[]>([]);
  const [masterSoftware, setMasterSoftware] = useState<SoftwareMaster[]>([]);
  const [masterServices, setMasterServices] = useState<ServiceMaster[]>([]);
  const [masterLicenses, setMasterLicenses] = useState<LicenseMaster[]>([]);

  useEffect(() => {
    async function loadMaster() {
      try {
        const res = await fetch("/api/master/options");
        if (res.ok) {
          const json = await res.json();
          setMasterCategories(json.categories || []);
          setMasterCountries(json.countries || []);
          setMasterSoftware(json.softwareTypes || []);
          setMasterServices(json.serviceTypes || []);
          setMasterLicenses(json.licenses || []);
        }
      } catch (err) {
        console.error("Error loading master options:", err);
      }
    }
    loadMaster();
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
      if (selectedCountries.length) params.set("country", selectedCountries[0]);
      if (selectedSizes.length) params.set("company_size", selectedSizes[0]);
      if (verifiedOnly) params.set("verified", "true");
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("limit", "12");

      let json: any = null;
      try {
        const res = await fetch(`/api/companies?${params.toString()}`);
        if (res.ok) json = await res.json();
      } catch {}

      if (json) {
        const results = json.companies || (Array.isArray(json) ? json : []);
        const seenIds = new Set<string>();
        const uniqueResults: Company[] = [];
        for (const item of results) {
          const id = item.id || item.slug;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueResults.push(item);
          } else if (!id) {
            uniqueResults.push(item);
          }
        }
        const totalCount = json.total ?? uniqueResults.length;
        const totalPages = json.total_pages ?? Math.max(1, Math.ceil(totalCount / 12));

        setData({
          companies: uniqueResults,
          total: totalCount,
          page,
          per_page: 12,
          total_pages: totalPages,
        });
      } else {
        setData({ companies: [], total: 0, page: 1, per_page: 12, total_pages: 1 });
      }
    } catch {
      setData({ companies: [], total: 0, page: 1, per_page: 12, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, selectedCountries, selectedSizes, verifiedOnly, sortBy, page]);

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
        try {
          mainEl.scrollTo({ top: 0, behavior: "instant" });
        } catch {}
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (topRef.current) {
        try {
          topRef.current.scrollIntoView({ behavior: "instant", block: "start" });
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    scrollToTop();
  }, [fetchCompanies, page, scrollToTop]);

  useEffect(() => {
    if (!loading) {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  }, [loading, scrollToTop]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedCountries, selectedSizes, verifiedOnly, sortBy]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    scrollToTop();
  };

  const toggleCategory = (slugOrName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slugOrName) ? prev.filter((c) => c !== slugOrName) : [...prev, slugOrName]
    );
  };

  const toggleCountry = (name: string) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleSoftware = (name: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleService = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleLicense = (name: string) => {
    setSelectedLicenses((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedCountries([]);
    setCountrySearch("");
    setSelectedSizes([]);
    setSelectedSoftware([]);
    setSelectedServices([]);
    setSelectedLicenses([]);
    setVerifiedOnly(false);
    setSortBy("recommended");
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedCountries.length +
    selectedSizes.length +
    selectedSoftware.length +
    selectedServices.length +
    selectedLicenses.length +
    (verifiedOnly ? 1 : 0);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return masterCountries;
    return masterCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [masterCountries, countrySearch]);

  const displayedCountries = showMoreCountries ? filteredCountries : filteredCountries.slice(0, 5);

  const featuredCompanies = useMemo(() => {
    if (!data?.companies) return [];
    return data.companies.filter((c) => c.is_featured || c.is_verified).slice(0, 5);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] p-4 md:p-6 lg:p-8">
      <div ref={topRef} />
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP MARKETPLACE HEADER BLOCK */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1F2937]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Find the right iGaming partners
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Connect with verified operators, providers, affiliates and service companies worldwide.
            </p>
          </div>

          {/* Dynamic Marketplace Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0D1320] border border-[#1F2937]">
              <span className="text-lg">🏢</span>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">{(data?.total || 0).toLocaleString()}+</p>
                <p className="text-[10px] text-[#94A3B8]">Companies</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0D1320] border border-[#1F2937]">
              <span className="text-lg">🌐</span>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">{masterCountries.length}+</p>
                <p className="text-[10px] text-[#94A3B8]">Countries</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0D1320] border border-[#1F2937]">
              <span className="text-lg">📂</span>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">{masterCategories.length}+</p>
                <p className="text-[10px] text-[#94A3B8]">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-COLUMN MAIN LAYOUT GRID */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* 1. LEFT FILTER SIDEBAR */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h2 className="text-sm font-bold text-[#F8FAFC]">Filters</h2>
              <button
                onClick={resetAllFilters}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Business Category */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Business Category
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {masterCategories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.slug) || selectedCategories.includes(cat.name);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.slug)}
                          className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Country / GEO */}
            <div className="space-y-2.5 pt-3 border-t border-[#1F2937]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Country / GEO
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-[#070B14] border border-[#1F2937] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {displayedCountries.map((c) => {
                  const isChecked = selectedCountries.includes(c.name);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCountry(c.name)}
                        className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                      <span>{getFlag(c.code)}</span>
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>

              {filteredCountries.length > 5 && (
                <button
                  onClick={() => setShowMoreCountries(!showMoreCountries)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer pt-1"
                >
                  {showMoreCountries ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {/* Company Size */}
            <div className="space-y-2.5 pt-3 border-t border-[#1F2937]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Company Size
              </h3>
              <div className="space-y-1.5">
                {COMPANY_SIZE_OPTIONS.map((size) => {
                  const isChecked = selectedSizes.includes(size);
                  return (
                    <label
                      key={size}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSize(size)}
                        className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                      <span>{size} employees</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Software Types */}
            {masterSoftware.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#1F2937]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Products / Software Types
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {masterSoftware.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSoftware.includes(st.name)}
                        onChange={() => toggleSoftware(st.name)}
                        className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                      <span className="truncate">{st.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {masterServices.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#1F2937]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Services
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {masterServices.map((srv) => (
                    <label
                      key={srv.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(srv.name)}
                        onChange={() => toggleService(srv.name)}
                        className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Licenses */}
            {masterLicenses.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#1F2937]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Licenses
                </h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {masterLicenses.map((lic) => (
                    <label
                      key={lic.id}
                      className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLicenses.includes(lic.name)}
                        onChange={() => toggleLicense(lic.name)}
                        className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                      <span className="truncate">{lic.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Only Switch */}
            <div className="pt-3 border-t border-[#1F2937]">
              <label className="flex items-center justify-between text-xs font-medium text-[#F8FAFC] cursor-pointer">
                <span>Verified Only</span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                />
              </label>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => fetchCompanies()}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
            >
              Apply Filters ({data?.total || 0})
            </button>
          </aside>

          {/* 2. CENTRAL MAIN MARKETPLACE CONTENT AREA */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search companies, products, services or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCompanies()}
                  className="h-11 w-full rounded-xl border border-[#1F2937] bg-[#0D1320] pl-10 pr-10 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      fetchCompanies();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => fetchCompanies()}
                className="h-11 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] text-sm font-bold rounded-xl transition-all shadow cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>

            {/* Quick Filter Chips Row */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#94A3B8]">Active filters:</span>
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30"
                  >
                    {cat}
                    <X size={12} className="cursor-pointer" onClick={() => toggleCategory(cat)} />
                  </span>
                ))}
                {selectedCountries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30"
                  >
                    {c}
                    <X size={12} className="cursor-pointer" onClick={() => toggleCountry(c)} />
                  </span>
                ))}
                {verifiedOnly && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    Verified Only
                    <X size={12} className="cursor-pointer" onClick={() => setVerifiedOnly(false)} />
                  </span>
                )}
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-[#2563EB] hover:underline ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Results Header Row */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs md:text-sm font-semibold text-[#F8FAFC]">
                <strong className="text-[#2563EB] font-bold">{data?.total || 0}</strong> companies found
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 px-2.5 rounded-xl border border-[#1F2937] bg-[#0D1320] text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#2563EB]"
                >
                  <option value="recommended">Recommended</option>
                  <option value="verified">Verified First</option>
                  <option value="newest">Newest</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* LARGE HORIZONTAL COMPANY CARDS */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-44 rounded-2xl bg-[#0D1320] border border-[#1F2937] p-6 space-y-4 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded-2xl bg-[#1F2937]" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48 bg-[#1F2937]" />
                        <Skeleton className="h-4 w-32 bg-[#1F2937]" />
                        <Skeleton className="h-4 w-full bg-[#1F2937]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#0D1320] border border-[#1F2937]">
                <Store size={36} className="text-[#94A3B8] mb-3" />
                <h3 className="text-base font-bold text-[#F8FAFC] mb-1">No companies found</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mb-4">
                  Try adjusting your search terms or clearing filter selections.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 text-xs font-bold text-[#F8FAFC] bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.companies.map((company, index) => (
                  <CompanyCard
                    key={company.slug || company.id}
                    company={company}
                    index={index}
                    onToggleSave={handleToggleSave}
                    hrefPrefix="/company"
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-[#0D1320] border border-[#1F2937] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-[#94A3B8] px-3">
                  Page <strong className="text-[#F8FAFC]">{page}</strong> of {data.total_pages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(data.total_pages, page + 1))}
                  disabled={page === data.total_pages}
                  className="p-2 rounded-xl bg-[#0D1320] border border-[#1F2937] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>

          {/* 3. RIGHT SIDEBAR */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6">
            {/* Featured Partners */}
            {featuredCompanies.length > 0 && (
              <div className="bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <span>👑</span> Featured Partners
                  </h3>
                </div>

                <div className="space-y-3">
                  {featuredCompanies.map((comp) => {
                    const compId = comp.id || comp.slug;
                    const catName =
                      comp.categories && comp.categories.length > 0
                        ? typeof comp.categories[0] === "string"
                          ? comp.categories[0]
                          : comp.categories[0]?.name
                        : "iGaming Partner";

                    return (
                      <Link
                        key={comp.slug || comp.id}
                        href={`/company/${compId}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#111827] transition-all group border border-transparent hover:border-[#1F2937]"
                      >
                        {comp.logo_url ? (
                          <img
                            src={comp.logo_url}
                            alt={comp.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#1F2937] bg-[#070B14] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#2563EB] border border-[#1F2937] flex items-center justify-center text-[#F8FAFC] text-xs font-bold shrink-0">
                            {getInitials(comp.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#2563EB] transition-colors truncate">
                              {comp.name}
                            </p>
                            <BadgeCheck size={12} className="text-[#10B981] shrink-0" />
                          </div>
                          <p className="text-[11px] text-[#94A3B8] truncate">{catName}</p>
                        </div>
                        <span className="text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors text-xs font-bold">
                          ›
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* iGaming Events Promo */}
            <div className="bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <span className="text-[10px] font-bold tracking-wider text-[#2563EB] uppercase px-2 py-0.5 rounded-md bg-[#2563EB]/15 border border-[#2563EB]/30 inline-block">
                iGaming Connect Events
              </span>
              <h4 className="text-sm font-bold text-[#F8FAFC]">
                Meet the industry at ICE 2025
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Connect with leading decision makers and global providers at our annual B2B summit.
              </p>
              <Link href="/login">
                <button className="w-full mt-2 py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] text-xs font-bold rounded-xl transition-all shadow cursor-pointer">
                  Join Network →
                </button>
              </Link>
            </div>

            {/* Marketplace Statistics */}
            <div className="bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                Marketplace Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
                  <p className="text-base font-bold text-[#F8FAFC]">{(data?.total || 0).toLocaleString()}+</p>
                  <p className="text-[10px] text-[#94A3B8]">Companies</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
                  <p className="text-base font-bold text-[#F8FAFC]">{masterCountries.length}+</p>
                  <p className="text-[10px] text-[#94A3B8]">Countries</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
                  <p className="text-base font-bold text-[#F8FAFC]">{masterCategories.length}+</p>
                  <p className="text-[10px] text-[#94A3B8]">Categories</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
                  <p className="text-base font-bold text-[#F8FAFC]">50,000+</p>
                  <p className="text-[10px] text-[#94A3B8]">Connections</p>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </div>
    </div>
  );
}
