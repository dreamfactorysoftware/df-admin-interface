/**
 * Email Template Actions Component
 * 
 * Row action components for email template table operations including view, edit, 
 * delete, and duplicate actions. Implements confirmation dialogs, optimistic updates, 
 * and error handling with React patterns.
 * 
 * Replaces Angular Material dialog actions with React dialog components per Section 7.1.
 * Integrates React Query mutations for CRUD operations per Section 4.3.2.
 */

'use client';

import React, { useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { EllipsisHorizontalIcon, EyeIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { EmailTemplate } from '@/types/email-templates';
import { cn } from '@/lib/utils';

/**
 * Props for EmailTemplateActions component
 */
interface EmailTemplateActionsProps {
  /** Email template data for action operations */
  template: EmailTemplate;
  /** Callback fired when view action is triggered */
  onView?: (template: EmailTemplate) => void;
  /** Optional CSS classes */
  className?: string;
}

/**
 * Individual action button props for consistent styling and behavior
 */
interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

/**
 * Reusable action button component with consistent styling
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors',
      'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-gray-700 dark:focus:bg-gray-700',
      variant === 'destructive' && 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 dark:focus:bg-red-900/10',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
    aria-label={label}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

/**
 * Confirmation dialog component for destructive actions
 */
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>

                <div className="mt-4 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : confirmLabel}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

/**
 * Toast notification hook for user feedback
 * Implements error handling with toast notifications per Section 4.2
 */
const useToast = () => {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = cn(
      'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all',
      'animate-fade-in',
      {
        'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/20': type === 'success',
        'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20': type === 'error',
        'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20': type === 'info',
      }
    );
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }, []);

  return { showToast };
};

/**
 * EmailTemplateActions Component
 * 
 * Provides action menu for email template operations with confirmation dialogs,
 * optimistic updates, and comprehensive error handling. Implements React patterns
 * with Headless UI components per React/Next.js Integration Requirements.
 * 
 * @param {EmailTemplateActionsProps} props - Component props
 * @returns {JSX.Element} Email template actions dropdown menu
 */
export const EmailTemplateActions: React.FC<EmailTemplateActionsProps> = ({
  template,
  onView,
  className,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    deleteEmailTemplate,
    createEmailTemplate,
    isDeleting,
    isCreating,
  } = useEmailTemplates();

  // Dialog state management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  /**
   * Handle view action - either callback or navigate to detail page
   */
  const handleView = useCallback(() => {
    if (onView) {
      onView(template);
    } else {
      router.push(`/system-settings/email-templates/${template.id}`);
    }
  }, [template, onView, router]);

  /**
   * Handle edit action - navigate to edit page
   */
  const handleEdit = useCallback(() => {
    router.push(`/system-settings/email-templates/${template.id}/edit`);
  }, [template.id, router]);

  /**
   * Handle delete action with confirmation and optimistic updates
   * Implements error handling per Section 4.2
   */
  const handleDelete = useCallback(async () => {
    try {
      await deleteEmailTemplate(template.id);
      showToast(`Email template "${template.name}" deleted successfully`, 'success');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete email template error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete email template. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [template.id, template.name, deleteEmailTemplate, showToast]);

  /**
   * Handle duplicate action - create new template with copied data
   * Implements optimistic updates per Section 4.3.2
   */
  const handleDuplicate = useCallback(async () => {
    try {
      // Create payload without ID and timestamps, add "Copy" suffix to name
      const duplicatePayload = {
        name: `${template.name} - Copy`,
        description: template.description,
        to: template.to,
        cc: template.cc,
        bcc: template.bcc,
        subject: template.subject,
        attachment: template.attachment,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml,
        fromName: template.fromName,
        fromEmail: template.fromEmail,
        replyToName: template.replyToName,
        replyToEmail: template.replyToEmail,
        defaults: template.defaults,
      };

      await createEmailTemplate(duplicatePayload);
      showToast(`Email template duplicated as "${duplicatePayload.name}"`, 'success');
      setShowDuplicateDialog(false);
    } catch (error) {
      console.error('Duplicate email template error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to duplicate email template. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [template, createEmailTemplate, showToast]);

  /**
   * Close delete confirmation dialog
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  /**
   * Close duplicate confirmation dialog
   */
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
  }, []);

  return (
    <>
      <Menu as="div" className={cn("relative inline-block text-left", className)}>
        <div>
          <Menu.Button
            as={Button}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${template.name}`}
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:divide-gray-700 dark:bg-gray-800 dark:ring-white/5">
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <ActionButton
                    icon={EyeIcon}
                    label="View Details"
                    onClick={handleView}
                  />
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <ActionButton
                    icon={PencilIcon}
                    label="Edit Template"
                    onClick={handleEdit}
                  />
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <ActionButton
                    icon={DocumentDuplicateIcon}
                    label="Duplicate Template"
                    onClick={() => setShowDuplicateDialog(true)}
                    disabled={isCreating}
                  />
                )}
              </Menu.Item>
            </div>

            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <ActionButton
                    icon={TrashIcon}
                    label="Delete Template"
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    disabled={isDeleting}
                  />
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleDelete}
        title="Delete Email Template"
        message={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Duplicate Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDuplicateDialog}
        onClose={handleCancelDuplicate}
        onConfirm={handleDuplicate}
        title="Duplicate Email Template"
        message={`This will create a copy of "${template.name}" with " - Copy" added to the name.`}
        confirmLabel="Duplicate"
        isLoading={isCreating}
      />
    </>
  );
};

/**
 * Bulk Actions Component for handling multiple email template operations
 */
interface EmailTemplateBulkActionsProps {
  /** Selected template IDs */
  selectedIds: number[];
  /** Templates data for bulk operations */
  templates: EmailTemplate[];
  /** Callback when selection is cleared */
  onClearSelection: () => void;
  /** Optional CSS classes */
  className?: string;
}

/**
 * EmailTemplateBulkActions Component
 * 
 * Provides bulk action operations for multiple email template selection.
 * Implements confirmation dialogs and error handling for bulk operations.
 */
export const EmailTemplateBulkActions: React.FC<EmailTemplateBulkActionsProps> = ({
  selectedIds,
  templates,
  onClearSelection,
  className,
}) => {
  const { showToast } = useToast();
  const { bulkDeleteEmailTemplates, isBulkDeleting } = useEmailTemplates();
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Get selected template names for confirmation dialog
  const selectedTemplates = templates.filter(template => selectedIds.includes(template.id));
  const selectedNames = selectedTemplates.map(template => template.name).join(', ');

  /**
   * Handle bulk delete operation with confirmation
   */
  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteEmailTemplates(selectedIds);
      showToast(`${selectedIds.length} email templates deleted successfully`, 'success');
      setShowBulkDeleteDialog(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete email templates error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete email templates. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [selectedIds, bulkDeleteEmailTemplates, showToast, onClearSelection]);

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {selectedIds.length} template{selectedIds.length !== 1 ? 's' : ''} selected
        </span>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? 'Deleting...' : `Delete ${selectedIds.length}`}
          </Button>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.length} Email Templates`}
        message={`Are you sure you want to delete the following templates? This action cannot be undone.\n\n${selectedNames}`}
        confirmLabel={`Delete ${selectedIds.length} Templates`}
        isLoading={isBulkDeleting}
      />
    </>
  );
};

export default EmailTemplateActions;