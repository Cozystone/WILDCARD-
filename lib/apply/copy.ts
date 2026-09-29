/**
 * Every word the application says, in one place. The form's voice is an
 * institution's — formal, short, without warmth for sale — and it never
 * explains itself twice.
 */
export const FORM = {
  code: 'FORM W*–01',
  title: 'WILDCARD* IDENTITY PORTRAIT APPLICATION',
  line: 'WHO DECIDES WHAT YOU ARE?',
  /** Before the form, the film's opening (the author's words, 2026-09-29),
   *  screen by screen; the same as the Macintosh's (lib/program.ts). A
   *  visitor who comes from the Macintosh has just read it and skips it. */
  boot: [['Wake up, Neo...'], ['The Wildcard has you...'], ['Follow your ego...', "Then we'll find you..."], ['Knock, knock, Neo...']],
  bootHolds: [3.2, 2.6, 2.8, 1.8],
  begin: '[ BEGIN SELF-ISSUANCE ]',
  resume: '[ RESUME DRAFT ]',
  draftFound: 'DRAFT ON FILE.',
  close: 'CLOSE',
  headline: "LET'S GET STARTED ON YOUR WILDCARD* APPLICATION",
  benefits: [
    ['ONE-OF-ONE PHYSICAL PORTRAIT', 'Every issued card is individually art-directed for its holder.'],
    ['THREE INTERPRETATIONS', 'WILDCARD* will present three independent visual interpretations.'],
    ['NFC LIVING IDENTITY', 'The physical card opens a digital identity that may change over time.'],
    ['VERSIONED FOR LIFE', 'Future cards can become an archive of who the holder once was.'],
  ],
  disclaimers: ['THIS IS NOT A GOVERNMENT ID.', 'THIS IS NOT A PAYMENT CARD.', 'THIS DOES NOT VERIFY WHO YOU ARE.'],
  asks: 'IT ASKS WHO GETS TO DECIDE.',
  wake: (name: string) => [`WAKE UP, ${name.toUpperCase()}.`, 'WE NEED EVIDENCE OF YOU.'],
  nav: { back: '[ BACK ]', next: '[ CONTINUE ]', issue: '[ ISSUE ME* ]', begin: '[ BEGIN ]' },
  status: { saved: 'DRAFT SAVED', saving: 'SAVING', restored: 'DRAFT RESTORED', unsaved: 'UNSAVED' },
  card: { mark: 'WILDCARD*', state: 'UNISSUED' },
} as const;

export const S01 = {
  helper: ['We need enough information to speak to you,', 'not enough information to classify you.'],
  fields: {
    name: 'NAME',
    preferredName: 'PREFERRED NAME',
    cardName: 'NAME TO APPEAR ON CARD',
    otherNames: 'OTHER NAMES PEOPLE CALL YOU',
    language: 'PRIMARY LANGUAGE',
    city: 'CURRENT CITY',
    country: 'CURRENT COUNTRY',
    email: 'EMAIL',
  },
  optional: 'OPTIONAL',
} as const;

export const S02 = {
  questions: [
    ['obsession', 'What are you obsessed with right now?'],
    ['misunderstood', 'What do people often misunderstand about you?'],
    ['refuse', 'What do you refuse to be reduced to?'],
    ['lessAfraid', 'What are you trying to become less afraid of?'],
    ['keptTooLong', 'What have you kept for too long?'],
    ['mostYourself', 'Where do you feel most like yourself?'],
    ['neverBecome', 'What would you never want to become?'],
  ] as const,
  complete: 'RIGHT NOW, I AM',
  limit: 600,
} as const;

export const S03 = {
  title: 'PROVIDE FIVE PIECES OF VISUAL EVIDENCE',
  copy: ["Don't show us what looks good.", 'Show us what stays with you.'],
  slots: [
    'A PLACE YOU WANT TO LIVE INSIDE',
    'AN IMAGE THAT STRANGELY FEELS LIKE YOU',
    'SOMETHING YOU FIND BEAUTIFUL',
    "SOMETHING THAT MAKES YOU UNCOMFORTABLE, BUT YOU CAN'T IGNORE",
    "DON'T EXPLAIN THIS ONE.",
  ],
  note: 'NOTE',
  noteLimit: 140,
  drop: 'DROP AN IMAGE HERE, OR PRESS TO CHOOSE',
  replace: 'REPLACE',
  remove: 'REMOVE',
  reading: 'READING',
  accept: 'JPEG · PNG · WEBP · HEIC — UP TO 20 MB',
} as const;

