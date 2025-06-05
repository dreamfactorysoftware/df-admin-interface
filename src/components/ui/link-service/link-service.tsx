'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import useSWR, { mutate } from 'swr';

// UI Components
import { Button } from '../button/button';
import { Input } from '../input/input';
import { Select } from '../select/select';
import { Form, FormField } from '../form';

// Types and Hooks
import type { 
  LinkServiceProps, 
  StorageService, 
  LinkServiceFormData,
  ServiceType 
} from './link-service.types';
import { useStorageServices } from '@/hooks/use-storage-services';
import { useTheme } from '@/hooks/use-theme';

// Utilities and Configuration
import { cn } from '@/lib/utils';
import { readAsText } from '@/lib/utils';

/**
 * Zod validation schema for LinkService form
 * Provides runtime type checking with compile-time inference
 */
const linkServiceSchema = z.object({
  serviceList: z
    .string()
    .min(1, { message: 'Please select a service' })
    .describe('Selected storage service identifier'),
  repoInput: z
    .string()
    .min(1, { message: 'Repository name is required' })
    .max(255, { message: 'Repository name too long' })
    .regex(/^[\w\-\.]+$/, { message: 'Invalid repository name format' })
    .describe('Repository name for source control services'),
  branchInput: z
    .string()
    .min(1, { message: 'Branch or tag is required' })
    .max(100, { message: 'Branch name too long' })
    .describe('Git branch or tag reference'),
  pathInput: z
    .string()
    .min(1, { message: 'File path is required' })
    .max(500, { message: 'File path too long' })
    .describe('File path within the repository'),
});

/**
 * LinkService Component
 * 
 * Provides interface for connecting to external storage services with form validation
 * and cache management. Migrated from Angular df-link-service component.
 * 
 * Features:
 * - React Hook Form integration with real-time validation under 100ms
 * - SWR/React Query for intelligent caching and storage service synchronization  
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Headless UI components replacing Angular Material for accessible primitives
 * - Tailwind CSS styling replacing Angular Material and SCSS patterns
 * - Expandable panels with proper accessibility semantics
 * - Zustand theme management for consistent light/dark mode support
 */
