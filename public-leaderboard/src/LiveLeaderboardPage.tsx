import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicLeaderboard } from './api';
import { DownloadQr } from './DownloadQr';
import { formatEventDate, formatNaira, relativeTime } from './format';
import type { PublicActivityItem, PublicLeaderboardSnapshot } from './types';
import { usePublicLive } from './usePublicLive';

const DOWNLOAD_URL = import.meta.env.VITE_APP_DOWNLOAD_URL || 'https://galafy.co/#download';
const MASKED_AMOUNT = '****';

function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className={className ? `avatar ${className}` : 'avatar'}>
      {src ? <img src={src} alt={name} /> : initials || '?'}
    </div>
  );
}

/** Show amounts → ₦; Ranking only → ****; missing value while showAmounts → — */
function formatAmountDisplay(
  showAmounts: boolean,
  value: string | number | null | undefined,
): string {
  if (!showAmounts) return MASKED_AMOUNT;
  if (value == null || value === '') return '—';
  return formatNaira(value);
}

function isEventLive(snapshot: PublicLeaderboardSnapshot | null | undefined): boolean {
  return snapshot?.event.status === 'LIVE';
}

export function LiveLeaderboardPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicLeaderboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<PublicActivityItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetchPublicLeaderboard(token)
      .then((snapshot) => {
        if (cancelled) return;
        setData(snapshot);
        // Live activity is LIVE-only; do not bind historical REST activity when not live.
        setActivity(isEventLive(snapshot) ? snapshot.recentActivity || [] : []);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onJoined = useCallback((snapshot: PublicLeaderboardSnapshot) => {
    setData(snapshot);
    setActivity(isEventLive(snapshot) ? snapshot.recentActivity || [] : []);
    setLoading(false);
    setError(null);
  }, []);

  const onLeaderboard = useCallback((snapshot: PublicLeaderboardSnapshot) => {
    setData(snapshot);
    if (isEventLive(snapshot)) {
      setActivity(snapshot.recentActivity || []);
    } else {
      setActivity([]);
    }
  }, []);

  const onSpray = useCallback(
    (payload: {
      stats: { totalSprayed: string | null; giversCount?: number | null };
      activity: PublicActivityItem | null;
      showAmounts: boolean;
      privacy?: PublicLeaderboardSnapshot['privacy'];
    }) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          showAmounts: payload.showAmounts,
          privacy: payload.privacy ?? prev.privacy,
          stats: {
            totalSprayed:
              payload.stats.totalSprayed !== undefined
                ? payload.stats.totalSprayed
                : prev.stats.totalSprayed,
            giversCount:
              'giversCount' in (payload.stats ?? {})
                ? payload.stats.giversCount ?? null
                : prev.stats.giversCount,
          },
        };
      });
      // Socket sprays only apply while the event is live (hook is gated on isLive).
      if (payload.activity) {
        const next = payload.activity;
        setActivity((prev) => {
          const duplicate = prev.some(
            (item) =>
              item.createdAt === next.createdAt &&
              item.displayName === next.displayName &&
              item.amount === next.amount &&
              item.type === next.type,
          );
          if (duplicate) return prev;
          return [next, ...prev].slice(0, 30);
        });
      }
    },
    [],
  );

  const isLive = isEventLive(data);

  usePublicLive(
    token,
    {
      onJoined,
      onLeaderboard,
      onSpray,
      onRevoked: (message) => {
        setData(null);
        setActivity([]);
        setError(message);
      },
      onError: (message) => {
        if (!data) setError(message);
      },
    },
    Boolean(isLive),
  );

  const top3 = useMemo(() => data?.leaderboard.slice(0, 3) || [], [data]);
  const rest = useMemo(() => {
    const rows = data?.leaderboard.slice(3) || [];
    return expanded ? rows : rows.slice(0, 5);
  }, [data, expanded]);

  if (loading && !data) {
    return <div className="state">Loading live leaderboard…</div>;
  }

  if (error && !data) {
    return <div className="state error">{error}</div>;
  }

  if (!data) {
    return <div className="state error">Leaderboard unavailable.</div>;
  }

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const privacy = data.privacy ?? {
    showNames: true,
    showAmounts: data.showAmounts,
    showTotalAmount: data.showAmounts,
    showParticipantCount: true,
    allowAnonymous: true,
    topN: null,
  };
  const showRowAmounts = privacy.showAmounts;
  const showTotal = privacy.showTotalAmount;
  const showGivers = privacy.showParticipantCount;

  return (
    <div className="page">
      <div className="hero-band">
        <div className="hero-band-inner">
          <header className="topbar">
            <div className="brand">Galafy</div>
            {isLive ? (
              <div className="live-pill">LIVE</div>
            ) : (
              <div className="section-head">
                <p style={{ color: 'rgba(255,255,255,0.75)' }}>{data.event.status}</p>
              </div>
            )}
          </header>

          <section className="hero">
            {data.event.imageUrl ? <img src={data.event.imageUrl} alt="" /> : null}
            <div className="hero-overlay">
              <div className="hero-kicker">{isLive ? 'Event live' : 'Event'}</div>
              <h1>{data.event.title}</h1>
              <p className="hero-date">{formatEventDate(data.event.startsAt)}</p>
            </div>
          </section>

          {(showTotal || showGivers) && (
            <div className="stats">
              {showTotal ? (
                <div className="stat-card">
                  <span>Total sprayed</span>
                  <strong>{formatNaira(data.stats.totalSprayed)}</strong>
                </div>
              ) : null}
              {showGivers ? (
                <div className="stat-card givers">
                  <span>Givers</span>
                  <strong>{(data.stats.giversCount ?? 0).toLocaleString()}</strong>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="content">
        {/* Section A: podium — no section title (per design) */}
        <section className="section">
          {top3.length > 0 ? (
            <div className="podium">
              {podiumOrder.map((entry) =>
                entry ? (
                  <div key={entry.rank} className={`podium-card rank-${entry.rank}`}>
                    <div className="rank-badge">{entry.rank}</div>
                    <Avatar name={entry.displayName} src={entry.profilePicture} />
                    <h3>{entry.displayName}</h3>
                    <div className={`amount${showRowAmounts ? '' : ' amount--masked'}`}>
                      {formatAmountDisplay(showRowAmounts, entry.totalAmount)}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <div className="list-card">
              <div className="list-row list-row--empty">No sprays yet — be the first.</div>
            </div>
          )}
        </section>

        {/* Section B: Leaderboard list (always from snapshot / REST) */}
        <section className="section">
          <div className="section-head">
            <h2>Leaderboard</h2>
            <p>Updated live</p>
          </div>
          {rest.length > 0 ? (
            <div className="list-card">
              {rest.map((entry) => (
                <div key={entry.rank} className="list-row">
                  <div className="rank">{entry.rank}</div>
                  <div className="who">
                    <Avatar name={entry.displayName} src={entry.profilePicture} />
                    <span>{entry.displayName}</span>
                  </div>
                  <div className={showRowAmounts ? '' : 'amount--masked'}>
                    {formatAmountDisplay(showRowAmounts, entry.totalAmount)}
                  </div>
                </div>
              ))}
              {data.leaderboard.length > 8 && (
                <button
                  type="button"
                  className="list-row list-row--expand"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Show less' : 'View full leaderboard'}
                </button>
              )}
            </div>
          ) : null}
        </section>

        {/* Section C: Live activity — LIVE only */}
        <section className="section">
          <div className="section-head">
            <h2>Live activity</h2>
            {isLive ? <div className="stream-pill">Streaming</div> : null}
          </div>
          <div className="activity-card">
            {!isLive ? (
              <div className="activity-row">
                <span>Live activity is available when the event is live.</span>
              </div>
            ) : activity.length === 0 ? (
              <div className="activity-row">
                <span>Waiting for the first spray…</span>
              </div>
            ) : (
              activity.slice(0, 12).map((item, idx) => (
                <div key={`${item.createdAt}-${idx}`} className="activity-row">
                  <div>
                    <strong>{item.displayName}</strong>{' '}
                    {item.type === 'rank_up' ? (
                      <>
                        moved up to <strong>#{item.rank}</strong>
                      </>
                    ) : (
                      <>
                        just sprayed{' '}
                        <span className={`amount${showRowAmounts ? '' : ' amount--masked'}`}>
                          {formatAmountDisplay(showRowAmounts, item.amount)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="meta">{relativeTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>Be part of the celebration</h2>
            <p>Experience digital spraying built for the culture.</p>
            <a className="cta-btn" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">
              Join Galafy
            </a>
          </div>
          <div className="qr-box">
            <DownloadQr url={DOWNLOAD_URL} />
            <small>Scan to Download Galafy App</small>
          </div>
        </section>

        <footer className="footer">© {new Date().getFullYear()} Galafy. All rights reserved.</footer>
      </div>
    </div>
  );
}
