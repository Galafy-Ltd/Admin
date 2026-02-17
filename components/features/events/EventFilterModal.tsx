'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils/cn';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface EventFilters {
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | null;
  categories?: string[];
  startDate?: string;
  endDate?: string;
}

interface EventFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: EventFilters;
  onApplyFilters: (filters: EventFilters) => void;
  onResetFilters: () => void;
}

const EVENT_TYPES = [
  'Anniversary',
  'Art Shows',
  'Baby Shower',
  'Band Sessions',
  'Birthday',
  'Bridal Shower',
  'Carnival',
  'Celebration of Life (Funeral)',
  'Club Night',
  'Comedy Show',
  'Concert',
  'Dancers',
  'DJ Events',
  'Drummers',
  'Engagement',
  'Fashion Shows',
  'Festival',
  'Game Nights',
  'Gender Reveal',
  'Graduation',
  'Hypemen',
  'Influencers',
  'Karaoke',
  'Live Band',
  'Live Music',
  'Lounge Events',
  'MC/Host',
  'Naming Ceremony',
  'Open Mic',
  'Retirement',
  'Show Performances',
  'Street Carnivals',
  'Wedding',
];

const STATUS_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Upcoming', value: 'SCHEDULED' as const },
  { label: 'Live', value: 'LIVE' as const },
  { label: 'Completed', value: 'ENDED' as const },
  { label: 'Cancelled', value: 'CANCELLED' as const },
];

export function EventFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}: EventFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  // Initialize local state when filters change
  useEffect(() => {
    setLocalFilters(filters);
    setStartDateInput(filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : '');
    setEndDateInput(filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : '');
  }, [filters]);

  const handleQuickDate = (option: 'today' | 'thisWeek' | 'thisMonth' | 'last90Days') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (option) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'thisWeek':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last90Days':
        start = startOfDay(subDays(now, 90));
        end = endOfDay(now);
        break;
    }

    setStartDateInput(format(start, 'yyyy-MM-dd'));
    setEndDateInput(format(end, 'yyyy-MM-dd'));
    setLocalFilters({
      ...localFilters,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = localFilters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    
    setLocalFilters({
      ...localFilters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleStatusChange = (status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | null) => {
    setLocalFilters({
      ...localFilters,
      status: status || undefined,
    });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDateInput(value);
      setLocalFilters({
        ...localFilters,
        startDate: value ? startOfDay(new Date(value)).toISOString() : undefined,
      });
    } else {
      setEndDateInput(value);
      setLocalFilters({
        ...localFilters,
        endDate: value ? endOfDay(new Date(value)).toISOString() : undefined,
      });
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: EventFilters = {};
    setLocalFilters(resetFilters);
    setStartDateInput('');
    setEndDateInput('');
    onResetFilters();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Events" size="lg">
      <div className="space-y-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="flex gap-3 mb-3">
            <Input
              type="date"
              value={startDateInput}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="flex-1"
            />
            <Input
              type="date"
              value={endDateInput}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="flex-1"
            />
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Calendar className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap border border-dashed border-blue-500 rounded-lg p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('today')}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('thisWeek')}
              className="text-xs"
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('thisMonth')}
              className="text-xs"
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('last90Days')}
              className="text-xs"
            >
              Last 90 days
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => handleStatusChange(option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  localFilters.status === option.value || (option.value === null && !localFilters.status)
                    ? 'bg-[#0D2A68] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Event Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <Checkbox
                key={type}
                label={type}
                checked={localFilters.categories?.includes(type) || false}
                onChange={() => handleCategoryToggle(type)}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset Filters
          </Button>
          <Button variant="primary" onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
}

