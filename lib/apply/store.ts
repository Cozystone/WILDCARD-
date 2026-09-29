/**
 * Where the application is kept.
 *
 * There is no backend yet. Everything sits behind `ApplicationStore`, so a
 * Supabase / Postgres store can replace `LocalStore` without the form
 * knowing: the record as JSON, the files as blobs under their keys. The
 * local store keeps the record in localStorage and the files in IndexedDB
 * (they are too big for localStorage, and they are private: they never go
 * near /public or a URL that could be indexed).
 *
 * Application numbers are human-readable and internal — W*–26–000013 — and
 * must never become the public NFC address. The local counter is a stand-in
 * for the server's; a server issues them.
 */
import { emptyApplication, type Application } from './model';

export interface ApplicationStore {
  /** The current draft, if any. */
  load(): Promise<Application | null>;
  save(app: Application): Promise<void>;
  /** Marks it submitted, gives it its number, files it, clears the draft. */
  submit(app: Application): Promise<Application>;
  /** Everything filed here, for the studio's view. */
  list(): Promise<Application[]>;
  clearDraft(): Promise<void>;
  putFile(key: string, blob: Blob): Promise<void>;
  getFile(key: string): Promise<Blob | null>;
  deleteFile(key: string): Promise<void>;
}

const DRAFT = 'wildcard.apply.draft';
const FILED = 'wildcard.apply.filed';
const COUNTER = 'wildcard.apply.counter';
const DB = 'wildcard-apply';
const FILES = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(FILES)) req.result.createObjectStore(FILES);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(FILES, mode);
        const req = run(t.objectStore(FILES));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota, private mode: the draft is what is on screen */
  }
}

export function applicationNumber(seq: number, now = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  return `W*–${yy}–${String(seq).padStart(6, '0')}`;
}

export class LocalStore implements ApplicationStore {
  async load() {
    const app = read<Application>(DRAFT);
    if (!app) return null;
    // A draft from an older shape gets the missing parts, not an error.
    return { ...emptyApplication(), ...app };
  }

  async save(app: Application) {
    write(DRAFT, { ...app, updatedAt: new Date().toISOString() });
  }

  async submit(app: Application) {
    const seq = (read<number>(COUNTER) ?? 12) + 1;
    write(COUNTER, seq);
    const now = new Date();
    const filed: Application = {
      ...app,
      status: 'submitted',
      applicationNumber: applicationNumber(seq, now),
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    write(FILED, [...(read<Application[]>(FILED) ?? []), filed]);
    try {
      window.localStorage.removeItem(DRAFT);
    } catch {
      /* nothing to do */
    }
    return filed;
  }

  async list() {
    return read<Application[]>(FILED) ?? [];
  }

  async clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT);
    } catch {
      /* nothing to do */
    }
  }

  putFile(key: string, blob: Blob) {
    return tx<IDBValidKey>('readwrite', (s) => s.put(blob, key)).then(() => undefined);
  }

  getFile(key: string) {
    return tx<Blob | undefined>('readonly', (s) => s.get(key)).then((b) => b ?? null);
  }

  deleteFile(key: string) {
    return tx<undefined>('readwrite', (s) => s.delete(key)).then(() => undefined);
  }
}

let store: ApplicationStore | null = null;

/** The store in use. Swap the class here when a backend exists. */
export function getStore(): ApplicationStore {
  if (!store) store = new LocalStore();
  return store;
}

export function fileKey(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** What a file must be to be accepted. */
export const ACCEPT = {
  image: { types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'], max: 20 * 1024 * 1024 },
  audio: { types: ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/aac'], max: 25 * 1024 * 1024 },
} as const;

export function checkFile(file: File, kind: keyof typeof ACCEPT): string | null {
  const rule = ACCEPT[kind];
  const type = file.type.toLowerCase();
  if (type && !(rule.types as readonly string[]).includes(type)) return `${kind.toUpperCase()} ONLY`;
  if (!type) {
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    const ok = kind === 'image' ? ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] : ['webm', 'ogg', 'mp3', 'm4a', 'wav', 'aac', 'mp4'];
    if (!ok.includes(ext)) return `${kind.toUpperCase()} ONLY`;
  }
  if (file.size > rule.max) return `OVER ${Math.round(rule.max / 1024 / 1024)} MB`;
  return null;
}
