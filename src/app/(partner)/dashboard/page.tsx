"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerIncentiveCalculator } from "@/components/calculator/PartnerIncentiveCalculator";
import { getRelativeTime, formatNumber } from "@/lib/utils";
import type { PartnerMetrics } from "@/types/database";

interface BreakdownItemProps {
  label: string;
  value: number;
  helper?: string;
}

function BreakdownItem({ label, value, helper }: BreakdownItemProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-600 font-body">{label}</p>
        {helper && (
          <button
            type="button"
            className="p-1 rounded-full border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
            title={helper}
            aria-label={helper}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-lg font-heading font-semibold text-gray-900">
        {formatNumber(value)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<PartnerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      if (!profile?.uid) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("partner_metrics")
        .select("*")
        .eq("partner_uid", profile.uid)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        setHasNoData(true);
      } else {
        setMetrics(data as PartnerMetrics);
      }
      setIsLoading(false);
    }

    fetchMetrics();
  }, [profile?.uid]);

  const hasMetrics = !!metrics;

  const {
    newUserSection,
    volumeSection,
  } = useMemo(() => {
    if (!metrics) {
      return {
        newUserSection: {
          usersSinceStart: 0,
          usersTraded: 0,
          usersCrossedThreshold: 0,
          newUserIncentiveInr: 0,
        },
        volumeSection: {
          baselineVolumeInr: 0,
          incrementalVolumeInr: 0,
          volumeIncentiveInr: 0,
          volumeToNextSlabInr: 0,
          nextSlabIncentiveInr: 10_000,
        },
      };
    }

    // New user incentive section
    const usersSinceStart = metrics.total_users ?? 0;
    const usersTraded = metrics.traded_users ?? 0;
    const usersCrossedThreshold =
      metrics.crossed_threshold_users ?? metrics.eligible_500_users ?? 0;

    const newUserIncentiveInr =
      metrics.new_user_incentive_inr ?? usersCrossedThreshold * 500;

    // Volume based incentive section
    const baselineVolumeInr = metrics.current_baseline_volume_inr ?? 0;
    const incrementalVolumeInr = metrics.incremental_volume_inr ?? 0;
    const volumeIncentiveInr = metrics.volume_incentive_inr ?? 0;
    const volumeToNextSlabInr = metrics.volume_to_next_slab_inr ?? 0;

    const SLAB_INCENTIVES = [
      10_000,
      25_000,
      50_000,
      75_000,
      100_000,
      200_000,
      300_000,
      400_000,
      500_000,
      600_000,
      700_000,
      800_000,
      900_000,
      1_000_000,
    ];

    let nextSlabIncentiveInr =
      metrics.next_slab_incentive_inr && metrics.next_slab_incentive_inr > 0
        ? metrics.next_slab_incentive_inr
        : SLAB_INCENTIVES[0];

    if (nextSlabIncentiveInr === SLAB_INCENTIVES[0] && volumeIncentiveInr > 0) {
      const found = SLAB_INCENTIVES.find((v) => v > volumeIncentiveInr);
      nextSlabIncentiveInr = found ?? SLAB_INCENTIVES[SLAB_INCENTIVES.length - 1];
    }

    return {
      newUserSection: {
        usersSinceStart,
        usersTraded,
        usersCrossedThreshold,
        newUserIncentiveInr,
      },
      volumeSection: {
        baselineVolumeInr,
        incrementalVolumeInr,
        volumeIncentiveInr,
        volumeToNextSlabInr,
        nextSlabIncentiveInr,
      },
    };
  }, [metrics]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
          Welcome back{profile?.uid ? `, ${profile.uid}` : ""}
        </h1>
        {metrics?.updated_at && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 font-body">
            <Clock className="w-3.5 h-3.5" />
            Last updated {getRelativeTime(new Date(metrics.updated_at))}
          </div>
        )}
      </motion.div>

      {/* Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : hasNoData ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="w-8 h-8" />}
            title="Your dashboard is being prepared"
            description="Check back soon. Your metrics will appear here once data is available."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* New user incentive card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-semibold text-gray-900">
                    New user incentive
                  </h2>
                  <p className="text-xs text-gray-500 font-body">
                    How your new users are performing in this period.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BreakdownItem
                label="New users earnings (₹)"
                value={newUserSection.newUserIncentiveInr}
                helper="Estimated earnings from threshold-based incentives"
              />
              <BreakdownItem
                label="Users since Feb 1st"
                value={newUserSection.usersSinceStart}
                helper="Total new users mapped to your UID"
              />
              <BreakdownItem
                label="Users who traded"
                value={newUserSection.usersTraded}
                helper="New users who have placed at least one trade"
              />
              <BreakdownItem
                label="Users crossed 1M volume"
                value={newUserSection.usersCrossedThreshold}
                helper="New users above 1M volume threshold"
              />
            </div>
          </Card>

          {/* Volume based incentive card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-semibold text-gray-900">
                    Volume based incentive
                  </h2>
                  <p className="text-xs text-gray-500 font-body">
                    Your baseline, incremental volume and projected slab
                    earnings.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BreakdownItem
                label="Volume incentive (₹)"
                value={volumeSection.volumeIncentiveInr}
                helper="Estimated earnings linked to incremental volume"
              />
              <BreakdownItem
                label="Current baseline volume (₹)"
                value={volumeSection.baselineVolumeInr}
                helper="Baseline eligible volume in this program"
              />
              <BreakdownItem
                label="Incremental volume (₹)"
                value={volumeSection.incrementalVolumeInr}
                helper="Volume above the baseline for this period"
              />
              <BreakdownItem
                label="Volume required for next slab (₹)"
                value={volumeSection.volumeToNextSlabInr}
                helper={`Additional volume required to reach the next slab to earn ₹${formatNumber(
                  volumeSection.nextSlabIncentiveInr
                )}`}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Calculator */}
      <div>
        <PartnerIncentiveCalculator />
      </div>
    </div>
  );
}
