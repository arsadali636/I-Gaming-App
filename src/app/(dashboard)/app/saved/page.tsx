"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  StickyNote,
  Edit3,
  Building2,
  MapPin,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

interface SavedCompanyItem {
  id: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  company_description?: string;
  company_headquarters?: string;
  notes?: string;
  created_at: string;
}

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<SavedCompanyItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-companies");
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = async (itemId: string, companyId: string) => {
    setSaved((prev) => prev.filter((s) => s.id !== itemId));
    try {
      await fetch(`/api/saved-companies/${companyId}`, { method: "DELETE" });
    } catch {
      fetchSaved();
    }
  };

  const openNoteDialog = (item: SavedCompanyItem) => {
    setSelected(item);
    setNoteText(item.notes ?? "");
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/saved-companies/${selected.company_id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });
      setSaved((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, notes: noteText } : s
        )
      );
      setNoteDialogOpen(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const sorted = [...saved].sort((a, b) => {
    if (sortBy === "name") return a.company_name.localeCompare(b.company_name);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Saved Companies</h2>
          <p className="text-muted-foreground mt-1">
            {saved.length} saved company{saved.length !== 1 ? "ies" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by:</span>
          <Button
            variant={sortBy === "date" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("date")}
          >
            Date
          </Button>
          <Button
            variant={sortBy === "name" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("name")}
          >
            Name
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No saved companies</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save companies from the marketplace to see them here.
          </p>
          <Link href="/app/marketplace">
            <Button variant="outline" className="gap-2">
              <Building2 size={14} /> Browse Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="hover:border-primary/30 transition-all h-full flex flex-col">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/app/company/${item.company_id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {item.company_logo ? (
                        <img
                          src={item.company_logo}
                          alt={item.company_name}
                          className="w-10 h-10 rounded-lg object-cover border border-glass-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {getInitials(item.company_name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          {item.company_name}
                        </h3>
                        {item.company_headquarters && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin size={10} /> {item.company_headquarters}
                          </div>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id, item.company_id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {item.company_description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {item.company_description}
                    </p>
                  )}

                  {item.notes && (
                    <div className="glass-card p-3 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StickyNote size={11} className="text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-glass-border">
                    <span className="text-[10px] text-muted-foreground">
                      Saved {formatDate(item.created_at)}
                    </span>
                    <button
                      onClick={() => openNoteDialog(item)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.notes ? <Edit3 size={12} /> : <StickyNote size={12} />}
                      {item.notes ? "Edit Note" : "Add Note"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent onClose={() => setNoteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Notes - {selected?.company_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this company..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNote} disabled={saving}>
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
