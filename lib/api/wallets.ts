import apiClient from './client';

export interface ProviderBalanceSnapshot {
  walletNumber: string;
  availableBalance: string | null;
  accountType: string | null;
  fetchedAt: string;
  internalAvailableBalance: string;
  internalLedgerBalance: string;
  discrepancy: string | null;
  inSync: boolean | null;
  providerFetchError?: string;
}

export interface WalletByAccountResponse {
  id: string;
  availableBalance: string;
  ledgerBalance: string;
  virtualAccountNumber: string | null;
  providerBalanceSnapshot: ProviderBalanceSnapshot | null;
}

export interface ProviderTransactionHistoryItem {
  title?: string;
  amount?: number;
  type?: string;
  date?: string;
  transactionDate?: string;
  narration?: string;
  status?: string;
  creditType?: string;
  sender?: string;
  senderAccountNumber?: string;
  destinationBank?: string;
  destinationAccountNumber?: string;
  recieverName?: string;
  referenceId?: string;
  tranId?: string;
  rrn?: string;
  balance?: string;
}

export interface ProviderHistoryResponse {
  accountNumber: string;
  from: string;
  to: string;
  keyWord: string;
  transactions: ProviderTransactionHistoryItem[];
  count: number;
}

export type ManualBalanceAdjustmentDirection = 'CREDIT' | 'DEBIT';

export interface ManualBalanceAdjustmentPayload {
  direction: ManualBalanceAdjustmentDirection;
  amount: string;
  reference: string;
  reason: string;
}

export interface ManualBalanceAdjustmentResponse {
  success: boolean;
  message: string;
  walletId: string;
  transactionId: string;
  reference: string;
  availableBalance: string;
  ledgerBalance: string;
}

export const walletsApi = {
  async getWalletByAccountNumber(accountNumber: string): Promise<WalletByAccountResponse> {
    const response = await apiClient.getClient().get<WalletByAccountResponse>(
      `/admin/wallets/account/${encodeURIComponent(accountNumber)}`,
    );
    return response.data;
  },

  async getProviderHistory(
    accountNumber: string,
    params: { from: string; to: string; keyWord?: string },
  ): Promise<ProviderHistoryResponse> {
    const response = await apiClient.getClient().post<ProviderHistoryResponse>(
      `/admin/wallets/account/${encodeURIComponent(accountNumber)}/provider-history`,
      params,
    );
    return response.data;
  },

  async adjustInternalBalance(
    walletId: string,
    payload: ManualBalanceAdjustmentPayload,
  ): Promise<ManualBalanceAdjustmentResponse> {
    const response = await apiClient
      .getClient()
      .post<ManualBalanceAdjustmentResponse>(`/admin/wallets/${walletId}/internal-adjustments`, payload);
    return response.data;
  },
};
