"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerMetrics } from "@/hooks/usePartnerMetrics";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isLoading, logout, refreshProfile, error: authError } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch partner metrics to get name
  const { data: metrics } = usePartnerMetrics(profile?.uid);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshProfile();
    setIsRetrying(false);
  };

  useEffect(() => {
    if (isLoading || !user || profile) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const retry = async () => {
      if (cancelled) return;
      await refreshProfile();
      if (!cancelled) {
        timeoutId = setTimeout(() => {
          void retry();
        }, 3000);
      }
    };

    timeoutId = setTimeout(() => {
      void retry();
    }, 1500);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, user, profile, refreshProfile]);

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

  // If session exists but profile is temporarily unavailable, keep user in reconnecting state.
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            Restoring Your Session
          </h2>
          <p className="text-gray-500 mb-2">
            {authError || "We are reconnecting to your profile in the background."}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            You will be taken back automatically as soon as the connection recovers.
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
          name={metrics?.name}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
