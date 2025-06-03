/**
 * Folder Dialog Component
 * 
 * React dialog component for creating new folders in the file management system.
 * Built with Headless UI modal, React Hook Form with Zod validation, and Tailwind CSS styling.
 * Maintains the same API integration pattern as the Angular version while providing
 * enhanced performance and modern React patterns.
 * 
 * Features:
 * - Headless UI 2.0+ modal for accessible dialog implementation
 * - React Hook Form 7.52+ with Zod schema validation
 * - Real-time validation under 100ms performance standards
 * - Tailwind CSS 4.1+ styling with dark mode support
 * - React context-based service integration
 * - Maintains API compatibility with DfBaseCrudService pattern
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input, InputGroup } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * File operation response interface
 */
interface FileOperationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Folder dialog props interface
 */
interface FolderDialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Function to call when dialog should close */
  onClose: () => void;
  /** Function to call when folder is successfully created */
  onSuccess?: (folderName: string) => void;
  /** API route for the current file service endpoint */
  route: string;
  /** Optional dialog title override */
  title?: string;
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * Form data interface for folder creation
 */
interface FolderFormData {
  name: string;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for folder name validation
 * Implements real-time validation with comprehensive folder name rules
 */
const folderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name must be 255 characters or less')
    .regex(
      /^[^<>:"/\\|?*\x00-\x1f]+$/,
      'Folder name contains invalid characters'
    )
    .regex(
      /^(?!\.+$)/,
      'Folder name cannot consist only of dots'
    )
    .regex(
      /^(?!\s+$)/,
      'Folder name cannot consist only of spaces'
    )
    .trim()
    .refine(
      (value) => !['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'].includes(value.toUpperCase()),
      'Folder name cannot be a reserved system name'
    ),
});

// ============================================================================
// FOLDER DIALOG COMPONENT
// ============================================================================

/**
 * FolderDialog Component
 * 
 * A comprehensive folder creation dialog implementing React Hook Form with Zod validation,
 * Headless UI modal for accessibility, and Tailwind CSS for styling. Maintains compatibility
 * with the existing DreamFactory API while providing enhanced user experience and performance.
 */
export function FolderDialog({
  isOpen,
  onClose,
  onSuccess,
  route,
  title = 'Create Folder',
  className,
}: FolderDialogProps): JSX.Element {
  // ============================================================================
  // FORM SETUP
  // ============================================================================

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      name: '',
    },
  });

  // Watch the folder name for real-time validation feedback
  const folderName = watch('name');

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle form submission with API call
   * Maintains compatibility with DfBaseCrudService pattern using X-Folder-Name header
   */
  const onSubmit = useCallback(
    async (data: FolderFormData): Promise<void> => {
      try {
        // Make API call with X-Folder-Name header to maintain compatibility
        const response = await apiClient.post(
          route,
          {}, // Empty body as per Angular implementation
          {
            headers: {
              'X-Folder-Name': data.name.trim(),
              'Content-Type': 'application/json',
            },
          }
        );

        // Handle successful response
        if (response) {
          // Reset form state
          reset();
          
          // Call success callback with folder name
          onSuccess?.(data.name.trim());
          
          // Close dialog
          onClose();
        }
      } catch (error) {
        // Error handling - in a real implementation, this would integrate
        // with a toast/notification system
        console.error('Failed to create folder:', error);
        
        // For now, we'll show a browser alert
        // In production, this would use a proper notification system
        alert('Failed to create folder. Please try again.');
      }
    },
    [route, onSuccess, onClose, reset]
  );

  /**
   * Handle dialog close with form reset
   */
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  /**
   * Handle escape key press
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50"
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={cn(
            'mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl',
            'border border-gray-200 dark:border-gray-700',
            'transform transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            className
          )}
        >
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FolderPlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Dialog.Title>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'rounded-md p-2 text-gray-400 hover:text-gray-500',
                'dark:text-gray-500 dark:hover:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'transition-colors duration-200'
              )}
              aria-label="Close dialog"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Dialog Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <InputGroup
              label="Folder Name"
              description="Enter a name for the new folder"
              error={errors.name?.message}
              required
            >
              <Input
                {...register('name')}
                type="text"
                placeholder="Enter folder name..."
                autoFocus
                error={!!errors.name}
                className={cn(
                  'transition-all duration-200',
                  folderName && !errors.name && 'border-green-500 focus-visible:ring-green-500'
                )}
                leftIcon={
                  <FolderPlusIcon className="h-4 w-4 text-gray-400" />
                }
              />
            </InputGroup>

            {/* Validation status indicator */}
            {folderName && (
              <div className="flex items-center space-x-2 text-sm">
                {errors.name ? (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.name.message}
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Valid folder name
                  </div>
                )}
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Folder
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ============================================================================
// EXPORT HOOK FOR USAGE
// ============================================================================

/**
 * Custom hook for managing folder dialog state
 * Provides a convenient interface for opening and closing the dialog
 */
export function useFolderDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    openDialog,
    closeDialog,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FolderDialog;
export type { FolderDialogProps, FolderFormData, FileOperationResponse };