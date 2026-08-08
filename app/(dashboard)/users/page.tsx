'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, X, Users, UserCheck, Wallet, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { UserDetailsModal } from '@/components/features/users/UserDetailsModal';
import { UsersStatCard } from '@/components/features/users/UsersStatCard';
import { formatCurrency } from '@/lib/utils/format';
import {
  formatTierLabel,
  getKycStatusBadgeVariant,
  getKycStatusLabel,
  getTierKycStatus,
} from '@/lib/utils/kyc';
import { usersApi } from '@/lib/api/users';
import {
  getReconciliationStatusBadgeVariant,
  getReconciliationStatusLabel,
} from '@/lib/utils/reconciliation';
import type { User, KycTier } from '@/lib/types/api';

function tierBadgeVariant(tier?: KycTier | null): 'info' | 'warning' | 'success' | 'default' {
  if (!tier || tier === 'Tier_0') return 'default';
  if (tier === 'Tier_1') return 'info';
  if (tier === 'Tier_2') return 'warning';
  return 'success';
}

function parseKycStatusParam(value: string | null): 'all' | 'pending' | 'completed' {
  return value === 'pending' || value === 'completed' ? value : 'all';
}

type ReconciliationFilter = 'all' | 'mismatch' | 'in_sync' | 'unavailable';

function parseReconciliationParam(
  reconciliationStatus: string | null,
  hasMismatchLegacy: string | null,
): ReconciliationFilter {
  if (
    reconciliationStatus === 'mismatch' ||
    reconciliationStatus === 'in_sync' ||
    reconciliationStatus === 'unavailable'
  ) {
    return reconciliationStatus;
  }
  // Legacy URL support: ?hasMismatch=true|false
  if (hasMismatchLegacy === 'true') return 'mismatch';
  if (hasMismatchLegacy === 'false') return 'in_sync';
  return 'all';
}

