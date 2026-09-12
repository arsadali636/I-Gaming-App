"use client";

import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  Building2,
  Users,
  Globe,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminOffer {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name?: string;
  brand?: string;
  offer_type: "affiliate" | "operator";
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

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<AdminOffer | null>(null);
  const [saving, setSaving] = useState(false);

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    company_id: "",
    brand: "",
    offer_type: "affiliate" as "affiliate" | "operator",
    geo: "Global",
    traffic_type: "SEO, PPC, Social",
    vertical: "Casino & Sportsbook",
    payout: 100,
    currency: "$",
    payout_type: "CPA",
    payout_description: "Per First Time Deposit (FTD)",
    conversion_event: "FTD",
    description: "",
    status: "active",
    is_featured: false,
  });

  useEffect(() => {
    fetchOffers();
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/admin/companies?limit=100");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  }

  async function fetchOffers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/offers");
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (err) {
      console.error("Error fetching admin offers:", err);
    } finally {
      setLoading(false);
    }
  }

  const openNewOfferModal = (defaultType: "affiliate" | "operator" = "affiliate") => {
    setEditingOffer(null);
    setForm({
      title: "",
      slug: "",
      company_id: companies[0]?.id || "",
      brand: "",
      offer_type: defaultType,
      geo: "Global",
      traffic_type: "SEO, PPC, Social",
      vertical: "Casino & Sportsbook",
      payout: 150,
      currency: "$",
      payout_type: "CPA",
      payout_description: "Per First Time Deposit (FTD)",
      conversion_event: "FTD",
      description: "",
      status: "active",
      is_featured: false,
    });
    setModalOpen(true);
  };

  const openEditOfferModal = (offer: AdminOffer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      slug: offer.slug,
      company_id: offer.company_id || "",
      brand: offer.brand || offer.company_name || "",
      offer_type: (offer.offer_type as "affiliate" | "operator") || "affiliate",
      geo: offer.geo || "Global",
      traffic_type: offer.traffic_type || "SEO, PPC",
      vertical: offer.vertical || "Casino",
      payout: offer.payout || 0,
      currency: offer.currency || "$",
      payout_type: offer.payout_type || "CPA",
      payout_description: offer.payout_description || "",
      conversion_event: offer.conversion_event || "FTD",
      description: offer.description || "",
      status: offer.status || "active",
      is_featured: offer.is_featured === 1,
    });
    setModalOpen(true);
  };

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingOffer ? "PUT" : "POST";
      const payload = editingOffer ? { ...form, id: editingOffer.id } : form;

      const res = await fetch("/api/admin/offers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchOffers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save offer: ${errData.error || errData.details || "Server error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving offer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchOffers();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.brand && o.brand.toLowerCase().includes(search.toLowerCase())) ||
      (o.company_name && o.company_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      selectedTypeFilter === "all"
        ? true
        : selectedTypeFilter === "affiliate"
        ? o.offer_type === "affiliate" || !o.offer_type
        : o.offer_type === "operator";

    return matchesSearch && matchesType;
  });

  const affiliateCount = offers.filter((o) => o.offer_type === "affiliate" || !o.offer_type).length;
  const operatorCount = offers.filter((o) => o.offer_type === "operator").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#4F46E5]" />
            Offers & Deals Management
          </h1>
          <p className="text-xs text-[#A1A9B8] mt-1">
            Super Admin control panel to dynamically manage Affiliate Offers and Operator Offers for the iGaming Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openNewOfferModal("affiliate")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#4338CA] transition-all cursor-pointer"
          >
            <Users className="h-4 w-4 text-[#60A5FA]" />
            <span>+ Add Affiliate Offer</span>
          </button>

          <button
            onClick={() => openNewOfferModal("operator")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#047857] transition-all cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-[#34D399]" />
            <span>+ Add Operator Offer</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D1220] p-4 rounded-2xl border border-[#252A3A] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Offers</p>
            <p className="text-2xl font-black text-white mt-1">{loading ? "..." : offers.length}</p>
          </div>
          <Tag className="h-8 w-8 text-[#4F46E5] opacity-60" />
        </div>

        <div className="bg-[#0D1220] p-4 rounded-2xl border border-[#252A3A] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Affiliate Offers [NEW]</p>
            <p className="text-2xl font-black text-[#60A5FA] mt-1">{loading ? "..." : affiliateCount}</p>
          </div>
          <Users className="h-8 w-8 text-[#60A5FA] opacity-60" />
        </div>

        <div className="bg-[#0D1220] p-4 rounded-2xl border border-[#252A3A] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Operator Offers</p>
            <p className="text-2xl font-black text-[#34D399] mt-1">{loading ? "..." : operatorCount}</p>
          </div>
          <Building2 className="h-8 w-8 text-[#34D399] opacity-60" />
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTypeFilter("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              selectedTypeFilter === "all"
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-[#0D1220] text-[#94A3B8] border-[#252A3A] hover:text-white"
            )}
          >
            All Offers ({offers.length})
          </button>

          <button
            onClick={() => setSelectedTypeFilter("affiliate")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              selectedTypeFilter === "affiliate"
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-[#0D1220] text-[#94A3B8] border-[#252A3A] hover:text-white"
            )}
          >
            <Users className="h-3.5 w-3.5 text-[#60A5FA]" />
            <span>Affiliate Offers ({affiliateCount})</span>
          </button>

          <button
            onClick={() => setSelectedTypeFilter("operator")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              selectedTypeFilter === "operator"
                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                : "bg-[#0D1220] text-[#94A3B8] border-[#252A3A] hover:text-white"
            )}
          >
            <Building2 className="h-3.5 w-3.5 text-[#34D399]" />
            <span>Operator Offers ({operatorCount})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search offers by title or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#0D1220] border border-[#252A3A] pl-10 pr-4 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#4F46E5]"
          />
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#151C2C]" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#252A3A] bg-[#0D1220]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252A3A] bg-[#111726] text-[#94A3B8]">
                <th className="p-4">Offer Title</th>
                <th className="p-4">Offer Type</th>
                <th className="p-4">Payout</th>
                <th className="p-4">GEO</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A3A]">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94A3B8]">
                    No offers match the specified filter.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-4 font-semibold text-[#F8FAFC]">
                      <div className="flex flex-col max-w-xs">
                        <span className="truncate text-white font-bold">{offer.title}</span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {offer.brand || offer.company_name || "Verified Provider"} • {offer.vertical || "iGaming"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                          offer.offer_type === "operator"
                            ? "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30"
                            : "bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/30"
                        )}
                      >
                        {offer.offer_type === "operator" ? (
                          <>
                            <Building2 className="h-3 w-3" />
                            Operator
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" />
                            Affiliate
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[#34D399] font-bold">
                      {offer.payout_type}: {offer.currency}
                      {offer.payout}
                    </td>
                    <td className="p-4 text-[#94A3B8]">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-[#60A5FA]" />
                        <span>{offer.geo || "Global"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {offer.is_featured === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold">
                          <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-[#64748B]">No</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold capitalize",
                          offer.status === "active"
                            ? "bg-[#22C55E]/15 text-[#22C55E]"
                            : "bg-[#EF4444]/15 text-[#EF4444]"
                        )}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditOfferModal(offer)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#1F293D] hover:text-[#F8FAFC] cursor-pointer"
                          title="Edit Offer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                          title="Delete Offer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D1220] border border-[#252A3A] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#252A3A]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#4F46E5]" />
                <span>{editingOffer ? "Edit Offer" : "Create New Dynamic Offer"}</span>
              </h3>
              <span className="text-xs text-[#94A3B8]">Super Admin Tool</span>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Offer Type (Category) *</label>
                  <select
                    value={form.offer_type}
                    onChange={(e) => setForm({ ...form, offer_type: e.target.value as "affiliate" | "operator" })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white font-bold focus:outline-none focus:border-[#4F46E5] cursor-pointer"
                  >
                    <option value="affiliate">Affiliate Offer (Affiliate Deals)</option>
                    <option value="operator">Operator Offer (Operator Deals)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5] cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Casino Revenue Share Campaign"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Company / Operator</label>
                  <select
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5] cursor-pointer"
                  >
                    <option value="">Default Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Brand / Provider Name</label>
                  <input
                    type="text"
                    placeholder="e.g. BetVegas Studio"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Vertical</label>
                  <input
                    type="text"
                    placeholder="e.g. Casino, Sportsbook"
                    value={form.vertical}
                    onChange={(e) => setForm({ ...form, vertical: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Payout Model</label>
                  <select
                    value={form.payout_type}
                    onChange={(e) => setForm({ ...form, payout_type: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="CPA">CPA</option>
                    <option value="RevShare">RevShare (%)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CPL">CPL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Payout Amount</label>
                  <input
                    type="number"
                    value={form.payout}
                    onChange={(e) => setForm({ ...form, payout: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3 py-2 text-white font-mono focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">GEO / Countries</label>
                  <input
                    type="text"
                    placeholder="e.g. Global, DE, BR, LATAM"
                    value={form.geo}
                    onChange={(e) => setForm({ ...form, geo: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#94A3B8] font-semibold">Conversion Event</label>
                  <input
                    type="text"
                    placeholder="e.g. FTD, Reg + Deposit"
                    value={form.conversion_event}
                    onChange={(e) => setForm({ ...form, conversion_event: e.target.value })}
                    className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] font-semibold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Offer requirements, rules, target demographics..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl bg-[#151C2C] border border-[#252A3A] px-3.5 py-2 text-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded border-[#252A3A] bg-[#151C2C] text-[#4F46E5] h-4 w-4 cursor-pointer"
                />
                <label htmlFor="is_featured" className="font-bold text-[#F8FAFC] cursor-pointer">
                  Feature this Offer on Homepage / Top of list
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252A3A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA] cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
