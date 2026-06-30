import type { ProviderTransactionHistoryItem } from '@/lib/api/wallets';

export type ProviderTransactionDirection = 'CREDIT' | 'DEBIT' | 'UNKNOWN';

export type InferredProviderTransactionType =
  | 'INFLOW'
  | 'SPRAY'
  | 'PAYOUT'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'UNKNOWN';

function narrationText(item: ProviderTransactionHistoryItem): string {
  return (item.narration || item.title || '').trim();
}

export function getProviderTransactionDirection(
  item: ProviderTransactionHistoryItem,
): ProviderTransactionDirection {
  const creditType = item.creditType?.trim().toLowerCase();
  if (creditType === 'credit') return 'CREDIT';
  if (creditType === 'debit') return 'DEBIT';
  return 'UNKNOWN';
}

function isEventSprayNarration(text: string): boolean {
  if (!text) return false;
  const hasEventId = /EventId[:\s]+[0-9a-f-]{36}/i.test(text);
  return /Spray in event/i.test(text) || (hasEventId && /Spray/i.test(text));
}

/**
 * Infer Galafy-aligned transaction type from provider history fields.
 * Uses creditType for direction and narration/title for business type (mirrors backend classifiers).
 */
export function getProviderTransactionType(
  item: ProviderTransactionHistoryItem,
): InferredProviderTransactionType {
  const text = narrationText(item);
  const upper = text.toUpperCase();
  const direction = getProviderTransactionDirection(item);

  if (isEventSprayNarration(text) || /WALLET TRANSFER TO/i.test(upper)) {
    return 'SPRAY';
  }

  if (/ADMIN FUNDING FEE/i.test(upper) || /ADMIN PAYOUT FEE/i.test(upper)) {
    return 'ADJUSTMENT';
  }

  if (/COMM ALAT NIP TRANSFER|VAT ALAT NIP TRANSFER/i.test(upper)) {
    return 'ADJUSTMENT';
  }

  if (/WALLET PAYOUT TO/i.test(upper) || /\bPAYOUT\b/i.test(upper)) {
    return 'PAYOUT';
  }

  if (/REVERSAL/i.test(upper) && direction === 'CREDIT') {
    return 'REFUND';
  }

  if (direction === 'CREDIT') {
    return 'INFLOW';
  }

  if (direction === 'DEBIT') {
    return 'PAYOUT';
  }

  return 'UNKNOWN';
}

export function formatProviderChannelType(item: ProviderTransactionHistoryItem): string {
  const channel = item.type?.trim();
  if (!channel || channel.toLowerCase() === 'default') return '—';
  return channel;
}

export function formatProviderDirectionLabel(direction: ProviderTransactionDirection): string {
  if (direction === 'CREDIT') return 'Credit';
  if (direction === 'DEBIT') return 'Debit';
  return '—';
}
