import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ISSUE } from '@/lib/records/copy';

export const metadata: Metadata = {
  title: 'SELF-ISSUANCE — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f4f2ed',
};

/** /issue — where BEGIN SELF-ISSUANCE goes while the form is being redrawn
 *  (the old FORM W*–01 at /apply is not linked from anywhere). */
export default function IssuePage() {
  return (
    <main className="record issue" aria-label={ISSUE.label}>
      <section className="issue-body">
        <p className="rec-label">{ISSUE.label}</p>
        <h1 className="rec-statement">
          {ISSUE.lines[0]}
          <br />
          {ISSUE.lines[1]}
        </h1>
        <p className="rec-note">{ISSUE.note}</p>
        <div className="rec-actions">
          <Link href="/record" className="rec-action">
            {ISSUE.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
