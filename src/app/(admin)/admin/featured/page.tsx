"use client";

import { useEffect, useState } from "react";
import {
  Star,
  Plus,
  X,
  GripVertical,
  Eye,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import type { Company } from "@/types";

export default function AdminFeaturedPage() {
  const [featured, setFeatured] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPreview, setViewPreview] = useState<Company | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/companies?limit=100");
      const data = await res.json();
      const companies = data.companies || [];
      setAllCompanies(companies);
      setFeatured(companies.filter((c: Company) => c.is_featured));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFeatured(company: Company) {
    try {
      await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.id,
          is_featured: !company.is_featured,
        }),
      });
      fetchData();
    } catch {
      // silently fail
    }
    setAddDialogOpen(false);
  }

  const filteredCompanies = allCompanies.filter(
    (c) =>
      !c.is_featured &&
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Featured Companies
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage featured listings on the marketplace
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Featured
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : featured.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No featured companies yet. Add companies to feature them on the
              marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((company, index) => (
            <Card key={company.id} className="group relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    <Badge variant="default">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      #{index + 1}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleToggleFeatured(company)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={company.logo_url} fallback={company.name} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {company.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(company.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewPreview(company)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent onClose={() => setAddDialogOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Featured Company</DialogTitle>
            <DialogDescription>
              Select a company to feature on the marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {allCompanies.filter((c) => c.is_featured).length ===
                  allCompanies.length
                    ? "All companies are already featured"
                    : "No companies found"}
                </p>
              ) : (
                filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-glass-bg/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={company.logo_url}
                        fallback={company.name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {company.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {company.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleToggleFeatured(company)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Feature
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPreview} onOpenChange={() => setViewPreview(null)}>
        <DialogContent onClose={() => setViewPreview(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marketplace Preview</DialogTitle>
            <DialogDescription>
              How {viewPreview?.name} appears on the marketplace
            </DialogDescription>
          </DialogHeader>
          {viewPreview && (
            <div className="rounded-xl border border-border/50 bg-glass-bg/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={viewPreview.logo_url} fallback={viewPreview.name} />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {viewPreview.name}
                  </h4>
                  {viewPreview.is_verified && (
                    <Badge variant="verified" className="mt-1">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {viewPreview.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
