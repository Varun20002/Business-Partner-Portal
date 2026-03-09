"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, logout, refreshProfile, error: authError } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshProfile();
    setIsRetrying(false);
  };

  // Show loading state while auth is checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-body">Loading...</p>
        </div>
      </div>
    );
  }

  // If no profile after loading, show error with retry option
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            Unable to Load Profile
          </h2>
          <p className="text-gray-500 mb-2">
            {authError || "We could not load your profile information. This might be a temporary connection issue."}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Please try again. If the problem persists, contact your manager.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </>
              )}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
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
