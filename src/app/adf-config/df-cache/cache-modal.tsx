'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { useCacheOperations } from '@/hooks/use-cache-operations';
import { cacheFlushSchema } from '@/lib/validations/cache';
import { cn } from '@/lib/utils';
import { RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { z } from 'zod';

/**
 * Cache flush form data interface derived from Zod schema
 */
type CacheFlushFormData = z.infer<typeof cacheFlushSchema>;

/**
 * Cache item interface matching backend CacheRow type
 */
interface CacheItem {
  name: string;
  label: string;
}

/**
 * Props for the CacheModal component
 */
interface CacheModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Cache item to flush */
  cacheItem: CacheItem | null;
  /** Optional callback when cache is successfully flushed */
  onSuccess?: () => void;
}

/**
 * Cache Modal Component
 * 
 * React modal component for cache flush confirmation dialogs, implementing 
 * Headless UI dialog patterns with Tailwind CSS styling. Provides user 
 * confirmation interface for cache clearing operations with loading states, 
 * error handling, and accessibility features including focus management 
 * and screen reader support.
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function CacheModal({ 
  isOpen, 
  onClose, 
  cacheItem, 
  onSuccess 
}: CacheModalProps) {
  // Form management with React Hook Form and Zod validation
  const form = useForm<CacheFlushFormData>({
    resolver: zodResolver(cacheFlushSchema),
    defaultValues: {
      cacheType: 'service',
      confirmed: false
    }
  });

  // Cache operations hook for mutations
  const { flushCache, isLoading, error, isSuccess } = useCacheOperations();

  // Local state for UI feedback
  const [showSuccess, setShowSuccess] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState('');

  // Refs for focus management
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Reset form and state when modal opens/closes
  useEffect(() => {
    if (isOpen && cacheItem) {
      form.reset({
        cacheType: 'service',
        confirmed: false
      });
      setShowSuccess(false);
      setAnnounceMessage('');
    }
  }, [isOpen, cacheItem, form]);

  // Handle successful cache flush
  useEffect(() => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
      setAnnounceMessage(`${cacheItem?.label || 'Cache'} has been successfully flushed`);
      
      // Auto-close modal after success
      const timer = setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, showSuccess, cacheItem?.label, onSuccess, onClose]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!cacheItem || !data.confirmed) {
      form.setError('confirmed', {
        message: 'Please confirm that you want to flush this cache'
      });
      return;
    }

    try {
      await flushCache(cacheItem.name);
      setAnnounceMessage(`Flushing ${cacheItem.label} cache...`);
    } catch (error) {
      console.error('Cache flush error:', error);
      setAnnounceMessage(`Error flushing ${cacheItem.label} cache`);
    }
  });

  // Handle modal close with cleanup
  const handleClose = () => {
    if (isLoading) {
      return; // Prevent closing during operation
    }
    
    form.reset();
    setShowSuccess(false);
    setAnnounceMessage('');
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !isLoading) {
      handleClose();
    } else if (event.key === 'Tab') {
      // Ensure focus stays within modal
      const focusableElements = event.currentTarget.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  if (!cacheItem) {
    return null;
  }

  return (
    <>
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        className="relative z-50"
        data-testid="cache-flush-modal"
        aria-labelledby="cache-modal-title"
        aria-describedby="cache-modal-description"
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
        />

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            className={cn(
              "w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700 shadow-xl transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <RefreshCw 
                    className="h-5 w-5 text-orange-600 dark:text-orange-400" 
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <DialogTitle
                    id="cache-modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    Flush Cache
                  </DialogTitle>
                  <Description
                    id="cache-modal-description"
                    className="mt-1 text-sm text-gray-600 dark:text-gray-400"
                  >
                    Refresh {cacheItem.label} Cache
                  </Description>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className={cn(
                  "rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Close modal"
                data-testid="close-modal-button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              {/* Success state */}
              {showSuccess && (
                <div 
                  className="mb-4 flex items-center space-x-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800"
                  role="alert"
                  aria-live="polite"
                  data-testid="success-message"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Cache Flushed Successfully
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {cacheItem.label} cache has been cleared
                    </p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !showSuccess && (
                <div 
                  className="mb-4 flex items-start space-x-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800"
                  role="alert"
                  aria-live="polite"
                  data-testid="error-message"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Cache Flush Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error.message || 'An error occurred while flushing the cache'}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning message */}
              {!showSuccess && (
                <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Warning
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Flushing the cache will clear all cached data for{' '}
                        <span className="font-medium">{cacheItem.label}</span>.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation checkbox */}
              {!showSuccess && (
                <div className="mb-6">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register('confirmed')}
                      className={cn(
                        "mt-1 h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600",
                        "text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "bg-white dark:bg-gray-800"
                      )}
                      disabled={isLoading}
                      aria-describedby="confirmation-error"
                      data-testid="confirmation-checkbox"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      I understand that this will flush the{' '}
                      <span className="font-medium">{cacheItem.label}</span> cache
                      and confirm that I want to proceed.
                    </span>
                  </label>
                  {form.formState.errors.confirmed && (
                    <p 
                      id="confirmation-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400"
                      role="alert"
                      data-testid="confirmation-error"
                    >
                      {form.formState.errors.confirmed.message}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3">
                <Button
                  ref={cancelButtonRef}
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  data-testid="cancel-button"
                  aria-label="Cancel cache flush operation"
                >
                  Cancel
                </Button>
                
                {!showSuccess && (
                  <Button
                    ref={confirmButtonRef}
                    type="submit"
                    variant="destructive"
                    disabled={isLoading || !form.watch('confirmed')}
                    className="min-w-[120px]"
                    data-testid="flush-cache-button"
                    aria-label={`Flush ${cacheItem.label} cache`}
                    aria-describedby={error ? 'error-message' : undefined}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw 
                          className="h-4 w-4 animate-spin" 
                          aria-hidden="true"
                        />
                        <span>Flushing...</span>
                      </div>
                    ) : (
                      'Flush Cache'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

/**
 * Hook to manage cache modal state
 * 
 * Provides a convenient way to manage the cache modal's open/close state
 * and selected cache item.
 * 
 * @returns Object with modal state and control functions
 */
export function useCacheModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheItem, setCacheItem] = useState<CacheItem | null>(null);

  const openModal = (item: CacheItem) => {
    setCacheItem(item);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Keep cache item until modal is fully closed for animations
    setTimeout(() => setCacheItem(null), 150);
  };

  return {
    isOpen,
    cacheItem,
    openModal,
    closeModal
  };
}

export default CacheModal;