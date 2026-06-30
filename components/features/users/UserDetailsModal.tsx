'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Send, Ban, CheckCircle, ShieldOff, RotateCcw, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { usersApi } from '@/lib/api/users';
import {
  getTierProgress,
  getTierKycStatus,
  canApproveTier3,
  canReverseTier3,
  isPendingKyc,
  getCustomerTier,
  getKycStatusBadgeVariant,
  getKycStatusLabel,
  getTierDisplayLabel,
  getAccountStatus,
  shouldShowTierLimitBanner,
  canOpenReconciliation,
} from '@/lib/utils/kyc';
import { formatDate } from '@/lib/utils/format';

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const queryClient = useQueryClient();
  const [restrictReason, setRestrictReason] = useState('');
  const [showRestrictForm, setShowRestrictForm] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUserDetails(userId),
    enabled: !!userId,
  });

  const reminderMutation = useMutation({
    mutationFn: () => usersApi.sendKycReminder(userId),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'KYC reminder sent successfully.' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to send KYC reminder.',
      });
    },
  });

  const restrictMutation = useMutation({
    mutationFn: (reason: string) => usersApi.restrictUser(userId, reason),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Account restricted successfully.' });
      setShowRestrictForm(false);
      setRestrictReason('');
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to restrict account.',
      });
    },
  });

  const unrestrictMutation = useMutation({
    mutationFn: () => usersApi.unrestrictUser(userId),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Account unrestricted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to unrestrict account.',
      });
    },
  });

  const approveTier3Mutation = useMutation({
    mutationFn: () => usersApi.approveTier3(user!.customer!.id),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Tier 3 approved successfully.' });
      setShowApproveModal(false);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to approve Tier 3.',
      });
    },
  });

  const reverseTier3Mutation = useMutation({
    mutationFn: () => usersApi.reverseTier3(user!.customer!.id),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Tier 3 approval reversed.' });
      setShowReverseModal(false);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to reverse Tier 3.',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 flex items-center justify-center">
        <p className="text-gray-500">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 flex items-center justify-center">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const tierProgress = getTierProgress(user.customer);
  const kycStatus = getTierKycStatus(user.customer);
  const showApproveTier3 = canApproveTier3(user.customer);
  const showReverseTier3 = canReverseTier3(user.customer);
  const isRestricted = user.customer?.isAmlRestricted;
  const accountStatus = getAccountStatus(user.customer);
  const showLimitBanner = shouldShowTierLimitBanner(user.customer);
  const showReconciliation = canOpenReconciliation(user.customer);

  return (
    <>
      <div className="fixed inset-0 bg-gray-200/80 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.profilePicture}
                name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                email={user.email}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                <p className="text-xs text-gray-400 mt-1">ID: {user.id.slice(0, 13)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            <Badge variant={getKycStatusBadgeVariant(kycStatus)}>
              {getKycStatusLabel(kycStatus)}
            </Badge>
            <Badge variant="default">{getTierDisplayLabel(user.customer)}</Badge>
            {isRestricted && <Badge variant="danger">AML Restricted</Badge>}
          </div>

          <div className="mb-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                accountStatus.variant === 'success'
                  ? 'bg-green-100 text-green-800'
                  : accountStatus.variant === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              Account Status — {accountStatus.label}
            </span>
          </div>

          {actionMessage && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                actionMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {actionMessage.text}
            </div>
          )}

          {showLimitBanner && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                {user.customer?.isBalanceRestricted && user.customer.balanceRestrictionReason
                  ? user.customer.balanceRestrictionReason
                  : 'This user is restricted to ₦300,000 balance and ₦100,000 daily limit.'}
              </p>
            </div>
          )}

          {getCustomerTier(user.customer) !== 'Tier_0' && isPendingKyc(user.customer) && !showLimitBanner && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This user has incomplete KYC verification for one or more tiers.
              </p>
            </div>
          )}

          {isRestricted && user.customer?.amlRestrictionReason && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Restriction reason:</strong> {user.customer.amlRestrictionReason}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              {user.phone && (
                <div>
                  <span className="text-gray-500">Phone Number:</span>
                  <span className="ml-2 text-gray-900">{user.phone}</span>
                </div>
              )}
              {user.createdAt && (
                <div>
                  <span className="text-gray-500">Date Joined:</span>
                  <span className="ml-2 text-gray-900">{formatDate(user.createdAt, 'MMMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">KYC Progress</h3>
            <div className="space-y-4">
              {tierProgress.map((tier) => (
                <div key={tier.tier} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{tier.label}</span>
                    <Badge variant={tier.status === 'completed' ? 'success' : 'warning'}>
                      {tier.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{tier.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 space-y-3">
            {showApproveTier3 && (
              <Button
                onClick={() => setShowApproveModal(true)}
                className="w-full"
                variant="primary"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Tier 3 Upgrade
              </Button>
            )}

            {showReverseTier3 && (
              <Button
                onClick={() => setShowReverseModal(true)}
                className="w-full"
                variant="primary"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reverse Tier 3 Approval
              </Button>
            )}

            {showReconciliation && (
              <Link href={`/users/${userId}/reconciliation`} className="block">
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Reconciliation
                </Button>
              </Link>
            )}

            {getCustomerTier(user.customer) !== 'Tier_0' && isPendingKyc(user.customer) && (
              <Button
                onClick={() => reminderMutation.mutate()}
                className="w-full"
                variant="primary"
                isLoading={reminderMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send KYC Reminder
              </Button>
            )}

            {isRestricted ? (
              <Button
                onClick={() => unrestrictMutation.mutate()}
                className="w-full"
                variant="outline"
                isLoading={unrestrictMutation.isPending}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Unrestrict Account
              </Button>
            ) : showRestrictForm ? (
              <div className="space-y-2">
                <Input
                  placeholder="Reason for restriction..."
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => restrictMutation.mutate(restrictReason)}
                    className="flex-1"
                    variant="danger"
                    disabled={!restrictReason.trim()}
                    isLoading={restrictMutation.isPending}
                  >
                    Confirm Restrict
                  </Button>
                  <Button onClick={() => setShowRestrictForm(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowRestrictForm(true)} className="w-full" variant="danger">
                <Ban className="h-4 w-4 mr-2" />
                Restrict Account
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Tier 3 Upgrade"
        description="You're about to approve this user's Tier 3 verification. This will unlock full account access, including event hosting, unlimited wallet limits, and creator features."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => approveTier3Mutation.mutate()} isLoading={approveTier3Mutation.isPending}>
            Approve Upgrade
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        title="Reverse Tier 3 Approval"
        description="This will downgrade the user to Tier 2 and remove unlimited wallet benefits. Address verification status will not be changed."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowReverseModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => reverseTier3Mutation.mutate()} isLoading={reverseTier3Mutation.isPending}>
            Reverse Approval
          </Button>
        </div>
      </Modal>
    </>
  );
}
