/**
 * A pill in pixels: a capsule on a 56 × 24 grid — fine enough to have a
 * gloss, coarse enough to stay a pixel picture. The light is worked out per
 * pixel (bright on top, dark underneath, a little light bounced back along
 * the bottom edge, a long highlight where a lamp sits on the gel) and then
 * put down in eight tones with an ordered dither between them, the way a
 * palette-limited screen would draw it. A dark outline holds the shape.
 *
 * Drawn as runs of squares with crisp edges (one rect per run of one
 * colour on a row), so it scales to any size without softening.
 */
const W = 56;
const H = 24;
const R = H / 2;

const PALETTES = {
  red: ['#2a0407', '#5e0a10', '#8c1119', '#b3161f', '#d42430', '#ec4a52', '#ff7a7f', '#ffe3e3'],
  blue: ['#050c2e', '#0a1a5e', '#0f2a8c', '#163bb3', '#2150d4', '#4474ec', '#7aa0ff', '#e3ecff'],
} as const;

/** 4 × 4 ordered dither thresholds, 0..1. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);

type Run = { x: number; y: number; w: number; fill: string };

function draw(color: keyof typeof PALETTES): Run[] {
  const pal = PALETTES[color];
  const runs: Run[] = [];
  for (let y = 0; y < H; y++) {
    let run: Run | null = null;
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const cx = Math.min(Math.max(px, R), W - R);
      const d = Math.hypot(px - cx, py - R);
      let fill: string | null = null;
      if (d <= R) {
        if (d > R - 1.15) {
          fill = pal[0];
        } else {
          const v = py / H;
          // Light from above, falling off to the bottom; a little bounce
          // along the lower edge; darker toward the rounded ends.
          let l = 0.92 - 0.95 * v;
          if (v > 0.8) l += (v - 0.8) * 1.1;
          l -= Math.max(0, d / R - 0.72) * 0.55;
          // The highlight: a long soft ellipse in the upper left third.
          const hx = (px - W * 0.3) / (W * 0.2);
          const hy = (py - H * 0.27) / (H * 0.1);
          const h = 1 - (hx * hx + hy * hy);
          if (h > 0) l += h * 0.9;
          // Eight tones: 1..6 for the body with a dither between them, 7
          // for the hot centre of the highlight.
          if (h > 0.55) {
            fill = pal[7];
          } else {
            const t = Math.min(0.9999, Math.max(0, l)) * 6;
            const lo = Math.floor(t);
            const frac = t - lo;
            const step = frac > BAYER[(y % 4) * 4 + (x % 4)] ? 1 : 0;
            fill = pal[Math.min(6, 1 + lo + step)];
          }
        }
      }
      if (fill && run && run.fill === fill && run.x + run.w === x) {
        run.w += 1;
      } else {
        if (run) runs.push(run);
        run = fill ? { x, y, w: 1, fill } : null;
      }
    }
    if (run) runs.push(run);
  }
  return runs;
}

const RED = draw('red');
const BLUE = draw('blue');

export default function Pill({ color }: { color: 'red' | 'blue' }) {
  const runs = color === 'red' ? RED : BLUE;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {runs.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
