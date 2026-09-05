"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r border-glass-border glass">
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-36" />
            <div className="space-y-2 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-16 w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
