import type { Metadata, Viewport } from 'next';
import Login from '@/components/Login';

export const metadata: Metadata = {
  title: 'C.I.A TERMINAL — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#030304',
};

/** /terminal — the C.I.A terminal on its own: for a holder coming back to
 *  their record without the film, and where the terminal sends anyone who
 *  reaches a record without one. */
export default function TerminalPage() {
  return <Login standalone />;
}
