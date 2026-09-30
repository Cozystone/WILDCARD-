import type { Metadata } from 'next';
import Link from 'next/link';
import Star from '@/components/mainboard/Star';
import { CREATE } from '@/lib/mainboard/copy';

export const metadata: Metadata = {
  title: 'CREATE MYSELF — WILDCARD*',
  robots: { index: false, follow: false },
};

/** /create/self — the self-issuance desk, being built (see docs/MAINBOARD.md:
 *  level 1 — front and back artwork, crop, text, a true print preview; the
 *  invariant layer — *, serial, micro mark — always in place). */
export default function CreateSelfPage() {
  return (
    <div className="mb">
      <main className="mb-plate">
        <div className="mb-body">
          <section className="cr">
            <p className="mb-label">
              {CREATE.self.kind} · {CREATE.soon}
            </p>
            <h1 className="mb-statement">{CREATE.self.title}.</h1>
            <p className="mb-note">{CREATE.selfSoon}</p>
            <p className="mb-label">{CREATE.self.provenance}</p>
            <p className="mb-actions">
              <Link className="mb-action" href="/create">
                ←
              </Link>
              <Link className="mb-action" href="/record">
                {CREATE.back}
              </Link>
            </p>
          </section>
        </div>
        <Link href="/" className="mb-star" aria-label="The city">
          <Star />
        </Link>
      </main>
    </div>
  );
}
