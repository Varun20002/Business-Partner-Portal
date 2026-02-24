import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, skip auth checks and let the page load
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Middleware] Supabase env vars missing, skipping auth checks");
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    // Refresh the session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect dashboard routes — must be authenticated
    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Protect admin routes — must be authenticated + admin role
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // Redirect authenticated users away from login
    if (request.nextUrl.pathname === "/login" && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("[Middleware] Auth check failed:", error);
    // On error, allow the request through (don't block the page)
    // The client-side auth will handle the redirect if needed
  }

  return response;
}
