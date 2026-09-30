/**
 * The record system, as the site sees it (the tables are in
 * supabase/migrations/20261001000000_mainboard.sql). Internal ids stay
 * internal: pages address a holder by their session, a version by its
 * number, a card by its issue, and the public by an opaque token.
 */

import type { Clearance, RecordStatus } from '@/lib/records/types';

export type Visibility = 'public' | 'link_only' | 'private';

export type SectionKind =
  | 'currently'
  | 'i_care_about'
  | 'current_obsession'
  | 'dont_reduce_me_to'
  | 'five_pieces'
  | 'object'
  | 'sound'
  | 'unasked'
  | 'custom';

export type LinkKind = 'email' | 'phone' | 'website' | 'instagram' | 'work' | 'location' | 'custom';

export type Origin = 'self_application' | 'studio_application' | 'found';
export type DesignMode = 'self' | 'studio';
export type Provenance = 'self_issued' | 'studio_portrait' | 'found';
export type CardStatus = 'pending' | 'production' | 'active' | 'lost' | 'revoked' | 'retired';
export type CardProduction =
  | 'draft'
  | 'designing'
  | 'awaiting_selection'
  | 'selected'
  | 'prepress'
  | 'production'
  | 'quality_check'
  | 'shipped'
  | 'active';
export type StudioStatus = 'submitted' | 'under_review' | 'interpreting' | 'interpretations_ready' | 'feedback' | 'selected' | 'closed';

export type Section = {
  kind: SectionKind;
  /** The holder's own label (custom sections), or null for the kind's. */
  label: string | null;
  body: string;
  visibility: Visibility;
};

export type Link = {
  kind: LinkKind;
  label: string | null;
  value: string;
  visibility: Visibility;
  onExchange: boolean;
};

export type Version = {
  number: number;
  statement: string;
  statementVisibility: Visibility;
  intro: string;
  introVisibility: Visibility;
  uncertain: boolean;
  createdAt: string;
  frozenAt: string | null;
  sections: Section[];
};

export type VersionSummary = { number: number; statement: string; createdAt: string; current: boolean; uncertain: boolean };

export type Card = {
  id: string;
  issueNumber: number;
  versionAtIssue: number | null;
  designMode: DesignMode;
  provenance: Provenance;
  status: CardStatus;
  production: CardProduction;
  issuedAt: string | null;
  createdAt: string;
  /** The active token its * answers with, if it has one. */
  token: string | null;
};

/** The holder's own record, as the Mainboard holds it. */
export type Mine = {
  name: string | null;
  recordNumber: string | null;
  clearance: Clearance;
  status: RecordStatus;
  origin: Origin;
  publicId: string;
  shareKey: string;
  historyVisibility: Visibility;
  email: string | null;
  openedAt: string;
  current: Version | null;
  links: Link[];
  cards: Card[];
};

/** What /w/{token} is given (public_record): only what the holder made
 *  public, and link-only material when the link carries the share key. */
export type PublicRecord =
  | { state: 'missing' | 'inactive' }
  | {
      state: 'active';
      inner: boolean;
      name: string;
      record_number: string | null;
      origin: Origin;
      version: number | null;
      current: boolean;
      written_at: string | null;
      intro: string | null;
      statement: string | null;
      sections: { kind: SectionKind; label: string | null; body: string }[];
      links: { kind: LinkKind; label: string | null; value: string }[];
      history: { number: number; created_at: string }[];
      card: { issue: number; provenance: Provenance; issued_at: string | null; version_at_issue: number | null } | null;
    };
