"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  reporter?: { id: string; full_name: string; email: string } | null;
  reviewer?: { id: string; full_name: string } | null;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  reviewed: "default",
  resolved: "success",
  dismissed: "warning",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function handleAction(reportId: string, action: string) {
    try {
      await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, status: action }),
      });
      fetchReports();
    } catch {
      // silently fail
    }
    setViewReport(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Report Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review and moderate platform reports
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Reporter
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Target
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Reason
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-foreground">
                            {report.reporter?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {report.reporter?.email ?? "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {report.target_type}: {report.target_id.slice(0, 8)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-[200px] truncate">
                          {report.reason}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant[report.status]}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-accent"
                                  onClick={() =>
                                    handleAction(report.id, "resolved")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() =>
                                    handleAction(report.id, "dismissed")
                                  }
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {report.reporter?.full_name ?? "Unknown"}
                      </p>
                      <Badge variant={statusVariant[report.status]}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {report.reason}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(report.created_at)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewReport(report)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.total_pages}
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

      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent onClose={() => setViewReport(null)}>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Report filed by {viewReport?.reporter?.full_name}
            </DialogDescription>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Target</span>
                  <p className="text-foreground">
                    <Badge variant="outline">
                      {viewReport.target_type}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p>
                    <Badge variant={statusVariant[viewReport.status]}>
                      {viewReport.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Reason</span>
                <p className="text-foreground mt-1">{viewReport.reason}</p>
              </div>
              {viewReport.description && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Description
                  </span>
                  <p className="text-foreground mt-1">
                    {viewReport.description}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">
                  Filed on
                </span>
                <p className="text-foreground">
                  {formatDate(viewReport.created_at)}
                </p>
              </div>
              {viewReport.status === "pending" && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(viewReport.id, "dismissed")}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(viewReport.id, "resolved")}
                  >
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
