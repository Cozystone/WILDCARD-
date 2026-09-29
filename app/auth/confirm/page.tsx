import type { Metadata, Viewport } from 'next';
import Login from '@/components/Login';

export const metadata: Metadata = {
  title: 'VERIFYING RECORD — WILDCARD*',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#030304',
};

/** /auth/confirm — where the link in the transmission comes back
 *  (supabase/templates/authorize.html): black, VERIFYING RECORD..., then the
 *  terminal with the answer. */
export default function ConfirmPage() {
  return <Login standalone confirming />;
}
