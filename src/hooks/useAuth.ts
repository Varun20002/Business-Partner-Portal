"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes - fires INITIAL_SESSION immediately on page load
    // This is faster than getSession() which has internal locking issues
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          // Query profile with a timeout to prevent hanging
          const profilePromise = supabase
            .from("profiles")
            .select("id, uid, role")
            .eq("id", session.user.id)
            .single();
          
          const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
            setTimeout(() => reject(new Error("Profile timeout")), 3000)
          );
          
          try {
            const result = await Promise.race([profilePromise, timeoutPromise]) as any;
            const { data: profile, error: profileError } = result;
            
            if (!profileError && profile) {
              setAuthState({
                user: session.user,
                profile: profile as Profile,
                isLoading: false,
                error: null,
              });
            } else {
              setAuthState({
                user: session.user,
                profile: null,
                isLoading: false,
                error: profileError?.message || "Profile not found",
              });
            }
          } catch (err) {
            setAuthState({
              user: session.user,
              profile: null,
              isLoading: false,
              error: err instanceof Error ? err.message : "Failed to load profile",
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, uid, role")
        .eq("id", session.user.id)
        .single();

      setAuthState({
        user: session.user,
        profile: profileError ? null : (profile as Profile),
        isLoading: false,
        error: profileError ? profileError.message : null,
      });
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { ...authState, logout, refreshProfile };
}
