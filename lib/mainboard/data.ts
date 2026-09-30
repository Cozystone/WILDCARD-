/**
 * The Mainboard's reads and writes — the holder's own record, through the
 * browser's session. Reads are the tables, which row-level security narrows
 * to the holder's own rows; writes are the database's functions
 * (edit_record, rewrite_record, mark_card_lost, renew_share_key), which
 * check who is asking. Nothing here can reach another holder's record.
 */
import { refusal, type Outcome } from '@/lib/records/access';
import { recordsClient } from '@/lib/supabase/client';
import type { Card, Link, Mine, Section, Version, VersionSummary, Visibility } from './types';

type SectionRow = { kind: Section['kind']; label: string | null; body: string; position: number; visibility: Visibility };
type VersionRow = {
  id: string;
  number: number;
  statement: string;
  statement_visibility: Visibility;
  intro: string;
  intro_visibility: Visibility;
  uncertain: boolean;
  created_at: string;
  frozen_at: string | null;
  record_sections: SectionRow[] | null;
};

const VERSION_COLUMNS =
  'id, number, statement, statement_visibility, intro, intro_visibility, uncertain, created_at, frozen_at, record_sections(kind, label, body, position, visibility)';

const toVersion = (v: VersionRow): Version => ({
  number: v.number,
  statement: v.statement,
  statementVisibility: v.statement_visibility,
  intro: v.intro,
  introVisibility: v.intro_visibility,
  uncertain: v.uncertain,
  createdAt: v.created_at,
  frozenAt: v.frozen_at,
  sections: [...(v.record_sections ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({ kind: s.kind, label: s.label, body: s.body, visibility: s.visibility })),
});

type CardRow = {
  id: string;
  issue_number: number;
  design_mode: Card['designMode'];
  provenance: Card['provenance'];
  status: Card['status'];
  production: Card['production'];
  issued_at: string | null;
  created_at: string;
  record_versions: { number: number } | null;
  nfc_tokens: { token: string; active: boolean }[] | null;
};

const CARD_COLUMNS =
  'id, issue_number, design_mode, provenance, status, production, issued_at, created_at, record_versions(number), nfc_tokens(token, active)';

const toCard = (c: CardRow): Card => ({
  id: c.id,
  issueNumber: c.issue_number,
  versionAtIssue: c.record_versions?.number ?? null,
  designMode: c.design_mode,
  provenance: c.provenance,
  status: c.status,
  production: c.production,
  issuedAt: c.issued_at,
  createdAt: c.created_at,
  token: c.nfc_tokens?.find((t) => t.active)?.token ?? null,
});

/** The holder's record, its current version, contact and cards — or null
 *  when this browser holds no session. */
export async function loadMine(): Promise<Outcome<Mine | null>> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: true, value: null };

  const rec = await sb
    .from('records')
    .select('display_name, record_number, clearance, status, origin, public_id, share_key, history_visibility, email, created_at, current_version_id')
    .maybeSingle();
  if (rec.error) return { ok: false, why: refusal('mine', rec.error) };
  if (!rec.data) return { ok: true, value: null };
  const r = rec.data;

  const [version, links, cards] = await Promise.all([
    r.current_version_id
      ? sb.from('record_versions').select(VERSION_COLUMNS).eq('id', r.current_version_id).maybeSingle<VersionRow>()
      : Promise.resolve({ data: null, error: null }),
    sb.from('record_links').select('kind, label, value, position, visibility, on_exchange').order('position'),
    sb.from('cards').select(CARD_COLUMNS).order('issue_number', { ascending: false }).returns<CardRow[]>(),
  ]);
  const failed = version.error ?? links.error ?? cards.error;
  if (failed) return { ok: false, why: refusal('mine: parts', failed) };

  return {
    ok: true,
    value: {
      name: r.display_name,
      recordNumber: r.record_number,
      clearance: r.clearance,
      status: r.status,
      origin: r.origin,
      publicId: r.public_id,
      shareKey: r.share_key,
      historyVisibility: r.history_visibility,
      email: r.email,
      openedAt: r.created_at,
      current: version.data ? toVersion(version.data) : null,
      links: (links.data ?? []).map((l) => ({ kind: l.kind, label: l.label, value: l.value, visibility: l.visibility, onExchange: l.on_exchange })),
      cards: (cards.data ?? []).map(toCard),
    },
  };
}

