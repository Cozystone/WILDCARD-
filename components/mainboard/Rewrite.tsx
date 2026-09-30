'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { REWRITE } from '@/lib/mainboard/copy';
import { saveRewrite } from '@/lib/mainboard/data';
import Editor, { toDraft, toSaved, type EditorDraft } from './Editor';
import { useMine } from './Frame';

/**
 * REWRITE — a change of who you are, not a correction: version N+1, the
 * one before kept as it was. It asks first — HAS SOMETHING CHANGED? — and
 * takes NOT SURE for an answer (GOOD. UNCERTAINTY COUNTS.), and remembers
 * it did. The first version is written without the question.
 */
export default function Rewrite() {
  const router = useRouter();
  const { mine, refresh } = useMine();
  const first = !mine.current;
  const next = (mine.current?.number ?? 0) + 1;
  const [step, setStep] = useState<'ask' | 'good' | 'write' | 'done'>(first ? 'write' : 'ask');
  const [uncertain, setUncertain] = useState(false);
  const [draft, setDraft] = useState<EditorDraft>(() => toDraft(mine.current));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [written, setWritten] = useState(next);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const unsure = () => {
    setUncertain(true);
    setStep('good');
    timers.current.push(window.setTimeout(() => setStep('write'), 1900));
  };

  const issue = async () => {
    setBusy(true);
    setFailed(false);
    const r = await saveRewrite(toSaved(draft), uncertain);
    setBusy(false);
    if (!r.ok) {
      setFailed(true);
      return;
    }
    setWritten(r.value);
    setStep('done');
    await refresh();
    timers.current.push(window.setTimeout(() => router.push('/record'), 2400));
  };

  if (step === 'ask') {
    return (
      <section className="mb-question">
        <h1 className="mb-statement">
          {REWRITE.ask[0]}
          <br />
          {REWRITE.ask[1]}
        </h1>
        <div className="mb-actions mb-actions-big">
          <button type="button" className="mb-action mb-action-lead" onClick={() => setStep('write')}>
            {REWRITE.yes}
          </button>
          <button type="button" className="mb-action" onClick={unsure}>
            {REWRITE.unsure}
          </button>
        </div>
      </section>
    );
  }

  if (step === 'good') {
    return (
      <section className="mb-question" role="status">
        <h1 className="mb-statement">
          {REWRITE.good[0]}
          <br />
          {REWRITE.good[1]}
        </h1>
      </section>
    );
  }

  if (step === 'done') {
    const lines = REWRITE.written(written);
    return (
      <section className="mb-question" role="status">
        <h1 className="mb-statement">
          {lines[0]}
          <br />
          {lines[1]}
        </h1>
      </section>
    );
  }

  return (
    <section className="mb-page">
      <header className="mb-page-head">
        <h1 className="mb-title">{first ? REWRITE.first[0] : REWRITE.issue(next).replace('ISSUE ', '')}</h1>
        <p className="mb-note">{first ? REWRITE.firstNote : REWRITE.note}</p>
      </header>
      <Editor draft={draft} onChange={setDraft} disabled={busy} />
      <footer className="mb-page-foot">
        <p className="mb-save">
          <button type="button" className="mb-action mb-action-lead" onClick={() => void issue()} disabled={busy}>
            {REWRITE.issue(next)}
          </button>
          <span className="mb-status" role="status" aria-live="polite" data-state={failed ? 'failed' : 'idle'}>
            {failed ? REWRITE.failed : ''}
          </span>
        </p>
      </footer>
    </section>
  );
}
