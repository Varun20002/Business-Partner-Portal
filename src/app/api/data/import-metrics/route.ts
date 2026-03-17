import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { validateMetricsImport, type MetricsRow } from "@/lib/validators/metrics";


// ─── Rate Limiting (Optional) ──────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
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

// ─── Authenticate Request ───────────────────────────────────────────
function authenticateRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("[Import Metrics] Service role key not configured");
    return false;
  }

  // Check for Bearer token or direct key match
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    return token === serviceRoleKey;
  }

  return false;
}

// ─── POST: Import Metrics from Google Sheets ───────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing API key." },
        { status: 401 }
      );
    }

    // 2. Rate limiting (by IP)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { metrics } = validateMetricsImport(body);

    // 4. Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Import Metrics] Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Verify partner UIDs exist in profiles table
    const partnerUids = metrics.map((m) => m.partner_uid);
    const { data: existingProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("uid")
      .in("uid", partnerUids);

    if (profileError) {
      console.error("[Import Metrics] Error checking profiles:", profileError);
      return NextResponse.json(
        {
          error: "Failed to validate partner UIDs",
          details: profileError.message,
          code: profileError.code,
        },
        { status: 500 }
      );
    }

    const existingUids = new Set(
      existingProfiles?.map((p) => p.uid.toUpperCase()) || []
    );
    const invalidUids = partnerUids.filter(
      (uid) => !existingUids.has(uid.toUpperCase())
    );

    if (invalidUids.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid partner UIDs (not found in profiles)",
          invalid_uids: invalidUids,
        },
        { status: 400 }
      );
    }

    // 6. Upsert-style behavior without relying on DB constraints:
    //    For each partner_uid, update if a row exists, otherwise insert.
    //    Coerce all numerics to safe integers to avoid DB/PostgREST issues.
    const toInt = (v: unknown, d: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : d;
    const normalizedMetrics: MetricsRow[] = metrics.map((m) => ({
      partner_uid: m.partner_uid.toUpperCase(),
      name: m.name || "",
      rsr_percentage: m.rsr_percentage ?? 20,
      total_users: toInt(m.total_users, 0),
      traded_users: toInt(m.traded_users, 0),
      eligible_500_users: toInt(m.eligible_500_users, 0),
      volume_eligible_users: toInt(m.volume_eligible_users, 0),
      total_volume_inr: toInt(m.total_volume_inr, 0),
      new_users: toInt(m.new_users, 0),
      crossed_threshold_users: toInt(m.crossed_threshold_users, 0),
      new_user_incentive_inr: toInt(m.new_user_incentive_inr, 0),
      current_baseline_volume_inr: toInt(m.current_baseline_volume_inr, 0),
      incremental_volume_inr: toInt(m.incremental_volume_inr, 0),
      volume_incentive_inr: toInt(m.volume_incentive_inr, 0),
      volume_to_next_slab_inr: toInt(m.volume_to_next_slab_inr, 0),
      next_slab_incentive_inr: toInt(m.next_slab_incentive_inr, 0),
    }));

    // Single batched upsert — relies on the UNIQUE constraint on partner_uid
    // (added in migration 003). Replaces the previous N+1 SELECT+INSERT/UPDATE loop.
    const now = new Date().toISOString();
    const { data: results, error: upsertError } = await supabase
      .from("partner_metrics")
      .upsert(
        normalizedMetrics.map((m) => ({ ...m, updated_at: now })),
        { onConflict: "partner_uid" }
      )
      .select();

    if (upsertError) {
      console.error("[Import Metrics] Upsert error:", upsertError);
      return NextResponse.json(
        {
          error: "Failed to import metrics",
          details: upsertError.message,
          code: upsertError.code,
        },
        { status: 500 }
      );
    }

    // 7. Return success response
    const responseBody = {
      success: true,
      message: `Successfully imported ${results.length} metrics`,
      imported_count: results.length,
      metrics: results,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: error.message,
        },
        { status: 400 }
      );
    }

    console.error("[Import Metrics] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET: Health check ───────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/data/import-metrics",
    method: "POST",
    required_headers: ["Authorization: Bearer <SERVICE_ROLE_KEY>"],
  });
}

