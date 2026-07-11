'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface RowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface RowActionsMenuProps {
  actions: RowAction[];
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 176,
  });
  const menuWidth = 176;

  const activeActions = useMemo(() => actions, [actions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 8;
      let left = rect.right - menuWidth;
      if (left < gap) left = gap;
      if (left + menuWidth > viewportWidth - gap) {
        left = viewportWidth - menuWidth - gap;
      }
      let top = rect.bottom + gap;
      const estimatedHeight = Math.max(56, activeActions.length * 38 + 8);
      if (top + estimatedHeight > viewportHeight - gap) {
        top = Math.max(gap, rect.top - estimatedHeight - gap);
      }
      setMenuStyle({ top, left, width: menuWidth });
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      updatePosition();
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, activeActions.length]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        aria-label="Row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] rounded-md border border-gray-200 bg-white shadow-lg py-1"
            style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full px-3 py-2 text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
