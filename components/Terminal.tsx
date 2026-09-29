'use client';

import { useEffect, useRef, useState } from 'react';

export type Typed = {
  /** The screen's lines, as far as they have been typed. */
  shown: string[];
  /** Nothing typed yet on this screen (it has just cleared). */
  blank: boolean;
  /** The last character of the last screen is on the glass. */
  done: boolean;
  /** Not typing at this moment: the cursor blinks. */
  idle: boolean;
  /** Which screen, for keys. */
  screen: number;
};

/**
 * The typing, as the film's opening does it: screens whose lines type in
 * order, one character at a time, each line after a pause; a screen holds
 * (`holds`, seconds), then clears all at once, the cursor back at the top
 * left on an empty screen for a beat, and the next screen types. After the
 * last screen has held, `onDone`; as its last character lands, `onTyped`.
 * The typing has a little unevenness to it — a comma or a full stop takes
 * longer — because a metronome would give it away.
 *
 * Shared by the DOM terminal (below) and the pixel screen on the Macintosh
 * (components/PixelScreen.tsx): they differ only in how they draw it.
 */
export function useTyping({
  screens,
  holds = [],
  active,
  delay,
  cps,
  onDone,
  onTyped,
}: {
  screens: readonly (readonly string[])[];
  holds?: readonly number[];
  active: boolean;
  delay: number;
  cps: number;
  onDone?: () => void;
  onTyped?: () => void;
}): Typed {
  const [typed, setTyped] = useState({ screen: 0, line: 0, chars: 0, done: false, blank: false });
  const done = useRef(onDone);
  done.current = onDone;
  const typedOut = useRef(onTyped);
  typedOut.current = onTyped;
  const pages = useRef(screens);
  pages.current = screens;

  useEffect(() => {
    if (!active) {
      setTyped({ screen: 0, line: 0, chars: 0, done: false, blank: false });
      return;
    }
    const all = pages.current;
    let screen = 0;
    let line = 0;
    let chars = 0;
    let t = 0;
    const beat = 1000 / cps;
    const tick = () => {
      const page = all[screen];
      const text = page[line] ?? '';
      if (chars < text.length) {
        chars += 1;
        const ch = text[chars - 1];
        const lastOfAll = screen === all.length - 1 && line === page.length - 1 && chars === text.length;
        setTyped({ screen, line, chars, done: lastOfAll, blank: false });
        if (chars === text.length) {
          if (line + 1 < page.length) {
            t = window.setTimeout(() => {
              line += 1;
              chars = 0;
              setTyped({ screen, line, chars, done: false, blank: false });
              t = window.setTimeout(tick, beat * 3);
            }, 1100);
          } else if (screen + 1 < all.length) {
            t = window.setTimeout(() => {
              screen += 1;
              line = 0;
              chars = 0;
              setTyped({ screen, line, chars, done: false, blank: true });
              t = window.setTimeout(tick, 650);
            }, (holds[screen] ?? 2.4) * 1000);
          } else {
            typedOut.current?.();
            t = window.setTimeout(() => done.current?.(), (holds[screen] ?? 2.4) * 1000);
          }
          return;
        }
        const pause = ch === ',' ? 2.6 : ch === '.' ? 2.2 : 1;
        t = window.setTimeout(tick, beat * pause * (0.75 + Math.random() * 0.5));
      }
    };
    t = window.setTimeout(tick, delay * 1000);
    return () => window.clearTimeout(t);
    // The screens and holds are constants, read once per run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delay, cps]);

  const page = screens[typed.screen] ?? [];
  const current = page[typed.line] ?? '';
  const shown = page.slice(0, typed.line + 1).map((text, i) => (i < typed.line ? text : text.slice(0, typed.chars)));
  return {
    shown,
    blank: typed.blank,
    done: typed.done,
    idle: typed.done || typed.blank || typed.chars === 0 || typed.chars === current.length,
    screen: typed.screen,
  };
}

/**
 * The typing as type on the page: green on black in a typewriter face,
 * behind a block cursor. Used by the application's boot (/apply). `lines`
 * is one screen; `screens` several. Anything to show after the last line
 * (a choice, a number) goes in as children, once the last line is typed.
 */
export default function Terminal({
  lines,
  screens,
  holds = [],
  active,
  delay,
  cps,
  onDone,
  onTyped,
  children,
  className = 'terminal',
}: {
  lines?: readonly string[];
  screens?: readonly (readonly string[])[];
  holds?: readonly number[];
  active: boolean;
  delay: number;
  cps: number;
  onDone?: () => void;
  onTyped?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const pages = screens ?? (lines ? [lines] : [[]]);
  const t = useTyping({ screens: pages, holds, active, delay, cps, onDone, onTyped });
  if (!active) return null;
  return (
    <div className={className} aria-live="polite">
      {t.shown.map((text, i) => (
        <div key={`${t.screen}-${i}`} className="terminal-line">
          {text}
          {i === t.shown.length - 1 ? <span className="terminal-cursor" data-idle={t.idle ? 'yes' : 'no'} aria-hidden="true" /> : null}
        </div>
      ))}
      {t.done ? children : null}
    </div>
  );
}
