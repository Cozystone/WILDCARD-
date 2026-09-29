import { notFound } from 'next/navigation';
import Home from '@/components/Home';
import { NAV, type NavSet } from '@/lib/hero';

/**
 * /nav/1, /nav/2 — the whole page with each navigation set under the picture.
 * Set 1 (WORK / OBJECTS / SPACE / THOUGHT) is the home page's; set 2
 * (WORK / SPACE / TEXT / INDEX) is the variation.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(NAV).map((set) => ({ set }));
}

export default async function NavPage({ params }: { params: Promise<{ set: string }> }) {
  const { set } = await params;
  if (!(set in NAV)) notFound();
  return <Home nav={set as NavSet} />;
}
