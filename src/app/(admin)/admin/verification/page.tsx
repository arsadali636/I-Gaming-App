"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface VerificationRequest {
  id: string;
  company_id: string;
  requested_by: string;
  documents: string[];
  status: string;
  review_notes?: string;
  created_at: string;
  company?: { id: string; name: string; slug: string; logo_url?: string } | null;
  requester?: { id: string; full_name: string; email: string } | null;
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [reviewTarget, setReviewTarget] = useState<VerificationRequest | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/verification?status=pending&page=${page}&limit=20`
      );
      const data = await res.json();
      setRequests(data.requests || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });

      const statsRes = await fetch(
        `/api/admin/verification?status=pending&limit=1`
      );
      const statsData = await statsRes.json();
      setStats((s) => ({
        ...s,
        pending: statsData.pagination?.total ?? 0,
      }));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleReview(status: "approved" | "rejected") {
    if (!reviewTarget) return;
    setProcessing(true);
    try {
      await fetch("/api/admin/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: reviewTarget.id,
          status,
          review_notes: reviewNotes,
        }),
      });
      setReviewTarget(null);
      setReviewNotes("");
      fetchRequests();
    } catch {
      // silently fail
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Verification Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Review company verification submissions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15">
                <ShieldCheck className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.approvedToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected Today</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.rejectedToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Pending Requests
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No pending verification requests
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border/50 bg-glass-bg/30 p-4 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {req.company?.name ?? "Unknown Company"}
                        </p>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Requested by: {req.requester?.full_name ?? "Unknown"} (
                        {req.requester?.email ?? "—"})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {req.documents?.length ?? 0} document(s) submitted
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewTarget(req);
                          setReviewNotes("");
                        }}
                      >
                        Review
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

      <Dialog
        open={!!reviewTarget}
        onOpenChange={() => setReviewTarget(null)}
      >
        <DialogContent onClose={() => setReviewTarget(null)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
            <DialogDescription>
              Review the verification request for{" "}
              <strong>{reviewTarget?.company?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Documents Submitted
              </p>
              <div className="space-y-2">
                {reviewTarget?.documents?.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-glass-bg/30 p-3"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{doc}</span>
                  </div>
                ))}
                {(!reviewTarget?.documents ||
                  reviewTarget.documents.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Review Notes
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes (optional)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setReviewTarget(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview("rejected")}
              disabled={processing}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleReview("approved")}
              disabled={processing}
            >
              {processing ? "Processing..." : "Approve"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
