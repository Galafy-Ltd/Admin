'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const GeneralTab = () => {
  return (
    <div className="max-w-xl">
      <Card title="Platform Controls">
        <div className="space-y-6">
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
              options={[{ value: '24 hours', label: '24 hours' }]}
              value="24 hours"
              disabled
            />
          </div>

          <div>
            <Input
              label="Minimum Account Balance"
              type="text"
              value="₦ 0"
              disabled
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
