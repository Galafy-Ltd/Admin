'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Crown, Calendar, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { rolesApi } from '@/lib/api/roles';

export const RolesTab = () => {
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getRoles(),
  });

  const roles = rolesData?.roles || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return Crown;
      case 'COMPLIANCE':
        return Calendar;
      default:
        return Headphones;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-blue-600';
      case 'COMPLIANCE':
        return 'bg-blue-400';
      default:
        return 'bg-green-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Roles</h2>
          <p className="text-gray-600">Create and manage user roles for your team</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = getRoleIcon(role.role);
          return (
            <Card key={role.role}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${getRoleColor(role.role)} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {role.role === 'SUPER_ADMIN' && (
                  <Badge variant="warning">System Role</Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">{role.role.replace('_', ' ')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {role.role === 'SUPER_ADMIN'
                  ? 'Full system access and control'
                  : role.role === 'COMPLIANCE'
                  ? 'Manage events and user activities'
                  : 'Handle user support and inquiries'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{role.userCount} Users</span>
                <Link href={`/settings/roles/${role.role}`}>
                  <Button variant="ghost" size="sm">View Role</Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

