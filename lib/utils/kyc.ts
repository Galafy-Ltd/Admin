import type { Customer } from '@/lib/types/api';

export type KycTierStatus = 'na' | 'pending' | 'completed';
export type KycTier = 'Tier_0' | 'Tier_1' | 'Tier_2' | 'Tier_3';

export interface TierProgressItem {
  tier: 1 | 2 | 3;
  label: string;
  description: string;
  status: 'pending' | 'completed';
}

export function formatTierLabel(tier?: string | null): string {
  if (!tier) return 'Tier 0';
  const normalized = tier.replace(/^TIER_/i, 'Tier_').replace('Tier_', 'Tier ');
  if (normalized === 'Tier 0' || tier === 'Tier_0') return 'Tier 0';
  return normalized;
}

export function getCustomerTier(customer?: Customer | null): KycTier {
  if (!customer?.tier) return 'Tier_0';
  return customer.tier as KycTier;
}

function isTier1Complete(customer: Customer): boolean {
  return (
    customer.tier1FaceStatus === 'COMPLETED' &&
    customer.tier1AccountStatus === 'COMPLETED'
  );
}

function isTier2Complete(customer: Customer): boolean {
  return customer.tier2UpgradeStatus === 'COMPLETED';
}

function isTier3Complete(customer: Customer): boolean {
  return customer.tier3UpgradeStatus === 'COMPLETED';
}

export function getTier1Status(customer?: Customer | null): 'pending' | 'completed' {
  if (!customer) return 'pending';
  return isTier1Complete(customer) ? 'completed' : 'pending';
}

export function getTier2Status(customer?: Customer | null): 'pending' | 'completed' {
  if (!customer) return 'pending';
  if (!isTier1Complete(customer)) return 'pending';
  return isTier2Complete(customer) ? 'completed' : 'pending';
}

export function getTier3Status(customer?: Customer | null): 'pending' | 'completed' {
  if (!customer) return 'pending';
  if (!isTier2Complete(customer)) return 'pending';
  return isTier3Complete(customer) ? 'completed' : 'pending';
}

/** Status for the user's current tier level (list column). */
export function getTierKycStatus(customer?: Customer | null): KycTierStatus {
  const tier = getCustomerTier(customer);
  if (tier === 'Tier_0') return 'na';
  if (!customer) return 'pending';

  switch (tier) {
    case 'Tier_1':
      return isTier1Complete(customer) ? 'completed' : 'pending';
    case 'Tier_2':
      return isTier2Complete(customer) ? 'completed' : 'pending';
    case 'Tier_3':
      return isTier3Complete(customer) ? 'completed' : 'pending';
    default:
      return 'pending';
  }
}

/** True when current tier KYC is pending (Tier_0 / no customer is never pending). */
export function isPendingKyc(customer?: Customer | null): boolean {
  return getTierKycStatus(customer) === 'pending';
}

export function getTierProgress(customer?: Customer | null): TierProgressItem[] {
  return [
    {
      tier: 1,
      label: 'Tier 1',
      description: 'BVN + face biometric + account callback',
      status: getTier1Status(customer),
    },
    {
      tier: 2,
      label: 'Tier 2',
      description: 'NIN + live face verification',
      status: getTier2Status(customer),
    },
    {
      tier: 3,
      label: 'Tier 3',
      description: 'Physical address verification',
      status: getTier3Status(customer),
    },
  ];
}

export function canApproveTier3(customer?: Customer | null): boolean {
  if (!customer) return false;
  return customer.tier === 'Tier_3' && customer.tier3UpgradeStatus === 'PENDING';
}

export function canReverseTier3(customer?: Customer | null): boolean {
  if (!customer) return false;
  return customer.tier === 'Tier_3' && customer.tier3UpgradeStatus === 'COMPLETED';
}

export function getTierDisplayLabel(customer?: Customer | null): string {
  const tier = getCustomerTier(customer);
  if (tier === 'Tier_3' && customer?.tier3UpgradeStatus === 'COMPLETED') {
    return 'Tier 3 - Unlimited';
  }
  if (tier === 'Tier_2') return 'Tier 2 - Basic Access';
  if (tier === 'Tier_1') return 'Tier 1 - Basic';
  return formatTierLabel(tier);
}

export function getAccountStatus(customer?: Customer | null): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (customer?.isAmlRestricted) {
    return { label: 'Restricted', variant: 'danger' };
  }
  if (!customer || isPendingKyc(customer)) {
    return { label: 'Pending', variant: 'warning' };
  }
  return { label: 'Active', variant: 'success' };
}

export function shouldShowTierLimitBanner(customer?: Customer | null): boolean {
  if (!customer) return false;
  const tier = getCustomerTier(customer);
  if (customer.isBalanceRestricted) return true;
  return (
    (tier === 'Tier_2' || (tier === 'Tier_3' && customer.tier3UpgradeStatus !== 'COMPLETED')) &&
    getTier2Status(customer) === 'completed'
  );
}

export function getWalletAccountNumber(customer?: Customer | null): string | null {
  const wallet = customer?.wallets?.find((w) => w.virtualAccountNumber);
  return wallet?.virtualAccountNumber ?? null;
}

export function canOpenReconciliation(customer?: Customer | null): boolean {
  return getTier1Status(customer) === 'completed' && !!getWalletAccountNumber(customer);
}

export function getKycStatusLabel(status: KycTierStatus): string {
  if (status === 'na') return 'N/A';
  if (status === 'completed') return 'Completed';
  return 'Pending';
}

export function getKycStatusBadgeVariant(status: KycTierStatus): 'success' | 'warning' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  return 'default';
}
