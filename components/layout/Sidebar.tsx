'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Wallet,
  Bell,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Withdrawals', href: '/withdrawals', icon: Wallet },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#0D2A68] min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
             <img src="/icon.svg" alt="galafyicon" />
            </div>
          <span className="text-white text-xl font-semibold">Galafy</span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#2E4060] text-white'
                  : 'text-gray-300 hover:bg-[#2E4060] hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

