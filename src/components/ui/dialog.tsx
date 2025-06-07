/**
 * Dialog Component
 * 
 * A modal dialog component built with Headless UI for accessibility compliance.
 * Supports customizable content, actions, and responsive layouts.
 */

'use client';

import React, { Fragment } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Dialog title
   */
  title?: string;
  /**
   * Dialog description
   */
  description?: string;
  /**
   * Dialog content
   */
  children: React.ReactNode;
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean;
  /**
   * Custom class name for the dialog panel
   */
  className?: string;
  /**
   * Size of the dialog
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Whether the dialog can be closed by clicking outside
   */
  closeOnOverlayClick?: boolean;
}

export interface DialogActionsProps {
  /**
   * Actions content
   */
  children: React.ReactNode;
  /**
   * Custom class name
   */
  className?: string;
}

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Callback when confirmed
   */
  onConfirm: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog message
   */
  message: string;
  /**
   * Confirm button text
   */
  confirmText?: string;
  /**
   * Cancel button text
   */
  cancelText?: string;
  /**
   * Whether the confirm action is destructive
   */
  destructive?: boolean;
  /**
   * Whether the confirm action is loading
   */
  loading?: boolean;
}

const dialogSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

/**
 * Dialog Actions Container
 */
export const DialogActions: React.FC<DialogActionsProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn('flex justify-end space-x-2 pt-4', className)}>
    {children}
  </div>
);

/**
 * Main Dialog Component
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
  className,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog 
        as="div" 
        className="relative z-50" 
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Dialog positioning */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel 
                className={cn(
                  'w-full transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all',
                  'dark:bg-gray-800',
                  dialogSizes[size],
                  className
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title && (
                      <HeadlessDialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        {title}
                      </HeadlessDialog.Title>
                    )}
                    {description && (
                      <HeadlessDialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </HeadlessDialog.Description>
                    )}
                  </div>
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-500 dark:hover:text-gray-400"
                      onClick={onClose}
                      aria-label="Close dialog"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className={cn('mt-4', title && 'mt-6')}>
                  {children}
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

/**
 * Confirmation Dialog Component
 * 
 * A pre-configured dialog for confirmation actions with consistent styling.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
    >
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {message}
      </div>
      
      <DialogActions className="mt-6">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Dialog;