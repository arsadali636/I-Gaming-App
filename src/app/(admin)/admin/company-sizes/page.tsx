"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Edit2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CompanySize } from "@/types";

export default function AdminCompanySizesPage() {
  const [sizes, setSizes] = useState<CompanySize[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<CompanySize | null>(null);

  // Form State
  const [label, setLabel] = useState("");
  const [minEmployees, setMinEmployees] = useState(0);
  const [maxEmployees, setMaxEmployees] = useState(0);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [sortOrder, setSortOrder] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/company-sizes");
      const data = await res.json();
      if (res.ok) setSizes(data.company_sizes || []);
    } catch (err) {
      console.error("Error fetching company sizes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  const handleOpenAdd = () => {
    setEditingSize(null);
    setLabel("");
    setMinEmployees(1);
    setMaxEmployees(10);
    setStatus("active");
    setSortOrder(sizes.length + 1);
    setError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (size: CompanySize) => {
    setEditingSize(size);
    setLabel(size.label);
    setMinEmployees(size.min_employees);
    setMaxEmployees(size.max_employees);
    setStatus(size.status);
    setSortOrder(size.sort_order);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingSize
        ? `/api/admin/company-sizes/${editingSize.id}`
        : "/api/admin/company-sizes";
      const method = editingSize ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          min_employees: Number(minEmployees),
          max_employees: Number(maxEmployees),
          status,
          sort_order: Number(sortOrder),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save company size");
        return;
      }

      setModalOpen(false);
      fetchSizes();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (size: CompanySize) => {
    try {
      const nextStatus = size.status === "active" ? "inactive" : "active";
      await fetch(`/api/admin/company-sizes/${size.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchSizes();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Company Sizes Master
          </h1>
          <p className="text-xs text-[#A1A9B8] mt-1">
            Manage configurable employee range options for Registration & Marketplace filters.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-2"
        >
          <Plus size={16} />
          Add Company Size
        </Button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 glass-card">
          <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sizes.map((size) => (
            <motion.div
              key={size.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border border-[#252A3A] relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22C1DC]/15 text-[#22C1DC] font-bold border border-[#22C1DC]/20">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#F8FAFC]">{size.label}</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(size)}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                      size.status === "active"
                        ? "bg-[#22C1DC]/10 text-[#22C1DC] border-[#22C1DC]/30"
                        : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                    }`}
                  >
                    {size.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#252A3A] pt-3 mt-3">
                <span className="text-[11px] text-[#6B7280]">
                  Sort: <span className="text-[#F8FAFC] font-semibold">{size.sort_order}</span>
                </span>

                <button
                  onClick={() => handleOpenEdit(size)}
                  className="p-1.5 rounded-lg text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#1A2030] transition-colors cursor-pointer"
                  title="Edit size"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0D101C] border-[#252A3A] text-[#F8FAFC] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#F8FAFC]">
              {editingSize ? "Edit Company Size" : "Add Company Size"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#A1A9B8]">
                Display Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. 50,000+ employees"
                required
                className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Min Employees
                </label>
                <input
                  type="number"
                  value={minEmployees}
                  onChange={(e) => setMinEmployees(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Max Employees
                </label>
                <input
                  type="number"
                  value={maxEmployees}
                  onChange={(e) => setMaxEmployees(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-[#252A3A] text-[#A1A9B8] hover:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Size"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
