import type { Metadata } from 'next';
import Apply from '@/components/apply/Apply';

export const metadata: Metadata = {
  title: 'FORM W*–01 — WILDCARD*',
  description: 'WILDCARD* identity portrait application.',
  robots: { index: false, follow: false },
};

/** /apply — FORM W*–01. The screen the terminal on the Macintosh offers. */
export default function ApplyPage() {
  return <Apply />;
}
