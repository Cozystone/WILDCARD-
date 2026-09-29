'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Terminal from '@/components/Terminal';
import { FORM, SUBMIT } from '@/lib/apply/copy';
import { emptyApplication, SECTIONS, type Application } from '@/lib/apply/model';
import { getStore } from '@/lib/apply/store';
import { firstIncomplete, validate, type Errors } from '@/lib/apply/validate';
import Card from './Card';
import { Action } from './fields';
import {
  Author,
  Authority,
  CurrentRecord,
  Declaration,
  Header,
  NegativeSpace,
  PublicPrefs,
  Sensory,
  Unasked,
  VisualEvidence,
  VisualScreening,
} from './sections';

type Stage = 'boot' | 'form' | 'processing' | 'accepted';

/** The screens, in order. 0 is the header; 1–7 the sections; 8–10 are the
 *  rest of 07 (authority, preferences, declaration), so the status line
 *  never goes past 07/07. */
const SCREENS = [Header, Author, CurrentRecord, VisualEvidence, VisualScreening, Sensory, NegativeSpace, Unasked, Authority, PublicPrefs, Declaration] as const;
const LAST = SCREENS.length - 1;

const statusOf = (s: number) => (s === 0 ? 'INTRO' : `SECTION ${String(Math.min(s, 7)).padStart(2, '0')}/07`);
const titleOf = (s: number) => (s === 0 ? null : SECTIONS[Math.min(s, 7) - 1]);

/**
 * FORM W*–01 — the application, as an old terminal would run it.
 *
 * It boots with the film's opening, screen by screen (skipped when the
 * visitor has just read it on the Macintosh, `?via=terminal`), and goes
 * straight into the form — or offers a draft, if there is one — then runs
 * as one long form in screens: the header, seven sections, and the
 * three screens that close section 07. Only the status line at the foot
 * says where you are. Every change is kept — after a moment, in the
 * store, and the status line says DRAFT SAVED — so a refresh or a return
 * picks up where it was. CONTINUE checks the screen; ISSUE ME* checks
 * everything and goes back to the first thing missing. On issue the
 * interface goes dark, the evidence is processed, the number is given,
 * and the blank card goes into the slot.
 *
 * There is no backend yet: the store is local (lib/apply/store.ts) and
 * stands where a server will.
 */
