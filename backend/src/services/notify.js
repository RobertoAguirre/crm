import { supabaseAdmin } from '../lib/supabase.js';

export async function createNotification({ userId, title, body, type = 'info', link }) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({ user_id: userId, title, body, type, link })
    .select()
    .single();

  if (error) throw error;
  return data;
}
