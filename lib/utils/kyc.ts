import type { Customer } from '@/lib/types/api';

export type KycTierStatus = 'pending' | 'completed';
export type KycTier = 'Tier_0' | 'Tier_1' | 'Tier_2' | 'Tier_3';

export interface TierProgressItem {
  tier: 1 | 2 | 3;
  label: string;
  description: string;
  status: KycTierStatus;
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

export function getTier1Status(customer?: Customer | null): KycTierStatus {
  if (!customer) return 'pending';
  return isTier1Complete(customer) ? 'completed' : 'pending';
}

export function getTier2Status(customer?: Customer | null): KycTierStatus {
  if (!customer) return 'pending';
  if (!isTier1Complete(customer)) return 'pending';
  return isTier2Complete(customer) ? 'completed' : 'pending';
}

export function getTier3Status(customer?: Customer | null): KycTierStatus {
  if (!customer) return 'pending';
  if (!isTier2Complete(customer)) return 'pending';
  return isTier3Complete(customer) ? 'completed' : 'pending';
}

/** Status for the user's current tier level */
export function getTierKycStatus(customer?: Customer | null): KycTierStatus {
  if (!customer) return 'pending';

  const tier = getCustomerTier(customer);
  switch (tier) {
    case 'Tier_0':
      return 'pending';
    case 'Tier_1':
      return getTier1Status(customer);
    case 'Tier_2':
      return getTier2Status(customer);
    case 'Tier_3':
      return getTier3Status(customer);
    default:
      return 'pending';
  }
}

/** True if any tier has a pending state */
export function isPendingKyc(customer?: Customer | null): boolean {
  if (!customer) return true;
  return (
    getTier1Status(customer) === 'pending' ||
    getTier2Status(customer) === 'pending' ||
    getTier3Status(customer) === 'pending'
  );
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
  return (
    customer.tier === 'Tier_3' &&
    customer.tier3UpgradeStatus === 'PENDING'
  );
}
