"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function FaqsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-4 w-80 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

