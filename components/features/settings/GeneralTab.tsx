'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';

export const GeneralTab = () => {
  const [platformStatus, setPlatformStatus] = useState(true);
  const [withdrawalTime, setWithdrawalTime] = useState('24 hours');
  const [minBalance, setMinBalance] = useState('500');
  const [tier1Limit, setTier1Limit] = useState('50000');
  const [tier2Limit, setTier2Limit] = useState('500000');
  const [tier3Limit, setTier3Limit] = useState('Unlimited');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Platform Controls">
        <div className="space-y-6">
          <Toggle
            label="Platform Status"
            description="Toggle between active and maintenance mode"
            checked={platformStatus}
            onChange={(e) => setPlatformStatus(e.target.checked)}
          />

          <div>
            <Select
              label="Default Currency"
              options={[{ value: 'NGN', label: 'NGN (Nigerian Naira)' }]}
              value="NGN"
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">Currently locked to NGN</p>
          </div>

          <div>
            <Select
              label="Withdrawal Processing Time"
              options={[
                { value: '1 hour', label: '1 hour' },
                { value: '24 hours', label: '24 hours' },
                { value: '48 hours', label: '48 hours' },
              ]}
              value={withdrawalTime}
              onChange={(e) => setWithdrawalTime(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Minimum Account Balance"
              type="text"
              value={`₦ ${minBalance}`}
              onChange={(e) => setMinBalance(e.target.value.replace('₦ ', ''))}
            />
          </div>

          <Button className="w-full">Save Settings</Button>
        </div>
      </Card>

      <Card title="Tier-Based Withdrawal Limits">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-gray-900">Tier 1</label>
                <p className="text-sm text-gray-500">Basic verification</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={`₦ ${tier1Limit}`}
                  onChange={(e) => setTier1Limit(e.target.value.replace('₦ ', ''))}
                  className="w-32"
                />
                <button className="text-gray-400 hover:text-gray-600">✏️</button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-gray-900">Tier 2</label>
                <p className="text-sm text-gray-500">Enhanced verification</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={`₦ ${tier2Limit}`}
                  onChange={(e) => setTier2Limit(e.target.value.replace('₦ ', ''))}
                  className="w-32"
                />
                <button className="text-gray-400 hover:text-gray-600">✏️</button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-gray-900">Tier 3 (Verified)</label>
                <p className="text-sm text-gray-500">Full verification</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  options={[
                    { value: 'Unlimited', label: 'Unlimited' },
                    { value: '10000000', label: '₦ 10,000,000' },
                  ]}
                  value={tier3Limit}
                  onChange={(e) => setTier3Limit(e.target.value)}
                  className="w-32"
                />
                <button className="text-gray-400 hover:text-gray-600">✏️</button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Higher tiers unlock higher withdrawal limits based on verified identity and account activity.
            </p>
          </div>

          <Button className="w-full">Update Tier Limits</Button>
        </div>
      </Card>
    </div>
  );
};

