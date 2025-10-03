'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Option 2: relative path
import { supabase } from "../../../lib/supabase";





export default function AdminPage() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login'); // kick out if not logged in
        return;
      }

      const { data, error } = await supabase.from('rsvps').select('*');
      if (!error) setRsvps(data);
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) return <p className="p-8">Loading…</p>;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="border rounded px-4 py-2">Logout</button>
      </header>

      <section className="border rounded-xl p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3">RSVPs</h2>
        <table className="w-full border text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2">Attending</th>
              <th className="p-2">Guests</th>
              <th className="p-2">Meal</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.attending ? 'Yes' : 'No'}</td>
                <td className="p-2">{r.guests_count}</td>
                <td className="p-2">{r.meal_choice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
