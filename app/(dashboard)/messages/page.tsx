'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { KycRemindersTab } from '@/components/features/messages/KycRemindersTab';
import { ReminderHistoryTab } from '@/components/features/messages/ReminderHistoryTab';

const tabs = [
  { id: 'reminders', label: 'KYC & Tier Reminders' },
  { id: 'history', label: 'History' },
];

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin } = useAuth();
  const { hasPermission } = usePermissions({ role: admin?.role });
  const canSendReminders = hasPermission(PERMISSIONS.SEND_KYC_REMINDERS);
  const [activeTab, setActiveTab] = useState('reminders');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`/messages?${params.toString()}`);
  };

  if (!canSendReminders) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Remind different Tier Users to upgrade their tier levels to access more benefits.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Permission required</p>
            <p className="text-sm text-amber-800">
              You need the Send KYC reminders permission to access this module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">
          Remind different Tier Users to upgrade their tier levels to access more benefits.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'reminders' ? <KycRemindersTab /> : <ReminderHistoryTab />}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">Loading messages…</div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
