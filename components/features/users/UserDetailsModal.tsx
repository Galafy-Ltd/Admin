'use client';

import { X, Lock, Send, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usersApi } from '@/lib/api/users';
import { formatTier, formatDate } from '@/lib/utils/format';
import type { User } from '@/lib/types/api';

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUserDetails(userId),
    enabled: !!userId,
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

  const isKYCComplete = user.customer?.tier && ['TIER_2', 'TIER_3'].includes(user.customer.tier);
  const needsVerification = !isKYCComplete;

  // Determine KYC step statuses (these would come from API in a real implementation)
  const kycSteps = {
    idUpload: false, // Would come from API
    selfieVerification: false, // Would come from API
    addressProof: false, // Would come from API
  };

  const handleSendKYCReminder = () => {
    // TODO: Implement API call to send KYC reminder
    console.log('Send KYC reminder for user:', userId);
  };

  const handleRestrictAccount = () => {
    // TODO: Implement API call to restrict account
    if (confirm('Are you sure you want to restrict this account?')) {
      console.log('Restrict account for user:', userId);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-200/80 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {user.firstName?.charAt(0)?.toUpperCase() || ''}
                    {user.lastName?.charAt(0)?.toUpperCase() || ''}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                {user.username && (
                  <p className="text-sm text-gray-500">@{user.username}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">ID: {user.id.slice(0, 13)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mb-4">
            <Badge variant={user.isActive ? 'success' : 'warning'}>
              {user.isActive ? 'Verified' : 'Pending'}
            </Badge>
            {user.customer?.tier && (
              <Badge variant="default">
                {formatTier(user.customer.tier)} - {user.customer.tier === 'TIER_1' ? 'Basic Access' : user.customer.tier === 'TIER_2' ? 'Standard Access' : 'Full Access'}
              </Badge>
            )}
          </div>

          {/* Verification Alert */}
          {needsVerification && (
            <div className="mb-4">
              <Badge variant="warning" className="mb-2">
                Verification Required
              </Badge>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  This user cannot perform or receive funds until KYC is completed.
                </p>
              </div>
            </div>
          )}

          {/* Contact Details */}
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

          {/* KYC Progress */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">KYC Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">ID Upload</span>
                <span className={`text-sm ${kycSteps.idUpload ? 'text-green-600' : 'text-red-600'}`}>
                  {kycSteps.idUpload ? '✓ Submitted' : '✗ Not Submitted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Selfie Verification</span>
                <span className={`text-sm ${kycSteps.selfieVerification ? 'text-green-600' : 'text-red-600'}`}>
                  {kycSteps.selfieVerification ? '✓ Completed' : '✗ Not Completed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Address Proof</span>
                <span className={`text-sm ${kycSteps.addressProof ? 'text-green-600' : 'text-red-600'}`}>
                  {kycSteps.addressProof ? '✓ Provided' : '✗ Not Provided'}
                </span>
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                User must complete all steps to unlock Tier 3 and above.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 space-y-3">
            <Button
              onClick={handleSendKYCReminder}
              className="w-full"
              variant="primary"
            >
              <Send className="h-4 w-4 mr-2" />
              Send KYC Reminder
            </Button>
            <Button
              onClick={handleRestrictAccount}
              className="w-full"
              variant="danger"
            >
              <Ban className="h-4 w-4 mr-2" />
              Restrict Account
            </Button>
          </div>

          {/* Tier Management */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Tier Upgrade Locked</h3>
            </div>
            <p className="text-xs text-gray-600">
              Complete KYC verification to enable tier upgrades.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

