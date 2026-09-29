import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // No dev-mode badge in the corner: it sits on the caption line in previews.
  devIndicators: false,
  // The hero photograph bypasses the image optimizer on purpose (see
  // components/Hero.tsx): a re-encode to AVIF smooths the film grain that the
  // picture is made of. Nothing else here needs configuring.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
