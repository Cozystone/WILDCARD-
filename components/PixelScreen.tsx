'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTyping } from './Terminal';

/** The Macintosh 128K's screen: 512 × 342 pixels, one bit each. */
export const RASTER = { w: 512, h: 342 };

/** The lit colour: the film's phosphor green (globals.css --color-phosphor). */
const PHOSPHOR = [158, 212, 180] as const;

/**
 * Type on the Macintosh's own screen, at the Macintosh's own resolution.
 *
 * The screen is 512 × 342 pixels, and that is what this draws into: a
 * canvas of exactly that size, the text set in a small typewriter face and
 * then thresholded, every pixel on or off, as a one-bit display has them.
 * The canvas is shown at the size of the raster on the glass without
 * smoothing, so each of its pixels is a square of light — and the CSS adds
 * what the tube adds: the green of the phosphor, its bloom, the scan lines
 * between the rows (components/Program.tsx, globals.css `.crt-raster`).
 *
 * `align` puts the text where the film's opening puts it (top left) or in
 * the middle, for the question of the pills. Children — the pills — sit in
 * the raster box under the text, once it has been typed.
 */
export default function PixelScreen({
  screens,
  holds,
  active,
  delay,
  cps,
  onDone,
  onTyped,
  align = 'top-left',
  children,
}: {
  screens: readonly (readonly string[])[];
  holds?: readonly number[];
  active: boolean;
  delay: number;
  cps: number;
  onDone?: () => void;
  onTyped?: () => void;
  align?: 'top-left' | 'centre';
  children?: ReactNode;
}) {
  const t = useTyping({ screens, holds, active, delay, cps, onDone, onTyped });
  const canvas = useRef<HTMLCanvasElement>(null);
  const [blink, setBlink] = useState(true);

  // The cursor blinks while it waits; it stands while it types.
  useEffect(() => {
    if (!active || !t.idle) {
      setBlink(true);
      return;
    }
    const id = window.setInterval(() => setBlink((b) => !b), 530);
    return () => window.clearInterval(id);
  }, [active, t.idle]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, RASTER.w, RASTER.h);
    if (!active) return;

    const size = 13;
    const lead = 20;
    ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    const widths = t.shown.map((line) => ctx.measureText(line).width);
    const blockH = t.shown.length * lead;
    const top = align === 'centre' ? Math.round(RASTER.h * 0.36 - blockH / 2) : Math.round(RASTER.h * 0.16);
    const lefts = widths.map((w) => (align === 'centre' ? Math.round((RASTER.w - w) / 2) : Math.round(RASTER.w * 0.08)));
    t.shown.forEach((line, i) => ctx.fillText(line, lefts[i], top + (i + 1) * lead - 6));

    // One bit: every pixel on or off, and the ones that are on are lit
    // phosphor.
    const img = ctx.getImageData(0, 0, RASTER.w, RASTER.h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const on = d[i + 3] > 118;
      d[i] = PHOSPHOR[0];
      d[i + 1] = PHOSPHOR[1];
      d[i + 2] = PHOSPHOR[2];
      d[i + 3] = on ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);

    // The block cursor, after the last character typed.
    ctx.fillStyle = `rgb(${PHOSPHOR.join(' ')})`;
    if (blink) {
      const i = Math.max(0, t.shown.length - 1);
      const x = (lefts[i] ?? Math.round(RASTER.w * 0.08)) + Math.ceil(widths[i] ?? 0) + 2;
      const y = top + i * lead + 4;
      ctx.fillRect(x, y, 8, 13);
    }
  }, [active, align, blink, t.shown]);

  return (
    <div className="crt-raster" data-align={align} aria-live="polite">
      <canvas ref={canvas} width={RASTER.w} height={RASTER.h} aria-hidden="true" />
      <p className="sr-only">{active ? t.shown.join(' ') : ''}</p>
      {active && t.done ? children : null}
    </div>
  );
}
