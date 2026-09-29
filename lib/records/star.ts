import { WORDMARK } from '@/lib/wordmark';

const outlines = WORDMARK.path.split(/ (?=M)/);

/** The asterisk of WILDCARD*, on its own: the wordmark's last outline, in a
 *  viewBox tight to it. What C.I.A comes down to on the way out of the
 *  terminal (components/Login.tsx). */
export const STAR = {
  path: outlines[outlines.length - 1],
  viewBox: '5184 12 334 322',
} as const;
