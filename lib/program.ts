/**
 * The program: the film that the phone plays over the page, and what
 * follows it.
 *
 * Pick up the phone and, like a clip of a film, black bars rise from the
 * top and bottom of the screen to a 2.39:1 letterbox; the picture between
 * them is a set with no signal — television snow, with its hiss — until it
 * catches the signal and the film rolls in, with sound and, under it, the
 * music — the author's two tracks, one after the other in turn, through
 * everything that follows, until the visitor is back on the home page. When the film ends it holds on its
 * last frame and the question comes up over it in paper, one line, dead
 * centre.
 *
 * Then the picture and the question fade to white: a Macintosh 128K on a
 * white ground, still between the bars. The machine stands there for a
 * moment, and the picture pushes in on its screen as the bars leave the
 * way they came, the two in one move, until the screen is nearly all there
 * is — its bezel just showing round it, the way a screen is seen. On it, at the Macintosh's own 512 ×
 * 342 pixels, one bit each, lit green, the film's opening types itself,
 * screen by screen, and then the question of the pills: READY FOR A
 * REBIRTH?, a red pill on the left, a blue one on the right.
 *
 * The red pill: the green rain of code starts falling on the machine's
 * screen, large, as the picture is pushed in on it — and as the picture
 * pulls back to the whole machine, now in the dark, the glyphs shrink with
 * the machine and the rain spreads out and thickens over everything; there,
 * it stops starting new drops: each column sends one last drop down, the
 * picture is washed to black behind it, and the rain thins out stream by
 * stream until there is only the dark; a second of colour bars, a set's
 * test card with its tone; and then the login: the terminal of an
 * institution that issues identities (components/Login.tsx).
 * The blue pill: the machine crashes to a blue 404, and nothing answers
 * again until the page is reloaded. There is no way back either way.
 *
 * The film is the whole cut, opening shot and sound included, served as
 * exported; its captions are outlines in lib/captions.ts, generated with the
 * wordmark by tools/build-type.py. The snow is tools/build-static.py. The
 * machine is lib/mac.ts, rendered by tools/render-props.py. The rain is
 * components/CodeRain.tsx, after Rezmason's matrix (MIT; its font is in
 * public/matrix). All times are seconds unless named otherwise.
 */
export const PROGRAM = {
  mp4: '/program/dreams.mp4',
  /** The snow: a short loop with sound. */
  snow: '/program/static.mp4',
  /** Under the film: the music — the author's own (2026-09-29), the two
   *  tracks in turn: each to its end and then the other, for as long as the
   *  visitor stays; and from one viewing to the next, the other one first —
   *  the first viewing in a browser starts with the first track, the next
   *  with the second, and so on (the one a viewing started with is kept in
   *  this browser under `key`). A track that cannot be had is passed over.
   *  Whole tracks, a fixed gain to −20 LUFS and nothing else; the music
   *  comes in over `fadeIn`. */
  music: {
    tracks: ['/program/powerful.m4a', '/program/strongest.m4a'],
    key: 'wildcard.track',
    fadeIn: 1.4,
  },
  /** The mix, as gains (1 = as the file is): the film's own sound brought
   *  down, the music under it, and the music once the film has stopped
   *  talking — from there it carries on as it is, to its end. The film is
   *  mastered at −16.5 LUFS, the music at −20. */
  mix: { film: 0.5, music: 0.62, musicAfter: 0.88 },
  /** What the phone is called, for those who cannot see it. */
  label: 'Load',
  /** The bars rising, then the snow, in milliseconds; the film starts after
   *  both, and takes `lock` seconds to settle out of the snow. */
  bars: 700,
  /** The top bar sets off this long after the bottom one. The two move the
   *  same, but the top one comes down over a bright sky and reads at once,
   *  the bottom one comes up over the dark road and reads later; so the
   *  bottom one leads, and the two read as one move (2026-09-30). */
  barLead: 0.08,
  static: 1500,
  lock: 1.1,
  /** The question comes up over `questionIn` — a quick attack, so it lands
   *  on its beat. */
  questionIn: 0.3,
  /** The end, on the music's beat (components/Program.tsx `makePlan`, the
   *  beats in lib/beats.ts). `plan` seconds before the film ends the music's
   *  clock is read; the question goes on the accent nearest `question.at`
   *  seconds from the film's end (negative: before it), between
   *  `question.from` and `question.to`; the fade to the machine on the
   *  accent nearest `macAt` seconds after the film's end; the push-in on
   *  the accent nearest `dwell` seconds after the fade — each within
   *  `slack`. 2026-09-30: the question about half a second later than
   *  before (it was at −0.35, from −0.7 to +0.35; now it lands on the beat
   *  at the film's end or just after: +0.38 s on powerful, +0.58 s on
   *  strongest), and the fade to the machine where it fell before (it was
   *  the question + 3.0, on average the end + 2.65) — so only the words
   *  move, not the tempo after them. */
  ending: { plan: 1.6, question: { at: 0.15, from: -0.2, to: 0.85 }, macAt: 2.65, dwell: 2.2, slack: 0.65 },
  /** The fade from the held frame to the machine on white, between the bars. */
  fade: 1.2,
  /** The push-in on the screen — the bars leave over the same seconds, on
   *  the same curve — and the fraction of it (from the end) over which the
   *  screen's raster and the type come up. */
  zoom: 3.2,
  dark: 0.3,
  /** How much of the viewport the screen takes when the push-in stops, in
   *  its tighter dimension: under 1, so the bezel shows round it. */
  fit: 0.9,
  /** The screen's raster: the Macintosh drew 342 lines (the lit area,
   *  512 × 342, is components/PixelScreen.tsx). */
  lines: 342,
  /** The terminal, the way the film's opens: screens that type, hold, and
   *  clear. The words are the author's (2026-09-29): the film's, with the
   *  Matrix turned into the Wildcard and the white rabbit into the ego. */
  terminal: {
    delay: 1.0,
    cps: 11,
    screens: [
      ['Wake up, Neo...'],
      ['The Wildcard has you...'],
      ['Follow your ego...', "Then we'll find you..."],
      ['Knock, knock, Neo...'],
    ],
    holds: [3.2, 2.6, 2.8, 1.8],
  },
  /** The question of the pills, and how long after it the pills come. */
  rebirth: { line: 'READY FOR A REBIRTH?', pills: 0.7 },
  /** The red pill: the pull-back to the whole machine, over which the rain
   *  thickens (`out`); a moment of it at its heaviest (`hold`); then the
   *  draining, which takes as long as the last drops take to fall — `limit`
   *  is only a floor under it, should the rain stall. */
  red: { out: 4.4, hold: 0.9, limit: 9 },
  /** When the rain has drained: a second of colour bars — the author's clip
   *  (a set's test card, torn and waving, with its 441 Hz tone), its first
   *  1.4 seconds — cut in and cut out, then the login. `gain` is the tone's
   *  level over the music. */
  colorbars: { src: '/program/colorbars.mp4', poster: '/program/colorbars.webp', hold: 1.0, gain: 0.35 },
  /** Whether the rain is drawn in the scene, through the camera — large on
   *  the pushed-in screen, shrinking with the machine as the picture pulls
   *  back (2026-09-29, on trial) — or over the window, its glyphs one size
   *  throughout (as before). `false` rolls it back. */
  rainInScene: true,
} as const;
