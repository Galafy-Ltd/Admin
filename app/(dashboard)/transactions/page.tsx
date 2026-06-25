'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDown, ArrowUp, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatDateTimeWAT } from '@/lib/utils/format';
import { transactionsApi } from '@/lib/api/transactions';
import { analyticsApi } from '@/lib/api/analytics';
import type { Transaction, TransactionStatus, TransactionType, TransactionDirection } from '@/lib/types/api';

function statusVariant(status: TransactionStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'PENDING' || status === 'PROCESSING') return 'warning';
  if (status === 'FAILED' || status === 'REVERSED') return 'danger';
  return 'default';
}

export default function TransactionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', { page, limit, statusFilter, typeFilter, directionFilter, search: debouncedSearch }],
    queryFn: () =>
      transactionsApi.getTransactions({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        direction: directionFilter !== 'all' ? directionFilter : undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'transaction-summary'],
    queryFn: () => analyticsApi.getTransactionSummary(),
  });

  const transactions: Transaction[] = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  const hasFilters = statusFilter !== 'all' || typeFilter !== 'all' || directionFilter !== 'all' || !!debouncedSearch;

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
          change={analytics?.totalWalletBalanceGrowth ?? 0}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Received"
          value={formatCurrency(analytics?.totalReceived || '0')}
          icon={ArrowDown}
          change={analytics?.totalReceivedGrowth ?? 0}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Withdrawn"
          value={formatCurrency(analytics?.totalWithdrawn || '0')}
          icon={ArrowUp}
          change={analytics?.totalWithdrawnGrowth ?? 0}
          changeLabel="vs last 7 days"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDirectionFilter('all');
                  setSearch('');
                  setPage(1);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search reference, narration, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REVERSED', label: 'Reversed' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
            <Select
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'INFLOW', label: 'Inflow' },
                { value: 'SPRAY', label: 'Spray' },
                { value: 'PAYOUT', label: 'Payout' },
                { value: 'REFUND', label: 'Refund' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
              ]}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
            <Select
              options={[
                { value: 'all', label: 'All Directions' },
                { value: 'CREDIT', label: 'Credit' },
                { value: 'DEBIT', label: 'Debit' },
              ]}
              value={directionFilter}
              onChange={(e) => {
                setDirectionFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Date & Time</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Amount</TableHeader>
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/transactions/${transaction.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={transaction.user?.profilePicture}
                        name={`${transaction.user?.firstName || ''} ${transaction.user?.lastName || ''}`.trim()}
                        email={transaction.user?.email}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">
                          {transaction.user?.username || transaction.user?.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.reference}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTimeWAT(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {transaction.type} / {transaction.direction}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(transaction.status as TransactionStatus)}>
                      {transaction.status}
                    </Badge>
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
