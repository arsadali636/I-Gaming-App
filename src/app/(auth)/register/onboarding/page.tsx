"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  X,
  Calendar,
  Users,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Star,
  Zap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types";
import { apiClient } from "@/lib/api-client";

interface OnboardingData {
  accountType: "affiliate" | "operator" | "provider";
  companyName: string;
  website: string;
  attendEvent: boolean;
  eventChoice: string;
  logoUrl: string | null;
  contactEmail: string;
  whatsapp: string;
  telegram: string;
  aboutCompany: string;
  category_ids: string[];
}

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Company Details" },
  { id: 3, label: "Event Preference" },
  { id: 4, label: "Contact & Profile" },
  { id: 5, label: "Complete" },
];

const ACCOUNT_TYPES = [
  {
    id: "affiliate",
    title: "Affiliate / Publisher",
    icon: Users,
    description: "Drive traffic, promote operators, and analyze performance networks.",
  },
  {
    id: "operator",
    title: "Operator / Casino",
    icon: Building2,
    description: "Manage online gaming brands, acquire traffic, and source B2B providers.",
  },
  {
    id: "provider",
    title: "B2B Technology Provider",
    icon: Briefcase,
    description: "Provide games, platform solutions, payments, compliance, or marketing services.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2); // Step 1 Account is completed upon registration
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState<OnboardingData>({
    accountType: "operator",
    companyName: "",
    website: "",
    attendEvent: true,
    eventChoice: "iGB LIVE 2026 / NEXT.io London Summit",
    logoUrl: null,
    contactEmail: "",
    whatsapp: "",
    telegram: "",
    aboutCompany: "",
    category_ids: [],
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        } else {
          const data = await apiClient.get<any>("/api/v1/categories/");
          setCategories(Array.isArray(data) ? data : data.categories || []);
        }
      } catch {
        try {
          const data = await apiClient.get<any>("/api/v1/categories/");
          setCategories(Array.isArray(data) ? data : data.categories || []);
        } catch {}
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const updateField = useCallback((field: keyof OnboardingData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        updateField("logoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    updateField("logoUrl", null);
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 2) {
      if (!form.companyName.trim()) {
        newErrors.companyName = "Company name is required.";
      }
      if (form.website.trim() && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(form.website.trim())) {
        newErrors.website = "Please enter a valid website URL (e.g. https://company.com).";
      }
    }

    if (stepNum === 4) {
      if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        newErrors.contactEmail = "Please enter a valid contact email.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(5, s + 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(2, s - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const company = await apiClient.post<any>("/api/v1/companies/", {
        name: form.companyName || "My iGaming Company",
        description: form.aboutCompany || `${form.accountType.toUpperCase()} partner on iGaming Connect.`,
        website: form.website || undefined,
        logo_url: form.logoUrl || undefined,
        categories: form.category_ids,
      });

      if (company && company.id && (form.contactEmail || form.whatsapp || form.telegram)) {
        try {
          await apiClient.post(`/api/v1/companies/${company.id}/contacts/`, {
            full_name: "Primary Contact",
            position: "Representative",
            email: form.contactEmail || "contact@company.com",
            phone: form.whatsapp || undefined,
          });
        } catch {}
      }

      router.push("/app");
      router.refresh();
    } catch {
      router.push("/app");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B14] text-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(79,70,229,0.12)] border border-[rgba(79,70,229,0.20)] text-xs font-semibold text-[#A5B4FC]">
            <Sparkles size={14} className="text-[#22C1DC]" />
            <span>Enterprise Onboarding</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Setup Your Company Profile
          </h1>
          <p className="text-[#A1A9B8] text-sm max-w-md mx-auto">
            Complete a few quick steps to verify your brand and start connecting.
          </p>
        </div>

        {/* Multi-Step Progress Bar System */}
        <div className="rounded-xl bg-[#111522] border border-[#252A3A] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[#A1A9B8]">
              Step <strong className="text-[#F8FAFC]">{currentStep}</strong> of 5
            </span>
            <span className="text-xs font-semibold text-[#4F46E5]">
              {STEPS.find((s) => s.id === currentStep)?.label}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((s) => {
              const isCompleted = s.id < currentStep;
              const isCurrent = s.id === currentStep;

              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-2 w-full rounded-full transition-all duration-200 ${
                      isCompleted
                        ? "bg-[#22C1DC]"
                        : isCurrent
                        ? "bg-[#4F46E5]"
                        : "bg-[#252A3A]"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium hidden sm:block truncate ${
                      isCompleted
                        ? "text-[#22C1DC]"
                        : isCurrent
                        ? "text-[#F8FAFC] font-semibold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Card Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-[#111522] border border-[#252A3A] p-6 sm:p-8 space-y-6"
          >
            {/* STEP 2: COMPANY DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Building2 className="text-[#4F46E5]" size={20} />
                    Company Details
                  </h2>
                  <p className="text-xs text-[#A1A9B8] mt-1">
                    Select your primary account category and enter basic company info.
                  </p>
                </div>

                {/* Account Type Selection Cards */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                    Select Account Type *
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const isSelected = form.accountType === type.id;
                      const IconComp = type.icon;

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateField("accountType", type.id)}
                          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-[#4F46E5] bg-[rgba(79,70,229,0.12)]"
                              : "border-[#252A3A] bg-[#0D101C] hover:border-[#343B52] hover:bg-[#171B2B]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  isSelected
                                    ? "bg-[#4F46E5]/20 text-[#4F46E5]"
                                    : "bg-[#171B2B] text-[#A1A9B8]"
                                }`}
                              >
                                <IconComp size={18} />
                              </div>
                              {isSelected && <CheckCircle2 size={16} className="text-[#4F46E5]" />}
                            </div>
                            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                              {type.title}
                            </h3>
                            <p className="text-[11px] text-[#A1A9B8] leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="companyName" className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                      Company / Brand Name *
                    </Label>
                    <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                      <Info size={12} /> Official trading name
                    </span>
                  </div>
                  <Input
                    id="companyName"
                    placeholder="e.g. Apex Gaming Group"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className={`h-10 rounded-lg border-[#252A3A] bg-[#111522] text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 ${
                      errors.companyName ? "border-[#EF4444]" : ""
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.companyName}</p>
                  )}
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                    Website URL
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <Input
                      id="website"
                      placeholder="https://company.com"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      className={`h-10 rounded-lg border-[#252A3A] bg-[#111522] pl-10 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 ${
                        errors.website ? "border-[#EF4444]" : ""
                      }`}
                    />
                  </div>
                  {errors.website ? (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.website}</p>
                  ) : (
                    <p className="text-[11px] text-[#6B7280]">Accepted formats: https://domain.com or www.domain.com</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: EVENT PREFERENCE */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Calendar className="text-[#22C1DC]" size={20} />
                    Event & Conference Preference
                  </h2>
                  <p className="text-xs text-[#A1A9B8] mt-1">
                    Connect with partners attending upcoming major iGaming summits.
                  </p>
                </div>

                {/* Featured Event Card */}
                <div className="rounded-xl bg-[#0D101C] border border-[#252A3A] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#22C1DC]/10 border border-[#22C1DC]/20 text-[11px] font-semibold text-[#22C1DC]">
                      <Star size={12} className="fill-[#22C1DC]" /> Featured iGaming Summit
                    </span>
                    <span className="text-[11px] text-[#A1A9B8] flex items-center gap-1">
                      <MapPin size={12} /> ExCeL London, UK
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F8FAFC]">
                      iGB LIVE 2026 / NEXT.io London Summit
                    </h3>
                    <p className="text-xs text-[#A1A9B8] mt-1 leading-relaxed">
                      Connect with over 10,000+ iGaming operators, affiliates, and technology providers worldwide.
                    </p>
                  </div>

                  {/* Yes / No Segmented Control */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold text-[#A1A9B8]">
                      Are you attending this event?
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateField("attendEvent", false)}
                        className={`py-2.5 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          !form.attendEvent
                            ? "border-[#343B52] bg-[#171B2B] text-[#F8FAFC]"
                            : "border-[#252A3A] bg-[#111522] text-[#A1A9B8] hover:bg-[#171B2B]"
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("attendEvent", true)}
                        className={`py-2.5 px-4 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          form.attendEvent
                            ? "border-[#4F46E5] bg-[rgba(79,70,229,0.12)] text-[#F8FAFC]"
                            : "border-[#252A3A] bg-[#111522] text-[#A1A9B8] hover:bg-[#171B2B]"
                        }`}
                      >
                        <Check size={14} /> Yes, I&apos;m Attending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CONTACT & PROFILE DETAILS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Users className="text-[#4F46E5]" size={20} />
                    Contact & Company Profile
                  </h2>
                  <p className="text-xs text-[#A1A9B8] mt-1">
                    Provide brand graphics and messaging for your marketplace profile.
                  </p>
                </div>

                {/* SECTION 1: COMPANY IDENTITY */}
                <div className="space-y-3 rounded-xl bg-[#0D101C] border border-[#252A3A] p-4">
                  <h3 className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                    1. Company Identity & Logo
                  </h3>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="h-16 w-16 rounded-lg object-cover border border-[#252A3A] bg-[#111522]"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-[#111522] border border-[#252A3A] flex items-center justify-center text-[#6B7280]">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111522] hover:bg-[#171B2B] text-xs font-medium text-[#F8FAFC] cursor-pointer border border-[#252A3A] transition-colors">
                        <Upload size={14} />
                        <span>{logoPreview ? "Replace Logo" : "Upload Brand Logo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-[#6B7280] mt-1">Recommended: Square PNG/JPG, max 2MB</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONTACT DETAILS */}
                <div className="space-y-3 rounded-xl bg-[#0D101C] border border-[#252A3A] p-4">
                  <h3 className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                    2. Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[#A1A9B8] mb-1 block">Contact Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
                        <Input
                          placeholder="contact@company.com"
                          value={form.contactEmail}
                          onChange={(e) => updateField("contactEmail", e.target.value)}
                          className="h-10 rounded-lg border-[#252A3A] bg-[#111522] pl-9 text-xs text-[#F8FAFC]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[#A1A9B8] mb-1 block">WhatsApp Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
                        <Input
                          placeholder="+1 234 567 890"
                          value={form.whatsapp}
                          onChange={(e) => updateField("whatsapp", e.target.value)}
                          className="h-10 rounded-lg border-[#252A3A] bg-[#111522] pl-9 text-xs text-[#F8FAFC]"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#A1A9B8] mb-1 block">Telegram Handle</Label>
                    <div className="relative">
                      <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
                      <Input
                        placeholder="@username"
                        value={form.telegram}
                        onChange={(e) => updateField("telegram", e.target.value)}
                        className="h-10 rounded-lg border-[#252A3A] bg-[#111522] pl-9 text-xs text-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ABOUT COMPANY */}
                <div className="space-y-2 rounded-xl bg-[#0D101C] border border-[#252A3A] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#A1A9B8] uppercase tracking-wider">
                      3. About Your Company
                    </h3>
                    <span className="text-[11px] text-[#6B7280]">
                      {form.aboutCompany.length}/500
                    </span>
                  </div>
                  <Textarea
                    placeholder="Briefly describe your products, target markets, or key partnership opportunities..."
                    value={form.aboutCompany}
                    maxLength={500}
                    onChange={(e) => updateField("aboutCompany", e.target.value)}
                    rows={3}
                    className="rounded-lg border-[#252A3A] bg-[#111522] text-xs text-[#F8FAFC] placeholder:text-[#6B7280] focus:border-[#4F46E5]"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & COMPLETE */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                    <CheckCircle2 className="text-[#22C1DC]" size={20} />
                    Review & Complete
                  </h2>
                  <p className="text-xs text-[#A1A9B8] mt-1">
                    Verify your company information before publishing to the Marketplace.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-[#252A3A] bg-[#0D101C] p-4 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Company Name</span>
                    <p className="text-sm font-semibold text-[#F8FAFC]">{form.companyName || "My iGaming Company"}</p>
                    {form.website && <p className="text-xs text-[#4F46E5]">{form.website}</p>}
                  </div>

                  <div className="rounded-lg border border-[#252A3A] bg-[#0D101C] p-4 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Account Type</span>
                    <p className="text-xs font-medium text-[#F8FAFC] capitalize">{form.accountType}</p>
                  </div>

                  {form.attendEvent && (
                    <div className="rounded-lg border border-[rgba(79,70,229,0.20)] bg-[rgba(79,70,229,0.12)] p-4">
                      <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                        <Check size={14} className="text-[#4F46E5]" /> Registered for {form.eventChoice}
                      </span>
                    </div>
                  )}

                  {form.aboutCompany && (
                    <div className="rounded-lg border border-[#252A3A] bg-[#0D101C] p-4 space-y-1">
                      <span className="text-[11px] font-semibold uppercase text-[#6B7280]">About</span>
                      <p className="text-xs text-[#A1A9B8] leading-relaxed">{form.aboutCompany}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#252A3A]">
              {currentStep > 2 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-lg border-[#252A3A] bg-[#111522] text-[#F8FAFC] hover:bg-[#171B2B] hover:border-[#343B52] text-xs gap-1.5"
                >
                  <ArrowLeft size={14} /> Back
                </Button>
              ) : <div />}

              <div className="flex gap-2">
                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    className="rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold px-5 gap-1.5"
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-6 gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Launching...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Complete Setup & Launch</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


