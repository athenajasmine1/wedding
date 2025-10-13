'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ correct relative path from /src/app/admin/login/page.jsx
import { createBrowserClient } from '../../../lib/supabase/browser-client';
const supabase = createBrowserClient();

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }

    // ✅ go straight to your dashboard page
    router.push('/admin/adminpage')
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="p-6 border rounded-xl shadow space-y-4 bg-white/80">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="w-full border rounded p-2 bg-indigo-600 text-white">
          Login
        </button>
      </form>
    </main>
  );
}
