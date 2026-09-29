'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { S03 } from '@/lib/apply/copy';
import type { Evidence, Tension } from '@/lib/apply/model';
import { checkFile, fileKey, getStore } from '@/lib/apply/store';

/*
 * The form's controls, in the terminal's hand: a label in small capitals,
 * the entry on a rule, the error under it in the one red the form allows.
 * Every control is labelled for a screen reader; nothing is said by colour
 * alone — an error is a word, a choice is a mark in a bracket.
 */

export function Label({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="tty-label">
      {children}
      {optional ? <span className="tty-optional"> · OPTIONAL</span> : null}
    </label>
  );
}

export function Err({ id, children }: { id?: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="tty-error" role="alert">
      {children}
    </p>
  );
}

export function Field({
  label,
  value,
  onChange,
  error,
  optional,
  type = 'text',
  autoComplete,
  maxLength = 120,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  type?: 'text' | 'email';
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="tty-field">
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        className="tty-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        spellCheck={false}
      />
      <Err id={`${id}-err`}>{error}</Err>
    </div>
  );
}

/** A large entry: a question, room to answer, and a count that keeps out of the way. */
export function Area({
  label,
  value,
  onChange,
  error,
  limit = 600,
  rows = 4,
  optional,
  prefix,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  limit?: number;
  rows?: number;
  optional?: boolean;
  prefix?: string;
}) {
  const id = useId();
  return (
    <div className="tty-field tty-field-area">
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <div className="tty-area-wrap">
        {prefix ? <span className="tty-prefix">{prefix}</span> : null}
        <textarea
          id={id}
          className="tty-area"
          value={value}
          rows={rows}
          maxLength={limit}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          spellCheck={false}
        />
      </div>
      <div className="tty-meta">
        <span className="tty-count" aria-hidden="true">
          {value.length > limit * 0.7 ? `${value.length} / ${limit}` : ''}
        </span>
      </div>
      <Err id={`${id}-err`}>{error}</Err>
    </div>
  );
}

/** One of several: ( ) PUBLIC  (•) LINK-ONLY  ( ) PRIVATE. */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  inline,
}: {
  label: ReactNode;
  options: readonly (readonly [T, string])[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
  inline?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="tty-field" aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="tty-label">{label}</legend>
      <div className={inline ? 'tty-options tty-options-inline' : 'tty-options'}>
        {options.map(([v, text]) => (
          <label key={v} className="tty-option" data-on={value === v ? 'yes' : 'no'}>
            <input type="radio" name={id} value={v} checked={value === v} onChange={() => onChange(v)} className="tty-native" />
            <span className="tty-mark" aria-hidden="true">
              {value === v ? '(•)' : '( )'}
            </span>
            <span>{text}</span>
          </label>
        ))}
      </div>
      <Err id={`${id}-err`}>{error}</Err>
    </fieldset>
  );
}

/** Yes or no: [x] / [ ]. */
export function Check({ label, checked, onChange, error }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  const id = useId();
  return (
    <div className="tty-check-row">
      <label className="tty-option" data-on={checked ? 'yes' : 'no'} htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="tty-native" />
        <span className="tty-mark" aria-hidden="true">
          {checked ? '[x]' : '[ ]'}
        </span>
        <span>{label}</span>
      </label>
      <Err>{error}</Err>
    </div>
  );
}

