/**
 * The records' backend: Supabase (Auth + Postgres), from the browser.
 *
 * One client, made on first use from the two public settings (the project's
 * URL and its publishable — formerly "anon" — key; see .env.example). Its
 * session lives in cookies and is refreshed by @supabase/ssr: nothing in this
 * site keeps a token itself. The key is public by design; what it can reach
 * is decided in the database, by row-level security (supabase/migrations).
 *
 * Without the settings — a build made before they were set — there is no
 * client, and the terminal says the records are unreachable.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function recordsClient(): SupabaseClient | null {
  if (!URL || !KEY || typeof window === 'undefined') return null;
  if (!client) client = createBrowserClient(URL, KEY);
  return client;
}

export const recordsConfigured = Boolean(URL && KEY);
