"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  Mail,
  Pencil,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  ExternalLink,
  Shield,
  Upload,
  AlertCircle,
  CheckCircle2,
  Share2,
  Layers,
  Gamepad2,
  CreditCard,
  Sparkles,
  Info,
  Briefcase,
  Phone,
  Send,
  Camera,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface OptionItem {
  id: string;
  name: string;
  code?: string;
  slug?: string;
  region?: string;
  icon?: string;
  color?: string;
  country_id?: string;
}

interface ProfileData {
  user: any;
  company: {
    id: string;
    name: string;
    description: string;
    website?: string;
    logo_url?: string;
    contact_email?: string;
    founded_year?: number;
    employee_count?: string;
    revenue_range?: string;
    city?: string;
    state_region?: string;
    country_id?: string;
  } | null;
  categories: OptionItem[];
  topGeos: OptionItem[];
  allGeos: OptionItem[];
  softwareTypes: OptionItem[];
  serviceTypes: OptionItem[];
  licenses: OptionItem[];
  completion: {
    percentage: number;
    items: { key: string; label: string; completed: boolean; weight: number; href: string }[];
  };
}

// Helper to convert country code to flag emoji
function getCountryFlag(code?: string): string {
  if (!code || code.length !== 2) return "🌐";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Master Options
  const [masterCategories, setMasterCategories] = useState<OptionItem[]>([]);
  const [masterCountries, setMasterCountries] = useState<OptionItem[]>([]);
  const [masterSoftwareTypes, setMasterSoftwareTypes] = useState<OptionItem[]>([]);
  const [masterServiceTypes, setMasterServiceTypes] = useState<OptionItem[]>([]);
  const [masterLicenses, setMasterLicenses] = useState<OptionItem[]>([]);

  // Edit Mode states
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [editingGeos, setEditingGeos] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState(false);
  const [editingService, setEditingService] = useState(false);
  const [editingLicenses, setEditingLicenses] = useState(false);

  // Form draft state
  const [draftHeader, setDraftHeader] = useState({
    name: "",
    website: "",
    description: "",
    logo_url: "",
    contact_email: "",
    city: "",
    country_id: "",
  });
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([]);
  const [draftTopGeoIds, setDraftTopGeoIds] = useState<string[]>([]);
  const [draftGeoIds, setDraftGeoIds] = useState<string[]>([]);
  const [draftSoftwareTypeIds, setDraftSoftwareTypeIds] = useState<string[]>([]);
  const [draftServiceTypeIds, setDraftServiceTypeIds] = useState<string[]>([]);
  const [draftLicenseIds, setDraftLicenseIds] = useState<string[]>([]);

  // Multi-select dropdown open & search states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [topGeoWarning, setTopGeoWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileAndMasters();
  }, []);

  async function fetchProfileAndMasters() {
    setLoading(true);
    try {
      const [profRes, optionsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/master/options"),
      ]);

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
        if (profData.company) {
          setDraftHeader({
            name: profData.company.name || "",
            website: profData.company.website || "",
            description: profData.company.description || "",
            logo_url: profData.company.logo_url || "",
            contact_email: profData.company.contact_email || profData.user?.email || "",
            city: profData.company.city || "",
            country_id: profData.company.country_id || profData.company.country?.id || "",
          });
          setDraftCategoryIds((profData.categories || []).map((c: OptionItem) => c.id));
          setDraftTopGeoIds((profData.topGeos || []).map((g: OptionItem) => g.country_id || g.id));
          setDraftGeoIds((profData.allGeos || []).map((g: OptionItem) => g.country_id || g.id));
          setDraftSoftwareTypeIds((profData.softwareTypes || []).map((s: OptionItem) => s.id));
          setDraftServiceTypeIds((profData.serviceTypes || []).map((s: OptionItem) => s.id));
          setDraftLicenseIds((profData.licenses || []).map((l: OptionItem) => l.id));
        }
      }

      if (optionsRes.ok) {
        const optionsData = await optionsRes.json();
        setMasterCategories(optionsData.categories || []);
        setMasterCountries(optionsData.countries || []);
        setMasterSoftwareTypes(optionsData.softwareTypes || []);
        setMasterServiceTypes(optionsData.serviceTypes || []);
        setMasterLicenses(optionsData.licenses || []);
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSection(updatePayload: Record<string, any>, sectionName: string) {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSuccessMsg(`${sectionName} updated successfully`);
        setTimeout(() => setSuccessMsg(null), 3000);
        return true;
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to update profile");
        return false;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Logo image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setDraftHeader((prev) => ({ ...prev, logo_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter helpers
  const filterList = (items: OptionItem[], query: string) => {
    if (!query.trim()) return items;
    return items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const comp = profile?.company;
  const completionPercentage = profile?.completion?.percentage ?? 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 text-foreground">
      {/* Alert Banners */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 1. COMPANY HEADER */}
      {/* ============================================================ */}
      <Card id="header" className="overflow-hidden border border-white/[0.08] bg-[#111827]/90 shadow-2xl rounded-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo Box */}
              <div className="relative group">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6BFF] via-[#3B54E6] to-[#60A5FA] p-1 shadow-xl overflow-hidden border border-white/20">
                  {draftHeader.logo_url ? (
                    <img
                      src={draftHeader.logo_url}
                      alt={comp?.name || "Company Logo"}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-white" />
                  )}
                </div>
                {editingHeader && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <Upload className="h-6 w-6 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                )}
              </div>

              {/* Company Info */}
              <div className="space-y-1">
                {editingHeader ? (
                  <div className="space-y-3 max-w-md">
                    <input
                      type="text"
                      value={draftHeader.name}
                      onChange={(e) => setDraftHeader({ ...draftHeader, name: e.target.value })}
                      placeholder="Company Name"
                      className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-sm text-white font-bold outline-none focus:border-[#4F6BFF]"
                    />
                    <input
                      type="text"
                      value={draftHeader.website}
                      onChange={(e) => setDraftHeader({ ...draftHeader, website: e.target.value })}
                      placeholder="Website URL (e.g. https://company.com)"
                      className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
                    />
                    <input
                      type="email"
                      value={draftHeader.contact_email}
                      onChange={(e) => setDraftHeader({ ...draftHeader, contact_email: e.target.value })}
                      placeholder="Company Contact Email"
                      className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={draftHeader.city}
                        onChange={(e) => setDraftHeader({ ...draftHeader, city: e.target.value })}
                        placeholder="City (e.g. New Delhi)"
                        className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
                      />
                      <select
                        value={draftHeader.country_id}
                        onChange={(e) => setDraftHeader({ ...draftHeader, country_id: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
                      >
                        <option value="">Select Country</option>
                        {masterCountries.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={draftHeader.description}
                      onChange={(e) => setDraftHeader({ ...draftHeader, description: e.target.value })}
                      placeholder="Tell us about your company..."
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-[#080C16] px-3.5 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {comp?.name || "Company Name"}
                      </h1>
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        <CheckCircle2 size={13} className="text-[#10B981]" />
                        Verified Member
                      </span>
                    </div>

                    {comp?.website && (
                      <a
                        href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60A5FA] hover:underline pt-0.5"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{comp.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed pt-1">
                      {comp?.description || "Tell us something about your company..."}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Header Action Button */}
            <div className="shrink-0 flex items-center gap-2">
              {editingHeader ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingHeader(false);
                      setDraftHeader({
                        name: comp?.name || "",
                        website: comp?.website || "",
                        description: comp?.description || "",
                        logo_url: comp?.logo_url || "",
                        contact_email: comp?.contact_email || user?.email || "",
                        city: comp?.city || "",
                        country_id: comp?.country_id || (comp as any)?.country?.id || "",
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await saveSection(draftHeader, "Company Profile");
                      if (ok) setEditingHeader(false);
                    }}
                    disabled={saving}
                    className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingHeader(true)}
                  className="gap-2 border-white/10 hover:border-white/20 text-white hover:bg-white/[0.05]"
                >
                  <Pencil size={14} />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Quick Registration Metadata Summary Row */}
          {comp && (
            <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Primary Role</p>
                <p className="font-bold text-white truncate">
                  {(comp as any)?.business_role?.name || (profile?.categories && profile.categories[0]?.name) || "iGaming Business"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Primary Location</p>
                <p className="font-bold text-white truncate">
                  {comp.city ? `${comp.city}, ` : ""}
                  {(comp as any)?.country?.name || (comp as any)?.headquarters || "Global"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Company Size</p>
                <p className="font-bold text-white truncate">
                  {(comp as any)?.company_size?.label || comp.employee_count || "Not Specified"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Contact Email</p>
                <p className="font-bold text-[#60A5FA] truncate">
                  {comp.contact_email || user?.email || "N/A"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 2. PROFILE COMPLETION PROGRESS BAR */}
      {/* ============================================================ */}
      <Card className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#60A5FA]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Finish your profile to boost your visibility
              </h2>
            </div>
            <span className="text-sm font-black text-[#10B981] font-mono">
              {completionPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-[#1E293B] overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#4F6BFF] via-[#60A5FA] to-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            />
          </div>

          {/* Completion Pills Checklist */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {profile?.completion?.items.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                  item.completed
                    ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                    : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20"
                }`}
              >
                {item.completed ? (
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                )}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 2.5. CONTACT INFORMATION */}
      {/* ============================================================ */}
      {(() => {
        const userObj = profile?.user || user;
        const hasContactInfo = Boolean(
          userObj?.email || comp?.contact_email || userObj?.phone || userObj?.telegram_id || userObj?.instagram || userObj?.discord
        );
        if (!hasContactInfo) return null;

        return (
          <Card id="contact-info" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#60A5FA]" />
                  <h3 className="text-sm font-bold text-white">Contact Information</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email */}
                {(userObj?.email || comp?.contact_email) && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4F6BFF]/15 text-[#60A5FA]">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Email</p>
                      <p className="text-xs font-bold text-white truncate">{userObj?.email || comp?.contact_email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {userObj?.phone && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981]">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Phone</p>
                      <p className="text-xs font-bold text-white truncate">{userObj.phone}</p>
                    </div>
                  </div>
                )}

                {/* Telegram */}
                {userObj?.telegram_id && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22C1DC]/15 text-[#22C1DC]">
                      <Send size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Telegram</p>
                      <p className="text-xs font-bold text-white truncate">{userObj.telegram_id}</p>
                    </div>
                  </div>
                )}

                {/* Instagram (Optional) */}
                {userObj?.instagram && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E1306C]/15 text-[#E1306C]">
                      <Camera size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Instagram</p>
                      <p className="text-xs font-bold text-white truncate">{userObj.instagram}</p>
                    </div>
                  </div>
                )}

                {/* Discord (Optional) */}
                {userObj?.discord && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/15 text-[#5865F2]">
                      <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Discord</p>
                      <p className="text-xs font-bold text-white truncate">{userObj.discord}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ============================================================ */}
      {/* 3. BUSINESS CATEGORIES */}
      {/* ============================================================ */}
      <Card id="categories" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white">Business Category</h3>
            </div>
            {editingCategories ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCategories(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await saveSection({ category_ids: draftCategoryIds }, "Business Category");
                    if (ok) setEditingCategories(false);
                  }}
                  disabled={saving}
                  className="bg-[#4F6BFF] text-white font-bold"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingCategories(true)} className="text-xs text-[#94A3B8] hover:text-white">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingCategories ? (
            <div className="space-y-3">
              <p className="text-xs text-[#94A3B8]">Select one or multiple primary business categories:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {masterCategories.map((cat) => {
                  const selected = draftCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDraftCategoryIds((prev) =>
                          prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                        );
                      }}
                      className={`flex items-center justify-between rounded-xl p-3 text-xs font-bold border transition-all text-left ${
                        selected
                          ? "bg-[#4F6BFF]/20 border-[#4F6BFF] text-white"
                          : "bg-[#080C16] border-white/10 text-[#94A3B8] hover:border-white/20"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {selected && <Check className="h-4 w-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.categories && profile.categories.length > 0 ? (
                profile.categories.map((cat) => (
                  <span key={cat.id} className="rounded-xl bg-[#4F6BFF]/15 border border-[#4F6BFF]/30 px-3 py-1.5 text-xs font-bold text-[#60A5FA]">
                    {cat.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic">No business categories selected.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 4. GEOs (TOP GEOs MAX 5 + ALL GEOs) */}
      {/* ============================================================ */}
      <Card id="geos" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white">GEOs (Operating Markets)</h3>
            </div>
            {editingGeos ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingGeos(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await saveSection({ top_geo_ids: draftTopGeoIds, geo_ids: draftGeoIds }, "GEOs");
                    if (ok) setEditingGeos(false);
                  }}
                  disabled={saving}
                  className="bg-[#4F6BFF] text-white font-bold"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingGeos(true)} className="text-xs text-[#94A3B8] hover:text-white">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {/* Validation Warning for 6th Top GEO attempt */}
          {topGeoWarning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <AlertCircle size={15} />
              <span>{topGeoWarning}</span>
            </div>
          )}

          {editingGeos ? (
            <div className="space-y-5">
              {/* TOP GEOs EDIT MODE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Top GEOs (up to 5)</span>
                  <span className="text-[#94A3B8] font-normal">{draftTopGeoIds.length} / 5</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#080C16] border border-white/10 min-h-[50px] items-center">
                  {draftTopGeoIds.map((id, index) => {
                    const country = masterCountries.find((c) => c.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F6BFF]/20 border border-[#4F6BFF]/40 px-3 py-1 text-xs font-bold text-white">
                        <span>{getCountryFlag(country?.code)}</span>
                        <span>{country?.name || id}</span>
                        <button
                          type="button"
                          onClick={() => setDraftTopGeoIds((prev) => prev.filter((gId) => gId !== id))}
                          className="text-[#94A3B8] hover:text-white ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  {draftTopGeoIds.length < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(openDropdown === "topGeos" ? null : "topGeos");
                        setSearchQuery("");
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-dashed border-white/20 px-3 py-1 text-xs font-semibold text-[#94A3B8] hover:text-white hover:border-white/40"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Top GEO
                    </button>
                  )}
                </div>

                {/* Top GEO Search Dropdown */}
                {openDropdown === "topGeos" && (
                  <div className="p-3 rounded-xl bg-[#151C2C] border border-white/10 space-y-2 shadow-2xl">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search country..."
                        className="w-full rounded-lg border border-white/10 bg-[#080C16] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#4F6BFF]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
                      {filterList(masterCountries, searchQuery).map((country) => {
                        const isTop = draftTopGeoIds.includes(country.id);
                        return (
                          <button
                            key={country.id}
                            type="button"
                            onClick={() => {
                              if (isTop) {
                                setDraftTopGeoIds((prev) => prev.filter((id) => id !== country.id));
                              } else {
                                if (draftTopGeoIds.length >= 5) {
                                  setTopGeoWarning("Maximum 5 reached — remove one to swap");
                                  setTimeout(() => setTopGeoWarning(null), 4000);
                                  return;
                                }
                                setDraftTopGeoIds((prev) => [...prev, country.id]);
                              }
                            }}
                            className="flex w-full items-center justify-between p-2 text-xs text-left hover:bg-white/[0.05] text-[#94A3B8] hover:text-white"
                          >
                            <span className="flex items-center gap-2">
                              <span>{getCountryFlag(country.code)}</span>
                              <span>{country.name}</span>
                            </span>
                            {isTop && <Check className="h-4 w-4 text-[#60A5FA]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ALL GEOs EDIT MODE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">All Operating GEOs</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#080C16] border border-white/10 min-h-[50px] items-center">
                  {draftGeoIds.map((id) => {
                    const country = masterCountries.find((c) => c.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] border border-white/10 px-3 py-1 text-xs font-semibold text-[#F8FAFC]">
                        <span>{getCountryFlag(country?.code)}</span>
                        <span>{country?.name || id}</span>
                        <button
                          type="button"
                          onClick={() => setDraftGeoIds((prev) => prev.filter((gId) => gId !== id))}
                          className="text-[#94A3B8] hover:text-white ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(openDropdown === "allGeos" ? null : "allGeos");
                      setSearchQuery("");
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-dashed border-white/20 px-3 py-1 text-xs font-semibold text-[#94A3B8] hover:text-white hover:border-white/40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Select GEOs
                  </button>
                </div>

                {/* All GEOs Multi-Select Dropdown */}
                {openDropdown === "allGeos" && (
                  <div className="p-3 rounded-xl bg-[#151C2C] border border-white/10 space-y-2 shadow-2xl">
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search countries..."
                          className="w-full rounded-lg border border-white/10 bg-[#080C16] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#4F6BFF]"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDraftGeoIds([])} className="text-xs text-[#EF4444]">
                        Clear all
                      </Button>
                      <Button size="sm" onClick={() => setOpenDropdown(null)} className="bg-[#4F6BFF] text-xs text-white">
                        Done
                      </Button>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
                      {filterList(masterCountries, searchQuery).map((country) => {
                        const selected = draftGeoIds.includes(country.id);
                        return (
                          <button
                            key={country.id}
                            type="button"
                            onClick={() => {
                              setDraftGeoIds((prev) =>
                                prev.includes(country.id) ? prev.filter((id) => id !== country.id) : [...prev, country.id]
                              );
                            }}
                            className="flex w-full items-center justify-between p-2 text-xs text-left hover:bg-white/[0.05] text-[#94A3B8] hover:text-white"
                          >
                            <span className="flex items-center gap-2">
                              <span>{getCountryFlag(country.code)}</span>
                              <span>{country.name}</span>
                            </span>
                            {selected && <Check className="h-4 w-4 text-[#60A5FA]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TOP GEOs DISPLAY */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Top GEOs</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.topGeos && profile.topGeos.length > 0 ? (
                    profile.topGeos.map((geo) => (
                      <span key={geo.id} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F6BFF]/20 to-[#3B54E6]/20 border border-[#4F6BFF]/40 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                        <span className="text-sm">{getCountryFlag(geo.code)}</span>
                        <span>{geo.name}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] italic">No top GEOs selected.</p>
                  )}
                </div>
              </div>

              {/* ALL GEOs DISPLAY */}
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">All GEOs</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.allGeos && profile.allGeos.length > 0 ? (
                    profile.allGeos.map((geo) => (
                      <span key={geo.id} className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-xs font-semibold text-[#F8FAFC]">
                        <span>{getCountryFlag(geo.code)}</span>
                        <span>{geo.name}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] italic">No operating GEOs selected.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 5. SOFTWARE TYPE */}
      {/* ============================================================ */}
      <Card id="software-types" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white">Software Type</h3>
            </div>
            {editingSoftware ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingSoftware(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await saveSection({ software_type_ids: draftSoftwareTypeIds }, "Software Type");
                    if (ok) setEditingSoftware(false);
                  }}
                  disabled={saving}
                  className="bg-[#4F6BFF] text-white font-bold"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingSoftware(true)} className="text-xs text-[#94A3B8] hover:text-white">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingSoftware ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">Select software solutions offered:</span>
                <Button variant="ghost" size="sm" onClick={() => setDraftSoftwareTypeIds([])} className="text-xs text-[#EF4444]">
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {masterSoftwareTypes.map((item) => {
                  const selected = draftSoftwareTypeIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDraftSoftwareTypeIds((prev) =>
                          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`flex items-center justify-between rounded-xl p-3 text-xs font-bold border transition-all ${
                        selected
                          ? "bg-[#4F6BFF]/20 border-[#4F6BFF] text-white"
                          : "bg-[#080C16] border-white/10 text-[#94A3B8] hover:border-white/20"
                      }`}
                    >
                      <span>{item.name}</span>
                      {selected && <Check className="h-4 w-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.softwareTypes && profile.softwareTypes.length > 0 ? (
                profile.softwareTypes.map((item) => (
                  <span key={item.id} className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-[#F8FAFC]">
                    {item.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic">No software types selected.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 6. SERVICE TYPE */}
      {/* ============================================================ */}
      <Card id="service-types" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Share2 className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white">Service Type</h3>
            </div>
            {editingService ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingService(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await saveSection({ service_type_ids: draftServiceTypeIds }, "Service Type");
                    if (ok) setEditingService(false);
                  }}
                  disabled={saving}
                  className="bg-[#4F6BFF] text-white font-bold"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingService(true)} className="text-xs text-[#94A3B8] hover:text-white">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingService ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">Select B2B service offerings:</span>
                <Button variant="ghost" size="sm" onClick={() => setDraftServiceTypeIds([])} className="text-xs text-[#EF4444]">
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {masterServiceTypes.map((item) => {
                  const selected = draftServiceTypeIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDraftServiceTypeIds((prev) =>
                          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`flex items-center justify-between rounded-xl p-3 text-xs font-bold border transition-all ${
                        selected
                          ? "bg-[#4F6BFF]/20 border-[#4F6BFF] text-white"
                          : "bg-[#080C16] border-white/10 text-[#94A3B8] hover:border-white/20"
                      }`}
                    >
                      <span>{item.name}</span>
                      {selected && <Check className="h-4 w-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.serviceTypes && profile.serviceTypes.length > 0 ? (
                profile.serviceTypes.map((item) => (
                  <span key={item.id} className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-[#F8FAFC]">
                    {item.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic">No service types selected.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 7. LICENSES */}
      {/* ============================================================ */}
      <Card id="licenses" className="border border-white/[0.08] bg-[#111827]/90 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white">Gaming Licenses</h3>
            </div>
            {editingLicenses ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingLicenses(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await saveSection({ license_ids: draftLicenseIds }, "Licenses");
                    if (ok) setEditingLicenses(false);
                  }}
                  disabled={saving}
                  className="bg-[#4F6BFF] text-white font-bold"
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingLicenses(true)} className="text-xs text-[#94A3B8] hover:text-white">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingLicenses ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">Select active gaming licenses:</span>
                <Button variant="ghost" size="sm" onClick={() => setDraftLicenseIds([])} className="text-xs text-[#EF4444]">
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {masterLicenses.map((lic) => {
                  const selected = draftLicenseIds.includes(lic.id);
                  return (
                    <button
                      key={lic.id}
                      type="button"
                      onClick={() => {
                        setDraftLicenseIds((prev) =>
                          prev.includes(lic.id) ? prev.filter((id) => id !== lic.id) : [...prev, lic.id]
                        );
                      }}
                      className={`flex items-center justify-between rounded-xl p-3 text-xs font-bold border transition-all text-left ${
                        selected
                          ? "bg-[#4F6BFF]/20 border-[#4F6BFF] text-white"
                          : "bg-[#080C16] border-white/10 text-[#94A3B8] hover:border-white/20"
                      }`}
                    >
                      <span>{lic.name}</span>
                      {selected && <Check className="h-4 w-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.licenses && profile.licenses.length > 0 ? (
                profile.licenses.map((lic) => (
                  <span key={lic.id} className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-[#F8FAFC]">
                    {lic.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-[#64748B] italic">No licenses selected.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
