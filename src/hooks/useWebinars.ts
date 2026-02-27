"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Webinar } from "@/types/database";

async function fetchWebinars(): Promise<Webinar[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("webinars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Webinar[];
}

export function useWebinars() {
  return useQuery({
    queryKey: ["webinars"],
    queryFn: fetchWebinars,
    initialData: [],
  });
}

