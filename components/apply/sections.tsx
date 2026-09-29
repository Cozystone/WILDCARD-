'use client';

import { FORM, S01, S02, S03, S05, S06, S07 } from '@/lib/apply/copy';
import { TENSIONS, TRACE_KINDS, tensionKey, type Application, type Evidence, type TraceKind } from '@/lib/apply/model';
import type { Errors } from '@/lib/apply/validate';
import { Area, Check, Choice, Field, TensionControl, Upload, Voice } from './fields';
import Screening from './Screening';

type SectionProps = {
  app: Application;
  onChange: (next: Application) => void;
  errors: Errors;
};

/* Section 00 — the application header: what this is, and what it is not. */
export function Header() {
  return (
    <div className="tty-section">
      <p className="tty-label">{FORM.code}</p>
      <h1 className="tty-title">{FORM.title}</h1>
      <p className="tty-headline">{FORM.headline}</p>
      <dl className="tty-benefits">
        {FORM.benefits.map(([head, body]) => (
          <div key={head} className="tty-benefit">
            <dt>{head}</dt>
            <dd>{body}</dd>
          </div>
        ))}
      </dl>
      <div className="tty-disclaimers">
        {FORM.disclaimers.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="tty-asks">{FORM.asks}</p>
      </div>
    </div>
  );
}

/* Section 01 — AUTHOR OF RECORD. */
export function Author({ app, onChange, errors }: SectionProps) {
  const a = app.author;
  const set = (k: keyof typeof a, v: string) => onChange({ ...app, author: { ...a, [k]: v } });
  return (
    <div className="tty-section">
      <p className="tty-copy">
        {S01.helper[0]}
        <br />
        {S01.helper[1]}
      </p>
      <div className="tty-grid-2">
        <Field label={S01.fields.name} value={a.name} onChange={(v) => set('name', v)} error={errors['author.name']} autoComplete="name" />
        <Field label={S01.fields.preferredName} value={a.preferredName} onChange={(v) => set('preferredName', v)} error={errors['author.preferredName']} autoComplete="nickname" />
        <Field label={S01.fields.cardName} value={a.cardName} onChange={(v) => set('cardName', v)} error={errors['author.cardName']} maxLength={40} />
        <Field label={S01.fields.otherNames} value={a.otherNames} onChange={(v) => set('otherNames', v)} optional />
        <Field label={S01.fields.language} value={a.language} onChange={(v) => set('language', v)} error={errors['author.language']} autoComplete="language" />
        <Field label={S01.fields.city} value={a.city} onChange={(v) => set('city', v)} error={errors['author.city']} autoComplete="address-level2" />
        <Field label={S01.fields.country} value={a.country} onChange={(v) => set('country', v)} error={errors['author.country']} autoComplete="country-name" />
        <Field label={S01.fields.email} value={a.email} onChange={(v) => set('email', v)} error={errors['author.email']} type="email" autoComplete="email" />
      </div>
    </div>
  );
}

/* Section 02 — CURRENT RECORD: eight large entries. */
export function CurrentRecord({ app, onChange, errors }: SectionProps) {
  const c = app.currentRecord;
  const set = (k: keyof typeof c, v: string) => onChange({ ...app, currentRecord: { ...c, [k]: v } });
  const name = app.author.preferredName.trim();
  return (
    <div className="tty-section">
      {name ? (
        <p className="tty-wake" aria-live="polite">
          {FORM.wake(name)[0]}
          <br />
          {FORM.wake(name)[1]}
        </p>
      ) : null}
      <div className="tty-stack">
        {S02.questions.map(([key, q]) => (
          <Area key={key} label={q} value={c[key]} onChange={(v) => set(key, v)} error={errors[`currentRecord.${key}`]} limit={S02.limit} />
        ))}
        <Area label={`Complete: “${S02.complete} __________.”`} prefix={`${S02.complete} `} value={c.rightNow} onChange={(v) => set('rightNow', v)} error={errors['currentRecord.rightNow']} limit={160} rows={2} />
      </div>
    </div>
  );
}

/* Section 03 — VISUAL EVIDENCE: five, and the fifth without a word. */
export function VisualEvidence({ app, onChange, errors }: SectionProps) {
  const slots = app.visualEvidence;
  const setSlot = (i: number, patch: Partial<(typeof slots)[number]>) => {
    const next = slots.map((s, k) => (k === i ? { ...s, ...patch } : s)) as typeof slots;
    onChange({ ...app, visualEvidence: next });
  };
  return (
    <div className="tty-section">
      <h2 className="tty-h2">{S03.title}</h2>
      <p className="tty-copy">
        {S03.copy[0]}
        <br />
        {S03.copy[1]}
      </p>
      {errors.section ? (
        <p className="tty-error" role="alert">
          {errors.section}
        </p>
      ) : null}
      <ol className="tty-evidence">
        {S03.slots.map((title, i) => (
          <li key={title} className="tty-evidence-slot">
            <Upload
              label={
                <>
                  <span className="tty-num">{String(i + 1).padStart(2, '0')}</span> — {title}
                </>
              }
              file={slots[i].file}
              onFile={(f: Evidence | null) => setSlot(i, { file: f })}
              prefix={`evidence-${i + 1}`}
            />
            {i < 4 ? (
              <Field label={S03.note} value={slots[i].note} onChange={(v) => setSlot(i, { note: v })} optional maxLength={S03.noteLimit} />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* Section 04 — VISUAL SCREENING. */
export function VisualScreening({ app, onChange, errors }: SectionProps) {
  return (
    <div className="tty-section">
      {errors.section ? (
        <p className="tty-error" role="alert">
          {errors.section}
        </p>
      ) : null}
      <Screening decisions={app.visualScreening} onChange={(d) => onChange({ ...app, visualScreening: d })} />
    </div>
  );
}

/* Section 05 — SENSORY RECORD + CONTRADICTIONS. */
export function Sensory({ app, onChange, errors }: SectionProps) {
  const s = app.sensoryRecord;
  const set = (k: keyof typeof s, v: string) => onChange({ ...app, sensoryRecord: { ...s, [k]: v } });
  return (
    <div className="tty-section">
      <div className="tty-grid-2">
        {S05.fields.map(([key, label]) => (
          <Field key={key} label={label} value={s[key]} onChange={(v) => set(key, v)} error={errors[`sensoryRecord.${key}`]} />
        ))}
      </div>
      <Upload label={S05.objectImage} file={s.objectImage} onFile={(f) => onChange({ ...app, sensoryRecord: { ...s, objectImage: f } })} prefix="object" optional />

      <h2 className="tty-h2 tty-h2-space">{S05.tensions}</h2>
      <p className="tty-copy">{S05.tensionsCopy}</p>
      {errors.contradictions ? (
        <p className="tty-error" role="alert">
          {errors.contradictions}
        </p>
      ) : null}
      <div className="tty-tensions">
        {TENSIONS.map((pair) => {
          const key = tensionKey(pair);
          return (
            <TensionControl
              key={key}
              left={pair[0]}
              right={pair[1]}
              both={S05.both}
              value={app.contradictions[key]}
              onChange={(v) => onChange({ ...app, contradictions: { ...app.contradictions, [key]: v } })}
            />
          );
        })}
      </div>
    </div>
  );
}

/* Section 06 — NEGATIVE SPACE + TRACES. */
export function NegativeSpace({ app, onChange, errors }: SectionProps) {
  const n = app.negativeSpace;
  const set = (k: keyof typeof n, v: string) => onChange({ ...app, negativeSpace: { ...n, [k]: v } });
  const setNever = (i: number, v: string) => {
    const never = [...n.never] as [string, string, string];
    never[i] = v;
    onChange({ ...app, negativeSpace: { ...n, never } });
  };
  const traces = app.lifeTraces;
  const setTrace = (i: number, kind: TraceKind, file: Evidence | null) => {
    const next = [...traces];
    if (file) next[i] = { kind, file };
    else next.splice(i, 1);
    onChange({ ...app, lifeTraces: next });
  };
  const rows = Math.min(3, traces.length + 1);
  return (
    <div className="tty-section">
      <div className="tty-stack">
        <Area label={S06.questions[0][1]} value={n.notBeautiful} onChange={(v) => set('notBeautiful', v)} error={errors['negativeSpace.notBeautiful']} limit={400} rows={3} />
        <fieldset className="tty-field">
          <legend className="tty-label">{S06.never}</legend>
          <div className="tty-grid-3">
            {n.never.map((v, i) => (
              <Field key={i} label={String(i + 1).padStart(2, '0')} value={v} onChange={(x) => setNever(i, x)} maxLength={80} />
            ))}
          </div>
          {errors['negativeSpace.never'] ? (
            <p className="tty-error" role="alert">
              {errors['negativeSpace.never']}
            </p>
          ) : null}
        </fieldset>
        {S06.questions.slice(1).map(([key, q]) => (
          <Field key={key} label={q} value={n[key]} onChange={(v) => set(key, v)} error={errors[`negativeSpace.${key}`]} />
        ))}
      </div>

      <h2 className="tty-h2 tty-h2-space">{S06.traces}</h2>
      <p className="tty-copy">{S06.tracesCopy}</p>
      <div className="tty-traces">
        {Array.from({ length: rows }, (_, i) => {
          const t = traces[i];
          return (
            <div key={t ? t.file.key : `new-${i}`} className="tty-trace">
              <Choice<TraceKind>
                label={S06.traceKind}
                options={TRACE_KINDS.map((k) => [k, k.toUpperCase()] as const)}
                value={t?.kind ?? null}
                onChange={(kind) => (t ? setTrace(i, kind, t.file) : onChange({ ...app, lifeTraces: [...traces] }))}
                inline
              />
              <Upload label={`TRACE ${String(i + 1).padStart(2, '0')}`} file={t?.file ?? null} onFile={(f) => setTrace(i, t?.kind ?? 'other', f)} prefix={`trace-${i + 1}`} optional />
            </div>
          );
        })}
      </div>

      <h2 className="tty-h2 tty-h2-space">
        {S06.voice} <span className="tty-optional">· {S06.optional} · {S06.voiceLimit}s</span>
      </h2>
      <p className="tty-copy">
        {S06.voiceCopy[0]}
        <br />
        {S06.voiceCopy[1]}
      </p>
      <Voice file={app.voice} onFile={(f) => onChange({ ...app, voice: f })} prefix="voice" limit={S06.voiceLimit} record={S06.record} stop={S06.stop} uploadLabel={S06.upload} />
    </div>
  );
}

/* Section 07 — THE UNASKED. */
export function Unasked({ app, onChange, errors }: SectionProps) {
  const u = app.unasked;
  return (
    <div className="tty-section tty-section-unasked">
      <h2 className="tty-big">
        {S07.title[0]}
        <br />
        {S07.title[1]}
      </h2>
      <Choice
        label=""
        options={S07.modes}
        value={u.mode}
        onChange={(mode) => onChange({ ...app, unasked: { ...u, mode } })}
        error={errors['unasked.mode']}
        inline
      />
      {u.mode === 'text' ? (
        <Area label="" value={u.text} onChange={(v) => onChange({ ...app, unasked: { ...u, text: v } })} error={errors['unasked.text']} limit={2000} rows={8} />
      ) : null}
      {u.mode === 'image' ? (
        <Upload label="" file={u.image} onFile={(f) => onChange({ ...app, unasked: { ...u, image: f } })} prefix="unasked" error={errors['unasked.image']} />
      ) : null}
      {u.mode === 'audio' ? (
        <Voice file={u.audio} onFile={(f) => onChange({ ...app, unasked: { ...u, audio: f } })} prefix="unasked-audio" limit={S06.voiceLimit} record={S06.record} stop={S06.stop} uploadLabel={S06.upload} error={errors['unasked.audio']} />
      ) : null}
    </div>
  );
}

/* Section 07, continued — DESIGN AUTHORITY. */
export function Authority({ app, onChange, errors }: SectionProps) {
  const c = app.consents;
  return (
    <div className="tty-section">
      <h2 className="tty-h2">{S07.authority.title}</h2>
      <p className="tty-copy">
        {S07.authority.copy[0]}
        <br />
        {S07.authority.copy[1]}
      </p>
      <div className="tty-acks">
        {S07.authority.acks.map(([key, text]) => (
          <Check key={key} label={text} checked={c[key]} onChange={(v) => onChange({ ...app, consents: { ...c, [key]: v } })} />
        ))}
        {errors.acks ? (
          <p className="tty-error" role="alert">
            {errors.acks}
          </p>
        ) : null}
      </div>
      <p className="tty-close-lines">
        {S07.authority.close[0]}
        <br />
        {S07.authority.close[1]}
      </p>
    </div>
  );
}

/* Section 07, continued — PUBLIC CARD / NFC PREFERENCES: permissions only. */
export function PublicPrefs({ app, onChange, errors }: SectionProps) {
  const p = app.publicPreferences;
  return (
    <div className="tty-section">
      <h2 className="tty-h2">{S07.public.title}</h2>
      <p className="tty-copy">{S07.public.copy}</p>
      <div className="tty-acks">
        {S07.public.toggles.map(([key, text]) => (
          <Check key={key} label={text} checked={p[key]} onChange={(v) => onChange({ ...app, publicPreferences: { ...p, [key]: v } })} />
        ))}
      </div>
      <Choice
        label={S07.public.visibility}
        options={S07.public.visibilities}
        value={p.visibility}
        onChange={(visibility) => onChange({ ...app, publicPreferences: { ...p, visibility } })}
        error={errors.visibility}
        inline
      />
      <p className="tty-copy tty-copy-small">{S07.public.shipping}</p>
    </div>
  );
}

/* Section 07, last — DECLARATION OF AUTHORSHIP. */
export function Declaration({ app, onChange, errors }: SectionProps) {
  const c = app.consents;
  const d = S07.declaration;
  return (
    <div className="tty-section">
      <p className="tty-label">{d.read}</p>
      <h2 className="tty-h2">{d.title}</h2>
      <p className="tty-copy">{d.lead}</p>
      <ol className="tty-declaration">
        {d.items.map((text, i) => (
          <li key={text}>
            <span className="tty-num">{String(i + 1).padStart(2, '0')}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <div className="tty-acks">
        {d.checks.map(([key, text]) => (
          <Check key={key} label={text} checked={c[key]} onChange={(v) => onChange({ ...app, consents: { ...c, [key]: v } })} />
        ))}
        {errors.declaration ? (
          <p className="tty-error" role="alert">
            {errors.declaration}
          </p>
        ) : null}
      </div>
    </div>
  );
}
