'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Key } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { forgotPasswordSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      alert(error?.response?.data?.message || 'Failed to send reset link. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to your email address. Please check your inbox.
          </p>
          <Link href="/login">
            <Button>Back to Login</Button>
          </Link>
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
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">GalaPay Admin</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">Enter your registered email address to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. admin@galapay.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Send Reset Link
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">Remember password? </span>
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                Go back to Login
              </Link>
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

