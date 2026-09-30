'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/** The QR of an address: the fallback for a phone that does not read the *.
 *  Drawn here, from the address alone; nothing is sent anywhere. */
export default function Qr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0b0b0a', light: '#00000000' } })
      .then((s) => {
        if (live) setSvg(s);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [value]);

  return <div className="mb-qr" role="img" aria-label={label} dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />;
}
