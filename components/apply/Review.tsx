'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Application } from '@/lib/apply/model';
import { getStore } from '@/lib/apply/store';

const MAP = [
  ['energy', 'ENERGY'],
  ['tension', 'TENSION'],
  ['material', 'MATERIAL'],
  ['color', 'COLOR'],
  ['spatial', 'SPATIAL'],
  ['recurringTrace', 'RECURRING TRACE'],
  ['aversion', 'AVERSION'],
  ['currentState', 'CURRENT STATE'],
  ['designQuestion', 'DESIGN QUESTION'],
] as const;

/**
 * The studio's view of what has been filed on this device: the record as
 * it is, and the PORTRAIT MAP the studio will fill — empty, and never the
 * applicant's to see. Developer-plain on purpose; a dashboard is later.
 * Files are keys into the private store; the JSON never carries them.
 */
export default function Review() {
  const [apps, setApps] = useState<Application[]>([]);
  const [draft, setDraft] = useState<Application | null>(null);

  useEffect(() => {
    const store = getStore();
    store.list().then(setApps).catch(() => {});
    store.load().then(setDraft).catch(() => {});
  }, []);

  const download = (app: Application) => {
    const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.applicationNumber ?? app.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tty tty-review">
      <Link href="/apply" className="tty-close">
        CLOSE
      </Link>
      <main className="tty-main tty-main-one">
        <div className="tty-col">
          <p className="tty-label">W* STUDIO · INTERNAL · THIS DEVICE</p>
          <h1 className="tty-title">APPLICATIONS</h1>
          {draft ? (
            <section className="tty-review-item">
              <p className="tty-label">DRAFT · SECTION {String(draft.section).padStart(2, '0')} · {draft.updatedAt}</p>
              <p>{draft.author.preferredName || draft.author.name || '—'}</p>
            </section>
          ) : null}
          {apps.length === 0 ? <p className="tty-copy">NOTHING FILED.</p> : null}
          {apps.map((app) => (
            <section key={app.id} className="tty-review-item">
              <p className="tty-label">
                {app.applicationNumber} · {app.status.toUpperCase()} · {app.submittedAt}
              </p>
              <p>
                {app.author.preferredName} ({app.author.name}) · {app.author.city}, {app.author.country} · {app.author.email}
              </p>
              <dl className="tty-map">
                {MAP.map(([key, label]) => (
                  <div key={key}>
                    <dt className="tty-label">{label}</dt>
                    <dd>{app.portraitMap?.[key] || '—'}</dd>
                  </div>
                ))}
              </dl>
              <p className="tty-label">INTERPRETATIONS: A — SELF · B — MIRROR · C — WILDCARD · (W* STUDIO CHOICE) · {app.interpretations.length ? 'READY' : 'NOT YET'}</p>
              <details>
                <summary className="tty-btn tty-btn-small">[ RECORD ]</summary>
                <pre className="tty-json">{JSON.stringify(app, null, 2)}</pre>
              </details>
              <button type="button" className="tty-btn tty-btn-small" onClick={() => download(app)}>
                [ DOWNLOAD JSON ]
              </button>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
