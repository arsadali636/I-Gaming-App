"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Share2,
  Gamepad2,
  CreditCard,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BusinessRole } from "@/types";

export default function AdminBusinessRolesPage() {
  const [roles, setRoles] = useState<BusinessRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<BusinessRole | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Building2");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [sortOrder, setSortOrder] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/business-roles");
      const data = await res.json();
      if (res.ok) setRoles(data.business_roles || []);
    } catch (err) {
      console.error("Error fetching business roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setIcon("Building2");
    setStatus("active");
    setSortOrder(roles.length + 1);
    setError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (role: BusinessRole) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setIcon(role.icon || "Building2");
    setStatus(role.status);
    setSortOrder(role.sort_order);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingRole
        ? `/api/admin/business-roles/${editingRole.id}`
        : "/api/admin/business-roles";
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon,
          status,
          sort_order: Number(sortOrder),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save business role");
        return;
      }

      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (role: BusinessRole) => {
    try {
      const nextStatus = role.status === "active" ? "inactive" : "active";
      await fetch(`/api/admin/business-roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchRoles();
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
            Business Roles Management
          </h1>
          <p className="text-xs text-[#A1A9B8] mt-1">
            Manage primary business classification categories for registration & Marketplace filters.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-2"
        >
          <Plus size={16} />
          Add Business Role
        </Button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 glass-card">
          <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 border border-[#252A3A] relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]/15 text-[#4F46E5] font-bold border border-[#4F46E5]/20">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#F8FAFC]">{role.name}</h3>
                      <p className="text-[11px] text-[#A1A9B8] font-mono">slug: {role.slug}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(role)}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                      role.status === "active"
                        ? "bg-[#22C1DC]/10 text-[#22C1DC] border-[#22C1DC]/30"
                        : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                    }`}
                  >
                    {role.status === "active" ? (
                      <>
                        <CheckCircle2 size={10} /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={10} /> Inactive
                      </>
                    )}
                  </button>
                </div>

                {role.description && (
                  <p className="text-xs text-[#A1A9B8] leading-relaxed mb-4">
                    {role.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#252A3A] pt-3 mt-2">
                <span className="text-[11px] text-[#6B7280]">
                  Sort Order: <span className="text-[#F8FAFC] font-semibold">{role.sort_order}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 rounded-lg text-[#A1A9B8] hover:text-[#F8FAFC] hover:bg-[#1A2030] transition-colors cursor-pointer"
                    title="Edit role"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
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
              {editingRole ? "Edit Business Role" : "Add Business Role"}
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
                Role Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Compliance Provider"
                required
                className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#A1A9B8]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this business category"
                rows={3}
                className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A9B8]">
                  Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-xl border border-[#252A3A] bg-[#111522] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#4F46E5] outline-none cursor-pointer"
                >
                  <option value="Building2">Building2 (Operator)</option>
                  <option value="Share2">Share2 (Affiliate)</option>
                  <option value="Gamepad2">Gamepad2 (Games)</option>
                  <option value="Layers">Layers (Aggregator)</option>
                  <option value="CreditCard">CreditCard (Payment)</option>
                </select>
              </div>

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
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
