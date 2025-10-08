// src/hooks/useRsvps.js
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchRsvps, toggleAttending, deleteRsvp } from '@/lib/rsvps';

export function useRsvps() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchRsvps();
        if (mounted) setRsvps(rows);
      } finally {
        if (mounted) setLoading(false);
      }
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

  // actions with optimistic UI
  async function onToggle(id, next) {
    const old = rsvps;
    setRsvps(prev => prev.map(r => (r.id === id ? { ...r, attending: next } : r)));
    try {
      const saved = await toggleAttending(id, next);
      setRsvps(prev => prev.map(r => (r.id === id ? { ...r, ...saved } : r)));
    } catch (e) {
      alert(e.message);
      setRsvps(old); // rollback
    }
  }

  async function onDelete(id) {
    const old = rsvps;
    setRsvps(prev => prev.filter(r => r.id !== id));
    try {
      await deleteRsvp(id);
    } catch (e) {
      alert(e.message);
      setRsvps(old); // rollback
    }
  }

  return { rsvps, loading, onToggle, onDelete };
}
