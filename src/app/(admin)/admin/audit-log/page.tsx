"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types";

const actionColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  feature_company: "default",
  unfeature_company: "secondary",
  approve_company: "success",
  reject_company: "destructive",
  suspend_company: "destructive",
  change_role: "warning",
  delete_user: "destructive",
  resolve_report: "success",
  dismiss_report: "secondary",
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity_type", entityFilter);
      if (userFilter) params.set("user_id", userFilter);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, userFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter, userFilter, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Track all admin actions across the platform
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="feature_company">Feature Company</option>
              <option value="unfeature_company">Unfeature Company</option>
              <option value="approve_company">Approve Company</option>
              <option value="reject_company">Reject Company</option>
              <option value="suspend_company">Suspend Company</option>
              <option value="change_role">Change Role</option>
              <option value="delete_user">Delete User</option>
              <option value="resolve_report">Resolve Report</option>
              <option value="dismiss_report">Dismiss Report</option>
            </Select>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="company">Company</option>
              <option value="user">User</option>
              <option value="report">Report</option>
              <option value="verification">Verification</option>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />
            <Input
              placeholder="User ID"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-8" />
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Timestamp
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Action
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Entity
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <Fragment key={log.id}>
                        <tr
                          className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === log.id ? null : log.id
                            )
                          }
                        >
                          <td className="py-3 px-4">
                            {expandedRow === log.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {(log as any).user?.full_name ?? "System"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                actionColors[log.action] || "default"
                              }
                            >
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {log.entity_type}
                            {log.entity_id && (
                              <span className="ml-1 text-xs">
                                ({log.entity_id.slice(0, 8)})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell font-mono">
                            {log.ip_address ?? "—"}
                          </td>
                        </tr>
                        {expandedRow === log.id && (
                          <tr key={`${log.id}-details`}>
                            <td colSpan={6} className="px-4 pb-4">
                              <div className="rounded-lg border border-border/50 bg-glass-bg/30 p-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Details
                                </p>
                                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap overflow-x-auto">
                                  {log.details
                                    ? JSON.stringify(log.details, null, 2)
                                    : "No additional details"}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.total_pages} (
                    {pagination.total} entries)
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
    </div>
  );
}
