import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only needed if you actually use Supabase here (auth gating, etc.)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  );

  // Example: protect /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = { matcher: ['/admin/:path*'] }; // adjust or remove
