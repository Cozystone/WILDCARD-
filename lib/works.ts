/**
 * The gallery: SELECTED WORKS, the third screen.
 *
 * One work so far, [9.40.PM], seven plates in the order of the folder they
 * came from (WILDCARD/Photo/[9.40.PM]). Titles are the file names. Order,
 * titles and the choice of plates are provisional: change them here and the
 * page follows.
 *
 * Each plate carries its own hang, like a plate list in a book:
 *   size   'l' — the height of the screen, less its air   'm' — two thirds of that
 *   at     'left' | 'third' | 'right' — which of three vertical lines it hangs on
 * The first hangs from the page's left edge, right under the label, like
 * everything above it. Large plates keep to the edges: a third of the way in,
 * a large plate reads as merely centred.
 * On a phone every plate is the width of the screen and `at` only decides
 * which side a medium plate keeps to.
 *
 * Images live in public/works/<work>/, WebP at the source's own size
 * (1122 × 1402, quality 88). Like the hero they are served as exported.
 */
export type Plate = {
  src: string;
  title: string;
  width: number;
  height: number;
  size: 'l' | 'm';
  at: 'left' | 'third' | 'right';
  alt: string;
};

export type Work = {
  slug: string;
  title: string;
  year: number;
  plates: readonly Plate[];
};

const P = { width: 1122, height: 1402 } as const;

export const WORKS: readonly Work[] = [
  {
    slug: '940pm',
    title: '[9.40.PM]',
    year: 2026,
    plates: [
      {
        ...P,
        src: '/works/940pm/bye.webp',
        title: 'BYE',
        size: 'l',
        at: 'left',
        alt: 'A man in a grey suit with a briefcase walks away down the middle of a flooded city boulevard at dusk; white flowers grow up through the wet asphalt between the lanes.',
      },
      {
        ...P,
        src: '/works/940pm/city-horse.webp',
        title: 'CITY HORSE',
        size: 'm',
        at: 'third',
        alt: 'A chestnut horse stands on a patch of turf inside a marble office lobby at night; beside it a man in a grey suit sits on a white chair, the lit towers outside the glass.',
      },
      {
        ...P,
        src: '/works/940pm/duck.webp',
        title: 'DUCK',
        size: 'l',
        at: 'right',
        alt: 'A couple in black evening clothes sit on a white sofa by a wall of glass at dusk; the floor of the flat is a dark pond with reeds and black swans.',
      },
      {
        ...P,
        src: '/works/940pm/glacier.webp',
        title: 'GLACIER',
        size: 'm',
        at: 'left',
        alt: 'Diners in evening dress at a long stone table on a wet terrace at night; a wall of glacier ice breaks over the table against the city skyline.',
      },
      {
        ...P,
        src: '/works/940pm/green.webp',
        title: 'GREEN',
        size: 'l',
        at: 'right',
        alt: 'A figure in a cream suit holding a black briefcase waits in a stone elevator hall; the open elevator doors frame a dense, lit jungle.',
      },
      {
        ...P,
        src: '/works/940pm/meeting.webp',
        title: 'MEETING',
        size: 'm',
        at: 'third',
        alt: 'A man in a black suit stands alone in a boardroom flooded ankle-deep, beside a long white table and glass chairs, the night skyline behind him.',
      },
      {
        ...P,
        src: '/works/940pm/ocean.webp',
        title: 'OCEAN',
        size: 'l',
        at: 'left',
        alt: 'A man in a white shirt lies back in an open vintage silver car in an underground car park whose floor is beach sand, rocks and dune grass.',
      },
    ],
  },
];
