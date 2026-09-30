import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Star from '@/components/mainboard/Star';
import { CREATE } from '@/lib/mainboard/copy';

export const metadata: Metadata = {
  title: 'SELF-ISSUANCE — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
};

/**
 * /create — the two ways to a card, side by side and equal: CREATE MYSELF
 * (self-issued, the holder's artwork) or LET WILDCARD* SEE ME (the W*
 * portrait). Both end in the same record.
 */
export default function CreatePage() {
  const paths = [
    { href: '/create/self', ...CREATE.self },
    { href: '/create/studio', ...CREATE.studio },
  ];
  return (
    <div className="mb">
      <main className="mb-plate">
        <div className="mb-body">
          <section className="cr">
            <h1 className="mb-statement">
              {CREATE.ask[0]}
              <br />
              {CREATE.ask[1]}
            </h1>
            <ol className="cr-paths">
              {paths.map((p, i) => (
                <li key={p.href}>
                  <Link className="cr-path" href={p.href}>
                    <span className="mb-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="cr-path-title">{p.title}</span>
                    <span className="cr-path-line">{p.line}</span>
                    <span className="mb-label">
                      {p.kind} · {p.provenance}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="mb-note">{CREATE.same}</p>
            <p className="mb-actions">
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
