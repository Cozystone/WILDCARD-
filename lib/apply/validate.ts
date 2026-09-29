/**
 * What each section needs before CONTINUE. Errors are keyed by field so
 * they sit beside the field; a section-wide error is keyed by the section.
 */
import { ERRORS } from './copy';
import { SCREENING } from './screening';
import { TENSIONS, tensionKey, type Application } from './model';

export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const blank = (s: string) => s.trim().length === 0;

export function validate(app: Application, section: number): Errors {
  const e: Errors = {};
  switch (section) {
    case 1: {
      const a = app.author;
      for (const k of ['name', 'preferredName', 'cardName', 'language', 'city', 'country'] as const) {
        if (blank(a[k])) e[`author.${k}`] = ERRORS.required;
      }
      if (blank(a.email)) e['author.email'] = ERRORS.required;
      else if (!EMAIL.test(a.email.trim())) e['author.email'] = ERRORS.email;
      break;
    }
    case 2: {
      const c = app.currentRecord;
      for (const k of Object.keys(c) as (keyof typeof c)[]) {
        if (blank(c[k])) e[`currentRecord.${k}`] = ERRORS.required;
      }
      break;
    }
    case 3: {
      if (app.visualEvidence.some((s) => !s.file)) e.section = ERRORS.five;
      break;
    }
    case 4: {
      const decided = new Set(app.visualScreening.map((d) => d.itemId));
      if (SCREENING.some((item) => !decided.has(item.id))) e.section = ERRORS.screening;
      break;
    }
    case 5: {
      const s = app.sensoryRecord;
      for (const k of ['song', 'material', 'textureHated', 'smell', 'timeOfDay', 'sound', 'place', 'object'] as const) {
        if (blank(s[k])) e[`sensoryRecord.${k}`] = ERRORS.required;
      }
      if (TENSIONS.some((p) => app.contradictions[tensionKey(p)] === null)) e.contradictions = ERRORS.tensions;
      break;
    }
    case 6: {
      const n = app.negativeSpace;
      for (const k of ['notBeautiful', 'color', 'cliche', 'usedToLove'] as const) {
        if (blank(n[k])) e[`negativeSpace.${k}`] = ERRORS.required;
      }
      if (n.never.some(blank)) e['negativeSpace.never'] = ERRORS.three;
      break;
    }
    case 7: {
      if (!app.unasked.mode) e['unasked.mode'] = ERRORS.mode;
      else if (app.unasked.mode === 'text' && blank(app.unasked.text)) e['unasked.text'] = ERRORS.required;
      else if (app.unasked.mode === 'image' && !app.unasked.image) e['unasked.image'] = ERRORS.required;
      else if (app.unasked.mode === 'audio' && !app.unasked.audio) e['unasked.audio'] = ERRORS.required;
      break;
    }
    case 8: {
      const c = app.consents;
      if (!(c.direction && c.finalAuthority && c.rejectWithoutRedesign)) e.acks = ERRORS.acks;
      break;
    }
    case 9: {
      if (!app.publicPreferences.visibility) e.visibility = ERRORS.visibility;
      break;
    }
    case 10: {
      if (!(app.consents.read && app.consents.authorize)) e.declaration = ERRORS.declaration;
      break;
    }
  }
  return e;
}

/** Everything, for ISSUE ME*: the first section that is not complete, or 0. */
export function firstIncomplete(app: Application): number {
  for (let s = 1; s <= 10; s++) {
    if (Object.keys(validate(app, s)).length) return s;
  }
  return 0;
}
