"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ImageIcon, HelpCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";

interface AdminStat {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [webinars, materials, faqs, partners] = await Promise.all([
        supabase.from("webinars").select("id", { count: "exact", head: true }),
        supabase.from("marketing_materials").select("id", { count: "exact", head: true }),
        supabase.from("faqs").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "partner"),
      ]);

      setStats([
        {
          label: "Partners",
          value: partners.count || 0,
          icon: <Users className="w-5 h-5 text-blue-600" />,
          color: "bg-blue-50",
          href: "/admin",
        },
        {
          label: "Webinars",
          value: webinars.count || 0,
          icon: <Video className="w-5 h-5 text-purple-600" />,
          color: "bg-purple-50",
          href: "/admin/webinars",
        },
        {
          label: "Materials",
          value: materials.count || 0,
          icon: <ImageIcon className="w-5 h-5 text-emerald-600" />,
          color: "bg-emerald-50",
          href: "/admin/materials",
        },
        {
          label: "FAQs",
          value: faqs.count || 0,
          icon: <HelpCircle className="w-5 h-5 text-orange-600" />,
          color: "bg-orange-50",
          href: "/admin/faqs",
        },
      ]);
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Admin Overview
        </h1>
        <p className="text-sm text-gray-500 font-body mt-1">
          Manage portal content and resources.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-body mb-1">{stat.label}</p>
                    <p className="text-3xl font-heading font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
