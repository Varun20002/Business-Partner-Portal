"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Award,
  BarChart3,
  Clock,
  IndianRupee,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerIncentiveCalculator } from "@/components/calculator/PartnerIncentiveCalculator";
import { getRelativeTime, formatNumber } from "@/lib/utils";
import { CALCULATOR } from "@/lib/constants";
import { getGapToNextSlab } from "@/lib/slab-utils";
import type { PartnerMetrics } from "@/types/database";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

function MetricCard({ label, value, icon, color, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-body mb-1">{label}</p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              {formatNumber(value)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
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

  const eligible500Users = metrics?.eligible_500_users ?? 0;
  const newUsersEarnings =
    eligible500Users * CALCULATOR.ACQUISITION_BOUNTY;

  const totalVolumeINR = metrics?.total_volume_inr ?? 0;
  const { gapINR } = getGapToNextSlab(totalVolumeINR);

  const primaryMetricsConfig = hasMetrics
    ? [
        {
          label: "Users since Feb 1st",
          value: metrics.total_users,
          icon: <Users className="w-5 h-5 text-blue-600" />,
          color: "bg-blue-50",
        },
        {
          label: "Users who traded",
          value: metrics.traded_users,
          icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
          color: "bg-emerald-50",
        },
        {
          label: "Users crossed 10M volume",
          value: metrics.eligible_500_users,
          icon: <Award className="w-5 h-5 text-purple-600" />,
          color: "bg-purple-50",
        },
      ]
    : [];

  const secondaryMetricsConfig = hasMetrics
    ? [
        {
          label: "New users earnings (₹)",
          value: newUsersEarnings,
          icon: <IndianRupee className="w-5 h-5 text-amber-600" />,
          color: "bg-amber-50",
        },
        {
          label: "Volume to next slab (₹)",
          value: gapINR ?? 0,
          icon: <Target className="w-5 h-5 text-sky-600" />,
          color: "bg-sky-50",
        },
      ]
    : [];

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

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryMetricsConfig.map((metric, i) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                delay={i * 0.1}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {secondaryMetricsConfig.map((metric, i) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calculator */}
      <div>
        <PartnerIncentiveCalculator />
      </div>
    </div>
  );
}
