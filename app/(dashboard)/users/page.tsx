'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatTier } from '@/lib/utils/format';
import { usersApi } from '@/lib/api/users';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, statusFilter]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', { search, tier: tierFilter !== 'all' ? tierFilter : undefined, page, limit }],
    queryFn: () =>
      usersApi.getUsers({
        search,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        page,
        limit,
      }),
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
        <p className="text-gray-600">Monitor and manage all your users in one place.</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Users' },
            { value: 'Tier_0', label: 'Tier 0' },
            { value: 'Tier_1', label: 'Tier 1' },
            { value: 'Tier_2', label: 'Tier 2' },
            { value: 'Tier_3', label: 'Tier 3' },
            
          ]}
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        />
        <Select
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'verified', label: 'Verified' },
            { value: 'pending', label: 'Pending' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
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
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 13)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.customer?.tier === 'TIER_1' ? 'info' : user.customer?.tier === 'TIER_2' ? 'warning' : 'success'}>
                      {formatTier(user.customer?.tier || 'TIER_0')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{user.email}</p>
                      <p className="text-sm text-gray-500">+234 xxx xxx xxxx</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(user.customer?.wallets?.[0]?.balance || '0')}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Verified' : 'Pending'}
                    </Badge>
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
    </div>
  );
}

