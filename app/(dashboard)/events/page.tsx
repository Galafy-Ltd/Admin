'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Calendar, Play, Users, Filter, Download, X, Search } from 'lucide-react';
import { NairaIcon } from '@/components/ui/NairaIcon';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/features/dashboard/MetricCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { eventsApi } from '@/lib/api/events';
import { EventFilterModal, type EventFilters } from '@/components/features/events/EventFilterModal';
import type { Event } from '@/lib/types/api';

function eventStatusVariant(
  status: Event['status'],
  deletedAt?: string | null,
): 'success' | 'warning' | 'danger' | 'default' {
  if (deletedAt) return 'danger';
  if (status === 'LIVE') return 'success';
  if (status === 'SCHEDULED' || status === 'DRAFT') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'default';
}

function getEventStatusLabel(event: Event): string {
  if (event.deletedAt) return 'Deleted';
  if (event.status === 'ENDED') return 'Ended';
  if (event.status === 'DRAFT') return 'Draft';
  if (event.status === 'SCHEDULED') return 'Scheduled';
  if (event.status === 'LIVE') return 'Live';
  if (event.status === 'CANCELLED') return 'Cancelled';
  return event.status;
}

export default function EventsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', { page, limit, ...filters, search: debouncedSearch }],
    queryFn: () => {
      const params: Record<string, unknown> = { page, limit };
      if (filters.status && filters.status !== 'DELETED') params.status = filters.status;
      if (filters.status === 'DELETED' || filters.includeDeleted) params.includeDeleted = true;
      if (filters.hostUserId) params.hostUserId = filters.hostUserId;
      if (filters.categories && filters.categories.length > 0) params.categories = filters.categories;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (debouncedSearch) params.search = debouncedSearch;
      return eventsApi.getEvents(params);
    },
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['events-metrics'],
    queryFn: () => eventsApi.getEventMetrics(),
  });

  const events: Event[] = eventsData?.events || [];
  const pagination = eventsData?.pagination;

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.status ||
      filters.includeDeleted ||
      filters.hostUserId ||
      (filters.categories && filters.categories.length > 0) ||
      filters.startDate ||
      filters.endDate ||
      debouncedSearch
    );
  }, [filters, debouncedSearch]);

  const handleApplyFilters = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchInput('');
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, unknown> = {};
      if (filters.status && filters.status !== 'DELETED') params.status = filters.status;
      if (filters.status === 'DELETED' || filters.includeDeleted) params.includeDeleted = true;
      if (filters.hostUserId) params.hostUserId = filters.hostUserId;
      if (filters.categories && filters.categories.length > 0) params.categories = filters.categories;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (debouncedSearch) params.search = debouncedSearch;

      const blob = await eventsApi.exportEvents(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export events. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Management</h1>
        <p className="text-gray-600">Monitor and manage all your events in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
          <>
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          </>
        ) : metrics ? (
          <>
            <MetricCard title="Total Events" value={metrics.totalEvents} icon={Calendar} change={metrics.totalEventsGrowth} changeLabel="vs last 7 days" />
            <MetricCard title="Active Events" value={metrics.activeEvents} icon={Play} change={metrics.activeEventsGrowth} changeLabel="vs last 7 days" />
            <MetricCard title="Total Attendees" value={metrics.totalAttendees} icon={Users} change={metrics.totalAttendeesGrowth} changeLabel="vs last 7 days" />
            <MetricCard title="Total Sprayed" value={formatCurrency(metrics.totalSprayed)} icon={NairaIcon} change={metrics.totalSprayedGrowth} changeLabel="vs last 7 days" />
          </>
        ) : null}
      </div>

      <Card>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Event Oversight</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFilterModalOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport} isLoading={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title, code, or host (name, email, username)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
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
                  <TableCell>{event.participantCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={eventStatusVariant(event.status, event.deletedAt)}>
                      {getEventStatusLabel(event)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View
                    </Button>
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

      <EventFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
