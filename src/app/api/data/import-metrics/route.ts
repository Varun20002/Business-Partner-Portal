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
        { error: "Failed to validate partner UIDs" },
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
    const normalizedMetrics: MetricsRow[] = metrics.map((m) => ({
      partner_uid: m.partner_uid.toUpperCase(),
      total_users: m.total_users,
      traded_users: m.traded_users,
      eligible_500_users: m.eligible_500_users,
      volume_eligible_users: m.volume_eligible_users,
      total_volume_inr: m.total_volume_inr ?? 0,
    }));

    const results: any[] = [];

    for (const metric of normalizedMetrics) {
      // Check if a record already exists for this partner_uid
      const { data: existing, error: existingError } = await supabase
        .from("partner_metrics")
        .select("id")
        .eq("partner_uid", metric.partner_uid)
        .maybeSingle();

      if (existingError) {
        console.error(
          `[Import Metrics] Error checking existing metric for ${metric.partner_uid}:`,
          existingError
        );
        return NextResponse.json(
          {
            error: "Failed to import metrics",
            details: existingError.message,
            code: existingError.code,
          },
          { status: 500 }
        );
      }

      if (existing) {
        // Update existing row
        const { data: updated, error: updateError } = await supabase
          .from("partner_metrics")
          .update({
            total_users: metric.total_users,
            traded_users: metric.traded_users,
            eligible_500_users: metric.eligible_500_users,
            volume_eligible_users: metric.volume_eligible_users,
            total_volume_inr: metric.total_volume_inr ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq("partner_uid", metric.partner_uid)
          .select()
          .single();

        if (updateError) {
          console.error(
            `[Import Metrics] Update error for ${metric.partner_uid}:`,
            updateError
          );
          return NextResponse.json(
            {
              error: "Failed to import metrics",
              details: updateError.message,
              code: updateError.code,
            },
            { status: 500 }
          );
        }

        results.push(updated);
      } else {
        // Insert new row
        const { data: inserted, error: insertError } = await supabase
          .from("partner_metrics")
          .insert(metric)
          .select()
          .single();

        if (insertError) {
          console.error(
            `[Import Metrics] Insert error for ${metric.partner_uid}:`,
            insertError
          );
          return NextResponse.json(
            {
              error: "Failed to import metrics",
              details: insertError.message,
              code: insertError.code,
            },
            { status: 500 }
          );
        }

        results.push(inserted);
      }
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${results.length} metrics`,
      imported_count: results.length,
      metrics: results,
    });
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

