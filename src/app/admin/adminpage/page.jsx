'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from "../../../lib/supabase";

const CAPACITY = 221; // adjust if needed

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return () => { mounted = false; };
  }, []);

  // realtime sync
  useEffect(() => {
    const ch = supabase
      .channel('rsvps-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, (payload) => {
        setRsvps((prev) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            if (prev.some(p => p.id === row.id)) return prev;
            return [row, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            return prev.map(p => (p.id === row.id ? { ...p, ...row } : p));
          }
          if (payload.eventType === 'DELETE') {
            const row = payload.old;
            return prev.filter(p => p.id !== row.id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
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
    setRsvps(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)));
  }

  async function handleDelete(id) {
    if (!confirm('Delete this RSVP? This cannot be undone.')) return;

    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('id', Number(id));

    if (error) {
      alert(error.message);
      return;
    }
    setRsvps(prev => prev.filter(r => r.id !== id));
  }

  // stats
  const stats = useMemo(() => {
    const yesRows = rsvps.filter(r => !!r.attending);
    const headcount = yesRows.reduce((sum, r) => {
      const n = Number(r.guests ?? 1); // your UI stores "including you"
      return sum + (isNaN(n) ? 1 : n);
    }, 0);
    return {
      headcount,
      remaining: Math.max(0, CAPACITY - headcount),
    };
  }, [rsvps]);

  const progress = Math.min(100, (stats.headcount / CAPACITY) * 100);

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <main className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Quick overview of guest capacity and a minimal control panel.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center">
          <Donut percent={progress} label={`${stats.headcount}/${CAPACITY}`} />
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-gray-500">Guests (incl.)</div>
          <div className="text-3xl font-semibold mt-1">{stats.headcount}</div>
          <div className="text-xs text-gray-400 mt-2">
            Sum of “Guests (including you)” for YES RSVPs
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-gray-500">Remaining Capacity</div>
          <div className="text-3xl font-semibold mt-1">{stats.remaining}</div>
          <div className="text-xs text-gray-400 mt-2">Out of {CAPACITY}</div>
        </div>
      </div>

      {/* Quick Edit table */}
      <section className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <div className="font-medium">Quick Edit</div>
          <div className="text-xs text-gray-500">
            Toggle whether a person is allowed to attend.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th className="text-center">Guests</Th>
                <Th className="text-center">Attending</Th>
                <Th className="text-center">Action</Th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r, idx) => (
                <tr key={r.id} className={idx % 2 ? 'bg-white' : 'bg-gray-50/60'}>
                  <Td>{cap(r.first_name)} {cap(r.last_name)}</Td>
                  <Td>{r.email || 'required'}</Td>
                  <Td className="text-center">{r.guests ?? 1}</Td>
                  <Td className="text-center">{r.attending ? 'Yes' : 'No'}</Td>
                  <Td className="text-center">
                    <button
                      onClick={() => handleToggleAttending(r.id, !r.attending)}
                      className={`px-3 py-1.5 rounded font-medium mr-2 transition ${
                        r.attending
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {r.attending ? 'Block' : 'Allow'}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1.5 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
              {!rsvps.length && (
                <tr>
                  <Td colSpan={5} className="text-center py-12 text-gray-500">
                    No RSVPs yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* helpers */

function cap(s) {
  if (!s) return '';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left font-semibold text-gray-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '', ...rest }) {
  return (
    <td className={`px-4 py-3 ${className}`} {...rest}>
      {children}
    </td>
  );
}

function Donut({ percent, label }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const stroke = c * (1 - p / 100);

  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f7" strokeWidth="16" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke="#6366f1" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={stroke}
        transform="rotate(-90 70 70)"
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="fill-gray-700 text-[14px] font-medium"
      >
        {label}
      </text>
    </svg>
  );
}
