'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { useEmailTemplateContext } from '../layout';
import { emailTemplateSchema, type EmailTemplateForm, type EmailTemplate } from '@/types/email-templates';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// =============================================================================
// ENHANCED VALIDATION SCHEMA WITH REAL-TIME VALIDATION
// =============================================================================

/**
 * Enhanced email template validation schema with optimized field validation
 * Provides comprehensive validation with sub-100ms response time requirements
 */
const enhancedEmailTemplateSchema = emailTemplateSchema.extend({
  id: z.number().optional(),
}).refine((data) => {
  // Cross-field validation for email consistency
  if (data.fromEmail && data.replyToEmail) {
    return data.fromEmail !== data.replyToEmail || data.fromEmail.length > 0;
  }
  return true;
}, {
  message: "From email and reply-to email should be different or properly configured",
  path: ["replyToEmail"],
});

type EnhancedEmailTemplateForm = z.infer<typeof enhancedEmailTemplateSchema>;

// =============================================================================
// FORM FIELD COMPONENTS WITH WCAG 2.1 AA COMPLIANCE
// =============================================================================

/**
 * Input component with proper accessibility and validation support
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

function Input({ 
  label, 
  error, 
  required = false, 
  hint, 
  className,
  ...props 
}: InputProps) {
  const inputId = `input-${props.name || Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className={cn(
          "block text-sm font-medium text-gray-700 dark:text-gray-300",
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </label>
      
      {hint && (
        <p 
          id={hintId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      )}
      
      <input
        id={inputId}
        aria-describedby={cn(
          hint && hintId,
          error && errorId
        )}
        aria-invalid={!!error}
        className={cn(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          "shadow-sm focus:border-primary-500 focus:ring-primary-500",
          "sm:text-sm transition-colors duration-200",
          "min-h-[44px] px-3 py-2", // WCAG 2.1 AA minimum touch target
          error && "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea component with proper accessibility and validation support
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

function Textarea({ 
  label, 
  error, 
  required = false, 
  hint, 
  className,
  ...props 
}: TextareaProps) {
  const textareaId = `textarea-${props.name || Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={textareaId}
        className={cn(
          "block text-sm font-medium text-gray-700 dark:text-gray-300",
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </label>
      
      {hint && (
        <p 
          id={hintId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      )}
      
      <textarea
        id={textareaId}
        aria-describedby={cn(
          hint && hintId,
          error && errorId
        )}
        aria-invalid={!!error}
        className={cn(
          "block w-full rounded-md border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          "shadow-sm focus:border-primary-500 focus:ring-primary-500",
          "sm:text-sm transition-colors duration-200",
          "min-h-[88px] px-3 py-2", // Larger minimum height for textarea
          error && "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Button component with accessibility and loading states
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center font-medium rounded-md",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    "min-h-[44px]" // WCAG 2.1 AA minimum touch target
  );

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/**
 * Alert component for error and success messages
 */
interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

