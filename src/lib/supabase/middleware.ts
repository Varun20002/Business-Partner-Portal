import { NextResponse, type NextRequest } from "next/server";

// Rely on client-side Supabase auth (localStorage-based) for now.
// Middleware is a pass-through so it doesn't interfere with session handling.
export async function updateSession(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
