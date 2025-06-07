'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Cache Modal Component for DreamFactory Admin Interface
 * 
 * React confirmation modal component for cache flush operations with accessibility features 
 * and error handling. Implements Headless UI Dialog patterns for cache deletion confirmation,
 * displays service-specific cache information, and handles optimistic updates with rollback capabilities.
 * 
 * Converts Angular DfCacheModal functionality to modern React patterns with React Hook Form validation.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 * - Cache flush operations completing under 2 seconds per performance requirements
 * - Error states with clear recovery options per Section 4.2 Error Handling requirements
 * - Smooth and accessible modal animations per UI/UX standards
 * - Optimistic updates with rollback capabilities per Section 4.3.2 mutation workflows
 * 
 * @fileoverview Cache confirmation modal component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cache row interface defining the structure of cache entries
 * Converted from Angular CacheRow type with enhanced type safety
 */
export interface CacheRow {
  /** Unique cache identifier for API operations */
  name: string;
  /** Human-readable cache label for display */
  label: string;
  /** Cache type for categorization */
  type?: string;
  /** Cache description for user context */
  description?: string;
}

/**
 * Cache flush operation result interface
 * Provides structured response for mutation handling
 */
export interface CacheFlushResult {
  /** Success status of the operation */
  success: boolean;
  /** Response message from the server */
  message?: string;
  /** Timestamp of the operation */
  timestamp?: string;
}

/**
 * Cache modal props interface
 * Defines the component's external API
 */
export interface CacheModalProps {
  /** Modal open state */
  open: boolean;
  /** Modal close handler */
  onClose: () => void;
  /** Cache row data for the flush operation */
  cacheRow: CacheRow;
  /** Optional success callback for parent component notification */
  onSuccess?: (result: CacheFlushResult) => void;
  /** Optional error callback for parent component notification */
  onError?: (error: Error) => void;
}

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod validation schema for cache flush confirmation
 * Replaces Angular reactive forms with type-safe validation
 */
const cacheFlushSchema = z.object({
  /** Confirmation flag to prevent accidental operations */
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the cache flush operation',
  }),
  /** Cache name validation for operation safety */
  cacheName: z.string().min(1, 'Cache name is required'),
});

type CacheFlushFormData = z.infer<typeof cacheFlushSchema>;

// ============================================================================
// Cache Flush Hook
// ============================================================================

/**
 * Custom hook for cache flush operations
 * Implements React Query mutations with optimistic updates and error handling
 * Replaces Angular service calls with modern React patterns
 */
