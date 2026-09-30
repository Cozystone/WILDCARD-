'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CARD, DOSSIER, PROVENANCE, SECTION, VERSIONS, VISIBILITY } from '@/lib/mainboard/copy';
import { loadVersion } from '@/lib/mainboard/data';
import { dayLabel, two } from '@/lib/mainboard/format';
import type { Card, Version } from '@/lib/mainboard/types';
import { recordLabel } from '@/lib/records/types';
import { useMine } from './Frame';

/**
 * One version, reconstructed as the record it was — the dossier the author
 * chose (2026-09-30): the agency's form, its heading struck out and
 * overwritten by WILDCARD*, typed entries, a stamp — CURRENT, or FILED on
 * the day a rewrite superseded it. What it said, what it was made of, the
 * cards issued while it was current.
 */
export default function VersionDoc({ n }: { n: number }) {
  const { mine } = useMine();
  const [data, setData] = useState<{ version: Version; cards: Card[] } | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    loadVersion(n).then((r) => {
      if (live) setData(r.ok ? r.value : null);
    });
    return () => {
      live = false;
    };
  }, [n]);

  if (data === undefined) return <section className="mb-page" aria-busy="true" />;
  if (data === null)
    return (
      <section className="mb-page">
        <p className="mb-statement mb-muted">{VERSIONS.missing}</p>
        <p className="mb-actions">
          <Link className="mb-action" href="/record/versions">
            {VERSIONS.back}
          </Link>
        </p>
      </section>
    );

  const { version: v, cards } = data;
  const standing = v.frozenAt ? `${VERSIONS.filed} ${dayLabel(v.frozenAt)}` : VERSIONS.current;

  return (
    <section className="mb-page mb-page-doc">
      <p className="mb-actions mb-actions-top">
        <Link className="mb-action" href="/record/versions">
          ← {VERSIONS.back}
        </Link>
      </p>
      <article className="dos-sheet" aria-label={`VERSION ${two(v.number)}`}>
        <header className="dos-top">
          <p className="dos-agency">
            <span>{DOSSIER.agency}</span>
          </p>
          <h1 className="dos-title">{DOSSIER.title}</h1>
          <p className="dos-form">{DOSSIER.form}</p>
        </header>

        <div className="dos-grid">
          <div className="dos-likeness">
            <span>{DOSSIER.likeness}</span>
          </div>
          <DosCell n="01" label={DOSSIER.holder} value={(mine.name ?? '').toUpperCase()} wide />
          <DosCell n="02" label={DOSSIER.number} value={recordLabel(mine.recordNumber)} />
          <DosCell n="03" label={DOSSIER.version} value={two(v.number)} />
          <DosCell n="04" label={DOSSIER.written} value={dayLabel(v.createdAt)} />
          <DosCell n="05" label={DOSSIER.standing} value={standing} />
          <DosCell n="06" label={DOSSIER.intro} value={v.intro || '—'} wide />
        </div>

        <p className="dos-stamp" aria-hidden="true">
          {v.frozenAt ? VERSIONS.filed : VERSIONS.current}
        </p>

        <section className="dos-box">
          <p className="dos-label">07 {DOSSIER.remarks}</p>
          <p className="dos-remark">{v.statement || '—'}</p>
          {v.uncertain ? <p className="dos-line dos-unsure">{VERSIONS.unsure}.</p> : null}
        </section>

        <section className="dos-box">
          <p className="dos-label">08 {DOSSIER.sections}</p>
          {v.sections.length ? (
            <dl className="dos-entries">
              {v.sections.map((s, i) => (
                <div key={i} className="dos-entry">
                  <dt>
                    {s.kind === 'custom' ? s.label : SECTION[s.kind]} <span className="dos-vis">[{VISIBILITY[s.visibility]}]</span>
                  </dt>
                  <dd>{s.body || '—'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="dos-line">{DOSSIER.noCards}</p>
          )}
        </section>

        <section className="dos-box">
          <p className="dos-label">09 {DOSSIER.cards}</p>
          {cards.length ? (
            <ul className="dos-amendments">
              {cards.map((c) => (
                <li key={c.id}>
                  {CARD.issue(c.issueNumber)} · {PROVENANCE[c.provenance]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="dos-line">{DOSSIER.noCards}</p>
          )}
        </section>

        <footer className="dos-hand">
          <span className="dos-hand-line" aria-hidden="true" />
          <p>{DOSSIER.hand}</p>
        </footer>
      </article>
    </section>
  );
}

function DosCell({ n, label, value, wide }: { n: string; label: string; value: string; wide?: boolean }) {
  return (
    <div className="dos-cell" data-wide={wide ? 'yes' : undefined}>
      <p className="dos-label">
        {n} {label}
      </p>
      <p className="dos-value">{value}</p>
    </div>
  );
}
