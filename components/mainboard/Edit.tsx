'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EDIT, EDITOR, LINK, REWRITE } from '@/lib/mainboard/copy';
import { publicUrl, renewShareKey, saveEdit } from '@/lib/mainboard/data';
import type { Link as RecordLink, LinkKind, Visibility } from '@/lib/mainboard/types';
import Editor, { toDraft, toSaved, uid, VisibilityToggle, type EditorDraft } from './Editor';
import { useMine } from './Frame';

/**
 * EDIT — corrections, not a new version: a word in the current version, an
 * address, an order, who may see what; and the record's contact and privacy.
 * (A change of who you are is a REWRITE.)
 */

type Row = RecordLink & { uid: string };
const KINDS: LinkKind[] = ['email', 'phone', 'website', 'instagram', 'work', 'location', 'custom'];

export default function Edit() {
  const { mine, refresh } = useMine();
  const [draft, setDraft] = useState<EditorDraft>(() => toDraft(mine.current));
  const [links, setLinks] = useState<Row[]>(() => mine.links.map((l) => ({ ...l, uid: uid() })));
  const [history, setHistory] = useState<Visibility>(mine.historyVisibility);
  const [key, setKey] = useState(mine.shareKey);
  const [state, setState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);

  // Leaving with changes not kept: the browser asks.
  useEffect(() => {
    if (state !== 'dirty') return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [state]);

  const dirty = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setState('dirty');
  };

  const setLink = (i: number, patch: Partial<RecordLink>) => dirty(setLinks)(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const save = async () => {
    setState('saving');
    const r = await saveEdit(toSaved(draft), links, history);
    if (!r.ok) {
      setState('failed');
      return;
    }
    await refresh();
    setState('saved');
  };

  const renew = async () => {
    const r = await renewShareKey();
    if (r.ok) {
      setKey(r.value);
      await refresh();
    }
  };

  const shareUrl = publicUrl(mine.publicId, key);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* the address is on the screen to copy by hand */
    }
  };

  const status = state === 'saving' ? EDIT.saving : state === 'saved' ? EDIT.saved : state === 'dirty' ? EDIT.unsaved : state === 'failed' ? EDIT.failed : '';
  const saveBar = (
    <p className="mb-save">
      <button type="button" className="mb-action mb-action-lead" onClick={() => void save()} disabled={state === 'saving' || state === 'idle' || state === 'saved'}>
        {EDIT.save}
      </button>
      <span className="mb-status" role="status" aria-live="polite" data-state={state}>
        {status}
      </span>
    </p>
  );

  return (
    <section className="mb-page">
      <header className="mb-page-head">
        <h1 className="mb-title">{EDIT.title}</h1>
        <p className="mb-note">{EDIT.note}</p>
        {saveBar}
      </header>

      {mine.current ? (
        <Editor draft={draft} onChange={dirty(setDraft)} />
      ) : (
        <p className="mb-note mb-note-strong">
          {EDITOR.noVersion}{' '}
          <Link href="/record/rewrite" className="mb-action">
            {REWRITE.issue(1)}
          </Link>
        </p>
      )}

      <div className="mb-group" id="contact">
        <p className="mb-label">{EDITOR.contact}</p>
        <ol className="mb-links">
          {links.map((l, i) => (
            <li key={l.uid} className="mb-link">
              <select className="mb-select" value={l.kind} aria-label="Kind" onChange={(e) => setLink(i, { kind: e.target.value as LinkKind })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {LINK[k]}
                  </option>
                ))}
              </select>
              <input
                className="mb-input"
                value={l.value}
                placeholder={EDITOR.value}
                maxLength={500}
                aria-label={LINK[l.kind]}
                inputMode={l.kind === 'email' ? 'email' : l.kind === 'phone' ? 'tel' : l.kind === 'location' || l.kind === 'custom' ? 'text' : 'url'}
                onChange={(e) => setLink(i, { value: e.target.value })}
              />
              <VisibilityToggle value={l.visibility} onChange={(v) => setLink(i, { visibility: v })} label={`${LINK[l.kind]} — who may see it`} />
              <label className="mb-check">
                <input type="checkbox" checked={l.onExchange} onChange={(e) => setLink(i, { onExchange: e.target.checked })} />
                <span>{EDITOR.onExchange}</span>
              </label>
              <button type="button" className="mb-tool" onClick={() => dirty(setLinks)(links.filter((_, j) => j !== i))} aria-label={`${EDITOR.remove}: ${LINK[l.kind]}`}>
                {EDITOR.remove}
              </button>
            </li>
          ))}
        </ol>
        <p className="mb-add">
          <span className="mb-label">{EDITOR.addLink}</span>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() =>
                dirty(setLinks)([...links, { kind: k, label: null, value: '', visibility: k === 'email' || k === 'phone' ? 'private' : 'public', onExchange: false, uid: uid() }])
              }
            >
              {LINK[k]}
            </button>
          ))}
        </p>
      </div>

      <div className="mb-group" id="privacy">
        <p className="mb-label">{EDITOR.privacy}</p>
        <div className="mb-privacy">
          <p className="mb-privacy-row">
            <span>{EDITOR.history}</span>
            <VisibilityToggle value={history} onChange={dirty(setHistory)} label={EDITOR.history} />
          </p>
          <div className="mb-privacy-row mb-privacy-share">
            <span>{EDITOR.shareLink}</span>
            <code className="mb-code">{shareUrl}</code>
            <span className="mb-tools">
              <button type="button" onClick={() => void copy()}>
                {copied ? EDITOR.copied : EDITOR.copy}
              </button>
              <button type="button" onClick={() => void renew()}>
                {EDITOR.renew}
              </button>
            </span>
          </div>
          <p className="mb-hint">{EDITOR.shareNote}</p>
        </div>
      </div>

      <footer className="mb-page-foot">{saveBar}</footer>
    </section>
  );
}
