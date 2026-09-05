"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Package,
  Shield,
  Mail,
  Phone,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Plus,
  X,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types";
import { apiClient } from "@/lib/api-client";

interface LicenseEntry {
  id: string;
  jurisdiction: string;
  license_name: string;
  license_number: string;
  status: "active" | "pending" | "expired";
}

interface ContactEntry {
  id: string;
  full_name: string;
  position: string;
  email: string;
  phone: string;
}

interface OnboardingData {
  companyName: string;
  description: string;
  website: string;
  headquarters: string;
  employee_count: string;
  revenue_range: string;
  founded_year: string;
  category_ids: string[];
  products: string[];
  services: string[];
  markets: string[];
  licenses: LicenseEntry[];
  contacts: ContactEntry[];
}

const TOTAL_STEPS = 8;

const MARKET_OPTIONS = [
  "Europe",
  "North America",
  "Latin America",
  "Asia Pacific",
  "Africa",
  "Middle East",
  "Oceania",
  "Global",
];

const EMPLOYEE_COUNTS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const REVENUE_RANGES = ["Under $1M", "$1M - $5M", "$5M - $10M", "$10M - $50M", "$50M - $100M", "$100M+"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<OnboardingData>({
    companyName: "",
    description: "",
    website: "",
    headquarters: "",
    employee_count: "",
    revenue_range: "",
    founded_year: "",
    category_ids: [],
    products: [],
    services: [],
    markets: [],
    licenses: [],
    contacts: [],
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await apiClient.get<any>("/api/v1/categories/");
        const categoryList = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoryList);
      } catch {} finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const updateForm = useCallback((field: keyof OnboardingData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const toggleCategory = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.category_ids;
      return next;
    });
  };

  const toggleMarket = (market: string) => {
    setForm((prev) => ({
      ...prev,
      markets: prev.markets.includes(market)
        ? prev.markets.filter((m) => m !== market)
        : [...prev.markets, market],
    }));
  };

  const addLicense = () => {
    setForm((prev) => ({
      ...prev,
      licenses: [
        ...prev.licenses,
        { id: `new-${Date.now()}`, jurisdiction: "", license_name: "", license_number: "", status: "pending" as const },
      ],
    }));
  };

  const removeLicense = (id: string) => {
    setForm((prev) => ({ ...prev, licenses: prev.licenses.filter((l) => l.id !== id) }));
  };

  const updateLicense = (id: string, field: keyof LicenseEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  };

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { id: `new-${Date.now()}`, full_name: "", position: "", email: "", phone: "" },
      ],
    }));
  };

  const removeContact = (id: string) => {
    setForm((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }));
  };

  const updateContact = (id: string, field: keyof ContactEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const addProduct = (name: string) => {
    if (name.trim() && !form.products.includes(name.trim())) {
      updateForm("products", [...form.products, name.trim()]);
    }
  };

  const removeProduct = (name: string) => {
    updateForm("products", form.products.filter((p) => p !== name));
  };

  const addService = (name: string) => {
    if (name.trim() && !form.services.includes(name.trim())) {
      updateForm("services", [...form.services, name.trim()]);
    }
  };

  const removeService = (name: string) => {
    updateForm("services", form.services.filter((s) => s !== name));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
      if (!form.description.trim()) newErrors.description = "Description is required";
    } else if (step === 2) {
      if (form.category_ids.length === 0) newErrors.category_ids = "Select at least one category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 || step === 2) {
      if (!validateStep()) return;
    }
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const company = await apiClient.post<any>("/api/v1/companies/", {
        name: form.companyName,
        description: form.description,
        website: form.website || undefined,
        founded_year: form.founded_year ? parseInt(form.founded_year) : undefined,
        headquarters: form.headquarters || undefined,
        employee_count: form.employee_count || undefined,
        revenue_range: form.revenue_range || undefined,
        market: form.markets[0] || undefined,
        categories: form.category_ids,
      });

      if (company && company.id && form.licenses.length > 0) {
        for (const lic of form.licenses) {
          if (lic.license_name) {
            try {
              await apiClient.post(`/api/v1/companies/${company.id}/licenses/`, {
                license_name: lic.license_name,
                jurisdiction: lic.jurisdiction || "Global",
                license_number: lic.license_number || undefined,
                status: lic.status || "active",
              });
            } catch {}
          }
        }
      }

      if (company && company.id && form.contacts.length > 0) {
        for (const c of form.contacts) {
          if (c.full_name && c.email) {
            try {
              await apiClient.post(`/api/v1/companies/${company.id}/contacts/`, {
                full_name: c.full_name,
                position: c.position || "Representative",
                email: c.email,
                phone: c.phone || undefined,
              });
            } catch {}
          }
        }
      }

      router.push("/app");
      router.refresh();
    } catch (err: unknown) {
      router.push("/app");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="gradient-text text-3xl font-bold">iGaming Connect</h1>
          <p className="text-muted-foreground mt-2">Complete your company setup</p>
        </motion.div>

        <div className="flex items-center justify-center gap-0 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < step
                      ? "bg-accent text-accent-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(108,92,231,0.4)]"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
              </div>
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 mx-0.5 rounded-full transition-colors ${
                    i < step ? "bg-accent" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              {step === 0 && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
                    <Sparkles size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Welcome to iGaming Connect!</h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Let&apos;s set up your company profile so you can connect with
                      other iGaming professionals and grow your business.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>This will take about 5 minutes.</p>
                    <p>You can always skip steps and complete your profile later.</p>
                  </div>
                  <Button variant="gradient" size="lg" onClick={handleNext} className="gap-2">
                    Let&apos;s Get Started <ArrowRight size={16} />
                  </Button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 size={16} className="text-primary" />
                      Company Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your company.
                    </p>
                  </CardHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input
                        id="company-name"
                        placeholder="Your company name"
                        value={form.companyName}
                        onChange={(e) => updateForm("companyName", e.target.value)}
                        error={!!errors.companyName}
                      />
                      {errors.companyName && (
                        <p className="text-xs text-destructive">{errors.companyName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what your company does..."
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        rows={3}
                        error={!!errors.description}
                      />
                      {errors.description && (
                        <p className="text-xs text-destructive">{errors.description}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="website"
                          placeholder="https://example.com"
                          value={form.website}
                          onChange={(e) => updateForm("website", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headquarters">Headquarters</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="headquarters"
                          placeholder="City, Country"
                          value={form.headquarters}
                          onChange={(e) => updateForm("headquarters", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="founded">Founded Year</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="founded"
                            type="number"
                            placeholder="2020"
                            min={1900}
                            max={new Date().getFullYear()}
                            value={form.founded_year}
                            onChange={(e) => updateForm("founded_year", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employees">Employee Count</Label>
                        <Select
                          id="employees"
                          value={form.employee_count}
                          onChange={(e) => updateForm("employee_count", e.target.value)}
                        >
                          <option value="">Select range</option>
                          {EMPLOYEE_COUNTS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="revenue">Revenue Range</Label>
                      <Select
                        id="revenue"
                        value={form.revenue_range}
                        onChange={(e) => updateForm("revenue_range", e.target.value)}
                      >
                        <option value="">Select range</option>
                        {REVENUE_RANGES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase size={16} className="text-primary" />
                      Business Categories
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select the categories that describe your business.
                    </p>
                  </CardHeader>

                  {errors.category_ids && (
                    <p className="text-xs text-destructive">{errors.category_ids}</p>
                  )}

                  {loadingCategories ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Loading categories...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categories.map((cat) => {
                        const isSelected = form.category_ids.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(108,92,231,0.15)]"
                                : "border-border hover:border-primary/30 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                isSelected ? "bg-primary text-white" : "border border-border"
                              }`}
                            >
                              {isSelected && <Check size={12} />}
                            </div>
                            <span className="text-sm text-foreground">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package size={16} className="text-primary" />
                      Products & Services
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      What does your company offer?
                    </p>
                  </CardHeader>

                  <div className="space-y-3">
                    <Label>Products</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.products.map((p) => (
                        <Badge key={p} variant="secondary" className="gap-1 pr-1">
                          {p}
                          <button onClick={() => removeProduct(p)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                            <X size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a product and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addProduct((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Services</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.services.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1 pr-1">
                          {s}
                          <button onClick={() => removeService(s)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                            <X size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a service and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addService((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe size={16} className="text-primary" />
                      Markets & Regions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Where does your company operate?
                    </p>
                  </CardHeader>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {MARKET_OPTIONS.map((market) => {
                      const isSelected = form.markets.includes(market);
                      return (
                        <button
                          key={market}
                          type="button"
                          onClick={() => toggleMarket(market)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? "border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(0,210,255,0.15)]"
                              : "border-border hover:border-secondary/30 hover:bg-white/[0.02]"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isSelected ? "bg-secondary text-secondary-foreground" : "border border-border"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                          <span className="text-sm text-foreground">{market}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        Licenses
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add any regulatory licenses (optional).
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addLicense} className="gap-1">
                      <Plus size={14} /> Add
                    </Button>
                  </CardHeader>

                  {form.licenses.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No licenses added. You can add them later.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.licenses.map((lic) => (
                        <div key={lic.id} className="rounded-lg border border-border/50 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">License</p>
                            <button onClick={() => removeLicense(lic.id)} className="text-muted-foreground hover:text-destructive">
                              <X size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">License Name</Label>
                              <Input placeholder="MGA License" value={lic.license_name} onChange={(e) => updateLicense(lic.id, "license_name", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Jurisdiction</Label>
                              <Input placeholder="Malta" value={lic.jurisdiction} onChange={(e) => updateLicense(lic.id, "jurisdiction", e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">License Number</Label>
                              <Input placeholder="Optional" value={lic.license_number} onChange={(e) => updateLicense(lic.id, "license_number", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Status</Label>
                              <Select value={lic.status} onChange={(e) => updateLicense(lic.id, "status", e.target.value)}>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="expired">Expired</option>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        Business Contacts
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add key team members (optional).
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addContact} className="gap-1">
                      <Plus size={14} /> Add
                    </Button>
                  </CardHeader>

                  {form.contacts.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No contacts added. You can add them later.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.contacts.map((contact) => (
                        <div key={contact.id} className="rounded-lg border border-border/50 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact</p>
                            <button onClick={() => removeContact(contact.id)} className="text-muted-foreground hover:text-destructive">
                              <X size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Full Name</Label>
                              <Input placeholder="John Doe" value={contact.full_name} onChange={(e) => updateContact(contact.id, "full_name", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Position</Label>
                              <Input placeholder="CEO" value={contact.position} onChange={(e) => updateContact(contact.id, "position", e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="john@co.com" type="email" value={contact.email} onChange={(e) => updateContact(contact.id, "email", e.target.value)} className="pl-8" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="+1 234 567" value={contact.phone} onChange={(e) => updateContact(contact.id, "phone", e.target.value)} className="pl-8" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Check size={16} className="text-accent" />
                      Review & Submit
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Review your information before submitting for verification.
                    </p>
                  </CardHeader>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border/50 p-4 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Company</p>
                      <p className="text-sm font-medium text-foreground">{form.companyName || "Not set"}</p>
                      <p className="text-xs text-muted-foreground">{form.description || "No description"}</p>
                    </div>

                    {form.category_ids.length > 0 && (
                      <div className="rounded-lg border border-border/50 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {form.category_ids.map((id) => {
                            const cat = categories.find((c) => c.id === id);
                            return cat ? <Badge key={id} variant="secondary">{cat.name}</Badge> : null;
                          })}
                        </div>
                      </div>
                    )}

                    {(form.products.length > 0 || form.services.length > 0) && (
                      <div className="rounded-lg border border-border/50 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Products & Services</p>
                        <div className="flex flex-wrap gap-1">
                          {form.products.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                          {form.services.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                        </div>
                      </div>
                    )}

                    {form.markets.length > 0 && (
                      <div className="rounded-lg border border-border/50 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Markets</p>
                        <div className="flex flex-wrap gap-1">
                          {form.markets.map((m) => <Badge key={m} variant="secondary">{m}</Badge>)}
                        </div>
                      </div>
                    )}

                    {form.licenses.length > 0 && (
                      <div className="rounded-lg border border-border/50 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Licenses</p>
                        {form.licenses.map((l) => (
                          <div key={l.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{l.license_name} - {l.jurisdiction}</span>
                            <Badge variant={l.status === "active" ? "success" : "warning"}>{l.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {form.contacts.length > 0 && (
                      <div className="rounded-lg border border-border/50 p-4 space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Contacts</p>
                        {form.contacts.map((c) => (
                          <div key={c.id} className="text-sm">
                            <span className="text-foreground">{c.full_name}</span>
                            <span className="text-muted-foreground ml-2">({c.position})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm text-foreground">
                        Your profile will be reviewed by our team. This usually takes 1-2 business days.
                        You&apos;ll receive a notification once your company is verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                {step === 0 ? "Get Started" : "Continue"} <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                variant="gradient"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit for Verification
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
