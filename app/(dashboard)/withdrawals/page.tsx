'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import type { Withdrawal } from '@/lib/types/api';

export default function WithdrawalsPage() {
  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalsApi.getWithdrawals({ limit: 20 }),
  });

  const withdrawals: Withdrawal[] = withdrawalsData?.withdrawals || withdrawalsData?.payouts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawals Management</h1>
        <p className="text-gray-600">Monitor and approve withdrawal requests.</p>
      </div>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No withdrawals found
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div>
                        <p className="font-medium">
                          {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell>{formatDate(withdrawal.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        withdrawal.status === 'SUCCESS'
                          ? 'success'
                          : withdrawal.status === 'PENDING' || withdrawal.status === 'PROCESSING'
                          ? 'warning'
                          : withdrawal.status === 'REJECTED' || withdrawal.status === 'FAILED'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary">Approve</Button>
                      <Button size="sm" variant="danger">Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

