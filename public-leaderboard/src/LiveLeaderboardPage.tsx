import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicLeaderboard } from './api';
import { formatEventDate, formatNaira, relativeTime } from './format';
import type { PublicActivityItem, PublicLeaderboardSnapshot } from './types';
import { usePublicLive } from './usePublicLive';

const DOWNLOAD_URL = import.meta.env.VITE_APP_DOWNLOAD_URL || 'https://galafy.com/download';

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
        setActivity(snapshot.recentActivity || []);
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
    setActivity(snapshot.recentActivity || []);
    setLoading(false);
    setError(null);
  }, []);

  const onLeaderboard = useCallback((snapshot: PublicLeaderboardSnapshot) => {
    setData(snapshot);
    setActivity(snapshot.recentActivity || []);
  }, []);

  const onSpray = useCallback((payload: {
    stats: { totalSprayed: string | null; giversCount?: number };
    activity: PublicActivityItem;
    showAmounts: boolean;
  }) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        showAmounts: payload.showAmounts,
        stats: {
          totalSprayed:
            payload.stats.totalSprayed !== undefined
              ? payload.stats.totalSprayed
              : prev.stats.totalSprayed,
          giversCount:
            payload.stats.giversCount !== undefined
              ? payload.stats.giversCount
              : prev.stats.giversCount,
        },
      };
    });
    setActivity((prev) => [payload.activity, ...prev].slice(0, 30));
  }, []);

  usePublicLive(token, {
    onJoined,
    onLeaderboard,
    onSpray,
    onError: (message) => {
      if (!data) setError(message);
    },
  });

  const top3 = useMemo(() => data?.leaderboard.slice(0, 3) || [], [data]);
  const rest = useMemo(() => {
    const rows = data?.leaderboard.slice(3) || [];
    return expanded ? rows : rows.slice(0, 5);
  }, [data, expanded]);
  const isLive = data?.event.status === 'LIVE';

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

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Galafy</div>
        {isLive ? <div className="live-pill">LIVE</div> : <div className="section-head"><p>{data.event.status}</p></div>}
      </header>

      <section className="hero">
        {data.event.imageUrl ? <img src={data.event.imageUrl} alt="" /> : null}
        <div className="hero-overlay">
          <div className="hero-kicker">{isLive ? 'Event live' : 'Event'}</div>
          <h1>{data.event.title}</h1>
          <p style={{ margin: 0, opacity: 0.85 }}>{formatEventDate(data.event.startsAt)}</p>
          <div className="stats">
            <div className="stat-card">
              <span>Total sprayed</span>
              <strong>
                {data.showAmounts ? formatNaira(data.stats.totalSprayed) : 'Hidden'}
              </strong>
            </div>
            <div className="stat-card">
              <span>Givers</span>
              <strong>{data.stats.giversCount.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Top contributors</h2>
          <p>Updated live</p>
        </div>
        {top3.length > 0 ? (
          <div className="podium">
            {podiumOrder.map((entry) =>
              entry ? (
                <div key={entry.rank} className={`podium-card rank-${entry.rank}`}>
                  <div className="rank-badge">{entry.rank}</div>
                  <Avatar name={entry.displayName} src={entry.profilePicture} />
                  <h3>{entry.displayName}</h3>
                  {data.showAmounts && entry.totalAmount != null ? (
                    <div className="amount">{formatNaira(entry.totalAmount)}</div>
                  ) : (
                    <div className="amount">#{entry.rank}</div>
                  )}
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div className="list-card">
            <div className="list-row">No sprays yet — be the first.</div>
          </div>
        )}

        {rest.length > 0 ? (
          <div className="list-card">
            {rest.map((entry) => (
              <div key={entry.rank} className="list-row">
                <div className="rank">{entry.rank}</div>
                <div className="who">
                  <Avatar name={entry.displayName} src={entry.profilePicture} />
                  <span>{entry.displayName}</span>
                </div>
                <div>
                  {data.showAmounts && entry.totalAmount != null
                    ? formatNaira(entry.totalAmount)
                    : `#${entry.rank}`}
                </div>
              </div>
            ))}
            {data.leaderboard.length > 8 && (
              <button
                type="button"
                className="list-row"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--navy)',
                  fontWeight: 600,
                  justifyContent: 'center',
                }}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? 'Show less' : 'View full leaderboard'}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Live activity</h2>
          <div className="stream-pill">Streaming</div>
        </div>
        <div className="activity-card">
          {activity.length === 0 ? (
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
                      {data.showAmounts && item.amount != null ? (
                        <span className="amount">{formatNaira(item.amount)}</span>
                      ) : (
                        <span className="amount">on the board</span>
                      )}
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
          <div className="qr-placeholder" aria-hidden />
          <small>Scan to Download Galafy App</small>
        </div>
      </section>

      <footer className="footer">© {new Date().getFullYear()} Galafy. All rights reserved.</footer>
    </div>
  );
}
