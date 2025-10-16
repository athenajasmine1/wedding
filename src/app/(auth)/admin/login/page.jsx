'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '../../../../lib/supabase/browser-client';

const supabase = createBrowserClient();

/** The inner client component that uses useSearchParams. */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();               // <-- allowed now (inside Suspense)
  const redirectTo = params.get('redirect') || '/admin/adminpage';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, skip the form
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.replace(redirectTo);
    })();
  }, [router, redirectTo]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="w-full max-w-md p-6 border rounded-xl shadow bg-white/90 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Admin Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full border rounded p-2 bg-indigo-600 text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </main>
  );
}

/** Page component wraps LoginForm in Suspense to satisfy Next.js requirement. */
export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
