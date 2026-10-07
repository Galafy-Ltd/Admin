import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  url: string;
};

export function DownloadQr({ url }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!src) {
    return <div style={{ width: 120, height: 120, margin: '0 auto 8px', background: '#eee' }} />;
  }

  return <img src={src} alt="QR code to download Galafy" width={120} height={120} />;
}
