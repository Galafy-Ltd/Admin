'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { UserDetailsModal } from '@/components/features/users/UserDetailsModal';
import { formatCurrency } from '@/lib/utils/format';
import {
  formatTierLabel,
  getKycStatusBadgeVariant,
  getKycStatusLabel,
  getTierKycStatus,
} from '@/lib/utils/kyc';
import { usersApi } from '@/lib/api/users';
import type { User, KycTier } from '@/lib/types/api';

function tierBadgeVariant(tier?: KycTier | null): 'info' | 'warning' | 'success' | 'default' {
  if (!tier || tier === 'Tier_0') return 'default';
  if (tier === 'Tier_1') return 'info';
  if (tier === 'Tier_2') return 'warning';
  return 'success';
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, statusFilter]);

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('userId');
    router.push(`/users${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleUserClick = (id: string) => {
    router.push(`/users?userId=${id}`);
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', { search, tier: tierFilter, kycStatus: statusFilter, page, limit }],
    queryFn: () =>
      usersApi.getUsers({
        search: search || undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        kycStatus: statusFilter !== 'all' ? (statusFilter as 'pending' | 'completed') : undefined,
        page,
        limit,
      }),
  });

  const users: User[] = usersData?.users || [];
  const pagination = usersData?.pagination;

  const hasActiveFilters = useMemo(() => {
    return !!(search || tierFilter !== 'all' || statusFilter !== 'all');
  }, [search, tierFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearch('');
    setTierFilter('all');
    setStatusFilter('all');
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

      <div className="flex gap-4 flex-wrap">
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
          onChange={(e) => setStatusFilter(e.target.value)}
        />
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
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
