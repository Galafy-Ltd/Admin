export const PERMISSIONS = {
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  RESTRICT_USERS: 'restrict_users',
  UNRESTRICT_USERS: 'unrestrict_users',
  VIEW_KYC_REQUESTS: 'view_kyc_requests',
  APPROVE_KYC: 'approve_kyc',
  REJECT_KYC: 'reject_kyc',
  APPROVE_UTILITY_BILL: 'approve_utility_bill',
  REJECT_UTILITY_BILL: 'reject_utility_bill',
  VIEW_AML_ALERTS: 'view_aml_alerts',
  MANAGE_AML_ALERTS: 'manage_aml_alerts',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  VIEW_CONFIG: 'view_config',
  MANAGE_CONFIG: 'manage_config',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_ADMINS: 'view_admins',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPLIANCE: 'COMPLIANCE',
  OPERATIONS: 'OPERATIONS',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  SUPPORT: 'SUPPORT',
  VIEW_ONLY: 'VIEW_ONLY',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

