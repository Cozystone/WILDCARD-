'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { access } from '@/lib/records/access';
import { RECORD as R } from '@/lib/records/copy';
import { recordLabel, versionLabel, type HolderRecord, type IdentityVersion } from '@/lib/records/types';

/**
 * The record — the first screen past the terminal, and the first thing that
 * is not the institution's. White, black type, most of it empty: the record
 * number small at the top left, the version at the top right, and one
 * statement. A holder with a version written sees how they left themselves
 * and can look at it or rewrite it; a holder with none is told so, and is
 * offered the one thing to do: FORM W*–01 (/apply).
 *
 * Only the holder of a session with a named record gets here; anyone else is
 * sent to the terminal, which knows what to say to them. Closing the session
 * is behind the small SESSION at the foot.
 */
export default function Record() {
  const router = useRouter();
  const [data, setData] = useState<{ rec: HolderRecord; version: IdentityVersion | null } | null>(null);
  const [viewing, setViewing] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuId = useId();

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await access.record();
      if (!live) return;
      if (!r.ok || !r.value || !r.value.displayName || r.value.status === 'suspended') {
        router.replace('/terminal');
        return;
      }
      const v = await access.latest();
      if (!live) return;
      setData({ rec: r.value, version: v.ok ? v.value : null });
    })();
    return () => {
      live = false;
    };
  }, [router]);

  const issue = () => {
    // FORM W*–01, with the record's name carried over for PREFERRED NAME.
    try {
      if (data?.rec.displayName) window.sessionStorage.setItem('wildcard.holder', data.rec.displayName);
    } catch {
      /* the form asks again */
    }
    router.push('/apply?via=terminal');
  };

  const close = async () => {
    await access.close();
    router.replace('/');
  };

  const rec = data?.rec ?? null;
  const version = data?.version ?? null;

  return (
    <main className="record" aria-label={R.label} aria-busy={!data}>
      <header className="record-head">
        <p className="record-corner">{rec ? recordLabel(rec.recordNumber) : ''}</p>
        <p className="record-corner">{data ? versionLabel(version ? version.number : 1) : ''}</p>
      </header>

      {data ? (
        <section className="record-body">
          {version ? (
            viewing ? (
              <>
                <p className="record-meta">
                  {versionLabel(version.number)} · {R.written} {version.createdAt.slice(0, 10)}
                </p>
                <blockquote className="record-full">{version.statement}</blockquote>
                <div className="record-actions">
                  <button type="button" className="record-action" onClick={() => setViewing(false)}>
                    {R.back}
                  </button>
                  <button type="button" className="record-action" onClick={issue}>
                    {R.rewrite}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="record-statement">
                  {R.left[0]}
                  <br />
                  {R.left[1]}
                </h1>
                <blockquote className="record-quote">{version.statement}</blockquote>
                <div className="record-actions">
                  <button type="button" className="record-action" onClick={() => setViewing(true)}>
                    {R.view}
                  </button>
                  <button type="button" className="record-action" onClick={issue}>
                    {R.rewrite}
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <h1 className="record-statement">
                {R.nothing[0]}
                <br />
                {R.nothing[1]}
              </h1>
              <div className="record-actions">
                <button type="button" className="record-action" onClick={issue}>
                  {R.begin}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      <footer className="record-foot">
        {data ? (
          <div className="record-menu">
            {menu ? (
              <button id={menuId} type="button" className="record-menu-item" onClick={() => void close()}>
                {R.close}
              </button>
            ) : null}
            <button type="button" className="record-menu-toggle" aria-expanded={menu} aria-controls={menuId} onClick={() => setMenu((m) => !m)}>
              {R.session}
            </button>
          </div>
        ) : null}
      </footer>
    </main>
  );
}
