'use client';

import type { EmailOtpType } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from 'react';
import { access, isAddress, linkType, type Outcome, type Refusal } from '@/lib/records/access';
import { TERMINAL as T } from '@/lib/records/copy';
import { STAR } from '@/lib/records/star';
import { CLEARANCE, recordLabel, type HolderRecord } from '@/lib/records/types';

/**
 * The C.I.A terminal — the Counter Identity Agency's, WILDCARD's system: the
 * author's seal and title (public/program/cia-seal.webp, cia-title.webp), a
 * thin gold line round the screen, Holder and Clearance, the notice in small
 * type, the seal again, faint, in the corner. It comes up at the end of the
 * program, in the dark the rain left; on its own at /terminal; and at
 * /auth/confirm, where the link in the transmission comes back.
 *
 * What it does is real: it finds a holder's record, or issues one — through
 * lib/records/access.ts (Supabase Auth, an address and a transmission to it:
 * a magic link, or its code). What it looks like is not a login: there is no
 * box until the Holder line is touched — then the white bar of the old
 * terminal, and the caret — and every answer is a line the terminal types.
 *
 *   Holder: an address ↵ → SEARCHING RECORDS... → AUTHORIZATION REQUIRED.
 *   CHECK YOUR TERMINAL. (the same for every address) → the link, or the
 *   code at CODE: → a record found: RECORD FOUND. IDENTITY CONFIRMED., the
 *   fields filled, WELCOME BACK. YOU MAY HAVE CHANGED. — or none: NO RECORD
 *   FOUND. ISSUE ONE? [Y] [N] → SELF-ISSUANCE REQUESTED. NAME FOR THIS
 *   RECORD: → RECORD CREATED., PROVISIONAL, W*–PENDING.
 *
 * Then the way out: the title comes unsteady, the gold line goes in places,
 * the seal breaks up, C.I.A comes down to a single *, black, a white flash,
 * and the record (/record). Keyboard throughout; the lines are read out
 * whole; reduced motion gets cuts.
 */

const SEAL = { src: '/program/cia-seal.webp', width: 425, height: 425 };
const TITLE = { src: '/program/cia-title.webp', width: 485, height: 37 };

/** The pieces coming up (the last `--d` of `.login > *` in globals.css). */
const STEP_IN = 1500;
/** The way out, to the white flash and the record (`.login[data-exit]`). */
const EXIT = 3500;
const EXIT_REDUCED = 700;
/** How fast the terminal types, in characters a second. */
const CPS = 36;

type Step = 'check' | 'verify' | 'holder' | 'busy' | 'code' | 'ask' | 'naming' | 'again' | 'offline' | 'leaving';
type Field = 'holder' | 'code' | 'name';
type Line = { text: string; warn?: boolean };

const toLines = (texts: readonly string[], warn = false): Line[] => texts.map((text) => ({ text, warn }));

/** The link from the transmission, read once per page load — and taken out
 *  of the address bar, so that a reload does not spend it again. */
let linkRead: { tokenHash: string | null; type: EmailOtpType | null; error: string | null } | null = null;
function readLink() {
  if (linkRead) return linkRead;
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  linkRead = {
    tokenHash: q.get('token_hash'),
    type: linkType(q.get('type')),
    error: q.get('error_code') ?? h.get('error_code') ?? q.get('error') ?? h.get('error'),
  };
  if (linkRead.error) console.error('[records] link', linkRead.error, q.get('error_description') ?? h.get('error_description'));
  try {
    window.history.replaceState(null, '', '/terminal');
  } catch {
    /* the address stays; the token is spent anyway */
  }
  return linkRead;
}

/** A token is spent by its first use: one verification per token. */
const verifications = new Map<string, Promise<Outcome>>();
function verifyOnce(tokenHash: string, type: EmailOtpType) {
  let p = verifications.get(tokenHash);
  if (!p) {
    p = access.confirmLink(tokenHash, type);
    verifications.set(tokenHash, p);
  }
  return p;
}

