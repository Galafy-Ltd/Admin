'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface UsersStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  footer: string;
  href?: string;
}

export function UsersStatCard({ title, value, icon: Icon, footer, href }: UsersStatCardProps) {
  const content = (
    <Card className={href ? 'transition-shadow hover:shadow-md cursor-pointer' : undefined}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0D2A68]">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
          <p className="text-sm text-green-600">{footer}</p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
