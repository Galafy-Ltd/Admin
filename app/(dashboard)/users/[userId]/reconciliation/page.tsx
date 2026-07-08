'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ReconciliationBalanceSummary } from '@/components/features/reconciliation/ReconciliationBalanceSummary';
import { usersApi } from '@/lib/api/users';
import { walletsApi } from '@/lib/api/wallets';
import { transactionsApi } from '@/lib/api/transactions';
import { canOpenReconciliation, getWalletAccountNumber } from '@/lib/utils/kyc';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
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
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const userId = params.userId as string;
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustMessage, setAdjustMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const limit = 20;
  const canAdjustBalances = hasPermission(PERMISSIONS.ADJUST_INTERNAL_BALANCES);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUserDetails(userId),
    enabled: !!userId,
  });

  const accountNumber = getWalletAccountNumber(user?.customer);
  const walletId = user?.customer?.wallets?.[0]?.id;
  const canReconcile = canOpenReconciliation(user?.customer);

  const adjustMutation = useMutation({
    mutationFn: () =>
      walletsApi.adjustInternalBalance(walletId!, {
        direction: adjustDirection,
        amount: adjustAmount,
        reference: adjustReference.trim(),
        reason: adjustReason.trim(),
      }),
    onSuccess: () => {
      setAdjustMessage({ type: 'success', text: 'Internal balance adjusted successfully.' });
      setAdjustAmount('');
      setAdjustReference('');
      setAdjustReason('');
      queryClient.invalidateQueries({ queryKey: ['wallet-snapshot', accountNumber] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-reconciliation-internal', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setAdjustMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to adjust internal balance.',
      });
    },
  });

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

      {canAdjustBalances && walletId && (
        <Card title="Manual internal balance adjustment">
          <p className="text-sm text-gray-500 mb-4">
            Apply a controlled internal CREDIT or DEBIT for reconciliation correction. A unique reference and reason are required.
          </p>
          {adjustMessage && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                adjustMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {adjustMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Direction"
              options={[
                { value: 'CREDIT', label: 'Credit' },
                { value: 'DEBIT', label: 'Debit' },
              ]}
              value={adjustDirection}
              onChange={(e) => setAdjustDirection(e.target.value as 'CREDIT' | 'DEBIT')}
            />
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
            />
            <Input
              label="Reference"
              placeholder="Unique adjustment reference"
              value={adjustReference}
              onChange={(e) => setAdjustReference(e.target.value)}
            />
            <Input
              label="Reason"
              placeholder="Why this adjustment is needed"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button
              onClick={() => adjustMutation.mutate()}
              isLoading={adjustMutation.isPending}
              disabled={!adjustAmount || !adjustReference.trim() || !adjustReason.trim()}
            >
              Apply Adjustment
            </Button>
          </div>
        </Card>
      )}

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
