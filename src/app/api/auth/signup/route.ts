import { createClient } from "@supabase/supabase-js";
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

// ─── Partner Sign Up: UID + PIN ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, pin, confirmPin } = body;

    // Validate inputs
    if (!uid || !pin || !confirmPin) {
      return NextResponse.json(
        { error: "UID, PIN, and confirm PIN are required" },
        { status: 400 }
      );
    }

    if (!/^[A-Z]{2}\d+$/i.test(uid)) {
      return NextResponse.json(
        { error: "Invalid UID format. Must be 2 letters followed by numbers (e.g., VA51243378)" },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: "PINs do not match" },
        { status: 400 }
      );
    }

    // Rate limiting by UID
    const normalizedUid = uid.toUpperCase();
    if (isRateLimited(normalizedUid)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Signup] Missing Supabase configuration");
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

    // 1. Check if profile exists for this UID
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, uid, role")
      .eq("uid", normalizedUid)
      .single();

    if (profileError || !existingProfile) {
      console.error("[Signup] Profile not found for UID:", normalizedUid, profileError);
      return NextResponse.json(
        { error: "Invalid UID. Please contact your manager for access." },
        { status: 400 }
      );
    }

    // 2. Check if this UID already has an auth user
    const partnerEmail = `${normalizedUid.toLowerCase()}@partner.coindcx.internal`;

    // Try to get user by email - this requires checking auth.users
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("[Signup] Error listing users:", listError);
      return NextResponse.json(
        { error: "Unable to verify account. Please try again." },
        { status: 500 }
      );
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === partnerEmail.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Account already exists. Please login instead." },
        { status: 400 }
      );
    }

    // 3. Create auth user with admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: partnerEmail,
      password: pin,
      email_confirm: true,
    });

    if (createError) {
      console.error("[Signup] Error creating auth user:", createError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: "Failed to create account. No user returned." },
        { status: 500 }
      );
    }

    // 4. Update profile to link with the new auth user
    // We need to update the id to match the new auth user's id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ id: newUser.user.id } as any)
      .eq("uid", normalizedUid);

    if (updateError) {
      console.error("[Signup] Error updating profile:", updateError);
      // Rollback: delete the created auth user
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: "Failed to link account. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Signup] Successfully created account for UID: ${normalizedUid}`);

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please login with your UID and PIN.",
    });
  } catch (error) {
    console.error("[Signup] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
