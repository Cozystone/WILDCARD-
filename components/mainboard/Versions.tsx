'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VERSIONS } from '@/lib/mainboard/copy';
import { loadVersions } from '@/lib/mainboard/data';
import { dayLabel, two } from '@/lib/mainboard/format';
import type { VersionSummary } from '@/lib/mainboard/types';
import { useMine } from './Frame';

/**
 * VERSIONS — the archive, quietly: each version's number, the day it was
 * written, the first words of what it said. The current one says so. One
 * opens as the record it was.
 */
export default function Versions() {
  const { mine } = useMine();
  const [list, setList] = useState<VersionSummary[] | null>(null);

  useEffect(() => {
    let live = true;
    loadVersions().then((r) => {
      if (live) setList(r.ok ? r.value : []);
    });
    return () => {
      live = false;
    };
  }, [mine.current?.number]);

  return (
    <section className="mb-page">
      <header className="mb-page-head">
        <h1 className="mb-title">{VERSIONS.title}</h1>
      </header>
      {list && list.length === 0 ? <p className="mb-statement mb-muted">{VERSIONS.none}</p> : null}
      {list && list.length ? (
        <ol className="mb-versions">
          {list.map((v) => (
            <li key={v.number}>
              <Link className="mb-version" href={`/record/versions/${v.number}`}>
                <span className="mb-version-n">VERSION {two(v.number)}</span>
                <span className="mb-version-meta">
                  <span>{dayLabel(v.createdAt)}</span>
                  {v.current ? <span className="mb-version-now">{VERSIONS.current}</span> : null}
                  {v.uncertain ? <span>{VERSIONS.unsure}</span> : null}
                </span>
                <span className="mb-version-first">{v.statement.split('\n')[0]}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
