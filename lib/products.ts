/**
 * What can be bought, in one place — the structure, not the prices. The
 * prices are not set yet; when they are, they are set here (or on the
 * server that takes payment), and nowhere in a component.
 *
 * Both paths end in the same record: versions, the public page, the *. A
 * self-issued card is not a lesser card; it is another authorship.
 */

export type Money = { amount: number; currency: 'KRW' | 'USD' } | null;

export const PRODUCTS = {
  self: {
    key: 'self_issued',
    name: 'SELF-ISSUED CARD',
    authorship: 'DESIGNED BY HOLDER',
    includes: ['physical card', 'NFC *', 'digital record'],
    price: null as Money,
  },
  portrait: {
    key: 'w_portrait',
    name: 'W* PORTRAIT',
    authorship: 'INTERPRETED BY WILDCARD*',
    includes: ['physical card', 'NFC *', 'digital record', 'studio interpretation', 'A — SELF · B — MIRROR · C — WILDCARD', 'selected production'],
    price: null as Money,
    /** The studio's fee, on top of the card. */
    studioFee: null as Money,
  },
  /** A lost card reprinted as it was — not a new portrait. */
  reprint: {
    key: 'reprint',
    name: 'REPRINT OF AN ISSUE',
    price: null as Money,
  },
} as const;

/** Production surcharges, for later materials and treatments. */
export const SURCHARGES = {
  metal: null as Money,
  transparent: null as Money,
  special_print: null as Money,
  engraving: null as Money,
  holographic: null as Money,
  unusual_substrate: null as Money,
} as const;
