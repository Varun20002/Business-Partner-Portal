"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PartnerMetrics } from "@/types/database";

async function fetchPartnerMetrics(uid: string): Promise<PartnerMetrics | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("partner_metrics")
    .select("*")
    .eq("partner_uid", uid)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as PartnerMetrics;
}

export function usePartnerMetrics(uid?: string) {
  return useQuery({
    queryKey: ["partner-metrics", uid],
    queryFn: () => fetchPartnerMetrics(uid as string),
    enabled: !!uid,
    initialData: null,
  });
}

