import '../env.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabase] Faltan SUPABASE_URL / SUPABASE_ANON_KEY en .env');
}

export const supabaseAdmin = createClient(url || '', serviceKey || anonKey || '', {
  auth: { autoRefreshToken: false, persistSession: false }
});

export function supabaseAsUser(accessToken) {
  return createClient(url || '', anonKey || '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
