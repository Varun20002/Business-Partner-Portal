"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { FAQ } from "@/types/database";

async function fetchFaqs(): Promise<FAQ[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as FAQ[];
}

export function useFaqs() {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
    placeholderData: [],
    staleTime: 0, // Admin can add FAQs anytime; always refetch when partner visits
  });
}

