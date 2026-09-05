"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Crown,
  Mail,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Member {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  invited_at?: string;
  accepted_at?: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "success"> = {
  owner: "default",
  admin: "secondary",
  member: "success",
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const companyId = user?.company_id;

  const fetchMembers = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await apiClient.get<any>(`/api/v1/companies/${companyId}/members/`);
      const memberList = Array.isArray(data) ? data : (data.members ?? data.results ?? []);
      setMembers(memberList.map((m: any) => ({
        id: m.id,
        company_id: m.company || companyId,
        user_id: m.user?.id || m.user_id || m.user,
        role: m.role || "member",
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
        users: m.user_detail || m.users || {
          id: m.user?.id || m.user_id,
          full_name: m.user?.full_name || m.full_name || "Team Member",
          email: m.user?.email || m.email || "",
        },
      })));
    } catch {} finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!companyId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");

    try {
      await apiClient.post(`/api/v1/companies/${companyId}/members/`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchMembers();
    } catch (err: any) {
      setInviteError(err?.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!companyId) return;
    setRemoving(memberId);

    try {
      await apiClient.delete(`/api/v1/companies/${companyId}/members/${memberId}/`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {} finally {
      setRemoving(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!companyId) return;
    setChangingRole(memberId);

    try {
      await apiClient.patch(`/api/v1/companies/${companyId}/members/${memberId}/`, {
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: newRole as Member["role"] } : m
        )
      );
    } catch {} finally {
      setChangingRole(null);
    }
  };

  const isOwner = members.some(
    (m) => m.user_id === user?.id && m.role === "owner"
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Link href="/app/company-profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
            <p className="text-muted-foreground mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus size={16} />
            Invite Member
          </Button>
        )}
      </motion.div>

      <div className="space-y-3">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                      {member.users?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() ?? "??"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.users?.full_name ?? "Unknown"}
                        </p>
                        {member.role === "owner" && (
                          <Crown size={14} className="text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.users?.email ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={roleBadgeVariant[member.role] ?? "secondary"}>
                      {member.role}
                    </Badge>

                    {isOwner && member.role !== "owner" && (
                      <>
                        <Select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(member.id, e.target.value)
                          }
                          disabled={changingRole === member.id}
                          className="w-28"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removing === member.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {removing === member.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {member.invited_at && !member.accepted_at && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail size={10} />
                    Invited {formatDate(member.invited_at)} - Pending
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No team members</h3>
          <p className="text-sm text-muted-foreground">
            Invite colleagues to collaborate on your company profile.
          </p>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent onClose={() => setInviteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          {inviteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inviteError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                The person must already have an account on iGaming Connect.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="gap-2"
              >
                {inviting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
