export type PublicPrivacySettings = {
  showNames: boolean;
  showAmounts: boolean;
  showTotalAmount: boolean;
  showParticipantCount: boolean;
  allowAnonymous: boolean;
  topN: number | null;
};

export type PublicLeaderboardEntry = {
  rank: number;
  displayName: string;
  profilePicture: string | null;
  totalAmount?: string;
  sprayCount: number;
  isAnonymous?: boolean;
};

export type PublicActivityItem = {
  type: 'spray' | 'rank_up';
  displayName: string;
  amount?: string;
  rank?: number;
  createdAt: string;
  isAnonymous?: boolean;
};

export type PublicLeaderboardSnapshot = {
  event: {
    id: string;
    title: string;
    imageUrl: string | null;
    status: string;
    startsAt: string;
  };
  privacy: PublicPrivacySettings;
  showAmounts: boolean;
  stats: {
    totalSprayed: string | null;
    giversCount: number | null;
  };
  leaderboard: PublicLeaderboardEntry[];
  recentActivity: PublicActivityItem[];
};

export type PublicSprayCreatedPayload = {
  eventId: string;
  pending: boolean;
  showAmounts: boolean;
  privacy?: PublicPrivacySettings;
  stats: {
    totalSprayed: string | null;
    giversCount?: number | null;
  };
  activity: PublicActivityItem | null;
};
