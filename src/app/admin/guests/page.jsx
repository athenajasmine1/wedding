'use client';

import { useEffect, useMemo, useState } from 'react';
// ⬇️ correct relative path from src/app/admin/guests/page.jsx -> src/lib/supabase/index.ts
import { createBrowserClient } from '../../../lib/supabase/browser-client';
const supabase = createBrowserClient();

export default function GuestsPage() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (error) console.error(error);
      setRsvps(data || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel('rsvps-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, (payload) => {
        setRsvps((prev) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            if (prev.some((r) => r.id === row.id)) return prev;
            return [row, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            return prev.map((r) => (r.id === row.id ? { ...r, ...row } : r));
          }
          if (payload.eventType === 'DELETE') {
            const row = payload.old;
            return prev.filter((r) => r.id !== row.id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // actions
  async function handleToggleAttending(id, nextValue) {
    const { data, error } = await supabase
      .from('rsvps')
      .update({ attending: nextValue })
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }
    setRsvps((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  async function handleDelete(id) {
    if (!confirm('Delete this RSVP? This cannot be undone.')) return;

    const { error } = await supabase.from('rsvps').delete().eq('id', Number(id));
    if (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
      return;
    }
    setRsvps((prev) => prev.filter((r) => r.id !== id));
  }

  // group list
  const groups = useMemo(() => {
    const getG = (r) => r.group_id ?? r.group_ID ?? '';
    return Array.from(new Set(rsvps.map(getG).filter(Boolean))).sort();
  }, [rsvps]);

  // filtering
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const groupNeedle = group.trim().toLowerCase();
    const getG = (r) => (r.group_id ?? r.group_ID ?? '').toLowerCase();

    return rsvps.filter((r) => {
      const matchesGroup = !groupNeedle || getG(r) === groupNeedle;
      const matchesSearch =
        !needle ||
        (r.first_name ?? '').toLowerCase().includes(needle) ||
        (r.last_name ?? '').toLowerCase().includes(needle) ||
        (r.email ?? '').toLowerCase().includes(needle) ||
        getG(r).includes(needle);
      return matchesGroup && matchesSearch;
    });
  }, [rsvps, q, group]);

  // stats (overall; use `filtered` instead of `rsvps` if you want filtered stats)
  const stats = useMemo(() => {
    const total = rsvps.length;
    const yes = rsvps.filter((r) => !!r.attending).length;
    const headcount = rsvps.reduce((s, r) => s + (r.attending ? Number(r.guests ?? 1) : 0), 0);
    return { total, yes, headcount };
  }, [rsvps]);

  function exportCSV() {
    if (!filtered.length) return;
    const headers = ['first_name', 'last_name', 'email', 'attending', 'guests', 'group_id'];
    const esc = (v) => (v == null ? '' : String(v).replaceAll('"', '""'));
    const lines = filtered.map((r) =>
      [
        r.first_name,
        r.last_name,
        r.email,
        r.attending ? 'yes' : r.attending === false ? 'no' : '',
        r.guests ?? 0,
        r.group_id ?? r.group_ID ?? '',
      ]
        .map((v) => `"${esc(v)}"`)
        .join(',')
    );
    const csv = `${headers.join(',')}\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvps.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;

  return (
    <main className="p-6 space-y-4">
      {/* quick filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, group…"
          className="border rounded px-3 py-2 text-sm"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button onClick={exportCSV} className="border rounded px-3 py-2 text-sm">
          Export CSV (filtered)
        </button>
      </div>

      {/* summary */}
      <div className="text-sm text-gray-600">
        Total RSVPs: <b>{stats.total}</b> · Yes: <b>{stats.yes}</b> · Headcount (incl.):{' '}
        <b>{stats.headcount}</b>
      </div>

      {/* table */}
      <div className="bg-white shadow rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Group</th>
              <th className="px-4 py-3 text-center">Attending</th>
              <th className="px-4 py-3 text-center">Guests</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 capitalize">
                  {r.first_name} {r.last_name}
                </td>
                <td className="px-4 py-2">{r.email ?? ''}</td>
                <td className="px-4 py-2">{r.group_id ?? r.group_ID ?? ''}</td>
                <td className="px-4 py-2 text-center">{r.attending ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-center">{r.guests ?? (r.attending ? 1 : 0)}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleToggleAttending(r.id, !r.attending)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition mr-2 ${
                      r.attending
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {r.attending ? 'Block' : 'Allow'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
