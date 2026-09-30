import type { PublicRecord } from '@/lib/mainboard/types';

type Active = Extract<PublicRecord, { state: 'active' }>;

/** vCard text escapes. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/**
 * SAVE CONTACT: a vCard 3.0 of what the holder made public — the name, the
 * intro as a note, the public contact, and the page itself. Nothing that is
 * not on the page goes into it.
 */
export function vcard(rec: Active, pageUrl: string): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${esc(rec.name)};;;`, `FN:${esc(rec.name)}`];
  if (rec.intro) lines.push(`NOTE:${esc(rec.intro)}`);
  for (const l of rec.links) {
    const v = l.value.trim();
    if (!v) continue;
    if (l.kind === 'email') lines.push(`EMAIL;TYPE=INTERNET:${esc(v)}`);
    else if (l.kind === 'phone') lines.push(`TEL;TYPE=CELL:${esc(v)}`);
    else if (l.kind === 'location') lines.push(`ADR;TYPE=WORK:;;${esc(v)};;;;`);
    else if (l.kind === 'instagram') lines.push(`X-SOCIALPROFILE;TYPE=instagram:${esc(v)}`);
    else lines.push(`URL:${esc(/^https?:\/\//i.test(v) ? v : `https://${v}`)}`);
  }
  lines.push(`URL:${esc(pageUrl)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

/** A file name for it: the name, plainly. */
export const vcardName = (name: string) => `${name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'wildcard'}.vcf`;
