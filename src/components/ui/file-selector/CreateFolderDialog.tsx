/**
 * Create Folder Dialog Component
 * 
 * A standalone dialog component for creating new folders within the file selector system.
 * Provides inline form handling with React Hook Form and Zod validation, real-time folder
 * name validation, accessibility compliance, and keyboard shortcut support for improved UX.
 * 
 * @fileoverview Create folder dialog with form validation and accessibility features
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { 
  FolderPlusIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { 
  type FileApiInfo,
  type FileOperationResult,
  type FileError 
} from './types';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

/**
 * Zod schema for folder name validation
 * Enforces platform-agnostic folder naming restrictions
 */
const createFolderSchema = z.object({
  folderName: z
    .string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name must be less than 255 characters')
    .regex(
      /^[^<>:"/\\|?*\x00-\x1f]+$/,
      'Folder name contains invalid characters (< > : " / \\ | ? *)'
    )
    .regex(
      /^(?!(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$))/i,
      'Folder name cannot be a reserved system name'
    )
    .regex(
      /^(?!\s).*(?<!\s)$/,
      'Folder name cannot start or end with spaces'
    )
    .regex(
      /^(?!\.).*(?<!\.)$/,
      'Folder name cannot start or end with periods'
    )
    .refine(
      (name) => !name.includes('..'),
      'Folder name cannot contain consecutive periods'
    )
    .refine(
      (name) => name.trim() === name,
      'Folder name cannot have leading or trailing whitespace'
    ),
});

type CreateFolderFormData = z.infer<typeof createFolderSchema>;

// =============================================================================
// COMPONENT PROPS AND INTERFACES
// =============================================================================

export interface CreateFolderDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Dialog close callback */
  onClose: () => void;
  /** Folder creation success callback */
  onFolderCreated?: (folderPath: string) => void;
  /** Current directory path where folder will be created */
  currentPath?: string;
  /** File service information */
  fileService?: FileApiInfo;
  /** Function to check if folder name already exists */
  checkFolderExists?: (folderName: string, path: string) => Promise<boolean>;
  /** Function to create the folder */
  createFolder?: (serviceName: string, path: string, name: string) => Promise<FileOperationResult>;
  /** Dialog title override */
  title?: string;
  /** Loading state from parent */
  loading?: boolean;
  /** Error state from parent */
  error?: string | null;
  /** Custom validation rules */
  customValidation?: (name: string) => string | undefined;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CreateFolderDialog({
  open,
  onClose,
  onFolderCreated,
  currentPath = '',
  fileService,
  checkFolderExists,
  createFolder,
  title = 'Create New Folder',
  loading: externalLoading = false,
  error: externalError = null,
  customValidation,
}: CreateFolderDialogProps) {
  // Refs for focus management
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Form state management with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
    clearErrors,
    reset,
    watch,
    setValue,
  } = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      folderName: '',
    },
  });

  // Watch folder name for real-time validation
  const folderName = watch('folderName');

  // =============================================================================
  // REAL-TIME VALIDATION
  // =============================================================================

  /**
   * Performs real-time validation for folder name conflicts and restrictions
   */
  const validateFolderNameAsync = useCallback(
    async (name: string) => {
      if (!name.trim() || !fileService || !checkFolderExists) {
        return;
      }

      try {
        // Clear previous async validation errors
        clearErrors('folderName');

        // Custom validation if provided
        if (customValidation) {
          const customError = customValidation(name);
          if (customError) {
            setError('folderName', {
              type: 'custom',
              message: customError,
            });
            return;
          }
        }

        // Check for folder name conflicts
        const exists = await checkFolderExists(name, currentPath);
        if (exists) {
          setError('folderName', {
            type: 'conflict',
            message: 'A folder with this name already exists in the current directory',
          });
        }
      } catch (error) {
        console.error('Error validating folder name:', error);
        setError('folderName', {
          type: 'validation',
          message: 'Unable to validate folder name. Please try again.',
        });
      }
    },
    [fileService, checkFolderExists, currentPath, customValidation, setError, clearErrors]
  );

  // Debounced real-time validation effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (folderName && folderName.length > 0) {
        validateFolderNameAsync(folderName);
      }
    }, 300); // 300ms debounce for optimal UX

    return () => clearTimeout(timeoutId);
  }, [folderName, validateFolderNameAsync]);

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================

  /**
   * Handles form submission and folder creation
   */
  const onSubmit: SubmitHandler<CreateFolderFormData> = async (data) => {
    if (!fileService || !createFolder) {
      setError('folderName', {
        type: 'system',
        message: 'File service not available. Please try again.',
      });
      return;
    }

    try {
      // Final validation check before creation
      if (checkFolderExists) {
        const exists = await checkFolderExists(data.folderName, currentPath);
        if (exists) {
          setError('folderName', {
            type: 'conflict',
            message: 'A folder with this name already exists',
          });
          return;
        }
      }

      // Create the folder
      const result = await createFolder(fileService.name, currentPath, data.folderName);

      if (result.success) {
        // Success - notify parent and close
        const newFolderPath = currentPath 
          ? `${currentPath}/${data.folderName}`
          : data.folderName;
        
        onFolderCreated?.(newFolderPath);
        reset(); // Clear form
        onClose();
      } else {
        // Handle creation error
        setError('folderName', {
          type: 'creation',
          message: result.error || 'Failed to create folder. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('folderName', {
        type: 'creation',
        message: 'An unexpected error occurred while creating the folder.',
      });
    }
  };

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handles dialog close with cleanup
   */
  const handleClose = useCallback(() => {
    reset(); // Clear form state
    clearErrors(); // Clear any errors
    onClose();
  }, [reset, clearErrors, onClose]);

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Escape key - close dialog
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      // Ctrl/Cmd + Enter - submit form if valid
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (isValid && !isSubmitting) {
          handleSubmit(onSubmit)();
        }
        return;
      }

      // Enter key in input - submit form
      if (event.key === 'Enter' && event.target === initialFocusRef.current) {
        event.preventDefault();
        if (isValid && !isSubmitting) {
          handleSubmit(onSubmit)();
        }
        return;
      }
    },
    [handleClose, isValid, isSubmitting, handleSubmit, onSubmit]
  );

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Focus management when dialog opens
  useEffect(() => {
    if (open && initialFocusRef.current) {
      // Slight delay to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset();
      clearErrors();
    }
  }, [open, reset, clearErrors]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isLoading = isSubmitting || externalLoading;
  const hasError = !!errors.folderName || !!externalError;
  const errorMessage = errors.folderName?.message || externalError;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="relative z-50"
      initialFocus={initialFocusRef}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-gray-900/10 dark:bg-gray-900 dark:ring-gray-100/10"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                <FolderPlusIcon 
                  className="h-5 w-5 text-primary-600 dark:text-primary-400" 
                  aria-hidden="true"
                />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close dialog"
              ref={cancelButtonRef}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-4">
              {/* Current path display */}
              {currentPath && (
                <div className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Location:</span> /{currentPath}
                  </p>
                </div>
              )}

              {/* Folder name input */}
              <div className="space-y-2">
                <label
                  htmlFor="folderName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Folder Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <Input
                  id="folderName"
                  type="text"
                  placeholder="Enter folder name"
                  autoComplete="off"
                  aria-describedby={hasError ? 'folder-name-error' : 'folder-name-help'}
                  aria-invalid={hasError}
                  className={`w-full ${
                    hasError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  ref={initialFocusRef}
                  {...register('folderName')}
                />
                
                {/* Help text */}
                {!hasError && (
                  <p id="folder-name-help" className="text-xs text-gray-500 dark:text-gray-400">
                    Use keyboard shortcuts: Enter or Ctrl+Enter to create, Escape to cancel
                  </p>
                )}

                {/* Error message */}
                {hasError && (
                  <div
                    id="folder-name-error"
                    className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                    aria-live="polite"
                  >
                    <ExclamationTriangleIcon 
                      className="mt-0.5 h-4 w-4 flex-shrink-0" 
                      aria-hidden="true"
                    />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success indicator for valid names */}
                {!hasError && folderName && folderName.length > 0 && isValid && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <CheckIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Folder name is valid</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="min-w-[80px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || hasError || isLoading}
                loading={isLoading}
                className="min-w-[80px]"
              >
                {isLoading ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CreateFolderDialog;
export type { CreateFolderDialogProps, CreateFolderFormData };