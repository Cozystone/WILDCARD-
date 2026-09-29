/**
 * A WILDCARD* record, as the site sees it (the table is public.profiles, in
 * supabase/migrations). The database's own ids never leave it: the holder is
 * known to the page by their session, and a record by its number.
 */

export type Clearance = 'unissued' | 'provisional' | 'self_authorized' | 'issued';
export type RecordStatus = 'pending' | 'active' | 'suspended';

export type HolderRecord = {
  /** NAME FOR THIS RECORD — null until the record is named. */
  displayName: string | null;
  /** W*–000137, once the studio has given it; null is PENDING. */
  recordNumber: string | null;
  clearance: Clearance;
  status: RecordStatus;
  /** When the record opened (the address first authorized itself). */
  openedAt: string | null;
  /** The address the record answers to — the holder's own, for their eyes. */
  address: string | null;
};

export type IdentityVersion = {
  number: number;
  statement: string;
  createdAt: string;
};

/** As the terminal prints a clearance it has looked up. */
export const CLEARANCE: Record<Clearance, string> = {
  unissued: 'UNISSUED',
  provisional: 'PROVISIONAL',
  self_authorized: 'SELF-AUTHORIZED',
  issued: 'ISSUED',
};

/** The clearances in the order a record passes through them. */
export const CLEARANCES: readonly Clearance[] = ['unissued', 'provisional', 'self_authorized', 'issued'];

export const recordLabel = (number: string | null) => number ?? 'W*–PENDING';

/** 2026.09.30 — as a record office stamps a date. */
export const dateLabel = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

/** a••••••@gmail.com — the address, enough of it to be recognised. */
export const addressLabel = (address: string | null) => {
  if (!address) return '—';
  const [name, domain] = address.split('@');
  if (!domain) return address;
  return `${name.slice(0, 1)}${'•'.repeat(Math.max(3, Math.min(8, name.length - 1)))}@${domain}`;
};

export const versionLabel = (n: number) => `VERSION ${String(n).padStart(2, '0')}`;
