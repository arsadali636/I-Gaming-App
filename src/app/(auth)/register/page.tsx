"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Share2,
  Gamepad2,
  Layers,
  CreditCard,
  Check,
  Globe,
  Phone,
  Send,
  Camera,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import type { BusinessRole, CompanySize, Country } from "@/types";

const ICON_MAP: Record<string, any> = {
  Building2,
  Share2,
  Gamepad2,
  Layers,
  CreditCard,
};

export default function RegisterPage() {
  const router = useRouter();

  // Navigation step (1 = Account, 2 = Company & Business Identity)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account State
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [instagram, setInstagram] = useState("");
  const [discord, setDiscord] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Step 2: Company State
  const [companyName, setCompanyName] = useState("");
  const [companySizeId, setCompanySizeId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [businessRoleId, setBusinessRoleId] = useState("");

  // Master Data Options (Loaded dynamically from DB)
  const [businessRoles, setBusinessRoles] = useState<BusinessRole[]>([]);
  const [companySizes, setCompanySizes] = useState<CompanySize[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);

  // Errors & UI state
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load master data on mount
  useEffect(() => {
    async function loadMasterData() {
      setMasterLoading(true);
      try {
        const [rolesRes, sizesRes, countriesRes] = await Promise.all([
          fetch("/api/master/business-roles").then((r) => r.json()),
          fetch("/api/master/company-sizes").then((r) => r.json()),
          fetch("/api/master/countries").then((r) => r.json()),
        ]);

        if (rolesRes.business_roles) setBusinessRoles(rolesRes.business_roles);
        if (sizesRes.company_sizes) setCompanySizes(sizesRes.company_sizes);
        if (countriesRes.countries) setCountries(countriesRes.countries);
      } catch (err) {
        console.error("Error loading registration master data:", err);
      } finally {
        setMasterLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!trimmedUsername) {
      errors.username = "Full Name is required.";
    } else if (trimmedUsername.length < 2) {
      errors.username = "Name must be at least 2 characters.";
    }

    if (!phone.trim()) {
      errors.phone = "Phone Number is required.";
    }

    if (!telegramId.trim()) {
      errors.telegramId = "Telegram ID is required.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!agreeTerms) {
      errors.agreeTerms = "You must agree to the Terms of Service and Privacy Policy.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedComp = companyName.trim();
    const trimmedCity = city.trim();

    if (!trimmedComp) {
      errors.companyName = "Company name is required.";
    } else if (trimmedComp.length < 2) {
      errors.companyName = "Company name must be at least 2 characters.";
    } else if (trimmedComp.length > 100) {
      errors.companyName = "Company name cannot exceed 100 characters.";
    } else if (/^(test|asdf|qwerty|1234|abc|none)$/i.test(trimmedComp)) {
      errors.companyName = "Please enter a valid company name.";
    }

    if (!companySizeId) {
      errors.companySizeId = "Please select a company size.";
    }

    if (!countryId) {
      errors.countryId = "Please select a country.";
    }

    if (!trimmedCity) {
      errors.city = "City is required.";
    }

    if (!businessRoleId) {
      errors.businessRoleId = "Please select a business role.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep2()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: username.trim(),
          phone: phone.trim(),
          telegram_id: telegramId.trim(),
          instagram: instagram.trim() || undefined,
          discord: discord.trim() || undefined,
          company_name: companyName.trim(),
          company_size_id: companySizeId,
          country_id: countryId,
          city: city.trim(),
          state_region: stateRegion.trim() || undefined,
          business_role_id: businessRoleId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your information.");
        return;
      }

      if (data && data.user) {
        useAuthStore.getState().setUser(data.user);
      }

      router.push("/app");
      router.refresh();
    } catch (err: unknown) {
      console.error("Register submission error:", err);
      setError("Unable to connect to registration service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto"
    >
      {/* Progress Indicator */}
      <div className="mb-6 flex items-center justify-between border-b border-[#252A3A] pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === 1
                ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/30"
                : "bg-[#22C1DC]/20 text-[#22C1DC]"
            }`}
          >
            {step > 1 ? <Check size={14} /> : "1"}
          </div>
          <span
            className={`text-xs font-semibold tracking-wide ${
              step === 1 ? "text-[#F8FAFC]" : "text-[#A1A9B8]"
            }`}
          >
            01 Account
          </span>
        </div>

        <div className="h-0.5 flex-1 mx-4 bg-[#252A3A] relative overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#22C1DC]"
            initial={{ width: "0%" }}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === 2
                ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/30"
                : "bg-[#252A3A] text-[#A1A9B8]"
            }`}
          >
            2
          </div>
          <span
            className={`text-xs font-semibold tracking-wide ${
              step === 2 ? "text-[#F8FAFC]" : "text-[#A1A9B8]"
            }`}
          >
            02 Company
          </span>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#EF4444]"
        >
          <AlertCircle size={18} className="shrink-0 text-[#EF4444] mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8FAFC]">
                Create an Account
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#A1A9B8]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#4F46E5] hover:underline transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-[#A1A9B8]">
                  Business Email *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                    }}
                    required
                    autoComplete="email"
                    className={`w-full rounded-xl border ${
                      fieldErrors.email ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Username / Full Name Field */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-medium text-[#A1A9B8]">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <User size={16} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" }));
                    }}
                    required
                    autoComplete="name"
                    className={`w-full rounded-xl border ${
                      fieldErrors.username ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Contact Details Section */}
              <div className="pt-2 pb-1 border-t border-[#252A3A]/60 space-y-4">
                <div className="text-xs font-bold text-[#F8FAFC] tracking-wider uppercase text-opacity-80">
                  Contact Details
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-medium text-[#A1A9B8]">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <Phone size={16} />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                      }}
                      required
                      autoComplete="tel"
                      className={`w-full rounded-xl border ${
                        fieldErrors.phone ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                      } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Telegram ID */}
                <div className="space-y-1.5">
                  <label htmlFor="telegramId" className="block text-xs font-medium text-[#A1A9B8]">
                    Telegram ID *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <Send size={16} />
                    </div>
                    <input
                      id="telegramId"
                      type="text"
                      placeholder="@username or telegram_id"
                      value={telegramId}
                      onChange={(e) => {
                        setTelegramId(e.target.value);
                        if (fieldErrors.telegramId) setFieldErrors((p) => ({ ...p, telegramId: "" }));
                      }}
                      required
                      className={`w-full rounded-xl border ${
                        fieldErrors.telegramId ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                      } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                    />
                  </div>
                  {fieldErrors.telegramId && (
                    <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.telegramId}</p>
                  )}
                </div>

                {/* Instagram (Optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="instagram" className="block text-xs font-medium text-[#A1A9B8]">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <Camera size={16} />
                    </div>
                    <input
                      id="instagram"
                      type="text"
                      placeholder="@username (optional)"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none"
                    />
                  </div>
                </div>

                {/* Discord (Optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="discord" className="block text-xs font-medium text-[#A1A9B8]">
                    Discord
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <MessageSquare size={16} />
                    </div>
                    <input
                      id="discord"
                      type="text"
                      placeholder="username#0000 (optional)"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-[#A1A9B8]">
                  Password *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
                    }}
                    required
                    autoComplete="new-password"
                    className={`w-full rounded-xl border ${
                      fieldErrors.password ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-11 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6B7280] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#A1A9B8]">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                    }}
                    required
                    autoComplete="new-password"
                    className={`w-full rounded-xl border ${
                      fieldErrors.confirmPassword ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-11 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6B7280] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (fieldErrors.agreeTerms) setFieldErrors((p) => ({ ...p, agreeTerms: "" }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[#252A3A] bg-[#111522] text-[#4F46E5] focus:ring-[#4F46E5]/20"
                  />
                  <span className="text-xs text-[#A1A9B8] leading-normal">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-[#4F46E5] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-[#4F46E5] hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {fieldErrors.agreeTerms && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.agreeTerms}</p>
                )}
              </div>

              {/* Continue to Step 2 Button */}
              <button
                type="submit"
                className="w-full rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] py-3 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg shadow-[#4F46E5]/20"
              >
                <span>Continue to Company Identity</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8FAFC]">
                Tell us about your company
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#A1A9B8]">
                Help businesses find and connect with you on iGaming Connect.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="block text-xs font-medium text-[#A1A9B8]">
                  Company Name *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <Building2 size={16} />
                  </div>
                  <input
                    id="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (fieldErrors.companyName) setFieldErrors((p) => ({ ...p, companyName: "" }));
                    }}
                    required
                    className={`w-full rounded-xl border ${
                      fieldErrors.companyName ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                  />
                </div>
                {fieldErrors.companyName && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.companyName}</p>
                )}
              </div>

              {/* Company Size Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="companySizeId" className="block text-xs font-medium text-[#A1A9B8]">
                  Company Size *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                    <Users size={16} />
                  </div>
                  <select
                    id="companySizeId"
                    value={companySizeId}
                    onChange={(e) => {
                      setCompanySizeId(e.target.value);
                      if (fieldErrors.companySizeId) setFieldErrors((p) => ({ ...p, companySizeId: "" }));
                    }}
                    required
                    className={`w-full rounded-xl border ${
                      fieldErrors.companySizeId ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                    } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none appearance-none cursor-pointer`}
                  >
                    <option value="" disabled className="bg-[#111522] text-[#6B7280]">
                      Select company size
                    </option>
                    {companySizes.map((size) => (
                      <option key={size.id} value={size.id} className="bg-[#111522] text-[#F8FAFC]">
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.companySizeId && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.companySizeId}</p>
                )}
              </div>

              {/* Location Fields (Country, City, State/Region) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country */}
                <div className="space-y-1.5">
                  <label htmlFor="countryId" className="block text-xs font-medium text-[#A1A9B8]">
                    Country *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <Globe size={16} />
                    </div>
                    <select
                      id="countryId"
                      value={countryId}
                      onChange={(e) => {
                        setCountryId(e.target.value);
                        if (fieldErrors.countryId) setFieldErrors((p) => ({ ...p, countryId: "" }));
                      }}
                      required
                      className={`w-full rounded-xl border ${
                        fieldErrors.countryId ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                      } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none appearance-none cursor-pointer`}
                    >
                      <option value="" disabled className="bg-[#111522] text-[#6B7280]">
                        Select country
                      </option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#111522] text-[#F8FAFC]">
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.countryId && (
                    <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.countryId}</p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label htmlFor="city" className="block text-xs font-medium text-[#A1A9B8]">
                    City *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#6B7280]">
                      <MapPin size={16} />
                    </div>
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. Sliema, London, Dubai"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (fieldErrors.city) setFieldErrors((p) => ({ ...p, city: "" }));
                      }}
                      required
                      className={`w-full rounded-xl border ${
                        fieldErrors.city ? "border-[#EF4444] bg-[#EF4444]/5" : "border-[#252A3A] bg-[#111522]"
                      } py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#6B7280] transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15 outline-none`}
                    />
                  </div>
                  {fieldErrors.city && (
                    <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Who You Are (Business Role Radio Cards Grid) */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Who You Are (Primary Business Role) *
                </label>

                {masterLoading ? (
                  <div className="flex items-center justify-center p-8 border border-[#252A3A] rounded-xl bg-[#111522]">
                    <Loader2 size={20} className="animate-spin text-[#4F46E5]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {businessRoles.map((role) => {
                      const isSelected = businessRoleId === role.id;
                      const RoleIcon = (role.icon && ICON_MAP[role.icon]) || Building2;

                      return (
                        <div
                          key={role.id}
                          onClick={() => {
                            setBusinessRoleId(role.id);
                            if (fieldErrors.businessRoleId)
                              setFieldErrors((p) => ({ ...p, businessRoleId: "" }));
                          }}
                          className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#4F46E5] bg-[#4F46E5]/10 shadow-lg shadow-[#4F46E5]/10 ring-1 ring-[#4F46E5]"
                              : "border-[#252A3A] bg-[#111522] hover:border-[#4F46E5]/50 hover:bg-[#151C2C]"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors mt-0.5 ${
                              isSelected
                                ? "bg-[#4F46E5] text-white"
                                : "bg-[#1F2434] text-[#A1A9B8] group-hover:text-[#F8FAFC]"
                            }`}
                          >
                            <RoleIcon size={16} />
                          </div>

                          <div className="flex-1 pr-6">
                            <div className="text-xs font-bold text-[#F8FAFC]">
                              {role.name}
                            </div>
                            {role.description && (
                              <div className="text-[11px] text-[#A1A9B8] mt-0.5 leading-snug">
                                {role.description}
                              </div>
                            )}
                          </div>

                          <div
                            className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                              isSelected
                                ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                                : "border-[#374151] bg-transparent"
                            }`}
                          >
                            {isSelected && <Check size={10} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {fieldErrors.businessRoleId && (
                  <p className="text-xs font-medium text-[#EF4444] mt-1">{fieldErrors.businessRoleId}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-[#252A3A] bg-[#111522] hover:bg-[#1A2030] py-3 text-xs font-semibold text-[#A1A9B8] hover:text-[#F8FAFC] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Account</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] py-3 text-xs sm:text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#4F46E5]/20"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
