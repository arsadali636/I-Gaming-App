"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/layout/admin-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r border-glass-border glass">
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-36" />
            <div className="space-y-2 mt-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-16 w-full" />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="glass-card rounded-xl p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin panel. This area is
            restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
