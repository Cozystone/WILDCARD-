'use client';

import { useEffect, useRef } from 'react';

/**
 * The green rain of code, after Rezmason's matrix (github.com/Rezmason/matrix,
 * MIT): its font (Matrix-Code, the classic glyphs, vendored in
 * public/matrix/assets), its glyph order, its classic colours (green at 108°,
 * a cursor of pale yellow-green at the head of every drop, about eighty cells
 * across the longer side) and its principle — the glyphs sit still in a grid
 * and change now and then; what falls is light, a wave running down each
 * column, brightest at its head.
 *
 * The rain is in the scene, not on the glass of the window: its grid is laid
 * out over the scene as it stands at full view (the machine on white, the
 * viewport), and drawn through the same camera as the machine — `camera()`
 * reads where the machine is on the viewport and how large, every frame. So
 * while the picture is pushed in on the screen the rain is large, a few
 * columns across the glass; as the picture pulls back, the glyphs shrink with
 * the machine, in proportion, and the rain spreads out from the screen over
 * the whole scene. How fast it falls is kept to what reads as rain at every
 * scale (on the viewport it slows a little as the camera pulls back, rather
 * than by the whole factor of the zoom).
 *
 * It starts from a few streams on the screen and thickens as the camera pulls
 * back (`build` seconds: the columns over the screen first, then outward).
 * Once `draining`, no column starts another drop; each column sends one last
 * drop down from the top, and behind it the picture is washed out to `wash`
 * (black, for the login that follows). When the last drop has run off the
 * bottom the canvas is that colour from edge to edge, and `onDone`.
 *
 * Drawn on a transparent canvas, from sprites made once per scale the rain
 * passes through, so large glyphs are drawn from large sprites, not blown up.
 */

const FONT_URL = '/matrix/assets/Matrix-Code.ttf';
const FAMILY = 'WildcardMatrixCode';
/** Rezmason's order for the classic glyphs, those the font has. */
const GLYPHS = [...'モエヤキオカ7ケサスz152ヨタワ4ネヌナ98ヒ0ホア3ウセ¦:"꞊ミラリ╌ツテニハソ▪<>|+*コシマムメ'];

/** Where the scene is on the viewport: scale `k`, and the viewport position
 *  of the scene's origin; `sx0`–`sx1` is the machine's screen, across, in the
 *  scene's own units (the viewport at full view). */
export type Camera = { k: number; ox: number; oy: number; sx0: number; sx1: number };

type Drop = { y: number; speed: number; len: number };
type Column = {
  on: number;
  drops: Drop[];
  gap: number;
  washAt: number;
  wash: Drop | null;
  done: boolean;
};

type Tier = 'tail' | 'body' | 'head';
const TIERS: Tier[] = ['tail', 'body', 'head'];
const COLOR: Record<Tier, string> = {
  tail: 'hsl(108 90% 36%)',
  body: 'hsl(108 90% 58%)',
  head: 'hsl(87 100% 84%)',
};
const GLOW: Record<Tier, number> = { tail: 0.12, body: 0.3, head: 0.7 };

