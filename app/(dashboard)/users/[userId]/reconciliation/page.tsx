'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ReconciliationBalanceSummary } from '@/components/features/reconciliation/ReconciliationBalanceSummary';
import { usersApi } from '@/lib/api/users';
import { walletsApi } from '@/lib/api/wallets';
import { transactionsApi } from '@/lib/api/transactions';
import { canOpenReconciliation, getWalletAccountNumber } from '@/lib/utils/kyc';
import {
  formatProviderChannelType,
  formatProviderDirectionLabel,
  getProviderTransactionDirection,
  getProviderTransactionType,
} from '@/lib/utils/provider-transaction';
import { formatCurrency, formatDateTimeWAT } from '@/lib/utils/format';

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

export default function UserReconciliationPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const limit = 20;

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUserDetails(userId),
    enabled: !!userId,
  });

  const accountNumber = getWalletAccountNumber(user?.customer);
  const canReconcile = canOpenReconciliation(user?.customer);

  const { data: walletSnapshot, isLoading: isLoadingSnapshot } = useQuery({
    queryKey: ['wallet-snapshot', accountNumber],
    queryFn: () => walletsApi.getWalletByAccountNumber(accountNumber!),
    enabled: !!accountNumber,
  });

  const { data: internalTx, isLoading: isLoadingInternal } = useQuery({
    queryKey: ['user-reconciliation-internal', userId, page, dateRange],
    queryFn: () =>
      transactionsApi.getTransactions({
        userId,
        page,
        limit,
        startDate: dateRange.from,
        endDate: dateRange.to,
      }),
    enabled: !!userId && canReconcile,
  });

  const { data: providerHistory, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['user-reconciliation-provider', accountNumber, dateRange],
    queryFn: () =>
      walletsApi.getProviderHistory(accountNumber!, {
        from: dateRange.from,
        to: dateRange.to,
        keyWord: '',
      }),
    enabled: !!accountNumber && canReconcile,
  });

  const userName = useMemo(() => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  }, [user]);

  if (isLoadingUser) {
    return <p className="text-gray-500 py-8">Loading user...</p>;
  }

  if (!user) {
    return <p className="text-gray-500 py-8">User not found.</p>;
  }

  if (!canReconcile) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push(`/users?userId=${userId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to user</span>
        </button>
        <Card>
          <p className="text-gray-600">
            Reconciliation is available after Tier 1 is completed and a wallet account exists.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push(`/users?userId=${userId}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to user</span>
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Reconciliation</h1>
        <p className="text-gray-600">{userName} · Account {accountNumber}</p>
      </div>

      <Card title="Balance comparison">
        <ReconciliationBalanceSummary
          snapshot={walletSnapshot?.providerBalanceSnapshot}
          isLoading={isLoadingSnapshot}
        />
      </Card>

      <Card title="Date range">
        <div className="flex flex-wrap gap-4 items-end">
          <Input
            label="From"
            type="date"
            value={dateRange.from}
            onChange={(e) => {
              setPage(1);
              setDateRange((prev) => ({ ...prev, from: e.target.value }));
            }}
          />
          <Input
            label="To"
            type="date"
            value={dateRange.to}
            onChange={(e) => {
              setPage(1);
              setDateRange((prev) => ({ ...prev, to: e.target.value }));
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              setDateRange(defaultDateRange());
            }}
          >
            Reset to last 90 days
          </Button>
        </div>
      </Card>

      <Card title="Internal transactions">
        {isLoadingInternal ? (
          <p className="text-sm text-gray-500">Loading internal transactions...</p>
        ) : internalTx?.transactions?.length ? (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Direction</TableHeader>
                  <TableHeader>Reference</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {internalTx.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDateTimeWAT(tx.createdAt)}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>
                      <Badge variant={tx.direction === 'CREDIT' ? 'success' : 'danger'}>
                        {tx.direction === 'CREDIT' ? 'Credit' : 'Debit'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{tx.reference || tx.narration || '—'}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>{tx.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {internalTx.pagination && internalTx.pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={internalTx.pagination.totalPages}
                  totalItems={internalTx.pagination.total}
                  itemsPerPage={limit}
                  onPageChange={setPage}
                  itemName="transactions"
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No internal transactions in this date range.</p>
        )}
      </Card>

      <Card title="Provider transactions">
        <p className="text-sm text-gray-500 mb-4">
          Full provider history for the selected date range (no keyword filter).
        </p>
        {isLoadingProvider ? (
          <p className="text-sm text-gray-500">Loading provider transactions...</p>
        ) : providerHistory?.transactions?.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Direction</TableHeader>
                  <TableHeader>Channel</TableHeader>
                  <TableHeader>Narration</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {providerHistory.transactions.map((item, index) => {
                  const direction = getProviderTransactionDirection(item);
                  const inferredType = getProviderTransactionType(item);
                  return (
                    <TableRow key={item.tranId || item.referenceId || index}>
                      <TableCell>{item.date || item.transactionDate || '—'}</TableCell>
                      <TableCell>{inferredType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            direction === 'CREDIT' ? 'success' : direction === 'DEBIT' ? 'danger' : 'default'
                          }
                        >
                          {formatProviderDirectionLabel(direction)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatProviderChannelType(item)}</TableCell>
                      <TableCell className="max-w-md truncate">{item.narration || item.title || '—'}</TableCell>
                      <TableCell>{item.amount != null ? formatCurrency(item.amount) : '—'}</TableCell>
                      <TableCell>{item.status || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        ) : (
          <p className="text-sm text-gray-500">No provider transactions in this date range.</p>
        )}
      </Card>
    </div>
  );
}
