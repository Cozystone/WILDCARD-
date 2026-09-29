'use client';

import { useEffect, useRef } from 'react';

/**
 * The blue pill: a crash. An old web server's 404 on a blue screen, in a
 * font of pixels — drawn small on a canvas, every soft edge thresholded to
 * on or off, then scaled up without smoothing, so it is a picture of a low
 * resolution screen at any window size.
 *
 * And it is dead. Every key, click, touch, wheel and menu is swallowed
 * until the page is reloaded; the reload keys themselves are left alone,
 * and nothing can stop the browser's own button. The links are drawn, not
 * made: they look like a way out and are not.
 */
const LINES = {
  title: 'Error - 404',
  body: ['An error has occurred, to continue:', '', '* Return to our homepage.', '* Send us an e-mail about this error and try later.'],
  links: 'index  |  webmaster',
};

const BLUE = '#0000a8';
const GREY = '#a8a8a8';
const TEXT = '#d8d8f0';
const WHITE = '#f4f4ff';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = `  ${w}`;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function draw(canvas: HTMLCanvasElement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Two screen pixels to a pixel on most windows (three on very large
  // ones, one on a phone): coarse enough to be a low-resolution screen,
  // fine enough that twelve of them make a letter you can read.
  const px = vw < 700 ? 1 : vw < 1700 ? 2 : 3;
  const cw = Math.ceil(vw / px);
  const ch = Math.ceil(vh / px);
  canvas.width = cw;
  canvas.height = ch;
  canvas.style.width = `${cw * px}px`;
  canvas.style.height = `${ch * px}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Type on its own layer, thresholded, then laid on the blue.
  const ink = document.createElement('canvas');
  ink.width = cw;
  ink.height = ch;
  const t = ink.getContext('2d');
  if (!t) return;
  const fs = Math.max(9, Math.min(12, Math.floor(cw / 48)));
  const lh = Math.round(fs * 1.7);
  t.textBaseline = 'top';

  // The title in a grey box.
  t.font = `bold ${Math.round(fs * 1.9)}px "Courier New", Courier, monospace`;
  const tw = t.measureText(LINES.title).width;
  const th = Math.round(fs * 1.9);
  const bx = Math.round((cw - tw) / 2) - Math.round(fs * 0.9);
  const by = Math.round(ch * 0.22);
  const bw = Math.round(tw + fs * 1.8);
  const bh = Math.round(th + fs * 1.0);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = GREY;
  ctx.fillRect(bx, by, bw, bh);
  t.fillStyle = BLUE;
  t.fillText(LINES.title, bx + Math.round(fs * 0.9), by + Math.round(fs * 0.55));

  // The body, left-aligned in a block.
  t.font = `bold ${fs}px "Courier New", Courier, monospace`;
  const left = Math.max(Math.round(fs * 1.5), Math.round(cw * 0.23));
  const max = cw - left - Math.round(fs * 1.5);
  let y = by + bh + Math.round(lh * 2.2);
  t.fillStyle = TEXT;
  for (const text of LINES.body) {
    for (const line of wrap(t, text, max)) {
      t.fillText(line, left, y);
      y += lh;
    }
  }

  // The links, centred.
  y += Math.round(lh * 1.3);
  t.fillStyle = WHITE;
  const lw = t.measureText(LINES.links).width;
  t.fillText(LINES.links, Math.round((cw - lw) / 2), y);

  // On or off: no soft edges.
  const img = t.getImageData(0, 0, cw, ch);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
  t.putImageData(img, 0, 0);
  ctx.drawImage(ink, 0, 0);
}

export default function Error404() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    draw(c);
    const redraw = () => draw(c);
    window.addEventListener('resize', redraw);

    const reload = (e: KeyboardEvent) =>
      e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'));
    const swallow = (e: Event) => {
      if (e instanceof KeyboardEvent && reload(e)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const kinds = ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel', 'touchstart', 'touchmove', 'pointerdown', 'dragstart', 'selectstart'];
    kinds.forEach((k) => window.addEventListener(k, swallow, { capture: true, passive: false }));
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    (document.activeElement as HTMLElement | null)?.blur?.();

    return () => {
      window.removeEventListener('resize', redraw);
      kinds.forEach((k) => window.removeEventListener(k, swallow, { capture: true }));
      document.documentElement.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="error404" role="alert" aria-live="assertive" aria-label="Error 404. An error has occurred.">
      <canvas ref={canvas} />
    </div>
  );
}
