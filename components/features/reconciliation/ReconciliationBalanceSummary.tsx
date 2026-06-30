'use client';

import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';
import type { ProviderBalanceSnapshot } from '@/lib/api/wallets';

interface ReconciliationBalanceSummaryProps {
  snapshot: ProviderBalanceSnapshot | null | undefined;
  isLoading?: boolean;
}

export function ReconciliationBalanceSummary({ snapshot, isLoading }: ReconciliationBalanceSummaryProps) {
  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading wallet snapshot...</p>;
  }

  if (!snapshot) {
    return <p className="text-sm text-gray-500">No provider snapshot available for this wallet.</p>;
  }

  return (
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
          {snapshot.availableBalance != null ? formatCurrency(snapshot.availableBalance) : 'Unavailable'}
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
  );
}