/** The terminal's lines, typed; read out whole. */
function Log({ lines, reduced, onTyped }: { lines: Line[]; reduced: boolean; onTyped: () => void }) {
  const full = lines.map((l) => l.text).join('\n');
  const [typed, setTyped] = useState({ full: '', n: 0 });
  // New lines that carry on from the old ones carry on typing from there.
  if (typed.full !== full) {
    const n = reduced ? full.length : full.startsWith(typed.full) ? Math.min(typed.n, full.length) : 0;
    setTyped({ full, n });
  }
  const done = typed.full === full && typed.n >= full.length;
  useEffect(() => {
    if (done) {
      onTyped();
      return;
    }
    const t = window.setTimeout(() => setTyped((s) => (s.full === full ? { full, n: s.n + 1 } : s)), 1000 / CPS);
    return () => window.clearTimeout(t);
  }, [done, full, typed.n, onTyped]);

  const n = typed.full === full ? typed.n : 0;
  const lengths = lines.map((l) => l.text.length + 1);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <>
      <div className="login-log" aria-hidden="true">
        {lines.map((l, i) => (
          <p key={i} className={l.warn ? 'login-warn' : undefined}>
            {l.text.slice(0, Math.max(0, n - starts[i]))}
          </p>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {lines.map((l) => l.text).join(' ')}
      </p>
    </>
  );
}

const motion = '(prefers-reduced-motion: reduce)';
const watchMotion = (change: () => void) => {
  const m = window.matchMedia(motion);
  m.addEventListener('change', change);
  return () => m.removeEventListener('change', change);
};
const stillNow = () => window.matchMedia(motion).matches;
const stillOnServer = () => false;

/** Mounted, it runs: the program mounts it for the `login` phase only, and
 *  the pages for as long as they are open — so leaving empties it. */
export default function Login({
  standalone = false,
  confirming = false,
}: {
  /** On a page of its own (/terminal, /auth/confirm), not over the program. */
  standalone?: boolean;
  /** At /auth/confirm: the link from the transmission has come back. */
  confirming?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(confirming ? 'verify' : 'check');
  const [address, setAddress] = useState('');
  const [holder, setHolder] = useState<string | null>(null);
  const [clearance, setClearance] = useState<string>(T.unissued);
  const [record, setRecord] = useState<string | null>(null);
  const [log, setLog] = useState<Line[]>([]);
  const [typed, setTyped] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [focused, setFocused] = useState<Field | null>(null);
  const [announce, setAnnounce] = useState('');
  const reduced = useSyncExternalStore(watchMotion, stillNow, stillOnServer);
  const [formH, setFormH] = useState(0);

  const run = useRef(0);
  const stepNow = useRef<Step>(step);
  const logNow = useRef('');
  const sentTo = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const form = useRef<HTMLDivElement>(null);
  const holderInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const ids = { holder: useId(), help: useId(), code: useId(), name: useId() };

  const alive = (me: number) => me === run.current;
  /** Stops whatever sequence is running (they check `alive`). */
  const cancel = useCallback(() => {
    run.current++;
  }, []);

  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        timers.current.push(window.setTimeout(resolve, ms));
      }),
    [],
  );

  const say = useCallback((texts: readonly string[], warn = false) => {
    const next = toLines(texts, warn);
    const full = next.map((l) => l.text).join('\n');
    setLog(next);
    if (full !== logNow.current) setTyped(false);
    logNow.current = full;
  }, []);

  const onTyped = useCallback(() => setTyped(true), []);

  /** Writes a record into the fields: Holder, Clearance, Record. */
  const fill = useCallback((rec: HolderRecord) => {
    const who = rec.displayName ? rec.displayName.toUpperCase() : null;
    setHolder(who);
    setClearance(CLEARANCE[rec.clearance]);
    setRecord(recordLabel(rec.recordNumber));
    setAnnounce(`${T.holder} ${who ?? ''}. ${T.clearance} ${CLEARANCE[rec.clearance]}. ${T.record} ${recordLabel(rec.recordNumber)}.`);
  }, []);

  /** Back to the empty terminal: Holder: and Clearance: Unissued. */
  const reset = useCallback(() => {
    run.current++;
    sentTo.current = null;
    setHolder(null);
    setAddress('');
    setClearance(T.unissued);
    setRecord(null);
    setCode('');
    setName('');
    setAnnounce('');
    say([]);
    setStep('holder');
  }, [say]);

  /** The way out: to the white, and the record. */
  const leave = useCallback(
    async (me: number) => {
      setStep('leaving');
      router.prefetch('/record');
      await wait(reduced ? EXIT_REDUCED : EXIT);
      if (alive(me)) router.push('/record');
    },
    [reduced, router, wait],
  );

  const refuse = useCallback(
    (why: Refusal, from: Step = 'holder') => {
      switch (why) {
        case 'unreachable':
          say(T.unreachable, true);
          setStep('offline');
          return;
        case 'expired':
          say(T.expired);
          setStep('again');
          return;
        case 'limited':
          say(T.limited, true);
          setStep(from === 'code' ? 'code' : 'holder');
          return;
        case 'address':
          say(T.address, true);
          setHolder(null);
          setStep('holder');
          return;
        case 'name':
          say([T.requested, T.nameRule], true);
          setStep('naming');
          return;
        case 'suspended':
          say(T.suspended, true);
          void access.close();
          setHolder(null);
          setStep('holder');
          return;
        default:
          say(T.interrupted, true);
          setHolder(null);
          setStep('holder');
      }
    },
    [say],
  );

  /** The address has authorized itself: find the record, or offer one. */
  const confirmed = useCallback(
    async (me: number, rec: HolderRecord) => {
      setStep('busy');
      setCode('');
      if (rec.status === 'suspended') {
        refuse('suspended');
        return;
      }
      if (rec.displayName) {
        say([T.found]);
        await wait(900);
        if (!alive(me)) return;
        say([T.found, T.confirmed]);
        await wait(900);
        if (!alive(me)) return;
        fill(rec);
        await wait(1700);
        if (!alive(me)) return;
        say(T.welcome);
        await wait(2600);
        if (!alive(me)) return;
        void leave(me);
        return;
      }
      say([T.confirmed]);
      await wait(1000);
      if (!alive(me)) return;
      say([T.confirmed, T.none]);
      await wait(1000);
      if (!alive(me)) return;
      say([T.none, T.issueOne]);
      setStep('ask');
    },
    [fill, leave, refuse, say, wait],
  );

  /** After an authorization (a code, a link, another tab): read the record. */
  const opened = useCallback(
    async (me: number) => {
      const r = await access.record();
      if (!alive(me)) return;
      if (!r.ok) return refuse(r.why);
      if (!r.value) return refuse('interrupted');
      await confirmed(me, r.value);
    },
    [confirmed, refuse],
  );

  // The flows, for the effects below: they start them without depending on
  // them, so that nothing but arriving and leaving restarts an arrival.
  const flows = useRef({ confirmed, opened, refuse });
  useEffect(() => {
    flows.current = { confirmed, opened, refuse };
    stepNow.current = step;
  });

  // Arriving: the pieces come up; a session this browser already holds is
  // taken up as soon as they are there.
  useEffect(() => {
    if (confirming) return;
    const me = ++run.current;
    (async () => {
      if (!access.configured()) {
        await wait(0);
        if (alive(me)) setStep('holder');
        return;
      }
      const started = performance.now();
      const r = await access.record();
      if (!alive(me)) return;
      if (!r.ok || !r.value) {
        setStep('holder');
        return;
      }
      await wait(Math.max(0, STEP_IN - (performance.now() - started)));
      if (alive(me)) await flows.current.confirmed(me, r.value);
    })();
    return cancel;
  }, [confirming, cancel, wait]);

  // Back from the link: VERIFYING RECORD..., on black; then the terminal.
  useEffect(() => {
    if (!confirming) return;
    const me = ++run.current;
    (async () => {
      const link = readLink();
      const started = performance.now();
      const outcome: Outcome =
        link.error || !link.tokenHash || !link.type
          ? { ok: false, why: !link.error || link.error === 'otp_expired' || link.error === 'access_denied' ? 'expired' : 'interrupted' }
          : await verifyOnce(link.tokenHash, link.type);
      await wait(Math.max(0, 1500 - (performance.now() - started)));
      if (!alive(me)) return;
      setStep('busy');
      await wait(STEP_IN);
      if (!alive(me)) return;
      if (!outcome.ok) return flows.current.refuse(outcome.why);
      await flows.current.opened(me);
    })();
    return cancel;
  }, [confirming, cancel, wait]);

  // Waiting on the transmission: the link may be opened in another tab of
  // this browser — the session arrives here too — or the visitor comes back
  // to this one after it.
  const waiting = step === 'code' || step === 'holder';
  useEffect(() => {
    if (!waiting) return;
    const look = async () => {
      if (document.visibilityState !== 'visible') return;
      const at = stepNow.current;
      if (at !== 'code' && at !== 'holder') return;
      const r = await access.record();
      if (!r.ok || !r.value) return;
      if (stepNow.current !== at) return;
      await flows.current.confirmed(++run.current, r.value);
    };
    const stop = access.watch((open) => {
      if (open) void look();
    });
    const onFocus = () => void look();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      stop();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [waiting]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      cancel();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [cancel]);

  // The notice keeps clear of the form however many lines the terminal has.
  useEffect(() => {
    const el = form.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setFormH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  // Where the keyboard goes: the prompt that has just come up.
  useEffect(() => {
    if (!typed) return;
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? true;
    if (step === 'naming') nameInput.current?.focus({ preventScroll: true });
    else if (step === 'code' && fine) codeInput.current?.focus({ preventScroll: true });
    else if (step === 'ask' || step === 'again' || step === 'offline') {
      document.querySelector<HTMLButtonElement>('.login-choices button, .login-out .login-link')?.focus({ preventScroll: true });
    }
  }, [step, typed]);

  const submitAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 'holder') return;
    const a = address.trim();
    if (!a) {
      holderInput.current?.focus();
      return;
    }
    if (!isAddress(a)) {
      say(T.address, true);
      return;
    }
    const me = ++run.current;
    holderInput.current?.blur();
    sentTo.current = a;
    setHolder(a);
    setStep('busy');
    say([T.searching]);
    const [res] = await Promise.all([access.request(a), wait(1400)]);
    if (!alive(me)) return;
    if (!res.ok) return refuse(res.why);
    say(T.required);
    setStep('code');
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 'code' || !sentTo.current) return;
    if (!code.trim()) return;
    const me = ++run.current;
    codeInput.current?.blur();
    setStep('busy');
    say([T.verifying]);
    const r = await access.confirmCode(sentTo.current, code);
    if (!alive(me)) return;
    if (!r.ok) return refuse(r.why, 'code');
    await opened(me);
  };

  const submitName = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 'naming') return;
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 1 || clean.length > 40) {
      say([T.requested, T.nameRule], true);
      return;
    }
    const me = ++run.current;
    nameInput.current?.blur();
    setStep('busy');
    const r = await access.name(clean);
    if (!alive(me)) return;
    if (!r.ok) return refuse(r.why);
    say([T.created]);
    fill(r.value);
    await wait(2800);
    if (alive(me)) void leave(me);
  };

  const answer = useCallback(
    async (yes: boolean) => {
      const at = stepNow.current;
      if (at !== 'ask' && at !== 'again') return;
      const me = ++run.current;
      if (at === 'ask') {
        setStep('busy');
        if (yes) {
          say([T.requested]);
          await wait(1100);
          if (alive(me)) setStep('naming');
          return;
        }
        say([T.declined]);
        await access.close();
        await wait(1900);
        if (alive(me)) reset();
        return;
      }
      // AUTHORIZATION EXPIRED. REQUEST ANOTHER?
      if (!yes || !sentTo.current) {
        reset();
        return;
      }
      setStep('busy');
      say([T.searching]);
      const [res] = await Promise.all([access.request(sentTo.current), wait(1200)]);
      if (!alive(me)) return;
      if (!res.ok) return refuse(res.why);
      say(T.required);
      setStep('code');
    },
    [refuse, reset, say, wait],
  );

  // The keyboard, without a field: typing starts the Holder line; Y and N
  // answer the terminal's questions.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const at = stepNow.current;
      if (at === 'holder' && (e.key.length === 1 || e.key === 'Enter')) {
        if (e.key === 'Enter') e.preventDefault();
        holderInput.current?.focus({ preventScroll: true });
        return;
      }
      if ((at === 'ask' || at === 'again') && typed) {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          void answer(true);
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          void answer(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typed, answer]);

  const beginHere = () => {
    // The records are out of reach: the form, kept on this device.
    router.push('/apply?via=terminal');
  };

  if (step === 'verify') {
    return (
      <div className="login login-verify" data-standalone={standalone ? 'yes' : 'no'} role="status">
        <p className="login-verify-line">
          {T.verifying}
          <span className="login-caret" aria-hidden="true" />
        </p>
      </div>
    );
  }

  const editable = step === 'holder';
  const style = { '--form-h': `${formH}px` } as CSSProperties;

  return (
    <div
      className="login"
      role="region"
      aria-label={T.label}
      data-standalone={standalone ? 'yes' : 'no'}
      data-step={step}
      data-exit={step === 'leaving' ? 'yes' : 'no'}
      data-typing={focused ? 'yes' : 'no'}
      style={style}
    >
      <div className="login-frame" aria-hidden="true">
        <i className="login-frame-t" />
        <i className="login-frame-r" />
        <i className="login-frame-b" />
        <i className="login-frame-l" />
      </div>
      <img className="login-seal" src={SEAL.src} width={SEAL.width} height={SEAL.height} alt={T.sealAlt} draggable={false} />
      <div className="login-title" role="img" aria-label={T.titleText}>
        <img className="login-title-rest" src={TITLE.src} width={TITLE.width} height={TITLE.height} alt="" draggable={false} />
        <img className="login-title-cia" src={TITLE.src} width={TITLE.width} height={TITLE.height} alt="" draggable={false} />
        <svg className="login-star" viewBox={STAR.viewBox} aria-hidden="true" focusable="false">
          <path d={STAR.path} />
        </svg>
      </div>

      <div ref={form} className="login-form">
        <form
          className="login-field"
          onSubmit={submitAddress}
          onClick={() => {
            if (editable) holderInput.current?.focus();
          }}
          data-editable={editable ? 'yes' : 'no'}
        >
          {editable ? (
            <>
              <label htmlFor={ids.holder} className="login-key">
                {T.holder}
              </label>
              <span className="login-bar" data-on={focused === 'holder' || address ? 'yes' : 'no'}>
                <input
                  ref={holderInput}
                  id={ids.holder}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  maxLength={254}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setFocused('holder')}
                  onBlur={() => setFocused(null)}
                  aria-describedby={ids.help}
                />
              </span>
            </>
          ) : (
            <>
              <span className="login-key">{T.holder}</span>
              <span className="login-value">{holder ?? ''}</span>
            </>
          )}
        </form>
        <p id={ids.help} className="login-help" data-on={editable && focused === 'holder' ? 'yes' : 'no'}>
          {T.helper}
        </p>
        <p className="login-row">
          <span className="login-key">{T.clearance}</span> <span className="login-value">{clearance}</span>
        </p>
        {record ? (
          <p className="login-row login-row-record">
            <span className="login-key">{T.record}</span> <span className="login-value">{record}</span>
          </p>
        ) : null}

        <div className="login-out">
          <Log lines={log} reduced={reduced} onTyped={onTyped} />
          {typed && step === 'code' ? (
            <form className="login-prompt" onSubmit={submitCode}>
              <label htmlFor={ids.code}>{T.code}</label>
              <span className="login-bar login-bar-small" data-on="yes">
                <input
                  ref={codeInput}
                  id={ids.code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  enterKeyHint="go"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
                  onFocus={() => setFocused('code')}
                  onBlur={() => setFocused(null)}
                />
              </span>
            </form>
          ) : null}
          {typed && step === 'naming' ? (
            <form className="login-prompt" onSubmit={submitName}>
              <label htmlFor={ids.name}>{T.name}</label>
              <span className="login-bar login-bar-small" data-on="yes">
                <input
                  ref={nameInput}
                  id={ids.name}
                  autoComplete="nickname"
                  enterKeyHint="done"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                />
              </span>
            </form>
          ) : null}
          {typed && (step === 'ask' || step === 'again') ? (
            <p className="login-choices">
              <button type="button" onClick={() => void answer(true)}>
                {T.yes}
              </button>
              <button type="button" onClick={() => void answer(false)}>
                {T.no}
              </button>
            </p>
          ) : null}
          {typed && step === 'offline' ? (
            <button type="button" className="login-link" onClick={beginHere}>
              {T.beginHere}
            </button>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </div>
      </div>

      <div className="login-notice">
        {T.notice.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <img className="login-watermark" src={SEAL.src} width={SEAL.width} height={SEAL.height} alt="" aria-hidden="true" draggable={false} />
      <div className="login-station">
        {T.station.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="login-flash" aria-hidden="true" />
    </div>
  );
}
