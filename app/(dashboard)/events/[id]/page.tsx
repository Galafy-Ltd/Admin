'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Ban,
  Search,
  ExternalLink,
  Users,
  DollarSign,
  Mic,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { eventsApi } from '@/lib/api/events';
import type { SprayActivity, TopSprayer, Performer } from '@/lib/types/api';
import { formatDistanceToNow } from 'date-fns';

export default function EventDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const eventId = params.id as string;

  const [spraySearch, setSpraySearch] = useState('');
  const [amountFilter, setAmountFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showAnonymous, setShowAnonymous] = useState(false);

  const { data: eventDetails, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventDetails(eventId),
  });

  const { data: sprayActivity } = useQuery({
    queryKey: ['event', eventId, 'spray-activity', spraySearch, amountFilter, timeFilter],
    queryFn: () =>
      eventsApi.getSprayActivity(eventId, {
        search: spraySearch || undefined,
        page: 1,
        limit: 20,
      }),
    enabled: !!eventId,
  });

  const { data: topSprayers } = useQuery({
    queryKey: ['event', eventId, 'top-sprayers', showAnonymous],
    queryFn: () =>
      eventsApi.getTopSprayers(eventId, {
        includeAnonymous: showAnonymous,
        limit: 10,
      }),
    enabled: !!eventId,
  });

  const suspendMutation = useMutation({
    mutationFn: () => eventsApi.suspendEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleDownloadReport = async () => {
    try {
      const blob = await eventsApi.downloadEventReport(eventId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-report-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    }
  };

  const handleSuspend = () => {
    if (confirm('Are you sure you want to suspend this event?')) {
      suspendMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading event details...</p>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  const statusBadgeVariant =
    eventDetails.status === 'LIVE'
      ? 'success'
      : eventDetails.status === 'SCHEDULED'
      ? 'warning'
      : eventDetails.status === 'ENDED'
      ? 'default'
      : 'default';

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {eventDetails.imageUrl && (
            <img
              src={eventDetails.imageUrl}
              alt={eventDetails.title}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{eventDetails.title}</h1>
              <Badge variant={statusBadgeVariant}>
                {eventDetails.status === 'LIVE' && '• Live'}
                {eventDetails.status === 'SCHEDULED' && '• Scheduled'}
                {eventDetails.status === 'ENDED' && '• Ended'}
                {eventDetails.status === 'CANCELLED' && '• Cancelled'}
              </Badge>
            </div>
          <div className="flex items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(eventDetails.startsAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{new Date(eventDetails.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</span>
            </div>
            {eventDetails.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{eventDetails.location}</span>
              </div>
            )}
          </div>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button variant="primary" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="danger" onClick={handleSuspend} disabled={suspendMutation.isPending}>
            <Ban className="h-4 w-4 mr-2" />
            Suspend Event
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount Sprayed</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(eventDetails.totalSprayed || '0')}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sprayers</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventDetails.uniqueSprayerCount || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mic className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventDetails.performers?.filter((p) => p.status === 'Active').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spray Activity Feed - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Spray Activity Feed">
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search sprayers..."
                    value={spraySearch}
                    onChange={(e) => setSpraySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  options={[
                    { value: 'all', label: 'All Amounts' },
                    { value: '0-10000', label: 'N0 - N10,000' },
                    { value: '10000-50000', label: 'N10,000 - N50,000' },
                    { value: '50000+', label: 'N50,000+' },
                  ]}
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                  ]}
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                />
              </div>

              {/* Activity List */}
              <div className="space-y-4">
                {sprayActivity?.sprays?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No spray activity found</p>
                ) : (
                  sprayActivity?.sprays?.map((spray: SprayActivity) => (
                    <div key={spray.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {spray.user?.firstName?.charAt(0) || spray.user?.email?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {spray.user?.firstName && spray.user?.lastName
                              ? `${spray.user.firstName} ${spray.user.lastName}`
                              : spray.user?.email || 'Anonymous User'}
                            {!spray.user && <span className="text-gray-500 ml-1">*</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(spray.amount)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(spray.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {spray.comment && (
                          <p className="text-sm text-gray-600 mt-1">{spray.comment}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Sprayers */}
          <Card title="Top Sprayers">
            <div className="space-y-4">
              <Toggle
                label="Show Anon"
                checked={showAnonymous}
                onChange={(e) => setShowAnonymous(e.target.checked)}
              />
              <div className="space-y-3">
                {topSprayers?.leaderboard?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No sprayers yet</p>
                ) : (
                  topSprayers?.leaderboard?.map((sprayer: TopSprayer, index: number) => (
                    <div
                      key={sprayer.userId || index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-700">{sprayer.rank || index + 1}.</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {sprayer.user?.firstName?.charAt(0) || sprayer.user?.email?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {sprayer.user?.firstName && sprayer.user?.lastName
                              ? `${sprayer.user.firstName} ${sprayer.user.lastName}`
                              : sprayer.user?.email || 'Anonymous User'}
                            {!sprayer.user && <span className="text-gray-500 ml-1">*</span>}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(sprayer.totalAmount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Performers & Celebrant */}
          <Card title="Performers & Celebrant">
            <div className="space-y-3">
              {eventDetails.performers?.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No performers</p>
              ) : (
                eventDetails.performers?.map((performer: Performer) => (
                  <div
                    key={performer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          performer.type === 'Celebrant'
                            ? 'bg-pink-500'
                            : performer.type === 'T2 Verified'
                            ? 'bg-blue-500'
                            : 'bg-purple-500'
                        }`}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{performer.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={performer.status === 'Active' ? 'success' : 'default'}
                            className="text-xs"
                          >
                            {performer.type}
                          </Badge>
                          <span
                            className={`text-xs ${
                              performer.status === 'Active' ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            • {performer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

