/**
 * The words of the record system: the Mainboard (/record…), the public
 * page (/w/…), the paths to a card (/create…). Never dashboard, profile,
 * settings, order: RECORD, CARD, VERSIONS, REWRITE, ISSUE.
 */

import type { CardProduction, CardStatus, LinkKind, Origin, Provenance, SectionKind, StudioStatus, Visibility } from './types';

export const NAV = [
  ['record', 'RECORD', '/record'],
  ['card', 'CARD', '/record/card'],
  ['versions', 'VERSIONS', '/record/versions'],
  ['rewrite', 'REWRITE', '/record/rewrite'],
] as const;

export const MORE = {
  open: 'More',
  publicView: 'PUBLIC VIEW',
  privacy: 'PRIVACY',
  contact: 'CONTACT',
  billing: 'BILLING',
  shipping: 'SHIPPING',
  later: 'LATER',
  close: 'CLOSE SESSION',
} as const;

export const HOME = {
  left: ['THIS IS HOW', 'YOU LEFT YOURSELF.'],
  nothing: ['NOTHING HAS BEEN', 'WRITTEN YET.'],
  unwritten: 'UNWRITTEN',
  view: 'VIEW THIS VERSION',
  rewrite: 'REWRITE',
  first: 'WRITE VERSION 01',
  begin: 'BEGIN SELF-ISSUANCE',
  edit: 'EDIT',
  publicView: 'PUBLIC VIEW',
  city: 'The city',
  label: 'Your WILDCARD* record',
} as const;

export const VISIBILITY: Record<Visibility, string> = {
  public: 'PUBLIC',
  link_only: 'LINK-ONLY',
  private: 'PRIVATE',
};

export const SECTION: Record<SectionKind, string> = {
  currently: 'CURRENTLY',
  i_care_about: 'I CARE ABOUT',
  current_obsession: 'CURRENT OBSESSION',
  dont_reduce_me_to: "DON'T REDUCE ME TO",
  five_pieces: 'FIVE PIECES OF EVIDENCE',
  object: 'OBJECT',
  sound: 'SOUND',
  unasked: 'UNASKED',
  custom: 'YOUR OWN',
};

export const LINK: Record<LinkKind, string> = {
  email: 'EMAIL',
  phone: 'PHONE',
  website: 'WEBSITE',
  instagram: 'INSTAGRAM',
  work: 'WORK',
  location: 'LOCATION',
  custom: 'LINK',
};

export const EDITOR = {
  statement: 'STATEMENT',
  statementHint: 'How you would leave yourself, today.',
  intro: 'INTRO',
  introHint: 'One line, for when someone first meets you.',
  sections: 'SECTIONS',
  addSection: 'ADD',
  ownLabel: 'YOUR LABEL',
  body: 'Write it as it is.',
  up: 'Move up',
  down: 'Move down',
  remove: 'REMOVE',
  contact: 'CONTACT',
  addLink: 'ADD',
  onExchange: 'GIVEN ON EXCHANGE*',
  value: 'address, number or link',
  privacy: 'PRIVACY',
  history: 'PAST VERSIONS ARE',
  shareLink: 'LINK-ONLY LINK',
  shareNote: 'What is LINK-ONLY opens only through this link. A new one closes every link given out before.',
  copy: 'COPY',
  copied: 'COPIED',
  renew: 'RENEW',
  noVersion: 'Nothing is written yet — write version 01 first. Contact and privacy can be set now.',
} as const;

export const EDIT = {
  title: 'EDIT',
  note: 'Corrections: a word, an address, an order, who may see what. No new version.',
  save: 'SAVE',
  saving: 'SAVING',
  saved: 'SAVED',
  unsaved: 'UNSAVED',
  failed: 'NOT SAVED. TRY AGAIN.',
} as const;

export const REWRITE = {
  ask: ['HAS SOMETHING', 'CHANGED?'],
  yes: 'YES',
  unsure: 'NOT SURE',
  good: ['GOOD.', 'UNCERTAINTY COUNTS.'],
  first: ['VERSION 01.'],
  firstNote: 'What you write here is the first version of your record. It can be corrected, and rewritten, later.',
  note: 'A new version. The one before stays, as it was, in VERSIONS. Your cards will show this one.',
  issue: (n: number) => `ISSUE VERSION ${String(n).padStart(2, '0')}`,
  written: (n: number) => [`VERSION ${String(n).padStart(2, '0')}.`, 'WRITTEN.'],
  failed: 'NOT WRITTEN. TRY AGAIN.',
} as const;

export const VERSIONS = {
  title: 'VERSIONS',
  none: 'NONE WRITTEN.',
  current: 'CURRENT',
  filed: 'FILED',
  unsure: 'WRITTEN UNSURE',
  back: 'ALL VERSIONS',
  missing: 'NO SUCH VERSION.',
} as const;

