'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { BEATS } from '@/lib/beats';
import { CAPTIONS } from '@/lib/captions';
import { MAC } from '@/lib/mac';
import { PHONE } from '@/lib/phone';
import { PROGRAM } from '@/lib/program';
import CodeRain, { type Camera } from './CodeRain';
import Error404 from './Error404';
import Pill from './Pill';
import Login from './Login';
import PixelScreen from './PixelScreen';

type Phase =
  | 'idle'
  | 'bars'
  | 'static'
  | 'film'
  | 'end'
  | 'mac'
  | 'zoom'
  | 'terminal'
  | 'rebirth'
  | 'rain'
  | 'wash'
  | 'colorbars'
  | 'login'
  | 'crash';

type Rect = { x: number; y: number; w: number; h: number };

const ProgramContext = createContext<() => void>(() => {});

/**
 * The phone at the foot of the picture, bottom right: LOAD. A rendered
 * elevation of a 1980s brick of a mobile, turned a little so it has a side,
 * lit and graded to stand in the photograph's light — the size of a thing in
 * the picture, and the one thing on the screen that does something. No word
 * on it.
 *
 * It is its own component because it has to stand inside the picture's
 * plate — sized by the plate's container units — while the stage it starts
 * stands outside it: the plate is a size container, and a fixed element
 * inside one is fixed to the plate, not the viewport.
 */
export function Phone() {
  const load = useContext(ProgramContext);
  const aspect = { '--phone-aspect': PHONE.width / PHONE.height } as CSSProperties;
  return (
    <>
      {/* An old tin sign on the road, its arrow at the phone — on every
          visit. It only points: the phone is the one thing that answers. */}
      <span className="hero-sign" style={aspect} aria-hidden="true">
        <img src={SIGN.src} width={SIGN.width} height={SIGN.height} alt="" draggable={false} />
      </span>
      <button type="button" className="hero-phone" style={aspect} onClick={load} aria-label={PROGRAM.label}>
        <img src={PHONE.src} width={PHONE.width} height={PHONE.height} alt="" draggable={false} />
      </button>
    </>
  );
}

/** The sign: DIRECT LINE / CALL US HERE! / WILDCARD*, cut out and graded
 *  into the photograph's light (see BRIEF). */
const SIGN = { src: '/hero/sign.webp', width: 900, height: 508 };

const pct = (n: number) => `${n * 100}%`;

/**
 * LOAD, and everything it starts.
 *
 * Pressing the phone puts the stage over the page — fixed, the whole
 * viewport — and runs the opening of a film clip: black bars rise top and
 * bottom to a letterbox (`bars`), the screen between them is a set with no
 * signal (`static`: a loop of television snow, with its hiss), and the film
 * rolls in out of it — it catches, jumps, settles (`film`) — with its sound
 * and the music under it. The press grants the sound: browsers keep that
 * permission for a few seconds, long enough for the bars and the snow; the
 * music goes through a gain node made in that press, so it can be faded
 * even where a page may not set a volume. A browser that still refuses
 * gets the picture muted and the SOUND switch.
 *
 * Captions are outlines in the wordmark's face, along the foot of the
 * screen. When the film ends it holds on its last frame (`end`), the music
 * comes up, and the question comes up over it. Then the held picture fades
 * to the machine on white (`mac`), still between the bars, and after a
 * moment the picture pushes in on the machine's screen as the bars leave,
 * in one move (`zoom`), and stops with the bezel just showing round it. The screen — its rectangle on the viewport,
 * measured here — is where the terminal lives from then on: its raster, its
 * grain and its type are sized to it, so the terminal is as responsive as
 * the screen, and a resized window re-measures it. The film's opening types
 * there (`terminal`), then READY FOR A REBIRTH? and the pills (`rebirth`).
 *
 * The red pill: the terminal goes dark and the rain (components/CodeRain.tsx,
 * after Rezmason's matrix) starts falling over the machine just as it is,
 * pushed in on, and thickens as the picture pulls back to the whole machine
 * (`rain`); then it drains (`wash`): no column starts another drop, each
 * sends one last drop down with the picture washed to black behind it, and
 * when the last has run off there is only the dark, and the login comes up
 * in it (`login`, components/Login.tsx). The
 * blue pill: a 404 on blue, and nothing answers until a reload (`crash`).
 * The music plays on through all of it, to its end.
 *
 * The machine is two pictures: the wide one, and the part round the screen
 * at three times the size, laid over it where it belongs and blended in at
 * its edges — so the push-in ends on a sharp screen, not on the wide
 * picture's pixels.
 *
 * There is no way back inside it — no CLOSE, no Escape, no click through;
 * once the phone is picked up the program runs to its end, like a film. The
 * browser's own back is the one way out, and it comes home to the city
 * (`home`), not to whatever page came before.
 */
