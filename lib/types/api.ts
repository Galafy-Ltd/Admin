// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  admin?: Admin;
  requires2FA?: boolean;
  requires2FAEnrollment?: boolean;
  tempToken?: string;
  message?: string;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  twoFactorEnabled?: boolean;
  twoFactorEnabledAt?: string | null;
}

export interface TwoFactorSetupResponse {
  otpauthUrl: string;
  secret: string;
}

export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean;
  twoFactorEnabledAt?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  username?: string;
  phone?: string;
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string;
  customer?: Customer;
}

export type KycTier = 'Tier_0' | 'Tier_1' | 'Tier_2' | 'Tier_3';
export type TierUpgradeStatus = 'PENDING' | 'COMPLETED';
export type Tier1FaceStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Customer {
  id: string;
  tier: KycTier;
  isAmlRestricted: boolean;
  amlRestrictedAt?: string | null;
  amlRestrictionReason?: string | null;
  isBalanceRestricted?: boolean;
  balanceRestrictionReason?: string | null;
  tier1FaceStatus?: Tier1FaceStatus | null;
  tier1AccountStatus?: string | null;
  tier2UpgradeStatus?: TierUpgradeStatus | null;
  tier3UpgradeStatus?: TierUpgradeStatus | null;
  wallets?: Wallet[];
  withdrawalLimit?: WithdrawalLimit;
}

export interface Wallet {
  id: string;
  balance?: string;
  availableBalance?: string;
  virtualAccountNumber?: string | null;
  currency: string;
}

export interface WithdrawalLimit {
  daily: string;
  monthly: string;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface SearchUsersResponse {
  users: User[];
}

// KYC Types
export interface KYCRequest {
  id: string;
  customerId: string;
  requestedTier: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  customer?: User;
  createdAt: string;
}

export interface KYCRequestsResponse {
  requests: KYCRequest[];
  pagination: Pagination;
}

// Analytics Types
export interface TransactionAnalytics {
  totalWalletBalance: string;
  totalWithdrawn: string;
  totalReceived: string;
  totalWalletBalanceGrowth?: number;
  totalWithdrawnGrowth?: number;
  totalReceivedGrowth?: number;
  chartData: Array<{
    date: string;
    amount: string;
    count: number;
  }>;
  cached: boolean;
  timestamp: string;
  startDate?: string;
  endDate?: string;
}

// Config Types
export interface Config {
  id: string;
  key: string;
  category: string;
  value: string;
  type: string;
  description: string;
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

export interface ConfigsResponse {
  configs: Config[];
  total: number;
}

// AML Alerts Types
export interface AMLAlert {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  walletId: string;
  customerId: string;
  details: Record<string, any>;
  createdAt: string;
  wallet?: Wallet;
}

export interface AlertsResponse {
  alerts: AMLAlert[];
  pagination: Pagination;
}

export interface AlertStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  bySeverity: Record<string, number>;
  pendingBySeverity: Record<string, number>;
}

// Audit Logs Types
export interface AuditLog {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  details: Record<string, any>;
  createdAt: string;
  admin: Admin;
}

export interface LogsResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

// Admin Management Types
export interface InviteAdminRequest {
  email: string;
  role: string;
}

export interface InviteAdminResponse {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  token?: string;
  message: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface AcceptInviteResponse {
  id: string;
  email: string;
  role: string;
  message: string;
}

export interface AdminDetails extends Admin {
  lastLoginAt?: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  updatedAt: string;
  sentInvites?: InviteAdminResponse[];
}

export interface AdminsResponse {
  admins: AdminDetails[];
  pagination: Pagination;
}

// Role Management Types
export interface Role {
  role: string;
  userCount: number;
}

export interface RolesResponse {
  roles: Role[];
}

export interface PendingAdminInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export interface RoleDetails {
  role: string;
  admins: AdminDetails[];
  pendingInvites?: PendingAdminInvite[];
  pagination: Pagination;
}

export interface AssignRoleRequest {
  adminId: string;
}

// Common Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Events Types
export interface Event {
  id: string;
  code: string;
  title: string;
  imageUrl?: string;
  location?: string;
  category?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  startsAt: string;
  hostUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
    profilePicture?: string;
  };
  participantCount?: number;
  sprayCount?: number;
  totalSprayed?: string;
  uniqueSprayerCount?: number;
  deletedAt?: string | null;
  createdAt: string;
}

export interface TopEventBySprayers {
  rank: number;
  id: string;
  title: string;
  code: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  startsAt: string;
  startDate: string;
  location?: string;
  category?: string;
  imageUrl?: string;
  hostUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
    phone?: string;
    profilePicture?: string;
  };
  sprayerCount: number;
  createdAt?: string;
}