export const DOSSIER = {
  agency: 'COUNTER IDENTITY AGENCY — RECORD OF HOLDER',
  title: 'WILDCARD* — SELF-AUTHORED RECORD',
  form: 'FORM W*–00 · NOT FOR INSTITUTIONAL USE',
  likeness: 'NO LIKENESS ON FILE',
  holder: 'HOLDER',
  number: 'RECORD NO.',
  version: 'VERSION',
  written: 'WRITTEN',
  standing: 'STANDING',
  remarks: 'REMARKS',
  intro: 'INTRO',
  sections: 'ENTRIES',
  cards: 'CARDS ISSUED AT THIS VERSION',
  noCards: 'NONE.',
  hand: "HOLDER'S OWN HAND",
} as const;

export const CARD = {
  title: 'CARD',
  none: ['NO CARD', 'YET.'],
  noneNote: 'A card is one issue of your record: it remembers you as you were when it was made. Your record goes on changing; the card points to it.',
  begin: 'BEGIN SELF-ISSUANCE',
  issue: (n: number) => `ISSUE ${String(n).padStart(2, '0')}`,
  viewVersion: 'VIEW VERSION AT ISSUE',
  manage: 'MANAGE NFC',
  hide: 'CLOSE',
  lost: 'MARK LOST',
  lostAsk: (n: number) => `MARK ISSUE ${String(n).padStart(2, '0')} LOST? ITS * WILL STOP ANSWERING.`,
  lostYes: 'YES, LOST',
  lostNo: 'NO',
  portrait: 'REQUEST A NEW PORTRAIT',
  tap: 'TAP THE *',
  tapNote: 'The * on the card opens this address on any phone that reads NFC. The QR opens the same.',
  address: 'ADDRESS',
  recordAddress: "YOUR RECORD'S ADDRESS",
  recordNote: 'Your record has an address of its own, without a card. The same page a tap opens.',
  copy: 'COPY',
  copied: 'COPIED',
} as const;

export const CARD_STATUS: Record<CardStatus, string> = {
  pending: 'PENDING',
  production: 'IN PRODUCTION',
  active: 'ACTIVE',
  lost: 'LOST',
  revoked: 'REVOKED',
  retired: 'RETIRED',
};

export const PRODUCTION: Record<CardProduction, string> = {
  draft: 'DRAFT',
  designing: 'BEING DRAWN',
  awaiting_selection: 'THREE INTERPRETATIONS READY',
  selected: 'SELECTED',
  prepress: 'IN PRODUCTION',
  production: 'IN PRODUCTION',
  quality_check: 'IN PRODUCTION',
  shipped: 'ON ITS WAY',
  active: 'ISSUED',
};

export const STUDIO: Record<StudioStatus, string> = {
  submitted: 'EVIDENCE RECEIVED',
  under_review: 'UNDER INTERPRETATION',
  interpreting: 'WE SAW SOMETHING',
  interpretations_ready: 'THREE INTERPRETATIONS READY',
  feedback: 'RECEIVED: THIS DOESN’T FEEL LIKE ME',
  selected: 'SELECTED',
  closed: 'CLOSED',
};

export const PROVENANCE: Record<Provenance, string> = {
  self_issued: 'DESIGNED BY HOLDER',
  studio_portrait: 'INTERPRETED BY WILDCARD*',
  found: 'FOUND BY WILDCARD*',
};

export const ORIGIN: Record<Origin, string> = {
  self_application: 'SELF-ISSUED',
  studio_application: 'W* PORTRAIT',
  found: 'FOUND BY WILDCARD*',
};

export const PUBLIC = {
  save: 'SAVE CONTACT',
  message: 'MESSAGE',
  email: 'EMAIL',
  know: 'KNOW',
  then: 'VIEW ME WHEN THIS CARD WAS ISSUED',
  now: 'VIEW ME NOW',
  asOf: (n: number) => `AS OF VERSION ${String(n).padStart(2, '0')}`,
  inactive: ['THIS ISSUE IS NO', 'LONGER ACTIVE.'],
  missing: ['NO SUCH', 'WILDCARD*.'],
  tap: 'TAP THE *',
  question: 'WHO DECIDES WHAT YOU ARE?',
} as const;

export const CREATE = {
  ask: ['HOW WILL YOU', 'BE ISSUED?'],
  self: {
    title: 'CREATE MYSELF',
    kind: 'SELF-ISSUED',
    line: 'You design your card. WILDCARD* keeps only the *, the serial and its mark.',
    provenance: 'DESIGNED BY HOLDER',
  },
  studio: {
    title: 'LET WILDCARD* SEE ME',
    kind: 'W* PORTRAIT',
    line: "You don't design your card. You give us yourself — and we see you three ways.",
    provenance: 'INTERPRETED BY WILDCARD*',
  },
  same: 'Either way, the same record: versions, the public page, the *.',
  soon: 'BEING PREPARED',
  selfSoon: 'The self-issuance desk is being built: front and back, your artwork, a true print preview — and the *, the serial and the mark kept in place.',
  studioLead: ['YOU DON’T DESIGN', 'YOUR CARD.', 'YOU GIVE US', 'YOURSELF.'],
  studioSoon: 'FIVE PIECES OF EVIDENCE — the form that carries them is being rewritten. Then: UNDER INTERPRETATION, and three ways we saw you: A — SELF, B — MIRROR, C — WILDCARD.',
  back: 'BACK TO RECORD',
} as const;
