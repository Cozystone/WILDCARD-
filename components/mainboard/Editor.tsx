'use client';

import { useEffect, useId, useRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { EDITOR, SECTION, VISIBILITY } from '@/lib/mainboard/copy';
import type { Draft } from '@/lib/mainboard/data';
import { two } from '@/lib/mainboard/format';
import type { Section, SectionKind, Version, Visibility } from '@/lib/mainboard/types';

/**
 * The writing surface shared by EDIT and REWRITE: the statement, the intro,
 * and the sections — each with who may see it. No boxes: labels in small
 * type, the writing in the record's face, a rule under what is being
 * written. Sections move up and down, go, come in from the record's kinds or
 * under a label of the holder's own.
 */

export type DraftSection = Section & { uid: string };
export type EditorDraft = Omit<Draft, 'sections'> & { sections: DraftSection[] };

let uids = 0;
export const uid = () => `s${++uids}`;

export const toDraft = (v: Version | null): EditorDraft => ({
  statement: v?.statement ?? '',
  statementVisibility: v?.statementVisibility ?? 'public',
  intro: v?.intro ?? '',
  introVisibility: v?.introVisibility ?? 'public',
  sections: (v?.sections ?? []).map((s) => ({ ...s, uid: uid() })),
});

export const toSaved = (d: EditorDraft): Draft => ({
  ...d,
  sections: d.sections.map(({ kind, label, body, visibility }) => ({ kind, label, body, visibility })),
});

const KINDS: SectionKind[] = ['currently', 'i_care_about', 'current_obsession', 'dont_reduce_me_to', 'object', 'sound', 'unasked', 'custom'];
const LEVELS: Visibility[] = ['public', 'link_only', 'private'];

/** PUBLIC · LINK-ONLY · PRIVATE — one of three, in small type. */
export function VisibilityToggle({ value, onChange, label }: { value: Visibility; onChange: (v: Visibility) => void; label: string }) {
  return (
    <span role="radiogroup" aria-label={label} className="mb-vis">
      {LEVELS.map((v) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} data-on={value === v ? 'yes' : 'no'} onClick={() => onChange(v)}>
          {VISIBILITY[v]}
        </button>
      ))}
    </span>
  );
}

/** A textarea that grows with what is written in it. */
export function Grow(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const el = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const t = el.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={el} rows={1} {...props} />;
}

function Entry({
  label,
  hint,
  visibility,
  onVisibility,
  children,
  id,
}: {
  label: string;
  hint?: string;
  visibility: Visibility;
  onVisibility: (v: Visibility) => void;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="mb-entry">
      <div className="mb-entry-head">
        <label className="mb-label" htmlFor={id}>
          {label}
        </label>
        <VisibilityToggle value={visibility} onChange={onVisibility} label={`${label} — who may see it`} />
      </div>
      {children}
      {hint ? <p className="mb-hint">{hint}</p> : null}
    </div>
  );
}

export default function Editor({ draft, onChange, disabled = false }: { draft: EditorDraft; onChange: (d: EditorDraft) => void; disabled?: boolean }) {
  const ids = { statement: useId(), intro: useId() };
  const set = (patch: Partial<EditorDraft>) => onChange({ ...draft, ...patch });
  const setSection = (i: number, patch: Partial<Section>) =>
    set({ sections: draft.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const move = (i: number, by: number) => {
    const next = [...draft.sections];
    const [s] = next.splice(i, 1);
    next.splice(i + by, 0, s);
    set({ sections: next });
  };
  const remove = (i: number) => set({ sections: draft.sections.filter((_, j) => j !== i) });
  const add = (kind: SectionKind) =>
    set({ sections: [...draft.sections, { kind, label: kind === 'custom' ? '' : null, body: '', visibility: 'public', uid: uid() }] });
  const used = new Set(draft.sections.map((s) => s.kind));

  return (
    <fieldset className="mb-editor" disabled={disabled}>
      <Entry
        id={ids.statement}
        label={EDITOR.statement}
        hint={EDITOR.statementHint}
        visibility={draft.statementVisibility}
        onVisibility={(v) => set({ statementVisibility: v })}
      >
        <Grow
          id={ids.statement}
          className="mb-input mb-input-statement"
          value={draft.statement}
          maxLength={2000}
          onChange={(e) => set({ statement: e.target.value })}
        />
      </Entry>

      <Entry id={ids.intro} label={EDITOR.intro} hint={EDITOR.introHint} visibility={draft.introVisibility} onVisibility={(v) => set({ introVisibility: v })}>
        <input id={ids.intro} className="mb-input" value={draft.intro} maxLength={280} onChange={(e) => set({ intro: e.target.value })} />
      </Entry>

      <div className="mb-group">
        <p className="mb-label">{EDITOR.sections}</p>
        <ol className="mb-sections">
          {draft.sections.map((s, i) => {
            const title = s.kind === 'custom' ? s.label || EDITOR.ownLabel : SECTION[s.kind];
            return (
              <li key={s.uid} className="mb-section">
                <div className="mb-section-head">
                  <span className="mb-n">{two(i + 1)}</span>
                  {s.kind === 'custom' ? (
                    <input
                      className="mb-input mb-input-label"
                      value={s.label ?? ''}
                      placeholder={EDITOR.ownLabel}
                      maxLength={60}
                      aria-label={EDITOR.ownLabel}
                      onChange={(e) => setSection(i, { label: e.target.value.toUpperCase() })}
                    />
                  ) : (
                    <span className="mb-section-kind">{SECTION[s.kind]}</span>
                  )}
                  <VisibilityToggle value={s.visibility} onChange={(v) => setSection(i, { visibility: v })} label={`${title} — who may see it`} />
                  <span className="mb-tools">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${EDITOR.up}: ${title}`}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === draft.sections.length - 1} aria-label={`${EDITOR.down}: ${title}`}>
                      ↓
                    </button>
                    <button type="button" onClick={() => remove(i)} aria-label={`${EDITOR.remove}: ${title}`}>
                      {EDITOR.remove}
                    </button>
                  </span>
                </div>
                <Grow
                  className="mb-input"
                  value={s.body}
                  placeholder={EDITOR.body}
                  maxLength={4000}
                  aria-label={title}
                  onChange={(e) => setSection(i, { body: e.target.value })}
                />
              </li>
            );
          })}
        </ol>
        <p className="mb-add">
          <span className="mb-label">{EDITOR.addSection}</span>
          {KINDS.filter((k) => k === 'custom' || !used.has(k)).map((k) => (
            <button key={k} type="button" onClick={() => add(k)}>
              {SECTION[k]}
            </button>
          ))}
        </p>
      </div>
    </fieldset>
  );
}
