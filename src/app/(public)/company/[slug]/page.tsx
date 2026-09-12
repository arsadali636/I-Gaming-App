"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BadgeCheck,
  Globe,
  Building2,
  Calendar,
  Users,
  ExternalLink,
  ArrowLeft,
  Shield,
  MapPin,
  Layers,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

const FLAG_MAP: Record<string, string> = {
  MT: "🇲🇹", GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", SE: "🇸🇪", NO: "🇳🇴",
  FI: "🇫🇮", DK: "🇩🇰", NL: "🇳🇱", IE: "🇮🇪", EE: "🇪🇪", LV: "🇱🇻", LT: "🇱🇹", RO: "🇷🇴", BG: "🇧🇬",
  HR: "🇭🇷", GR: "🇬🇷", CY: "🇨🇾", GI: "🇬🇮", JE: "🇯🇪", IM: "🇮🇲", IS: "🇮🇸", CH: "🇨🇭", AT: "🇦🇹",
  PL: "🇵🇱", CZ: "🇨🇿", UA: "🇺🇦", IN: "🇮🇳", JP: "🇯🇵", AU: "🇦🇺", CA: "🇨🇦", BR: "🇧🇷", MX: "🇲🇽",
  ZA: "🇿🇦", NG: "🇳🇬", KE: "🇰🇪", SG: "🇸🇬", PH: "🇵🇭", KR: "🇰🇷", CN: "🇨🇳", PT: "🇵🇹",
};

function getFlag(code?: string): string {
  if (!code) return "🌐";
  const upper = code.toUpperCase();
  if (FLAG_MAP[upper]) return FLAG_MAP[upper];
  if (code.length === 2) {
    const codePoints = upper.split("").map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return "🌐";
}

function normalizeList(val: any): { id: string; name: string; slug?: string; code?: string; is_top?: number }[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item, idx) => {
      if (typeof item === "string") {
        return { id: String(idx), name: item };
      }
      if (typeof item === "object" && item !== null) {
        return {
          id: item.id || item.slug || String(idx),
          name: item.name || item.label || item.license_name || String(item),
          slug: item.slug,
          code: item.code,
          is_top: item.is_top,
        };
      }
      return { id: String(idx), name: String(item) };
    });
  }
  if (typeof val === "string" && val.trim()) {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item, idx) => ({ id: String(idx), name: item }));
  }
  return [];
}

export default function PublicCompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        let json: any = null;
        try {
          const res = await fetch(`/api/companies/${encodeURIComponent(slug)}`);
          if (res.ok) json = await res.json();
        } catch {}

        if (json) {
          const compObj = json.company ?? json;
          setCompany(compObj);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-6 w-32 bg-slate-800" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl bg-slate-800" />
            <Skeleton className="h-48 w-full rounded-2xl bg-slate-800" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-[#111827]/50 p-8 rounded-3xl border border-white/10 max-w-md w-full">
          <Building2 size={48} className="mx-auto mb-4 text-slate-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Company Not Found</h1>
          <p className="text-slate-400 text-sm mb-6">
            The requested company listing is unavailable or does not exist.
          </p>
          <Link href="/marketplace">
            <Button className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold w-full">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isVerifiedBool = Boolean(company.is_verified);
  const categoriesList = normalizeList(company.categories || company.category);
  const primaryCategory = categoriesList.length > 0 ? categoriesList[0].name : null;
  const topGeos = normalizeList(company.topGeos || company.top_geos);
  const allGeos = normalizeList(company.allGeos || company.all_geos || company.geos);
  const softwareTypes = normalizeList(company.softwareTypes || company.software_types || company.products || company.company_products);
  const serviceTypes = normalizeList(company.serviceTypes || company.service_types || company.services || company.company_services);
  const licenses = normalizeList(company.licenses || company.company_licenses || company.license_links);
  const countryObj = company.country;
  const countryName = typeof countryObj === "string" ? countryObj : countryObj?.name || countryObj?.code || company.headquarters || "";

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Hero */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border border-white/10 bg-[#111827] p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-start gap-5">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-white/15 bg-[#080C16] shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0">
                      {getInitials(company.name)}
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {company.name}
                      </h1>
                      {isVerifiedBool && (
                        <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <BadgeCheck size={14} />
                          Trusted Member
                        </span>
                      )}
                    </div>

                    {primaryCategory && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {categoriesList.map((cat: any, i: number) => (
                          <span key={i} className="inline-flex items-center text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#4F6BFF]/15 text-[#60A5FA] border border-[#4F6BFF]/30">
                            {typeof cat === "string" ? cat : cat.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 pt-1">
                      {company.website && (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#60A5FA] hover:underline font-semibold"
                        >
                          <Globe size={13} />
                          <span>{company.website.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {countryName && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{countryName}</span>
                        </span>
                      )}
                      {company.employee_count && (
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-slate-400" />
                          <span>{company.employee_count}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {company.description && (
                  <p className="text-sm text-slate-300 leading-relaxed border-t border-white/[0.06] pt-4">
                    {company.description}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Overview Card */}
            <Card className="border border-white/10 bg-[#111827] p-6 rounded-2xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Building2 size={18} className="text-[#60A5FA]" />
                Company Overview
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {company.description || "No description provided."}
              </p>

              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Top GEOs
                </h4>
                {topGeos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topGeos.map((geo: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-2 rounded-xl bg-[#4F6BFF]/20 border border-[#4F6BFF]/40 px-3.5 py-1.5 text-xs font-bold text-white">
                        <span>{getFlag(geo.code)}</span>
                        <span>{geo.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No GEOs added yet</p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Operating GEOs ({allGeos.length})
                </h4>
                {allGeos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allGeos.map((geo: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-xs text-slate-200">
                        <span>{getFlag(geo.code)}</span>
                        <span>{geo.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No GEOs added yet</p>
                )}
              </div>
            </Card>

            {/* Software Types Card */}
            <Card className="border border-white/10 bg-[#111827] p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Layers size={18} className="text-[#60A5FA]" />
                Software Solutions
              </h3>
              {softwareTypes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {softwareTypes.map((st: any, i: number) => (
                    <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-xs font-bold text-white">
                      {st.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                  No software solutions listed
                </div>
              )}
            </Card>

            {/* Services Offered Card */}
            <Card className="border border-white/10 bg-[#111827] p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Share2 size={18} className="text-[#60A5FA]" />
                Services Offered
              </h3>
              {serviceTypes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {serviceTypes.map((st: any, i: number) => (
                    <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#10B981]" />
                      <span>{st.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                  No services listed
                </div>
              )}
            </Card>

            {/* Licenses Card */}
            <Card className="border border-white/10 bg-[#111827] p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Shield size={18} className="text-[#10B981]" />
                Gaming Licenses
              </h3>
              {licenses.length > 0 ? (
                <div className="space-y-2.5">
                  {licenses.map((lic: any, i: number) => (
                    <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-[#10B981]" />
                        <div>
                          <p className="text-sm font-bold text-white">{lic.license_name || lic.name}</p>
                          <p className="text-xs text-slate-400">{lic.jurisdiction || "Global"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#10B981]">● {lic.status || "Active"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                  No licenses added
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="border border-white/10 bg-[#111827] p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Connect with {company.name}</h3>
              <p className="text-xs text-slate-400">
                Register or log in to contact this verified iGaming partner directly.
              </p>
              <Link href="/register" className="block">
                <Button className="w-full bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold rounded-xl">
                  Sign Up to Connect
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-white/15 text-white hover:bg-white/10 rounded-xl">
                  Log In
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
