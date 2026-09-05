"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Briefcase,
  Handshake,
  Target,
  Clock,
  DollarSign,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, getInitials } from "@/lib/utils";
import type { Opportunity } from "@/types";

const TYPE_CONFIG = {
  looking_for: {
    label: "Looking For",
    icon: Target,
    variant: "default" as const,
    color: "text-neon-cyan",
  },
  offering: {
    label: "Offering",
    icon: Briefcase,
    variant: "success" as const,
    color: "text-accent",
  },
  partnership: {
    label: "Partnership",
    icon: Handshake,
    variant: "secondary" as const,
    color: "text-neon-purple",
  },
};

const CATEGORIES = [
  "Sportsbook",
  "Casino",
  "Slots",
  "Bingo",
  "Payments",
  "Compliance",
  "Marketing",
  "Technology",
  "Content",
  "Other",
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "looking_for" as "looking_for" | "offering" | "partnership",
    category: "",
    budget: "",
    timeline: "",
  });

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      if (filterCategory) params.set("category", filterCategory);

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [search, filterType, filterCategory]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities((prev) => [data.opportunity, ...prev]);
        setCreateOpen(false);
        setForm({ title: "", description: "", type: "looking_for", category: "", budget: "", timeline: "" });
      }
    } catch {} finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Business Opportunities</h2>
          <p className="text-muted-foreground mt-1">
            Find and post business opportunities
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} /> New Opportunity
        </Button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="looking_for">Looking For</option>
          <option value="offering">Offering</option>
          <option value="partnership">Partnership</option>
        </Select>
        <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No opportunities found</h3>
          <p className="text-sm text-muted-foreground">
            {search || filterType || filterCategory
              ? "Try adjusting your search or filters."
              : "Be the first to post an opportunity!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp, i) => {
            const config = TYPE_CONFIG[opp.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="hover:border-primary/30 transition-all h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={config.variant} className="gap-1">
                        <Icon size={12} /> {config.label}
                      </Badge>
                      {opp.status !== "open" && (
                        <Badge variant="outline" className="text-[10px]">
                          {opp.status}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                      {opp.description}
                    </p>

                    <div className="mt-auto space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {opp.category_id && (
                          <span className="flex items-center gap-1">
                            <Filter size={10} /> {opp.category_id}
                          </span>
                        )}
                        {opp.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={10} /> {opp.budget}
                          </span>
                        )}
                        {opp.timeline && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {opp.timeline}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={undefined}
                            fallback={opp.created_by}
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(opp.created_at)}
                          </span>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="opp-title">Title</Label>
              <Input
                id="opp-title"
                placeholder="e.g. Looking for Payment Provider"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="opp-desc">Description</Label>
              <Textarea
                id="opp-desc"
                placeholder="Describe your opportunity..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as "looking_for" | "offering" | "partnership",
                    }))
                  }
                >
                  <option value="looking_for">Looking For</option>
                  <option value="offering">Offering</option>
                  <option value="partnership">Partnership</option>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="opp-budget">Budget (optional)</Label>
                <Input
                  id="opp-budget"
                  placeholder="e.g. $10k-$50k"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="opp-timeline">Timeline (optional)</Label>
                <Input
                  id="opp-timeline"
                  placeholder="e.g. 3 months"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !form.title.trim() || !form.description.trim()}>
                {creating ? "Creating..." : "Create Opportunity"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
