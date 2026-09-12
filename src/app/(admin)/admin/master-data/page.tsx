"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Globe,
  Layers,
  Share2,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MasterRecord {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  region?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: number | boolean;
  status?: string;
  company_count?: number;
}

const TABS = [
  { id: "categories", label: "Categories", icon: Tag },
  { id: "geos", label: "GEOs / Countries", icon: Globe },
  { id: "software_types", label: "Software Types", icon: Layers },
  { id: "service_types", label: "Service Types", icon: Share2 },
  { id: "licenses", label: "Licenses", icon: Shield },
];

export default function AdminMasterDataPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editRecord, setEditRecord] = useState<MasterRecord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    code: "",
    region: "Global",
    description: "",
    icon: "Building2",
    color: "#4F6BFF",
    sort_order: 1,
    status: "active",
  });

  useEffect(() => {
    fetchMasterData(activeTab);
  }, [activeTab]);

  async function fetchMasterData(tab: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/master-data?type=${tab}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load master data:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({
      name: "",
      slug: "",
      code: "",
      region: "Global",
      description: "",
      icon: activeTab === "categories" ? "Building2" : "Tag",
      color: "#4F6BFF",
      sort_order: records.length + 1,
      status: "active",
    });
    setShowAddForm(true);
  }

  function openEdit(rec: MasterRecord) {
    setForm({
      name: rec.name,
      slug: rec.slug || "",
      code: rec.code || "",
      region: rec.region || "Global",
      description: rec.description || "",
      icon: rec.icon || "Building2",
      color: rec.color || "#4F6BFF",
      sort_order: rec.sort_order ?? 1,
      status: rec.status || (rec.is_active ? "active" : "inactive"),
    });
    setEditRecord(rec);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const method = editRecord ? "PUT" : "POST";
      const payload = {
        type: activeTab,
        ...(editRecord ? { id: editRecord.id } : {}),
        ...form,
      };

      const res = await fetch("/api/admin/master-data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddForm(false);
        setEditRecord(null);
        fetchMasterData(activeTab);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save record");
      }
    } catch (err) {
      console.error("Error saving master record:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure? If referenced by existing records, it will be safely deactivated.")) return;
    try {
      const res = await fetch(`/api/admin/master-data?type=${activeTab}&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        alert(json.message || "Record updated");
        fetchMasterData(activeTab);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete record");
      }
    } catch (err) {
      console.error("Error deleting master record:", err);
    }
  }

  const filteredRecords = records.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.slug && r.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Master Data Management</h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Manage iGaming Connect platform categories, GEOs, software types, service types, and licenses.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-[#4F6BFF] hover:bg-[#3B54E6] text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Master Item
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-[#111827] border border-white/[0.08] scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/30"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab.replace("_", " ")}...`}
          className="w-full rounded-xl border border-white/10 bg-[#111827] pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#4F6BFF]"
        />
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="border border-white/10 bg-[#111827]">
          <CardContent className="p-8 text-center text-[#94A3B8]">
            <p className="text-sm font-semibold">No records found for this master type.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((rec) => {
            const isActive = rec.status === "active" || rec.is_active === 1 || rec.is_active === true;
            return (
              <Card key={rec.id} className="border border-white/[0.08] bg-[#111827] hover:border-white/20 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{rec.name}</h3>
                        {isActive ? (
                          <Badge variant="outline" className="text-[10px] text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {rec.slug && <p className="text-[11px] text-[#60A5FA] font-mono mt-0.5">/{rec.slug}</p>}
                      {rec.code && <p className="text-[11px] text-[#60A5FA] font-mono mt-0.5">Code: {rec.code}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#94A3B8] hover:text-white" onClick={() => openEdit(rec)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete(rec.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {rec.description && <p className="text-xs text-[#94A3B8] line-clamp-2">{rec.description}</p>}

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#64748B]">
                    {rec.sort_order !== undefined && <span>Order: {rec.sort_order}</span>}
                    <Badge variant="secondary" className="text-[10px] bg-white/[0.05] text-[#94A3B8]">
                      {rec.company_count ?? 0} Companies
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog Modal */}
      <Dialog
        open={showAddForm || !!editRecord}
        onOpenChange={() => {
          setShowAddForm(false);
          setEditRecord(null);
        }}
      >
        <DialogContent
          onClose={() => {
            setShowAddForm(false);
            setEditRecord(null);
          }}
          className="bg-[#151C2C] border-white/10 text-white max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Master Record" : "Add Master Record"}</DialogTitle>
            <DialogDescription className="text-xs text-[#94A3B8]">
              {editRecord ? "Update details for this master item" : `Add a new item to ${activeTab.replace("_", " ")}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Item name..."
                className="bg-[#080C16] border-white/10 text-xs text-white"
              />
            </div>

            {activeTab !== "geos" && (
              <div>
                <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Slug (Optional)</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="item-slug"
                  className="bg-[#080C16] border-white/10 text-xs text-white"
                />
              </div>
            )}

            {activeTab === "geos" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#94A3B8] mb-1 block">ISO Code *</label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. MT, GB, US"
                    className="bg-[#080C16] border-white/10 text-xs text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Region</label>
                  <Input
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="Europe, Asia..."
                    className="bg-[#080C16] border-white/10 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div>
                <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description..."
                  rows={2}
                  className="bg-[#080C16] border-white/10 text-xs text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Sort Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="bg-[#080C16] border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#94A3B8] mb-1 block">Status</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: form.status === "active" ? "inactive" : "active" })}
                  className={`w-full py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                    form.status === "active"
                      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                      : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                  }`}
                >
                  {form.status === "active" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span className="capitalize">{form.status}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditRecord(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-[#4F6BFF] text-white font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editRecord ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
