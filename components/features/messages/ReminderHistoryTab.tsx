'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { TierMessagingBanner } from './TierMessagingBanner';
import { messagesApi } from '@/lib/api/messages';
import { formatDateTimeWAT } from '@/lib/utils/format';
import type { KycReminderCampaignStatus } from '@/lib/types/api';

function formatTierLabel(tier: string) {
  if (tier === 'ALL') return 'All Tiers';
  return tier.replace('_', ' ');
}

function statusVariant(status: KycReminderCampaignStatus): 'success' | 'warning' | 'danger' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'PROCESSING') return 'warning';
  return 'danger';
}

function statusLabel(status: KycReminderCampaignStatus) {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'PROCESSING') return 'Processing';
  return 'Failed';
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function ReminderHistoryTab() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [targetTier, setTargetTier] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [datePreset, setDatePreset] = useState('7d');
  const limit = 10;

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return { startDate: undefined, endDate: undefined };
    if (datePreset === '30d') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    return defaultRange;
  }, [datePreset, defaultRange]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'messages',
      'kyc-reminders-history',
      { page, limit, search, targetTier, channel, status, ...dateRange },
    ],
    queryFn: () =>
      messagesApi.getKycReminderHistory({
        page,
        limit,
        search: search || undefined,
        targetTier: targetTier || undefined,
        channel: channel || undefined,
        status: status || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    refetchInterval: (query) => {
      const campaigns = query.state.data?.campaigns || [];
      return campaigns.some((c) => c.status === 'PROCESSING') ? 4000 : false;
    },
  });

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <TierMessagingBanner />

      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Search by message..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={targetTier}
            onChange={(e) => {
              setTargetTier(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Target Tier: All' },
              { value: 'Tier_0', label: 'Tier 0' },
              { value: 'Tier_1', label: 'Tier 1' },
              { value: 'Tier_2', label: 'Tier 2' },
            ]}
          />
          <Select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Channel: All' },
              { value: 'email', label: 'Email' },
              { value: 'inApp', label: 'In-App' },
              { value: 'both', label: 'Both' },
            ]}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Status: All' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'PROCESSING', label: 'Processing' },
              { value: 'FAILED', label: 'Failed' },
            ]}
          />
          <Select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'all', label: 'All time' },
            ]}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading history…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">Failed to load reminder history.</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reminder campaigns found.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Message</TableHeader>
                <TableHeader>Target Tier</TableHeader>
                <TableHeader>Channel</TableHeader>
                <TableHeader>Recipients</TableHeader>
                <TableHeader>Date Sent</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{campaign.messageTitle}</p>
                      <p className="text-sm text-gray-500 mt-0.5 max-w-md">
                        {campaign.messageSnippet}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{formatTierLabel(campaign.targetTier)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {campaign.channels.inApp && (
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5" />
                          In-App
                        </span>
                      )}
                      {campaign.channels.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {campaign.recipients.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">
                    {formatDateTimeWAT(campaign.dateSent)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(campaign.status)}>
                      {statusLabel(campaign.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {pagination && pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
          itemName="results"
        />
      )}
    </div>
  );
}
