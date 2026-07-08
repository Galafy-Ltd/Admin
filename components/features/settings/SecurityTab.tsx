'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthAlert } from '@/components/ui/AuthAlert';
import { authApi } from '@/lib/api/auth';
import { configApi } from '@/lib/api/config';

export const SecurityTab = () => {
  const mandatory2FAKey = 'ADMIN_MANDATORY_2FA_ENABLED';
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [mandatory2FAEnabled, setMandatory2FAEnabled] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: twoFactorStatus, isLoading } = useQuery({
    queryKey: ['two-factor-status'],
    queryFn: () => authApi.getTwoFactorStatus(),
  });

  const { data: mandatory2FAConfig } = useQuery({
    queryKey: ['config', mandatory2FAKey],
    queryFn: () => configApi.getConfigByKey(mandatory2FAKey),
    retry: false,
  });

  const setupMutation = useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
    onSuccess: (data) => {
      setSetupData(data);
      setMessage(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to start 2FA setup' });
    },
  });

  const enableMutation = useMutation({
    mutationFn: (code: string) => authApi.enableTwoFactor(code),
    onSuccess: async () => {
      setSetupData(null);
      setVerificationCode('');
      setMessage({ type: 'success', text: 'Two-factor authentication enabled.' });
      await queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Invalid authentication code' });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (code: string) => authApi.disableTwoFactor(code),
    onSuccess: async () => {
      setDisableCode('');
      setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
      await queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Invalid authentication code' });
    },
  });

  const twoFactorEnabled = twoFactorStatus?.twoFactorEnabled ?? false;

  useEffect(() => {
    if (twoFactorEnabled) {
      setSetupData(null);
    }
  }, [twoFactorEnabled]);

  useEffect(() => {
    if (!mandatory2FAConfig?.value) return;
    setMandatory2FAEnabled(mandatory2FAConfig.value.trim().toLowerCase() === 'true');
  }, [mandatory2FAConfig?.value]);

  const handleToggle = (checked: boolean) => {
    setMessage(null);
    if (checked) {
      setupMutation.mutate();
    }
  };

  const handleDisable2FA = () => {
    setMessage(null);
    if (disableCode.length !== 6) {
      setMessage({ type: 'error', text: 'Enter your 6-digit code to disable 2FA.' });
      return;
    }
    disableMutation.mutate(disableCode);
  };

  if (isLoading) {
    return <p className="text-gray-500">Loading security settings...</p>;
  }

  const qrImageUrl = setupData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`
    : null;

  return (
    <div className="space-y-6">
      {message && <AuthAlert variant={message.type === 'success' ? 'success' : 'error'} message={message.text} />}

      <Card title="Account Protection">
        <div className="space-y-6">
          <Toggle
            label="Two-Factor Authentication (2FA)"
            description="Require a 6-digit verification code from your security code generator when signing in."
            checked={twoFactorEnabled || !!setupData}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={
              twoFactorEnabled ||
              mandatory2FAEnabled ||
              setupMutation.isPending ||
              enableMutation.isPending ||
              disableMutation.isPending
            }
          />
          {mandatory2FAEnabled && (
            <p className="text-xs text-amber-700">
              Mandatory 2FA is enabled. Personal 2FA cannot be disabled while this policy is active.
            </p>
          )}

          {setupData && !twoFactorEnabled && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Scan this QR code with your security code generator (e.g. Google Authenticator or Authy), then enter the 6-digit code to enable 2FA.
              </p>
              {qrImageUrl && (
                <img src={qrImageUrl} alt="2FA QR code" className="h-[180px] w-[180px] rounded border" />
              )}
              <p className="text-xs text-gray-500 break-all">
                Manual key: <span className="font-mono">{setupData.secret}</span>
              </p>
              <div className="flex gap-2 items-end">
                <Input
                  label="Verification code"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button
                  onClick={() => enableMutation.mutate(verificationCode)}
                  isLoading={enableMutation.isPending}
                  disabled={verificationCode.length !== 6}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {twoFactorEnabled && !mandatory2FAEnabled && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <p className="text-sm text-gray-600">
                To disable 2FA, enter a current code from your security code generator and click Disable 2FA.
              </p>
              <div className="flex gap-2 items-end">
                <Input
                  label="Authentication code"
                  placeholder="123456"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button
                  variant="danger"
                  onClick={handleDisable2FA}
                  isLoading={disableMutation.isPending}
                  disabled={disableCode.length !== 6}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
