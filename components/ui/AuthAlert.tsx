import { cn } from '@/lib/utils/cn';

type AuthAlertVariant = 'error' | 'success' | 'warning';

const variantClasses: Record<AuthAlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

interface AuthAlertProps {
  variant?: AuthAlertVariant;
  message: string;
  className?: string;
}

export function AuthAlert({ variant = 'error', message, className }: AuthAlertProps) {
  if (!message) return null;
  return (
    <div
      className={cn('rounded-lg border px-4 py-3 text-sm', variantClasses[variant], className)}
      role="alert"
    >
      {message}
    </div>
  );
}
