'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { transactionsApi } from '@/lib/api/transactions';
import { walletsApi } from '@/lib/api/wallets';
import { formatCurrency, formatDateTimeWAT } from '@/lib/utils/format';

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getTransactionDetails(id),
    enabled: !!id,
  });

  const accountNumber = transaction?.wallet?.virtualAccountNumber || null;

  const historyRange = useMemo(() => {
    if (!transaction?.createdAt) return null;
    const txDate = new Date(transaction.createdAt);
    const fromDate = new Date(txDate);
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date(txDate);
    toDate.setDate(toDate.getDate() + 1);
    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
      keyWord: transaction.narration || transaction.reference,
    };
  }, [transaction]);

  const { data: walletSnapshot, isLoading: isLoadingSnapshot } = useQuery({
    queryKey: ['wallet-snapshot', accountNumber],
    queryFn: () => walletsApi.getWalletByAccountNumber(accountNumber!),
    enabled: !!accountNumber,
  });

  const { data: providerHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['provider-history', accountNumber, historyRange],
    queryFn: () =>
      walletsApi.getProviderHistory(accountNumber!, {
        from: historyRange!.from,
        to: historyRange!.to,
        keyWord: historyRange!.keyWord,
      }),
    enabled: !!accountNumber && !!historyRange,
  });

  const handleDownloadReceipt = async () => {
    const { blob, filename } = await transactionsApi.downloadReceipt(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <p className="text-gray-500 py-8">Loading transaction...</p>;
  }

  if (error || !transaction) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push('/transactions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to transactions
        </Button>
        <p className="text-red-600">Transaction not found.</p>
      </div>
    );
  }

  const user = transaction.user || transaction.wallet?.customer?.user;
  const snapshot = walletSnapshot?.providerBalanceSnapshot;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/transactions')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-gray-600 mt-1">{transaction.reference}</p>
        </div>
        <Button variant="outline" onClick={handleDownloadReceipt}>
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Transaction</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-medium">{formatCurrency(transaction.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd>{transaction.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Direction</dt>
              <dd>{transaction.direction}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <Badge variant={transaction.status === 'SUCCESS' ? 'success' : 'warning'}>
                  {transaction.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date & Time</dt>
              <dd>{formatDateTimeWAT(transaction.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Narration</dt>
              <dd>{transaction.narration || '—'}</dd>
            </div>
            {transaction.externalReference && (
              <div className="flex justify-between">
                <dt className="text-gray-500">External Ref</dt>
                <dd className="text-xs">{transaction.externalReference}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">User</h2>
          {user ? (
            <div className="flex items-center gap-4">
              <Avatar
                src={user.profilePicture}
                name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                email={user.email}
                size="lg"
              />
              <div>
                <p className="font-medium">{user.username || user.email}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No user information</p>
          )}

          {transaction.spray?.event && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Event</h3>
              <p className="text-sm">{transaction.spray.event.title}</p>
              <p className="text-xs text-gray-500">{transaction.spray.event.code}</p>
            </div>
          )}
        </Card>
      </div>

      {accountNumber && (
        <Card title="Reconciliation">
          <div className="space-y-6">
            {isLoadingSnapshot ? (
              <p className="text-sm text-gray-500">Loading wallet snapshot...</p>
            ) : snapshot ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Account</p>
                  <p className="font-medium">{snapshot.walletNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Internal balance</p>
                  <p className="font-medium">{formatCurrency(snapshot.internalAvailableBalance)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Provider balance</p>
                  <p className="font-medium">
                    {snapshot.availableBalance != null
                      ? formatCurrency(snapshot.availableBalance)
                      : 'Unavailable'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Sync status</p>
                  <Badge variant={snapshot.inSync ? 'success' : snapshot.inSync === false ? 'danger' : 'default'}>
                    {snapshot.inSync ? 'In sync' : snapshot.inSync === false ? 'Mismatch' : 'Unknown'}
                  </Badge>
                  {snapshot.discrepancy && (
                    <p className="text-xs text-gray-500 mt-1">Delta: {formatCurrency(snapshot.discrepancy)}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No provider snapshot available for this wallet.</p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Provider history (keyword: {historyRange?.keyWord || transaction.reference})
              </h3>
              {isLoadingHistory ? (
                <p className="text-sm text-gray-500">Loading provider history...</p>
              ) : providerHistory?.transactions?.length ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Narration</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {providerHistory.transactions.map((item, index) => (
                      <TableRow key={item.tranId || item.referenceId || index}>
                        <TableCell>{item.date || item.transactionDate || '—'}</TableCell>
                        <TableCell>{item.narration || item.title || '—'}</TableCell>
                        <TableCell>
                          {item.amount != null ? formatCurrency(item.amount) : '—'}
                        </TableCell>
                        <TableCell>{item.status || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500">No matching provider transactions found.</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
