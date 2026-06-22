import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  change?: number;
  changeLabel?: string;
  attention?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  attention,
}) => {
  const isCurrency = typeof value === 'string' && (value.includes('N') || value.includes('₦'));
  const displayValue = isCurrency ? value : typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{displayValue}</p>
          {change !== undefined && changeLabel && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(change)} {changeLabel}
            </p>
          )}
          {attention && (
            <p className="text-sm text-orange-600">Requires attention</p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );
};

