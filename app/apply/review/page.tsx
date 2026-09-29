import type { Metadata } from 'next';
import Review from '@/components/apply/Review';

export const metadata: Metadata = {
  title: 'W* STUDIO — applications',
  robots: { index: false, follow: false },
};

/** /apply/review — the studio's plain view of what this device has filed. */
export default function ReviewPage() {
  return <Review />;
}