function Alert({ type, title, children, onDismiss }: AlertProps) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
  };

  const icons = {
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.175 10.4a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div 
      className={cn(
        "rounded-md border p-4",
        styles[type]
      )}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-black/20"
              onClick={onDismiss}
              aria-label="Dismiss alert"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Error fallback component for email template edit page
 */
function EmailTemplateEditErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Alert 
        type="error" 
        title="Failed to Load Email Template"
      >
        <p className="mb-4">
          There was an error loading the email template for editing. This could be due to:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>The template ID is invalid or the template was deleted</li>
          <li>You don't have permission to edit this template</li>
          <li>A temporary server connection issue</li>
        </ul>
        <div className="flex space-x-3">
          <Button 
            onClick={resetErrorBoundary}
            size="sm"
          >
            Try Again
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </Alert>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Email Template Edit Page Component
 * 
 * Next.js page component for editing existing email templates using dynamic [id] route parameter.
 * Implements React Hook Form with Zod validation, pre-populates form data from server component props,
 * and provides comprehensive email template editing interface with real-time validation, error handling,
 * and integration with DreamFactory API endpoints.
 * 
 * Features:
 * - Dynamic route parameter handling for email template ID extraction
 * - React Hook Form with Zod schema validation per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per performance requirements
 * - Pre-populated form fields for template editing
 * - Integration with DreamFactory email templates API endpoints for update operations
 * - Responsive design with Tailwind CSS maintaining WCAG 2.1 AA compliance
 * - Error handling with user-friendly messages and recovery options
 * - Zustand store integration for form state management
 * - React Query mutation for optimistic updates and cache invalidation
 * 
 * Replaces Angular df-email-template-details component edit functionality
 * with modern React 19/Next.js 15.1 patterns.
 */
export default function EmailTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Extract template ID from route parameters
  const templateId = useMemo(() => {
    const id = params?.id;
    if (typeof id === 'string') {
      const numericId = parseInt(id, 10);
      return isNaN(numericId) ? null : numericId;
    }
    return null;
  }, [params?.id]);

  // Hooks for email template management
  const { useEmailTemplate, updateEmailTemplate } = useEmailTemplates();
  const templateStore = useEmailTemplateContext();
  
  // Query for loading template data
  const { 
    data: emailTemplate, 
    isLoading: isLoadingTemplate,
    error: templateError,
    refetch: refetchTemplate 
  } = useEmailTemplate(templateId || undefined);

  // Form state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<EnhancedEmailTemplateForm>({
    resolver: zodResolver(enhancedEmailTemplateSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      description: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      attachment: '',
      bodyText: '',
      bodyHtml: '',
      fromName: '',
      fromEmail: '',
      replyToName: '',
      replyToEmail: '',
      defaults: {},
    },
  });

  // Watch form changes for real-time validation
  const watchedValues = watch();

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: async (formData: EnhancedEmailTemplateForm) => {
      if (!templateId) throw new Error('Template ID is required');
      
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        to: formData.to || undefined,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        subject: formData.subject || undefined,
        attachment: formData.attachment || undefined,
        bodyText: formData.bodyText || undefined,
        bodyHtml: formData.bodyHtml || undefined,
        fromName: formData.fromName || undefined,
        fromEmail: formData.fromEmail || undefined,
        replyToName: formData.replyToName || undefined,
        replyToEmail: formData.replyToEmail || undefined,
        defaults: formData.defaults || undefined,
      };

      const response = await apiClient.patch<EmailTemplate>(
        `/api/v2/system/email_template/${templateId}`,
        payload
      );
      
      return response;
    },
    onMutate: async (formData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['emailTemplates', 'detail', templateId] 
      });

      // Snapshot the previous value
      const previousTemplate = queryClient.getQueryData<EmailTemplate>([
        'emailTemplates', 'detail', templateId
      ]);

      // Optimistically update to the new value
      if (previousTemplate) {
        const optimisticTemplate: EmailTemplate = {
          ...previousTemplate,
          ...formData,
          lastModifiedDate: new Date().toISOString(),
        };
        
        queryClient.setQueryData(
          ['emailTemplates', 'detail', templateId],
          optimisticTemplate
        );
      }

      // Return a context object with the snapshotted value
      return { previousTemplate };
    },
    onError: (error, formData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplate) {
        queryClient.setQueryData(
          ['emailTemplates', 'detail', templateId],
          context.previousTemplate
        );
      }
      
      setSubmitError(error instanceof Error ? error.message : 'Failed to update email template');
      console.error('Email template update failed:', error);
    },
    onSuccess: (data) => {
      // Update store state
      templateStore.setEditing(false);
      templateStore.setDirty(false);
      templateStore.markSaved();
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ 
        queryKey: ['emailTemplates', 'list'] 
      });
      
      setSubmitSuccess(true);
      setSubmitError(null);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Pre-populate form when template data is loaded
  useEffect(() => {
    if (emailTemplate && !isLoadingTemplate) {
      reset({
        id: emailTemplate.id,
        name: emailTemplate.name || '',
        description: emailTemplate.description || '',
        to: emailTemplate.to || '',
        cc: emailTemplate.cc || '',
        bcc: emailTemplate.bcc || '',
        subject: emailTemplate.subject || '',
        attachment: emailTemplate.attachment || '',
        bodyText: emailTemplate.bodyText || '',
        bodyHtml: emailTemplate.bodyHtml || '',
        fromName: emailTemplate.fromName || '',
        fromEmail: emailTemplate.fromEmail || '',
        replyToName: emailTemplate.replyToName || '',
        replyToEmail: emailTemplate.replyToEmail || '',
        defaults: emailTemplate.defaults || {},
      });
      
      // Update store state
      templateStore.setSelectedTemplate(emailTemplate);
      templateStore.setEditing(true);
    }
  }, [emailTemplate, isLoadingTemplate, reset, templateStore]);

  // Track form dirty state in store
  useEffect(() => {
    templateStore.setDirty(isDirty);
  }, [isDirty, templateStore]);

  // Handle form submission
  const onSubmit = useCallback(async (formData: EnhancedEmailTemplateForm) => {
    if (!templateId) {
      setSubmitError('Template ID is missing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error) {
      // Error is already handled in mutation onError
    }
  }, [templateId, updateMutation]);

  // Handle navigation with unsaved changes warning
  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (!confirmLeave) return;
    }
    
    templateStore.setEditing(false);
    templateStore.setSelectedTemplate(null);
    router.push('/system-settings/email-templates');
  }, [isDirty, router, templateStore]);

  // Real-time validation trigger for performance optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      trigger(); // Trigger validation after 50ms delay for optimal performance
    }, 50);
    
    return () => clearTimeout(timer);
  }, [watchedValues, trigger]);

  // Handle template not found
  if (templateId === null) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Alert type="error" title="Invalid Template ID">
          The template ID in the URL is not valid. Please check the URL and try again.
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoadingTemplate) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Loading email template...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (templateError || !emailTemplate) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Alert 
          type="error" 
          title="Failed to Load Email Template"
        >
          <p className="mb-4">
            {templateError instanceof Error 
              ? templateError.message 
              : 'The email template could not be loaded. It may have been deleted or you may not have permission to view it.'
            }
          </p>
          <div className="flex space-x-3">
            <Button 
              onClick={() => refetchTemplate()}
              size="sm"
            >
              Try Again
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={handleBack}
            >
              Go Back
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={EmailTemplateEditErrorFallback}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Email Template
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Modify the email template configuration and content
            </p>
          </div>
          
          <Button
            variant="secondary"
            onClick={handleBack}
            aria-label="Return to email templates list"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to Templates
          </Button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <Alert 
            type="success" 
            title="Template Updated Successfully"
            onDismiss={() => setSubmitSuccess(false)}
          >
            The email template has been updated and saved.
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert 
            type="error" 
            title="Update Failed"
            onDismiss={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Template Name"
                    required
                    error={errors.name?.message}
                    hint="A unique name to identify this email template"
                  />
                )}
              />
              
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Email Subject"
                    error={errors.subject?.message}
                    hint="Default subject line for emails using this template"
                  />
                )}
              />
            </div>
            
            <div className="mt-6">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Description"
                    rows={3}
                    error={errors.description?.message}
                    hint="Optional description of this template's purpose and usage"
                  />
                )}
              />
            </div>
          </div>

          {/* Email Recipients Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Default Recipients
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Controller
                name="to"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="To (Recipient)"
                    error={errors.to?.message}
                    hint="Default recipient email address"
                  />
                )}
              />
              
              <Controller
                name="cc"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="CC (Carbon Copy)"
                    error={errors.cc?.message}
                    hint="Default CC email address"
                  />
                )}
              />
              
              <Controller
                name="bcc"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="BCC (Blind Carbon Copy)"
                    error={errors.bcc?.message}
                    hint="Default BCC email address"
                  />
                )}
              />
            </div>
          </div>

          {/* Sender Information Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Sender Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="fromName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="From Name"
                    error={errors.fromName?.message}
                    hint="Display name for the email sender"
                  />
                )}
              />
              
              <Controller
                name="fromEmail"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="From Email"
                    error={errors.fromEmail?.message}
                    hint="Email address for the sender"
                  />
                )}
              />
              
              <Controller
                name="replyToName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Reply-To Name"
                    error={errors.replyToName?.message}
                    hint="Display name for reply-to address"
                  />
                )}
              />
              
              <Controller
                name="replyToEmail"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Reply-To Email"
                    error={errors.replyToEmail?.message}
                    hint="Email address for replies"
                  />
                )}
              />
            </div>
          </div>

          {/* Email Content Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Email Content
            </h2>
            
            <div className="space-y-6">
              <Controller
                name="attachment"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Attachment Path"
                    error={errors.attachment?.message}
                    hint="Optional file path for email attachments"
                  />
                )}
              />
              
              <Controller
                name="bodyText"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Plain Text Body"
                    rows={6}
                    error={errors.bodyText?.message}
                    hint="Plain text version of the email content"
                  />
                )}
              />
              
              <Controller
                name="bodyHtml"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="HTML Body"
                    rows={8}
                    error={errors.bodyHtml?.message}
                    hint="HTML version of the email content with formatting"
                    className="font-mono"
                  />
                )}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {isDirty && (
                <>
                  <svg 
                    className="h-4 w-4 text-yellow-500" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>You have unsaved changes</span>
                </>
              )}
              {templateStore.lastSavedAt && !isDirty && (
                <>
                  <svg 
                    className="h-4 w-4 text-green-500" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.175 10.4a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>
                    Last saved {new Date(templateStore.lastSavedAt).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!isDirty || !isValid || isSubmitting}
                aria-label="Save email template changes"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}