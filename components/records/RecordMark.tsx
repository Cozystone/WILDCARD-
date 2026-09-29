'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { access } from '@/lib/records/access';
import { RECORD as R } from '@/lib/records/copy';
import { Star } from './Record';

/**
 * The * on the city, bottom left, on the road: there only for a browser
 * that holds a session with an issued record — it takes that holder
 * straight to their record, past the film and the terminal. It appears
 * when the session has been read, as everything on this page appears: at
 * once, no fade. Anyone else sees the city as it was.
 */
export default function RecordMark() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    access
      .record()
      .then((r) => {
        if (live && r.ok && r.value?.displayName && r.value.status !== 'suspended') setOpen(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!open) return null;
  return (
    <Link href="/record" className="hero-star" aria-label={R.label}>
      <Star />
    </Link>
  );
}
