'use client';

import Link from 'next/link';
import { CARD, HOME } from '@/lib/mainboard/copy';
import { CLEARANCE, recordLabel } from '@/lib/records/types';
import CardObject from './CardObject';
import { useMine } from './Frame';

/**
 * RECORD — the first moment past the terminal: how the holder left
 * themselves, large; what they said, under it; two things to do. And the
 * card, as an object, if there is one to show (or the record's standing, if
 * not). Nothing else: no numbers, no widgets.
 */
export default function Home() {
  const { mine } = useMine();
  const v = mine.current;
  const lines = v ? HOME.left : HOME.nothing;
  const card = mine.cards.find((c) => c.status === 'active') ?? mine.cards[0] ?? null;

  return (
    <section className="mb-home">
      <div className="mb-home-text">
        <h1 className="mb-statement">
          {lines[0]}
          <br />
          {lines[1]}
        </h1>
        {v?.statement ? <p className="mb-now">{v.statement}</p> : null}
        <div className="mb-actions">
          {v ? (
            <>
              <Link className="mb-action" href={`/record/versions/${v.number}`}>
                {HOME.view}
              </Link>
              <Link className="mb-action" href="/record/rewrite">
                {HOME.rewrite}
              </Link>
            </>
          ) : (
            <>
              <Link className="mb-action mb-action-lead" href="/record/rewrite">
                {HOME.first}
              </Link>
              <Link className="mb-action" href="/create">
                {HOME.begin}
              </Link>
            </>
          )}
        </div>
      </div>

      <CardObject
        name={mine.name}
        number={recordLabel(mine.recordNumber)}
        state={card ? CARD.issue(card.issueNumber) : CLEARANCE[mine.clearance]}
        className="mb-home-card"
      />

      <p className="mb-home-foot">
        <a className="mb-small" href={`/w/${mine.publicId}`} target="_blank" rel="noreferrer">
          {HOME.publicView} ↗
        </a>
        <Link className="mb-small" href="/record/edit">
          {HOME.edit}
        </Link>
      </p>
    </section>
  );
}
