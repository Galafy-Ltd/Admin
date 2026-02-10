'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export const SecurityTab = () => {
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('15 minutes');
  const [maxSessions, setMaxSessions] = useState('1');

  return (
    <div className="space-y-6">
      <Card title="Account Protection">
        <div className="space-y-6">
          <Toggle
            label="Two-Factor Authentication (2FA)"
            description="Add an extra layer of security to admin accounts."
            checked={twoFA}
            onChange={(e) => setTwoFA(e.target.checked)}
          />
          {twoFA && (
            <a href="#" className="text-sm text-green-600 hover:text-green-700">
              Authentication App Required
            </a>
          )}

          <Toggle
            label="Login Alerts"
            description="Send notifications when sign-in occurs from new devices."
            checked={loginAlerts}
            onChange={(e) => setLoginAlerts(e.target.checked)}
          />
        </div>
      </Card>

      <Card title="Session & Access">
        <div className="space-y-6">
          <div>
            <Select
              label="Automatic Session Timeout"
              options={[
                { value: '15 minutes', label: '15 minutes' },
                { value: '30 minutes', label: '30 minutes' },
                { value: '1 hour', label: '1 hour' },
                { value: '2 hours', label: '2 hours' },
              ]}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="Max Concurrent Sessions"
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
              value={maxSessions}
              onChange={(e) => setMaxSessions(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Controls the number of devices allowed per admin at once.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Discard Changes</Button>
        <Button>Save Security Settings</Button>
      </div>
    </div>
  );
};

