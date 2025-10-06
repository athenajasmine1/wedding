"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase"; // adjust path if your file lives elsewhere

// Set the total capacity here
const CAPACITY = 200;

// --- tiny donut chart (no library) ---
function Donut({ value, total, size = 180, stroke = 20, color = "#6366f1" }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, total === 0 ? 0 : value / total);
  const dash = circ * pct;
  const rest = circ - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb" /* slate-200 */
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${rest}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-800"
        style={{ fontSize: 18, fontWeight: 600 }}
      >
        {value}/{total}
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // load minimal columns only
  useEffect(() => {
    let ignore = false;
    async function run() {
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, first_name, last_name, email, attending, guests")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      if (!ignore && data) setRows(data);
      setLoading(false);
    }
    run();
    return () => (ignore = true);
  }, []);

  // 🔴 Realtime subscription — paste THIS block here
  useEffect(() => {
    const channel = supabase
      .channel('rsvps-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps' },
        (payload) => {
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
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel); // cleanup on unmount
  }, []);

  // guests counted INCLUDING +1 for the person, respecting attending=true
  const attendingGuests = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (r.attending ? Number(r.guests || 1) : 0),
        0
      ),
    [rows]
  );

  const remaining = Math.max(0, CAPACITY - attendingGuests);

  async function toggleAttending(id, current) {
    // update on server
    const { error } = await supabase
      .from("rsvps")
      .update({ attending: !current })
      .eq("id", id);
    if (error) {
      alert("Update failed. Make sure your admin session is logged-in and RLS allows UPDATE for authenticated users.");
      return;
    }
    // update in UI
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attending: !current } : r))
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Quick overview of guest capacity and a minimal control panel.
        </p>
      </header>

      {/* Donut + numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center justify-center">
          <Donut value={attendingGuests} total={CAPACITY} />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Guests (incl.)</p>
          <p className="text-3xl font-semibold">{attendingGuests}</p>
          <p className="text-xs text-slate-500 mt-1">
            Sum of “Guests (including you)” for YES RSVPs
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Remaining Capacity</p>
          <p className="text-3xl font-semibold">{remaining}</p>
          <p className="text-xs text-slate-500 mt-1">Out of {CAPACITY}</p>
        </div>
      </div>

      {/* Small, actionable list (no full details) */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Quick Edit</h2>
          <p className="text-xs text-slate-500">
            Toggle whether a person is allowed to attend.
          </p>
        </div>

        {loading ? (
          <p className="p-4">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-slate-500">No RSVPs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Guests</th>
                  <th className="p-2">Attending</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">
                      {(r.first_name || "").trim()} {(r.last_name || "").trim()}
                    </td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.guests || 1}</td>
                    <td className="p-2">{r.attending ? "Yes" : "No"}</td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleAttending(r.id, r.attending)}
                        className={`rounded px-3 py-1 text-white ${
                          r.attending ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                        title={
                          r.attending
                            ? "Mark as NOT attending"
                            : "Mark as attending"
                        }
                      >
                        {r.attending ? "Block" : "Allow"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}




