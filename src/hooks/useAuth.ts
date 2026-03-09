"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const PROFILE_TIMEOUT_MS = 10000; // 10 seconds timeout
const MAX_RETRIES = 3;

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
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
      // Log the actual error for debugging
      console.error("[useAuth] Profile fetch failed:", profileError || "No profile data");
      return null;
    } catch (e) {
      console.error("[useAuth] Profile fetch error:", e);
      return null;
    }
  }, []);

  // Fetch profile with automatic retry and exponential backoff
  const fetchProfileWithRetry = useCallback(async (user: User): Promise<{ profile: Profile | null; error: string | null }> => {
    let lastError: string | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[useAuth] Profile fetch attempt ${attempt}/${MAX_RETRIES}`);
      
      const profile = await fetchProfile(user);
      
      if (profile) {
        if (attempt > 1) {
          console.log(`[useAuth] Profile fetched successfully on attempt ${attempt}`);
        }
        return { profile, error: null };
      }
      
      lastError = `Attempt ${attempt} failed`;
      console.warn(`[useAuth] ${lastError}`);
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`[useAuth] Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    return { profile: null, error: "Failed to load profile after multiple attempts" };
  }, [fetchProfile]);

  // Refresh profile - useful for retry after failed load
  const refreshProfile = useCallback(async () => {
    setAuthState(prev => {
      const user = prev.user;
      if (!user) return prev;
      
      // Set loading state
      const nextState = { ...prev, isLoading: true, error: null };
      
      // Fetch profile and update state
      fetchProfileWithRetry(user).then(({ profile, error }) => {
        setAuthState(current => ({ ...current, profile, isLoading: false, error }));
      });
      
      return nextState;
    });
  }, [fetchProfileWithRetry]);

  useEffect(() => {
    const supabase = createClient();

    const handleAuthChange = async (_event: string, session: Session | null) => {
      if (session?.user) {
        console.log("[useAuth] Session found, fetching profile...");
        const { profile, error } = await fetchProfileWithRetry(session.user);
        
        setAuthState({
          user: session.user,
          profile,
          isLoading: false,
          error,
        });
        
        if (error) {
          console.error("[useAuth] Final profile fetch error:", error);
        }
      } else {
        // No session - user is not authenticated
        console.log("[useAuth] No session, user logged out");
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          error: null,
        });
      }
    };

    // Listen for auth state changes - fires INITIAL_SESSION immediately on page load
    // This is faster than getSession() which has internal locking issues
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => subscription.unsubscribe();
  }, [fetchProfileWithRetry]);

  const logout = async () => {
    console.log("[useAuth] Logging out...");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return { ...authState, logout, refreshProfile };
}
