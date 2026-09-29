'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Wordmark from '@/components/Wordmark';
import { access } from '@/lib/records/access';
import { RECORD as R } from '@/lib/records/copy';
import { STAR } from '@/lib/records/star';
import {
  CLEARANCE,
  CLEARANCES,
  addressLabel,
  dateLabel,
  recordLabel,
  versionLabel,
  type HolderRecord,
  type IdentityVersion,
} from '@/lib/records/types';

/**
 * The record — the holder's own space past the terminal, where the site's
 * * leads once a record exists. Two looks to choose between (2026-09-30):
 *
 *   editorial (default)  the white page of the first screen, grown: the
 *                        statement large, the card beside it as an object,
 *                        and, below the fold, the record as a form sheet,
 *                        the card's readings, the versions.
 *   dossier (?look=dossier)  the same record as the agency's own form, its
 *                        heading struck out and overwritten by WILDCARD*, a
 *                        rubber stamp for the clearance, typed fields.
 *
 * Either way it never says dashboard, profile or settings: RECORD, CARD,
 * VERSIONS. The four corners hold it — the record number, the version, the
 * * home to the city, and the session's door. Only a named record gets
 * here; anyone else goes to the terminal, which knows what to say to them.
 */

type Look = 'editorial' | 'dossier';
type Data = { rec: HolderRecord; versions: IdentityVersion[]; look: Look };

/** The WILDCARD* asterisk. */
export function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={STAR.viewBox} aria-hidden="true" focusable="false">
      <path d={STAR.path} />
    </svg>
  );
}

const firstLine = (s: string) => s.split('\n')[0];

