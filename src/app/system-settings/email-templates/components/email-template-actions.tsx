'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Edit3, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { EmailTemplate } from '@/types/email-templates';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { apiClient } from '@/lib/api-client';

interface EmailTemplateActionsProps {
  template: EmailTemplate;
  onView?: (template: EmailTemplate) => void;
  onEdit?: (template: EmailTemplate) => void;
  onDuplicate?: (template: EmailTemplate) => void;
  onDelete?: (template: EmailTemplate) => void;
  className?: string;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'default' | 'destructive';
  isLoading?: boolean;
}

/**
 * Confirmation dialog component for email template actions
 * Provides accessible confirmation dialogs with proper keyboard navigation
 */
function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  confirmVariant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
        </Dialog.Header>
        
        <Dialog.Footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

/**
 * Email template row actions component
 * 
 * Provides comprehensive action buttons for email template management including:
 * - View: Navigate to template details in read-only mode
 * - Edit: Navigate to template edit form
 * - Duplicate: Create a copy of the template with confirmation
 * - Delete: Remove template with confirmation dialog
 * 
 * Features:
 * - Confirmation dialogs with proper accessibility
 * - Optimistic updates using React Query
 * - Error handling with toast notifications
 * - Responsive action menu for mobile/desktop
 * - Integration with Next.js app router
 * 
 * @param template - The email template data object
 * @param onView - Optional callback for view action override
 * @param onEdit - Optional callback for edit action override  
 * @param onDuplicate - Optional callback for duplicate action override
 * @param onDelete - Optional callback for delete action override
 * @param className - Additional CSS classes for styling
 */
export function EmailTemplateActions({
  template,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  className = '',
}: EmailTemplateActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { invalidateEmailTemplates } = useEmailTemplates();
  
  // Dialog state management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiClient.delete(`/system/email-template/${templateId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete email template');
      }
      return response.json();
    },
    onMutate: async (templateId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['email-templates'] });
      
      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData<EmailTemplate[]>(['email-templates']);
      
      // Optimistically update to remove the template
      queryClient.setQueryData<EmailTemplate[]>(['email-templates'], (old = []) => 
        old.filter(t => t.id !== templateId)
      );
      
      return { previousTemplates };
    },
    onError: (error, templateId, context) => {
      // Roll back the optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['email-templates'], context.previousTemplates);
      }
      
      console.error('Failed to delete email template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete email template',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      invalidateEmailTemplates();
      
      toast({
        title: 'Success',
        description: `Email template "${template.name}" has been deleted successfully.`,
        variant: 'default',
      });
      
      setShowDeleteDialog(false);
    },
  });

  // Duplicate mutation with optimistic updates
  const duplicateMutation = useMutation({
    mutationFn: async (templateData: Partial<EmailTemplate>) => {
      const response = await apiClient.post('/system/email-template', {
        body: JSON.stringify(templateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate email template');
      }
      
      return response.json();
    },
    onMutate: async (templateData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['email-templates'] });
      
      // Create optimistic template
      const optimisticTemplate: EmailTemplate = {
        ...template,
        id: Date.now(), // Temporary ID
        name: templateData.name || `${template.name} (Copy)`,
        description: templateData.description || template.description,
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
      };
      
      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData<EmailTemplate[]>(['email-templates']);
      
      // Optimistically add the new template
      queryClient.setQueryData<EmailTemplate[]>(['email-templates'], (old = []) => 
        [optimisticTemplate, ...old]
      );
      
      return { previousTemplates, optimisticTemplate };
    },
    onError: (error, templateData, context) => {
      // Roll back the optimistic update on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['email-templates'], context.previousTemplates);
      }
      
      console.error('Failed to duplicate email template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate email template',
        variant: 'destructive',
      });
    },
    onSuccess: (newTemplate) => {
      // Invalidate and refetch to get the real server data
      invalidateEmailTemplates();
      
      toast({
        title: 'Success',
        description: `Email template "${newTemplate.name}" has been created successfully.`,
        variant: 'default',
      });
      
      setShowDuplicateDialog(false);
    },
  });

  // Action handlers
  const handleView = () => {
    if (onView) {
      onView(template);
    } else {
      router.push(`/system-settings/email-templates/${template.id}?mode=view`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(template);
    } else {
      router.push(`/system-settings/email-templates/${template.id}/edit`);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(template);
    } else {
      setShowDuplicateDialog(true);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(template);
    } else {
      setShowDeleteDialog(true);
    }
  };

  const confirmDuplicate = () => {
    const duplicateData: Partial<EmailTemplate> = {
      name: `${template.name} (Copy)`,
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

    duplicateMutation.mutate(duplicateData);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(template.id);
  };

  // Action menu items
  const actionItems = [
    {
      icon: Eye,
      label: 'View',
      onClick: handleView,
      disabled: false,
    },
    {
      icon: Edit3,
      label: 'Edit',
      onClick: handleEdit,
      disabled: false,
    },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: handleDuplicate,
      disabled: duplicateMutation.isPending,
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: handleDelete,
      disabled: deleteMutation.isPending,
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <div className={`flex items-center justify-end space-x-1 ${className}`}>
        {/* Desktop: Individual action buttons */}
        <div className="hidden md:flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="h-8 w-8 p-0"
            title="View template"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View template</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
            title="Edit template"
          >
            <Edit3 className="h-4 w-4" />
            <span className="sr-only">Edit template</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicateMutation.isPending}
            className="h-8 w-8 p-0"
            title="Duplicate template"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Duplicate template</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete template"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete template</span>
          </Button>
        </div>

        {/* Mobile: Dropdown menu */}
        <div className="md:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Content align="end" className="w-48">
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenu.Item
                    key={item.label}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={
                      item.variant === 'destructive'
                        ? 'text-red-600 focus:text-red-700 focus:bg-red-50'
                        : ''
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Email Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />

      {/* Duplicate confirmation dialog */}
      <ConfirmDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onConfirm={confirmDuplicate}
        title="Duplicate Email Template"
        description={`Create a copy of "${template.name}"? The copy will be named "${template.name} (Copy)".`}
        confirmText="Duplicate"
        confirmVariant="default"
        isLoading={duplicateMutation.isPending}
      />
    </>
  );
}

export default EmailTemplateActions;