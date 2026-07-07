'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatDateTimeWAT } from '@/lib/utils/format';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import type { Withdrawal } from '@/lib/types/api';

function withdrawalStatusVariant(
  status: Withdrawal['status'],
): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'PENDING' || status === 'PROCESSING') return 'warning';
  if (status === 'REJECTED' || status === 'FAILED') return 'danger';
  return 'default';
}

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const limit = 20;

  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ['withdrawals', { page, limit, status: statusFilter }],
    queryFn: () =>
      withdrawalsApi.getWithdrawals({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const withdrawals: Withdrawal[] = withdrawalsData?.withdrawals || withdrawalsData?.payouts || [];
  const pagination = withdrawalsData?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawals</h1>
        <p className="text-gray-600">Monitor withdrawal activity across the platform.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Withdrawals</h2>
          <div className="flex gap-2">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'REVERSED', label: 'Reversed' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
            {statusFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Fee</TableHeader>
              <TableHeader>Bank</TableHeader>
              <TableHeader>Date</TableHeader>
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
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No withdrawals found
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={withdrawal.user?.profilePicture}
                        name={`${withdrawal.user?.firstName || ''} ${withdrawal.user?.lastName || ''}`.trim()}
                        email={withdrawal.user?.email}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">
                          {withdrawal.user?.username || withdrawal.user?.email || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell>{withdrawal.fee ? formatCurrency(withdrawal.fee) : '—'}</TableCell>
                  <TableCell>
                    {withdrawal.bankAccount ? (
                      <div className="text-sm">
                        <p>{withdrawal.bankAccount.accountName}</p>
                        <p className="text-gray-500">{withdrawal.bankAccount.accountNumber}</p>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{formatDateTimeWAT(withdrawal.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={withdrawalStatusVariant(withdrawal.status)}>{withdrawal.status}</Badge>
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
            itemName="Withdrawals"
          />
        )}
      </Card>
    </div>
  );
}
