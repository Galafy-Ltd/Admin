'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { resetPasswordSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

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

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (!token) {
      alert('Invalid reset token');
      return;
    }

    try {
      await authApi.resetPassword(token, data.password);
      router.push('/reset-success');
    } catch (error: any) {
      console.error('Reset password error:', error);
      alert(error?.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600">The reset link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Create a new secure password for your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
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
                  placeholder="Confirm your new password"
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

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Reset Password
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/login')}>
                Back to Login
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#0D2A68] items-center justify-center p-8">
        <div className="max-w-md text-white">
          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
            <Key className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Secure Access, Quick Recovery.</h2>
          <p className="text-gray-300 mb-8">
            Reset your password securely and regain access to your admin dashboard in minutes.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <span>Encrypted email delivery</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">⏰</span>
              <span>15-minute secure link</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">👤</span>
              <span>Account verification required</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

