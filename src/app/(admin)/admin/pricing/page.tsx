"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  DollarSign,
  Star,
  ListOrdered,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean | number;
  show_on_public_page: boolean | number;
  is_plus_layout: boolean | number;
}

interface Plan {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  price: number;
  currency: string;
  billing_period: string;
  icon: string;
  button_text: string;
  button_action: string;
  is_featured: boolean | number;
  is_popular: boolean | number;
  badge_text: string;
  display_order: number;
  is_active: boolean | number;
  features: PlanFeature[];
}

interface PlanFeature {
  id: string;
  pricing_plan_id: string;
  feature_text: string;
  feature_description?: string;
  is_included: boolean | number;
  display_order: number;
}

interface PlusBenefit {
  id: string;
  category_id?: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean | number;
}

export default function AdminPricingManagementPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "plans" | "features" | "plus">("categories");

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [plusBenefits, setPlusBenefits] = useState<PlusBenefit[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("");

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);

  const [isPlusModalOpen, setIsPlusModalOpen] = useState(false);
  const [editingPlusBenefit, setEditingPlusBenefit] = useState<PlusBenefit | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 0,
    is_active: true,
    show_on_public_page: true,
    is_plus_layout: false,
  });

  const [planForm, setPlanForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    short_description: "",
    price: 0,
    currency: "€",
    billing_period: "/ year",
    icon: "Sparkles",
    button_text: "Get Started",
    button_action: "/register",
    is_featured: false,
    is_popular: false,
    badge_text: "",
    display_order: 0,
    is_active: true,
  });

  const [featureForm, setFeatureForm] = useState({
    pricing_plan_id: "",
    feature_text: "",
    feature_description: "",
    is_included: true,
    display_order: 0,
  });

  const [plusForm, setPlusForm] = useState({
    title: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  // Fetch all data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [catRes, plansRes, plusRes] = await Promise.all([
        fetch("/api/admin/pricing/categories"),
        fetch("/api/admin/pricing/plans"),
        fetch("/api/admin/pricing/plus-benefits"),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        if (catData.categories?.length > 0 && !selectedCategoryFilter) {
          setSelectedCategoryFilter(catData.categories[0].id);
        }
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        const loadedPlans: Plan[] = plansData.plans || [];
        setPlans(loadedPlans);
        if (loadedPlans.length > 0 && !selectedPlanFilter) {
          setSelectedPlanFilter(loadedPlans[0].id);
        }
      }

      if (plusRes.ok) {
        const plusData = await plusRes.json();
        setPlusBenefits(plusData.benefits || []);
      }
    } catch (err) {
      console.error("Failed to load admin pricing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update features list when plan filter changes
  useEffect(() => {
    if (!selectedPlanFilter) return;
    const currentPlan = plans.find((p) => p.id === selectedPlanFilter);
    setFeatures(currentPlan?.features || []);
  }, [selectedPlanFilter, plans]);

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- CATEGORIES CRUD ---
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        display_order: cat.display_order || 0,
        is_active: Boolean(cat.is_active),
        show_on_public_page: Boolean(cat.show_on_public_page),
        is_plus_layout: Boolean(cat.is_plus_layout),
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        slug: "",
        description: "",
        display_order: categories.length + 1,
        is_active: true,
        show_on_public_page: true,
        is_plus_layout: false,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const url = "/api/admin/pricing/categories";
      const method = editingCategory ? "PUT" : "POST";
      const payload = editingCategory ? { ...categoryForm, id: editingCategory.id } : categoryForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save category");

      showMsg(editingCategory ? "Category updated successfully" : "Category created successfully");
      setIsCategoryModalOpen(false);
      loadAllData();
    } catch (err) {
      showMsg("Failed to save category", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing category? All related plans will be removed.")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/pricing/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Category deleted successfully");
      loadAllData();
    } catch {
      showMsg("Failed to delete category", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- PLANS CRUD ---
  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        category_id: plan.category_id,
        name: plan.name,
        slug: plan.slug,
        short_description: plan.short_description || "",
        price: plan.price || 0,
        currency: plan.currency || "€",
        billing_period: plan.billing_period || "/ year",
        icon: plan.icon || "Sparkles",
        button_text: plan.button_text || "Get Started",
        button_action: plan.button_action || "/register",
        is_featured: Boolean(plan.is_featured),
        is_popular: Boolean(plan.is_popular),
        badge_text: plan.badge_text || "",
        display_order: plan.display_order || 0,
        is_active: Boolean(plan.is_active),
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        category_id: selectedCategoryFilter || categories[0]?.id || "",
        name: "",
        slug: "",
        short_description: "",
        price: 0,
        currency: "€",
        billing_period: "/ year",
        icon: "Sparkles",
        button_text: "Get Started",
        button_action: "/register",
        is_featured: false,
        is_popular: false,
        badge_text: "",
        display_order: plans.length + 1,
        is_active: true,
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const url = "/api/admin/pricing/plans";
      const method = editingPlan ? "PUT" : "POST";
      const payload = editingPlan ? { ...planForm, id: editingPlan.id } : planForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save plan");

      showMsg(editingPlan ? "Plan updated successfully" : "Plan created successfully");
      setIsPlanModalOpen(false);
      loadAllData();
    } catch {
      showMsg("Failed to save plan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing plan?")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/pricing/plans?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Plan deleted successfully");
      loadAllData();
    } catch {
      showMsg("Failed to delete plan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- FEATURES CRUD ---
  const handleOpenFeatureModal = (feature?: PlanFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatureForm({
        pricing_plan_id: feature.pricing_plan_id,
        feature_text: feature.feature_text,
        feature_description: feature.feature_description || "",
        is_included: Boolean(feature.is_included),
        display_order: feature.display_order || 0,
      });
    } else {
      setEditingFeature(null);
      setFeatureForm({
        pricing_plan_id: selectedPlanFilter || plans[0]?.id || "",
        feature_text: "",
        feature_description: "",
        is_included: true,
        display_order: features.length + 1,
      });
    }
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const url = "/api/admin/pricing/features";
      const method = editingFeature ? "PUT" : "POST";
      const payload = editingFeature ? { ...featureForm, id: editingFeature.id } : featureForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save feature");

      showMsg(editingFeature ? "Feature updated" : "Feature added");
      setIsFeatureModalOpen(false);
      loadAllData();
    } catch {
      showMsg("Failed to save feature", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Delete this feature?")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/pricing/features?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("Feature deleted");
      loadAllData();
    } catch {
      showMsg("Failed to delete feature", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- PLUS BENEFITS CRUD ---
  const handleOpenPlusModal = (benefit?: PlusBenefit) => {
    if (benefit) {
      setEditingPlusBenefit(benefit);
      setPlusForm({
        title: benefit.title,
        description: benefit.description,
        display_order: benefit.display_order || 0,
        is_active: Boolean(benefit.is_active),
      });
    } else {
      setEditingPlusBenefit(null);
      setPlusForm({
        title: "",
        description: "",
        display_order: plusBenefits.length + 1,
        is_active: true,
      });
    }
    setIsPlusModalOpen(true);
  };

  const handleSavePlusBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const url = "/api/admin/pricing/plus-benefits";
      const method = editingPlusBenefit ? "PUT" : "POST";
      const payload = editingPlusBenefit ? { ...plusForm, id: editingPlusBenefit.id } : plusForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save benefit");

      showMsg(editingPlusBenefit ? "PLUS Benefit updated" : "PLUS Benefit added");
      setIsPlusModalOpen(false);
      loadAllData();
    } catch {
      showMsg("Failed to save PLUS Benefit", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlusBenefit = async (id: string) => {
    if (!confirm("Delete this PLUS benefit?")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/pricing/plus-benefits?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("PLUS Benefit deleted");
      loadAllData();
    } catch {
      showMsg("Failed to delete benefit", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#172036] via-[#111726] to-[#151C2D] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F6BFF]/10 border border-[#4F6BFF]/20 text-xs font-bold text-[#60A5FA]">
            <DollarSign className="h-3.5 w-3.5" />
            Super Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pricing Management System
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Manage categories, plans, features, and PLUS placement packages dynamically for the public directory.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-white hover:bg-white/[0.1] transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 text-[#60A5FA]", loading && "animate-spin")} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs font-bold transition-all",
            message.type === "success"
              ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
              : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
          )}
        >
          {message.text}
        </div>
      )}

      {/* ADMIN TABS NAVIGATION */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "categories"
              ? "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/30"
              : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("plans")}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "plans"
              ? "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/30"
              : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "features"
              ? "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/30"
              : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <ListOrdered className="h-4 w-4" />
          <span>Plan Features</span>
        </button>

        <button
          onClick={() => setActiveTab("plus")}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === "plus"
              ? "bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-white shadow-lg shadow-[#4F6BFF]/30"
              : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Zap className="h-4 w-4 text-[#F59E0B]" />
          <span>PLUS Benefits ({plusBenefits.length})</span>
        </button>
      </div>

      {/* 1. CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Pricing Categories</h2>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-xs font-extrabold text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#111726] text-[#94A3B8]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Name & Slug</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">PLUS Layout</th>
                  <th className="p-4">Public Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[#60A5FA]">#{cat.display_order}</td>
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{cat.name}</p>
                      <p className="text-[11px] text-[#64748B] font-mono">{cat.slug}</p>
                    </td>
                    <td className="p-4 text-[#94A3B8] max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="p-4">
                      {cat.is_plus_layout ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-bold text-[10px] border border-[#F59E0B]/30 flex items-center gap-1 w-max">
                          <Zap className="h-3 w-3" />
                          PLUS Layout
                        </span>
                      ) : (
                        <span className="text-[#64748B]">Standard</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {cat.is_active ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-bold text-[10px]">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444] font-bold text-[10px]">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenCategoryModal(cat)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PLANS TAB */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Pricing Plans</h2>
              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#4F6BFF]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenPlanModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-xs font-extrabold text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Plan</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#111726] text-[#94A3B8]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Plan Name & Badge</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {plans
                  .filter((p) => !selectedCategoryFilter || p.category_id === selectedCategoryFilter)
                  .map((plan) => {
                    const catObj = categories.find((c) => c.id === plan.category_id);
                    return (
                      <tr key={plan.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-[#60A5FA]">#{plan.display_order}</td>
                        <td className="p-4">
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                            {plan.name}
                            {plan.badge_text && (
                              <span className="px-2 py-0.5 rounded-full bg-[#4F6BFF]/20 text-[#60A5FA] text-[10px] font-bold">
                                {plan.badge_text}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">{plan.short_description}</p>
                        </td>
                        <td className="p-4 font-semibold text-[#F8FAFC]">{catObj?.name || "—"}</td>
                        <td className="p-4 font-black text-white">
                          {plan.price > 0 ? `${plan.currency}${plan.price} ${plan.billing_period}` : "Custom"}
                        </td>
                        <td className="p-4">
                          {plan.is_featured || plan.is_popular ? (
                            <span className="px-2.5 py-1 rounded-full bg-[#4F6BFF]/20 text-[#60A5FA] font-bold text-[10px] flex items-center gap-1 w-max">
                              <Star className="h-3 w-3 fill-current" />
                              Featured
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Normal</span>
                          )}
                        </td>
                        <td className="p-4">
                          {plan.is_active ? (
                            <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-bold text-[10px]">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444] font-bold text-[10px]">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenPlanModal(plan)}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PLAN FEATURES TAB */}
      {activeTab === "features" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Plan Features</h2>
              {/* Plan Filter */}
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#4F6BFF]"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({categories.find((c) => c.id === p.category_id)?.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenFeatureModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-xs font-extrabold text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Feature</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#111726] text-[#94A3B8]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Feature Text</th>
                  <th className="p-4">Included Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {features.map((feature) => (
                  <tr key={feature.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[#60A5FA]">#{feature.display_order}</td>
                    <td className="p-4 font-semibold text-white">{feature.feature_text}</td>
                    <td className="p-4">
                      {feature.is_included ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-bold text-[10px] flex items-center gap-1 w-max">
                          <Check className="h-3 w-3" /> Included
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-[#64748B] font-bold text-[10px] flex items-center gap-1 w-max">
                          <X className="h-3 w-3" /> Excluded
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenFeatureModal(feature)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature.id)}
                        className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PLUS BENEFITS TAB */}
      {activeTab === "plus" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">PLUS Category Benefits</h2>
            <button
              onClick={() => handleOpenPlusModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F6BFF] to-[#3B54E6] text-xs font-extrabold text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add PLUS Benefit</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#151C2C]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#111726] text-[#94A3B8]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Title & Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {plusBenefits.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-black text-[#60A5FA]">#{b.display_order || idx + 1}</td>
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{b.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{b.description}</p>
                    </td>
                    <td className="p-4">
                      {b.is_active ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-bold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444] font-bold text-[10px]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPlusModal(b)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlusBenefit(b.id)}
                        className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#151C2C] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? "Edit Pricing Category" : "Add Pricing Category"}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Operators, B2B Providers"
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Slug</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. operators"
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    className="rounded accent-[#4F6BFF]"
                  />
                  <span>Is Active</span>
                </label>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.show_on_public_page}
                    onChange={(e) => setCategoryForm({ ...categoryForm, show_on_public_page: e.target.checked })}
                    className="rounded accent-[#4F6BFF]"
                  />
                  <span>Show on Public Page</span>
                </label>

                <label className="flex items-center gap-2 text-[#F59E0B] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_plus_layout}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_plus_layout: e.target.checked })}
                    className="rounded accent-[#F59E0B]"
                  />
                  <span>Use Special PLUS Layout</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#4F6BFF] text-white font-bold hover:bg-[#3B54E6]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#151C2C] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPlan ? "Edit Pricing Plan" : "Add Pricing Plan"}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Category</label>
                <select
                  required
                  value={planForm.category_id}
                  onChange={(e) => setPlanForm({ ...planForm, category_id: e.target.value })}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Gold"
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Tagline / Short Desc</label>
                  <input
                    type="text"
                    value={planForm.short_description}
                    onChange={(e) => setPlanForm({ ...planForm, short_description: e.target.value })}
                    placeholder="Accelerate Partnerships"
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Price</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Currency</label>
                  <input
                    type="text"
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Billing Period</label>
                  <input
                    type="text"
                    value={planForm.billing_period}
                    onChange={(e) => setPlanForm({ ...planForm, billing_period: e.target.value })}
                    placeholder="/ year"
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Badge Text</label>
                  <input
                    type="text"
                    value={planForm.badge_text}
                    onChange={(e) => setPlanForm({ ...planForm, badge_text: e.target.value })}
                    placeholder="Most Popular"
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    value={planForm.display_order}
                    onChange={(e) => setPlanForm({ ...planForm, display_order: Number(e.target.value) })}
                    className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_featured}
                    onChange={(e) => setPlanForm({ ...planForm, is_featured: e.target.checked })}
                    className="rounded accent-[#4F6BFF]"
                  />
                  <span>Is Featured</span>
                </label>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_popular}
                    onChange={(e) => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                    className="rounded accent-[#4F6BFF]"
                  />
                  <span>Is Popular</span>
                </label>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="rounded accent-[#4F6BFF]"
                  />
                  <span>Is Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#4F6BFF] text-white font-bold hover:bg-[#3B54E6]"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEATURE MODAL */}
      {isFeatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#151C2C] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingFeature ? "Edit Plan Feature" : "Add Plan Feature"}
              </h3>
              <button onClick={() => setIsFeatureModalOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeature} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Pricing Plan</label>
                <select
                  required
                  value={featureForm.pricing_plan_id}
                  onChange={(e) => setFeatureForm({ ...featureForm, pricing_plan_id: e.target.value })}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Feature Text</label>
                <input
                  type="text"
                  required
                  value={featureForm.feature_text}
                  onChange={(e) => setFeatureForm({ ...featureForm, feature_text: e.target.value })}
                  placeholder="e.g. Direct Access & Visibility"
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  value={featureForm.display_order}
                  onChange={(e) => setFeatureForm({ ...featureForm, display_order: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <label className="flex items-center gap-2 text-white cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={featureForm.is_included}
                  onChange={(e) => setFeatureForm({ ...featureForm, is_included: e.target.checked })}
                  className="rounded accent-[#4F6BFF]"
                />
                <span>Is Included (Checkmark ✓) vs Excluded (Cross ✕)</span>
              </label>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#4F6BFF] text-white font-bold hover:bg-[#3B54E6]"
                >
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLUS BENEFIT MODAL */}
      {isPlusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#151C2C] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPlusBenefit ? "Edit PLUS Benefit" : "Add PLUS Benefit"}
              </h3>
              <button onClick={() => setIsPlusModalOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlusBenefit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  value={plusForm.title}
                  onChange={(e) => setPlusForm({ ...plusForm, title: e.target.value })}
                  placeholder="e.g. Main Top List"
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Description</label>
                <textarea
                  required
                  rows={3}
                  value={plusForm.description}
                  onChange={(e) => setPlusForm({ ...plusForm, description: e.target.value })}
                  placeholder="Detailed benefit description..."
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  value={plusForm.display_order}
                  onChange={(e) => setPlusForm({ ...plusForm, display_order: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#111726] border border-white/[0.08] p-3 text-white outline-none focus:border-[#4F6BFF]"
                />
              </div>

              <label className="flex items-center gap-2 text-white cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={plusForm.is_active}
                  onChange={(e) => setPlusForm({ ...plusForm, is_active: e.target.checked })}
                  className="rounded accent-[#4F6BFF]"
                />
                <span>Is Active</span>
              </label>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPlusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#4F6BFF] text-white font-bold hover:bg-[#3B54E6]"
                >
                  Save Benefit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
