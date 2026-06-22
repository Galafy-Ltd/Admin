import { cn } from '@/lib/utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: AvatarSize;
  className?: string;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() ?? '?';
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

export function Avatar({ src, name, email, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name, email);

  if (src) {
    return (
      <img
        src={src}
        alt={name || email || 'User'}
        className={cn('rounded-full object-cover bg-gray-200', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 shrink-0',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
