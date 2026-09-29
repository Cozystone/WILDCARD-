/**
 * FORM W*–01 — the WILDCARD* identity portrait application: what is
 * collected, and nothing else.
 *
 * The person is not designing a card. They are submitting evidence of
 * themselves for WILDCARD* to interpret. So the record holds what they
 * chose to say and show, in their words, and the studio's reading of it
 * lives apart (`portraitMap`, never shown to the applicant). No government
 * numbers, no payment details, no address: those are not evidence, and
 * shipping is a later step.
 *
 * Files (images, audio) are not in the record: the record holds a key, and
 * the store (lib/apply/store.ts) holds the file, privately.
 */

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'interpretations_ready'
  | 'selected'
  | 'production'
  | 'shipped';

/** A file the applicant gave: where the store keeps it, and what it was. */
export type Evidence = {
  key: string;
  name: string;
  type: string;
  size: number;
  /** Seconds, for audio. */
  duration?: number;
};

export type EvidenceSlot = {
  file: Evidence | null;
  /** Images 01–04 may carry a short note. 05 never does. */
  note: string;
};

export type Tension = 'left' | 'right' | 'both' | null;

export const TENSIONS = [
  ['ORDER', 'CHAOS'],
  ['PRIVATE', 'PUBLIC'],
  ['SOFT', 'BRUTAL'],
  ['CLASSIC', 'FUTURE'],
  ['SERIOUS', 'PLAYFUL'],
  ['PERMANENT', 'TEMPORARY'],
  ['VISIBLE', 'HIDDEN'],
  ['PRECISE', 'INSTINCTIVE'],
  ['ROMANTIC', 'INDUSTRIAL'],
] as const;

export type TensionKey = `${(typeof TENSIONS)[number][0]}-${(typeof TENSIONS)[number][1]}`;

export const tensionKey = (pair: (typeof TENSIONS)[number]): TensionKey => `${pair[0]}-${pair[1]}`;

export const TRACE_KINDS = [
  'desk',
  'room',
  'inside a bag',
  'most-worn clothing',
  'object they cannot throw away',
  'recent personal photo',
  'handwriting',
  'sketch',
  'note',
  'ticket / receipt',
  'other',
] as const;

export type TraceKind = (typeof TRACE_KINDS)[number];

export type ScreeningDecision = {
  itemId: string;
  decision: 'keep' | 'pass';
  /** The position in the run the item was shown at. */
  order: number;
  /** Milliseconds from the image appearing to the decision. */
  ms: number;
};

export type Visibility = 'public' | 'link' | 'private';

