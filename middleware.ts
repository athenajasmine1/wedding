import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Only protect /admin/*
  if (!req.nextUrl.pathname.startsWith('/admin')) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value; },
        set(name, value, options) { res.cookies.set({ name, value, ...options }); },
        remove(name, options) { res.cookies.set({ name, value: '', ...options }); },
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // not logged in → send to admin login
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = ''; // optional: clear query
    return NextResponse.redirect(url);
  }

  // Optional: allowlist emails (extra safety)
  const allowed = ['jasmineathea.deleon@gmail.com', 'johnandkristen.deleon@gmail.com'];
  if (!allowed.includes(user.email ?? '')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
