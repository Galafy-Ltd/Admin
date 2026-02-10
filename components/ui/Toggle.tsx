'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, checked, ...props }, ref) => {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {label && <label className="text-sm font-medium text-gray-900">{label}</label>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            {...props}
          />
          <div
            className={cn(
              "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600",
              className
            )}
          />
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