export function LinkService({
  cache,
  storageServiceId,
  storagePath,
  content,
  onContentChange,
  onStoragePathChange,
  className,
  'aria-label': ariaLabel = 'Link to external storage service',
  ...props
}: LinkServiceProps) {
  // Theme management using Zustand store
  const { theme, isDarkMode } = useTheme();
  
  // Loading and error states
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isDeletingCache, setIsDeletingCache] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Storage services data fetching with SWR intelligent caching
  const { 
    data: storageServices = [], 
    error: servicesError,
    isLoading: servicesLoading 
  } = useStorageServices({
    group: 'source control,file',
    refreshInterval: 30000, // 30 seconds background refresh
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Form configuration with React Hook Form and Zod validation
  const form = useForm<LinkServiceFormData>({
    resolver: zodResolver(linkServiceSchema),
    defaultValues: {
      serviceList: '',
      repoInput: '',
      branchInput: 'main', // Default to main branch
      pathInput: '',
    },
    mode: 'onChange', // Real-time validation for sub-100ms response
  });

  const { control, handleSubmit, watch, formState: { errors: formErrors, isValid } } = form;
  
  // Watch form values for reactive updates
  const watchedServiceList = watch('serviceList');
  
  // Determine if selected service is GitHub type for conditional UI
  const selectedService = useMemo(() => {
    return storageServices.find(service => service.label === watchedServiceList);
  }, [storageServices, watchedServiceList]);

  const isGitHubService = useMemo(() => {
    return selectedService?.type === 'github';
  }, [selectedService]);

  // Effect to update storage path when form values change
  useEffect(() => {
    const subscription = watch((value) => {
      if (onStoragePathChange && value.repoInput && value.branchInput && value.pathInput) {
        const newPath = `${value.serviceList}/_repo/${value.repoInput}?branch=${value.branchInput}&path=${value.pathInput}`;
        onStoragePathChange(newPath);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onStoragePathChange]);

  // Effect to find and select service by ID when storageServiceId changes
  useEffect(() => {
    if (storageServiceId && storageServices.length > 0) {
      const foundService = storageServices.find(service => service.name === storageServiceId);
      if (foundService) {
        form.setValue('serviceList', foundService.label);
      }
    }
  }, [storageServiceId, storageServices, form]);

  /**
   * Handles fetching latest file content from storage service
   * Implements async file operations with proper error handling
   */
  const handleViewLatest = useCallback(async (data: LinkServiceFormData) => {
    if (!data.serviceList || !data.repoInput || !data.branchInput || !data.pathInput) {
      setErrors(prev => ({ ...prev, submit: 'All fields are required' }));
      return;
    }

    setIsLoadingContent(true);
    setErrors({});

    try {
      const filePath = `${data.serviceList}/_repo/${data.repoInput}?branch=${data.branchInput}&content=1&path=${data.pathInput}`;
      
      let response: Response;
      let fileContent: string;

      if (data.pathInput.endsWith('.json')) {
        // Handle JSON files with direct text response
        response = await fetch(`/api/storage/${filePath}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        fileContent = await response.text();
      } else {
        // Handle binary files with blob conversion
        response = await fetch(`/api/storage/${filePath}`, {
          method: 'GET',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        fileContent = await readAsText(blob);
      }

      // Update content through callback prop
      if (onContentChange) {
        onContentChange(fileContent);
      }

      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = 'File content loaded successfully';
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file content';
      setErrors(prev => ({ ...prev, content: errorMessage }));
      
      // Announce error to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = `Error loading file: ${errorMessage}`;
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
    } finally {
      setIsLoadingContent(false);
    }
  }, [onContentChange]);

  /**
   * Handles cache deletion with proper error handling and user feedback
   */
  const handleDeleteCache = useCallback(async () => {
    if (!cache) {
      setErrors(prev => ({ ...prev, cache: 'No cache identifier provided' }));
      return;
    }

    setIsDeletingCache(true);
    setErrors({});

    try {
      const response = await fetch(`/api/cache/_event/${cache}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete cache: ${response.status} ${response.statusText}`);
      }

      // Invalidate related SWR cache entries
      await mutate(key => typeof key === 'string' && key.includes(cache), undefined, { revalidate: false });

      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = 'Cache deleted successfully';
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete cache';
      setErrors(prev => ({ ...prev, cache: errorMessage }));
      
      // Announce error to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = `Error deleting cache: ${errorMessage}`;
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
    } finally {
      setIsDeletingCache(false);
    }
  }, [cache]);

  // Show loading state while services are being fetched
  if (servicesLoading) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center p-8 rounded-lg border border-gray-200",
          isDarkMode && "border-gray-700 bg-gray-800",
          className
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading storage services"
      >
        <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" aria-hidden="true" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Loading storage services...
        </span>
      </div>
    );
  }

  // Show error state if services failed to load
  if (servicesError) {
    return (
      <div 
        className={cn(
          "p-4 rounded-lg border border-red-200 bg-red-50",
          isDarkMode && "border-red-800 bg-red-900/20",
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
          Failed to load storage services
        </h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          {servicesError instanceof Error ? servicesError.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }

  // Don't render if no GitHub-type services are available
  if (!isGitHubService) {
    return null;
  }

  return (
    <div 
      className={cn(
        "w-full",
        className
      )}
      {...props}
      aria-label={ariaLabel}
    >
      <Disclosure defaultOpen={false}>
        {({ open }) => (
          <>
            <Disclosure.Button
              className={cn(
                "flex w-full justify-between rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                "border border-gray-200 hover:bg-gray-50",
                isDarkMode && "border-gray-700 bg-gray-800 hover:bg-gray-750 text-white",
                !isDarkMode && "bg-white text-gray-900 hover:bg-gray-50",
                open && "rounded-b-none border-b-0"
              )}
              aria-expanded={open}
              aria-controls="link-service-panel"
            >
              <span>Link to Service</span>
              <ChevronRightIcon
                className={cn(
                  "h-5 w-5 text-gray-500 transition-transform duration-200",
                  open && "rotate-90 transform"
                )}
                aria-hidden="true"
              />
            </Disclosure.Button>
            
            <Disclosure.Panel
              id="link-service-panel"
              className={cn(
                "px-4 py-6 border border-t-0 border-gray-200 rounded-b-lg",
                isDarkMode && "border-gray-700 bg-gray-800",
                !isDarkMode && "bg-white"
              )}
            >
              <Form onSubmit={handleSubmit(handleViewLatest)} className="space-y-6">
                {/* Service Selection */}
                <FormField
                  label="Select Service"
                  error={formErrors.serviceList?.message}
                  required
                  htmlFor="serviceList"
                >
                  <Controller
                    name="serviceList"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id="serviceList"
                        placeholder="Choose a storage service"
                        disabled={storageServices.length === 0}
                        className="w-full"
                        aria-describedby={formErrors.serviceList ? "serviceList-error" : undefined}
                      >
                        <option value="" disabled>
                          Select a service
                        </option>
                        {storageServices.map((service) => (
                          <option key={service.name} value={service.label}>
                            {service.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                </FormField>

                {/* Repository Input */}
                <FormField
                  label="Repository"
                  error={formErrors.repoInput?.message}
                  required
                  htmlFor="repoInput"
                >
                  <Controller
                    name="repoInput"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="repoInput"
                        type="text"
                        placeholder="Enter repository name"
                        className="w-full"
                        aria-describedby={formErrors.repoInput ? "repoInput-error" : undefined}
                      />
                    )}
                  />
                </FormField>

                {/* Branch/Tag Input */}
                <FormField
                  label="Branch/Tag"
                  error={formErrors.branchInput?.message}
                  required
                  htmlFor="branchInput"
                >
                  <Controller
                    name="branchInput"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="branchInput"
                        type="text"
                        placeholder="main"
                        className="w-full"
                        aria-describedby={formErrors.branchInput ? "branchInput-error" : undefined}
                      />
                    )}
                  />
                </FormField>

                {/* Path Input */}
                <FormField
                  label="Path"
                  error={formErrors.pathInput?.message}
                  required
                  htmlFor="pathInput"
                >
                  <Controller
                    name="pathInput"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="pathInput"
                        type="text"
                        placeholder="path/to/file.js"
                        className="w-full"
                        aria-describedby={formErrors.pathInput ? "pathInput-error" : undefined}
                      />
                    )}
                  />
                </FormField>

                {/* Error Display */}
                {(errors.submit || errors.content) && (
                  <div 
                    className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {errors.submit || errors.content}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isValid || isLoadingContent}
                    className="inline-flex items-center justify-center"
                    aria-describedby={isLoadingContent ? "view-latest-loading" : undefined}
                  >
                    <ArrowPathIcon 
                      className={cn(
                        "h-4 w-4 mr-2",
                        isLoadingContent && "animate-spin"
                      )} 
                      aria-hidden="true" 
                    />
                    {isLoadingContent ? 'Loading...' : 'View Latest'}
                  </Button>

                  {cache && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDeleteCache}
                      disabled={isDeletingCache}
                      className="inline-flex items-center justify-center"
                      aria-describedby={isDeletingCache ? "delete-cache-loading" : undefined}
                    >
                      <TrashIcon 
                        className={cn(
                          "h-4 w-4 mr-2",
                          isDeletingCache && "animate-pulse"
                        )} 
                        aria-hidden="true" 
                      />
                      {isDeletingCache ? 'Deleting...' : 'Delete Cache'}
                    </Button>
                  )}
                </div>

                {/* Cache Error Display */}
                {errors.cache && (
                  <div 
                    className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {errors.cache}
                    </p>
                  </div>
                )}
              </Form>

              {/* Loading announcements for screen readers */}
              {isLoadingContent && (
                <div id="view-latest-loading" className="sr-only" aria-live="polite">
                  Loading file content from storage service
                </div>
              )}
              
              {isDeletingCache && (
                <div id="delete-cache-loading" className="sr-only" aria-live="polite">
                  Deleting cache entry
                </div>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}

export default LinkService;