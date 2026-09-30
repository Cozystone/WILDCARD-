import type { Metadata, Viewport } from 'next';
import PublicRecord from '@/components/public/PublicRecord';
import { fetchPublicRecord } from '@/lib/public/record';

/**
 * /w/{token} — what a tap on a WILDCARD* opens: the holder's record as it is
 * now, only what they made public. On the server, every time (a holder's
 * correction shows at the next tap), and fast: no film, no terminal, no
 * login.
 */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
};

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ k?: string; v?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { token } = await params;
  const { k } = await searchParams;
  const data = await fetchPublicRecord(token, k ?? null);
  const name = data && data.state === 'active' ? data.name : null;
  return {
    title: name ? `${name} — WILDCARD*` : 'WILDCARD*',
    robots: { index: false, follow: false },
  };
}

export default async function PublicPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { k, v } = await searchParams;
  const data = await fetchPublicRecord(token, k ?? null, v ? Number.parseInt(v, 10) : null);
  return <PublicRecord data={data} token={token} k={k ?? null} />;
}
