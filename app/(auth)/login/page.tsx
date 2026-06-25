'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginSchema } from '@/lib/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthAlert } from '@/components/ui/AuthAlert';
import type { LoginRequest } from '@/lib/types/api';
import {
  AUTH_SESSION_NOTICE_STORAGE_KEY,
  AUTH_SESSION_NOTICE_EXPIRED,
} from '@/lib/utils/auth';

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://galafy.com';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [twoFactorStep, setTwoFactorStep] = useState<{ tempToken: string; email: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const { login, completeTwoFactorLogin } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_SESSION_NOTICE_STORAGE_KEY) === AUTH_SESSION_NOTICE_EXPIRED) {
        setSessionNotice('Your session has expired. Please sign in again.');
        sessionStorage.removeItem(AUTH_SESSION_NOTICE_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = async (data: LoginRequest) => {
    setLoginError(null);
    try {
      const result = await login(data);
      if (result.requires2FA && result.tempToken) {
        setTwoFactorStep({ tempToken: result.tempToken, email: data.email });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setLoginError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const onVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorStep || twoFactorCode.length !== 6) return;

    setLoginError(null);
    setIsVerifying2FA(true);
    try {
      await completeTwoFactorLogin(twoFactorStep.tempToken, twoFactorCode);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setLoginError(err?.response?.data?.message || 'Invalid authentication code. Please try again.');
    } finally {
      setIsVerifying2FA(false);
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
            <p className="text-gray-600">
              {twoFactorStep
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Sign in to manage and monitor your platform operations.'}
            </p>
          </div>

          {twoFactorStep ? (
            <form onSubmit={onVerifyTwoFactor} className="space-y-6">
              {loginError && <AuthAlert variant="error" message={loginError} />}
              <p className="text-sm text-gray-500">Signing in as {twoFactorStep.email}</p>
              <Input
                label="Authentication code"
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <Button type="submit" className="w-full" isLoading={isVerifying2FA} disabled={twoFactorCode.length !== 6}>
                Verify & Sign In
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setTwoFactorStep(null);
                  setTwoFactorCode('');
                  setLoginError(null);
                }}
              >
                Back to login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {sessionNotice && <AuthAlert variant="warning" message={sessionNotice} />}
              {loginError && <AuthAlert variant="error" message={loginError} />}
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
                <a
                  href={MAIN_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Return to Main Site
                </a>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#0D2A68] items-center justify-center p-8">
        <div className="max-w-md text-white">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6">
            <img src="/key.png" alt="key" className="w-full h-full" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Secure Access, Quick Recovery.</h2>
          <p className="text-gray-300 mb-8">
            Reset your password securely and regain access to your admin dashboard in minutes.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <img src="/encryp.png" alt="encrypted" />
              <span>Encrypted email delivery</span>
            </li>
            <li className="flex items-center gap-3">
              <img src="/clock.png" alt="time" />
              <span>15-minute secure link</span>
            </li>
            <li className="flex items-center gap-3">
              <img src="/account.png" alt="account" />
              <span>Account verification required</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
