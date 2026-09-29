/**
 * Everything the first screen is made of, in one place.
 *
 * ── REPLACING THE PICTURE ────────────────────────────────────────────────
 * Drop the new file into `public/hero/` and change `src`, `width`, `height`
 * and `alt` below. Landscape, 16:9 or near it, 1600–2400px across, WebP or
 * JPEG. It is served exactly as exported (no re-encode), so the grain and the
 * size you export are what people see. The wordmark is sized against the
 * picture's aspect ratio, which is read from `width` and `height` here.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const HERO = {
  image: {
    src: '/hero/city-horse.webp',
    width: 1672,
    height: 941,
    /** object-position: where the picture is anchored when the screen is not its shape. */
    position: '50% 50%',
    alt: 'A chestnut horse standing on a patch of long grass in the middle of a city intersection, glass towers leaning in overhead through a fisheye lens; a yellow taxi passing on the right.',
  },
} as const;

/**
 * The navigation line under the picture. Set 1 is the one in use; set 2 is
 * the variation, at /nav/2. A word with an `href` is a link; the rest are
 * words, until their pages exist. While the gallery is off the page none has
 * one — WORK went down to it, as `href: '#work'`.
 */
export type NavItem = { label: string; href?: string };

export const NAV: Record<'1' | '2', readonly NavItem[]> = {
  '1': [{ label: 'WORK' }, { label: 'OBJECTS' }, { label: 'SPACE' }, { label: 'THOUGHT' }],
  '2': [{ label: 'WORK' }, { label: 'SPACE' }, { label: 'TEXT' }, { label: 'INDEX' }],
};

export type NavSet = keyof typeof NAV;

export const DEFAULT_NAV: NavSet = '1';

/** Where the wordmark sits on the picture. */
export type LogoPlacement = 'center' | 'left' | 'offset';

export type VariantKey = 'a' | 'b' | 'c';

/**
 * A · B · C, bottom right.
 *
 * For now they are the three placements of the wordmark, as routes: /a, /b,
 * /c. The home page is DEFAULT_VARIANT. They are meant to become the site's
 * three modes — `later` — and nothing but this table needs to change when
 * they do: give each an href of its own and retire `placement`.
 */
export const VARIANTS: Record<
  VariantKey,
  { placement: LogoPlacement; label: string; note: string; later: string }
> = {
  a: { placement: 'center', label: 'A', note: 'Top centre, 15% down', later: 'WORK' },
  b: { placement: 'left', label: 'B', note: 'Top left, larger, nearer the left edge', later: 'TEXT' },
  c: { placement: 'offset', label: 'C', note: 'Riding the top edge of the picture', later: 'ARCHIVE / FRAGMENTS' },
};

export const DEFAULT_VARIANT: VariantKey = 'b';