function useCacheFlush() {
  const queryClient = useQueryClient();

  return useMutation<CacheFlushResult, Error, { cacheName: string }>({
    mutationFn: async ({ cacheName }) => {
      // Simulate API call with timeout for 2-second performance requirement
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(`/api/v2/system/cache/${encodeURIComponent(cacheName)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || 
            `Failed to flush cache: ${response.status} ${response.statusText}`
          );
        }

        const result: CacheFlushResult = await response.json();
        return {
          success: true,
          message: result.message || 'Cache flushed successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Cache flush operation timed out. Please try again.');
          }
          throw error;
        }
        
        throw new Error('An unexpected error occurred while flushing the cache');
      }
    },
    
    // Optimistic update implementation
    onMutate: async ({ cacheName }) => {
      // Cancel any outgoing refetches for cache queries
      await queryClient.cancelQueries({ queryKey: ['caches'] });
      await queryClient.cancelQueries({ queryKey: ['cache', cacheName] });

      // Snapshot the previous values for rollback
      const previousCaches = queryClient.getQueryData(['caches']);
      const previousCache = queryClient.getQueryData(['cache', cacheName]);

      // Optimistically update cache status
      queryClient.setQueryData(['caches'], (old: any) => {
        if (Array.isArray(old)) {
          return old.map((cache: CacheRow) =>
            cache.name === cacheName
              ? { ...cache, status: 'flushing' }
              : cache
          );
        }
        return old;
      });

      // Return context for rollback
      return { previousCaches, previousCache, cacheName };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(['caches'], context.previousCaches);
        queryClient.setQueryData(['cache', context.cacheName], context.previousCache);
      }
    },

    // Finalize on settlement
    onSettled: (data, error, variables) => {
      // Invalidate and refetch cache queries
      queryClient.invalidateQueries({ queryKey: ['caches'] });
      queryClient.invalidateQueries({ queryKey: ['cache', variables.cacheName] });
    },
  });
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CacheModal Component
 * 
 * Implements Headless UI Dialog patterns for cache deletion confirmation with
 * comprehensive accessibility features, error handling, and performance optimizations.
 */
export function CacheModal({
  open,
  onClose,
  cacheRow,
  onSuccess,
  onError,
}: CacheModalProps) {
  // ============================================================================
  // State and Refs
  // ============================================================================

  const [isClosing, setIsClosing] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // ============================================================================
  // Form Setup
  // ============================================================================

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<CacheFlushFormData>({
    resolver: zodResolver(cacheFlushSchema),
    defaultValues: {
      confirmed: false,
      cacheName: cacheRow.name,
    },
    mode: 'onChange', // Real-time validation per requirements
  });

  const confirmed = watch('confirmed');

  // ============================================================================
  // Cache Flush Mutation
  // ============================================================================

  const cacheFlushMutation = useCacheFlush();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle form submission for cache flush operation
   * Implements comprehensive error handling with user-friendly messages
   */
  const onSubmit = async (data: CacheFlushFormData) => {
    try {
      const result = await cacheFlushMutation.mutateAsync({
        cacheName: data.cacheName,
      });

      // Notify parent component of success
      onSuccess?.(result);

      // Close modal with slight delay for user feedback
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 500);
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error occurred');
      onError?.(errorInstance);
    }
  };

  /**
   * Handle modal close with cleanup
   * Ensures proper state reset and accessibility
   */
  const handleClose = () => {
    if (cacheFlushMutation.isPending) {
      return; // Prevent closing during operation
    }

    reset();
    setIsClosing(false);
    onClose();
  };

  /**
   * Handle escape key press with conditional behavior
   * Respects loading state for better UX
   */
  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !cacheFlushMutation.isPending) {
      handleClose();
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Reset form when cache row changes
   * Ensures form state consistency
   */
  useEffect(() => {
    reset({
      confirmed: false,
      cacheName: cacheRow.name,
    });
  }, [cacheRow.name, reset]);

  /**
   * Focus management for accessibility
   * Sets initial focus to appropriate element based on state
   */
  useEffect(() => {
    if (open && !cacheFlushMutation.isPending) {
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, cacheFlushMutation.isPending]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  /**
   * Render success state with checkmark icon
   */
  const renderSuccessState = () => (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <CheckCircle className="h-12 w-12 text-success-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Cache Flushed Successfully
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        The cache "{cacheRow.label}" has been cleared.
      </p>
    </div>
  );

  /**
   * Render error state with error details and recovery options
   */
  const renderErrorState = () => (
    <Alert className="bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
      <AlertTriangle className="h-4 w-4 text-error-600 dark:text-error-400" />
      <AlertDescription className="text-error-800 dark:text-error-200">
        <strong>Failed to flush cache:</strong>{' '}
        {cacheFlushMutation.error?.message || 'An unexpected error occurred'}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cacheFlushMutation.reset()}
            className="border-error-300 text-error-700 hover:bg-error-100 dark:border-error-600 dark:text-error-300 dark:hover:bg-error-900/20"
          >
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  /**
   * Render main form content
   */
  const renderFormContent = () => (
    <div className="space-y-6">
      {/* Cache Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Cache Details
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
            <dd className="font-mono text-gray-900 dark:text-gray-100">{cacheRow.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Service:</dt>
            <dd className="text-gray-900 dark:text-gray-100">{cacheRow.label}</dd>
          </div>
          {cacheRow.description && (
            <div className="flex flex-col gap-1">
              <dt className="text-gray-600 dark:text-gray-400">Description:</dt>
              <dd className="text-gray-900 dark:text-gray-100">{cacheRow.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Warning Message */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Flushing this cache will clear all cached data for this service.
          This action cannot be undone and may temporarily impact performance until the cache rebuilds.
        </AlertDescription>
      </Alert>

      {/* Confirmation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="hidden"
          {...register('cacheName')}
        />

        {/* Confirmation Checkbox */}
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5">
            <input
              id="confirm-flush"
              type="checkbox"
              {...register('confirmed')}
              className={cn(
                'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
                'text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'dark:bg-gray-700 dark:checked:bg-primary-600 dark:checked:border-primary-600',
                'dark:focus:ring-offset-gray-900',
                errors.confirmed && 'border-error-500 focus:border-error-500 focus:ring-error-500'
              )}
              aria-describedby={errors.confirmed ? 'confirm-error' : 'confirm-description'}
              disabled={cacheFlushMutation.isPending}
            />
          </div>
          <div className="text-sm">
            <label
              htmlFor="confirm-flush"
              className="font-medium text-gray-900 dark:text-gray-100"
            >
              I understand the consequences of flushing this cache
            </label>
            <p id="confirm-description" className="text-gray-600 dark:text-gray-400 mt-1">
              Check this box to confirm you want to proceed with the cache flush operation.
            </p>
            {errors.confirmed && (
              <p
                id="confirm-error"
                className="text-error-600 dark:text-error-400 mt-1"
                role="alert"
                aria-live="polite"
              >
                {errors.confirmed.message}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={cacheFlushMutation.isPending}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            ref={confirmButtonRef}
            type="submit"
            variant="destructive"
            disabled={!confirmed || cacheFlushMutation.isPending}
            loading={cacheFlushMutation.isPending}
            loadingText="Flushing cache..."
            className="min-w-[120px]"
            aria-describedby="flush-button-description"
          >
            {cacheFlushMutation.isPending ? 'Flushing...' : 'Flush Cache'}
          </Button>
        </div>

        <p id="flush-button-description" className="sr-only">
          This will permanently clear all cached data for {cacheRow.label}
        </p>
      </form>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="relative z-50"
      aria-labelledby="cache-modal-title"
      aria-describedby="cache-modal-description"
    >
      <DialogContent
        className={cn(
          'sm:max-w-lg w-full mx-auto',
          // Enhanced focus management
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',
          // Loading state styling
          cacheFlushMutation.isPending && 'cursor-wait',
          // Transition states
          isClosing && 'transition-opacity duration-300 opacity-0'
        )}
        disableBackdropClose={cacheFlushMutation.isPending}
        disableEscapeKeyDown={cacheFlushMutation.isPending}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && cacheFlushMutation.isPending) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle id="cache-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {cacheFlushMutation.isSuccess
              ? 'Cache Flush Complete'
              : `Flush Cache: ${cacheRow.label}`}
          </DialogTitle>
          <DialogDescription id="cache-modal-description" className="text-sm text-gray-600 dark:text-gray-400">
            {cacheFlushMutation.isSuccess
              ? 'The cache operation has completed successfully.'
              : 'Confirm the cache flush operation for the selected service.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {cacheFlushMutation.isSuccess && renderSuccessState()}
          {cacheFlushMutation.isError && renderErrorState()}
          {!cacheFlushMutation.isSuccess && !cacheFlushMutation.isError && renderFormContent()}
        </div>

        {/* Loading overlay for pending operations */}
        {cacheFlushMutation.isPending && (
          <div
            className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg"
            aria-live="polite"
            aria-label="Flushing cache, please wait"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Flushing cache...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This may take a few seconds
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default CacheModal;