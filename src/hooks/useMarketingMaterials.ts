"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MarketingMaterial } from "@/types/database";

async function fetchMarketingMaterials(): Promise<MarketingMaterial[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("marketing_materials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as MarketingMaterial[];
}

export function useMarketingMaterials() {
  return useQuery({
    queryKey: ["marketing-materials"],
    queryFn: fetchMarketingMaterials,
    placeholderData: [],
    staleTime: 0, // Admin can add materials anytime; always refetch when partner visits
  });
}

