"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markDashboardSeen: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────
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
          typeof parsed.created_at === "string"
            ? parsed.created_at
            : new Date(0).toISOString(),
        seen_dashboard: parsed.seen_dashboard === true,
        signed_up_at: typeof parsed.signed_up_at === "string" ? parsed.signed_up_at : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
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
        .select("id, uid, role, created_at, seen_dashboard, signed_up_at")
        .eq("id", user.id)
        .single();

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
            profile: canKeepExistingProfile
              ? prev.profile
              : canUseCachedProfile
                ? cachedProfile
                : null,
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
            profile: canKeepExistingProfile
              ? prev.profile
              : canUseCachedProfile
                ? cachedProfile
                : null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load profile",
          };
        });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session);
    });

    // Immediately serve from cache while the real fetch is in-flight
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
        .select("id, uid, role, created_at, seen_dashboard, signed_up_at")
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

  const markDashboardSeen = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    setAuthState((prev) => {
      if (!prev.profile) return prev;
      const updated = { ...prev.profile, seen_dashboard: true };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
      return { ...prev, profile: updated };
    });

    await supabase
      .from("profiles")
      .update({ seen_dashboard: true })
      .eq("id", session.user.id)
      .then(({ error }) => {
        if (error) {
          // Non-fatal: localStorage already hides the badge
        }
      });
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem(PROFILE_CACHE_KEY);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ ...authState, logout, refreshProfile, markDashboardSeen }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Internal hook (used only by useAuth.ts) ───────────────────
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
