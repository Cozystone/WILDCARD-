import { WORDMARK } from '@/lib/wordmark';

/**
 * WILDCARD* as outlines, not as text.
 *
 * The letters are Nimbus Sans Bold — URW's Helvetica clone, GPL with the font
 * exception — turned into a path by tools/build-type.py, with the pair
 * kerning from its AFM and a tracking of −30/1000 em. Outlines mean the mark
 * is the same on every machine: no Arial on Windows, no Helvetica Neue on a
 * Mac, no webfont to license. And it is a logo in the markup as well — one
 * shape, not a string in a heading. The accessible name is the word itself.
 *
 * The viewBox is tight to the ink, so the width it is given is the width of
 * the letters, and the W sits exactly on whatever it is aligned to.
 */
export default function Wordmark({ className, title = WORDMARK.text }: { className?: string; title?: string }) {
  return (
    <svg viewBox={WORDMARK.viewBox} role="img" aria-label={title} fill="currentColor" className={className}>
      <path d={WORDMARK.path} />
    </svg>
  );
}
