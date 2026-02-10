'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Key } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { LoginRequest } from '@/lib/types/api';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
             <img src="/icon.svg" alt="galafyicon" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to manage and monitor your platform operations.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

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

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[#0D2A68] hover:text-[#0D2A68]/80">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Login
            </Button>

            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Return to Main Site
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#0D2A68] items-center justify-center p-8">
        <div className="max-w-md text-white">
          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-6">
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

