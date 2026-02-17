import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onChange, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
              checked
                ? 'bg-[#0D2A68] border-[#0D2A68]'
                : 'bg-white border-gray-300',
              className
            )}
          >
            {checked && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

