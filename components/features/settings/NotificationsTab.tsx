'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const NotificationsTab = () => {
  const [newUserRegistration, setNewUserRegistration] = useState(true);
  const [largeTransaction, setLargeTransaction] = useState(true);
  const [flaggedActivity, setFlaggedActivity] = useState(true);
  const [newWithdrawal, setNewWithdrawal] = useState(true);
  const [withdrawalCompleted, setWithdrawalCompleted] = useState(false);
  const [disputeReversal, setDisputeReversal] = useState(true);
  const [deliveryChannel, setDeliveryChannel] = useState('dashboard');
  const [businessEmail, setBusinessEmail] = useState('admin@galapay.com');
  const [supportPhone, setSupportPhone] = useState('');

  return (
    <div className="space-y-6">
      <Card title="System Alerts">
        <p className="text-sm text-gray-600 mb-4">Notifications triggered by platform-wide activities.</p>
        <div className="space-y-4">
          <Toggle
            label="New User Registration"
            description="Notify when a new user signs up and completes KYC."
            checked={newUserRegistration}
            onChange={(e) => setNewUserRegistration(e.target.checked)}
          />
          <Toggle
            label="Large Transaction Detected"
            description="Alerts for transactions above internal threshold."
            checked={largeTransaction}
            onChange={(e) => setLargeTransaction(e.target.checked)}
          />
          <Toggle
            label="Flagged Account Activity"
            description="Notify compliance team when suspicious actions occur."
            checked={flaggedActivity}
            onChange={(e) => setFlaggedActivity(e.target.checked)}
          />
        </div>
      </Card>

      <Card title="Transactions & Withdrawals">
        <div className="space-y-4">
          <Toggle
            label="New Withdrawal Request"
            description="Send notification when a user requests withdrawal."
            checked={newWithdrawal}
            onChange={(e) => setNewWithdrawal(e.target.checked)}
          />
          <Toggle
            label="Withdrawal Completed"
            description="Notify user and admin when payout is successfully processed."
            checked={withdrawalCompleted}
            onChange={(e) => setWithdrawalCompleted(e.target.checked)}
          />
          <Toggle
            label="Dispute or Reversal"
            description="Alerts for any transaction under review."
            checked={disputeReversal}
            onChange={(e) => setDisputeReversal(e.target.checked)}
          />
        </div>
      </Card>

      <Card title="Where should we send notifications?">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="delivery"
                value="dashboard"
                checked={deliveryChannel === 'dashboard'}
                onChange={(e) => setDeliveryChannel(e.target.value)}
                className="text-blue-600"
              />
              <span>In-Dashboard Only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="delivery"
                value="email-dashboard"
                checked={deliveryChannel === 'email-dashboard'}
                onChange={(e) => setDeliveryChannel(e.target.value)}
                className="text-blue-600"
              />
              <span>Email & In-Dashboard</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="delivery"
                value="sms-email-dashboard"
                checked={deliveryChannel === 'sms-email-dashboard'}
                onChange={(e) => setDeliveryChannel(e.target.value)}
                className="text-blue-600"
              />
              <span>SMS + Email + In-Dashboard</span>
            </label>
            <p className="text-sm text-gray-500 ml-6">SMS charges may apply.</p>
          </div>

          <div>
            <Input
              label="Business Email"
              type="email"
              placeholder="admin@galapay.com"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Support Phone (Optional)"
              type="tel"
              placeholder="+234 xxx xxx xxxx"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Notification Settings</Button>
      </div>
    </div>
  );
};

