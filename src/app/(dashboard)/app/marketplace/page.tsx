"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  UserPlus,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  MapPin,
  Star,
  Store,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { truncate, getInitials } from "@/lib/utils";
import type { Company, Category } from "@/types";
import { apiClient } from "@/lib/api-client";

const FLAG_MAP: Record<string, string> = {
  MT: "\u{1F1F2}\u{1F1F9}", GB: "\u{1F1EC}\u{1F1E7}", US: "\u{1F1FA}\u{1F1F8}",
  DE: "\u{1F1E9}\u{1F1EA}", FR: "\u{1F1EB}\u{1F1F7}", IT: "\u{1F1EE}\u{1F1F9}",
  ES: "\u{1F1EA}\u{1F1F8}", SE: "\u{1F1F8}\u{1F1EA}", NL: "\u{1F1F3}\u{1F1F1}",
  IE: "\u{1F1EE}\u{1F1EA}", EE: "\u{1F1EA}\u{1F1EA}", SG: "\u{1F1F8}\u{1F1EC}",
  IN: "\u{1F1EE}\u{1F1F3}", JP: "\u{1F1EF}\u{1F1F5}", AU: "\u{1F1E6}\u{1F1FA}",
  CA: "\u{1F1E8}\u{1F1E6}", BR: "\u{1F1E7}\u{1F1F7}", CY: "\u{1F1E8}\u{1F1FE}",
};

export default function DashboardMarketplacePage() {
  const { wallet } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [market, setMarket] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      if (country) params.set("country", country);
      if (market) params.set("market", market);
      if (verifiedOnly) params.set("verified", "true");
      params.set("page_size", "24");

      const json = await apiClient.get<any>(`/api/v1/companies/?${params.toString()}`);
      const list = Array.isArray(json) ? json : json.results || json.companies || [];
      setCompanies(list);
    } catch {} finally {
      setLoading(false);
    }
  }, [search, category, country, market, verifiedOnly]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await apiClient.get<any>("/api/v1/categories/");
        const categoryList = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoryList);
      } catch {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchSaved() {
      try {
        const res = await fetch("/api/saved-companies");
        if (res.ok) {
          const data = await res.json();
          setSavedIds(new Set(data.saved?.map((s: { company_id: string }) => s.company_id) ?? []));
        }
      } catch {}
    }
    fetchSaved();
  }, []);

  const handleToggleSave = async (companyId: string) => {
    const wasSaved = savedIds.has(companyId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
    try {
      if (wasSaved) {
        await fetch(`/api/saved-companies/${companyId}`, { method: "DELETE" });
      } else {
        await fetch("/api/saved-companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId }),
        });
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(companyId);
        else next.delete(companyId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setCountry("");
    setMarket("");
    setVerifiedOnly(false);
  };

  const hasFilters = search || category || country || market || verifiedOnly;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Marketplace</h2>
          <p className="text-muted-foreground mt-1">
            Browse and connect with iGaming companies
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Credits:</span>
          <Badge variant="secondary">{wallet?.balance ?? 0} remaining</Badge>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter size={16} />
          Filters
          {hasFilters && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Country</label>
              <Input
                placeholder="e.g. Malta"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Market</label>
              <Input
                placeholder="e.g. Europe"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-border"
                />
                Verified only
              </label>
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-neon-cyan hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16">
          <Store size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No companies found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <Card className="group hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/app/company/${company.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-10 h-10 rounded-lg object-cover border border-glass-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {getInitials(company.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {company.name}
                          </h3>
                          {company.is_verified && (
                            <BadgeCheck size={14} className="text-accent shrink-0" />
                          )}
                        </div>
                        {company.headquarters && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin size={10} />
                            <span>{company.headquarters}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleSave(company.id);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {savedIds.has(company.id) ? (
                        <BookmarkCheck size={16} className="text-primary" />
                      ) : (
                        <Bookmark size={16} />
                      )}
                    </button>
                  </div>

                  {company.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {truncate(company.description, 120)}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-1.5 mb-3">
                    {company.market && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/10">
                        {company.market}
                      </span>
                    )}
                    {company.is_verified && (
                      <Badge variant="verified" className="text-[10px]">Verified</Badge>
                    )}
                    {company.is_featured && (
                      <Badge variant="warning" className="text-[10px] gap-1">
                        <Star size={10} className="fill-current" /> Featured
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/app/company/${company.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Eye size={13} /> View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {}}
                    >
                      <UserPlus size={13} /> Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
