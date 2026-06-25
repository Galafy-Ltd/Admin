'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { AuthAlert } from '@/components/ui/AuthAlert';
import { configApi } from '@/lib/api/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';

const NOTIFICATION_CONFIG_KEY = 'ADMIN_NOTIFICATION_TYPES_ENABLED';

const NOTIFICATION_TOGGLES = [
  {
    key: 'NEW_USER',
    label: 'New User Registration',
    description: 'Notify when a new user signs up.',
  },
  {
    key: 'WITHDRAWAL',
    label: 'Withdrawal Activity',
    description: 'Notify when withdrawals are requested or updated.',
  },
  {
    key: 'TIER_UPGRADE',
    label: 'Tier Upgrade Submitted',
    description: 'Notify when a user submits tier upgrade verification.',
  },
  {
    key: 'INFLOW',
    label: 'Wallet Inflow',
    description: 'Notify when funds are received into a wallet.',
  },
  {
    key: 'EVENT_DELETED',
    label: 'Event Deleted',
    description: 'Notify when an event is soft-deleted.',
  },
] as const;

type NotificationTypeKey = (typeof NOTIFICATION_TOGGLES)[number]['key'];

const DEFAULT_SETTINGS: Record<NotificationTypeKey, boolean> = {
  NEW_USER: true,
  WITHDRAWAL: true,
  TIER_UPGRADE: true,
  INFLOW: true,
  EVENT_DELETED: true,
};

function parseSettings(value: string | undefined): Record<NotificationTypeKey, boolean> {
  if (!value) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(value) as Partial<Record<NotificationTypeKey, boolean>>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const NotificationsTab = () => {
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const canManage = hasPermission(PERMISSIONS.MANAGE_CONFIG);

  const [settings, setSettings] = useState<Record<NotificationTypeKey, boolean>>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', NOTIFICATION_CONFIG_KEY],
    queryFn: () => configApi.getConfigByKey(NOTIFICATION_CONFIG_KEY),
    retry: false,
  });

  useEffect(() => {
    if (config?.value) {
      setSettings(parseSettings(config.value));
    }
  }, [config?.value]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = JSON.stringify(settings);
      if (config) {
        return configApi.updateConfig(NOTIFICATION_CONFIG_KEY, { value });
      }
      return configApi.createConfig({
        key: NOTIFICATION_CONFIG_KEY,
        category: 'NOTIFICATIONS',
        value,
        type: 'JSON',
        description: 'Enabled admin dashboard notification types',
      });
    },
    onSuccess: async () => {
      setMessage({ type: 'success', text: 'Notification settings saved.' });
      await queryClient.invalidateQueries({ queryKey: ['config', NOTIFICATION_CONFIG_KEY] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save notification settings.' });
    },
  });

  const handleToggle = (key: NotificationTypeKey, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
    setMessage(null);
  };

  if (isLoading) {
    return <p className="text-gray-500">Loading notification settings...</p>;
  }

  return (
    <div className="space-y-6">
      {message && <AuthAlert variant={message.type === 'success' ? 'success' : 'error'} message={message.text} />}

      <Card title="Dashboard Alerts">
        <p className="text-sm text-gray-600 mb-4">
          Choose which platform events create notifications in the admin dashboard.
        </p>
        <div className="space-y-4">
          {NOTIFICATION_TOGGLES.map((toggle) => (
            <Toggle
              key={toggle.key}
              label={toggle.label}
              description={toggle.description}
              checked={settings[toggle.key]}
              onChange={(e) => handleToggle(toggle.key, e.target.checked)}
              disabled={!canManage}
            />
          ))}
        </div>
      </Card>

      <Card title="Delivery">
        <p className="text-sm text-gray-600">
          Notifications are delivered in the admin dashboard only.
        </p>
      </Card>

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
            Save Notification Settings
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">You have read-only access to notification settings.</p>
      )}
    </div>
  );
};
