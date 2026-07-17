import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const updateConfigSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

const CONFIG_TYPES = ['STRING', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'JSON'] as const;

export function getConfigValueTypeError(value: string, type: string): string | null {
  switch (type) {
    case 'NUMBER':
      if (Number.isNaN(parseInt(value, 10))) {
        return `Value "${value}" is not a valid number`;
      }
      return null;
    case 'DECIMAL':
      if (Number.isNaN(Number(value)) || value.trim() === '') {
        return `Value "${value}" is not a valid decimal`;
      }
      return null;
    case 'BOOLEAN': {
      const lower = value.toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lower)) {
        return `Value "${value}" is not a valid boolean (use true/false)`;
      }
      return null;
    }
    case 'JSON':
      try {
        JSON.parse(value);
        return null;
      } catch {
        return `Value "${value}" is not valid JSON`;
      }
    case 'STRING':
    default:
      return null;
  }
}

export const createConfigSchema = z
  .object({
    key: z.string().min(1, 'Key is required'),
    category: z.string().min(1, 'Category is required'),
    value: z.string().min(1, 'Value is required'),
    type: z.enum(CONFIG_TYPES, { message: 'Type is required' }),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const typeError = getConfigValueTypeError(data.value, data.type);
    if (typeError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: typeError,
        path: ['value'],
      });
    }
  });

