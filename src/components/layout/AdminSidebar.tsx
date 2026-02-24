"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Video,
  ImageIcon,
  HelpCircle,
  LogOut,
  X,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, BRAND } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Video,
  Image: ImageIcon,
  HelpCircle,
};

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

export function AdminSidebar({ isMobileOpen, onMobileClose, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
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
          "fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 flex flex-col transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-white text-sm">
                {BRAND.name}
              </span>
              <span className="block text-[10px] text-gray-400 font-body -mt-0.5">
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "text-white bg-brand-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                <span className="font-body">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-body">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