export type Application = {
  id: string;
  /** W*–26–000013. Internal and human-readable; never the public URL. */
  applicationNumber: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  /** Where the applicant is in the form (a draft resumes there). */
  section: number;

  author: {
    name: string;
    preferredName: string;
    cardName: string;
    otherNames: string;
    language: string;
    city: string;
    country: string;
    email: string;
  };

  currentRecord: {
    obsession: string;
    misunderstood: string;
    refuse: string;
    lessAfraid: string;
    keptTooLong: string;
    mostYourself: string;
    neverBecome: string;
    rightNow: string;
  };

  /** Exactly five. */
  visualEvidence: [EvidenceSlot, EvidenceSlot, EvidenceSlot, EvidenceSlot, EvidenceSlot];

  visualScreening: ScreeningDecision[];

  sensoryRecord: {
    song: string;
    material: string;
    textureHated: string;
    smell: string;
    timeOfDay: string;
    sound: string;
    place: string;
    object: string;
    objectImage: Evidence | null;
  };

  contradictions: Record<TensionKey, Tension>;

  negativeSpace: {
    notBeautiful: string;
    never: [string, string, string];
    color: string;
    cliche: string;
    usedToLove: string;
  };

  /** Up to three. */
  lifeTraces: { kind: TraceKind; file: Evidence }[];

  voice: Evidence | null;

  unasked: {
    mode: 'text' | 'image' | 'audio' | 'nothing' | null;
    text: string;
    image: Evidence | null;
    audio: Evidence | null;
  };

  publicPreferences: {
    displayName: boolean;
    statement: boolean;
    location: boolean;
    contact: boolean;
    photo: boolean;
    visibility: Visibility | null;
    contactButton: boolean;
    socialLinks: boolean;
    versionArchive: boolean;
    pastStatements: boolean;
  };

  consents: {
    /** DESIGN AUTHORITY */
    direction: boolean;
    finalAuthority: boolean;
    rejectWithoutRedesign: boolean;
    /** DECLARATION */
    read: boolean;
    authorize: boolean;
  };

  /**
   * The studio's, later. The map is a reading, not a diagnosis, and the
   * applicant never sees it unless a screen is designed for it.
   */
  portraitMap: {
    energy: string;
    tension: string;
    material: string;
    color: string;
    spatial: string;
    recurringTrace: string;
    aversion: string;
    currentState: string;
    designQuestion: string;
  } | null;

  /**
   * The three interpretations, later: A — SELF, B — MIRROR, C — WILDCARD,
   * one of which the studio may mark. The applicant chooses one, or says
   * THIS DOESN'T FEEL LIKE ME.
   */
  interpretations: { key: 'A' | 'B' | 'C'; title: 'SELF' | 'MIRROR' | 'WILDCARD'; studioChoice: boolean; ref: string | null }[];
  decision: { chosen: 'A' | 'B' | 'C' | null; rejected: boolean; note: string } | null;
};

const slot = (): EvidenceSlot => ({ file: null, note: '' });

export function emptyApplication(now = new Date()): Application {
  const iso = now.toISOString();
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    applicationNumber: null,
    status: 'draft',
    createdAt: iso,
    updatedAt: iso,
    submittedAt: null,
    section: 0,
    author: { name: '', preferredName: '', cardName: '', otherNames: '', language: '', city: '', country: '', email: '' },
    currentRecord: {
      obsession: '',
      misunderstood: '',
      refuse: '',
      lessAfraid: '',
      keptTooLong: '',
      mostYourself: '',
      neverBecome: '',
      rightNow: '',
    },
    visualEvidence: [slot(), slot(), slot(), slot(), slot()],
    visualScreening: [],
    sensoryRecord: {
      song: '',
      material: '',
      textureHated: '',
      smell: '',
      timeOfDay: '',
      sound: '',
      place: '',
      object: '',
      objectImage: null,
    },
    contradictions: Object.fromEntries(TENSIONS.map((p) => [tensionKey(p), null])) as Record<TensionKey, Tension>,
    negativeSpace: { notBeautiful: '', never: ['', '', ''], color: '', cliche: '', usedToLove: '' },
    lifeTraces: [],
    voice: null,
    unasked: { mode: null, text: '', image: null, audio: null },
    publicPreferences: {
      displayName: true,
      statement: true,
      location: false,
      contact: false,
      photo: false,
      visibility: null,
      contactButton: false,
      socialLinks: false,
      versionArchive: true,
      pastStatements: false,
    },
    consents: { direction: false, finalAuthority: false, rejectWithoutRedesign: false, read: false, authorize: false },
    portraitMap: null,
    interpretations: [],
    decision: null,
  };
}

/** The sections, in order, as the status line counts them. */
export const SECTIONS = [
  { n: 1, title: 'AUTHOR OF RECORD' },
  { n: 2, title: 'CURRENT RECORD' },
  { n: 3, title: 'VISUAL EVIDENCE' },
  { n: 4, title: 'VISUAL SCREENING' },
  { n: 5, title: 'SENSORY RECORD + CONTRADICTIONS' },
  { n: 6, title: 'NEGATIVE SPACE + TRACES' },
  { n: 7, title: 'THE UNASKED + AUTHORITY' },
] as const;
