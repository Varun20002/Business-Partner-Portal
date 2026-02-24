"use client";

import { Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  uid?: string;
  onMenuToggle: () => void;
  className?: string;
}

export function TopBar({ uid, onMenuToggle, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right side: UID badge + avatar */}
        <div className="flex items-center gap-3">
          {uid && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <span className="text-xs font-body text-gray-500">UID</span>
              <span className="text-sm font-heading font-semibold text-brand-primary">
                {uid}
              </span>
            </div>
          )}
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
