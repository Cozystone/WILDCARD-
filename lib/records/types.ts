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

export const recordLabel = (number: string | null) => number ?? 'W*–PENDING';

export const versionLabel = (n: number) => `VERSION ${String(n).padStart(2, '0')}`;