export default function Record() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [reading, setReading] = useState<IdentityVersion | null>(null);
  const [menu, setMenu] = useState(false);
  const menuId = useId();

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await access.record();
      if (!live) return;
      if (!r.ok || !r.value || !r.value.displayName || r.value.status === 'suspended') {
        router.replace('/terminal');
        return;
      }
      const v = await access.versions();
      if (!live) return;
      const look: Look = new URLSearchParams(window.location.search).get('look') === 'dossier' ? 'dossier' : 'editorial';
      setData({ rec: r.value, versions: v.ok ? v.value : [], look });
    })();
    return () => {
      live = false;
    };
  }, [router]);

  // Self-issuance: the form is being redrawn — until it is, its own page says so.
  const issue = () => router.push('/issue');

  const close = async () => {
    await access.close();
    router.replace('/');
  };

  if (!data) return <main className="record" aria-label={R.label} aria-busy="true" />;

  const { rec, versions, look } = data;
  const latest = versions[0] ?? null;

  const frame = (children: ReactNode) => (
    <main className="record" data-look={look} aria-label={R.label}>
      <header className="record-head">
        <p className="record-corner">{recordLabel(rec.recordNumber)}</p>
        <nav className="record-nav" aria-label="Record">
          {R.nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <p className="record-corner record-corner-end">{versionLabel(latest ? latest.number : 1)}</p>
      </header>

      {children}

      <Link href="/" className="record-star" aria-label={R.home}>
        <Star />
      </Link>
      <div className="record-menu">
        {menu ? (
          <button id={menuId} type="button" className="record-menu-item" onClick={() => void close()}>
            {R.close}
          </button>
        ) : null}
        <button type="button" className="record-menu-toggle" aria-expanded={menu} aria-controls={menuId} onClick={() => setMenu((m) => !m)}>
          {R.session}
        </button>
      </div>
    </main>
  );

  if (reading) {
    return frame(
      <section className="rec-reading" aria-label={versionLabel(reading.number)}>
        <p className="rec-label">
          {versionLabel(reading.number)} · {R.written} {dateLabel(reading.createdAt)}
        </p>
        <blockquote className="rec-reading-text">{reading.statement}</blockquote>
        <div className="rec-actions">
          <button type="button" className="rec-action" onClick={() => setReading(null)}>
            {R.back}
          </button>
          <button type="button" className="rec-action" onClick={issue}>
            {R.rewrite}
          </button>
        </div>
      </section>,
    );
  }

  const name = (rec.displayName ?? '').toUpperCase();
  const actions = latest ? (
    <>
      <button type="button" className="rec-action" onClick={() => setReading(latest)}>
        {R.view}
      </button>
      <button type="button" className="rec-action" onClick={issue}>
        {R.rewrite}
      </button>
    </>
  ) : (
    <button type="button" className="rec-action rec-action-lead" onClick={issue}>
      {R.begin}
    </button>
  );

  if (look === 'dossier') return frame(<Dossier rec={rec} name={name} versions={versions} actions={actions} />);

  const statement = latest ? R.left : R.nothing;
  const at = CLEARANCES.indexOf(rec.clearance);

  return frame(
    <>
      <section className="rec-hero">
        <div className="rec-hero-text">
          <h1 className="rec-statement">
            {statement[0]}
            <br />
            {statement[1]}
          </h1>
          {latest ? <blockquote className="rec-quote">{latest.statement}</blockquote> : null}
          <p className="rec-holderline">
            <span className="rec-key">{R.fields.holder}</span> {name}
            <span className="rec-dot" aria-hidden="true">
              ·
            </span>
            <span className="rec-key">{R.fields.clearance}</span> {CLEARANCE[rec.clearance]}
          </p>
          <div className="rec-actions">{actions}</div>
        </div>
        <CardObject rec={rec} name={name} />
      </section>

      <section id="record" className="rec-section" aria-labelledby="rec-record">
        <p id="rec-record" className="rec-label">
          RECORD
        </p>
        <dl className="rec-fields">
          <Field n="01" label={R.fields.holder} value={name} />
          <Field n="02" label={R.fields.number} value={recordLabel(rec.recordNumber)} />
          <div className="rec-field rec-field-wide">
            <dt>
              <span className="rec-n">03</span> {R.fields.clearance}
            </dt>
            <dd>
              <ol className="rec-track">
                {CLEARANCES.map((c, i) => (
                  <li key={c} data-at={i < at ? 'past' : i === at ? 'now' : 'next'} aria-current={i === at ? 'step' : undefined}>
                    {CLEARANCE[c]}
                  </li>
                ))}
              </ol>
            </dd>
          </div>
          <Field n="04" label={R.fields.status} value={R.status[rec.status]} />
          <Field n="05" label={R.fields.opened} value={dateLabel(rec.openedAt)} />
          <Field n="06" label={R.fields.address} value={addressLabel(rec.address)} />
        </dl>
      </section>

      <section id="card" className="rec-section" aria-labelledby="rec-card">
        <p id="rec-card" className="rec-label">
          {R.card.title}
        </p>
        <p className="rec-big">{rec.clearance === 'issued' ? CLEARANCE.issued + '.' : R.card.none}</p>
        <p className="rec-note">{R.card.how}</p>
        <ol className="rec-readings">
          {R.card.readings.map(([key, title]) => (
            <li key={key} className="rec-reading-slot">
              <span className="rec-reading-key">{key}</span>
              <span className="rec-reading-title">{title}</span>
              <span className="rec-reading-state">{R.card.unread}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="versions" className="rec-section rec-section-last" aria-labelledby="rec-versions">
        <p id="rec-versions" className="rec-label">
          {R.versions.title}
        </p>
        {versions.length ? (
          <ol className="rec-version-list">
            {versions.map((v) => (
              <li key={v.number}>
                <button type="button" className="rec-version" onClick={() => setReading(v)}>
                  <span className="rec-version-n">{versionLabel(v.number)}</span>
                  <span className="rec-version-date">{dateLabel(v.createdAt)}</span>
                  <span className="rec-version-first">{firstLine(v.statement)}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rec-big rec-muted">{R.versions.none}</p>
        )}
        <p className="rec-sign">{R.sign}</p>
      </section>
    </>,
  );
}

function Field({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <div className="rec-field">
      <dt>
        <span className="rec-n">{n}</span> {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

/** The card, as the object it will be: black, the mark, the chip, the
 *  holder's name and number; tilted in the light, and a few degrees more
 *  toward a pointer. */
function CardObject({ rec, name }: { rec: HolderRecord; name: string }) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = card.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty('--ry', `${-17 + x * 12}deg`);
      el.style.setProperty('--rx', `${9 - y * 9}deg`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <figure className="rec-card-stage" aria-label={`The card — ${name}, ${recordLabel(rec.recordNumber)}, ${CLEARANCE[rec.clearance]}`}>
      <div className="rec-card-shadow" aria-hidden="true" />
      <div ref={card} className="rec-card" aria-hidden="true">
        <div className="rec-card-face">
          <Wordmark className="rec-card-mark" />
          <span className="rec-card-chip" />
          <span className="rec-card-state">{rec.clearance === 'issued' ? '' : CLEARANCE[rec.clearance]}</span>
          <span className="rec-card-holder">{name}</span>
          <span className="rec-card-number">{recordLabel(rec.recordNumber)}</span>
        </div>
      </div>
    </figure>
  );
}

/** Look B: the agency's own form, overwritten. */
function Dossier({ rec, name, versions, actions }: { rec: HolderRecord; name: string; versions: IdentityVersion[]; actions: ReactNode }) {
  const D = R.dossier;
  const latest = versions[0] ?? null;
  return (
    <>
      <article className="dos-sheet" aria-label={D.title}>
        <header className="dos-top">
          <p className="dos-agency">
            <span>{D.agency}</span>
          </p>
          <h1 className="dos-title">{D.title}</h1>
          <p className="dos-form">{D.form}</p>
        </header>

        <div id="record" className="dos-grid">
          <div className="dos-likeness">
            <span>{D.likeness}</span>
          </div>
          <DosCell n="01" label={R.fields.holder} value={name} wide />
          <DosCell n="02" label={R.fields.number} value={recordLabel(rec.recordNumber)} />
          <DosCell n="03" label={R.fields.clearance} value={CLEARANCE[rec.clearance]} />
          <DosCell n="04" label={R.fields.status} value={R.status[rec.status]} />
          <DosCell n="05" label={R.fields.opened} value={dateLabel(rec.openedAt)} />
          <DosCell n="06" label={R.fields.address} value={addressLabel(rec.address)} wide />
        </div>

        <p className="dos-stamp" aria-hidden="true">
          {CLEARANCE[rec.clearance]}
        </p>

        <section className="dos-box" aria-labelledby="dos-remarks">
          <p id="dos-remarks" className="dos-label">
            07 {D.remarks}
          </p>
          <p className="dos-remark">{latest ? latest.statement : `${R.nothing[0]} ${R.nothing[1]}`}</p>
        </section>

        <section id="card" className="dos-box" aria-labelledby="dos-card">
          <p id="dos-card" className="dos-label">
            08 {D.issuance}
          </p>
          <p className="dos-line">{rec.clearance === 'issued' ? CLEARANCE.issued + '.' : R.card.none}</p>
          <ul className="dos-checks">
            {R.card.readings.map(([key, title]) => (
              <li key={key}>
                <span className="dos-check" aria-hidden="true" /> {key} — {title}
              </li>
            ))}
          </ul>
        </section>

        <section id="versions" className="dos-box" aria-labelledby="dos-amend">
          <p id="dos-amend" className="dos-label">
            09 {D.amendments}
          </p>
          {versions.length ? (
            <ol className="dos-amendments">
              {versions.map((v) => (
                <li key={v.number}>
                  {versionLabel(v.number)} · {dateLabel(v.createdAt)} · {firstLine(v.statement)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="dos-line">{R.versions.none}</p>
          )}
        </section>

        <footer className="dos-hand">
          <span className="dos-hand-line" aria-hidden="true" />
          <p>{D.hand}</p>
        </footer>
      </article>
      <div className="rec-actions dos-actions">{actions}</div>
    </>
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
