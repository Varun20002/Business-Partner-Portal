"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      {/* Main content area — offset by sidebar on desktop */}
      <div className="lg:ml-64">
        <TopBar
          uid={profile?.uid}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
