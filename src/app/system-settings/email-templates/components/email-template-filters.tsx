'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlState } from '@/lib/url-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Filter schema for validation
const filterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  hasDescription: z.enum(['all', 'yes', 'no']).optional(),
  hasAttachment: z.enum(['all', 'yes', 'no']).optional(),
  createdDateRange: z.enum(['all', 'last_week', 'last_month', 'last_year']).optional(),
});

export type EmailTemplateFilters = z.infer<typeof filterSchema>;

interface EmailTemplateFiltersProps {
  onFiltersChange: (filters: EmailTemplateFilters & { filterQuery?: string }) => void;
  isLoading?: boolean;
  className?: string;
}

// Status options for the filter dropdown
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

// Description filter options
const descriptionOptions = [
  { value: 'all', label: 'All Templates' },
  { value: 'yes', label: 'With Description' },
  { value: 'no', label: 'Without Description' },
] as const;

// Attachment filter options
const attachmentOptions = [
  { value: 'all', label: 'All Templates' },
  { value: 'yes', label: 'With Attachments' },
  { value: 'no', label: 'Without Attachments' },
] as const;

// Date range filter options
const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_year', label: 'Last Year' },
] as const;

export function EmailTemplateFilters({
  onFiltersChange,
  isLoading = false,
  className,
}: EmailTemplateFiltersProps) {
  // URL state management for filter persistence
  const [urlFilters, setUrlFilters] = useUrlState<EmailTemplateFilters>({
    search: '',
    status: 'all',
    hasDescription: 'all',
    hasAttachment: 'all',
    createdDateRange: 'all',
  });

  // Form setup with validation
  const form = useForm<EmailTemplateFilters>({
    resolver: zodResolver(filterSchema),
    defaultValues: urlFilters,
    mode: 'onChange',
  });

  const { control, watch, setValue, reset, getValues } = form;

  // Watch form values for changes
  const watchedValues = watch();

  // Debounced search value for performance optimization
  const debouncedSearch = useDebounce(watchedValues.search || '', 300);

  // Generate filter query string for backend (similar to Angular implementation)
  const generateFilterQuery = useMemo(() => {
    return (search: string) => {
      if (!search.trim()) return '';
      return `(name like "%${search}%") or (description like "%${search}%")`;
    };
  }, []);

  // Build comprehensive filter object
  const buildFilterObject = useMemo(() => {
    return (values: EmailTemplateFilters, searchValue: string) => {
      const filters: EmailTemplateFilters & { filterQuery?: string } = {
        ...values,
        search: searchValue,
      };

      // Add filter query for backend search
      if (searchValue.trim()) {
        filters.filterQuery = generateFilterQuery(searchValue);
      }

      return filters;
    };
  }, [generateFilterQuery]);

  // Effect to handle filter changes and URL persistence
  useEffect(() => {
    const currentValues = getValues();
    const filterObject = buildFilterObject(currentValues, debouncedSearch);
    
    // Update URL state
    setUrlFilters(currentValues);
    
    // Notify parent component of filter changes
    onFiltersChange(filterObject);
  }, [debouncedSearch, watchedValues, onFiltersChange, setUrlFilters, getValues, buildFilterObject]);

  // Check if any filters are active (for clear button visibility)
  const hasActiveFilters = useMemo(() => {
    const values = getValues();
    return (
      (values.search && values.search.trim() !== '') ||
      values.status !== 'all' ||
      values.hasDescription !== 'all' ||
      values.hasAttachment !== 'all' ||
      values.createdDateRange !== 'all'
    );
  }, [watchedValues, getValues]);

  // Clear all filters
  const handleClearFilters = () => {
    const defaultValues: EmailTemplateFilters = {
      search: '',
      status: 'all',
      hasDescription: 'all',
      hasAttachment: 'all',
      createdDateRange: 'all',
    };
    
    reset(defaultValues);
    setUrlFilters(defaultValues);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" 
              aria-hidden="true"
            />
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="search"
                  placeholder="Search email templates by name or description..."
                  className="pl-10 pr-4"
                  disabled={isLoading}
                  aria-label="Search email templates"
                  autoComplete="off"
                />
              )}
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {/* Status Filter */}
          <div className="min-w-0">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Advanced Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="whitespace-nowrap"
                disabled={isLoading}
                aria-label="Advanced filters"
              >
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                Advanced
                <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Advanced Filters
                </h4>

                {/* Description Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <Controller
                    name="hasDescription"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                        <SelectTrigger aria-label="Filter by description presence">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {descriptionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Attachment Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attachments
                  </label>
                  <Controller
                    name="hasAttachment"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                        <SelectTrigger aria-label="Filter by attachment presence">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {attachmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Created Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created Date
                  </label>
                  <Controller
                    name="createdDateRange"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                        <SelectTrigger aria-label="Filter by creation date range">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dateRangeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="default"
              onClick={handleClearFilters}
              disabled={isLoading}
              className="whitespace-nowrap"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Summary (Mobile-friendly) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-4">
          {watchedValues.search && watchedValues.search.trim() && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md">
              <span>Search: "{watchedValues.search}"</span>
              <button
                type="button"
                onClick={() => setValue('search', '')}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                aria-label={`Remove search filter: ${watchedValues.search}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}
          
          {watchedValues.status !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-md">
              <span>Status: {statusOptions.find(opt => opt.value === watchedValues.status)?.label}</span>
              <button
                type="button"
                onClick={() => setValue('status', 'all')}
                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded p-0.5"
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}

          {watchedValues.hasDescription !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-md">
              <span>Description: {descriptionOptions.find(opt => opt.value === watchedValues.hasDescription)?.label}</span>
              <button
                type="button"
                onClick={() => setValue('hasDescription', 'all')}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5"
                aria-label="Remove description filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}

          {watchedValues.hasAttachment !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-md">
              <span>Attachments: {attachmentOptions.find(opt => opt.value === watchedValues.hasAttachment)?.label}</span>
              <button
                type="button"
                onClick={() => setValue('hasAttachment', 'all')}
                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded p-0.5"
                aria-label="Remove attachment filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}

          {watchedValues.createdDateRange !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-md">
              <span>Created: {dateRangeOptions.find(opt => opt.value === watchedValues.createdDateRange)?.label}</span>
              <button
                type="button"
                onClick={() => setValue('createdDateRange', 'all')}
                className="ml-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded p-0.5"
                aria-label="Remove created date filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}