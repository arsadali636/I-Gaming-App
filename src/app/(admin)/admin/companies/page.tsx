"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
  Star,
  Eye,
  Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { Company } from "@/types";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  suspended: "destructive",
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: string;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [viewCompany, setViewCompany] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function executeAction(action: string, companyId: string) {
    try {
      if (action === "approve") {
        await fetch(`/api/admin/companies`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, status: "approved" }),
        });
      } else if (action === "reject") {
        await fetch(`/api/admin/companies`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, status: "rejected" }),
        });
      } else if (action === "suspend") {
        await fetch(`/api/admin/companies`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, status: "suspended" }),
        });
      } else if (action === "feature" || action === "unfeature") {
        await fetch(`/api/admin/featured`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            is_featured: action === "feature",
          }),
        });
      }
      fetchCompanies();
    } catch {
      // silently fail
    }
    setConfirmDialog(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Company Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage platform companies
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No companies found
            </p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Verified
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Featured
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
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
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {company.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant[company.status]}>
                            {company.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {company.is_verified ? (
                            <Badge variant="verified">Verified</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {company.is_featured ? (
                            <Badge variant="default">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(company.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setActionMenuId(
                                  actionMenuId === company.id ? null : company.id
                                )
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {actionMenuId === company.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-background/95 backdrop-blur-xl shadow-xl">
                                <button
                                  onClick={() => {
                                    setViewCompany(company);
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-t-lg"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>
                                {company.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setConfirmDialog({
                                          action: "approve",
                                          companyId: company.id,
                                          companyName: company.name,
                                        });
                                        setActionMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmDialog({
                                          action: "reject",
                                          companyId: company.id,
                                          companyName: company.name,
                                        });
                                        setActionMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                {company.status !== "suspended" && (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        action: "suspend",
                                        companyId: company.id,
                                        companyName: company.name,
                                      });
                                      setActionMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      action: company.is_featured
                                        ? "unfeature"
                                        : "feature",
                                      companyId: company.id,
                                      companyName: company.name,
                                    });
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-b-lg"
                                >
                                  <Star className="h-4 w-4" />
                                  {company.is_featured
                                    ? "Remove Featured"
                                    : "Feature"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={company.logo_url}
                        fallback={company.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {company.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={statusVariant[company.status]}>
                            {company.status}
                          </Badge>
                          {company.is_verified && (
                            <Badge variant="verified">Verified</Badge>
                          )}
                          {company.is_featured && (
                            <Badge variant="default">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(company.created_at)}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewCompany(company)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {company.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirmDialog({
                                action: "approve",
                                companyId: company.id,
                                companyName: company.name,
                              })
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.total_pages} (
                    {pagination.total} companies)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!confirmDialog}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <DialogContent onClose={() => setConfirmDialog(null)}>
          <DialogHeader>
            <DialogTitle>
              Confirm {confirmDialog?.action?.charAt(0).toUpperCase()}
              {confirmDialog?.action?.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog?.action}{" "}
              <strong>{confirmDialog?.companyName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog?.action === "reject" ||
                confirmDialog?.action === "suspend"
                  ? "destructive"
                  : "default"
              }
              onClick={() =>
                confirmDialog &&
                executeAction(confirmDialog.action, confirmDialog.companyId)
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCompany} onOpenChange={() => setViewCompany(null)}>
        <DialogContent onClose={() => setViewCompany(null)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewCompany?.name}</DialogTitle>
            <DialogDescription>Company details</DialogDescription>
          </DialogHeader>
          {viewCompany && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar
                  src={viewCompany.logo_url}
                  fallback={viewCompany.name}
                  size="lg"
                />
                <div>
                  <Badge variant={statusVariant[viewCompany.status]}>
                    {viewCompany.status}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">{viewCompany.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Website</span>
                  <p className="text-foreground">{viewCompany.website || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Market</span>
                  <p className="text-foreground">{viewCompany.market || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Headquarters
                  </span>
                  <p className="text-foreground">
                    {viewCompany.headquarters || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Employees</span>
                  <p className="text-foreground">
                    {viewCompany.employee_count || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Verified
                  </span>
                  <p className="text-foreground">
                    {viewCompany.is_verified ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Featured</span>
                  <p className="text-foreground">
                    {viewCompany.is_featured ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Created</span>
                <p className="text-foreground">
                  {formatDate(viewCompany.created_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
