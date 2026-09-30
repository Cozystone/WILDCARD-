/** 29 SEP 2029 — how the record dates things. */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const dayLabel = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const yearLabel = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : String(d.getFullYear());
};

export const two = (n: number) => String(n).padStart(2, '0');

/** A link as someone would click it: a web address gets its scheme. */
export const linkHref = (kind: string, value: string) => {
  const v = value.trim();
  if (kind === 'email') return `mailto:${v}`;
  if (kind === 'phone') return `tel:${v.replace(/[^\d+]/g, '')}`;
  if (kind === 'location') return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === 'instagram' && /^@?[\w.]+$/.test(v)) return `https://instagram.com/${v.replace(/^@/, '')}`;
  return `https://${v}`;
};

/** What a link shows: the address without its scheme. */
export const linkText = (kind: string, value: string) => {
  const v = value.trim();
  if (kind === 'instagram') {
    const m = v.match(/instagram\.com\/([\w.]+)/i);
    return m ? `@${m[1]}` : v.startsWith('@') ? v : `@${v}`;
  }
  return v.replace(/^https?:\/\//i, '').replace(/\/$/, '');
};
