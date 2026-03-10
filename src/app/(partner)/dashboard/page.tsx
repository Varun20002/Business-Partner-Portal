"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Users, TrendingUp, BarChart3, Clock, Info, HelpCircle, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";
import { Accordion } from "@/components/ui/Accordion";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRelativeTime, formatNumber } from "@/lib/utils";
import { usePartnerMetrics } from "@/hooks/usePartnerMetrics";
import { useFaqs } from "@/hooks/useFaqs";
import Link from "next/link";

const LazyPartnerIncentiveCalculator = dynamic(
  () =>
    import("@/components/calculator/PartnerIncentiveCalculator").then(
      (m) => m.PartnerIncentiveCalculator
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4">
        <div className="h-40 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse" />
      </div>
    ),
  }
);

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
  const { profile, isLoading: isAuthLoading } = useAuth();
  const uid = profile?.uid;
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError,
    error,
  } = usePartnerMetrics(uid);

  const hasMetrics = !!metrics;
  const waitingForProfile = !uid && isAuthLoading;
  const hasNoData =
    uid && !isMetricsLoading && !hasMetrics && !isError;

  const { data: faqs = [], isLoading: isFaqsLoading } = useFaqs();

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
      {waitingForProfile || isMetricsLoading ? (
        <MetricCardSkeleton />
      ) : isError ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="w-8 h-8" />}
            title="Could not load metrics"
            description={
              error instanceof Error
                ? error.message
                : "Check your connection and try again."
            }
          />
        </Card>
      ) : hasNoData ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="w-8 h-8" />}
            title="Your dashboard is being prepared"
            description={
              profile?.uid
                ? `Your UID: ${profile.uid}. Ensure this matches the Partner UID in your Google Sheet, then re-import.`
                : "Check back soon. Your metrics will appear here once data is available."
            }
          />
        </Card>
      ) : (
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold text-gray-900">
                Partner metrics
              </h2>
              <p className="text-xs text-gray-500 font-body">
                New user and volume incentive breakdown
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New user section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="w-4 h-4 text-blue-600" />
                New user incentive
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
            {/* Volume section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Volume based incentive
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          </div>
        </Card>
      )}

      {/* Calculator */}
      <div>
        <LazyPartnerIncentiveCalculator rsrPercentage={metrics?.rsr_percentage} />
      </div>

      {/* Refer Now CTA - Clean Horizontal Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-full"
      >
        <Link
          href="/dashboard/resources#shareable-assets"
          className="group flex items-center justify-center gap-3 rounded-2xl bg-brand-primary px-8 py-4 text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-300"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-base font-heading font-semibold">Refer Now</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </motion.div>

      {/* FAQ Section — placed after calculator per UX best practices */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-6"
        aria-labelledby="faq-heading"
      >
        <Card className="p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <h2
                  id="faq-heading"
                  className="text-xl font-heading font-bold text-gray-900 flex items-center gap-2"
                >
                  <HelpCircle className="w-5 h-5 text-brand-primary" />
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-500 font-body">
                  DNAP Incentive Program key questions and answers.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {isFaqsLoading ? (
              <div className="space-y-3 max-w-3xl">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="w-8 h-8" />}
                title="No FAQs available"
                description="Common questions will appear here soon."
              />
            ) : (
              <div className="max-w-3xl">
                <Accordion
                  items={faqs.map((faq) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                  className="space-y-4"
                />
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-sm text-gray-500 font-body">
                    Still have questions? Please reach out to your dedicated CoinDCX Key account manager.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.section>
    </div>
  );
}
