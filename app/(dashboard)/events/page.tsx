'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Play, Users, DollarSign, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { eventsApi } from '@/lib/api/events';

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', { page, limit }],
    queryFn: () => eventsApi.getEvents({ page, limit }),
  });

  const events = eventsData?.events || [];
  const pagination = eventsData?.pagination;
  
  // Calculate metrics from all events (not just current page)
  // Note: These should ideally come from a separate metrics endpoint
  const metrics = {
    totalEvents: pagination?.total || events.length,
    activeEvents: events.filter((e) => e.status === 'LIVE').length,
    totalAttendees: events.reduce((sum, e) => sum + (e.uniqueSprayerCount || 0), 0),
    totalSprayed: events.reduce((sum, e) => sum + parseFloat(e.totalSprayed || '0'), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Management</h1>
        <p className="text-gray-600">Monitor and manage all your events in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Events" value={metrics.totalEvents} icon={Calendar} change={4.2} changeLabel="vs last 7 days" />
        <MetricCard title="Active Events" value={metrics.activeEvents} icon={Play} change={4.2} changeLabel="vs last 7 days" />
        <MetricCard title="Total Attendees" value={metrics.totalAttendees} icon={Users} change={4.2} changeLabel="vs last 7 days" />
        <MetricCard title="Total Sprayed" value={formatCurrency(metrics.totalSprayed.toString())} icon={DollarSign} change={4.2} changeLabel="vs last 7 days" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Event Oversight</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Event Name</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Revenue</TableHeader>
              <TableHeader>Attendees</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
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
                        <p className="text-sm text-gray-500">{event.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(event.startsAt)}</TableCell>
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
                    <a href={`/events/${event.id}`} className="text-gray-400 hover:text-gray-600">
                      ⋯
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={limit}
            onPageChange={setPage}
            itemName="Events"
          />
        )}
      </Card>
    </div>
  );
}

