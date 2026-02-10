// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
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
  customer?: Customer;
}

export interface Customer {
  id: string;
  tier: 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';
  isAmlRestricted: boolean;
  wallets?: Wallet[];
  withdrawalLimit?: WithdrawalLimit;
}

export interface Wallet {
  id: string;
  balance: string;
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
  token: string;
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

export interface RoleDetails {
  role: string;
  admins: AdminDetails[];
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
  };
  participantCount?: number;
  sprayCount?: number;
  totalSprayed?: string;
  uniqueSprayerCount?: number;
  createdAt: string;
}

export interface EventsResponse {
  events: Event[];
  pagination: Pagination;
}

export interface EventDetails extends Event {
  location?: string;
  time?: string;
  performers?: Performer[];
  sprayActivity?: SprayActivity[];
  topSprayers?: TopSprayer[];
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
  amount: string;
  rank: number;
}

// Transaction Types (assumed)
export interface Transaction {
  id: string;
  userId: string;
  user?: User;
  amount: string;
  type: 'Received' | 'Withdraw';
  tier: string;
  status: string;
  date: string;
  referenceCode?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface TransactionDetails extends Transaction {
  transactionId: string;
  dateTime: string;
  paymentMethod: string;
  destination?: string;
  channel: string;
  fees: string;
  netAmount: string;
  description?: string;
}

// Notifications Types (assumed)
export interface Notification {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Delivered' | 'Failed';
  sentTo: string;
  recipients: number;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: Pagination;
}

