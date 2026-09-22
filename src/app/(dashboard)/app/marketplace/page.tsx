"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Save,
  FolderHeart,
  Store,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Globe,
  Zap,
  RotateCcw,
  Check,
  Building2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CompanyCard from "@/components/marketplace/company-card";
import { useAuth } from "@/hooks/use-auth";
import type { Company } from "@/types";
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

interface SavedSearchItem {
  id: string;
  name: string;
  filters: {
    q?: string;
    search?: string;
    category?: string;
    country?: string;
    market?: string;
    is_verified?: boolean;
    verified?: boolean;
    verifiedOnly?: boolean;
  };
  created_at: string;
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

export default function DashboardMarketplacePage() {
  const { wallet } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Master Data Options
  const [masterCategories, setMasterCategories] = useState<CategoryMaster[]>([]);
  const [masterCountries, setMasterCountries] = useState<CountryMaster[]>([]);
  const [masterSoftware, setMasterSoftware] = useState<SoftwareMaster[]>([]);
  const [masterServices, setMasterServices] = useState<ServiceMaster[]>([]);
  const [masterLicenses, setMasterLicenses] = useState<LicenseMaster[]>([]);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recommended" | "recent" | "popular" | "verified" | "name">("recommended");

  // Sidebar Accordion states
  const [showMoreCountries, setShowMoreCountries] = useState(false);

  // Saved companies state
  const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map());

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);

  // Load Master Data
  useEffect(() => {
    async function fetchMasterOptions() {
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
      } catch {}
    }
    fetchMasterOptions();
  }, []);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
      if (selectedCountries.length > 0) params.set("country", selectedCountries[0]);
      if (selectedSizes.length > 0) params.set("company_size", selectedSizes[0]);
      if (verifiedOnly) params.set("verified", "true");
      params.set("sort", sortBy);
      params.set("limit", "50");

      let json: any = null;
      try {
        const res = await fetch(`/api/companies?${params.toString()}`);
        if (res.ok) json = await res.json();
      } catch {}

      if (json) {
        const list = json.companies || (Array.isArray(json) ? json : []);
        const seenIds = new Set<string>();
        const uniqueList: Company[] = [];
        for (const item of list) {
          const id = item.id || item.slug;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueList.push(item);
          } else if (!id) {
            uniqueList.push(item);
          }
        }
        setCompanies(uniqueList);
        setTotalCount(json.total ?? uniqueList.length);
      } else {
        setCompanies([]);
        setTotalCount(0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [search, selectedCategories, selectedCountries, selectedSizes, verifiedOnly, sortBy]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Saved companies & searches
  const fetchSavedCompanies = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("/api/v1/saved-companies/");
      const list = Array.isArray(res) ? res : res.results ?? [];
      const map = new Map<string, string>();
      list.forEach((item: any) => {
        const compId = item.company || item.company_detail?.id;
        if (compId) map.set(compId, item.id);
      });
      setSavedMap(map);
    } catch {}
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("/api/v1/saved-searches/");
      const list = Array.isArray(res) ? res : res.results ?? [];
      setSavedSearches(list);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSavedCompanies();
    fetchSavedSearches();
  }, [fetchSavedCompanies, fetchSavedSearches]);

  const handleToggleSave = async (companyId: string) => {
    const isSaved = savedMap.has(companyId);
    const savedRecordId = savedMap.get(companyId);

    setSavedMap((prev) => {
      const next = new Map(prev);
      if (isSaved) next.delete(companyId);
      else next.set(companyId, "pending");
      return next;
    });

    try {
      if (isSaved && savedRecordId && savedRecordId !== "pending") {
        await apiClient.delete(`/api/v1/saved-companies/${savedRecordId}/`);
        fetchSavedCompanies();
      } else {
        const res = await apiClient.post<any>("/api/v1/saved-companies/", {
          company: companyId,
        });
        if (res && res.id) {
          setSavedMap((prev) => new Map(prev).set(companyId, res.id));
        } else {
          fetchSavedCompanies();
        }
      }
    } catch {
      fetchSavedCompanies();
    }
  };

  // Toggle Selection Helpers
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
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedCountries.length +
    selectedSizes.length +
    selectedSoftware.length +
    selectedServices.length +
    selectedLicenses.length +
    (verifiedOnly ? 1 : 0);

  // Country filtering for search box inside sidebar
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return masterCountries;
    return masterCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [masterCountries, countrySearch]);

  const displayedCountries = showMoreCountries ? filteredCountries : filteredCountries.slice(0, 5);

  // Dynamic counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach((c) => {
      (c.categories || []).forEach((cat) => {
        const catName = typeof cat === "string" ? cat : cat.name;
        if (catName) counts[catName] = (counts[catName] || 0) + 1;
      });
    });
    return counts;
  }, [companies]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach((c) => {
      const cName = typeof c.country === "object" ? c.country?.name : (c.country || c.headquarters);
      if (cName) counts[cName] = (counts[cName] || 0) + 1;
    });
    return counts;
  }, [companies]);

  // Featured Companies List
  const featuredCompanies = useMemo(() => {
    return companies.filter((c) => c.is_featured || c.is_verified).slice(0, 5);
  }, [companies]);

  const handleCreateSavedSearch = async () => {
    if (!newSearchName.trim()) return;
    setSavingSearch(true);
    try {
      await apiClient.post("/api/v1/saved-searches/", {
        name: newSearchName.trim(),
        filters: {
          q: search,
          categories: selectedCategories,
          countries: selectedCountries,
          verifiedOnly,
        },
      });
      setNewSearchName("");
      setSaveSearchOpen(false);
      fetchSavedSearches();
    } catch {} finally {
      setSavingSearch(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] p-4 md:p-6 lg:p-8">
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
                <p className="text-xs font-bold text-[#F8FAFC]">{totalCount.toLocaleString()}+</p>
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
                  const count = categoryCounts[cat.name] || 0;
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
                      {count > 0 && (
                        <span className="text-[10px] text-[#94A3B8] font-mono">({count})</span>
                      )}
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
                  const count = countryCounts[c.name] || 0;
                  const isChecked = selectedCountries.includes(c.name);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#111827] transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCountry(c.name)}
                          className="rounded border-[#1F2937] bg-[#070B14] text-[#2563EB] focus:ring-[#2563EB]/20"
                        />
                        <span>{getFlag(c.code)}</span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      {count > 0 && (
                        <span className="text-[10px] text-[#94A3B8] font-mono">({count})</span>
                      )}
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
              Apply Filters ({totalCount})
            </button>
          </aside>

          {/* 2. CENTRAL MAIN MARKETPLACE CONTENT AREA */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* Search Input Bar */}
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

              <button
                onClick={() => setSavedSearchesOpen(true)}
                className="h-11 px-4 bg-[#0D1320] border border-[#1F2937] hover:bg-[#111827] text-[#F8FAFC] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <FolderHeart size={15} className="text-[#2563EB]" />
                <span>Saved Searches</span>
              </button>
            </div>

            {/* Quick Filter Chips Row & Clear All */}
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

            {/* Results Count & Sort Row */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs md:text-sm font-semibold text-[#F8FAFC]">
                <strong className="text-[#2563EB] font-bold">{companies.length}</strong> companies found
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 px-2.5 rounded-xl border border-[#1F2937] bg-[#0D1320] text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#2563EB]"
                >
                  <option value="recommended">Recommended</option>
                  <option value="verified">Verified First</option>
                  <option value="popular">Most Popular</option>
                  <option value="recent">Recently Added</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* LARGE HORIZONTAL COMPANY CARDS LIST */}
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
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#0D1320] border border-[#1F2937]">
                <Store size={36} className="text-[#94A3B8] mb-3" />
                <h3 className="text-base font-bold text-[#F8FAFC] mb-1">No companies found</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mb-4">
                  Try adjusting your search criteria or resetting active filters.
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
                {companies.map((company, index) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    index={index}
                    isSaved={savedMap.has(company.id || "")}
                    onToggleSave={handleToggleSave}
                    onConnect={() => {}}
                    hrefPrefix="/app/company"
                  />
                ))}
              </div>
            )}
          </main>

          {/* 3. RIGHT SIDEBAR */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6">

            {/* Featured Partners Panel */}
            {featuredCompanies.length > 0 && (
              <div className="bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <span>👑</span> Featured Partners
                  </h3>
                  <button
                    onClick={() => setVerifiedOnly(true)}
                    className="text-xs text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
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
                        key={comp.id}
                        href={`/app/company/${compId}`}
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

            {/* Promotional Events Section */}
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
              <Link href="/app/events">
                <button className="w-full mt-2 py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] text-xs font-bold rounded-xl transition-all shadow cursor-pointer">
                  Learn More →
                </button>
              </Link>
            </div>

            {/* Marketplace Statistics Box */}
            <div className="bg-[#0D1320] border border-[#1F2937] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                Marketplace Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
                  <p className="text-base font-bold text-[#F8FAFC]">{totalCount.toLocaleString()}+</p>
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

      {/* Save Search Modal */}
      <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
        <DialogContent className="sm:max-w-md bg-[#0D1320] border-[#1F2937] text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-[#F8FAFC]">Save Current Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-[#94A3B8]">
              Save your current search criteria for quick access in the future.
            </p>
            <Input
              placeholder="e.g. Verified Game Providers in Malta"
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              className="bg-[#070B14] border-[#1F2937] text-[#F8FAFC] text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSaveSearchOpen(false)}
              className="border-[#1F2937] text-[#94A3B8] hover:bg-[#111827]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSavedSearch}
              disabled={savingSearch || !newSearchName.trim()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC]"
            >
              {savingSearch ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Searches Drawer / Modal */}
      <Dialog open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
        <DialogContent className="sm:max-w-md bg-[#0D1320] border-[#1F2937] text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-[#F8FAFC]">Your Saved Searches</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {savedSearches.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-4">No saved searches yet.</p>
            ) : (
              savedSearches.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#070B14] border border-[#1F2937]"
                >
                  <p className="text-xs font-semibold text-[#F8FAFC]">{item.name}</p>
                  <button
                    onClick={() => {
                      if (item.filters?.q) setSearch(item.filters.q);
                      setSavedSearchesOpen(false);
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    Apply
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
