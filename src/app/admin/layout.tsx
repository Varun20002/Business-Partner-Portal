"use client";

import { useState } from "react";
import { Menu, User } from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLayout({
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
      <AdminSidebar
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 px-3 py-1.5 rounded-full">
                <span className="text-xs font-heading font-semibold text-purple-600">
                  Admin
                </span>
              </div>
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
