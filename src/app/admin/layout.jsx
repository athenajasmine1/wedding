'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from "../../lib/supabase";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();   // invalidate session
    } catch (e) {
      // it's okay to ignore here; we redirect anyway
      console.error('logout error', e);
    } finally {
      router.push('/');                // go to wedding page
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-white border-r flex flex-col">
        <div className="p-4 font-semibold">Wedding Admin</div>

        <nav className="px-2 space-y-1 flex-1">
          <Link href="/admin/adminpage" className="block px-3 py-2 rounded hover:bg-gray-100">
            Home
          </Link>
          <Link href="/admin/guests" className="block px-3 py-2 rounded hover:bg-gray-100">
            Guests
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-left px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
