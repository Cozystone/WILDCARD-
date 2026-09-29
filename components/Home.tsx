import Hero from './Hero';
import { DEFAULT_NAV, DEFAULT_VARIANT, NAV, VARIANTS, type NavSet, type VariantKey } from '@/lib/hero';

/**
 * One screen: the city. Nothing to scroll to.
 *
 * The payphone at the foot of the picture plays the film over the page and
 * everything after it (components/Program.tsx). The gallery
 * (components/SelectedWorks.tsx, lib/works.ts, public/works/) is still in
 * the codebase, off the page.
 *
 * Every route renders this. They differ only in where the wordmark sits on
 * the picture (/a, /b, /c) and which navigation set is under it (/nav/1,
 * /nav/2); the home page is the defaults of both. The A · B · C switch is
 * off the page; the routes remain.
 */
export default function Home({ variant = DEFAULT_VARIANT, nav = DEFAULT_NAV }: { variant?: VariantKey; nav?: NavSet }) {
  return (
    <main>
      <Hero placement={VARIANTS[variant].placement} nav={NAV[nav]} />
    </main>
  );
}
