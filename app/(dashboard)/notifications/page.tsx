'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ArrowDownToLine, TrendingUp, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDateTimeWAT, formatRelativeTime } from '@/lib/utils/format';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification, AdminNotificationType } from '@/lib/types/api';

function notificationIcon(type: string) {
  switch (type as AdminNotificationType) {
    case 'NEW_USER':
      return UserPlus;
    case 'WITHDRAWAL':
      return ArrowDownToLine;
    case 'TIER_UPGRADE':
      return TrendingUp;
    case 'INFLOW':
      return Wallet;
    default:
      return Wallet;
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 20;

  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', { page, limit, typeFilter, readFilter, startDate, endDate }],
    queryFn: () =>
      notificationsApi.getNotifications({
        page,
        limit,
        type: typeFilter === 'all' ? undefined : typeFilter,
        read:
          readFilter === 'all' ? undefined : readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const notifications: Notification[] = notificationsData?.notifications || [];
  const pagination = notificationsData?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Platform activity: new users, withdrawals, upgrades, and inflows.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Failed to load notifications. Please try again later.
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Category"
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
            options={[
              { value: 'all', label: 'All Notifications' },
              { value: 'WITHDRAWAL', label: 'Withdrawals' },
              { value: 'INFLOW', label: 'Inflows' },
              { value: 'TIER_UPGRADE', label: 'KYC' },
              { value: 'NEW_USER', label: 'User Registration' },
              { value: 'EVENT_DELETED', label: 'Events' },
            ]}
          />
          <Select
            label="Status"
            value={readFilter}
            onChange={(e) => {
              setPage(1);
              setReadFilter(e.target.value);
            }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="text-center py-8">Loading...</div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">No notifications yet</div>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${!notification.read ? 'border-l-4 border-l-blue-600' : ''}`}
                onClick={() => {
                  if (!notification.read) markReadMutation.mutate(notification.id);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.read && <Badge variant="info">New</Badge>}
                      <Badge variant="default">{notification.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTimeWAT(notification.createdAt)} ({formatRelativeTime(notification.createdAt)})
                    </p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={limit}
          onPageChange={setPage}
          itemName="Notifications"
        />
      )}
    </div>
  );
}
