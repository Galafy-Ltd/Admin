'use client';

import { Info } from 'lucide-react';

export function TierMessagingBanner() {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <Info className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-blue-900">Tier-Based Messaging</p>
        <p className="text-sm text-blue-800/80">
          Send KYC upgrade reminders to users on Tier 0, Tier 1 and Tier 2. Tier 3 users are
          excluded.
        </p>
      </div>
    </div>
  );
}
