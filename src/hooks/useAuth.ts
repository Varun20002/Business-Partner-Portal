"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthState({ user: null, profile: null, isLoading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        // only fetch fields we actually use in the app
        .select("id, uid, role")
        .eq("id", user.id)
        .single();

      setAuthState({
        user,
        profile: (profile as Profile | null) ?? null,
        isLoading: false,
      });
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, uid, role")
          .eq("id", session.user.id)
          .single();

        setAuthState({
          user: session.user,
          profile: profile as Profile | null,
          isLoading: false,
        });
      } else {
        setAuthState({ user: null, profile: null, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { ...authState, logout };
}
