import Image from 'next/image';
import Program, { Phone } from './Program';
import RecordMark from './records/RecordMark';
import Question from './Question';
import Wordmark from './Wordmark';
import { DEFAULT_NAV, DEFAULT_VARIANT, HERO, NAV, VARIANTS, type LogoPlacement, type NavItem } from '@/lib/hero';
import { WORDMARK } from '@/lib/wordmark';

type Props = {
  /** Where the wordmark sits on the picture. */
  placement?: LogoPlacement;
  /** The navigation line under the picture. */
  nav?: readonly NavItem[];
};

/**
 * The screen: a photograph in a frame of ink, the wordmark on it, a payphone
 * at its foot, one line of small type under it. Nothing else — no sentence,
 * no explanation. The sentence comes after the film the phone plays.
 *
 * The picture is not full-bleed on purpose. Inset by `--frame` on every side
 * it reads as a print rather than a banner, and the frame's ink is what the
 * screen is made of, so the photograph keeps its own tone — no grade, no
 * vignette, only a scrim across its top so the type holds on the sky.
 *
 * The section is a two-row grid, picture over caption. The wordmark and the
 * phone are positioned against the picture, not in flow, so the mark's
 * placement can change (A / B / C, see globals.css) without the picture
 * moving a pixel. Both are sized against the picture too: a fixed share of
 * the photograph as drawn, so narrowing the window crops the scene around
 * them instead of shrinking them inside the scene. The aspect ratios that
 * arithmetic needs are passed down from the data, here.
 *
 * Program wraps the two rows so the phone, inside the plate, can start the
 * stage, which stands outside it (see Program.tsx).
 */
export default function Hero({ placement = VARIANTS[DEFAULT_VARIANT].placement, nav = NAV[DEFAULT_NAV] }: Props) {
  return (
    <section
      className="hero relative grid min-h-svh grid-rows-[1fr_auto] gap-[var(--frame)] bg-ink p-[var(--frame)] text-paper"
      data-placement={placement}
      style={{
        ['--mark-aspect' as string]: String(WORDMARK.aspect),
        ['--photo-aspect' as string]: String(HERO.image.width / HERO.image.height),
      }}
      aria-label={WORDMARK.text}
    >
      <Program question={<Question />}>
        <div className="hero-plate relative">
          {/* The picture and its scrim are clipped to their own box. The mark
              is not in it, so that in C it can ride the picture's top edge. */}
          <div className="hero-photo absolute inset-0 overflow-hidden">
            {/* `unoptimized`: the bytes in /public go out as they are. The
                optimizer's AVIF re-encode smooths film grain, and the grain is
                the point of this picture. 315 KB is the price; it is paid once. */}
            <Image
              src={HERO.image.src}
              alt={HERO.image.alt}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: HERO.image.position }}
            />
            <div className="hero-scrim pointer-events-none absolute inset-0" aria-hidden="true" />
          </div>

          <h1 className="hero-mark">
            <Wordmark />
          </h1>

          <Phone />

          {/* A holder's * — only for a browser with an issued record. */}
          <RecordMark />
        </div>

        {/* The caption line: the words. On a phone they take the width. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-[0.625rem] leading-none tracking-[0.14em] text-muted uppercase sm:text-[0.6875rem]">
          <nav aria-label="Site" className="basis-full sm:basis-auto">
            <ul className="hero-index flex flex-wrap items-baseline gap-y-2">
              {nav.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <a href={item.href} className="transition-colors duration-200 hover:text-paper focus-visible:text-paper">
                      {item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Program>
    </section>
  );
}
