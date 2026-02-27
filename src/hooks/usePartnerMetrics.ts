"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PartnerMetrics } from "@/types/database";

async function fetchPartnerMetrics(uid: string): Promise<PartnerMetrics | null> {
  const supabase = createClient();
  // Import API stores partner_uid in uppercase; match case-insensitively
  const normalizedUid = uid.trim().toUpperCase();
  const { data, error } = await supabase
    .from("partner_metrics")
    .select("*")
    .eq("partner_uid", normalizedUid)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`${error.message} (code: ${error.code})`);
  }

  return data as PartnerMetrics | null;
}

export function usePartnerMetrics(uid?: string) {
  return useQuery({
    queryKey: ["partner-metrics", uid],
    queryFn: () => fetchPartnerMetrics(uid as string),
    enabled: !!uid,
    placeholderData: null,
    staleTime: 0, // Always refetch; data can change via Google Sheets import
  });
}

