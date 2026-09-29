import type { Metadata, Viewport } from 'next';
import Record from '@/components/records/Record';

export const metadata: Metadata = {
  title: 'RECORD — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f4f2ed',
};

/** /record — the holder's record, past the terminal. */
export default function RecordPage() {
  return <Record />;
}
