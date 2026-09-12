"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Search,
  Filter,
  Globe,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  Plus,
  Users,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OfferItem {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name?: string;
  company_logo?: string;
  company_slug?: string;
  company_verified?: number;
  brand?: string;
  category_name?: string;
  offer_type?: string;
  geo?: string;
  traffic_type?: string;
  vertical?: string;
  payout: number;
  currency: string;
  payout_type: string;
  payout_description?: string;
  conversion_event?: string;
  description: string;
  status: string;
  is_featured: number;
  created_at: string;
}

function OffersListingContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || searchParams.get("offer_type") || "all";

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState<string>(initialType);
  const [selectedPayoutType, setSelectedPayoutType] = useState<string>("all");
  const [selectedGeo, setSelectedGeo] = useState<string>("all");
  const [selectedVertical, setSelectedVertical] = useState<string>("all");

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") || searchParams.get("offer_type") || "all";
    setSelectedOfferType(typeFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function fetchOffers() {
      try {
        setLoading(true);
        let url = `/api/offers?status=active&limit=50`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (selectedOfferType !== "all") url += `&offer_type=${selectedOfferType}`;
        if (selectedPayoutType !== "all") url += `&payout_type=${selectedPayoutType}`;
        if (selectedGeo !== "all") url += `&geo=${encodeURIComponent(selectedGeo)}`;
        if (selectedVertical !== "all") url += `&vertical=${encodeURIComponent(selectedVertical)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setOffers(data.offers || []);
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [search, selectedOfferType, selectedPayoutType, selectedGeo, selectedVertical]);

  const affiliateOffersCount = offers.filter((o) => o.offer_type === "affiliate" || !o.offer_type).length;
  const operatorOffersCount = offers.filter((o) => o.offer_type === "operator").length;

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1322] via-[#111827] to-[#0A0F1D] border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-[#4F6BFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F6BFF]/15 border border-[#4F6BFF]/30 text-xs font-bold text-[#60A5FA]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>B2B Commercial Deals & Campaigns</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              iGaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#4F6BFF]">Offers & Deals</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Explore dynamic Affiliate Offers and Operator Deals published directly by licensed operators, game studios, and network aggregators.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/app/opportunities"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-xs font-bold text-[#F8FAFC] hover:bg-white/[0.1] transition-all cursor-pointer"
            >
              <span>Explore Opportunities</span>
              <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
            </Link>
          </div>
        </div>

        {/* PRIMARY CATEGORY TABS (Affiliate Offers vs Operator Offers) */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedOfferType("all")}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer border",
              selectedOfferType === "all"
                ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-lg shadow-[#4F6BFF]/30"
                : "bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Tag className="h-4 w-4" />
            <span>All Offers</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{offers.length}</span>
          </button>

          <button
            onClick={() => setSelectedOfferType("affiliate")}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer border",
              selectedOfferType === "affiliate"
                ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-lg shadow-[#4F6BFF]/30"
                : "bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Users className="h-4 w-4 text-[#60A5FA]" />
            <span>Affiliate Offers</span>
            <span className="rounded-full bg-[#EF4444] text-white text-[9px] font-black px-1.5 py-0.2">
              NEW
            </span>
          </button>

          <button
            onClick={() => setSelectedOfferType("operator")}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer border",
              selectedOfferType === "operator"
                ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-lg shadow-[#4F6BFF]/30"
                : "bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
            )}
          >
            <Building2 className="h-4 w-4 text-[#34D399]" />
            <span>Operator Offers</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#151C2C]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Offers Displayed</p>
          <p className="text-xl font-black text-white mt-1">{loading ? "..." : offers.length}</p>
        </div>
        <div className="bg-[#151C2C]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Affiliate Deals</p>
          <p className="text-xl font-black text-[#60A5FA] mt-1">{loading ? "..." : affiliateOffersCount}</p>
        </div>
        <div className="bg-[#151C2C]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Operator Deals</p>
          <p className="text-xl font-black text-[#34D399] mt-1">{loading ? "..." : operatorOffersCount}</p>
        </div>
        <div className="bg-[#151C2C]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Target GEOs</p>
          <p className="text-xl font-black text-[#F59E0B] mt-1">Global</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D1220] p-4 rounded-2xl border border-white/[0.07]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search offer title, brand, or advertiser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#111827] pl-10 pr-4 text-xs text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#4F6BFF] transition-all"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Payout Type Filter */}
          <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setSelectedPayoutType("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                selectedPayoutType === "all"
                  ? "bg-[#4F6BFF] text-white"
                  : "text-[#94A3B8] hover:text-white"
              )}
            >
              All Models
            </button>
            <button
              onClick={() => setSelectedPayoutType("CPA")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                selectedPayoutType === "CPA"
                  ? "bg-[#4F6BFF] text-white"
                  : "text-[#94A3B8] hover:text-white"
              )}
            >
              CPA
            </button>
            <button
              onClick={() => setSelectedPayoutType("RevShare")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                selectedPayoutType === "RevShare"
                  ? "bg-[#4F6BFF] text-white"
                  : "text-[#94A3B8] hover:text-white"
              )}
            >
              RevShare
            </button>
            <button
              onClick={() => setSelectedPayoutType("Hybrid")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                selectedPayoutType === "Hybrid"
                  ? "bg-[#4F6BFF] text-white"
                  : "text-[#94A3B8] hover:text-white"
              )}
            >
              Hybrid
            </button>
          </div>

          {/* GEO Dropdown filter */}
          <select
            value={selectedGeo}
            onChange={(e) => setSelectedGeo(e.target.value)}
            className="h-10 rounded-xl border border-white/[0.08] bg-[#111827] px-3 text-xs font-bold text-[#F8FAFC] outline-none focus:border-[#4F6BFF] cursor-pointer"
          >
            <option value="all">All GEOs</option>
            <option value="Global">Global</option>
            <option value="EU">Europe (EU)</option>
            <option value="DE">Germany (DE)</option>
            <option value="BR">Brazil (BR)</option>
            <option value="UK">United Kingdom (UK)</option>
            <option value="LATAM">LATAM</option>
          </select>
        </div>
      </div>

      {/* OFFERS LISTING GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl bg-[#151C2C]" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 bg-[#0D1220] rounded-3xl border border-white/[0.07] space-y-3">
          <Tag className="h-10 w-10 text-[#60A5FA] mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">No Offers Found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            No active B2B campaigns matched your current search filters. Try clearing your filters or switching offer category tabs.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedOfferType("all");
              setSelectedPayoutType("all");
              setSelectedGeo("all");
              setSelectedVertical("all");
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#4F6BFF] px-4 py-2 text-xs font-bold text-white hover:bg-[#3B54E6] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer, idx) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
              <div className="group relative flex flex-col justify-between h-full rounded-3xl bg-[#0D1220] border border-white/[0.08] p-5 shadow-xl hover:border-[#4F6BFF]/40 hover:bg-[#121827] transition-all">
                {offer.is_featured === 1 && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 px-2.5 py-0.5 text-[10px] font-black text-[#F59E0B]">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Company Header & Category Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#151C2C] border border-white/[0.08] flex items-center justify-center font-bold text-[#60A5FA]">
                        {offer.company_logo ? (
                          <img
                            src={offer.company_logo}
                            alt={offer.company_name || offer.brand || "Company"}
                            className="h-10 w-10 rounded-2xl object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-[#4F6BFF]" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[#F8FAFC] truncate">
                          {offer.company_name || offer.brand || "Verified Operator"}
                        </p>
                        <p className="text-[10px] font-medium text-[#94A3B8] truncate">
                          {offer.vertical || "iGaming"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase border",
                        offer.offer_type === "operator"
                          ? "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30"
                          : "bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/30"
                      )}
                    >
                      {offer.offer_type === "operator" ? "Operator" : "Affiliate"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {offer.description}
                    </p>
                  </div>

                  {/* Payout & Geo Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <div className="rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 px-2.5 py-1 text-xs font-black text-[#34D399]">
                      {offer.payout_type}: {offer.currency}
                      {offer.payout}
                    </div>

                    {offer.geo && (
                      <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#94A3B8]">
                        <Globe className="h-3 w-3 text-[#60A5FA]" />
                        <span>{offer.geo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B] font-medium">
                    {offer.conversion_event || "FTD"}
                  </span>
                  <Link
                    href={`/app/offers/${offer.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#60A5FA] hover:text-[#4F6BFF] transition-colors group-hover:translate-x-0.5"
                  >
                    <span>View Deal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OffersListingPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px]" />}>
      <OffersListingContent />
    </Suspense>
  );
}

