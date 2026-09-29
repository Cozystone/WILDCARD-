/**
 * SECTION 04 — VISUAL SCREENING: the curated library shown one image at a
 * time, KEEP or PASS.
 *
 * The images are not in the repository yet. Until they are, the run is
 * twenty-four neutral slots — a numbered plate on the screen's black — so
 * the section works end to end and the decisions are recorded against
 * stable ids. TODO: put the library in public/apply/screening/<id>.webp
 * (private material stays out of /public; this library is the studio's own,
 * and public) and set `src` here. Keep the ids: recorded decisions refer
 * to them.
 */
export type ScreeningItem = {
  id: string;
  /** Path under /public, or null for a placeholder slot. */
  src: string | null;
  /** For the studio's reading, never shown. */
  label: string;
};

export const SCREENING: readonly ScreeningItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: `s${String(i + 1).padStart(2, '0')}`,
  src: null,
  label: `TODO plate ${String(i + 1).padStart(2, '0')}`,
}));
