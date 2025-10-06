'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from "../../../lib/supabase";

export default function GuestsPage() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: local UI state
  const [q, setQ] = useState('');            // search query
  const [group, setGroup] = useState('');    // selected group

  // Load RSVPs from Supabase
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      setRsvps(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('rsvps-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, (payload) => {
        setRsvps((prev) => {
          const row = payload.new ?? payload.old;
          if (payload.eventType === 'INSERT') {
            if (prev.some((r) => r.id === row.id)) return prev;
            return [row, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            return prev.map((r) => (r.id === row.id ? { ...r, ...payload.new } : r));
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((r) => r.id !== row.id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);


  // Toggle attending (Block / Allow)
  async function handleToggleAttending(id, nextValue) {
    const { data, error } = await supabase
      .from('rsvps')
      .update({ attending: nextValue })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      alert(error.message);
      setRsvps((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  
    }

    const stats = useMemo(() => {
    const total = rsvps.length;
    const yes = rsvps.filter((r) => r.attending).length;
    const headcount = rsvps.reduce((s, r) => s + (r.attending ? (r.guests ?? 1) : 0), 0);
    return { total, yes, headcount };
  }, [rsvps]);

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;

    setRsvps((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...data } : row))
    );
  }

  // NEW: all distinct groups (supports group_ID or group_id, whichever your rows use)
  const groups = useMemo(() => {
    const getG = (r) => r.group_ID ?? r.group_id ?? '';
    return Array.from(new Set(rsvps.map(getG).filter(Boolean))).sort();
  }, [rsvps]);

  // NEW: filtered list based on search + group
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const getG = (r) => (r.group_ID ?? r.group_id ?? '').toLowerCase();

    return rsvps.filter((r) => {
      const matchesGroup = !group || getG(r) === group.toLowerCase();
      const matchesSearch =
        !needle ||
        (r.first_name ?? '').toLowerCase().includes(needle) ||
        (r.last_name ?? '').toLowerCase().includes(needle) ||
        (r.email ?? '').toLowerCase().includes(needle) ||
        getG(r).includes(needle);
      return matchesGroup && matchesSearch;
    });
  }, [rsvps, q, group]);

  // Stats (keep your originals; if you want them to reflect the filter, switch rsvps -> filtered)
  const stats = useMemo(() => {
    const total = rsvps.length;
    const yes = rsvps.filter((r) => r.attending).length;
    const headcount = rsvps.reduce((sum, r) => sum + (r.guests || 0), 0);
    return { total, yes, headcount };
  }, [rsvps]);

  // NEW: CSV export of the currently filtered rows
  function exportCSV() {
    if (!filtered.length) return;
    const headers = ['first_name','last_name','email','attending','guests','group_ID'];
    const esc = (v) => (v == null ? '' : String(v).replaceAll('"','""'));
    const lines = filtered.map(r => ([
      r.first_name, r.last_name, r.email,
      r.attending ? 'yes' : (r.attending === false ? 'no' : ''),
      r.guests ?? 0,
      r.group_ID ?? r.group_id ?? ''
    ].map(v => `"${esc(v)}"`).join(',')));
    const csv = `${headers.join(',')}\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rsvps.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-center text-gray-500 py-10">Loading…</p>;

  return (
    <main className="p-6">
      {/* summary cards using stats.total, stats.yes, stats.headcount */}

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
            {rsvps.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 capitalize">{r.first_name} {r.last_name}</td>
                <td className="px-4 py-2">{r.email ?? ''}</td>
                <td className="px-4 py-2">{r.group_ID ?? r.group_id ?? ''}</td>
                <td className="px-4 py-2 text-center">{r.attending ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-center">{r.guests ?? (r.attending ? 1 : 0)}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleToggleAttending(r.id, !r.attending)}
                    className={`px-3 py-1.5 rounded ${
                      r.attending ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {r.attending ? 'Block' : 'Allow'}
                  </button>
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No RSVPs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
