'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDown, ArrowUp, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { transactionsApi } from '@/lib/api/transactions';
import { analyticsApi } from '@/lib/api/analytics';
import Link from 'next/link';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', { page, limit }],
    queryFn: () => transactionsApi.getTransactions({ page, limit }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'transaction-summary'],
    queryFn: () => analyticsApi.getTransactionSummary(),
  });

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">Monitor and manage all your transactions in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Wallet Balance"
          value={formatCurrency(analytics?.totalWalletBalance || '0')}
          icon={Wallet}
          change={4.2}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Received"
          value={formatCurrency(analytics?.totalReceived || '0')}
          icon={ArrowDown}
          change={4.2}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Withdrawn"
          value={formatCurrency(analytics?.totalWithdrawn || '0')}
          icon={ArrowUp}
          change={4.2}
          changeLabel="vs last 7 days"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <div className="flex gap-2">
            <Select
              options={[
                { value: 'all', label: 'Status' },
                { value: 'received', label: 'Received' },
                { value: 'withdraw', label: 'Withdraw' },
              ]}
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User name</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Tier</TableHeader>
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div>
                        <p className="font-medium">
                          {transaction.user?.firstName} {transaction.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.user?.id.slice(0, 13)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.tier === 'TIER_1' ? 'info' : transaction.tier === 'TIER_2' ? 'warning' : 'success'}>
                      {transaction.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'Received' ? 'success' : 'warning'}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/transactions/${transaction.id}`}>
                      <button className="text-gray-400 hover:text-gray-600">⋯</button>
                    </Link>
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
            itemName="Transactions"
          />
        )}
      </Card>
    </div>
  );
}

