import { useMemo } from 'react';
import { ROLES, PERMISSIONS, type Role, type Permission } from '../constants/permissions';

interface UsePermissionsProps {
  role?: Role | string;
}

export const usePermissions = ({ role }: UsePermissionsProps) => {
  const permissions = useMemo(() => {
    if (!role) return new Set<Permission>();

    const rolePermissions = new Set<Permission>();

    switch (role) {
      case ROLES.SUPER_ADMIN:
        // Super admin has all permissions
        Object.values(PERMISSIONS).forEach((perm) => rolePermissions.add(perm));
        break;

      case ROLES.COMPLIANCE:
        rolePermissions.add(PERMISSIONS.VIEW_USERS);
        rolePermissions.add(PERMISSIONS.VIEW_KYC_REQUESTS);
        rolePermissions.add(PERMISSIONS.APPROVE_KYC);
        rolePermissions.add(PERMISSIONS.REJECT_KYC);
        rolePermissions.add(PERMISSIONS.APPROVE_UTILITY_BILL);
        rolePermissions.add(PERMISSIONS.REJECT_UTILITY_BILL);
        rolePermissions.add(PERMISSIONS.RESTRICT_USERS);
        rolePermissions.add(PERMISSIONS.UNRESTRICT_USERS);
        rolePermissions.add(PERMISSIONS.VIEW_AML_ALERTS);
        rolePermissions.add(PERMISSIONS.MANAGE_AML_ALERTS);
        rolePermissions.add(PERMISSIONS.VIEW_AUDIT_LOGS);
        break;

      case ROLES.OPERATIONS:
        rolePermissions.add(PERMISSIONS.VIEW_USERS);
        rolePermissions.add(PERMISSIONS.EDIT_USERS);
        rolePermissions.add(PERMISSIONS.VIEW_CONFIG);
        rolePermissions.add(PERMISSIONS.MANAGE_CONFIG);
        rolePermissions.add(PERMISSIONS.VIEW_FINANCIAL_REPORTS);
        rolePermissions.add(PERMISSIONS.VIEW_AUDIT_LOGS);
        break;

      case ROLES.FINANCE_ADMIN:
        rolePermissions.add(PERMISSIONS.VIEW_USERS);
        rolePermissions.add(PERMISSIONS.VIEW_FINANCIAL_REPORTS);
        rolePermissions.add(PERMISSIONS.VIEW_AUDIT_LOGS);
        break;

      case ROLES.SUPPORT:
        rolePermissions.add(PERMISSIONS.VIEW_USERS);
        break;

      case ROLES.VIEW_ONLY:
        rolePermissions.add(PERMISSIONS.VIEW_USERS);
        rolePermissions.add(PERMISSIONS.VIEW_KYC_REQUESTS);
        rolePermissions.add(PERMISSIONS.VIEW_AML_ALERTS);
        rolePermissions.add(PERMISSIONS.VIEW_FINANCIAL_REPORTS);
        rolePermissions.add(PERMISSIONS.VIEW_CONFIG);
        rolePermissions.add(PERMISSIONS.VIEW_AUDIT_LOGS);
        break;
    }

    return rolePermissions;
  }, [role]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.has(permission);
  };

  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    return permissionList.some((perm) => permissions.has(perm));
  };

  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    return permissionList.every((perm) => permissions.has(perm));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

