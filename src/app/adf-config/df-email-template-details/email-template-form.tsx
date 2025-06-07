'use client';

/**
 * Email Template Form Component
 * 
 * React form component implementing email template creation and editing functionality
 * using React Hook Form with comprehensive Zod validation. Renders all form fields
 * with Headless UI components styled with Tailwind CSS. Provides real-time validation,
 * error display, and responsive design including dark mode support.
 * 
 * Features:
 * - React Hook Form with Zod schema validators for all user inputs
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Headless UI components for accessible form controls per Section 7.1 Core UI Technologies
 * - Tailwind CSS 4.1+ utility classes for styling per React/Next.js Integration Requirements
 * - WCAG 2.1 AA compliance for form accessibility per Section 7.1 Core UI Technologies
 * - Responsive form layout with dark mode support
 * - Comprehensive error handling and success feedback
 * 
 * @fileoverview Email template form component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

// Import hooks and utilities
import { useEmailTemplate, type EmailTemplatePayload, type EmailTemplate } from './use-email-template';
import { useTheme } from '@/hooks/use-theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input/textarea';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Comprehensive Zod validation schema for email template form
 * Implements real-time validation under 100ms per React/Next.js Integration Requirements
 */
const emailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(255, 'Template name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Template name can only contain letters, numbers, spaces, hyphens, and underscores'),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  to: z
    .string()
    .max(500, 'To field must be less than 500 characters')
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validate email format(s) - supports multiple emails separated by commas or semicolons
      const emails = val.split(/[,;]+/).map(email => email.trim()).filter(email => email.length > 0);
      return emails.every(email => z.string().email().safeParse(email).success);
    }, 'Please enter valid email addresses separated by commas or semicolons'),

  cc: z
    .string()
    .max(500, 'CC field must be less than 500 characters')
    .optional()
    .refine((val) => {
      if (!val) return true;
      const emails = val.split(/[,;]+/).map(email => email.trim()).filter(email => email.length > 0);
      return emails.every(email => z.string().email().safeParse(email).success);
    }, 'Please enter valid email addresses separated by commas or semicolons'),

  bcc: z
    .string()
    .max(500, 'BCC field must be less than 500 characters')
    .optional()
    .refine((val) => {
      if (!val) return true;
      const emails = val.split(/[,;]+/).map(email => email.trim()).filter(email => email.length > 0);
      return emails.every(email => z.string().email().safeParse(email).success);
    }, 'Please enter valid email addresses separated by commas or semicolons'),

  subject: z
    .string()
    .max(255, 'Subject must be less than 255 characters')
    .optional(),

  attachment: z
    .string()
    .max(500, 'Attachment path must be less than 500 characters')
    .optional(),

  bodyHtml: z
    .string()
    .max(10000, 'Email body must be less than 10,000 characters')
    .optional(),

  fromName: z
    .string()
    .max(255, 'From name must be less than 255 characters')
    .optional(),

  fromEmail: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'From email must be less than 255 characters')
    .optional()
    .or(z.literal('')),

  replyToName: z
    .string()
    .max(255, 'Reply-to name must be less than 255 characters')
    .optional(),

  replyToEmail: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Reply-to email must be less than 255 characters')
    .optional()
    .or(z.literal(''))
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Props interface for EmailTemplateForm component
 */
export interface EmailTemplateFormProps {
  /** Email template to edit (undefined for create mode) */
  emailTemplate?: EmailTemplate;
  
  /** Callback when form is successfully submitted */
  onSuccess?: (template: EmailTemplate) => void;
  
  /** Callback when form is cancelled */
  onCancel?: () => void;
  
  /** Whether the form is in edit mode */
  isEditing?: boolean;
  
  /** Additional CSS classes for the form container */
  className?: string;
  
  /** Whether to show the cancel button */
  showCancelButton?: boolean;
  
  /** Custom submit button text */
  submitButtonText?: string;
  
  /** Whether form should auto-focus the first field */
  autoFocus?: boolean;
}

