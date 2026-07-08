export type ReconciliationStatus = 'in_sync' | 'mismatch' | 'unavailable' | 'na';

export function getReconciliationStatusLabel(status?: ReconciliationStatus | null): string {
  switch (status) {
    case 'in_sync':
      return 'In Sync';
    case 'mismatch':
      return 'Mismatch';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'N/A';
  }
}

export function getReconciliationStatusBadgeVariant(
  status?: ReconciliationStatus | null,
): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'in_sync':
      return 'success';
    case 'mismatch':
      return 'danger';
    case 'unavailable':
      return 'warning';
    default:
      return 'default';
  }
}
