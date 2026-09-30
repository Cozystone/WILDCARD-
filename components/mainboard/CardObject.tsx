'use client';

import { useEffect, useRef } from 'react';
import Wordmark from '@/components/Wordmark';

/**
 * The card as the object it is: an ID-1 card, black, the wordmark, the chip,
 * the holder's name and number, a state in small type — tilted in the light,
 * and a few degrees more toward a pointer. CSS, no 3D library: the record
 * must not wait for WebGL.
 */
export default function CardObject({
  name,
  number,
  state,
  still = false,
  className,
}: {
  name: string | null;
  number: string;
  state: string;
  /** No turning toward the pointer (a list of cards). */
  still?: boolean;
  className?: string;
}) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = card.current;
    if (!el || still) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty('--ry', `${-17 + x * 12}deg`);
      el.style.setProperty('--rx', `${9 - y * 9}deg`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [still]);

  return (
    <figure className={`rec-card-stage${className ? ` ${className}` : ''}`} aria-label={`WILDCARD* — ${name ?? ''}, ${number}, ${state}`}>
      <div className="rec-card-shadow" aria-hidden="true" />
      <div ref={card} className="rec-card" aria-hidden="true">
        <div className="rec-card-face">
          <Wordmark className="rec-card-mark" />
          <span className="rec-card-chip" />
          <span className="rec-card-state">{state}</span>
          <span className="rec-card-holder">{(name ?? '').toUpperCase()}</span>
          <span className="rec-card-number">{number}</span>
        </div>
      </div>
    </figure>
  );
}
