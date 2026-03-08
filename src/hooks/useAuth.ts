"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const PROFILE_TIMEOUT_MS = 10000; // 10 seconds timeout

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  // Function to fetch profile - extracted for retry capability
  const fetchProfile = useCallback(async (user: User): Promise<Profile | null> => {
    const supabase = createClient();
    
    const profilePromise = supabase
      .from("profiles")
      .select("id, uid, role")
      .eq("id", user.id)
      .single();
    
    const timeoutPromise = new Promise<{ data: null; error: Error }>(
      (_, reject) => setTimeout(() => reject(new Error("Profile timeout")), PROFILE_TIMEOUT_MS)
    );
    
    try {
      const result = (await Promise.race([profilePromise, timeoutPromise])) as any;
      const { data: profile, error: profileError } = result;
      
      if (!profileError && profile) {
        return profile as Profile;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Refresh profile - useful for retry after failed load
  const refreshProfile = useCallback(async () => {
    setAuthState(prev => {
      const user = prev.user;
      if (!user) return prev;
      
      // Set loading state
      const nextState = { ...prev, isLoading: true };
      
      // Fetch profile and update state
      fetchProfile(user).then(profile => {
        setAuthState(current => ({ ...current, profile, isLoading: false }));
      });
      
      return nextState;
    });
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    const handleAuthChange = async (_event: string, session: Session | null) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setAuthState({
          user: session.user,
          profile,
          isLoading: false,
        });
      } else {
        // No session - user is not authenticated
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
        });
      }
    };

    // Listen for auth state changes - fires INITIAL_SESSION immediately on page load
    // This is faster than getSession() which has internal locking issues
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { ...authState, logout, refreshProfile };
}
