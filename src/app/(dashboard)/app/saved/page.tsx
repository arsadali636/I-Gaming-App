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
  FolderHeart,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, getInitials } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface SavedCompanyItem {
  id: string;
  company_id: string;
  company_name: string;
  company_slug?: string;
  company_logo?: string;
  company_description?: string;
  company_headquarters?: string;
  notes?: string;
  created_at: string;
}

interface SavedSearchItem {
  id: string;
  name: string;
  filters: {
    q?: string;
    search?: string;
    category?: string;
    country?: string;
    market?: string;
    is_verified?: boolean;
    verified?: boolean;
    verifiedOnly?: boolean;
  };
  created_at: string;
}

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedCompanyItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<SavedCompanyItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [activeTab, setActiveTab] = useState<"companies" | "searches">("companies");

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any>("/api/v1/saved-companies/");
      const list = Array.isArray(data) ? data : data.results ?? [];
      const normalized = list.map((item: any) => ({
        id: item.id,
        company_id: item.company_detail?.id || item.company,
        company_name: item.company_detail?.name || "Company",
        company_slug: item.company_detail?.slug || "",
        company_logo: item.company_detail?.logo_url,
        company_description: item.company_detail?.description,
        company_headquarters: item.company_detail?.country_detail?.name || item.company_detail?.country || "",
        notes: item.notes,
        created_at: item.created_at,
      }));
      setSaved(normalized);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    try {
      const data = await apiClient.get<any>("/api/v1/saved-searches/");
      const list = Array.isArray(data) ? data : data.results ?? [];
      setSavedSearches(list);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSaved();
    fetchSavedSearches();
  }, [fetchSaved, fetchSavedSearches]);

  const handleRemoveCompany = async (itemId: string) => {
    setSaved((prev) => prev.filter((s) => s.id !== itemId));
    try {
      await apiClient.delete(`/api/v1/saved-companies/${itemId}/`);
    } catch {
      fetchSaved();
    }
  };

  const handleRemoveSearch = async (searchId: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    try {
      await apiClient.delete(`/api/v1/saved-searches/${searchId}/`);
    } catch {
      fetchSavedSearches();
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
      await apiClient.patch(`/api/v1/saved-companies/${selected.id}/`, {
        notes: noteText,
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
          <h2 className="text-2xl font-bold text-foreground">Saved Items</h2>
          <p className="text-muted-foreground mt-1">
            Access your bookmarked companies and saved search criteria
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="companies" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="companies" className="gap-2">
              <Bookmark size={14} /> Companies ({saved.length})
            </TabsTrigger>
            <TabsTrigger value="searches" className="gap-2">
              <FolderHeart size={14} /> Searches ({savedSearches.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "companies" && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs">Sort:</span>
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
          )}
        </div>

        <TabsContent value="companies" className="mt-6">
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
                          href={`/app/company/${item.company_slug || item.company_id}`}
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
                          onClick={() => handleRemoveCompany(item.id)}
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
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <StickyNote size={11} className="text-primary" />
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</span>
                            </div>
                            <button
                              onClick={() => openNoteDialog(item)}
                              className="text-[10px] text-neon-cyan hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-xs text-foreground line-clamp-3">{item.notes}</p>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-glass-border">
                        <span className="text-[10px] text-muted-foreground">
                          Saved {formatDate(item.created_at)}
                        </span>
                        {!item.notes && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openNoteDialog(item)}
                            className="h-7 text-xs gap-1"
                          >
                            <Edit3 size={11} /> Add Note
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="searches" className="mt-6">
          {savedSearches.length === 0 ? (
            <div className="text-center py-16">
              <FolderHeart size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No saved searches</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save filter sets from the marketplace to quickly re-use them.
              </p>
              <Link href="/app/marketplace">
                <Button variant="outline" className="gap-2">
                  <Building2 size={14} /> Go to Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSearches.map((searchItem) => (
                <Card key={searchItem.id} className="hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">
                          {searchItem.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Created {formatDate(searchItem.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveSearch(searchItem.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {searchItem.filters?.search && (
                        <Badge variant="secondary" className="text-[10px]">
                          q: {searchItem.filters.search}
                        </Badge>
                      )}
                      {searchItem.filters?.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          cat: {searchItem.filters.category}
                        </Badge>
                      )}
                      {searchItem.filters?.country && (
                        <Badge variant="secondary" className="text-[10px]">
                          country: {searchItem.filters.country}
                        </Badge>
                      )}
                      {searchItem.filters?.market && (
                        <Badge variant="secondary" className="text-[10px]">
                          market: {searchItem.filters.market}
                        </Badge>
                      )}
                      {searchItem.filters?.verifiedOnly && (
                        <Badge variant="default" className="text-[10px]">
                          Verified
                        </Badge>
                      )}
                    </div>

                    <Link href="/app/marketplace">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <ExternalLink size={12} /> Open in Marketplace
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Company Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Add private notes about {selected?.company_name} for your team.
            </p>
            <Textarea
              placeholder="e.g. Spoke with BD lead at iGB Live..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={saving}>
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
