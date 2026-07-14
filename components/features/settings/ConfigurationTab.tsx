'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AuthAlert } from '@/components/ui/AuthAlert';
import { configApi } from '@/lib/api/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { createConfigSchema, updateConfigSchema } from '@/lib/utils/validation';
import { formatDateTimeWAT } from '@/lib/utils/format';
import type { Config } from '@/lib/types/api';
import { z } from 'zod';

type CreateConfigForm = z.infer<typeof createConfigSchema>;
type UpdateConfigForm = z.infer<typeof updateConfigSchema>;

const CONFIG_TYPE_OPTIONS = [
  { value: 'STRING', label: 'STRING' },
  { value: 'NUMBER', label: 'NUMBER' },
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'JSON', label: 'JSON' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function ConfigurationTab() {
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const canView = hasPermission(PERMISSIONS.VIEW_CONFIG);
  const canManage = hasPermission(PERMISSIONS.MANAGE_CONFIG);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [editConfig, setEditConfig] = useState<Config | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configApi.getConfigs(),
    enabled: canView,
  });

  const configs = data?.configs || [];

  const categories = useMemo(() => {
    const unique = Array.from(new Set(configs.map((c) => c.category).filter(Boolean))).sort();
    return [{ value: 'all', label: 'All categories' }, ...unique.map((c) => ({ value: c, label: c }))];
  }, [configs]);

  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      if (categoryFilter !== 'all' && config.category !== categoryFilter) return false;
      if (activeFilter === 'true' && !config.isActive) return false;
      if (activeFilter === 'false' && config.isActive) return false;
      return true;
    });
  }, [configs, categoryFilter, activeFilter]);

  const editForm = useForm<UpdateConfigForm>({
    resolver: zodResolver(updateConfigSchema),
    values: editConfig
      ? { value: editConfig.value, description: editConfig.description || '' }
      : { value: '', description: '' },
  });

  const createForm = useForm<CreateConfigForm>({
    resolver: zodResolver(createConfigSchema),
    defaultValues: {
      key: '',
      category: '',
      value: '',
      type: 'STRING',
      description: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateConfigForm }) =>
      configApi.updateConfig(key, data),
    onSuccess: async () => {
      setMessage({ type: 'success', text: 'Configuration updated.' });
      setEditConfig(null);
      await queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update config.' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateConfigForm) =>
      configApi.createConfig({
        key: data.key,
        category: data.category,
        value: data.value,
        type: data.type,
        description: data.description || '',
      }),
    onSuccess: async () => {
      setMessage({ type: 'success', text: 'Configuration created.' });
      setShowCreateModal(false);
      createForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create config.' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (key: string) => configApi.deleteConfig(key),
    onSuccess: async () => {
      setMessage({ type: 'success', text: 'Configuration deactivated.' });
      await queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to deactivate config.' });
    },
  });

  if (!canView) {
    return (
      <AuthAlert
        variant="warning"
        message="You do not have permission to view system configuration."
      />
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <AuthAlert
          variant={message.type === 'success' ? 'success' : 'error'}
          message={message.text}
        />
      )}

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="min-w-[180px]">
              <Select
                label="Category"
                value={categoryFilter}
                options={categories}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
            <div className="min-w-[160px]">
              <Select
                label="Status"
                value={activeFilter}
                options={ACTIVE_FILTER_OPTIONS}
                onChange={(e) => setActiveFilter(e.target.value)}
              />
            </div>
          </div>
          {canManage && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Config
            </Button>
          )}
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Key</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Value</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Updated</TableHeader>
              {canManage && <TableHeader>Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8">
                  Loading configurations...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-red-600">
                  Failed to load configurations.
                </TableCell>
              </TableRow>
            ) : filteredConfigs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-gray-500">
                  No configurations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{config.key}</p>
                      {config.description && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{config.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{config.category}</TableCell>
                  <TableCell>
                    <span className="block max-w-[220px] truncate font-mono text-xs" title={config.value}>
                      {config.value}
                    </span>
                  </TableCell>
                  <TableCell>{config.type}</TableCell>
                  <TableCell>
                    <Badge variant={config.isActive ? 'success' : 'default'}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {config.updatedAt ? formatDateTimeWAT(config.updatedAt) : '—'}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditConfig(config)}
                          disabled={!config.isActive}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {config.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Deactivate config "${config.key}"?`)) {
                                deactivateMutation.mutate(config.key);
                              }
                            }}
                            isLoading={deactivateMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={!!editConfig}
        onClose={() => setEditConfig(null)}
        title="Edit configuration"
        description={editConfig ? `Update value for ${editConfig.key}` : undefined}
      >
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit((data) => {
            if (!editConfig) return;
            updateMutation.mutate({ key: editConfig.key, data });
          })}
        >
          <Input label="Value" error={editForm.formState.errors.value?.message} {...editForm.register('value')} />
          <Input
            label="Description"
            error={editForm.formState.errors.description?.message}
            {...editForm.register('description')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditConfig(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create configuration"
        description="Add a new system configuration key."
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
        >
          <Input label="Key" error={createForm.formState.errors.key?.message} {...createForm.register('key')} />
          <Input
            label="Category"
            error={createForm.formState.errors.category?.message}
            {...createForm.register('category')}
          />
          <Select
            label="Type"
            options={CONFIG_TYPE_OPTIONS}
            error={createForm.formState.errors.type?.message}
            {...createForm.register('type')}
          />
          <Input
            label="Value"
            error={createForm.formState.errors.value?.message}
            {...createForm.register('value')}
          />
          <Input
            label="Description"
            error={createForm.formState.errors.description?.message}
            {...createForm.register('description')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
