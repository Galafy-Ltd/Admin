'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { adminsApi } from '@/lib/api/admins';
import { acceptInviteSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AcceptInvitePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{ token: string; password: string; confirmPassword: string }>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const password = watch('password');

  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  const checkPasswordRequirement = (requirement: string) => {
    if (!password) return false;
    switch (requirement) {
      case 'length':
        return password.length >= 8;
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'number':
        return /[0-9]/.test(password);
      case 'special':
        return /[^A-Za-z0-9]/.test(password);
      default:
        return false;
    }
  };

  const onSubmit = async (data: { token: string; password: string; confirmPassword: string }) => {
    try {
      await adminsApi.acceptInvite({ token: data.token, password: data.password });
      router.push('/login?invite=accepted');
    } catch (error: any) {
      console.error('Accept invite error:', error);
      alert(error?.response?.data?.message || 'Failed to accept invite. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Link</h2>
          <p className="text-gray-600">The invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Admin Invite</h1>
          <p className="text-gray-600">Set up your password to complete your admin account setup.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('token')} />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">Password Requirements:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                {checkPasswordRequirement('length') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={checkPasswordRequirement('length') ? 'text-green-600' : 'text-gray-600'}>
                  At least 8 characters
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                {checkPasswordRequirement('uppercase') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={checkPasswordRequirement('uppercase') ? 'text-green-600' : 'text-gray-600'}>
                  One uppercase letter
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                {checkPasswordRequirement('number') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={checkPasswordRequirement('number') ? 'text-green-600' : 'text-gray-600'}>
                  One number
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                {checkPasswordRequirement('special') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span className={checkPasswordRequirement('special') ? 'text-green-600' : 'text-gray-600'}>
                  One special character
                </span>
              </li>
            </ul>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
}

