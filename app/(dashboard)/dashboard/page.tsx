'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { analyticsApi } from '@/lib/api/analytics';
import { eventsApi } from '@/lib/api/events';
import { dashboardApi } from '@/lib/api/dashboard';

export default function DashboardPage() {
  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'transaction-summary'],
    queryFn: () => analyticsApi.getTransactionSummary(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getEvents({ limit: 5 }),
  });

  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardApi.getMetrics(),
  });

  // Use API data or fallback to defaults
  const metrics = {
    totalUsers: dashboardMetrics?.totalUsers ?? 0,
    totalEvents: dashboardMetrics?.totalEvents ?? 0,
    revenue: dashboardMetrics?.revenue ? formatCurrency(dashboardMetrics.revenue) : 'N0',
    pendingKYC: dashboardMetrics?.pendingKyc ?? 0,
  };

  const topEvents = eventsData?.events?.slice(0, 4) || [];

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
          change={4.2}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents}
          icon={Calendar}
          change={4.2}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Revenue"
          value={metrics.revenue}
          icon={DollarSign}
          change={4.2}
          changeLabel="vs last 7 days"
        />
        <MetricCard
          title="Pending KYC"
          value={metrics.pendingKYC.toLocaleString()}
          icon={Clock}
          attention
        />
      </div>

      <Card title="Transaction Analytics">
        <div className="mb-4 flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            7 Days
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium">
            30 Days
          </button>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Transaction chart will be displayed here</p>
        </div>
      </Card>

      <Card title="Top Events Performance">
        <div className="space-y-4">
          {topEvents.map((event, index) => (
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
                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(event.totalSprayed || '0')} - {event.uniqueSprayerCount || 0} Sprayers
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
                      <p className="text-sm text-gray-500">Started 2h ago</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
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
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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

