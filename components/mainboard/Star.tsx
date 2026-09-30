import { STAR } from '@/lib/records/star';

/** The WILDCARD* asterisk: the * of the wordmark, alone. On a card it is
 *  where the NFC is — TAP THE *. Used sparingly, so it keeps that meaning. */
export default function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={STAR.viewBox} aria-hidden="true" focusable="false">
      <path d={STAR.path} />
    </svg>
  );
}
