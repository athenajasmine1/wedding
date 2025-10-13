// src/lib/supabase/server-client.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-only Supabase client (use in Server Components, Route Handlers, Actions).
 * NOTE: Do not import this in "use client" files.
 */
export async function createClient() {
  // cookies() is async in Next 15 — type it so TS knows it isn't a Promise anymore
  type CookieStore = Awaited<ReturnType<typeof cookies>>;
  const cookieStore: CookieStore = await cookies();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    throw new Error(
      "[server-client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        cookieStore.set({ name, value, ...(options || {}) });
      },
      remove(name: string, options?: any) {
        cookieStore.set({ name, value: "", ...(options || {}) });
      },
    },
  });
}
