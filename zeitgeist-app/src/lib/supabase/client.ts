import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client. Returns null until Supabase env vars are
 * configured so pages can degrade gracefully instead of crashing.
 */
export function createClient() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
