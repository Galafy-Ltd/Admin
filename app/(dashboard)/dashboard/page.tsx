'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { TransactionChart } from '@/components/features/dashboard/TransactionChart';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatCurrencyAbbreviated, formatRelativeTime } from '@/lib/utils/format';
import { analyticsApi } from '@/lib/api/analytics';
import { eventsApi } from '@/lib/api/events';
import { dashboardApi } from '@/lib/api/dashboard';
import type { Event, TopEventBySprayers } from '@/lib/types/api';

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7');

  // Calculate date ranges for the selected period
  const dateRange = useMemo(() => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (selectedPeriod === '7' ? 7 : 30));
    startDate.setHours(0, 0, 0, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [selectedPeriod]);

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', 'transaction-summary', dateRange.startDate, dateRange.endDate],
    queryFn: () => analyticsApi.getTransactionSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  });

  const { data: topEventsData } = useQuery({
    queryKey: ['events', 'top-by-sprayers'],
    queryFn: () => eventsApi.getTopEventsBySprayers(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'recent'],
    queryFn: () => eventsApi.getEvents({ limit: 6 }),
  });

  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardApi.getMetrics(),
  });

  // Use API data or fallback to defaults
  const metrics = {
    totalUsers: dashboardMetrics?.totalUsers ?? 0,
    totalUsersGrowth: dashboardMetrics?.totalUsersGrowth ?? 0,
    totalEvents: dashboardMetrics?.totalEvents ?? 0,
    totalEventsGrowth: dashboardMetrics?.totalEventsGrowth ?? 0,
    revenue: dashboardMetrics?.revenue
      ? formatCurrencyAbbreviated(dashboardMetrics.revenue)
      : 'N0',
    revenueGrowth: dashboardMetrics?.revenueGrowth ?? 0,
    pendingKYC: dashboardMetrics?.pendingKyc ?? 0,
  };

  const topEvents: TopEventBySprayers[] = topEventsData?.events?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your platform performance and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          change={metrics.totalUsersGrowth}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents}
          icon={Calendar}
          change={metrics.totalEventsGrowth}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Revenue"
          value={metrics.revenue}
          icon={DollarSign}
          change={metrics.revenueGrowth}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Pending KYC"
          value={metrics.pendingKYC.toLocaleString()}
          icon={Clock}
          attention
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[13fr_7fr] gap-6 w-full">
        <Card title="Transaction Analytics" className="min-w-0">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setSelectedPeriod('7')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === '7'
                  ? 'bg-[#0D2A68] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('30')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === '30'
                  ? 'bg-[#0D2A68] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              30 Days
            </button>
          </div>
          <TransactionChart data={analytics} isLoading={isLoadingAnalytics} />
        </Card>

        <Card title="Top Events Performance" className="min-w-0">
          <div className="space-y-4">
            {topEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{event.rank}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.sprayerCount || 0} Sprayers
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    event.status === 'LIVE'
                      ? 'success'
                      : event.status === 'SCHEDULED'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Recent Event Oversight">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Event</TableHeader>
              <TableHeader>Host</TableHeader>
              <TableHeader>Amount Raised</TableHeader>
              <TableHeader>Sprayers</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventsData?.events?.slice(0, 6).map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {event.startsAt ? (
                          new Date(event.startsAt) < new Date() 
                            ? `Started ${formatRelativeTime(event.startsAt)}` 
                            : `Starts ${formatRelativeTime(event.startsAt)}`
                        ) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {event.hostUser?.profilePicture ? (
                      <img
                        src={event.hostUser.profilePicture}
                        alt={`${event.hostUser.firstName} ${event.hostUser.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-medium">
                          {event.hostUser?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span>{event.hostUser?.firstName} {event.hostUser?.lastName}</span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(event.totalSprayed || '0')}</TableCell>
                <TableCell>{event.uniqueSprayerCount || 0}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === 'LIVE'
                        ? 'success'
                        : event.status === 'SCHEDULED'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-[#0D2A68] hover:text-[#0D2A68]/80 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

