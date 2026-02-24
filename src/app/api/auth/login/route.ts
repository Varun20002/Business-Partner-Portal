import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// ─── In-memory rate limiter ────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return true;
  }

  return false;
}

// ─── Partner Login: UID + PIN ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, pin, email, password, loginType } = body;

    if (loginType === "partner") {
      // Validate inputs
      if (!uid || !pin) {
        return NextResponse.json(
          { error: "UID and PIN are required" },
          { status: 400 }
        );
      }

      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 }
        );
      }

      // Rate limiting by UID
      if (isRateLimited(uid.toUpperCase())) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again in 1 minute." },
          { status: 429 }
        );
      }

      const supabase = createClient();
      const partnerEmail = `${uid.toLowerCase()}@partner.coindcx.internal`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: partnerEmail,
        password: pin,
      });

      if (error) {
        console.error("[Login] Partner auth error:", error.message);
        const message =
          error.message === "fetch failed" || error.message.includes("fetch")
            ? "Unable to reach authentication server. Please try again."
            : "Invalid UID or PIN";
        return NextResponse.json(
          { error: message },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        redirect: "/dashboard",
      });
    }

    if (loginType === "admin") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      // Rate limiting by email
      if (isRateLimited(email.toLowerCase())) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again in 1 minute." },
          { status: 429 }
        );
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Login] Admin auth error:", error.message);
        const message =
          error.message === "fetch failed" || error.message.includes("fetch")
            ? "Unable to reach authentication server. Please try again."
            : "Invalid email or password";
        return NextResponse.json(
          { error: message },
          { status: 401 }
        );
      }

      // Verify admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        redirect: "/admin",
      });
    }

    return NextResponse.json(
      { error: "Invalid login type" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
