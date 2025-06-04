'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// UI Components - Following the established component structure
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormError,
  FormGroup
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';

// Hooks and utilities
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useEmailTemplates } from '@/hooks/use-email-templates';

// Types
interface EmailTemplate {
  id?: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  createdById?: number;
  lastModifiedById?: number;
}

interface EmailTemplatePayload {
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
}

// Zod validation schema with comprehensive email template validation
const emailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(255, 'Template name must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  to: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        const emails = value.split(/[,;]/).map(email => email.trim());
        return emails.every(email => 
          z.string().email().safeParse(email).success || 
          email.includes('{') // Allow template variables like {user.email}
        );
      },
      'Please enter valid email addresses separated by commas or semicolons'
    ),
  cc: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        const emails = value.split(/[,;]/).map(email => email.trim());
        return emails.every(email => 
          z.string().email().safeParse(email).success || 
          email.includes('{') // Allow template variables
        );
      },
      'Please enter valid email addresses separated by commas or semicolons'
    ),
  bcc: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        const emails = value.split(/[,;]/).map(email => email.trim());
        return emails.every(email => 
          z.string().email().safeParse(email).success || 
          email.includes('{') // Allow template variables
        );
      },
      'Please enter valid email addresses separated by commas or semicolons'
    ),
  subject: z
    .string()
    .max(255, 'Subject must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  attachment: z
    .string()
    .max(500, 'Attachment path must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  bodyHtml: z
    .string()
    .max(50000, 'Email body must be less than 50,000 characters')
    .optional()
    .or(z.literal('')),
  fromName: z
    .string()
    .max(255, 'Sender name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  fromEmail: z
    .union([
      z.string().email('Please enter a valid sender email address'),
      z.string().length(0),
      z.string().regex(/\{.*\}/, 'Please enter a valid email or template variable')
    ])
    .optional(),
  replyToName: z
    .string()
    .max(255, 'Reply-to name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  replyToEmail: z
    .union([
      z.string().email('Please enter a valid reply-to email address'),
      z.string().length(0),
      z.string().regex(/\{.*\}/, 'Please enter a valid email or template variable')
    ])
    .optional(),
  id: z.number().optional(),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

interface EmailTemplateFormProps {
  /** Email template data for edit mode */
  emailTemplate?: EmailTemplate;
  /** Whether the form is in edit mode */
  isEditMode?: boolean;
  /** Callback fired when form is successfully submitted */
  onSuccess?: () => void;
  /** Callback fired when form is cancelled */
  onCancel?: () => void;
  /** Custom CSS classes */
  className?: string;
}

/**
 * EmailTemplateForm Component
 * 
 * Reusable React form component for email template creation and editing using 
 * React Hook Form with Zod validation. Handles all email template fields including 
 * name, description, recipients (to/cc/bcc), subject, attachment, body content, 
 * sender information, and reply-to details. Provides real-time validation, 
 * error handling, and accessibility compliance.
 * 
 * Features:
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Comprehensive field validation with proper error messaging
 * - Responsive design with Tailwind CSS maintaining WCAG 2.1 AA compliance
 * - Support for both create and edit modes
 * - Email template variable support (e.g., {user.email})
 * - Optimistic updates and error recovery
 * - Accessibility compliance with proper ARIA attributes
 */
export function EmailTemplateForm({
  emailTemplate,
  isEditMode = false,
  onSuccess,
  onCancel,
  className,
}: EmailTemplateFormProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const { 
    createEmailTemplate, 
    updateEmailTemplate, 
    isCreating, 
    isUpdating 
  } = useEmailTemplates();

  // Form setup with Zod validation
  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      name: '',
      description: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      attachment: '',
      bodyHtml: '',
      fromName: '',
      fromEmail: '',
      replyToName: '',
      replyToEmail: '',
    },
  });

  // Initialize form with email template data in edit mode
  useEffect(() => {
    if (isEditMode && emailTemplate) {
      form.reset({
        name: emailTemplate.name || '',
        description: emailTemplate.description || '',
        to: emailTemplate.to || '',
        cc: emailTemplate.cc || '',
        bcc: emailTemplate.bcc || '',
        subject: emailTemplate.subject || '',
        attachment: emailTemplate.attachment || '',
        bodyHtml: emailTemplate.bodyHtml || '',
        fromName: emailTemplate.fromName || '',
        fromEmail: emailTemplate.fromEmail || '',
        replyToName: emailTemplate.replyToName || '',
        replyToEmail: emailTemplate.replyToEmail || '',
        id: emailTemplate.id,
      });
    }
  }, [isEditMode, emailTemplate, form]);

  // Handle form submission
  const onSubmit = useCallback(async (data: EmailTemplateFormData) => {
    try {
      const payload: EmailTemplatePayload = {
        name: data.name,
        description: data.description || undefined,
        to: data.to || undefined,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        subject: data.subject || undefined,
        attachment: data.attachment || undefined,
        bodyHtml: data.bodyHtml || undefined,
        fromName: data.fromName || undefined,
        fromEmail: data.fromEmail || undefined,
        replyToName: data.replyToName || undefined,
        replyToEmail: data.replyToEmail || undefined,
      };

      if (isEditMode && emailTemplate?.id) {
        await updateEmailTemplate.mutateAsync({
          id: emailTemplate.id,
          data: payload,
        });
        addNotification({
          type: 'success',
          title: 'Email Template Updated',
          message: 'Email template has been successfully updated.',
        });
      } else {
        await createEmailTemplate.mutateAsync(payload);
        addNotification({
          type: 'success',
          title: 'Email Template Created',
          message: 'Email template has been successfully created.',
        });
      }

      onSuccess?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: isEditMode ? 'Update Failed' : 'Creation Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  }, [isEditMode, emailTemplate?.id, updateEmailTemplate, createEmailTemplate, addNotification, onSuccess]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onCancel, router]);

  // Loading state
  const isLoading = isCreating || isUpdating;

  // Memoized form errors for performance
  const formErrors = useMemo(() => form.formState.errors, [form.formState.errors]);

  return (
    <div className={cn(
      'email-template-form-container',
      'w-full max-w-4xl mx-auto p-6',
      theme === 'dark' ? 'dark' : '',
      className
    )}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Template Name and Description */}
          <FormGroup legend="Basic Information" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="template-name" required>
                    Template Name
                  </FormLabel>
                  <Input
                    {...field}
                    id="template-name"
                    placeholder="Enter template name"
                    aria-describedby={formErrors.name ? 'name-error' : undefined}
                    className="w-full"
                  />
                  <FormError id="name-error">
                    {formErrors.name?.message}
                  </FormError>
                </FormControl>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="template-description">
                    Description
                  </FormLabel>
                  <Textarea
                    {...field}
                    id="template-description"
                    placeholder="Enter template description"
                    rows={3}
                    aria-describedby={formErrors.description ? 'description-error' : undefined}
                    className="w-full resize-vertical"
                  />
                  <FormError id="description-error">
                    {formErrors.description?.message}
                  </FormError>
                </FormControl>
              )}
            />
          </FormGroup>

          {/* Recipients */}
          <FormGroup legend="Recipients" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-to">
                      To
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-to"
                      placeholder="recipient@example.com"
                      aria-describedby={formErrors.to ? 'to-error' : 'to-help'}
                      className="w-full"
                    />
                    <div id="to-help" className="text-sm text-gray-500 mt-1">
                      Separate multiple emails with commas or semicolons
                    </div>
                    <FormError id="to-error">
                      {formErrors.to?.message}
                    </FormError>
                  </FormControl>
                )}
              />

              <FormField
                control={form.control}
                name="cc"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-cc">
                      CC
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-cc"
                      placeholder="cc@example.com"
                      aria-describedby={formErrors.cc ? 'cc-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="cc-error">
                      {formErrors.cc?.message}
                    </FormError>
                  </FormControl>
                )}
              />

              <FormField
                control={form.control}
                name="bcc"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-bcc">
                      BCC
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-bcc"
                      placeholder="bcc@example.com"
                      aria-describedby={formErrors.bcc ? 'bcc-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="bcc-error">
                      {formErrors.bcc?.message}
                    </FormError>
                  </FormControl>
                )}
              />
            </div>
          </FormGroup>

          {/* Email Content */}
          <FormGroup legend="Email Content" className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="template-subject">
                    Subject
                  </FormLabel>
                  <Input
                    {...field}
                    id="template-subject"
                    placeholder="Enter email subject"
                    aria-describedby={formErrors.subject ? 'subject-error' : undefined}
                    className="w-full"
                  />
                  <FormError id="subject-error">
                    {formErrors.subject?.message}
                  </FormError>
                </FormControl>
              )}
            />

            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="template-attachment">
                    Attachment
                  </FormLabel>
                  <Input
                    {...field}
                    id="template-attachment"
                    placeholder="Path to attachment file"
                    aria-describedby={formErrors.attachment ? 'attachment-error' : 'attachment-help'}
                    className="w-full"
                  />
                  <div id="attachment-help" className="text-sm text-gray-500 mt-1">
                    File path or URL to attachment
                  </div>
                  <FormError id="attachment-error">
                    {formErrors.attachment?.message}
                  </FormError>
                </FormControl>
              )}
            />

            <FormField
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <FormControl>
                  <FormLabel htmlFor="template-body">
                    Email Body (HTML)
                  </FormLabel>
                  <Textarea
                    {...field}
                    id="template-body"
                    placeholder="Enter email body content"
                    rows={8}
                    aria-describedby={formErrors.bodyHtml ? 'body-error' : 'body-help'}
                    className="w-full resize-vertical font-mono text-sm"
                  />
                  <div id="body-help" className="text-sm text-gray-500 mt-1">
                    Support HTML formatting and template variables like {'{user.name}'}
                  </div>
                  <FormError id="body-error">
                    {formErrors.bodyHtml?.message}
                  </FormError>
                </FormControl>
              )}
            />
          </FormGroup>

          {/* Sender Information */}
          <FormGroup legend="Sender Information" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-from-name">
                      Sender Name
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-from-name"
                      placeholder="Sender Display Name"
                      aria-describedby={formErrors.fromName ? 'from-name-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="from-name-error">
                      {formErrors.fromName?.message}
                    </FormError>
                  </FormControl>
                )}
              />

              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-from-email">
                      Sender Email
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-from-email"
                      type="email"
                      placeholder="sender@example.com"
                      aria-describedby={formErrors.fromEmail ? 'from-email-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="from-email-error">
                      {formErrors.fromEmail?.message}
                    </FormError>
                  </FormControl>
                )}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="replyToName"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-reply-to-name">
                      Reply-To Name
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-reply-to-name"
                      placeholder="Reply-To Display Name"
                      aria-describedby={formErrors.replyToName ? 'reply-to-name-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="reply-to-name-error">
                      {formErrors.replyToName?.message}
                    </FormError>
                  </FormControl>
                )}
              />

              <FormField
                control={form.control}
                name="replyToEmail"
                render={({ field }) => (
                  <FormControl>
                    <FormLabel htmlFor="template-reply-to-email">
                      Reply-To Email
                    </FormLabel>
                    <Input
                      {...field}
                      id="template-reply-to-email"
                      type="email"
                      placeholder="reply@example.com"
                      aria-describedby={formErrors.replyToEmail ? 'reply-to-email-error' : undefined}
                      className="w-full"
                    />
                    <FormError id="reply-to-email-error">
                      {formErrors.replyToEmail?.message}
                    </FormError>
                  </FormControl>
                )}
              />
            </div>
          </FormGroup>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Template' : 'Create Template'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default EmailTemplateForm;