/** A tension: LEFT — BOTH — RIGHT, one of the three, on a rule between the two words. */
export function TensionControl({
  left,
  right,
  value,
  onChange,
  both,
}: {
  left: string;
  right: string;
  value: Tension;
  onChange: (v: Tension) => void;
  both: string;
}) {
  const id = useId();
  const opts: [Tension, string][] = [
    ['left', left],
    ['both', both],
    ['right', right],
  ];
  return (
    <fieldset className="tty-tension" data-value={value ?? 'none'}>
      <legend className="sr-only">
        {left} or {right}
      </legend>
      {opts.map(([v, text]) => (
        <label key={v} className="tty-tension-opt" data-on={value === v ? 'yes' : 'no'} data-side={v ?? undefined}>
          <input type="radio" name={id} value={v ?? ''} checked={value === v} onChange={() => onChange(v)} className="tty-native" />
          <span className="tty-mark" aria-hidden="true">
            {value === v ? '(•)' : '( )'}
          </span>
          <span>{text}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** A thumbnail for a stored file, from the private store. */
export function Thumb({ file, alt = '' }: { file: Evidence | null; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    let obj: string | null = null;
    if (file) {
      getStore()
        .getFile(file.key)
        .then((blob) => {
          if (!live || !blob) return;
          obj = URL.createObjectURL(blob);
          setUrl(obj);
        })
        .catch(() => {});
    }
    return () => {
      live = false;
      if (obj) URL.revokeObjectURL(obj);
      // The next file shows nothing until it is read, not the last one.
      setUrl(null);
    };
  }, [file]);
  if (!file) return null;
  if (file.type.startsWith('audio/')) {
    return url ? <audio className="tty-audio" controls src={url} aria-label={alt || file.name} /> : null;
  }
  return url ? <img className="tty-thumb" src={url} alt={alt} draggable={false} /> : <div className="tty-thumb tty-thumb-empty" />;
}

/**
 * An image in, by drop or by press. The file goes to the private store as
 * it is read, with the read's progress shown as a rule filling; then the
 * picture, with REPLACE and REMOVE. Nothing about it says "upload".
 */
export function Upload({
  label,
  file,
  onFile,
  prefix,
  kind = 'image',
  error,
  optional,
  hint,
}: {
  label: ReactNode;
  file: Evidence | null;
  onFile: (f: Evidence | null) => void;
  prefix: string;
  kind?: 'image' | 'audio';
  error?: string;
  optional?: boolean;
  hint?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const take = useCallback(
    async (picked: File | undefined) => {
      if (!picked) return;
      const why = checkFile(picked, kind);
      if (why) {
        setProblem(why);
        return;
      }
      setProblem(null);
      setProgress(0);
      // Read it in steps so the rule can fill; a Blob of the chunks is the file.
      const chunks: ArrayBuffer[] = [];
      const step = 512 * 1024;
      for (let at = 0; at < picked.size; at += step) {
        chunks.push(await picked.slice(at, at + step).arrayBuffer());
        setProgress(Math.min(1, (at + step) / picked.size));
      }
      const key = fileKey(prefix);
      const blob = new Blob(chunks, { type: picked.type });
      try {
        if (file) await getStore().deleteFile(file.key);
        await getStore().putFile(key, blob);
      } catch {
        setProblem('COULD NOT BE KEPT ON THIS DEVICE');
        setProgress(null);
        return;
      }
      setProgress(null);
      onFile({ key, name: picked.name, type: picked.type || (kind === 'image' ? 'image/*' : 'audio/*'), size: picked.size });
    },
    [file, kind, onFile, prefix],
  );

  const remove = useCallback(async () => {
    if (file) await getStore().deleteFile(file.key).catch(() => {});
    onFile(null);
  }, [file, onFile]);

  return (
    <div className="tty-field">
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <div
        className="tty-drop"
        data-over={over ? 'yes' : 'no'}
        data-has={file ? 'yes' : 'no'}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept={kind === 'image' ? 'image/*' : 'audio/*'}
          className="tty-native"
          onChange={(e) => {
            void take(e.target.files?.[0]);
            e.target.value = '';
          }}
          aria-describedby={error || problem ? `${id}-err` : undefined}
        />
        {file ? (
          <div className="tty-drop-has">
            <Thumb file={file} />
            <div className="tty-drop-actions">
              <span className="tty-filename">{file.name}</span>
              <button type="button" className="tty-btn tty-btn-small" onClick={() => input.current?.click()}>
                {S03.replace}
              </button>
              <button type="button" className="tty-btn tty-btn-small" onClick={remove}>
                {S03.remove}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="tty-drop-empty" onClick={() => input.current?.click()}>
            <span>{hint ?? (kind === 'image' ? S03.drop : 'DROP AUDIO HERE, OR PRESS TO CHOOSE')}</span>
            <span className="tty-drop-accept">{kind === 'image' ? S03.accept : 'WEBM · MP3 · M4A · WAV — UP TO 25 MB'}</span>
          </button>
        )}
        {progress !== null ? (
          <div className="tty-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={S03.reading}>
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        ) : null}
      </div>
      <Err id={`${id}-err`}>{problem ? `NOT ACCEPTED: ${problem}.` : error}</Err>
    </div>
  );
}

/**
 * Sixty seconds of voice: recorded here, if the browser and the person
 * allow, or a file. The recording is stopped at the limit.
 */
export function Voice({
  file,
  onFile,
  prefix,
  limit,
  record,
  stop,
  uploadLabel,
  error,
}: {
  file: Evidence | null;
  onFile: (f: Evidence | null) => void;
  prefix: string;
  limit: number;
  record: string;
  stop: string;
  uploadLabel: string;
  error?: string;
}) {
  const [state, setState] = useState<'idle' | 'recording' | 'denied'>('idle');
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const can = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  const finish = useCallback(async () => {
    const r = rec.current;
    if (!r) return;
    await new Promise<void>((resolve) => {
      r.onstop = () => resolve();
      r.stop();
    });
    r.stream.getTracks().forEach((t) => t.stop());
    rec.current = null;
    if (timer.current) window.clearInterval(timer.current);
    const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
    chunks.current = [];
    const key = fileKey(prefix);
    try {
      if (file) await getStore().deleteFile(file.key);
      await getStore().putFile(key, blob);
      onFile({ key, name: `voice-${new Date().toISOString().slice(0, 10)}.webm`, type: blob.type, size: blob.size, duration: seconds });
    } catch {
      /* the store refused; the rule stays empty */
    }
    setState('idle');
  }, [file, onFile, prefix, seconds]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.current = r;
      r.start(250);
      setSeconds(0);
      setState('recording');
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setState('denied');
    }
  }, []);

  useEffect(() => {
    if (state === 'recording' && seconds >= limit) void finish();
  }, [seconds, limit, state, finish]);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return (
    <div className="tty-voice">
      {can ? (
        <div className="tty-voice-row">
          {state === 'recording' ? (
            <button type="button" className="tty-btn" onClick={() => void finish()} aria-live="polite">
              {stop} · {String(limit - seconds).padStart(2, '0')}
            </button>
          ) : (
            <button type="button" className="tty-btn" onClick={() => void start()}>
              {record} · {limit}s
            </button>
          )}
          {state === 'denied' ? <span className="tty-error">MICROPHONE NOT AVAILABLE.</span> : null}
        </div>
      ) : null}
      <Upload label={uploadLabel} file={file} onFile={onFile} prefix={prefix} kind="audio" optional error={error} />
    </div>
  );
}

/** The bracketed action: [ CONTINUE ]. */
export function Action({ children, onClick, disabled, primary, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} className={primary ? 'tty-btn tty-btn-primary' : 'tty-btn'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
