'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { rolesApi } from '@/lib/api/roles';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteUserSchema } from '@/lib/utils/validation';
import { adminsApi } from '@/lib/api/admins';
import type { AdminDetails } from '@/lib/types/api';

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roleName = params.roleName as string;
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: roleData } = useQuery({
    queryKey: ['roles', roleName],
    queryFn: () => rolesApi.getRoleDetails(roleName),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<{ fullName: string; email: string }>({
    resolver: zodResolver(inviteUserSchema),
  });

  const onSubmitInvite = async (data: { fullName: string; email: string }) => {
    try {
      await adminsApi.inviteAdmin({ email: data.email, role: roleName });
      setShowInviteModal(false);
      reset();
      // Refresh role data
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to send invite');
    }
  };

  const admins: AdminDetails[] = roleData?.admins || [];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {roleName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{roleName.replace('_', ' ')}</h1>
                <Badge variant="info">Custom Role</Badge>
              </div>
              <p className="text-gray-600 mb-2">
                {roleName === 'COMPLIANCE' ? 'Manage KYCs and related user activities' : 'Role description'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>👥</span>
                <span>{admins.length} Users Assigned</span>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Users to Role
          </Button>
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
              <TableHeader>Action</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
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
                <TableCell>
                  <Button variant="danger" size="sm">Remove</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite User to Role"
        description="Add a new user to this role by entering their details. An invite email will be sent."
      >
        <form onSubmit={handleSubmit(onSubmitInvite)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter user's full name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
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

