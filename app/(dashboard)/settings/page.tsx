'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GeneralTab } from '@/components/features/settings/GeneralTab';
import { RolesTab } from '@/components/features/settings/RolesTab';
import { SecurityTab } from '@/components/features/settings/SecurityTab';
import { NotificationsTab } from '@/components/features/settings/NotificationsTab';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage platform rules, limits, and system controls.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