/** Every version, the latest first. */
export async function loadVersions(): Promise<Outcome<VersionSummary[]>> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const { data, error } = await sb
    .from('record_versions')
    .select('number, statement, created_at, frozen_at, uncertain')
    .order('number', { ascending: false });
  if (error) return { ok: false, why: refusal('versions', error) };
  return {
    ok: true,
    value: (data ?? []).map((v) => ({ number: v.number, statement: v.statement, createdAt: v.created_at, current: !v.frozen_at, uncertain: v.uncertain })),
  };
}

/** One version, whole, with the cards issued at it. */
export async function loadVersion(n: number): Promise<Outcome<{ version: Version; cards: Card[] } | null>> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const v = await sb.from('record_versions').select(VERSION_COLUMNS).eq('number', n).maybeSingle<VersionRow>();
  if (v.error) return { ok: false, why: refusal('version', v.error) };
  if (!v.data) return { ok: true, value: null };
  const c = await sb.from('cards').select(CARD_COLUMNS).eq('version_at_issue', v.data.id).order('issue_number').returns<CardRow[]>();
  if (c.error) return { ok: false, why: refusal('version: cards', c.error) };
  return { ok: true, value: { version: toVersion(v.data), cards: (c.data ?? []).map(toCard) } };
}

export type Draft = {
  statement: string;
  statementVisibility: Visibility;
  intro: string;
  introVisibility: Visibility;
  sections: Section[];
};

const sectionsJson = (sections: Section[]) =>
  sections.map((s) => ({ kind: s.kind, label: s.kind === 'custom' ? s.label?.trim() || 'UNTITLED' : s.label, body: s.body, visibility: s.visibility }));

/** EDIT: the current version corrected in place, the contact, the privacy. */
export async function saveEdit(draft: Draft, links: Link[], historyVisibility: Visibility): Promise<Outcome> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const { error } = await sb.rpc('edit_record', {
    statement: draft.statement,
    statement_visibility: draft.statementVisibility,
    intro: draft.intro,
    intro_visibility: draft.introVisibility,
    sections: sectionsJson(draft.sections),
    links: links
      .filter((l) => l.value.trim())
      .map((l) => ({ kind: l.kind, label: l.label, value: l.value.trim(), visibility: l.visibility, on_exchange: l.onExchange })),
    history_visibility: historyVisibility,
  });
  return error ? { ok: false, why: refusal('edit', error) } : { ok: true, value: null };
}

/** REWRITE: version N+1. Returns its number. */
export async function saveRewrite(draft: Draft, uncertain: boolean): Promise<Outcome<number>> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const { data, error } = await sb.rpc('rewrite_record', {
    statement: draft.statement,
    statement_visibility: draft.statementVisibility,
    intro: draft.intro,
    intro_visibility: draft.introVisibility,
    sections: sectionsJson(draft.sections),
    uncertain,
  });
  return error ? { ok: false, why: refusal('rewrite', error) } : { ok: true, value: data as number };
}

export async function markLost(cardId: string): Promise<Outcome> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const { error } = await sb.rpc('mark_card_lost', { card: cardId });
  return error ? { ok: false, why: refusal('lost', error) } : { ok: true, value: null };
}

export async function renewShareKey(): Promise<Outcome<string>> {
  const sb = recordsClient();
  if (!sb) return { ok: false, why: 'unreachable' };
  const { data, error } = await sb.rpc('renew_share_key');
  return error ? { ok: false, why: refusal('share key', error) } : { ok: true, value: data as string };
}

/** The public address of a card's * — or of the record, without one. */
export const publicUrl = (tag: string, key?: string | null) => {
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/w/${tag}${key ? `?k=${encodeURIComponent(key)}` : ''}`;
};
