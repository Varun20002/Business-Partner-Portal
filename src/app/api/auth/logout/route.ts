import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const origin = request.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin));
}

// GET handler for easy logout via browser address bar
export async function GET(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const origin = request.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin));
}
