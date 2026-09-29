import Image from 'next/image';
import Wordmark from './Wordmark';
import { WORKS } from '@/lib/works';

/**
 * Screen three: the gallery. A white wall straight after the black one, a
 * small label, and the first plate large right under it.
 *
 * Plates hang one at a time down the wall, each on one of three vertical
 * lines and at one of two heights (lib/works.ts), with a caption under its
 * left edge the way a label sits beside a print: number and title, then the
 * work and the year. No cards, no grid, nothing that moves.
 */
export default function SelectedWorks() {
  return (
    <section id="work" className="works" aria-labelledby="works-title">
      <h2 id="works-title" className="works-label caption-type">
        Selected works
      </h2>

      {WORKS.map((work) =>
        work.plates.map((plate, i) => (
          <figure
            key={plate.src}
            className="plate"
            data-size={plate.size}
            data-at={plate.at}
            style={{ ['--plate-ratio' as string]: String(plate.width / plate.height) }}
          >
            <div className="plate-body">
              {/* Served as exported, like the hero: the grain is the picture. */}
              <Image
                src={plate.src}
                alt={plate.alt}
                width={plate.width}
                height={plate.height}
                unoptimized
                className="plate-img"
              />
              <figcaption className="plate-caption caption-type">
                <span>
                  {String(i + 1).padStart(2, '0')}&ensp;{plate.title}
                </span>
                <span className="plate-work">
                  {work.title}, {work.year}
                </span>
              </figcaption>
            </div>
          </figure>
        )),
      )}

      <footer className="colophon caption-type">
        <Wordmark className="colophon-mark" />
        <span>© 2026</span>
      </footer>
    </section>
  );
}
