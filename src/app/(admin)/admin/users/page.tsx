"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserCog,
  Trash2,
  Ban,
  Eye,
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
import { formatDate } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  company_owner: "Company Owner",
  company_member: "Company Member",
  professional: "Professional",
};

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  super_admin: "destructive",
  admin: "warning",
  moderator: "secondary",
  company_owner: "default",
  company_member: "default",
  professional: "success",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("professional");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, total_pages: 0 });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  async function handleRoleChange() {
    if (!roleModalUser) return;
    try {
      await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: roleModalUser.id, role: newRole }),
      });
      setRoleModalUser(null);
      fetchUsers();
    } catch {
      // silently fail
    }
  }

  async function handleSuspend(userId: string) {
    try {
      await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: "professional" }),
      });
      fetchUsers();
    } catch {
      // silently fail
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/admin/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      fetchUsers();
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their roles
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Roles</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Joined
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border/50 hover:bg-glass-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatar_url}
                              fallback={user.full_name}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={roleBadgeVariant[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {user.company_id || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {actionMenuId === user.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-background/95 backdrop-blur-xl shadow-xl">
                                <button
                                  onClick={() => {
                                    setRoleModalUser(user);
                                    setNewRole(user.role);
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-t-lg"
                                >
                                  <UserCog className="h-4 w-4" />
                                  Change Role
                                </button>
                                <button
                                  onClick={() => {
                                    handleSuspend(user.id);
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                                >
                                  <Ban className="h-4 w-4" />
                                  Suspend
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(user.id);
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
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

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg border border-border/50 bg-glass-bg/30 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar_url}
                        fallback={user.full_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant={roleBadgeVariant[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Joined {formatDate(user.created_at)}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleModalUser(user);
                            setNewRole(user.role);
                          }}
                        >
                          <UserCog className="h-3 w-3 mr-1" />
                          Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.total_pages} ({pagination.total}{" "}
                    users)
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

      <Dialog open={!!roleModalUser} onOpenChange={() => setRoleModalUser(null)}>
        <DialogContent onClose={() => setRoleModalUser(null)}>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleModalUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setRoleModalUser(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
