import { notFound } from 'next/navigation';
import Home from '@/components/Home';
import { VARIANTS, type VariantKey } from '@/lib/hero';

/** /a, /b, /c — the whole page, with the wordmark in each of its three placements. Built statically; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export default async function VariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!(variant in VARIANTS)) notFound();
  return <Home variant={variant as VariantKey} />;
}
