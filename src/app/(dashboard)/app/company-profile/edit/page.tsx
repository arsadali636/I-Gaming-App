"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  Globe,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Package,
  Shield,
  Mail,
  Phone,
  Plus,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
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

interface CompanyFormData {
  name: string;
  description: string;
  website: string;
  founded_year: string;
  headquarters: string;
  employee_count: string;
  revenue_range: string;
  logo_url: string;
  category_ids: string[];
  products: string[];
  services: string[];
  markets: string[];
  licenses: LicenseEntry[];
  contacts: ContactEntry[];
}

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Categories", icon: Briefcase },
  { label: "Products & Services", icon: Package },
  { label: "Markets", icon: Globe },
  { label: "Licenses", icon: Shield },
  { label: "Contacts", icon: Mail },
];

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

const EMPLOYEE_COUNTS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const REVENUE_RANGES = [
  "Under $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $50M",
  "$50M - $100M",
  "$100M+",
];

export default function CompanyEditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companyName, setCompanyName] = useState("");

  const [form, setForm] = useState<CompanyFormData>({
    name: "",
    description: "",
    website: "",
    founded_year: "",
    headquarters: "",
    employee_count: "",
    revenue_range: "",
    logo_url: "",
    category_ids: [],
    products: [],
    services: [],
    markets: [],
    licenses: [],
    contacts: [],
  });

  const updateForm = useCallback((field: keyof CompanyFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user?.company_id) {
        setLoadingData(false);
        return;
      }
      try {
        const [companyData, catData] = await Promise.all([
          apiClient.get<any>(`/api/v1/companies/${user.company_id}/`).catch(() => null),
          apiClient.get<any>("/api/v1/categories/").catch(() => null),
        ]);

        if (companyData) {
          const company = companyData;
          setForm({
            name: company.name ?? "",
            description: company.description ?? "",
            website: company.website ?? "",
            founded_year: company.founded_year?.toString() ?? "",
            headquarters: company.headquarters ?? "",
            employee_count: company.employee_count ?? "",
            revenue_range: company.revenue_range ?? "",
            logo_url: company.logo_url ?? "",
            category_ids: company.categories_detail ? company.categories_detail.map((c: any) => c.id) : (company.category_ids ?? []),
            products: company.products_detail ? company.products_detail.map((p: any) => p.name) : (company.products ?? []).map((p: any) => typeof p === "string" ? p : p.name ?? ""),
            services: company.services_detail ? company.services_detail.map((s: any) => s.name) : (company.services ?? []).map((s: any) => typeof s === "string" ? s : s.name ?? ""),
            markets: company.market ? company.market.split(", ") : [],
            licenses: (company.licenses ?? company.company_licenses ?? []).map((l: any) => ({
              id: l.id,
              jurisdiction: l.jurisdiction,
              license_name: l.license_name || l.name,
              license_number: l.license_number || l.number || "",
              status: l.status as LicenseEntry["status"],
            })),
            contacts: (company.contacts ?? company.company_contacts ?? []).map((c: any) => ({
              id: c.id,
              full_name: c.full_name || c.name,
              position: c.position || c.title || "",
              email: c.email || "",
              phone: c.phone || "",
            })),
          });
          setCompanyName(company.name);
        }

        if (catData) {
          const cats = Array.isArray(catData) ? catData : catData.results ?? [];
          setCategories(cats);
        }
      } catch {} finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [user?.company_id]);

  const toggleCategory = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId],
    }));
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
        {
          id: `new-${Date.now()}`,
          jurisdiction: "",
          license_name: "",
          license_number: "",
          status: "pending" as const,
        },
      ],
    }));
  };

  const removeLicense = (id: string) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.filter((l) => l.id !== id),
    }));
  };

  const updateLicense = (id: string, field: keyof LicenseEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    }));
  };

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: `new-${Date.now()}`,
          full_name: "",
          position: "",
          email: "",
          phone: "",
        },
      ],
    }));
  };

  const removeContact = (id: string) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  const updateContact = (id: string, field: keyof ContactEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (user?.company_id) {
        await apiClient.put(`/api/v1/companies/${user.company_id}/`, {
          name: form.name,
          description: form.description,
          website: form.website || undefined,
          founded_year: form.founded_year ? parseInt(form.founded_year) : undefined,
          headquarters: form.headquarters || undefined,
          employee_count: form.employee_count || undefined,
          revenue_range: form.revenue_range || undefined,
          category_ids: form.category_ids,
          market: form.markets.join(", "),
        });
      }

      router.push("/app/company-profile");
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/app/company-profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {companyName ? `Edit ${companyName}` : "Edit Company Profile"}
          </h2>
          <p className="text-muted-foreground mt-1">Step {currentStep + 1} of {STEPS.length}</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i < currentStep
                    ? "bg-accent text-accent-foreground"
                    : i === currentStep
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(108,92,231,0.4)]"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <Check size={14} /> : i + 1}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center hidden sm:block">
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                  i < currentStep ? "bg-accent" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  Company Information
                </CardTitle>
              </CardHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    placeholder="Your company name"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your company..."
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    rows={4}
                  />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employees">Employee Count</Label>
                    <Select
                      id="employees"
                      value={form.employee_count}
                      onChange={(e) => updateForm("employee_count", e.target.value)}
                    >
                      <option value="">Select range</option>
                      {EMPLOYEE_COUNTS.map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Revenue Range</Label>
                    <Select
                      id="revenue"
                      value={form.revenue_range}
                      onChange={(e) => updateForm("revenue_range", e.target.value)}
                    >
                      <option value="">Select range</option>
                      {REVENUE_RANGES.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Building2 size={24} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Logo upload coming soon.</p>
                      <p className="text-xs mt-1">Paste an image URL below.</p>
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={form.logo_url}
                        onChange={(e) => updateForm("logo_url", e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase size={16} className="text-primary" />
                  Business Categories
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select at least one category that best describes your business.
                </p>
              </CardHeader>

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
                          isSelected
                            ? "bg-primary text-white"
                            : "border border-border"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <span className="text-sm text-foreground">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No categories available.
                </p>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package size={16} className="text-primary" />
                  Products & Services
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  List the products and services your company offers.
                </p>
              </CardHeader>

              <div className="space-y-3">
                <Label>Products</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.products.map((product) => (
                    <Badge key={product} variant="secondary" className="gap-1 pr-1">
                      {product}
                      <button
                        onClick={() => removeProduct(product)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a product..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProduct((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                      if (input) {
                        addProduct(input.value);
                        input.value = "";
                      }
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Services</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.services.map((service) => (
                    <Badge key={service} variant="secondary" className="gap-1 pr-1">
                      {service}
                      <button
                        onClick={() => removeService(service)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a service..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                      if (input) {
                        addService(input.value);
                        input.value = "";
                      }
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  Markets & Regions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the regions where your company operates.
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
                          isSelected
                            ? "bg-secondary text-secondary-foreground"
                            : "border border-border"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <span className="text-sm text-foreground">{market}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    Licenses & Certifications
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add any regulatory licenses your company holds.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addLicense} className="gap-1">
                  <Plus size={14} /> Add
                </Button>
              </CardHeader>

              {form.licenses.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No licenses added yet. Click "Add" to include one.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.licenses.map((license) => (
                    <div
                      key={license.id}
                      className="rounded-lg border border-border/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          License
                        </p>
                        <button
                          onClick={() => removeLicense(license.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">License Name *</Label>
                          <Input
                            placeholder="e.g. MGA License"
                            value={license.license_name}
                            onChange={(e) => updateLicense(license.id, "license_name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Jurisdiction *</Label>
                          <Input
                            placeholder="e.g. Malta"
                            value={license.jurisdiction}
                            onChange={(e) => updateLicense(license.id, "jurisdiction", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">License Number</Label>
                          <Input
                            placeholder="Optional"
                            value={license.license_number}
                            onChange={(e) => updateLicense(license.id, "license_number", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={license.status}
                            onChange={(e) => updateLicense(license.id, "status", e.target.value)}
                          >
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
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    Business Contacts
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add key team members and business contacts.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addContact} className="gap-1">
                  <Plus size={14} /> Add
                </Button>
              </CardHeader>

              {form.contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No contacts added yet. Click "Add" to include one.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-lg border border-border/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Contact
                        </p>
                        <button
                          onClick={() => removeContact(contact.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Full Name *</Label>
                          <Input
                            placeholder="John Doe"
                            value={contact.full_name}
                            onChange={(e) => updateContact(contact.id, "full_name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Position *</Label>
                          <Input
                            placeholder="CEO"
                            value={contact.position}
                            onChange={(e) => updateContact(contact.id, "position", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="john@company.com"
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="+1 234 567 890"
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="gap-2"
          >
            Next
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.description}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