export const S04 = {
  copy: "DON'T OVERTHINK IT.",
  keep: 'KEEP',
  pass: 'PASS',
  of: (i: number, n: number) => `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
  done: 'SCREENING COMPLETE.',
  keys: '←  PASS     KEEP  →',
} as const;

export const S05 = {
  fields: [
    ['song', 'ONE SONG YOU RETURN TO'],
    ['material', 'A MATERIAL YOU WANT TO TOUCH'],
    ['textureHated', 'A TEXTURE YOU HATE'],
    ['smell', 'A SMELL YOU REMEMBER'],
    ['timeOfDay', 'A TIME OF DAY THAT FEELS LIKE YOURS'],
    ['sound', 'A SOUND THAT FEELS LIKE HOME'],
    ['place', "A PLACE YOU CAN'T FORGET"],
    ['object', 'AN OBJECT YOU WOULD STRUGGLE TO THROW AWAY'],
  ] as const,
  objectImage: 'AN IMAGE OF THAT OBJECT',
  tensions: 'CONTRADICTIONS',
  tensionsCopy: 'These are aesthetic tensions, not personality diagnoses.',
  both: 'BOTH',
} as const;

export const S06 = {
  questions: [
    ['notBeautiful', 'What looks beautiful to everyone else, but not to you?'],
    ['color', "A color that doesn't feel like you."],
    ['cliche', 'A visual cliché you hate.'],
    ['usedToLove', 'Something you used to love but no longer do.'],
  ] as const,
  never: 'Name three things that should NEVER appear on your card.',
  traces: 'SHOW US EVIDENCE THAT YOU EXIST.',
  tracesCopy: 'Up to three. Optional.',
  traceKind: 'WHAT IS THIS',
  voice: 'VOICE',
  voiceCopy: ["Don't introduce yourself.", "Talk about something you've been thinking about lately."],
  voiceLimit: 60,
  record: 'RECORD',
  stop: 'STOP',
  upload: 'OR UPLOAD AUDIO',
  optional: 'OPTIONAL',
} as const;

export const S07 = {
  title: ['TELL US SOMETHING', "WE DIDN'T ASK."],
  modes: [
    ['text', 'TEXT'],
    ['image', 'IMAGE'],
    ['audio', 'AUDIO'],
    ['nothing', 'NOTHING'],
  ] as const,
  authority: {
    title: 'DESIGN AUTHORITY',
    copy: ['You are not commissioning a design you already know.', 'You are asking WILDCARD* to interpret you.'],
    acks: [
      ['direction', 'I understand that WILDCARD* controls the visual direction.'],
      ['finalAuthority', 'I understand that I retain final authority over whether an interpretation feels like me.'],
      ['rejectWithoutRedesign', 'I understand that I may reject an interpretation without redesigning it myself.'],
    ] as const,
    close: ['Creative authority belongs to WILDCARD*.', 'Identity authority belongs to you.'],
  },
  public: {
    title: 'PUBLIC CARD / NFC PREFERENCES',
    copy: 'Permissions only. What the card shows is decided later.',
    toggles: [
      ['displayName', 'ALLOW PREFERRED / DISPLAY NAME TO APPEAR'],
      ['statement', 'ALLOW CURRENT STATEMENT'],
      ['location', 'PUBLIC LOCATION'],
      ['contact', 'PUBLIC CONTACT'],
      ['photo', 'PROFILE PHOTO'],
      ['contactButton', 'CONTACT BUTTON'],
      ['socialLinks', 'SOCIAL LINKS'],
      ['versionArchive', 'VERSION ARCHIVE'],
      ['pastStatements', 'PAST STATEMENTS VISIBLE'],
    ] as const,
    visibility: 'NFC PROFILE VISIBILITY',
    visibilities: [
      ['public', 'PUBLIC'],
      ['link', 'LINK-ONLY'],
      ['private', 'PRIVATE'],
    ] as const,
    shipping: 'Shipping address is not collected here. It is a post-design step.',
  },
  declaration: {
    read: 'PLEASE READ',
    title: 'DECLARATION OF AUTHORSHIP',
    lead: 'I certify, understand and agree that:',
    items: [
      'The information I submitted represents what I chose to share with WILDCARD* at this moment.',
      'I understand that these answers are not permanent definitions of who I am.',
      'I understand that WILDCARD* will interpret, not diagnose, classify, or legally verify my identity.',
      'I retain the right to reject any interpretation that does not feel like mine.',
      'I understand that the physical WILDCARD* is not a government-issued identification document, financial instrument, or proof of legal identity.',
      'Media submitted for my private commission will not be made public without explicit permission.',
      'I understand that I may change.',
      'I understand that this is the point.',
    ],
    checks: [
      ['read', 'I HAVE READ THIS.'],
      ['authorize', 'I AUTHORIZE MYSELF.'],
    ] as const,
    issue: 'ISSUE ME*',
  },
} as const;

export const SUBMIT = {
  processing: 'PROCESSING EVIDENCE...',
  accepted: (n: string) => `APPLICATION ${n} ACCEPTED.`,
  enough: "THAT'S ENOUGH.",
  from: "WE'LL TAKE IT FROM HERE.",
  number: 'APPLICATION NUMBER',
  back: '[ RETURN ]',
} as const;

export const ERRORS = {
  required: 'REQUIRED.',
  email: 'THIS DOES NOT READ AS AN EMAIL ADDRESS.',
  five: 'FIVE IMAGES. ALL FIVE.',
  screening: 'EVERY IMAGE NEEDS A DECISION.',
  tensions: 'EVERY PAIR NEEDS A SIDE, OR BOTH.',
  three: 'THREE THINGS.',
  mode: 'CHOOSE ONE, EVEN IF IT IS NOTHING.',
  acks: 'ALL THREE.',
  visibility: 'CHOOSE ONE.',
  declaration: 'BOTH.',
  file: (why: string) => `NOT ACCEPTED: ${why}.`,
} as const;
