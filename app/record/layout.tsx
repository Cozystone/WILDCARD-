import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Frame from '@/components/mainboard/Frame';

export const metadata: Metadata = {
  title: 'RECORD — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
};

/** /record… — the holder's own record (the Mainboard): one frame for every
 *  page under it, the record loaded once. */
export default function RecordLayout({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}