export interface TopEventsBySprayersResponse {
  events: TopEventBySprayers[];
}

export interface EventsResponse {
  events: Event[];
  pagination: Pagination;
}

export interface EventMetrics {
  totalEvents: number;
  totalEventsGrowth: number;
  activeEvents: number;
  activeEventsGrowth: number;
  totalAttendees: number;
  totalAttendeesGrowth: number;
  totalSprayed: string;
  totalSprayedGrowth: number;
}

export interface EventDetails extends Event {
  location?: string;
  time?: string;
  performers?: Performer[];
  sprayActivity?: SprayActivity[];
  topSprayers?: TopSprayer[];
  sprays?: Array<{
    id: string;
    totalAmount: string;
    note?: string;
    createdAt: string;
    sprayerWallet?: {
      customer?: {
        user?: {
          username?: string;
          email?: string;
        };
      };
    };
  }>;
  participants?: Array<{
    id: string;
    name?: string;
    username?: string;
    type?: 'Celebrant' | 'T2 Verified' | 'T3 Verified';
    status?: 'Active' | 'Offline';
  }>;
}

export interface SprayActivityResponse {
  sprays: SprayActivity[];
  pagination: Pagination;
}

export interface TopSprayersResponse {
  eventId: string;
  eventTitle: string;
  leaderboard: TopSprayer[];
}

export interface Performer {
  id: string;
  name: string;
  type: 'Celebrant' | 'T2 Verified' | 'T3 Verified';
  status: 'Active' | 'Offline';
}

export interface SprayActivity {
  id: string;
  userId: string;
  user?: User;
  amount: string;
  comment?: string;
  createdAt: string;
}

export interface TopSprayer {
  userId: string;
  user?: User;
  totalAmount: string;
  amount?: string; // Keep for backward compatibility
  rank: number;
  sprayCount?: number;
  firstSprayAt?: string;
  lastSprayAt?: string;
}

export type TransactionType = 'INFLOW' | 'SPRAY' | 'PAYOUT' | 'REFUND' | 'ADJUSTMENT';
export type TransactionDirection = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface Transaction {
  id: string;
  walletId: string;
  amount: string;
  type: TransactionType;
  direction: TransactionDirection;
  status: TransactionStatus;
  reference: string;
  narration?: string | null;
  externalReference?: string | null;
  currencyId?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  event?: {
    id: string;
    title: string;
    code: string;
  };
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface TransactionDetails extends Transaction {
  wallet?: {
    id: string;
    virtualAccountNumber?: string | null;
    customer?: {
      user?: User;
    };
  };
  spray?: {
    event?: {
      id: string;
      title: string;
      code: string;
      status: string;
    };
  };
  fundingTransaction?: Transaction | null;
  payoutTransaction?: {
    id: string;
    status: string;
    fee?: string;
  } | null;
}

// Withdrawal Types
export interface Withdrawal {
  id: string;
  userId?: string;
  user?: User;
  amount: string;
  fee?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'REVERSED';
  transaction?: {
    id: string;
    reference?: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
    createdAt?: string;
  };
  createdAt: string;
  requiresApproval?: boolean;
  approvalReason?: string | null;
  rejectionReason?: string | null;
  bankAccount?: {
    accountNumber: string;
    bankName?: string;
    accountName: string;
    bankCode?: string;
  };
}

export interface WithdrawalsResponse {
  withdrawals?: Withdrawal[];
  payouts?: Withdrawal[];
  pagination: Pagination;
}

export type AdminNotificationType = 'NEW_USER' | 'WITHDRAWAL' | 'TIER_UPGRADE' | 'INFLOW';

export interface Notification {
  id: string;
  type: AdminNotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: Pagination;
}

export interface UnreadCountResponse {
  count: number;
}

