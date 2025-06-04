'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import { z } from 'zod';
import { 
  Listbox, 
  Transition, 
  Combobox,
  Label,
  Description
} from '@headlessui/react';
import { 
  ChevronUpDownIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

// Cron validation schema using Zod
const cronSchema = z.string().refine((value) => {
  if (!value) return false;
  
  // Basic cron expression validation (5 or 6 parts)
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return false;
  
  // Validate each part has valid characters for cron
  const cronPattern = /^[\d\*\-\/\,\?\#LW]+$/;
  return parts.every(part => cronPattern.test(part));
}, {
  message: "Invalid cron expression format. Expected format: '* * * * *' or '* * * * * *'"
});

// Predefined frequency options
const FREQUENCY_OPTIONS = [
  {
    id: 'every-5-minutes',
    label: 'Every 5 minutes',
    value: '*/5 * * * *',
    description: 'Runs every 5 minutes'
  },
  {
    id: 'every-15-minutes',
    label: 'Every 15 minutes', 
    value: '*/15 * * * *',
    description: 'Runs every 15 minutes'
  },
  {
    id: 'every-30-minutes',
    label: 'Every 30 minutes',
    value: '*/30 * * * *', 
    description: 'Runs every 30 minutes'
  },
  {
    id: 'hourly',
    label: 'Hourly',
    value: '0 * * * *',
    description: 'Runs at the beginning of every hour'
  },
  {
    id: 'daily',
    label: 'Daily',
    value: '0 0 * * *',
    description: 'Runs daily at midnight'
  },
  {
    id: 'weekly',
    label: 'Weekly', 
    value: '0 0 * * 0',
    description: 'Runs weekly on Sunday at midnight'
  },
  {
    id: 'monthly',
    label: 'Monthly',
    value: '0 0 1 * *',
    description: 'Runs monthly on the 1st at midnight'
  },
  {
    id: 'custom',
    label: 'Custom cron expression',
    value: '',
    description: 'Define your own cron expression'
  }
];

interface SchedulerFrequencyPickerProps {
  name: string;
  control: Control<any>;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: FieldError;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Simple cron parser for next execution times (basic implementation)
function getNextExecutionTimes(cronExpression: string, count: number = 3): Date[] {
  if (!cronExpression || !cronSchema.safeParse(cronExpression).success) {
    return [];
  }

  const now = new Date();
  const times: Date[] = [];
  
  // This is a simplified implementation - in a real app you'd use a proper cron library
  // For demo purposes, we'll generate approximate times based on common patterns
  
  if (cronExpression === '*/5 * * * *') {
    // Every 5 minutes
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getTime() + (i * 5 * 60 * 1000));
      times.push(nextTime);
    }
  } else if (cronExpression === '*/15 * * * *') {
    // Every 15 minutes
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getTime() + (i * 15 * 60 * 1000));
      times.push(nextTime);
    }
  } else if (cronExpression === '*/30 * * * *') {
    // Every 30 minutes
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getTime() + (i * 30 * 60 * 1000));
      times.push(nextTime);
    }
  } else if (cronExpression === '0 * * * *') {
    // Hourly
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getTime() + (i * 60 * 60 * 1000));
      nextTime.setMinutes(0, 0, 0);
      times.push(nextTime);
    }
  } else if (cronExpression === '0 0 * * *') {
    // Daily
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      nextTime.setHours(0, 0, 0, 0);
      times.push(nextTime);
    }
  } else if (cronExpression === '0 0 * * 0') {
    // Weekly (Sunday)
    const daysUntilSunday = (7 - now.getDay()) % 7;
    for (let i = 0; i < count; i++) {
      const nextTime = new Date(now.getTime() + ((daysUntilSunday + (i * 7)) * 24 * 60 * 60 * 1000));
      nextTime.setHours(0, 0, 0, 0);
      times.push(nextTime);
    }
  } else if (cronExpression === '0 0 1 * *') {
    // Monthly (1st of month)
    for (let i = 1; i <= count; i++) {
      const nextTime = new Date(now.getFullYear(), now.getMonth() + i, 1);
      times.push(nextTime);
    }
  }
  
  return times;
}

function formatExecutionTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function SchedulerFrequencyPicker({
  name,
  control,
  label = 'Execution Frequency',
  description,
  disabled = false,
  required = false,
  error,
  placeholder = 'Select frequency...',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: SchedulerFrequencyPickerProps) {
  const [selectedOption, setSelectedOption] = useState(FREQUENCY_OPTIONS[0]);
  const [customCron, setCustomCron] = useState('');
  const [cronError, setCronError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return FREQUENCY_OPTIONS;
    
    return FREQUENCY_OPTIONS.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Calculate next execution times
  const nextExecutionTimes = useMemo(() => {
    const cronExpression = selectedOption.id === 'custom' ? customCron : selectedOption.value;
    return getNextExecutionTimes(cronExpression);
  }, [selectedOption, customCron]);

  // Validate custom cron expression
  useEffect(() => {
    if (selectedOption.id === 'custom' && customCron) {
      const validation = cronSchema.safeParse(customCron);
      if (!validation.success) {
        setCronError(validation.error.errors[0]?.message || 'Invalid cron expression');
      } else {
        setCronError('');
      }
    } else {
      setCronError('');
    }
  }, [customCron, selectedOption.id]);

  const labelId = `${name}-label`;
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;
  const cronInputId = `${name}-cron-input`;
  const previewId = `${name}-preview`;

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'Frequency is required' : false }}
      render={({ field }) => (
        <div className="space-y-3">
          {/* Label */}
          <Label 
            htmlFor={name}
            id={labelId}
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </Label>

          {/* Description */}
          {description && (
            <Description 
              id={descriptionId}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {description}
            </Description>
          )}

          {/* Frequency Dropdown */}
          <div className="space-y-2">
            <Combobox
              value={selectedOption}
              onChange={(option) => {
                setSelectedOption(option);
                const value = option.id === 'custom' ? customCron : option.value;
                field.onChange(value);
              }}
              disabled={disabled}
            >
              <div className="relative">
                <Combobox.Input
                  className={`
                    relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left 
                    shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
                    focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                    disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500
                    sm:text-sm sm:leading-6
                    ${error || cronError ? 'ring-red-500 focus:ring-red-500' : ''}
                  `}
                  displayValue={(option: typeof FREQUENCY_OPTIONS[0]) => option?.label || ''}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={placeholder}
                  aria-label={ariaLabel || label}
                  aria-describedby={[
                    description ? descriptionId : '',
                    error || cronError ? errorId : '',
                    ariaDescribedBy
                  ].filter(Boolean).join(' ') || undefined}
                  aria-invalid={!!(error || cronError)}
                  aria-required={required}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Combobox.Button>
              </div>

              <Transition
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredOptions.length === 0 && searchQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                      No frequencies found.
                    </div>
                  ) : (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active 
                              ? 'bg-primary-600 text-white' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={option}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex flex-col">
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              <span className={`text-xs ${active ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                {option.description}
                              </span>
                            </div>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </Combobox>
          </div>

          {/* Custom Cron Input */}
          {selectedOption.id === 'custom' && (
            <div className="space-y-2">
              <label
                htmlFor={cronInputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cron Expression
              </label>
              <div className="relative">
                <input
                  id={cronInputId}
                  type="text"
                  value={customCron}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomCron(value);
                    field.onChange(value);
                  }}
                  placeholder="* * * * * (minute hour day month weekday)"
                  disabled={disabled}
                  className={`
                    block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100
                    shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:focus:ring-primary-400
                    disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500
                    bg-white dark:bg-gray-800
                    sm:text-sm sm:leading-6
                    ${cronError ? 'ring-red-500 focus:ring-red-500' : ''}
                  `}
                  aria-describedby={cronError ? errorId : undefined}
                  aria-invalid={!!cronError}
                />
                <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              
              {/* Cron Help Text */}
              <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <InformationCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p>Format: minute hour day month weekday</p>
                  <p>Examples: "0 0 * * *" (daily), "*/15 * * * *" (every 15 mins)</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {nextExecutionTimes.length > 0 && !cronError && (
            <div 
              id={previewId}
              className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800"
              aria-live="polite"
            >
              <div className="flex items-start space-x-2">
                <CalendarIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Next 3 Execution Times
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    {nextExecutionTimes.map((time, index) => (
                      <li key={index}>
                        {index + 1}. {formatExecutionTime(time)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || cronError) && (
            <div 
              id={errorId}
              className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{error?.message || cronError}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

// Export types for external use
export type { SchedulerFrequencyPickerProps };
export { FREQUENCY_OPTIONS, cronSchema, getNextExecutionTimes };