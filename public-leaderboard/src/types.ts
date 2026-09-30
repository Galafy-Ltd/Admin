export type PublicLeaderboardEntry = {
  rank: number;
  displayName: string;
  profilePicture: string | null;
  totalAmount?: string;
  sprayCount: number;
};

export type PublicActivityItem = {
  type: 'spray' | 'rank_up';
  displayName: string;
  amount?: string;
  rank?: number;
  createdAt: string;
};

export type PublicLeaderboardSnapshot = {
  event: {
    id: string;
    title: string;
    imageUrl: string | null;
    status: string;
    startsAt: string;
  };
  showAmounts: boolean;
  stats: {
    totalSprayed: string | null;
    giversCount: number;
  };
  leaderboard: PublicLeaderboardEntry[];
  recentActivity: PublicActivityItem[];
};

export type PublicSprayCreatedPayload = {
  eventId: string;
  pending: boolean;
  showAmounts: boolean;
  stats: {
    totalSprayed: string | null;
    giversCount?: number;
  };
  activity: PublicActivityItem;
};
