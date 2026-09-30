'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { HOME, MORE, NAV } from '@/lib/mainboard/copy';
import { loadMine } from '@/lib/mainboard/data';
import type { Mine } from '@/lib/mainboard/types';
import { access } from '@/lib/records/access';
import { recordLabel, versionLabel } from '@/lib/records/types';
import Star from './Star';

/**
 * The Mainboard's frame — the holder's record, framed the way the city is on
 * the home page: ink round a plate, and under it one line of small type. Here
 * the plate is paper, not a photograph, and the line is RECORD / CARD /
 * VERSIONS / REWRITE, with ··· for the rest (the public view, privacy,
 * contact, billing and shipping later, closing the session). The record
 * number and the version sit in the plate's top corners; the * in its
 * bottom left goes back to the city.
 *
 * It loads the holder's record once for every page under /record and hands
 * it down (`useMine`). No session, or no named record: the terminal.
 */

type Ctx = { mine: Mine; refresh: () => Promise<void> };
const MainboardContext = createContext<Ctx | null>(null);

export function useMine(): Ctx {
  const ctx = useContext(MainboardContext);
  if (!ctx) throw new Error('useMine outside the Mainboard');
  return ctx;
}

const tabOf = (path: string) =>
  path.startsWith('/record/card') ? 'card' : path.startsWith('/record/versions') ? 'versions' : path.startsWith('/record/rewrite') ? 'rewrite' : 'record';

export default function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [mine, setMine] = useState<Mine | null>(null);
  const [menu, setMenu] = useState(false);
  const menuId = useId();

  /** Reads the record; anyone without a named one goes to the terminal. */
  const take = useCallback(
    (r: Awaited<ReturnType<typeof loadMine>>) => {
      if (!r.ok || !r.value || !r.value.name || r.value.status === 'suspended') {
        router.replace('/terminal');
        return;
      }
      setMine(r.value);
    },
    [router],
  );

  const load = useCallback(async () => take(await loadMine()), [take]);

  useEffect(() => {
    let live = true;
    loadMine().then((r) => {
      if (live) take(r);
    });
    return () => {
      live = false;
    };
  }, [take]);

  // The menu closes on Escape, and on a press anywhere else.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('.mb-more')) setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [menu]);

  const close = async () => {
    await access.close();
    router.replace('/');
  };

  const tab = tabOf(path);

  return (
    <div className="mb">
      <main className="mb-plate" aria-label={HOME.label} aria-busy={!mine}>
        {mine ? (
          <MainboardContext.Provider value={{ mine, refresh: load }}>
            <header className="mb-top">
              <p className="mb-corner">{recordLabel(mine.recordNumber)}</p>
              <p className="mb-corner mb-corner-end">
                {mine.current ? versionLabel(mine.current.number) : HOME.unwritten}
              </p>
            </header>
            <div className="mb-body">{children}</div>
            <Link href="/" className="mb-star" aria-label={HOME.city}>
              <Star />
            </Link>
          </MainboardContext.Provider>
        ) : null}
      </main>

      <footer className="mb-caption">
        <nav aria-label="Record">
          <ul className="mb-index">
            {NAV.map(([key, label, href]) => (
              <li key={key}>
                <Link href={href} aria-current={tab === key ? 'page' : undefined}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mb-more">
          {menu && mine ? (
            <ul id={menuId} className="mb-more-list">
              <li>
                <a href={`/w/${mine.publicId}`} target="_blank" rel="noreferrer">
                  {MORE.publicView} ↗
                </a>
              </li>
              <li>
                <Link href="/record/edit#privacy" onClick={() => setMenu(false)}>
                  {MORE.privacy}
                </Link>
              </li>
              <li>
                <Link href="/record/edit#contact" onClick={() => setMenu(false)}>
                  {MORE.contact}
                </Link>
              </li>
              <li className="mb-more-off">
                {MORE.billing} <span>{MORE.later}</span>
              </li>
              <li className="mb-more-off">
                {MORE.shipping} <span>{MORE.later}</span>
              </li>
              <li>
                <button type="button" onClick={() => void close()}>
                  {MORE.close}
                </button>
              </li>
            </ul>
          ) : null}
          <button
            type="button"
            className="mb-more-toggle"
            aria-label={MORE.open}
            aria-expanded={menu}
            aria-controls={menuId}
            onClick={() => setMenu((m) => !m)}
          >
            ···
          </button>
        </div>
      </footer>
    </div>
  );
}
