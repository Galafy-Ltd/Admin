'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/format';
import { notificationsApi } from '@/lib/api/notifications';

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications({ limit: 20 }),
  });

  const notifications = notificationsData?.notifications || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Manage and send notifications to your users.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="text-center py-8">Loading...</div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">No notifications found</div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <Badge variant={getStatusBadgeVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{notification.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Sent to: {notification.sentTo}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(notification.createdAt)}</span>
                    <span>•</span>
                    <span>{notification.recipients.toLocaleString()} recipients</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