export default function Program({ question, children }: { question: ReactNode; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [cue, setCue] = useState(-1);
  const [shown, setShown] = useState(false);
  const [sound, setSound] = useState(true);
  const [zoom, setZoom] = useState({ x: 0, y: 0, s: 1 });
  /** The screen's rectangle on the viewport, once pushed in on. */
  const [crt, setCrt] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [resizing, setResizing] = useState(false);
  /** Which of the two tracks is on, and which this viewing started with. */
  const track = useRef(0);
  const startedWith = useRef(0);
  /** The pills, a moment after READY FOR A REBIRTH? is typed. */
  const [pills, setPills] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const snow = useRef<HTMLVideoElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const colorbars = useRef<HTMLVideoElement>(null);
  const audio = useRef<{ ctx: AudioContext; gain: GainNode; film: GainNode } | null>(null);
  /** The colour bars' tone, through a gain of its own once there is a mix. */
  const barsGain = useRef<GainNode | null>(null);
  const mac = useRef<HTMLDivElement>(null);
  const wide = useRef<HTMLImageElement>(null);
  const close = useRef<HTMLImageElement>(null);
  const timers = useRef<number[]>([]);
  /** Each viewing's number, so that what one viewing set going does nothing
   *  in the next one, or at home. */
  const viewing = useRef(0);
  /** The elements started in the press only so as to be allowed to play
   *  later: each is stopped as soon as it goes, unless the program has
   *  taken it for real since. */
  const priming = useRef(new Set<HTMLMediaElement>());
  /** A film refused even silent waits for the next touch; this takes the
   *  waiting away. */
  const waiting = useRef<(() => void) | null>(null);
  /** When the question, the fade to the machine and the push-in fall, on
   *  the page's clock (performance.now) — set once, near the film's end,
   *  on the music's accented beats. */
  const plan = useRef<{ question: number; mac: number; zoom: number } | null>(null);

  const after = useCallback((seconds: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, seconds * 1000));
  }, []);

  /** The music's level, ramped: through the gain node if there is one. */
  const level = useCallback((to: number, seconds: number) => {
    const a = audio.current;
    if (a) {
      const g = a.gain.gain;
      const now = a.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(to, now + seconds);
    } else if (music.current) {
      music.current.volume = to;
    }
  }, []);

  /** Starts an element inside a press, without a sound, only so that it may
   *  be started again later with its sound (a phone allows that only to an
   *  element started in a press); stopped the moment it goes, unless the
   *  program has taken it for real meanwhile. `mute`: silence it by its own
   *  switch, where no gain of the mix can. */
  const prime = useCallback((el: HTMLMediaElement | null, mute: boolean) => {
    if (!el) return;
    priming.current.add(el);
    el.preload = 'auto';
    if (mute) el.muted = true;
    el.play()
      .then(() => {
        if (!priming.current.delete(el)) return;
        el.pause();
        el.currentTime = 0;
      })
      .catch(() => {
        priming.current.delete(el);
      });
  }, []);

  /** Where the push-in ends. Taken from the machine's layout box, which a
   *  transform does not move, so it can be taken again at any point — on a
   *  resize, say. */
  const measure = useCallback(() => {
    const el = mac.current;
    if (!el) return;
    const r = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    const { x, y, w, h } = MAC.screen;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sw = r.w * w;
    const sh = r.h * h;
    const s = Math.min(vw / sw, vh / sh) * PROGRAM.fit;
    const cx = r.x + r.w * (x + w / 2);
    const cy = r.y + r.h * (y + h / 2);
    setZoom({ x: vw / 2 - cx, y: vh / 2 - cy, s });
    setCrt({ x: vw / 2 - (sw * s) / 2, y: vh / 2 - (sh * s) / 2, w: sw * s, h: sh * s });
  }, []);

  // The music for this visitor: the two tracks in turn, one after the
  // other for as long as the visitor stays — and this viewing starts with
  // the one the last viewing in this browser did not (the first track, the
  // first time). Set here, on the client, where the browser's memory is. A
  // track that will not load is passed over for the other.
  useEffect(() => {
    const m = music.current;
    if (!m) return;
    const tracks = PROGRAM.music.tracks;
    let start = 0;
    try {
      const last = window.localStorage.getItem(PROGRAM.music.key);
      if (last === '0' || last === '1') start = 1 - Number(last);
    } catch {
      /* no memory: the first track */
    }
    track.current = start;
    let failures = 0;
    const playing = () => audio.current !== null && !m.paused;
    const next = () => {
      track.current = 1 - track.current;
      m.src = tracks[track.current];
    };
    const onEnded = () => {
      failures = 0;
      next();
      void m.play().catch(() => {});
    };
    const onError = () => {
      if (++failures > 1) return;
      const wasPlaying = playing() || m.currentTime > 0;
      next();
      if (wasPlaying) void m.play().catch(() => {});
    };
    m.addEventListener('ended', onEnded);
    m.addEventListener('error', onError);
    m.src = tracks[start];
    return () => {
      m.removeEventListener('ended', onEnded);
      m.removeEventListener('error', onError);
    };
  }, []);

  /** Where the machine is on the viewport, for the rain to be drawn in the
   *  same scene: its scale, where its scene's origin is, and its screen,
   *  across, in the scene's own units (the viewport at full view). */
  const camera = useCallback((): Camera | null => {
    const el = mac.current;
    if (!el || !el.offsetWidth) return null;
    const r = el.getBoundingClientRect();
    const L = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth };
    const k = r.width / L.w;
    return {
      k,
      ox: r.left - k * L.x,
      oy: r.top - k * el.offsetTop,
      sx0: L.x + L.w * MAC.screen.x,
      sx1: L.x + L.w * (MAC.screen.x + MAC.screen.w),
    };
  }, []);

  /** The window itself as the camera: the rain one size throughout, over
   *  the glass of the window rather than in the scene (PROGRAM.rainInScene
   *  false). The screen, across, is still the machine's, for where the rain
   *  starts. */
  const windowCamera = useCallback((): Camera | null => {
    const c = camera();
    return c ? { k: 1, ox: 0, oy: 0, sx0: c.sx0 * c.k + c.ox, sx1: c.sx1 * c.k + c.ox } : null;
  }, [camera]);

  const load = useCallback(() => {
    if (phase !== 'idle') return;
    const run = ++viewing.current;
    // The program is a page of its own in the browser's history, so the
    // browser's back comes home to the city instead of leaving the site.
    plan.current = null;
    try {
      window.history.pushState({ wildcard: 'program' }, '');
    } catch {
      /* a sandboxed frame: back leaves, then */
    }
    // The track this viewing starts with; the next viewing starts with the
    // other.
    startedWith.current = track.current;
    try {
      window.localStorage.setItem(PROGRAM.music.key, String(track.current));
    } catch {
      /* private mode: every viewing starts with the first */
    }
    // An iPhone's silent switch silences a page's audio graph — the film and
    // the music both go through one — unless the page says it is playing
    // media, as a film with sound is.
    try {
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
    } catch {
      /* no say in it: the switch decides */
    }
    // The mix, made inside the press that allows sound at all: the music
    // and the film each through a gain, so both can be set and faded even
    // where a page may not set a volume.
    if (!audio.current && music.current && video.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(music.current).connect(gain).connect(ctx.destination);
        const film = ctx.createGain();
        film.gain.value = PROGRAM.mix.film;
        ctx.createMediaElementSource(video.current).connect(film).connect(ctx.destination);
        audio.current = { ctx, gain, film };
      } catch {
        /* the elements' own volumes, then */
        if (video.current) video.current.volume = PROGRAM.mix.film;
      }
    }
    void audio.current?.ctx.resume().catch(() => {});
    // The music: whole tracks, so not loaded with the page — from the press,
    // two seconds before it is wanted.
    if (music.current) {
      music.current.preload = 'auto';
      music.current.load();
    }
    // The stage up now, in this press, not at the next render: what is
    // started below is started on the page, not in a hidden box.
    flushSync(() => {
      setPhase('bars');
      setShown(false);
      setCue(-1);
      setSound(true);
    });
    // A phone lets a page start sound only from inside a touch: a play()
    // seconds later is refused, and in low-power mode even a silent one is.
    // So the film, the snow and the music are each started here, in the
    // press, without a sound — the film and the music through their gains at
    // nought, the snow muted — and stopped the moment they go (`prime`). The
    // film starts coming down now, too, not when it is wanted.
    priming.current.clear();
    if (audio.current) audio.current.film.gain.value = 0;
    prime(video.current, !audio.current);
    prime(snow.current, true);
    prime(music.current, !audio.current);
    // The machine's pictures are big; have them decoded while the film
    // runs, so the fade to them is a fade and not a stall.
    void wide.current?.decode?.().catch(() => {});
    void close.current?.decode?.().catch(() => {});
    after(PROGRAM.bars / 1000, () => {
      setPhase('static');
      const n = snow.current;
      if (n) {
        priming.current.delete(n);
        n.currentTime = 0;
        n.muted = false;
        n.play().catch(() => {
          n.muted = true;
          void n.play().catch(() => {});
        });
      }
    });
    // The film is asked for when the snow has had its time, and comes on
    // when it is running — until then (a phone, a slow line) the set goes on
    // looking for the signal, in its snow. The music comes in with it, with
    // the film's sound or without it.
    const running = (muted: boolean) => {
      if (run !== viewing.current) return;
      setPhase((p) => (p === 'static' ? 'film' : p));
      if (muted) setSound(false);
      const m = music.current;
      if (m) {
        priming.current.delete(m);
        m.currentTime = 0;
        m.muted = muted;
        if (!audio.current) m.volume = 0;
        m.play()
          .then(() => level(PROGRAM.mix.music, PROGRAM.music.fadeIn))
          .catch(() => {});
      }
      // The snow goes on a moment under the film as it catches.
      after(0.6, () => snow.current?.pause());
    };
    after((PROGRAM.bars + PROGRAM.static) / 1000, () => {
      const v = video.current;
      if (!v) return;
      priming.current.delete(v);
      if (audio.current) audio.current.film.gain.value = PROGRAM.mix.film;
      v.currentTime = 0;
      v.muted = false;
      v.play()
        .then(() => running(false))
        .catch(() => {
          if (run !== viewing.current) return;
          // Refused its sound: silent, and the SOUND switch.
          v.muted = true;
          v.play()
            .then(() => running(true))
            .catch(() => {
              if (run !== viewing.current) return;
              // Refused even silent: the next touch starts it — a touch is
              // allowed anything.
              const touch = () => {
                waiting.current?.();
                waiting.current = null;
                prime(music.current, !audio.current);
                v.muted = false;
                v.play()
                  .then(() => running(false))
                  .catch(() => {});
              };
              window.addEventListener('click', touch, true);
              waiting.current = () => window.removeEventListener('click', touch, true);
            });
        });
    });
  }, [after, level, phase, prime]);

  const toggleSound = useCallback(() => {
    const v = video.current;
    if (!v) return;
    const on = !sound;
    v.muted = !on;
    const m = music.current;
    if (m) {
      m.muted = !on;
      // Music a phone refused before is allowed now, in this touch.
      if (on && m.paused)
        void m
          .play()
          .then(() => level(PROGRAM.mix.music, PROGRAM.music.fadeIn))
          .catch(() => {});
    }
    setSound(on);
  }, [sound, level]);

  /** The end, on the beat. Near the film's end, the music's clock is read
   *  and three moments are put on its accented beats (lib/beats.ts: strong
   *  kicks) — the question, on the beat at the film's last frame or just
   *  after; the fade to the machine, some two and a half seconds after the
   *  end; the push-in, about three more — each the accent nearest its mark
   *  within a window, else the
   *  nearest beat, else the mark itself. Without music, the marks. */
  const makePlan = useCallback(() => {
    if (plan.current) return;
    const v = video.current;
    const m = music.current;
    const left = v && Number.isFinite(v.duration) ? Math.max(0, v.duration - v.currentTime) : 0;
    const grid = m && !m.paused && m.src ? BEATS[new URL(m.src, window.location.href).pathname] : undefined;
    const e = PROGRAM.ending;
    let q: number;
    let mac: number;
    let zoom: number;
    if (grid && m) {
      const t = m.currentTime;
      const end = t + left;
      const pick = (mark: number, lo: number, hi: number) => {
        const near = (xs: readonly number[]) =>
          xs.filter((x) => x >= lo && x <= hi).sort((a, b) => Math.abs(a - mark) - Math.abs(b - mark))[0];
        return near(grid.accents) ?? near(grid.beats) ?? mark;
      };
      const Q = pick(end + e.question.at, end + e.question.from, end + e.question.to);
      const M = pick(end + e.macAt, end + e.macAt - e.slack, end + e.macAt + e.slack);
      const zm = M + PROGRAM.fade + e.dwell;
      const Z = pick(zm, zm - e.slack, zm + e.slack);
      q = Q - t;
      mac = M - t;
      zoom = Z - t;
    } else {
      q = left + e.question.at;
      mac = left + e.macAt;
      zoom = mac + PROGRAM.fade + e.dwell;
    }
    const now = performance.now();
    plan.current = { question: now + q * 1000, mac: now + mac * 1000, zoom: now + zoom * 1000 };
    after(Math.max(0, q), () => setShown(true));
    after(Math.max(0, mac), () => setPhase('mac'));
  }, [after]);

  // Captions: which line is on, ten times a second while the film runs —
  // and, near its end, the plan for the end.
  useEffect(() => {
    if (phase !== 'film') return;
    const v = video.current;
    if (!v) return;
    const id = window.setInterval(() => {
      const t = v.currentTime;
      setCue(CAPTIONS.findIndex((c) => t >= c.start && t < c.end));
      if (Number.isFinite(v.duration) && v.duration - t <= PROGRAM.ending.plan) makePlan();
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, makePlan]);

  // The end: the film has stopped talking and the music comes up; the
  // question over the held frame (planned already, or now).
  useEffect(() => {
    if (phase !== 'end') return;
    level(PROGRAM.mix.musicAfter, 1.2);
    makePlan();
  }, [phase, level, makePlan]);

  // The machine: the fade, a moment between the bars — then measure the
  // push-in and start it, on its beat; the bars leave with it (globals.css).
  useEffect(() => {
    if (phase !== 'mac') return;
    const least = PROGRAM.fade + 1.2;
    const wait = plan.current
      ? Math.max(least, (plan.current.zoom - performance.now()) / 1000)
      : PROGRAM.fade + PROGRAM.ending.dwell;
    after(wait, () => {
      measure();
      setPhase('zoom');
    });
  }, [phase, after, measure]);

  useEffect(() => {
    if (phase !== 'zoom') return;
    after(PROGRAM.zoom, () => setPhase('terminal'));
  }, [phase, after]);

  // The screen follows the window: while the terminal is up, a resize
  // re-measures it, with the push-in's transition held off meanwhile.
  useEffect(() => {
    if (phase !== 'terminal' && phase !== 'rebirth') return;
    let t = 0;
    const onResize = () => {
      setResizing(true);
      measure();
      window.clearTimeout(t);
      t = window.setTimeout(() => setResizing(false), 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(t);
    };
  }, [phase, measure]);

  const red = useCallback(() => {
    if (phase !== 'rebirth') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('login');
      return;
    }
    // The colour bars come seconds after this press, with their tone: started
    // here, silently, so a phone will let them play then (`prime`) — their
    // tone through a gain of its own, made now, at nought.
    const cb = colorbars.current;
    const a = audio.current;
    if (cb && a && !barsGain.current) {
      try {
        const g = a.ctx.createGain();
        g.gain.value = 0;
        a.ctx.createMediaElementSource(cb).connect(g).connect(a.ctx.destination);
        barsGain.current = g;
      } catch {
        /* its own switch, then */
      }
    }
    if (barsGain.current) barsGain.current.gain.value = 0;
    prime(cb, !barsGain.current);
    // The rain thickening over the pull-back, a moment at its heaviest, then
    // the draining; the rain says when it has drained (CodeRain `onDone`),
    // and `limit` is there only in case it cannot.
    setPhase('rain');
    after(PROGRAM.red.out + PROGRAM.red.hold, () => setPhase('wash'));
    after(PROGRAM.red.out + PROGRAM.red.hold + PROGRAM.red.limit, () => setPhase((p) => (p === 'wash' ? 'colorbars' : p)));
  }, [after, phase, prime]);

  // The colour bars: a second of a set's test card, with its tone, cut in
  // over the dark the rain left and cut out again — then the login.
  useEffect(() => {
    if (phase !== 'colorbars') return;
    const cb = colorbars.current;
    if (cb) {
      priming.current.delete(cb);
      cb.currentTime = 0;
      if (barsGain.current) {
        barsGain.current.gain.value = PROGRAM.colorbars.gain;
        cb.muted = false;
      } else {
        cb.muted = false;
        cb.volume = PROGRAM.colorbars.gain;
      }
      cb.play().catch(() => {
        cb.muted = true;
        void cb.play().catch(() => {});
      });
    }
    after(PROGRAM.colorbars.hold, () => {
      colorbars.current?.pause();
      setPhase((p) => (p === 'colorbars' ? 'login' : p));
    });
  }, [phase, after]);

  const blue = useCallback(() => {
    if (phase !== 'rebirth') return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    video.current?.pause();
    snow.current?.pause();
    // The music goes on: it plays until the visitor is home again.
    setPhase('crash');
  }, [phase]);

  // Home: the city, as the page opened on it — by the browser's back, from
  // any point of the program (the login, the crash, the film).
  // Everything stops, the music too; a viewing after this one starts with
  // the other track.
  const home = useCallback(() => {
    viewing.current++;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    waiting.current?.();
    waiting.current = null;
    priming.current.clear();
    const v = video.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    snow.current?.pause();
    colorbars.current?.pause();
    if (barsGain.current) barsGain.current.gain.value = 0;
    const m = music.current;
    if (m) {
      m.pause();
      level(0, 0.05);
      track.current = 1 - startedWith.current;
      m.src = PROGRAM.music.tracks[track.current];
    }
    setPhase('idle');
    setCue(-1);
    setShown(false);
    setPills(false);
    setResizing(false);
    setZoom({ x: 0, y: 0, s: 1 });
    plan.current = null;
  }, [level]);

  useEffect(() => {
    const onPop = () => home();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [home]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      waiting.current?.();
      void audio.current?.ctx.close().catch(() => {});
    },
    [],
  );

  const current = cue >= 0 ? CAPTIONS[cue] : null;
  const timing = {
    '--fade': `${PROGRAM.fade}s`,
    '--question-in': `${PROGRAM.questionIn}s`,
    '--zoom': `${PROGRAM.zoom}s`,
    '--dark': PROGRAM.dark,
    '--lock': `${PROGRAM.lock}s`,
    '--static': `${PROGRAM.static}ms`,
    '--bar-lead': `${PROGRAM.barLead}s`,
    '--out': `${PROGRAM.red.out}s`,
    '--crt-x': `${crt.x}px`,
    '--crt-y': `${crt.y}px`,
    '--crt-w': `${crt.w}px`,
    '--crt-h': `${crt.h}px`,
  } as CSSProperties;
  const machine = {
    '--mac-aspect': MAC.width / MAC.height,
    '--zoom-x': `${zoom.x}px`,
    '--zoom-y': `${zoom.y}px`,
    '--zoom-s': zoom.s,
    transformOrigin: `${(MAC.screen.x + MAC.screen.w / 2) * 100}% ${(MAC.screen.y + MAC.screen.h / 2) * 100}%`,
  } as CSSProperties;
  const closeAt = { left: pct(MAC.close.x), top: pct(MAC.close.y), width: pct(MAC.close.w), height: pct(MAC.close.h) };
  const glassAt = { left: pct(MAC.screen.x), top: pct(MAC.screen.y), width: pct(MAC.screen.w), height: pct(MAC.screen.h) };

  return (
    <ProgramContext.Provider value={load}>
      {children}

      <div
        className="program"
        data-phase={phase}
        data-sound={sound ? 'on' : 'off'}
        data-resizing={resizing ? 'yes' : 'no'}
        hidden={phase === 'idle'}
        style={timing}
      >
        {/* The machine on white: under the bars and the screen until the fade
            reveals it, then the whole viewport, then pushed in on. */}
        <div className="program-scene">
          <div ref={mac} className="program-mac" style={machine}>
            <img
              ref={wide}
              className="program-mac-wide"
              src={MAC.src}
              width={MAC.width}
              height={MAC.height}
              alt="A Macintosh 128K with its keyboard and mouse, on white."
              draggable={false}
            />
            <img
              ref={close}
              className="program-mac-close"
              src={MAC.close.src}
              width={MAC.close.width}
              height={MAC.close.height}
              alt=""
              draggable={false}
              style={closeAt}
            />
            <div className="program-glass" style={glassAt} aria-hidden="true" />
          </div>
        </div>

        {/* The screen once pushed in on: its raster, its grain and its type,
            in its rectangle on the viewport. */}
        <div className="program-terminal">
          <div className="terminal-grain" aria-hidden="true" />
          <div className="terminal-lines" aria-hidden="true" />
          {phase === 'terminal' ? (
            <PixelScreen
              screens={PROGRAM.terminal.screens}
              holds={PROGRAM.terminal.holds}
              active
              delay={PROGRAM.terminal.delay}
              cps={PROGRAM.terminal.cps}
              onDone={() => setPhase('rebirth')}
            />
          ) : null}
          <PixelScreen
            screens={[[PROGRAM.rebirth.line]]}
            active={phase === 'rebirth'}
            delay={0.6}
            cps={12}
            align="centre"
            onTyped={() => after(PROGRAM.rebirth.pills, () => setPills(true))}
          >
            {pills ? (
              <div className="rebirth-pills">
                <button type="button" className="rebirth-pill" data-color="red" aria-label="The red pill" onClick={red}>
                  <Pill color="red" />
                </button>
                <button type="button" className="rebirth-pill" data-color="blue" aria-label="The blue pill" onClick={blue}>
                  <Pill color="blue" />
                </button>
              </div>
            ) : null}
          </PixelScreen>
        </div>

        {/* The rain: mounted with the pills, so its font is in by the time it
            falls; falling over everything from the red pill to the dark. */}
        {phase === 'rebirth' || phase === 'rain' || phase === 'wash' ? (
          <CodeRain
            active={phase === 'rain' || phase === 'wash'}
            draining={phase === 'wash'}
            build={PROGRAM.red.out}
            camera={PROGRAM.rainInScene ? camera : windowCamera}
            wash="#030304"
            onDone={() => setPhase((p) => (p === 'wash' ? 'colorbars' : p))}
          />
        ) : null}

        {/* The login: the terminal the rain has washed down to. */}
        {phase === 'login' ? <Login /> : null}

        {/* A second of colour bars between the rain and the login. */}
        <div className="program-colorbars" aria-hidden="true">
          <video
            ref={colorbars}
            src={PROGRAM.colorbars.src}
            poster={PROGRAM.colorbars.poster}
            playsInline
            preload="none"
          />
        </div>

        <div className="program-bar program-bar-top" aria-hidden="true" />
        <div className="program-bar program-bar-bottom" aria-hidden="true" />

        <div className="program-screen">
          <video
            ref={video}
            className="program-film"
            src={PROGRAM.mp4}
            playsInline
            preload="metadata"
            onEnded={() => setPhase((p) => (p === 'film' ? 'end' : p))}
          />
          <div className="program-static" aria-hidden="true">
            <video ref={snow} className="program-snow" src={PROGRAM.snow} loop playsInline preload="auto" />
          </div>

          {phase === 'film' && current ? (
            <svg
              className="program-caption"
              viewBox={current.viewBox}
              role="img"
              aria-label={current.text}
              aria-live="polite"
              fill="currentColor"
            >
              <path d={current.d} />
            </svg>
          ) : null}

          <div className="program-question" data-shown={shown ? 'yes' : 'no'} aria-hidden={!shown}>
            {question}
          </div>
        </div>

        {/* The music under the film: its source is chosen on the client
            (which track this viewing starts with), above. */}
        <audio ref={music} preload="none" />

        {phase === 'film' ? (
          <button type="button" className="program-sound caption-type" onClick={toggleSound} aria-pressed={sound}>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
        ) : null}
      </div>

      {phase === 'crash' ? <Error404 /> : null}
    </ProgramContext.Provider>
  );
}
