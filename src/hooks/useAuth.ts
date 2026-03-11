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

const PROFILE_CACHE_KEY = "bp_profile_cache_v1";

function parseCachedProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (
      typeof parsed?.id === "string" &&
      typeof parsed?.uid === "string" &&
      (parsed?.role === "partner" || parsed?.role === "admin")
    ) {
      return {
        id: parsed.id,
        uid: parsed.uid,
        role: parsed.role,
        created_at:
          typeof parsed.created_at === "string" ? parsed.created_at : new Date(0).toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
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

    const fetchProfile = async (user: User) => {
      const profilePromise = supabase
        .from("profiles")
        .select("id, uid, role, created_at")
        .eq("id", user.id)
        .single();

      // Allow slower networks enough time before treating this as a transient failure.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Profile request timed out")), 8000)
      );

      const result = (await Promise.race([profilePromise, timeoutPromise])) as Awaited<
        typeof profilePromise
      >;

      return result;
    };

    const syncAuthState = async (session: Session | null) => {
      if (!session?.user) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const { data: profile, error: profileError } = await fetchProfile(session.user);

        if (!profileError && profile) {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
          setAuthState({
            user: session.user,
            profile: profile as Profile,
            isLoading: false,
            error: null,
          });
          return;
        }

        setAuthState((prev) => {
          const canKeepExistingProfile =
            prev.profile !== null && prev.user?.id === session.user.id;
          const cachedProfile = parseCachedProfile(localStorage.getItem(PROFILE_CACHE_KEY));
          const canUseCachedProfile = cachedProfile?.id === session.user.id;

          return {
            user: session.user,
            profile: canKeepExistingProfile ? prev.profile : canUseCachedProfile ? cachedProfile : null,
            isLoading: false,
            error: profileError?.message || "Profile not found",
          };
        });
      } catch (err) {
        setAuthState((prev) => {
          const canKeepExistingProfile =
            prev.profile !== null && prev.user?.id === session.user.id;
          const cachedProfile = parseCachedProfile(localStorage.getItem(PROFILE_CACHE_KEY));
          const canUseCachedProfile = cachedProfile?.id === session.user.id;

          return {
            user: session.user,
            profile: canKeepExistingProfile ? prev.profile : canUseCachedProfile ? cachedProfile : null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load profile",
          };
        });
      }
    };

    // Listen for auth state changes - fires INITIAL_SESSION immediately on page load.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session);
    });

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const cachedProfile = parseCachedProfile(localStorage.getItem(PROFILE_CACHE_KEY));
        if (cachedProfile?.id === session.user.id) {
          setAuthState({
            user: session.user,
            profile: cachedProfile,
            isLoading: false,
            error: null,
          });
        }
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, uid, role, created_at")
        .eq("id", session.user.id)
        .single();

      setAuthState((prev) => {
        const canKeepExistingProfile =
          prev.profile !== null && prev.user?.id === session.user.id;
        const cachedProfile = parseCachedProfile(localStorage.getItem(PROFILE_CACHE_KEY));
        const canUseCachedProfile = cachedProfile?.id === session.user.id;

        return {
          user: session.user,
          profile: profileError
            ? canKeepExistingProfile
              ? prev.profile
              : canUseCachedProfile
                ? cachedProfile
                : null
            : (profile as Profile),
          isLoading: false,
          error: profileError ? profileError.message : null,
        };
      });
      if (!profileError && profile) {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      }
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      setAuthState({
        user: null,
        profile: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem(PROFILE_CACHE_KEY);
    window.location.href = "/login";
  };

  return { ...authState, logout, refreshProfile };
}
