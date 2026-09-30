import { fetchPublicRecord } from '@/lib/public/record';
import { vcard, vcardName } from '@/lib/vcard';

/** SAVE CONTACT — the public record as a vCard: exactly what the page shows
 *  (and the link-only contact, when the share key came with the link).
 *  No membership needed to take it. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(request.url);
  const k = url.searchParams.get('k');
  const data = await fetchPublicRecord(token, k);
  if (!data || data.state !== 'active') return new Response('No such WILDCARD*.', { status: 404 });
  const file = vcardName(data.name);
  const ascii = file.replace(/[^\x20-\x7e]/g, '') || 'wildcard.vcf';
  return new Response(vcard(data, `${url.origin}/w/${token}`), {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file)}`,
      'Cache-Control': 'no-store',
    },
  });
}