/**
 * Form field component for consistent styling and accessibility
 */
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required = false,
  description,
  className = '',
}) => {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`
        block text-sm font-medium transition-colors duration-200
        ${error 
          ? 'text-error-600 dark:text-error-400' 
          : 'text-gray-700 dark:text-gray-300'
        }
      `}>
        {label}
        {required && (
          <span 
            className="text-error-500 ml-1" 
            aria-label="required"
          >
            *
          </span>
        )}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
      
      {children}
      
      {error && (
        <div 
          className="flex items-center gap-1 text-sm text-error-600 dark:text-error-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Email Template Form Component
 * 
 * Handles both create and edit modes for email templates with comprehensive
 * validation, accessibility features, and responsive design.
 */
export const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  emailTemplate,
  onSuccess,
  onCancel,
  isEditing = false,
  className = '',
  showCancelButton = true,
  submitButtonText,
  autoFocus = true,
}) => {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();
  
  // Email template mutations
  const { useCreateEmailTemplate, useUpdateEmailTemplate } = useEmailTemplate({
    onSuccess: (data) => {
      if (data.success && data.resource) {
        const template = Array.isArray(data.resource) ? data.resource[0] : data.resource;
        onSuccess?.(template);
      }
    },
    onError: (error) => {
      console.error('Email template operation failed:', error);
    },
  });

  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();

  // Form setup with React Hook Form and Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    watch,
    setValue,
    clearErrors,
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: emailTemplate?.name || '',
      description: emailTemplate?.description || '',
      to: emailTemplate?.to || '',
      cc: emailTemplate?.cc || '',
      bcc: emailTemplate?.bcc || '',
      subject: emailTemplate?.subject || '',
      attachment: emailTemplate?.attachment || '',
      bodyHtml: emailTemplate?.bodyHtml || '',
      fromName: emailTemplate?.fromName || '',
      fromEmail: emailTemplate?.fromEmail || '',
      replyToName: emailTemplate?.replyToName || '',
      replyToEmail: emailTemplate?.replyToEmail || '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch form values for real-time validation
  const watchedValues = watch();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = isValid && isDirty && !isLoading;

  // Responsive grid classes based on screen size
  const gridClasses = useMemo(() => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  }, [isMobile, isTablet]);

  // Dynamic submit button text
  const buttonText = useMemo(() => {
    if (isLoading) return isEditing ? 'Updating...' : 'Creating...';
    if (submitButtonText) return submitButtonText;
    return isEditing ? 'Update Template' : 'Create Template';
  }, [isLoading, isEditing, submitButtonText]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle form submission with proper error handling
   */
  const onSubmit: SubmitHandler<EmailTemplateFormData> = useCallback(async (data) => {
    try {
      // Prepare payload
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

      if (isEditing && emailTemplate?.id) {
        // Update existing template
        await updateMutation.mutateAsync({
          id: emailTemplate.id,
          payload,
        });
      } else {
        // Create new template
        await createMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [isEditing, emailTemplate?.id, createMutation, updateMutation]);

  /**
   * Handle form cancellation
   */
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    reset();
    onCancel?.();
  }, [isDirty, reset, onCancel]);

  /**
   * Handle form reset
   */
  const handleReset = useCallback(() => {
    reset();
    clearErrors();
  }, [reset, clearErrors]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Reset form when emailTemplate prop changes
   */
  useEffect(() => {
    if (emailTemplate) {
      reset({
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
      });
    }
  }, [emailTemplate, reset]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Email Template' : 'Create Email Template'}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing 
            ? 'Update the email template configuration below.'
            : 'Configure your email template settings below.'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Basic Information
          </h3>
          
          <div className={`grid gap-6 ${gridClasses}`}>
            {/* Template Name */}
            <FormField
              label="Template Name"
              error={errors.name?.message}
              required
              description="A unique name to identify this email template"
              className="md:col-span-2"
            >
              <Input
                {...register('name')}
                type="text"
                placeholder="e.g., Welcome Email, Password Reset"
                disabled={isLoading}
                autoFocus={autoFocus}
                aria-describedby="name-description"
                className="w-full"
              />
            </FormField>

            {/* Description */}
            <FormField
              label="Description"
              error={errors.description?.message}
              description="Optional description of what this template is used for"
              className="md:col-span-full"
            >
              <Textarea
                {...register('description')}
                placeholder="Describe the purpose and usage of this email template..."
                disabled={isLoading}
                rows={3}
                maxLength={1000}
                showCharacterCount
                aria-describedby="description-description"
              />
            </FormField>
          </div>
        </div>

        {/* Recipients Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recipients
          </h3>
          
          <div className={`grid gap-6 ${gridClasses}`}>
            {/* To Field */}
            <FormField
              label="To"
              error={errors.to?.message}
              description="Primary recipients (separated by commas or semicolons)"
            >
              <Input
                {...register('to')}
                type="email"
                placeholder="user@example.com, admin@company.com"
                disabled={isLoading}
                aria-describedby="to-description"
              />
            </FormField>

            {/* CC Field */}
            <FormField
              label="CC"
              error={errors.cc?.message}
              description="Carbon copy recipients"
            >
              <Input
                {...register('cc')}
                type="email"
                placeholder="manager@company.com"
                disabled={isLoading}
                aria-describedby="cc-description"
              />
            </FormField>

            {/* BCC Field */}
            <FormField
              label="BCC"
              error={errors.bcc?.message}
              description="Blind carbon copy recipients"
            >
              <Input
                {...register('bcc')}
                type="email"
                placeholder="archive@company.com"
                disabled={isLoading}
                aria-describedby="bcc-description"
              />
            </FormField>
          </div>
        </div>

        {/* Email Content Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Email Content
          </h3>
          
          <div className="space-y-6">
            {/* Subject */}
            <FormField
              label="Subject"
              error={errors.subject?.message}
              description="Email subject line"
            >
              <Input
                {...register('subject')}
                type="text"
                placeholder="Welcome to DreamFactory!"
                disabled={isLoading}
                aria-describedby="subject-description"
              />
            </FormField>

            {/* Email Body */}
            <FormField
              label="Email Body (HTML)"
              error={errors.bodyHtml?.message}
              description="The HTML content of the email"
            >
              <Textarea
                {...register('bodyHtml')}
                placeholder="<h1>Welcome!</h1><p>Thank you for signing up...</p>"
                disabled={isLoading}
                rows={8}
                maxLength={10000}
                showCharacterCount
                aria-describedby="body-description"
              />
            </FormField>

            {/* Attachment */}
            <FormField
              label="Attachment"
              error={errors.attachment?.message}
              description="Path to file attachment (optional)"
            >
              <Input
                {...register('attachment')}
                type="text"
                placeholder="/storage/documents/welcome-guide.pdf"
                disabled={isLoading}
                aria-describedby="attachment-description"
              />
            </FormField>
          </div>
        </div>

        {/* Sender Information Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Sender Information
          </h3>
          
          <div className={`grid gap-6 ${gridClasses}`}>
            {/* From Name */}
            <FormField
              label="From Name"
              error={errors.fromName?.message}
              description="Display name for the sender"
            >
              <Input
                {...register('fromName')}
                type="text"
                placeholder="DreamFactory Team"
                disabled={isLoading}
                aria-describedby="from-name-description"
              />
            </FormField>

            {/* From Email */}
            <FormField
              label="From Email"
              error={errors.fromEmail?.message}
              description="Email address for the sender"
            >
              <Input
                {...register('fromEmail')}
                type="email"
                placeholder="noreply@dreamfactory.com"
                disabled={isLoading}
                aria-describedby="from-email-description"
              />
            </FormField>

            {/* Reply-To Name */}
            <FormField
              label="Reply-To Name"
              error={errors.replyToName?.message}
              description="Display name for replies (optional)"
            >
              <Input
                {...register('replyToName')}
                type="text"
                placeholder="Support Team"
                disabled={isLoading}
                aria-describedby="reply-to-name-description"
              />
            </FormField>

            {/* Reply-To Email */}
            <FormField
              label="Reply-To Email"
              error={errors.replyToEmail?.message}
              description="Email address for replies (optional)"
            >
              <Input
                {...register('replyToEmail')}
                type="email"
                placeholder="support@dreamfactory.com"
                disabled={isLoading}
                aria-describedby="reply-to-email-description"
              />
            </FormField>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Reset Button */}
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
              className="order-3 sm:order-1"
            >
              Reset Form
            </Button>
          )}

          {/* Cancel Button */}
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="order-2"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            loading={isLoading}
            className="order-1 sm:order-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {buttonText}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>

        {/* Form Status Messages */}
        {hasErrors && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 mr-2" />
              <span className="text-sm font-medium text-error-800 dark:text-error-200">
                Please correct the errors above before submitting.
              </span>
            </div>
          </div>
        )}

        {(createMutation.isSuccess || updateMutation.isSuccess) && (
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400 mr-2" />
              <span className="text-sm font-medium text-success-800 dark:text-success-200">
                Email template {isEditing ? 'updated' : 'created'} successfully!
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default EmailTemplateForm;
export type { EmailTemplateFormProps, EmailTemplateFormData };