"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PARTNER_NAV, BRAND } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
};

const RESOURCES_HREF = "/dashboard/resources";
const SEEN_LOCAL_KEY = "bp_seen_dashboard_v1";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, markDashboardSeen } = useAuth();

  // Determine whether to show the "New" badge.
  // Show when: localStorage flag is not set AND server flag is not true.
  // Initialise to false to avoid SSR mismatch; set on mount (client only).
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const seenLocal = localStorage.getItem(SEEN_LOCAL_KEY) === "1";
    // profile?.seen_dashboard will be true once migration 012 is applied and
    // the user has been marked seen. Until then, localStorage is the sole source.
    const seenServer = profile?.seen_dashboard === true;
    setShowBadge(!seenLocal && !seenServer);
  }, [profile?.seen_dashboard, profile?.id]);

  const handleResourcesClick = () => {
    if (showBadge) {
      setShowBadge(false);
      localStorage.setItem(SEEN_LOCAL_KEY, "1");
    }
    // Always persist to DB if not yet marked — covers cases where badge was
    // already hidden via localStorage but DB still shows false.
    if (profile && !profile.seen_dashboard) {
      void markDashboardSeen();
    }
    onMobileClose();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
              {BRAND.tagline}
            </span>
            <span className="font-heading font-bold text-gray-900 text-lg leading-tight">
              {BRAND.name}
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {PARTNER_NAV.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item.href);
            const isResources = item.href === RESOURCES_HREF;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onClick={isResources ? handleResourcesClick : onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  active
                    ? "text-brand-primary bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                <span className="font-body">{item.label}</span>

                {/* "New" badge — only for Resources, only for first-time visitors */}
                {isResources && (
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-brand-primary text-white"
                      >
                        NEW
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-brand-alert hover:bg-red-50 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-body">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
