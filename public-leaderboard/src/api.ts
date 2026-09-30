import type { PublicLeaderboardSnapshot } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

export async function fetchPublicLeaderboard(token: string): Promise<PublicLeaderboardSnapshot> {
  const res = await fetch(`${API_BASE}/public/leaderboard/${encodeURIComponent(token)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('This leaderboard link is invalid or no longer available.');
    }
    throw new Error('Unable to load the live leaderboard. Please try again.');
  }
  return res.json();
}
