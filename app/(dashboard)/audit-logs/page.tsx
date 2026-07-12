'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, X, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTimeWAT } from '@/lib/utils/format';
import { auditLogsApi } from '@/lib/api/audit-logs';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { AUDIT_ACTION_TYPE_OPTIONS } from '@/lib/constants/audit-action-types';
import type { AuditLog } from '@/lib/types/api';

function formatDetailsSummary(details: Record<string, unknown> | null | undefined): string {
  if (!details || typeof details !== 'object') return '—';
  const keys = Object.keys(details);
  if (keys.length === 0) return '—';
  const preview = keys.slice(0, 3).map((key) => `${key}: ${String(details[key])}`).join(', ');
  return keys.length > 3 ? `${preview}, ...` : preview;
}

function formatDetailsJson(details: Record<string, unknown> | null | undefined): string {
  if (!details || typeof details !== 'object') return '—';
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export default function AuditLogsPage() {
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const canViewAuditLogs = hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS);

  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', { page, limit, actionType, targetType, startDate, endDate }],
    queryFn: () =>
      auditLogsApi.getLogs({
        page,
        limit,
        actionType: actionType || undefined,
        targetType: targetType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: canViewAuditLogs,
  });

  const logs: AuditLog[] = data?.logs || [];
  const pagination = data?.pagination;
  const hasFilters = !!(actionType || targetType || startDate || endDate);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const blob = await auditLogsApi.exportLogs({
        actionType: actionType || undefined,
        targetType: targetType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setExportError('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!canViewAuditLogs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">Review admin actions across the platform.</p>
        </div>
        <Card>
          <div className="flex items-center gap-3 text-gray-600 py-8 justify-center">
            <ShieldAlert className="h-5 w-5" />
            <p>You do not have permission to view audit logs.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-600">Review admin actions across the platform.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Failed to load audit logs. Please try again later.
        </div>
      )}

      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {exportError}
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Action type"
            value={actionType}
            options={[...AUDIT_ACTION_TYPE_OPTIONS]}
            onChange={(e) => {
              setPage(1);
              setActionType(e.target.value);
            }}
          />
          <Input
            label="Target type"
            placeholder="e.g. CUSTOMER"
            value={targetType}
            onChange={(e) => {
              setPage(1);
              setTargetType(e.target.value);
            }}
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

      <Card>
        <div className="flex items-center justify-between mb-4">
          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionType('');
                setTargetType('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          ) : (
            <h2 className="text-xl font-semibold">Admin Action Logs</h2>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Date</TableHeader>
              <TableHeader>Admin</TableHeader>
              <TableHeader>Action</TableHeader>
              <TableHeader>Target</TableHeader>
              <TableHeader>Reason</TableHeader>
              <TableHeader>Details</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>{formatDateTimeWAT(log.createdAt)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{log.admin?.email || log.adminId}</p>
                      {log.admin?.role && <p className="text-xs text-gray-500">{log.admin.role}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{log.actionType}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{log.targetType}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">{log.targetId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.reason || '—'}</TableCell>
                  <TableCell className="max-w-md truncate">{formatDetailsSummary(log.details)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={limit}
              onPageChange={setPage}
              itemName="Logs"
            />
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit log details"
        description={selectedLog ? selectedLog.actionType : undefined}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Date</p>
                <p className="mt-1 text-gray-900">{formatDateTimeWAT(selectedLog.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Admin</p>
                <p className="mt-1 text-gray-900">{selectedLog.admin?.email || selectedLog.adminId}</p>
                {selectedLog.admin?.role && (
                  <p className="text-xs text-gray-500">{selectedLog.admin.role}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Action</p>
                <p className="mt-1 text-gray-900">{selectedLog.actionType}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Target</p>
                <p className="mt-1 text-gray-900">{selectedLog.targetType}</p>
                <p className="text-xs text-gray-500 break-all">{selectedLog.targetId}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reason</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedLog.reason || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Details</p>
              <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-800 whitespace-pre-wrap wrap-break-word">
                {formatDetailsJson(selectedLog.details)}
              </pre>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