type Grid = { vw: number; vh: number; colW: number; rowH: number; cols: number; rows: number; pad: number };
type Atlas = { canvas: HTMLCanvasElement; scale: number; sw: number; sh: number; per: number; rowsPer: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

let fontReady: Promise<void> | null = null;
function loadFont() {
  if (!fontReady) {
    fontReady = (async () => {
      try {
        const face = new FontFace(FAMILY, `url(${FONT_URL})`);
        await face.load();
        document.fonts.add(face);
      } catch {
        /* the system's katakana, then */
      }
    })();
  }
  return fontReady;
}

/** The grid over the scene at full view: about eighty cells across the
 *  longer side, as Rezmason's. */
function gridFor(vw: number, vh: number): Grid {
  const colW = Math.max(13, Math.max(vw, vh) / 84);
  const rowH = colW * 1.12;
  return { vw, vh, colW, rowH, cols: Math.ceil(vw / colW), rows: Math.ceil(vh / rowH), pad: Math.ceil(colW * 0.5) };
}

/** Every glyph in every tier, glow and all, at one scale. */
function makeAtlas(g: Grid, scale: number): Atlas | null {
  const sw = Math.ceil((g.colW + g.pad * 2) * scale);
  const sh = Math.ceil((g.rowH + g.pad * 2) * scale);
  const per = 9;
  const rowsPer = Math.ceil(GLYPHS.length / per);
  const canvas = document.createElement('canvas');
  canvas.width = sw * per;
  canvas.height = sh * rowsPer * TIERS.length;
  const x = canvas.getContext('2d');
  if (!x) return null;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `${Math.round(g.rowH * 0.86 * scale)}px ${FAMILY}, "MS Gothic", "Hiragino Kaku Gothic ProN", monospace`;
  TIERS.forEach((tier, ti) => {
    x.fillStyle = COLOR[tier];
    x.shadowColor = COLOR[tier];
    x.shadowBlur = g.colW * GLOW[tier] * 1.3 * scale;
    GLYPHS.forEach((ch, gi) => {
      x.fillText(ch, (gi % per) * sw + sw / 2, (ti * rowsPer + Math.floor(gi / per)) * sh + sh / 2);
    });
  });
  return { canvas, scale, sw, sh, per, rowsPer };
}

/** The scales to make sprites at, for a pull-back from `k0` to 1. */
const scalesFor = (k0: number) => [...new Set([1, Math.min(2.2, k0), Math.min(k0, 7)])].sort((a, b) => a - b);

export default function CodeRain({
  active,
  draining,
  build,
  camera,
  wash = '#ffffff',
  onDone,
}: {
  active: boolean;
  draining: boolean;
  build: number;
  camera: () => Camera | null;
  /** The colour the last drops leave behind them. */
  wash?: string;
  onDone: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drain = useRef(draining);
  drain.current = draining;
  const done = useRef(onDone);
  done.current = onDone;
  const cam = useRef(camera);
  cam.current = camera;
  const prepared = useRef<{ grid: Grid; atlases: Atlas[] } | null>(null);

  // Mounted with the pills: the font, and the sprites at the scales the rain
  // will pass through, made while the visitor decides.
  useEffect(() => {
    let alive = true;
    void loadFont().then(() => {
      if (!alive) return;
      const grid = gridFor(window.innerWidth, window.innerHeight);
      const k0 = Math.max(1, cam.current()?.k ?? 1);
      const atlases = scalesFor(k0)
        .map((s) => makeAtlas(grid, s))
        .filter((a): a is Atlas => a !== null);
      prepared.current = { grid, atlases };
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let raf = 0;
    let alive = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    el.width = vw;
    el.height = vh;

    const run = () => {
      if (!alive) return;
      // The window may have changed since the sprites were made.
      let p = prepared.current;
      if (!p || p.grid.vw !== vw || p.grid.vh !== vh) {
        const grid = gridFor(vw, vh);
        const k0 = Math.max(1, cam.current()?.k ?? 1);
        p = { grid, atlases: scalesFor(k0).map((s) => makeAtlas(grid, s)).filter((a): a is Atlas => a !== null) };
        prepared.current = p;
      }
      const { grid, atlases } = p;
      const { colW, rowH, cols, rows, pad } = grid;
      const glyph = new Uint8Array(cols * (rows + 1)).map(() => Math.floor(Math.random() * GLYPHS.length));
      const baseSpeed = rows / 2.6;

      // The columns over the machine's screen start first, a few at once;
      // the further a column is from the screen, the later it starts, so
      // the rain spreads out from the screen as the camera pulls back.
      const c0 = cam.current();
      const sx0 = c0?.sx0 ?? vw * 0.4;
      const sx1 = c0?.sx1 ?? vw * 0.6;
      const columns: Column[] = Array.from({ length: cols }, (_, ci) => {
        const cx = (ci + 0.5) * colW;
        const d = cx < sx0 ? sx0 - cx : cx > sx1 ? cx - sx1 : 0;
        const u = Math.min(1, d / (vw * 0.5));
        const on = d === 0 ? rand(0, 1.1) : build * (0.18 + 0.82 * Math.pow(u, 0.8)) * rand(0.7, 1.0);
        return { on, drops: [], gap: 0, washAt: Infinity, wash: null, done: false };
      });

      let drainStart: number | null = null;
      const start = performance.now();
      let last = start;
      let view: Camera = c0 ?? { k: 1, ox: 0, oy: 0, sx0, sx1 };

      const step = (t: number, dt: number) => {
        const density = Math.min(1, t / Math.max(0.1, build));
        const k = Math.max(1, view.k);
        // The scene's rows in view, and the top of the view in scene rows.
        const inView = rows / k;
        const top = Math.max(0, -view.oy / k / rowH);
        // On the viewport the rain falls a little faster close up, not
        // k times faster.
        const pace = Math.pow(k, -0.65);
        if (drain.current && drainStart === null) {
          drainStart = t;
          for (const c of columns) c.washAt = t + rand(0, 1.1);
        }
        let finished = drainStart !== null;
        for (const c of columns) {
          for (const d of c.drops) d.y += d.speed * pace * dt;
          c.drops = c.drops.filter((d) => d.y - d.len < rows + 1);
          if (c.wash) {
            c.wash.y += c.wash.speed * dt;
            if (c.wash.y - c.wash.len > rows + 1) c.done = true;
          }
          if (drainStart === null) {
            // Building: a new drop at the top of the view, once the last one
            // is far enough down; lengths and gaps in proportion to the view.
            if (t >= c.on) {
              const newest = c.drops[c.drops.length - 1];
              if (!newest || newest.y - newest.len - top > c.gap) {
                c.drops.push({
                  y: top,
                  speed: baseSpeed * rand(0.65, 1.35),
                  len: inView * rand(0.25, 0.25 + 0.5 * density),
                });
                c.gap = inView * rand(0.02, 1.1 - density * 0.95);
              }
            }
          } else if (!c.wash && t >= c.washAt) {
            // Draining: one last drop from the top, washing white behind it.
            c.wash = { y: 0, speed: baseSpeed * rand(1.0, 1.45), len: rows * rand(0.18, 0.4) };
          }
          if (!c.done) finished = false;
        }
        return finished;
      };

      const draw = () => {
        const { k, ox, oy } = view;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, el.width, el.height);
        // What the last drops leave behind them.
        ctx.fillStyle = wash;
        for (let ci = 0; ci < cols; ci++) {
          const c = columns[ci];
          const front = c.done ? rows + 1 : c.wash ? c.wash.y : 0;
          if (front <= 0) continue;
          const x0 = Math.floor(ox + ci * colW * k);
          const x1 = Math.ceil(ox + (ci + 1) * colW * k) + 1;
          ctx.fillRect(x0, Math.floor(oy), x1 - x0, Math.ceil(front * rowH * k));
        }
        if (!atlases.length) return;
        // The sprites made at the nearest scale at or above this one.
        const a = atlases.find((s) => s.scale >= k - 0.01) ?? atlases[atlases.length - 1];
        const dw = (colW + pad * 2) * k;
        const dh = (rowH + pad * 2) * k;
        for (let ci = 0; ci < cols; ci++) {
          const x = ox + (ci * colW - pad) * k;
          if (x > vw || x + dw < 0) continue;
          const c = columns[ci];
          const drops = c.wash ? [...c.drops, c.wash] : c.drops;
          for (const d of drops) {
            const head = Math.floor(d.y);
            const topRow = Math.max(0, Math.floor(d.y - d.len));
            for (let r = Math.min(rows, head); r >= topRow; r--) {
              const y = oy + (r * rowH - pad) * k;
              if (y > vh || y + dh < 0) continue;
              const b = 1 - (d.y - r) / d.len;
              if (b <= 0.06) continue;
              const isHead = r === head;
              const tier = isHead ? 2 : b > 0.55 ? 1 : 0;
              const cell = ci * (rows + 1) + r;
              // The glyphs change now and then; the head's, all the time.
              if (isHead ? Math.random() < 0.35 : Math.random() < 0.012) {
                glyph[cell] = Math.floor(Math.random() * GLYPHS.length);
              }
              const gi = glyph[cell];
              ctx.globalAlpha = isHead ? 1 : tier === 1 ? 0.55 + 0.45 * b : Math.min(1, b * 1.5);
              ctx.drawImage(
                a.canvas,
                (gi % a.per) * a.sw,
                (tier * a.rowsPer + Math.floor(gi / a.per)) * a.sh,
                a.sw,
                a.sh,
                x,
                y,
                dw,
                dh,
              );
            }
          }
        }
        ctx.globalAlpha = 1;
      };

      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.min(0.12, (now - last) / 1000);
        last = now;
        const t = (now - start) / 1000;
        view = cam.current() ?? view;
        const finished = step(t, dt);
        draw();
        if (finished) {
          done.current();
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    void loadFont().then(run);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [active, build, wash]);

  return <canvas ref={canvas} className="program-coderain" aria-hidden="true" />;
}
