'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { S04 } from '@/lib/apply/copy';
import type { ScreeningDecision } from '@/lib/apply/model';
import { SCREENING, type ScreeningItem } from '@/lib/apply/screening';

/**
 * SECTION 04 — one image at a time, the whole of the viewport it can have,
 * and two words under it. KEEP or PASS; ← or →. The decision, its place in
 * the run and how long it took are recorded, and nothing is said about
 * them. The order of the run is the manifest's. A decision can be taken
 * back, one step. When the run is done, it says so and offers to run again.
 *
 * `items` is the manifest; a slot with no picture yet is a numbered plate.
 */
export default function Screening({
  decisions,
  onChange,
  items = SCREENING,
}: {
  decisions: ScreeningDecision[];
  onChange: (d: ScreeningDecision[]) => void;
  items?: readonly ScreeningItem[];
}) {
  const decided = new Set(decisions.map((d) => d.itemId));
  const index = items.findIndex((it) => !decided.has(it.id));
  const item = index >= 0 ? items[index] : null;
  const shownAt = useRef<number>(0);
  const [flash, setFlash] = useState<'keep' | 'pass' | null>(null);

  useEffect(() => {
    shownAt.current = performance.now();
  }, [item?.id]);

  const decide = useCallback(
    (decision: 'keep' | 'pass') => {
      if (!item) return;
      const ms = Math.round(performance.now() - shownAt.current);
      setFlash(decision);
      window.setTimeout(() => setFlash(null), 180);
      onChange([...decisions, { itemId: item.id, decision, order: decisions.length, ms }]);
    },
    [decisions, item, onChange],
  );

  const undo = useCallback(() => {
    if (decisions.length) onChange(decisions.slice(0, -1));
  }, [decisions, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') decide('keep');
      else if (e.key === 'ArrowLeft') decide('pass');
      else if (e.key === 'Backspace') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, undo]);

  if (!item) {
    return (
      <div className="tty-screening tty-screening-done">
        <p className="tty-lead">{S04.done}</p>
        <p className="tty-label">{S04.of(decisions.length, items.length)}</p>
        <button type="button" className="tty-btn tty-btn-small" onClick={() => onChange([])}>
          [ RUN AGAIN ]
        </button>
      </div>
    );
  }

  return (
    <div className="tty-screening" data-flash={flash ?? 'none'}>
      <p className="tty-lead">{S04.copy}</p>
      <figure className="tty-plate" aria-label={`Image ${index + 1} of ${items.length}`}>
        {item.src ? (
          <img src={item.src} alt="" draggable={false} />
        ) : (
          <div className="tty-plate-empty" aria-hidden="true">
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
        )}
      </figure>
      <div className="tty-screening-controls">
        <button type="button" className="tty-btn tty-btn-wide" onClick={() => decide('pass')}>
          {S04.pass}
        </button>
        <span className="tty-label">{S04.of(index + 1, items.length)}</span>
        <button type="button" className="tty-btn tty-btn-wide" onClick={() => decide('keep')}>
          {S04.keep}
        </button>
      </div>
      <div className="tty-screening-foot">
        <span className="tty-label tty-hide-touch">{S04.keys}</span>
        <button type="button" className="tty-btn tty-btn-small" onClick={undo} disabled={!decisions.length}>
          [ BACK ONE ]
        </button>
      </div>
    </div>
  );
}
