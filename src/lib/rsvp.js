// src/lib/rsvps.js
import { supabase } from '@/lib/supabase';

export async function fetchRsvps() {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function toggleAttending(id, nextValue) {
  const { data, error } = await supabase
    .from('rsvps')
    .update({ attending: nextValue })
    .eq('id', Number(id))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRsvp(id) {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('id', Number(id));
  if (error) throw error;
}
