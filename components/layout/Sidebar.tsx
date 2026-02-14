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
    <div className="fixed left-0 top-0 w-64 h-screen bg-[#0D2A68] flex flex-col z-10">
      <div className="p-6">
        <div className="flex items-center gap-2">
        <div className="w-auto h-auto bg-[#0D2A68] rounded-lg flex items-center justify-center mb-4">
             <img src="/logo.png" alt="galafyicon" />
            </div>
          {/* <span className="text-white text-xl font-semibold">Galafy</span> */}
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#D9D9D9] text-[#0D2A68]'
                  : 'text-gray-300 hover:bg-[#D9D9D9] hover:text-[#0D2A68]'
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

