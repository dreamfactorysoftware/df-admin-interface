/**
 * React folder creation dialog component for the DreamFactory Admin Interface.
 * 
 * Transforms Angular Material dialog component to Headless UI modal with React Hook Form
 * and Zod validation per React/Next.js Integration Requirements. Maintains the same API 
 * integration pattern as the Angular version while providing enhanced performance and 
 * modern React patterns.
 * 
 * Key Features:
 * - Headless UI 2.0+ modal with WCAG 2.1 AA accessibility compliance
 * - React Hook Form 7.52+ with Zod schema validation
 * - Real-time validation under 100ms performance target
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 * - API compatibility with existing DreamFactory Core backend
 * 
 * @fileoverview Folder creation dialog component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@/components/ui/dialog/dialog';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { apiPost } from '@/lib/api-client';
import type { ApiResponse, KeyValuePair } from '@/types/api';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Folder creation form data schema
 * Validates folder name input with comprehensive rules
 */
const folderFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name must be less than 255 characters')
    .regex(
      /^[^<>:"/\\|?*\x00-\x1f]*$/,
      'Folder name contains invalid characters'
    )
    .regex(
      /^(?!.*\.$)/,
      'Folder name cannot end with a period'
    )
    .regex(
      /^(?!\s+$)/,
      'Folder name cannot contain only whitespace'
    )
    .transform((val) => val.trim()),
});

/**
 * Inferred TypeScript type from Zod schema
 */
type FolderFormData = z.infer<typeof folderFormSchema>;

/**
 * Props interface for the FolderDialog component
 */
export interface FolderDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Callback function when dialog should close
   * @param reason - The reason for closing (backdrop, escape, close-button, api)
   * @param success - Whether folder creation was successful
   */
  onClose: (reason?: 'backdrop' | 'escape' | 'close-button' | 'api', success?: boolean) => void;
  
  /**
   * API route/endpoint for folder creation
   * Example: '/api/v2/files/service-name'
   */
  route: string;
  
  /**
   * Optional callback for successful folder creation
   * @param folderName - The name of the created folder
   */
  onSuccess?: (folderName: string) => void;
  
  /**
   * Optional callback for folder creation errors
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
  
  /**
   * Custom success message for screen readers
   * Defaults to translated success message
   */
  successMessage?: string;
  
  /**
   * Custom error message prefix
   * Defaults to translated error message
   */
  errorMessage?: string;
  
  /**
   * Disable backdrop click to close
   * @default false
   */
  disableBackdropClose?: boolean;
  
  /**
   * Custom CSS class for the dialog
   */
  className?: string;
  
  /**
   * Test ID for automated testing
   */
  'data-testid'?: string;
}

/**
 * API request options for folder creation
 */
interface CreateFolderOptions {
  folderName: string;
  route: string;
  signal?: AbortSignal;
}

// ============================================================================
// API Integration Functions
// ============================================================================

/**
 * Creates a new folder using the DreamFactory API
 * Maintains compatibility with existing Angular service patterns
 * 
 * @param options - Folder creation options
 * @returns Promise resolving to API response
 */
