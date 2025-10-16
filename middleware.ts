// /middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow the login page itself
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Prepare a response we can mutate cookies on
  const res = NextResponse.next();

  // Create an SSR Supabase client wired to Next cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not signed in? send to /admin/login with ?redirect=<original path>
  if (!user) {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("redirect", pathname + (search || ""));
    return NextResponse.redirect(login);
  }

  // Optional allowlist: only let specific emails in
  const allow = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && !allow.includes((user.email || "").toLowerCase())) {
    // Logged in but not an admin → bounce to home (or replace with a 403 page)
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

// Only protect /admin/*
export const config = {
  matcher: ["/admin/:path*"],
};
