/**
 * The words of the records — the C.I.A terminal (components/Login.tsx) and
 * the record itself (components/records/Record.tsx).
 *
 * Nothing here says sign up, log in, email or password. An address is found
 * or not; a record is authorized, issued, named, opened. The one institution
 * is a parody and says so by what it says, not by warnings.
 */

export const TERMINAL = {
  holder: 'Holder:',
  clearance: 'Clearance:',
  record: 'Record:',
  /** The clearance before anything is known. */
  unissued: 'Unissued',
  helper: 'Enter the address associated with your record.',

  searching: 'SEARCHING RECORDS...',
  /** The same for every address, found or not: an address cannot be tested
   *  by what the terminal says to it. */
  required: ['AUTHORIZATION REQUIRED.', 'CHECK YOUR TERMINAL.'],
  code: 'CODE:',

  verifying: 'VERIFYING RECORD...',
  found: 'RECORD FOUND.',
  confirmed: 'IDENTITY CONFIRMED.',
  welcome: ['WELCOME BACK.', 'YOU MAY HAVE CHANGED.'],

  none: 'NO RECORD FOUND.',
  issueOne: 'ISSUE ONE?',
  yes: '[Y] YES',
  no: '[N] NO',
  requested: 'SELF-ISSUANCE REQUESTED.',
  name: 'NAME FOR THIS RECORD:',
  created: 'RECORD CREATED.',
  declined: 'NO RECORD ISSUED.',

  expired: ['AUTHORIZATION EXPIRED.', 'REQUEST ANOTHER?'],
  interrupted: ['ACCESS INTERRUPTED.', 'TRY AGAIN.'],
  limited: ['TRANSMISSION LIMIT REACHED.', 'TRY AGAIN SHORTLY.'],
  address: ['THAT IS NOT AN ADDRESS.', 'TRY AGAIN.'],
  nameRule: 'ONE TO FORTY CHARACTERS.',
  suspended: ['RECORD SUSPENDED.', 'ACCESS INTERRUPTED.'],
  unreachable: ['RECORDS UNREACHABLE.'],
  /** Only when the records cannot be reached: the form, kept on this device. */
  beginHere: '[ BEGIN SELF-ISSUANCE ]',

  /** For those who cannot see the seal. */
  sealAlt: 'Counter Identity Agency — WILDCARD System',
  titleText: 'C.I.A Terminal',
  label: 'C.I.A terminal — Counter Identity Agency',

  notice: [
    'You are entering a secured Counter Identity Agency system, which may be used only by the',
    'person it is issued to. Nothing entered on this system verifies who you are, and nothing here',
    'decides what you are: it keeps what you choose to tell it. The agency records all usage.',
    'All persons are hereby notified that use of this system constitutes consent to be interpreted.',
  ],
  station: ['Counter Identity Agency', 'WILDCARD System 1.0', 'Self-Issuance Station'],
} as const;

export const RECORD = {
  left: ['THIS IS HOW', 'YOU LEFT YOURSELF.'],
  nothing: ['NOTHING HAS BEEN', 'WRITTEN YET.'],
  begin: 'BEGIN SELF-ISSUANCE',
  view: 'VIEW THIS VERSION',
  rewrite: 'REWRITE',
  back: 'BACK',
  written: 'WRITTEN',
  session: 'SESSION',
  close: 'CLOSE SESSION',
  label: 'Your WILDCARD* record',
} as const;
