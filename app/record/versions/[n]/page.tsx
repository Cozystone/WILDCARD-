import VersionDoc from '@/components/mainboard/VersionDoc';

/** /record/versions/{n} — one version, as the record it was. */
export default async function VersionPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = Number.parseInt(n, 10);
  return <VersionDoc n={Number.isInteger(number) && number > 0 ? number : 0} />;
}
