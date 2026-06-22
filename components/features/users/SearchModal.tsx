'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatTierLabel } from '@/lib/utils/kyc';
import type { User } from '@/lib/types/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  isLoading: boolean;
  query: string;
}

export function SearchModal({ isOpen, onClose, users, isLoading, query }: SearchModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUserClick = (userId: string) => {
    router.push(`/users?userId=${userId}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[60vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Searching...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {query ? `No users found for "${query}"` : 'Enter a search query'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={user.profilePicture}
                      name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      email={user.email}
                      size="md"
                      className="w-12 h-12"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.customer?.tier !== undefined && (
                          <Badge
                            variant={
                              user.customer.tier === 'Tier_1'
                                ? 'info'
                                : user.customer.tier === 'Tier_2'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {formatTierLabel(user.customer.tier)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {user.email && (
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        )}
                        {user.phone && (
                          <p className="text-sm text-gray-500 truncate">{user.phone}</p>
                        )}
                        {user.username && (
                          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

