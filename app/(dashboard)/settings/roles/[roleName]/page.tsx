'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AuthAlert } from '@/components/ui/AuthAlert';
import { rolesApi } from '@/lib/api/roles';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteUserSchema } from '@/lib/utils/validation';
import { adminsApi } from '@/lib/api/admins';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { ADMIN_ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } from '@/lib/constants/admin-role-permissions';
import type { AdminDetails, PendingAdminInvite } from '@/lib/types/api';

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleName = params.roleName as string;
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [devInviteLink, setDevInviteLink] = useState<string | null>(null);

  const { admin: currentAdmin } = useAuth();
  const { hasPermission } = usePermissions({ role: currentAdmin?.role });
  const canManageAdmins = hasPermission(PERMISSIONS.MANAGE_ADMINS);
  const canViewAdmins = hasPermission(PERMISSIONS.VIEW_ADMINS);

  const { data: roleData, isLoading, isError } = useQuery({
    queryKey: ['roles', roleName],
    queryFn: () => rolesApi.getRoleDetails(roleName),
    enabled: canViewAdmins,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<{ email: string }>({
    resolver: zodResolver(inviteUserSchema),
  });

  const deactivateMutation = useMutation({
    mutationFn: (adminId: string) => adminsApi.deactivateAdmin(adminId),
    onSuccess: async () => {
      setMessage({ type: 'success', text: 'Admin removed from this role.' });
      await queryClient.invalidateQueries({ queryKey: ['roles', roleName] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to remove admin.' });
    },
  });

  const onSubmitInvite = async (data: { email: string }) => {
    setMessage(null);
    setDevInviteLink(null);
    try {
      const response = await adminsApi.inviteAdmin({ email: data.email, role: roleName });
      setShowInviteModal(false);
      reset();
      setMessage({ type: 'success', text: `Invite sent to ${data.email}.` });
      if (process.env.NODE_ENV === 'development' && response.token) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        setDevInviteLink(`${baseUrl}/accept-invite?token=${response.token}`);
      }
      await queryClient.invalidateQueries({ queryKey: ['roles', roleName] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to send invite.' });
    }
  };

  const handleRemove = (admin: AdminDetails) => {
    if (admin.id === currentAdmin?.id) {
      setMessage({ type: 'error', text: 'You cannot remove your own account.' });
      return;
    }
    if (!window.confirm(`Remove ${admin.email} from this role? They will lose admin access.`)) {
      return;
    }
    deactivateMutation.mutate(admin.id);
  };

  if (!canViewAdmins) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <AuthAlert variant="warning" message="Only super admins can view team roles and permissions." />
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading role details...</p>;
  }

  if (isError || !roleData) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <AuthAlert variant="error" message="Unable to load role details. You may not have permission to view this page." />
      </div>
    );
  }

  const admins: AdminDetails[] = roleData.admins || [];
  const pendingInvites: PendingAdminInvite[] = roleData.pendingInvites || [];
  const permissions = ADMIN_ROLE_PERMISSIONS[roleName] || [];
  const description = ROLE_DESCRIPTIONS[roleName] || 'Role description';

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      {message && <AuthAlert variant={message.type === 'success' ? 'success' : 'error'} message={message.text} />}

      {devInviteLink && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium mb-1">Development invite link</p>
          <p className="break-all font-mono text-xs">{devInviteLink}</p>
        </div>
      )}

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{roleName.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{roleName.replace(/_/g, ' ')}</h1>
                <Badge variant="warning">System Role</Badge>
              </div>
              <p className="text-gray-600 mb-2">{description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{admins.length} active · {pendingInvites.length} pending</span>
              </div>
            </div>
          </div>
          {canManageAdmins && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Users to Role
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Permissions</h2>
        <div className="flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <Badge key={permission} variant="info">
              {permission}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Assigned Users</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Status</TableHeader>
              {canManageAdmins && <TableHeader>Action</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.length === 0 && pendingInvites.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManageAdmins ? 4 : 3} className="text-center text-gray-500 py-8">
                  No users assigned to this role yet.
                </TableCell>
              </TableRow>
            )}
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {admin.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{admin.email}</span>
                  </div>
                </TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge variant={admin.isActive ? 'success' : 'danger'}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                {canManageAdmins && (
                  <TableCell>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemove(admin)}
                      disabled={admin.id === currentAdmin?.id || deactivateMutation.isPending}
                    >
                      Remove
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {pendingInvites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 font-semibold">
                        {invite.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{invite.email}</span>
                  </div>
                </TableCell>
                <TableCell>{invite.email}</TableCell>
                <TableCell>
                  <Badge variant="warning">Pending</Badge>
                </TableCell>
                {canManageAdmins && <TableCell />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite User to Role"
        description="Enter an email address. An invite link will be sent to join this role."
      >
        <form onSubmit={handleSubmit(onSubmitInvite)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter user's email address"
            error={errors.email?.message}
            helperText="This email will receive the invitation."
            {...register('email')}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