export default function Apply() {
  const [stage, setStage] = useState<Stage>('boot');
  const [app, setApp] = useState<Application>(() => emptyApplication());
  const [draft, setDraft] = useState(false);
  const [section, setSection] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState<keyof typeof FORM.status | null>(null);
  const [filed, setFiled] = useState<Application | null>(null);
  const [issued, setIssued] = useState(false);
  /** The film's opening has been read — here, or on the Macintosh. */
  const [booted, setBooted] = useState(false);
  /** The store has been asked for a draft. */
  const [loaded, setLoaded] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | null>(null);
  const first = useRef(true);

  // Arriving from the Macintosh, the opening has just been read: skip it.
  // A draft from before?
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('via') === 'terminal') {
      setBooted(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
    getStore()
      .load()
      .then((d) => {
        if (d) {
          setApp(d);
          setDraft(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Keep it, a moment after each change.
  useEffect(() => {
    if (stage !== 'form') return;
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      getStore()
        .save({ ...app, section })
        .then(() => setSaved('saved'))
        .catch(() => setSaved('unsaved'));
    }, 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [app, section, stage]);

  // Each screen starts at the top, with its heading read out.
  useEffect(() => {
    if (stage !== 'form') return;
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [section, stage]);

  const begin = useCallback(() => {
    // The name the login was given, if the visitor came through it.
    const fresh = emptyApplication();
    try {
      const holder = window.sessionStorage.getItem('wildcard.holder');
      if (holder) {
        fresh.author.preferredName = holder;
        window.sessionStorage.removeItem('wildcard.holder');
      }
    } catch {
      /* no carried name */
    }
    setApp(fresh);
    setSection(0);
    setErrors({});
    setSaved(null);
    setStage('form');
  }, []);

  const resume = useCallback(() => {
    setSection(Math.min(app.section, LAST));
    setErrors({});
    setSaved('restored');
    setStage('form');
  }, [app.section]);

  // After the opening, straight into the form — unless there is a draft,
  // which is offered first.
  useEffect(() => {
    if (stage === 'boot' && booted && loaded && !draft) begin();
  }, [stage, booted, loaded, draft, begin]);

  const focusError = () => {
    window.setTimeout(() => {
      const bad = document.querySelector<HTMLElement>('[aria-invalid="true"], .tty-error');
      bad?.focus?.();
      bad?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }, 30);
  };

  const next = useCallback(() => {
    const e = validate(app, section);
    if (Object.keys(e).length) {
      setErrors(e);
      focusError();
      return;
    }
    setErrors({});
    setSection((s) => Math.min(LAST, s + 1));
  }, [app, section]);

  const back = useCallback(() => {
    setErrors({});
    setSection((s) => Math.max(0, s - 1));
  }, []);

  const issue = useCallback(() => {
    const e = validate(app, LAST);
    if (Object.keys(e).length) {
      setErrors(e);
      focusError();
      return;
    }
    const missing = firstIncomplete(app);
    if (missing) {
      setSection(missing);
      setErrors(validate(app, missing));
      focusError();
      return;
    }
    setStage('processing');
    window.setTimeout(() => {
      getStore()
        .submit({ ...app, section: LAST })
        .then((f) => {
          setFiled(f);
          setStage('accepted');
          window.setTimeout(() => setIssued(true), 2200);
        })
        .catch(() => setStage('form'));
    }, 2600);
  }, [app]);

  const Screen = SCREENS[section];
  const title = titleOf(section);

  return (
    <div className="tty" data-stage={stage}>
      <div className="tty-grain" aria-hidden="true" />
      <div className="tty-lines" aria-hidden="true" />

      <Link href="/" className="tty-close">
        {FORM.close}
      </Link>

      {stage === 'boot' ? (
        <div className="tty-centre tty-boot">
          {!booted ? (
            <Terminal
              className="tty-type"
              screens={FORM.boot}
              holds={FORM.bootHolds}
              active
              delay={0.8}
              cps={11}
              onDone={() => setBooted(true)}
            />
          ) : draft ? (
            <div className="tty-type">
              <div className="terminal-line">
                {FORM.draftFound}
                <span className="terminal-cursor" data-idle="yes" aria-hidden="true" />
              </div>
              <div className="tty-boot-actions">
                <button type="button" className="tty-btn tty-btn-primary" onClick={resume}>
                  {FORM.resume}
                </button>
                <button type="button" className="tty-btn" onClick={begin}>
                  {FORM.begin}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {stage === 'form' ? (
        <main className="tty-main">
          <div className="tty-col">
            <div ref={heading} tabIndex={-1} className="tty-head" aria-live="polite">
              <span className="tty-label">
                {FORM.code}
                {title ? ` · SECTION ${String(title.n).padStart(2, '0')}` : ''}
              </span>
              {title ? <h2 className="tty-section-title">{title.title}</h2> : null}
            </div>
            <div key={section} className="tty-screen">
              <Screen app={app} onChange={setApp} errors={errors} />
            </div>
            <nav className="tty-nav" aria-label="Form">
              {section > 0 ? <Action onClick={back}>{FORM.nav.back}</Action> : <span />}
              {section === 0 ? (
                <Action onClick={next} primary>
                  {FORM.nav.begin}
                </Action>
              ) : section < LAST ? (
                <Action onClick={next} primary>
                  {FORM.nav.next}
                </Action>
              ) : (
                <Action onClick={issue} primary>
                  {FORM.nav.issue}
                </Action>
              )}
            </nav>
          </div>
          <aside className="tty-aside" aria-hidden="true">
            <Card state="idle" />
          </aside>
        </main>
      ) : null}

      {stage === 'processing' ? (
        <div className="tty-centre tty-dark">
          <p className="tty-type">
            {SUBMIT.processing}
            <span className="terminal-cursor" data-idle="yes" aria-hidden="true" />
          </p>
        </div>
      ) : null}

      {stage === 'accepted' && filed ? (
        <div className="tty-centre tty-dark tty-accepted">
          <Card state={issued ? 'issued' : 'issuing'} number={filed.applicationNumber} />
          {issued ? (
            <Terminal className="tty-type" lines={[SUBMIT.accepted(filed.applicationNumber ?? ''), SUBMIT.enough, SUBMIT.from]} active delay={0.3} cps={20}>
              <div className="tty-boot-actions">
                <p className="tty-label">
                  {SUBMIT.number} {filed.applicationNumber}
                </p>
                <Link href="/" className="tty-btn">
                  {SUBMIT.back}
                </Link>
              </div>
            </Terminal>
          ) : null}
        </div>
      ) : null}

      <footer className="tty-status" aria-live="polite">
        <span>{FORM.code}</span>
        <span>{stage === 'form' ? statusOf(section) : stage === 'accepted' ? 'FILED' : stage === 'processing' ? 'PROCESSING' : 'SYSTEM ONLINE'}</span>
        <span>{saved ? FORM.status[saved] : ''}</span>
      </footer>
    </div>
  );
}
