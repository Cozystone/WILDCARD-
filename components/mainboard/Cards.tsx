'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CARD, CARD_STATUS, PRODUCTION, PROVENANCE } from '@/lib/mainboard/copy';
import { markLost, publicUrl } from '@/lib/mainboard/data';
import { two, yearLabel } from '@/lib/mainboard/format';
import type { Card } from '@/lib/mainboard/types';
import { recordLabel } from '@/lib/records/types';
import CardObject from './CardObject';
import { useMine } from './Frame';
import Qr from './Qr';

/**
 * CARD — every physical issue of the record, the latest first: the object,
 * its issue and year, its standing, who drew it. The design of an issue
 * never changes; its * always opens the record as it is now. Each can show
 * its address and QR, open the version it was issued at, or be marked lost
 * — its * stops answering, nothing else is touched. A new card is a new
 * portrait, not a replacement.
 */
export default function Cards() {
  const { mine, refresh } = useMine();
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lose = async (card: Card) => {
    setBusy(true);
    const r = await markLost(card.id);
    setBusy(false);
    setAsking(null);
    if (r.ok) await refresh();
  };

  if (!mine.cards.length) {
    const address = publicUrl(mine.publicId);
    return (
      <section className="mb-page">
        <header className="mb-page-head">
          <h1 className="mb-statement">
            {CARD.none[0]}
            <br />
            {CARD.none[1]}
          </h1>
          <p className="mb-note">{CARD.noneNote}</p>
          <p className="mb-actions">
            <Link className="mb-action mb-action-lead" href="/create">
              {CARD.begin}
            </Link>
          </p>
        </header>
        <Address title={CARD.recordAddress} note={CARD.recordNote} address={address} />
      </section>
    );
  }

  return (
    <section className="mb-page">
      <header className="mb-page-head">
        <h1 className="mb-title">{CARD.title}</h1>
      </header>
      <ol className="mb-issues">
        {mine.cards.map((c) => {
          const live = c.status === 'active' && c.token;
          return (
            <li key={c.id} className="mb-issue" data-status={c.status}>
              <CardObject name={mine.name} number={recordLabel(mine.recordNumber)} state={CARD.issue(c.issueNumber)} still className="mb-issue-card" />
              <div className="mb-issue-text">
                <p className="mb-issue-title">{CARD.issue(c.issueNumber)}</p>
                <p className="mb-issue-meta">
                  <span>{yearLabel(c.issuedAt ?? c.createdAt)}</span>
                  <span>{c.status === 'active' ? PRODUCTION[c.production] : CARD_STATUS[c.status]}</span>
                  <span>{PROVENANCE[c.provenance]}</span>
                </p>
                <p className="mb-actions">
                  {c.versionAtIssue ? (
                    <Link className="mb-action" href={`/record/versions/${c.versionAtIssue}`}>
                      {CARD.viewVersion} {two(c.versionAtIssue)}
                    </Link>
                  ) : null}
                  {live ? (
                    <button type="button" className="mb-action" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>
                      {open === c.id ? CARD.hide : CARD.manage}
                    </button>
                  ) : null}
                  {live ? (
                    <button type="button" className="mb-action" onClick={() => setAsking(c.id)}>
                      {CARD.lost}
                    </button>
                  ) : null}
                  <Link className="mb-action" href="/create/studio">
                    {CARD.portrait}
                  </Link>
                </p>
                {asking === c.id ? (
                  <p className="mb-ask" role="alertdialog" aria-label={CARD.lostAsk(c.issueNumber)}>
                    <span>{CARD.lostAsk(c.issueNumber)}</span>
                    <button type="button" className="mb-action mb-action-lead" disabled={busy} onClick={() => void lose(c)}>
                      {CARD.lostYes}
                    </button>
                    <button type="button" className="mb-action" onClick={() => setAsking(null)}>
                      {CARD.lostNo}
                    </button>
                  </p>
                ) : null}
                {open === c.id && c.token ? <Address title={CARD.tap} note={CARD.tapNote} address={publicUrl(c.token)} /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Address({ title, note, address }: { title: string; note: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* it is on the screen */
    }
  };
  return (
    <div className="mb-address">
      <Qr value={address} label={`QR — ${address}`} />
      <div className="mb-address-text">
        <p className="mb-label">{title}</p>
        <code className="mb-code">{address}</code>
        <p className="mb-hint">{note}</p>
        <p className="mb-actions">
          <button type="button" className="mb-action" onClick={() => void copy()}>
            {copied ? CARD.copied : CARD.copy}
          </button>
          <a className="mb-action" href={address} target="_blank" rel="noreferrer">
            ↗
          </a>
        </p>
      </div>
    </div>
  );
}
