/**
 * How a holder gets to their record — the one door the terminal and the
 * record screen use (components/Login.tsx, components/records/Record.tsx).
 *
 * Today the key is an address and a transmission to it: Supabase Auth's
 * passwordless email — a magic link, or the code printed beside it. The
 * same transmission goes to every address, found or not (the email
 * templates in supabase/templates are one), so neither the terminal nor the
 * mail says whether an address has a record; that is told only once the
 * address has authorized itself.
 *
 * A passkey is one more way to `authorize`: it would sit beside `request` /
 * `confirmCode` / `confirmLink` here, and nothing that calls this changes.
 *
 * Nothing technical reaches the screen: every failure is one of a few
 * refusals the terminal has words for (lib/records/copy.ts); the details go
 * to the console.
 */
import type { EmailOtpType } from '@supabase/supabase-js';
import { recordsClient } from '@/lib/supabase/client';
import type { Clearance, HolderRecord, IdentityVersion, RecordStatus } from './types';

export type Refusal = 'unreachable' | 'address' | 'limited' | 'expired' | 'interrupted' | 'suspended' | 'name';

export type Outcome<T = null> = { ok: true; value: T } | { ok: false; why: Refusal };

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The link types a transmission may carry back (supabase/templates). */
const LINK_TYPES: readonly EmailOtpType[] = ['email', 'magiclink', 'signup'];

export const isAddress = (s: string) => ADDRESS.test(s.trim()) && s.trim().length <= 254;

export const linkType = (s: string | null): EmailOtpType | null =>
  s && (LINK_TYPES as readonly string[]).includes(s) ? (s as EmailOtpType) : null;

function refusal(where: string, error: unknown): Refusal {
  const e = (error ?? {}) as { code?: string; status?: number; name?: string; message?: string };
  console.error(`[records] ${where}`, error);
  if (e.name === 'AuthRetryableFetchError' || e.status === 0 || /failed to fetch|network/i.test(e.message ?? '')) return 'unreachable';
  if (e.status === 429 || /rate_limit/.test(e.code ?? '')) return 'limited';
  if (e.code === 'otp_expired' || e.code === 'flow_state_expired' || e.code === 'flow_state_not_found' || e.code === 'bad_code_verifier') return 'expired';
  if (e.code === 'email_address_invalid' || e.code === 'validation_failed') return 'address';
  if (e.code === '22023') return 'name';
  return 'interrupted';
}

type Row = { display_name: string | null; record_number: string | null; clearance: Clearance; status: RecordStatus };

const toRecord = (r: Row | null): HolderRecord =>
  r
    ? { displayName: r.display_name, recordNumber: r.record_number, clearance: r.clearance, status: r.status }
    : { displayName: null, recordNumber: null, clearance: 'unissued', status: 'pending' };

export const access = {
  /** Whether this build knows where the records are. */
  configured(): boolean {
    return recordsClient() !== null;
  },

  /** Asks for authorization: a transmission (link + code) to the address. */
  async request(address: string): Promise<Outcome> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    if (!isAddress(address)) return { ok: false, why: 'address' };
    const { error } = await sb.auth.signInWithOtp({
      email: address.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    return error ? { ok: false, why: refusal('request', error) } : { ok: true, value: null };
  },

  /** Authorizes with the code from the transmission. */
  async confirmCode(address: string, code: string): Promise<Outcome> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const token = code.replace(/\s+/g, '');
    if (!/^\d{6,10}$/.test(token)) return { ok: false, why: 'expired' };
    const { error } = await sb.auth.verifyOtp({ email: address.trim(), token, type: 'email' });
    return error ? { ok: false, why: refusal('confirm code', error) } : { ok: true, value: null };
  },

  /** Authorizes with the link from the transmission, when the mail says
   *  what the provider's own template says (a code for this browser to
   *  exchange — the case until the project has its own mail server and so
   *  its own template). */
  async confirmReturn(code: string): Promise<Outcome> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return { ok: true, value: null };
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (session) return { ok: true, value: null };
    return { ok: false, why: refusal('confirm return', error) };
  },

  /** Authorizes with the link from the transmission (/auth/confirm). */
  async confirmLink(tokenHash: string, type: EmailOtpType): Promise<Outcome> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
    return error ? { ok: false, why: refusal('confirm link', error) } : { ok: true, value: null };
  },

  /** The holder's record, if this browser holds a session; null if not. */
  async record(): Promise<Outcome<HolderRecord | null>> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return { ok: true, value: null };
    // Checked with the records, not only read from the cookie.
    const { data: user, error } = await sb.auth.getUser();
    if (error || !user.user) {
      if (error?.name === 'AuthSessionMissingError' || error?.status === 401 || error?.status === 403) return { ok: true, value: null };
      return { ok: false, why: refusal('record: user', error) };
    }
    const { data, error: read } = await sb
      .from('profiles')
      .select('display_name, record_number, clearance, status')
      .eq('id', user.user.id)
      .maybeSingle<Row>();
    if (read) return { ok: false, why: refusal('record: read', read) };
    return { ok: true, value: toRecord(data) };
  },

  /** NAME FOR THIS RECORD: names the record (and, the first time, issues it
   *  provisionally). */
  async name(name: string): Promise<Outcome<HolderRecord>> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 1 || clean.length > 40) return { ok: false, why: 'name' };
    const { data, error } = await sb.rpc('claim_record', { name: clean });
    if (error) return { ok: false, why: refusal('name', error) };
    return { ok: true, value: toRecord(data as Row) };
  },

  /** The latest version of the holder's identity, if one has been written. */
  async latest(): Promise<Outcome<IdentityVersion | null>> {
    const sb = recordsClient();
    if (!sb) return { ok: false, why: 'unreachable' };
    const { data, error } = await sb
      .from('versions')
      .select('number, statement, created_at')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle<{ number: number; statement: string; created_at: string }>();
    if (error) return { ok: false, why: refusal('latest', error) };
    return { ok: true, value: data ? { number: data.number, statement: data.statement, createdAt: data.created_at } : null };
  },

  /** Closes this browser's session. */
  async close(): Promise<void> {
    const sb = recordsClient();
    if (!sb) return;
    const { error } = await sb.auth.signOut({ scope: 'local' });
    if (error) console.error('[records] close', error);
  },

  /** Calls back when this browser's session opens or closes — here, or in
   *  another tab (the link from the transmission opens one). */
  watch(onChange: (open: boolean) => void): () => void {
    const sb = recordsClient();
    if (!sb) return () => {};
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') onChange(Boolean(session));
      if (event === 'SIGNED_OUT') onChange(false);
    });
    return () => data.subscription.unsubscribe();
  },
};
