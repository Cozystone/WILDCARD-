import type { Metadata } from 'next';
import Link from 'next/link';
import Star from '@/components/mainboard/Star';
import { CREATE } from '@/lib/mainboard/copy';

export const metadata: Metadata = {
  title: 'W* PORTRAIT — WILDCARD*',
  robots: { index: false, follow: false },
};

/** /create/studio — the W* portrait: the lead, and the form that carries
 *  the evidence, being rewritten (the old FORM W*–01 is not linked). */
export default function CreateStudioPage() {
  return (
    <div className="mb">
      <main className="mb-plate">
        <div className="mb-body">
          <section className="cr">
            <p className="mb-label">
              {CREATE.studio.kind} · {CREATE.soon}
            </p>
            <h1 className="mb-statement">
              {CREATE.studioLead[0]}
              <br />
              {CREATE.studioLead[1]}
              <br />
              {CREATE.studioLead[2]}
              <br />
              {CREATE.studioLead[3]}
            </h1>
            <p className="mb-note">{CREATE.studioSoon}</p>
            <p className="mb-label">{CREATE.studio.provenance}</p>
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
