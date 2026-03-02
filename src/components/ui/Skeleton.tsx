import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function WebinarCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="relative h-[360px] w-full bg-gray-100 flex items-center justify-center">
        <Skeleton className="w-3/4 h-3/4 rounded-lg" />
      </div>
      <div className="p-5 border-t border-gray-100 space-y-3">
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
}

export function MaterialCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
