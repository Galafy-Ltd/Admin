'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Crown, Calendar, Headphones, Settings, Wallet, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuthAlert } from '@/components/ui/AuthAlert';
import { rolesApi } from '@/lib/api/roles';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { ROLE_DESCRIPTIONS } from '@/lib/constants/admin-role-permissions';

const ROLE_ICONS: Record<string, typeof Crown> = {
  SUPER_ADMIN: Crown,
  COMPLIANCE: Calendar,
  OPERATIONS: Settings,
  FINANCE_ADMIN: Wallet,
  VIEW_ONLY: Eye,
  SUPPORT: Headphones,
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-blue-600',
  COMPLIANCE: 'bg-blue-400',
  OPERATIONS: 'bg-indigo-500',
  FINANCE_ADMIN: 'bg-emerald-500',
  VIEW_ONLY: 'bg-gray-500',
  SUPPORT: 'bg-green-400',
};

export const RolesTab = () => {
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const canViewAdmins = hasPermission(PERMISSIONS.VIEW_ADMINS);

  const { data: rolesData, isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getRoles(),
    enabled: canViewAdmins,
  });

  if (!canViewAdmins) {
    return (
      <AuthAlert
        variant="warning"
        message="Only super admins can manage team roles and permissions."
      />
    );
  }

  if (isLoading) {
    return <p className="text-gray-500">Loading roles...</p>;
  }

  if (isError) {
    return <AuthAlert variant="error" message="Failed to load roles. Please try again." />;
  }

  const roles = rolesData?.roles || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Team Roles</h2>
        <p className="text-gray-600">View system roles and manage team members assigned to each role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.role] || Headphones;
          const color = ROLE_COLORS[role.role] || 'bg-gray-400';
          const description = ROLE_DESCRIPTIONS[role.role] || 'Admin role';

          return (
            <Card key={role.role}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <Badge variant="warning">System Role</Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">{role.role.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-gray-600 mb-4">{description}</p>
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
