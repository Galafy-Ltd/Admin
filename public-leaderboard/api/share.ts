/**
 * Serves the SPA HTML for /e/:token with dynamic Open Graph / Twitter meta tags.
 * Social crawlers do not execute JS, so tags must be present in the initial HTML.
 */

type PublicSnapshot = {
  event: {
    title: string;
    imageUrl: string | null;
    status: string;
  };
  privacy?: {
    showAmounts: boolean;
    showTotalAmount: boolean;
    showParticipantCount: boolean;
  };
  showAmounts?: boolean;
  stats: {
    totalSprayed: string | null;
    giversCount: number | null;
  };
};

export const config = {
  runtime: 'edge',
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatNaira(amount: string | null): string | null {
  if (amount == null || amount === '') return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n);
}

function buildMeta(snapshot: PublicSnapshot | null, pageUrl: string, defaultImage: string) {
  const title = snapshot
    ? `${snapshot.event.title} | Live on Galafy`
    : 'Galafy Live Leaderboard';

  let description =
    'Follow live event rankings on Galafy — digital spraying built for the culture.';

  if (snapshot) {
    const statusLabel = snapshot.event.status === 'LIVE' ? 'Live now' : 'Event leaderboard';
    const showTotal =
      snapshot.privacy?.showTotalAmount ??
      snapshot.showAmounts ??
      false;
    const showCount = snapshot.privacy?.showParticipantCount ?? true;
    const parts: Array<string | null> = [statusLabel];
    if (showTotal) {
      const total = formatNaira(snapshot.stats.totalSprayed);
      if (total) parts.push(`Total sprayed ${total}`);
    }
    if (showCount && snapshot.stats.giversCount != null) {
      parts.push(`${snapshot.stats.giversCount} givers`);
    }
    description = `${parts.filter(Boolean).join(' · ')}. Follow live rankings on Galafy.`;
    if (!showTotal && !(snapshot.privacy?.showAmounts ?? snapshot.showAmounts)) {
      description = `${statusLabel}: follow live rankings for ${snapshot.event.title}. Details stay private.`;
    }
  }

  // Prefer event image; never use profile pictures or other PII.
  const image =
    (snapshot?.event.imageUrl && /^https?:\/\//i.test(snapshot.event.imageUrl)
      ? snapshot.event.imageUrl
      : null) || defaultImage;

  const tags = [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<link rel="canonical" href="${escapeAttr(pageUrl)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Galafy" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(pageUrl)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta property="og:image:alt" content="${escapeAttr(snapshot?.event.title || 'Galafy Live Leaderboard')}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
  ];

  return tags.join('\n    ');
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').trim();
  const pageUrl = token ? `${url.origin}/e/${encodeURIComponent(token)}` : url.origin;

  const apiBase = (
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    ''
  ).replace(/\/$/, '');

  const defaultImage =
    process.env.VITE_DEFAULT_OG_IMAGE ||
    process.env.DEFAULT_OG_IMAGE ||
    `${url.origin}/og-default.svg`;

  let snapshot: PublicSnapshot | null = null;
  if (token && apiBase) {
    try {
      const res = await fetch(`${apiBase}/public/leaderboard/${encodeURIComponent(token)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        snapshot = (await res.json()) as PublicSnapshot;
      }
    } catch {
      // Fall back to generic tags; SPA will show the error state.
    }
  }

  const metaBlock = buildMeta(snapshot, pageUrl, defaultImage);

  let html: string;
  try {
    const indexRes = await fetch(new URL('/index.html', url.origin));
    html = await indexRes.text();
  } catch {
    html = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div></body></html>`;
  }

  html = html.replace(/<title>[^<]*<\/title>/i, '');
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (match) => `${match}\n    ${metaBlock}\n`);
  } else {
    html = `<!doctype html><html><head>${metaBlock}</head><body>${html}</body></html>`;
  }

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
    },
  });
}
