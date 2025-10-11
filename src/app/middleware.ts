// src/app/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Only check /admin routes
  if (!req.nextUrl.pathname.startsWith('/admin')) return res

  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Not signed in → send home (or /login)
  if (!session) return NextResponse.redirect(new URL('/', req.url))

  // Must be an admin (set via your script)
  const role = (session.user.user_metadata as any)?.role
  if (role !== 'admin') return NextResponse.redirect(new URL('/', req.url))

  return res
}

// Only run on /admin/*
export const config = {
  matcher: ['/admin/:path*'],
}