type CreatedPreset = 'all' | '7' | '30' | '90' | 'custom';

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveCreatedDateRange(
  preset: CreatedPreset,
  customStart: string,
  customEnd: string,
): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    };
  }

  const days = Number(preset);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const userId = searchParams.get('userId');
  const initialKycStatus = searchParams.get('kycStatus');
  const initialReconciliation = parseReconciliationParam(
    searchParams.get('reconciliationStatus'),
    searchParams.get('hasMismatch'),
  );

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(parseKycStatusParam(initialKycStatus));
  const [reconciliationFilter, setReconciliationFilter] =
    useState<ReconciliationFilter>(initialReconciliation);
  const [createdPreset, setCreatedPreset] = useState<CreatedPreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const limit = 20;

  const createdDateRange = useMemo(
    () => resolveCreatedDateRange(createdPreset, customStart, customEnd),
    [createdPreset, customStart, customEnd],
  );

  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, statusFilter, reconciliationFilter, createdPreset, customStart, customEnd]);

  // URL → filter state (e.g. dashboard link /users?kycStatus=pending)
  useEffect(() => {
    const nextStatus = parseKycStatusParam(searchParams.get('kycStatus'));
    const nextReconciliation = parseReconciliationParam(
      searchParams.get('reconciliationStatus'),
      searchParams.get('hasMismatch'),
    );
    setStatusFilter((prev) => (prev === nextStatus ? prev : nextStatus));
    setReconciliationFilter((prev) => (prev === nextReconciliation ? prev : nextReconciliation));
  }, [searchParams]);

  // Filter state → URL. Do not depend on searchParams (avoids ping-pong with the effect above).
  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    const currentKyc = params.get('kycStatus');
    const currentRecon = params.get('reconciliationStatus');
    const desiredKyc = statusFilter === 'all' ? null : statusFilter;
    const desiredRecon = reconciliationFilter === 'all' ? null : reconciliationFilter;

    // Drop legacy hasMismatch once we own URL state
    params.delete('hasMismatch');

    if (currentKyc === desiredKyc && currentRecon === desiredRecon) {
      return;
    }

    if (desiredKyc) params.set('kycStatus', desiredKyc);
    else params.delete('kycStatus');
    if (desiredRecon) params.set('reconciliationStatus', desiredRecon);
    else params.delete('reconciliationStatus');

    const next = params.toString();
    router.replace(`/users${next ? `?${next}` : ''}`);
  }, [statusFilter, reconciliationFilter, router]);

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('userId');
    router.push(`/users${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleUserClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('userId', id);
    router.push(`/users?${params.toString()}`);
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: [
      'users',
      {
        search,
        tier: tierFilter,
        kycStatus: statusFilter,
        reconciliationStatus: reconciliationFilter,
        createdPreset,
        startDate: createdDateRange.startDate,
        endDate: createdDateRange.endDate,
        page,
        limit,
      },
    ],
    queryFn: () =>
      usersApi.getUsers({
        search: search || undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        kycStatus: statusFilter !== 'all' ? (statusFilter as 'pending' | 'completed') : undefined,
        reconciliationStatus:
          reconciliationFilter === 'all'
            ? undefined
            : (reconciliationFilter as 'in_sync' | 'mismatch' | 'unavailable'),
        startDate: createdDateRange.startDate,
        endDate: createdDateRange.endDate,
        page,
        limit,
      }),
  });

  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getUserStats(),
  });

  const users: User[] = usersData?.users || [];
  const pagination = usersData?.pagination;

  const hasActiveFilters = useMemo(() => {
    return !!(
      search ||
      tierFilter !== 'all' ||
      statusFilter !== 'all' ||
      reconciliationFilter !== 'all' ||
      createdPreset !== 'all'
    );
  }, [search, tierFilter, statusFilter, reconciliationFilter, createdPreset]);

  const handleClearFilters = () => {
    setSearch('');
    setTierFilter('all');
    setStatusFilter('all');
    setReconciliationFilter('all');
    setCreatedPreset('all');
    setCustomStart('');
    setCustomEnd('');
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (tierFilter !== 'all') params.tier = tierFilter;
      if (statusFilter !== 'all') params.kycStatus = statusFilter;
      if (reconciliationFilter !== 'all') params.reconciliationStatus = reconciliationFilter;
      if (createdDateRange.startDate) params.startDate = createdDateRange.startDate;
      if (createdDateRange.endDate) params.endDate = createdDateRange.endDate;

      const blob = await usersApi.exportUsers(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setExportError('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
        <p className="text-gray-600">Monitor and manage all your users in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingStats || !userStats ? (
          <>
            <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          </>
        ) : (
          <>
            <UsersStatCard
              title="Total Users"
              value={userStats.totalUsers}
              icon={Users}
              footer={`+${userStats.totalUsersLast30Days.toLocaleString()} in 30 days`}
            />
            <UsersStatCard
              title="Unverified Users"
              value={userStats.unverifiedUsers}
              icon={UserCheck}
              footer={`+${userStats.unverifiedUsersLast30Days.toLocaleString()} in 30 days`}
            />
            <UsersStatCard
              title="Wallet Activated"
              value={userStats.walletActivated}
              icon={Wallet}
              footer={`+${userStats.walletActivatedLast30Days.toLocaleString()} in 30 days`}
            />
            <UsersStatCard
              title="Active Users"
              value={userStats.activeUsersLast30Days}
              icon={Activity}
              footer="Logged in last 30 days"
            />
          </>
        )}
      </div>

      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Users' },
            { value: 'Tier_0', label: 'Tier 0' },
            { value: 'Tier_1', label: 'Tier 1' },
            { value: 'Tier_2', label: 'Tier 2' },
            { value: 'Tier_3', label: 'Tier 3' },
            { value: 'NoTier', label: 'No Tier' },
          ]}
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        />
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(parseKycStatusParam(e.target.value))}
        />
        <Select
          options={[
            { value: 'all', label: 'All Reconciliation' },
            { value: 'mismatch', label: 'Mismatch' },
            { value: 'in_sync', label: 'In Sync' },
            { value: 'unavailable', label: 'Unavailable' },
          ]}
          value={reconciliationFilter}
          onChange={(e) => {
            const value = e.target.value;
            setReconciliationFilter(
              value === 'mismatch' || value === 'in_sync' || value === 'unavailable' ? value : 'all',
            );
          }}
        />
        <Select
          options={[
            { value: 'all', label: 'Created: All time' },
            { value: '7', label: 'Created: Last 7 days' },
            { value: '30', label: 'Created: Last 30 days' },
            { value: '90', label: 'Created: Last 90 days' },
            { value: 'custom', label: 'Created: Custom' },
          ]}
          value={createdPreset}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '7' || value === '30' || value === '90' || value === 'custom') {
              setCreatedPreset(value);
            } else {
              setCreatedPreset('all');
            }
          }}
        />
        {createdPreset === 'custom' && (
          <>
            <Input
              label="From"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </>
        )}
      </div>

      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {exportError}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          ) : (
            <h2 className="text-xl font-semibold">All Users</h2>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Username</TableHeader>
              <TableHeader>Tier</TableHeader>
              <TableHeader>Contact</TableHeader>
              <TableHeader>Wallet Balance</TableHeader>
              <TableHeader>Reconciliation</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const kycStatus = getTierKycStatus(user.customer);
                return (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.profilePicture}
                          name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                          email={user.email}
                          size="md"
                        />
                        <div>
                          <p className="font-medium">{user.username || user.email || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">ID: {user.id.slice(0, 13)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tierBadgeVariant(user.customer?.tier)}>
                        {formatTierLabel(user.customer?.tier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(user.customer?.wallets?.[0]?.availableBalance || '0')}</TableCell>
                    <TableCell>
                      <Badge variant={getReconciliationStatusBadgeVariant(user.reconciliationStatus)}>
                        {getReconciliationStatusLabel(user.reconciliationStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getKycStatusBadgeVariant(kycStatus)}>
                        {getKycStatusLabel(kycStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {pagination && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={limit}
            onPageChange={setPage}
            itemName="Users"
          />
        )}
      </Card>

      {userId && <UserDetailsModal userId={userId} onClose={handleCloseModal} />}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
