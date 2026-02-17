'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { UserDetailsModal } from '@/components/features/users/UserDetailsModal';
import { formatCurrency, formatTier } from '@/lib/utils/format';
import { usersApi } from '@/lib/api/users';
import type { User } from '@/lib/types/api';

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, statusFilter]);

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('userId');
    router.push(`/users${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/users?userId=${userId}`);
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', { search, tier: tierFilter !== 'all' ? tierFilter : undefined, utilityBillStatus: statusFilter !== 'all' ? statusFilter : undefined, page, limit }],
    queryFn: () =>
      usersApi.getUsers({
        search,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        utilityBillStatus: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit,
      }),
  });

  const users: User[] = usersData?.users || [];
  const pagination = usersData?.pagination;

  // Check if any filters are currently applied
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
    try {
      const params: any = {};
      if (search) params.search = search;
      if (tierFilter !== 'all') params.tier = tierFilter;
      if (statusFilter !== 'all') params.utilityBillStatus = statusFilter;

      const blob = await usersApi.exportUsers(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export users. Please try again.');
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
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: 'noBill', label: 'No Bill' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

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
              <TableHeader>Actions</TableHeader>
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
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleUserClick(user.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {user.username || user.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 13)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.customer ? (
                      <Badge variant={user.customer.tier === 'TIER_1' ? 'info' : user.customer.tier === 'TIER_2' ? 'warning' : 'success'}>
                        {formatTier(user.customer.tier || 'TIER_0')}
                      </Badge>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(user.customer?.wallets?.[0]?.availableBalance || '0')}</TableCell>
                  <TableCell>
                    {user.customer?.utilityBillStatus ? (
                      <Badge
                        variant={
                          user.customer.utilityBillStatus === 'APPROVED'
                            ? 'success'
                            : user.customer.utilityBillStatus === 'PENDING'
                            ? 'warning'
                            : user.customer.utilityBillStatus === 'REJECTED'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {user.customer.utilityBillStatus}
                      </Badge>
                    ) : (
                      <Badge variant="default">No Bill</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button className="text-gray-400 hover:text-gray-600">⋯</button>
                  </TableCell>
                </TableRow>
              ))
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

      {userId && (
        <UserDetailsModal userId={userId} onClose={handleCloseModal} />
      )}
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

