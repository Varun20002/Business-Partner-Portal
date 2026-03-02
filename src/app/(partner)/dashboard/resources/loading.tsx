"use client";

import { WebinarCardSkeleton, MaterialCardSkeleton } from "@/components/ui/Skeleton";

export default function ResourcesLoading() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <section>
        <div className="h-6 w-56 rounded-lg bg-gray-200 animate-pulse mb-4" />
        <WebinarCardSkeleton />
      </section>

      <section>
        <div className="h-6 w-48 rounded-lg bg-gray-200 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MaterialCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

