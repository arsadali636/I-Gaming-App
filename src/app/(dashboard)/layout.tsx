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
      <div className="flex h-screen bg-[#090D18]">
        <div className="w-64 border-r border-white/[0.06] bg-[#090D18]">
          <div className="p-6 space-y-4">
            <Skeleton className="h-9 w-36 bg-[#151C2C] rounded-xl" />
            <div className="space-y-2 mt-8">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-[#151C2C] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 bg-[#090D18]">
          <Skeleton className="h-16 w-full bg-[#111827] rounded-none border-b border-white/[0.06]" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-32 w-full bg-[#151C2C] rounded-2xl" />
            <div className="grid grid-cols-3 gap-5">
              <Skeleton className="h-32 bg-[#151C2C] rounded-2xl" />
              <Skeleton className="h-32 bg-[#151C2C] rounded-2xl" />
              <Skeleton className="h-32 bg-[#151C2C] rounded-2xl" />
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
