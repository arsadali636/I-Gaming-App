"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  UserPlus,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  MapPin,
  Globe,
  Calendar,
  Users,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Pencil,
  CheckCircle2,
  Circle,
  Building2,
  Layers,
  Share2,
  Shield,
  Briefcase,
  Sparkles,
  Zap,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import type { CompanyContact } from "@/types";
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

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { wallet, refreshWallet } = useAuth();
  const [company, setCompany] = useState<any | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [licensesState, setLicensesState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [revealingContactId, setRevealingContactId] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealSuccess, setRevealSuccess] = useState<string | null>(null);
  const [revealCost] = useState(1);

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        let data: any = null;
        try {
          const res = await fetch(`/api/companies/${encodeURIComponent(id)}`);
          if (res.ok) data = await res.json();
        } catch {}

        if (data) {
          const compObj = data.company ?? data;
          setCompany(compObj);
          const compId = compObj.id || id;
          const compSlug = compObj.slug || id;

          if (compObj.contacts && Array.isArray(compObj.contacts)) {
            setContacts(compObj.contacts);
          } else if (compObj.company_contacts && Array.isArray(compObj.company_contacts)) {
            setContacts(compObj.company_contacts);
          } else {
            try {
              const cData = await apiClient.get<any>(`/api/v1/companies/${compSlug}/contacts/`);
              setContacts(Array.isArray(cData) ? cData : cData.contacts || []);
            } catch {}
          }

          if (compObj.licenses && Array.isArray(compObj.licenses)) {
            setLicensesState(compObj.licenses);
          } else {
            try {
              const lData = await apiClient.get<any>(`/api/v1/companies/${compSlug}/licenses/`);
              setLicensesState(Array.isArray(lData) ? lData : lData.licenses || []);
            } catch {}
          }

          // Check saved companies
          try {
            const savedRes = await apiClient.get<any>("/api/v1/saved-companies/");
            const list = Array.isArray(savedRes) ? savedRes : savedRes.results ?? [];
            const found = list.find(
              (item: any) =>
                item.company === compId ||
                item.company_detail?.id === compId ||
                item.company_detail?.slug === compSlug
            );
            if (found) {
              setSaved(true);
              setSavedRecordId(found.id);
            } else {
              setSaved(false);
              setSavedRecordId(null);
            }
          } catch {}
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchCompanyData();
  }, [id]);

  const handleToggleSave = async () => {
    if (!company) return;
    const wasSaved = saved;
    const currentRecordId = savedRecordId;

    if (wasSaved && currentRecordId) {
      setSaved(false);
      setSavedRecordId(null);
      try {
        await apiClient.delete(`/api/v1/saved-companies/${currentRecordId}/`);
      } catch {
        setSaved(true);
        setSavedRecordId(currentRecordId);
      }
    } else {
      setSaved(true);
      try {
        const res = await apiClient.post<any>("/api/v1/saved-companies/", {
          company: company.id,
        });
        if (res && res.id) {
          setSavedRecordId(res.id);
        }
      } catch (err: any) {
        if (err?.status === 400) {
          try {
            const savedRes = await apiClient.get<any>("/api/v1/saved-companies/");
            const list = Array.isArray(savedRes) ? savedRes : savedRes.results ?? [];
            const found = list.find(
              (item: any) =>
                item.company === company.id || item.company_detail?.id === company.id
            );
            if (found) {
              setSaved(true);
              setSavedRecordId(found.id);
              return;
            }
          } catch {}
        }
        setSaved(false);
      }
    }
  };

  const handleRevealContact = async (contactId: string) => {
    setRevealingContactId(contactId);
    setRevealError(null);
    setRevealSuccess(null);

    try {
      const res = await apiClient.post<any>("/api/v1/contacts/reveal/", {
        contact_id: contactId,
      });

      const updatedDetail = res.company_contact_detail || res.contact || res;
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                email: updatedDetail.email || c.email,
                phone: updatedDetail.phone || c.phone,
                is_unlocked: true,
              }
            : c
        )
      );
      setRevealSuccess("Contact revealed successfully!");
      if (refreshWallet) refreshWallet();
    } catch (err: any) {
      if (err?.status === 402) {
        setRevealError("Insufficient contact credits. Please purchase additional credits.");
      } else if (err?.status === 403) {
        setRevealError("An active subscription is required to reveal contact details.");
      } else {
        setRevealError(err?.data?.error || "Failed to reveal contact.");
      }
    } finally {
      setRevealingContactId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl bg-slate-800" />
            <Skeleton className="h-64 w-full rounded-2xl bg-slate-800" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 bg-[#111827]/40 rounded-3xl border border-white/10 max-w-2xl mx-auto">
        <Building2 size={48} className="mx-auto text-slate-500 mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Company Not Found</h3>
        <p className="text-sm text-slate-400 mb-6">
          The requested company profile does not exist or has been removed.
        </p>
        <Link href="/app/marketplace">
          <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
            <ArrowLeft size={16} /> Return to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const isVerifiedBool = Boolean(company.is_verified);
  const isOwner = Boolean(company.isOwner);
  const completionPercentage = company.completionPercentage ?? 0;
  
  const categoriesList = normalizeList(company.categories || company.category);
  const primaryCategory = categoriesList.length > 0 ? categoriesList[0].name : null;
  const topGeos = normalizeList(company.topGeos || company.top_geos);
  const allGeos = normalizeList(company.allGeos || company.all_geos || company.geos);
  const softwareTypes = normalizeList(company.softwareTypes || company.software_types || company.products || company.company_products);
  const serviceTypes = normalizeList(company.serviceTypes || company.service_types || company.services || company.company_services);
  const licenses = normalizeList(company.licenses || licensesState || company.company_licenses || company.license_links);
  
  const countryObj = company.country;
  const rawCountryName = typeof countryObj === "string" ? countryObj : countryObj?.name || countryObj?.code || company.headquarters || "";
  const displayCity = company.city;
  const displayLocation = displayCity && rawCountryName ? `${displayCity}, ${rawCountryName}` : displayCity || rawCountryName || "";
  const contactEmail = company.contact_email || company.owner_email || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Link href="/app/profile">
              <Button size="sm" className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold gap-1.5 shadow-md">
                <Pencil size={14} />
                <span>Edit Profile</span>
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSave}
            className="gap-1.5 border-white/15 text-slate-200 hover:bg-white/10"
          >
            {saved ? <BookmarkCheck size={15} className="text-[#4F6BFF]" /> : <Bookmark size={15} />}
            <span>{saved ? "Saved" : "Save Company"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Alert Notifications */}
      {revealError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{revealError}</span>
          </div>
          {revealError.includes("credits") && (
            <Link href="/app/subscription">
              <Button size="sm" variant="outline" className="border-rose-400 text-rose-200 hover:bg-rose-500/20">
                Buy Credits
              </Button>
            </Link>
          )}
        </div>
      )}

      {revealSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{revealSuccess}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Central Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. HERO COMPANY HEADER CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border border-white/10 bg-[#111827] shadow-2xl rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-white/15 bg-[#080C16] shrink-0 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg">
                        {getInitials(company.name)}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {company.name}
                        </h1>
                        {isVerifiedBool && (
                          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            <BadgeCheck size={14} className="text-[#10B981]" />
                            Trusted Member
                          </span>
                        )}
                      </div>

                      {primaryCategory && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {categoriesList.map((cat: any, i: number) => {
                            const catName = typeof cat === "string" ? cat : cat.name;
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#4F6BFF]/15 text-[#60A5FA] border border-[#4F6BFF]/30"
                              >
                                {catName}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 pt-1">
                        {company.website && (
                          <a
                            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[#60A5FA] hover:underline font-semibold"
                          >
                            <Globe size={13} />
                            <span>{company.website.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {displayLocation && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{displayLocation}</span>
                          </span>
                        )}
                        {contactEmail && (
                          <a
                            href={`mailto:${contactEmail}`}
                            className="flex items-center gap-1 text-slate-300 hover:text-[#60A5FA] font-semibold"
                          >
                            <Mail size={13} className="text-slate-400" />
                            <span>{contactEmail}</span>
                          </a>
                        )}
                        {company.employee_count && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Users size={13} className="text-slate-400" />
                            <span>{company.employee_count}</span>
                          </span>
                        )}
                        {company.founded_year && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Calendar size={13} className="text-slate-400" />
                            <span>Founded {company.founded_year}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Description */}
                {company.description && (
                  <p className="text-sm text-slate-300 leading-relaxed border-t border-white/[0.06] pt-4">
                    {company.description}
                  </p>
                )}

                {/* Primary Actions Row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-[#4F6BFF]/25">
                    <UserPlus size={16} />
                    <span>Connect</span>
                  </Button>
                  <Button variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10 gap-2 px-5 py-2.5 rounded-xl">
                    <MessageSquare size={16} />
                    <span>Message</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleSave}
                    className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10 gap-2 px-4 py-2.5 rounded-xl"
                  >
                    {saved ? <BookmarkCheck size={16} className="text-[#4F6BFF]" /> : <Bookmark size={16} />}
                    <span>{saved ? "Saved" : "Save"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. OVERVIEW SECTION (ABOUT, CATEGORIES & GEOS) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 size={18} className="text-[#60A5FA]" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* About Paragraph */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    About {company.name}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {company.description || "No detailed description provided."}
                  </p>
                </div>

                {/* Top GEOs Section */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Globe size={14} className="text-[#60A5FA]" />
                    Top Target Markets (Top GEOs)
                  </h4>
                  {topGeos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topGeos.map((geo: any, i: number) => (
                        <span
                          key={geo.id || i}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F6BFF]/20 to-[#3B54E6]/20 border border-[#4F6BFF]/40 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                        >
                          <span className="text-sm">{getFlag(geo.code)}</span>
                          <span>{geo.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No GEOs added yet</p>
                  )}
                </div>

                {/* All Operating GEOs Section */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    All Operating GEOs ({allGeos.length})
                  </h4>
                  {allGeos.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                      {allGeos.map((geo: any, i: number) => (
                        <span
                          key={geo.id || i}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-200"
                        >
                          <span>{getFlag(geo.code)}</span>
                          <span>{geo.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No GEOs added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. PRODUCTS & SOFTWARE TYPES SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#60A5FA]" />
                  Products & Technology (Software Solutions)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {softwareTypes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {softwareTypes.map((st: any, i: number) => (
                      <div
                        key={st.id || i}
                        className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 flex items-center gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#4F6BFF]/15 border border-[#4F6BFF]/30 flex items-center justify-center text-[#60A5FA] shrink-0 font-bold text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{st.name}</p>
                          <p className="text-[10px] text-slate-400">Software Solution</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                    No software solutions listed
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 4. SERVICES SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 size={18} className="text-[#60A5FA]" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {serviceTypes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {serviceTypes.map((st: any, i: number) => (
                      <div
                        key={st.id || i}
                        className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 flex items-center gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0 font-bold text-xs">
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{st.name}</p>
                          <p className="text-[10px] text-slate-400">B2B Service</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                    No services listed
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 5. GAMING LICENSES & COMPLIANCE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Shield size={18} className="text-[#10B981]" />
                  Gaming Licenses & Compliance ({licenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {licenses.length > 0 ? (
                  licenses.map((lic: any, i: number) => (
                    <div
                      key={lic.id || i}
                      className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{lic.license_name || lic.name}</p>
                          <p className="text-xs text-slate-400">
                            {lic.jurisdiction || "Global Jurisdiction"}
                            {lic.license_number && ` • Lic. #${lic.license_number}`}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        ● {lic.status || "Active"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold text-slate-400 italic">
                    No licenses added
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 6. CONTACTS & DECISION MAKERS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-[#60A5FA]" />
                  Key Contacts & Decision Makers ({contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {contacts.length === 0 ? (
                  <div className="py-8 text-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Users size={32} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">No public contacts specified yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => {
                      const isMasked = contact.email?.includes("***") || (!contact.email && !contact.phone);
                      const isRevealing = revealingContactId === contact.id;

                      return (
                        <div
                          key={contact.id}
                          className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F6BFF] to-[#3B54E6] border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(contact.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{contact.full_name}</p>
                              <p className="text-xs text-slate-400">{contact.position || "Representative"}</p>
                            </div>
                          </div>

                          <div>
                            {!isMasked ? (
                              <div className="flex flex-col sm:items-end">
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-xs font-semibold text-[#60A5FA] hover:underline"
                                >
                                  {contact.email}
                                </a>
                                {contact.phone && (
                                  <a href={`tel:${contact.phone}`} className="text-xs text-slate-400 hover:text-white">
                                    {contact.phone}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isRevealing}
                                onClick={() => handleRevealContact(contact.id)}
                                className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white text-xs font-bold gap-1.5 rounded-xl shadow-md"
                              >
                                {isRevealing ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Eye size={13} />
                                )}
                                <span>Reveal Details</span>
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px]">
                                  1 Credit
                                </span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-3">
                <CardTitle className="text-sm font-bold text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5">
                <Button className="w-full bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold gap-2 rounded-xl py-2.5 shadow-md">
                  <UserPlus size={16} />
                  <span>Connect with Company</span>
                </Button>
                <Button variant="outline" className="w-full border-white/15 bg-white/[0.04] text-white hover:bg-white/10 gap-2 rounded-xl py-2.5">
                  <MessageSquare size={16} />
                  <span>Send Direct Message</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleSave}
                  className="w-full border-white/15 bg-white/[0.04] text-white hover:bg-white/10 gap-2 rounded-xl py-2.5"
                >
                  {saved ? <BookmarkCheck size={16} className="text-[#4F6BFF]" /> : <Bookmark size={16} />}
                  <span>{saved ? "Saved in Bookmarks" : "Save Company"}</span>
                </Button>

                {isOwner && (
                  <Link href="/app/profile" className="block pt-2">
                    <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/15 text-white font-bold gap-2 rounded-xl py-2.5">
                      <Pencil size={15} />
                      <span>Edit Profile</span>
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Dynamic Profile Strength Card */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-[#10B981]" />
                  Profile Strength
                </CardTitle>
                <span className="text-sm font-black font-mono text-[#10B981]">
                  {completionPercentage}%
                </span>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-[#1E293B] overflow-hidden p-0.5">
                  <div
                    style={{ width: `${completionPercentage}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#4F6BFF] via-[#60A5FA] to-[#10B981] transition-all duration-700"
                  />
                </div>

                {/* Breakdown List */}
                {company.completionItems && company.completionItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Completion Breakdown
                    </p>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {company.completionItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-300">
                            {item.completed ? (
                              <CheckCircle2 size={13} className="text-[#10B981]" />
                            ) : (
                              <Circle size={13} className="text-slate-600" />
                            )}
                            <span className={item.completed ? "text-white font-medium" : "text-slate-400"}>
                              {item.label}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            +{item.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Credits Balance Box */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-white/10 bg-[#111827] shadow-xl rounded-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-[#4F6BFF]" />
                  Contact Credits Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-3xl font-black text-white">{wallet?.balance ?? 0}</p>
                <p className="text-xs text-slate-400">Available credits to reveal decision makers</p>
                <Link href="/app/subscription" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full border-white/15 text-slate-200 hover:bg-white/10 gap-1.5">
                    <CreditCard size={14} /> Buy Additional Credits
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