async function createFolder({
  folderName,
  route,
  signal,
}: CreateFolderOptions): Promise<ApiResponse> {
  // Prepare additional headers with X-Folder-Name for backend compatibility
  const additionalHeaders: KeyValuePair[] = [
    {
      key: 'X-Folder-Name',
      value: folderName,
    },
  ];

  try {
    // Make API request using the same pattern as Angular DfBaseCrudService
    const response = await apiPost<ApiResponse>(
      route,
      { resource: [] }, // Empty resource array as per Angular implementation
      {
        additionalHeaders,
        snackbarSuccess: 'files.alerts.createFolderSuccess',
        signal,
      }
    );

    return response;
  } catch (error) {
    // Transform error for consistent handling
    const apiError = error instanceof Error 
      ? error 
      : new Error('Failed to create folder');
    
    throw apiError;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FolderDialog component for creating new folders in the file management system.
 * 
 * Implements React Hook Form with Zod validation for real-time input validation
 * under 100ms performance target. Uses Headless UI modal components for accessible
 * dialog implementation per Section 7.1.1 UI component libraries.
 * 
 * Maintains API compatibility with existing Angular service patterns while providing
 * enhanced performance through React Query caching and modern React patterns.
 * 
 * @example
 * ```tsx
 * const [dialogOpen, setDialogOpen] = useState(false);
 * 
 * <FolderDialog
 *   open={dialogOpen}
 *   onClose={(reason, success) => {
 *     setDialogOpen(false);
 *     if (success) {
 *       // Refresh file list
 *       refetch();
 *     }
 *   }}
 *   route="/api/v2/files/local"
 *   onSuccess={(folderName) => {
 *     console.log(`Created folder: ${folderName}`);
 *   }}
 * />
 * ```
 */
export function FolderDialog({
  open,
  onClose,
  route,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  disableBackdropClose = false,
  className,
  'data-testid': dataTestId = 'folder-dialog',
}: FolderDialogProps) {
  const { t } = useTranslation('files');

  // ============================================================================
  // Form Management with React Hook Form + Zod
  // ============================================================================

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm<FolderFormData>({
    resolver: zodResolver(folderFormSchema),
    mode: 'onChange', // Real-time validation for under 100ms response
    defaultValues: {
      name: '',
    },
  });

  // Watch form values for real-time validation feedback
  const nameValue = watch('name');

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles dialog close with optional success indicator
   */
  const handleClose = useCallback((reason?: 'backdrop' | 'escape' | 'close-button' | 'api', success = false) => {
    // Reset form state when closing
    reset();
    clearErrors();
    
    // Call parent close handler
    onClose(reason, success);
  }, [onClose, reset, clearErrors]);

  /**
   * Handles form submission with folder creation API call
   */
  const handleFormSubmit = useCallback(async (data: FolderFormData) => {
    try {
      // Create abort controller for request cancellation
      const abortController = new AbortController();
      
      // Make API request to create folder
      await createFolder({
        folderName: data.name,
        route,
        signal: abortController.signal,
      });

      // Announce success to screen readers
      const announcement = successMessage || t('alerts.createFolderSuccess');
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
      liveRegion.textContent = announcement;
      
      document.body.appendChild(liveRegion);
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);

      // Call success callback
      onSuccess?.(data.name);

      // Close dialog with success indicator
      handleClose('api', true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create folder';
      
      // Set form error for display
      setError('name', {
        type: 'api',
        message: errorMessage || t('alerts.createFolderError'),
      });

      // Announce error to screen readers
      const announcement = `${errorMessage || t('alerts.createFolderError')}: ${errorMsg}`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
      liveRegion.textContent = announcement;
      
      document.body.appendChild(liveRegion);
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);

      // Call error callback
      onError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  }, [route, onSuccess, onError, successMessage, errorMessage, handleClose, setError, t]);

  /**
   * Handles backdrop click events
   */
  const handleBackdropClose = useCallback(() => {
    if (!disableBackdropClose) {
      handleClose('backdrop');
    }
  }, [disableBackdropClose, handleClose]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Reset form when dialog opens
   */
  useEffect(() => {
    if (open) {
      reset();
      clearErrors();
    }
  }, [open, reset, clearErrors]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog
      open={open}
      onClose={handleBackdropClose}
      variant="modal"
      size="md"
      className={className}
      disableBackdropClose={disableBackdropClose}
      data-testid={dataTestId}
      aria-labelledby="folder-dialog-title"
      aria-describedby="folder-dialog-description"
    >
      {/* Dialog Header */}
      <Dialog.Header
        showCloseButton={true}
        onClose={() => handleClose('close-button')}
        data-testid={`${dataTestId}-header`}
      >
        <Dialog.Title
          id="folder-dialog-title"
          size="lg"
          className="flex items-center gap-2 text-gray-900 dark:text-gray-100"
        >
          <FolderPlus 
            className="h-5 w-5 text-primary-600 dark:text-primary-400" 
            aria-hidden="true" 
          />
          {t('createFolder')}
        </Dialog.Title>
      </Dialog.Header>

      {/* Dialog Content */}
      <Dialog.Content
        className="px-6 py-4"
        data-testid={`${dataTestId}-content`}
      >
        <Dialog.Description
          id="folder-dialog-description"
          className="mb-4 text-sm text-gray-600 dark:text-gray-400"
        >
          {t('createFolderDescription')}
        </Dialog.Description>

        {/* Folder Creation Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
          noValidate
          data-testid={`${dataTestId}-form`}
        >
          <div className="space-y-2">
            <label
              htmlFor="folder-name-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('folderName')}
              <span className="text-error-500 ml-1" aria-label="required">*</span>
            </label>
            
            <Input
              id="folder-name-input"
              type="text"
              placeholder={t('folderNamePlaceholder', 'Enter folder name')}
              autoComplete="off"
              autoFocus
              disabled={isSubmitting}
              error={errors.name?.message}
              state={errors.name ? 'error' : 'default'}
              className="w-full"
              data-testid={`${dataTestId}-name-input`}
              aria-describedby={errors.name ? 'folder-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            
            {/* Real-time character count for UX enhancement */}
            {nameValue && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {nameValue.length}/255 characters
              </div>
            )}
          </div>
        </form>
      </Dialog.Content>

      {/* Dialog Footer */}
      <Dialog.Footer
        showSeparator={true}
        align="right"
        className="gap-3"
        data-testid={`${dataTestId}-footer`}
      >
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => handleClose('close-button')}
          disabled={isSubmitting}
          data-testid={`${dataTestId}-cancel-button`}
        >
          {t('cancel', 'Cancel')}
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit(handleFormSubmit)}
          loadingText={t('creating', 'Creating folder...')}
          icon={isSubmitting ? <Loader2 className="h-4 w-4" /> : undefined}
          data-testid={`${dataTestId}-create-button`}
          aria-describedby={errors.name ? 'folder-name-error' : undefined}
        >
          {isSubmitting ? t('creating', 'Creating...') : t('create', 'Create')}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default FolderDialog;

// ============================================================================
// Additional Exports for Testing and Type Safety
// ============================================================================

export type { FolderDialogProps, FolderFormData };
export { folderFormSchema };