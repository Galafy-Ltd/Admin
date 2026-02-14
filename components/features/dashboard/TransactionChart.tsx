'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrencyAbbreviated } from '@/lib/utils/format';
import type { TransactionAnalytics } from '@/lib/types/api';

interface TransactionChartProps {
  data?: TransactionAnalytics;
  isLoading?: boolean;
}

export function TransactionChart({ data, isLoading }: TransactionChartProps) {
  const chartData = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) {
      return [];
    }

    return data.chartData.map((item) => {
      // Convert amount from kobo to Naira
      const amountInNaira = parseFloat(item.amount) / 100;
      
      // Format date to short day name (Mon, Tue, Wed, etc.)
      let dayName = '';
      try {
        const dateObj = parseISO(item.date);
        dayName = format(dateObj, 'EEE');
      } catch {
        dayName = item.date;
      }

      return {
        date: item.date,
        dayName,
        amount: amountInNaira,
        count: item.count,
      };
    });
  }, [data]);

  // Calculate max value for Y-axis scaling (round up to nearest 50K)
  const maxAmount = useMemo(() => {
    if (chartData.length === 0) return 300000;
    const max = Math.max(...chartData.map((d) => d.amount));
    return Math.ceil(max / 50000) * 50000;
  }, [chartData]);

  // Generate Y-axis ticks
  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const step = maxAmount / 3;
    for (let i = 0; i <= 3; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxAmount]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {format(parseISO(data.date), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-semibold">{formatCurrencyAbbreviated(data.amount)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Transactions: <span className="font-semibold">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading chart data...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No transaction data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="dayName"
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          ticks={yAxisTicks}
          tickFormatter={(value) => formatCurrencyAbbreviated(value)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="none"
          fill="url(#colorAmount)"
          fillOpacity={1}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3B82F6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

