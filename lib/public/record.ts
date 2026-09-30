/**
 * The public record, read on the server for /w/{token} and its vCard: one
 * call to the database's `public_record`, with the publishable key (no
 * session — a tap needs none). The function returns only what the holder
 * made public, and link-only material when the share key is in the link.
 */
import { createClient } from '@supabase/supabase-js';
import type { PublicRecord } from '@/lib/mainboard/types';

const TAG = /^[A-Za-z0-9_-]{16,64}$/;

export async function fetchPublicRecord(tag: string, key?: string | null, ver?: number | null): Promise<PublicRecord | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!TAG.test(tag)) return { state: 'missing' };
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc('public_record', {
    tag,
    key: key && /^[A-Za-z0-9_-]{8,64}$/.test(key) ? key : null,
    ver: ver && Number.isInteger(ver) && ver > 0 ? ver : null,
  });
  if (error) {
    console.error('[public record]', error);
    return null;
  }
  return data as PublicRecord;
}
