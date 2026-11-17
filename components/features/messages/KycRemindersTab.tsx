'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Smartphone, Send, ListChecks, MousePointerClick, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TierMessagingBanner } from './TierMessagingBanner';
import { messagesApi } from '@/lib/api/messages';
import type { KycReminderCatalogItem, KycReminderTargetTier } from '@/lib/types/api';
import { cn } from '@/lib/utils/cn';

type ChannelState = Record<KycReminderTargetTier, { email: boolean; inApp: boolean }>;

function formatTierLabel(tier: string) {
  return tier.replace('_', ' ');
}

function formatRecipients(count: number) {
  return count.toLocaleString();
}

export function KycRemindersTab() {
  const queryClient = useQueryClient();
  const [channels, setChannels] = useState<ChannelState>({
    Tier_0: { email: true, inApp: true },
    Tier_1: { email: true, inApp: true },
    Tier_2: { email: true, inApp: true },
  });
  const [confirmRow, setConfirmRow] = useState<KycReminderCatalogItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', 'kyc-reminders'],
    queryFn: () => messagesApi.getKycReminderCatalog(),
  });

  const reminders = data?.reminders || [];

  const sendMutation = useMutation({
    mutationFn: messagesApi.sendBulkKycReminder,
    onSuccess: (result) => {
      setActionError(null);
      setActionMessage(
        `Campaign started for ${formatRecipients(result.recipientCount)} recipients. Track progress in History.`,
      );
      setConfirmRow(null);
      queryClient.invalidateQueries({ queryKey: ['messages', 'kyc-reminders-history'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to start reminder campaign. Please try again.';
      setActionMessage(null);
      setActionError(message);
      setConfirmRow(null);
    },
  });

  const confirmChannels = useMemo(() => {
    if (!confirmRow) return null;
    return channels[confirmRow.targetTier];
  }, [channels, confirmRow]);

  const toggleChannel = (tier: KycReminderTargetTier, key: 'email' | 'inApp') => {
    setChannels((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [key]: !prev[tier][key] },
    }));
  };

  return (
    <div className="space-y-6">
      <TierMessagingBanner />

      {actionMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reminders…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">Failed to load reminder catalog.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Message</TableHeader>
                <TableHeader>Target Tier</TableHeader>
                <TableHeader>Channel</TableHeader>
                <TableHeader>Recipients</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {reminders.map((row) => {
                const rowChannels = channels[row.targetTier];
                const canSend =
                  row.recipients > 0 && (rowChannels.email || rowChannels.inApp) && !sendMutation.isPending;

                return (
                  <TableRow key={row.messageKey}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">{row.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5 max-w-md">{row.snippet}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{formatTierLabel(row.targetTier)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleChannel(row.targetTier, 'inApp')}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                            rowChannels.inApp
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200',
                          )}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          In-App
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleChannel(row.targetTier, 'email')}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                            rowChannels.email
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200',
                          )}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {formatRecipients(row.recipients)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!canSend}
                        onClick={() => {
                          setActionError(null);
                          setActionMessage(null);
                          setConfirmRow(row);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1.5" />
                        Send Reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-gray-900 mb-4">How it works</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <ListChecks className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">1. Choose a message</p>
              <p className="text-sm text-gray-500">
                Select the pre-written reminder you want to send.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <MousePointerClick className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">2. Trigger the send</p>
              <p className="text-sm text-gray-500">
                Send to the specific user tier via in-app or email.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <History className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">3. Track delivery</p>
              <p className="text-sm text-gray-500">
                View send history and delivery status in the History tab.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={!!confirmRow}
        onClose={() => !sendMutation.isPending && setConfirmRow(null)}
        title="Send KYC reminder?"
        description={
          confirmRow
            ? `Send “${confirmRow.title}” to ${formatRecipients(confirmRow.recipients)} users on ${formatTierLabel(confirmRow.targetTier)}.`
            : undefined
        }
      >
        {confirmRow && confirmChannels && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium">Channels:</span>{' '}
                {[
                  confirmChannels.inApp ? 'In-App' : null,
                  confirmChannels.email ? 'Email' : null,
                ]
                  .filter(Boolean)
                  .join(' + ') || 'None'}
              </p>
              <p className="text-gray-500">
                Each recipient gets the matching KYC scenario template (complete vs upgrade).
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmRow(null)}
                disabled={sendMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  sendMutation.mutate({
                    targetTier: confirmRow.targetTier,
                    channels: confirmChannels,
                  })
                }
                disabled={sendMutation.isPending || (!confirmChannels.email && !confirmChannels.inApp)}
              >
                {sendMutation.isPending ? 'Starting…' : 'Confirm Send'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
