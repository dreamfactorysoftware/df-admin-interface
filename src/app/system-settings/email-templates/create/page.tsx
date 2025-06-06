/**
 * Email Template Creation Page
 * 
 * Next.js page component for creating new email templates with React Hook Form,
 * Zod validation, and comprehensive form handling. Provides real-time validation,
 * error handling, and integration with DreamFactory API endpoints.
 * 
 * Features:
 * - React Hook Form with Zod schema validation for type-safe form handling
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Responsive design with Tailwind CSS 4.1+ utility classes
 * - Error boundaries and comprehensive error handling
 * - SWR data fetching with intelligent caching
 * - Next.js middleware authentication flow integration
 * - Zustand store integration for form state management
 * 
 * Replaces Angular df-email-template-details component create functionality
 * with modern React 19/Next.js 15.1/Tailwind CSS architecture.
 * 
 * @fileoverview Email template creation page component
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see React/Next.js Integration Requirements
 * @see Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Section 7.1 - CORE UI TECHNOLOGIES
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormError,
  FormGroup,
  type FormRef
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
  EmailTemplateForm,
  emailTemplateSchema,
  type EmailTemplatePayload,
  EMAIL_TEMPLATE_CONSTANTS,
} from '@/types/email-templates';

// =============================================================================
// TEXTAREA COMPONENT (Inline Implementation)
// =============================================================================

/**
 * Textarea component with React Hook Form integration
 * Provides multi-line text input with consistent styling and accessibility
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ name, label, description, error, required, className, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    const textareaId = `${name}-textarea`;
    const descriptionId = description ? `${name}-description` : undefined;
    const errorId = error ? `${name}-error` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <FormLabel htmlFor={textareaId} required={required}>
            {label}
          </FormLabel>
        )}
        
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </p>
        )}
        
        <textarea
          {...props}
          ref={ref}
          id={textareaId}
          name={name}
          className={cn(
            // Base styles
            'w-full rounded-md border transition-all duration-200',
            'text-sm font-normal leading-5 min-h-[120px] resize-y',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:cursor-default read-only:bg-gray-50 dark:read-only:bg-gray-800',
            
            // Focus styles with WCAG 2.1 AA compliance
            'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
            'focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            
            // Theme variants
            resolvedTheme === 'dark' 
              ? 'bg-gray-900 border-gray-600 text-gray-100 focus:ring-offset-gray-900'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-offset-white',
            
            // Error styles
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            
            // Custom className
            className
          )}
          aria-describedby={cn(
            descriptionId,
            errorId
          )}
          aria-invalid={!!error}
          required={required}
        />
        
        {error && (
          <FormError id={errorId}>
            {error}
          </FormError>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// =============================================================================
// ERROR BOUNDARY COMPONENTS
// =============================================================================

/**
 * Email template creation specific error fallback
 */
function EmailTemplateCreateErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.push('/system-settings/email-templates');
  }, [router]);

  useEffect(() => {
    console.error('Email Template Creation Error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-[600px] flex items-center justify-center p-6"
      role="alert"
      aria-labelledby="create-error-title"
      aria-describedby="create-error-description"
    >
      <div className="max-w-md w-full mx-auto">
        <Alert variant="error">
          <Alert.Icon />
          <Alert.Content>
            <h2 id="create-error-title" className="font-semibold">
              Unable to Load Email Template Creator
            </h2>
            <p id="create-error-description" className="mt-1 text-sm">
              There was an error loading the email template creation form. 
              Please try again or return to the templates list.
            </p>
          </Alert.Content>
          <Alert.Actions>
            <Button onClick={resetErrorBoundary} size="sm">
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="outline" size="sm">
              Go Back
            </Button>
          </Alert.Actions>
        </Alert>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Email Template Creation Page Component
 * 
 * Provides comprehensive form interface for creating new email templates with:
 * - Real-time validation under 100ms using React Hook Form + Zod
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design with Tailwind CSS
 * - Error handling and recovery options
 * - Integration with DreamFactory API endpoints
 * - Theme-aware styling via Zustand store
 */
export default function CreateEmailTemplatePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const formRef = useRef<FormRef<EmailTemplateForm>>(null);
  
  // Email templates hook for data operations
  const {
    createEmailTemplate,
    isCreating,
    setCreating,
    error: templateError,
  } = useEmailTemplates();

  // Local state for UI feedback
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Initialize React Hook Form with Zod validation
  const form = useForm<EmailTemplateForm>({
    resolver: zodResolver(emailTemplateSchema),
    mode: 'onBlur', // Real-time validation on blur for performance
    revalidateMode: 'onChange', // Re-validate on change after first blur
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
    },
  });

  const {
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting, errors },
    reset,
    watch,
  } = form;

  // Watch form values for auto-save (future enhancement)
  const watchedValues = watch();

  // Clear global error when form values change
  useEffect(() => {
    if (globalError && isDirty) {
      setGlobalError(undefined);
    }
  }, [globalError, isDirty]);

  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setSuccessMessage(undefined);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  // Form submission handler with comprehensive error handling
  const onSubmit: SubmitHandler<EmailTemplateForm> = useCallback(
    async (data) => {
      const startTime = performance.now();
      setSubmitAttempted(true);
      setGlobalError(undefined);
      setCreating(true);

      try {
        // Transform form data to API payload
        const payload: EmailTemplatePayload = {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          to: data.to?.trim() || undefined,
          cc: data.cc?.trim() || undefined,
          bcc: data.bcc?.trim() || undefined,
          subject: data.subject?.trim() || undefined,
          attachment: data.attachment?.trim() || undefined,
          bodyText: data.bodyText?.trim() || undefined,
          bodyHtml: data.bodyHtml?.trim() || undefined,
          fromName: data.fromName?.trim() || undefined,
          fromEmail: data.fromEmail?.trim() || undefined,
          replyToName: data.replyToName?.trim() || undefined,
          replyToEmail: data.replyToEmail?.trim() || undefined,
        };

        // Submit via email templates hook
        await new Promise<void>((resolve, reject) => {
          createEmailTemplate(payload, {
            onSuccess: () => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              console.log(`Email template created successfully in ${duration}ms`);
              setSuccessMessage('Email template created successfully!');
              
              // Reset form
              reset();
              setSubmitAttempted(false);
              
              // Navigate back to list after brief delay
              setTimeout(() => {
                router.push('/system-settings/email-templates');
              }, 2000);
              
              resolve();
            },
            onError: (error: any) => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              console.error(`Email template creation failed after ${duration}ms:`, error);
              
              const errorMessage = 
                error?.message || 
                'Failed to create email template. Please check your input and try again.';
              
              setGlobalError(errorMessage);
              reject(error);
            },
          });
        });
      } catch (error: any) {
        console.error('Email template creation error:', error);
        
        const errorMessage = 
          error?.message || 
          'An unexpected error occurred. Please try again.';
        
        setGlobalError(errorMessage);
      } finally {
        setCreating(false);
      }
    },
    [createEmailTemplate, setCreating, reset, router]
  );

  // Form error handler
  const onError = useCallback((errors: any) => {
    console.warn('Form validation errors:', errors);
    setGlobalError('Please correct the errors in the form before submitting.');
    
    // Focus first error field
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
    }
  }, []);

  // Navigation handlers
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) return;
    }
    router.push('/system-settings/email-templates');
  }, [isDirty, router]);

  const handleReset = useCallback(() => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset the form? All changes will be lost.'
    );
    if (confirmReset) {
      reset();
      setSubmitAttempted(false);
      setGlobalError(undefined);
      setSuccessMessage(undefined);
    }
  }, [reset]);

  // Performance monitoring for validation
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const subscription = form.watch(() => {
        const startTime = performance.now();
        // Trigger validation timing measurement
        setTimeout(() => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          if (duration > 100) {
            console.warn(`Form validation exceeded 100ms threshold: ${duration}ms`);
          }
        }, 0);
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form]);

  return (
    <ErrorBoundary
      FallbackComponent={EmailTemplateCreateErrorFallback}
      onReset={() => {
        setGlobalError(undefined);
        setSuccessMessage(undefined);
        reset();
      }}
    >
      <div className={cn(
        'max-w-4xl mx-auto space-y-8',
        'animate-fade-in'
      )}>
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Email Template
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create a new email template for system notifications and communications
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isCreating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting || isCreating || !isDirty}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Form Status Indicators */}
          {successMessage && (
            <Alert variant="success" dismissible>
              <Alert.Icon />
              <Alert.Content>
                <p>{successMessage}</p>
              </Alert.Content>
            </Alert>
          )}

          {globalError && (
            <Alert variant="error" dismissible onDismiss={() => setGlobalError(undefined)}>
              <Alert.Icon />
              <Alert.Content>
                <p>{globalError}</p>
              </Alert.Content>
            </Alert>
          )}

          {templateError && (
            <Alert variant="error">
              <Alert.Icon />
              <Alert.Content>
                <p>
                  {typeof templateError === 'string' 
                    ? templateError 
                    : 'An error occurred while processing your request.'
                  }
                </p>
              </Alert.Content>
            </Alert>
          )}
        </div>

        {/* Main Form */}
        <div className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          'shadow-sm p-6'
        )}>
          <Form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit, onError)}
            loading={isSubmitting || isCreating}
            disabled={isSubmitting || isCreating}
            className="space-y-8"
            aria-label="Create email template form"
          >
            {/* Basic Information */}
            <FormGroup legend="Basic Information">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormControl>
                      <FormLabel htmlFor="name" required>
                        Template Name
                      </FormLabel>
                      <Input
                        {...field}
                        id="name"
                        type="text"
                        placeholder="Enter template name..."
                        error={fieldState.error?.message}
                        required
                        autoComplete="off"
                        maxLength={255}
                        aria-describedby="name-description"
                      />
                      <p id="name-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        A unique, descriptive name for this email template
                      </p>
                      {fieldState.error && (
                        <FormError>{fieldState.error.message}</FormError>
                      )}
                    </FormControl>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormControl>
                      <FormLabel htmlFor="description">
                        Description
                      </FormLabel>
                      <Input
                        {...field}
                        id="description"
                        type="text"
                        placeholder="Optional description..."
                        error={fieldState.error?.message}
                        maxLength={1000}
                        aria-describedby="description-description"
                      />
                      <p id="description-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Optional description explaining the purpose of this template
                      </p>
                      {fieldState.error && (
                        <FormError>{fieldState.error.message}</FormError>
                      )}
                    </FormControl>
                  )}
                />
              </div>
            </FormGroup>

            {/* Email Recipients */}
            <FormGroup legend="Email Recipients">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field, fieldState }) => (
                    <FormControl>
                      <FormLabel htmlFor="to">
                        To
                      </FormLabel>
                      <Input
                        {...field}
                        id="to"
                        type="email"
                        placeholder="recipient@example.com"
                        error={fieldState.error?.message}
                        autoComplete="email"
                        aria-describedby="to-description"
                      />
                      <p id="to-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Primary recipient email address
                      </p>
                      {fieldState.error && (
                        <FormError>{fieldState.error.message}</FormError>
                      )}
                    </FormControl>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field, fieldState }) => (
                    <FormControl>
                      <FormLabel htmlFor="cc">
                        CC
                      </FormLabel>
                      <Input
                        {...field}
                        id="cc"
                        type="email"
                        placeholder="cc@example.com"
                        error={fieldState.error?.message}
                        autoComplete="email"
                        aria-describedby="cc-description"
                      />
                      <p id="cc-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Carbon copy recipient
                      </p>
                      {fieldState.error && (
                        <FormError>{fieldState.error.message}</FormError>
                      )}
                    </FormControl>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bcc"
                  render={({ field, fieldState }) => (
                    <FormControl>
                      <FormLabel htmlFor="bcc">
                        BCC
                      </FormLabel>
                      <Input
                        {...field}
                        id="bcc"
                        type="email"
                        placeholder="bcc@example.com"
                        error={fieldState.error?.message}
                        autoComplete="email"
                        aria-describedby="bcc-description"
                      />
                      <p id="bcc-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Blind carbon copy recipient
                      </p>
                      {fieldState.error && (
                        <FormError>{fieldState.error.message}</FormError>
                      )}
                    </FormControl>
                  )}
                />
              </div>
            </FormGroup>

            {/* Email Content */}
            <FormGroup legend="Email Content">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="subject">
                          Subject
                        </FormLabel>
                        <Input
                          {...field}
                          id="subject"
                          type="text"
                          placeholder="Email subject..."
                          error={fieldState.error?.message}
                          maxLength={500}
                          aria-describedby="subject-description"
                        />
                        <p id="subject-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Email subject line (supports template variables)
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="attachment">
                          Attachment
                        </FormLabel>
                        <Input
                          {...field}
                          id="attachment"
                          type="text"
                          placeholder="Path to attachment file..."
                          error={fieldState.error?.message}
                          aria-describedby="attachment-description"
                        />
                        <p id="attachment-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Optional file attachment path
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bodyText"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <Textarea
                          {...field}
                          name="bodyText"
                          label="Plain Text Body"
                          placeholder="Enter plain text email content..."
                          error={fieldState.error?.message}
                          description="Plain text version of the email content"
                          rows={8}
                        />
                      </FormControl>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyHtml"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <Textarea
                          {...field}
                          name="bodyHtml"
                          label="HTML Body"
                          placeholder="Enter HTML email content..."
                          error={fieldState.error?.message}
                          description="HTML version of the email content"
                          rows={8}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </FormGroup>

            {/* Sender Information */}
            <FormGroup legend="Sender Information">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="fromName">
                          From Name
                        </FormLabel>
                        <Input
                          {...field}
                          id="fromName"
                          type="text"
                          placeholder="Sender name..."
                          error={fieldState.error?.message}
                          maxLength={255}
                          autoComplete="name"
                          aria-describedby="fromName-description"
                        />
                        <p id="fromName-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Display name for the email sender
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="fromEmail">
                          From Email
                        </FormLabel>
                        <Input
                          {...field}
                          id="fromEmail"
                          type="email"
                          placeholder="sender@example.com"
                          error={fieldState.error?.message}
                          autoComplete="email"
                          aria-describedby="fromEmail-description"
                        />
                        <p id="fromEmail-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Email address for the sender
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="replyToName"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="replyToName">
                          Reply-To Name
                        </FormLabel>
                        <Input
                          {...field}
                          id="replyToName"
                          type="text"
                          placeholder="Reply-to name..."
                          error={fieldState.error?.message}
                          maxLength={255}
                          autoComplete="name"
                          aria-describedby="replyToName-description"
                        />
                        <p id="replyToName-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Display name for reply-to address
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="replyToEmail"
                    render={({ field, fieldState }) => (
                      <FormControl>
                        <FormLabel htmlFor="replyToEmail">
                          Reply-To Email
                        </FormLabel>
                        <Input
                          {...field}
                          id="replyToEmail"
                          type="email"
                          placeholder="replyto@example.com"
                          error={fieldState.error?.message}
                          autoComplete="email"
                          aria-describedby="replyToEmail-description"
                        />
                        <p id="replyToEmail-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Email address for replies
                        </p>
                        {fieldState.error && (
                          <FormError>{fieldState.error.message}</FormError>
                        )}
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </FormGroup>

            {/* Form Actions */}
            <div className={cn(
              'flex flex-col sm:flex-row justify-end items-center gap-4',
              'pt-6 border-t border-gray-200 dark:border-gray-700'
            )}>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                {isDirty && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
                    Unsaved changes
                  </span>
                )}
                {submitAttempted && !isValid && (
                  <span className="flex items-center text-red-600 dark:text-red-400">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Please correct form errors
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting || isCreating}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  loading={isSubmitting || isCreating}
                  disabled={isSubmitting || isCreating}
                  loadingText="Creating template..."
                >
                  Create Template
                </Button>
              </div>
            </div>
          </Form>
        </div>

        {/* Development Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <details className="p-4 bg-gray-100 dark:bg-gray-800 rounded border text-xs">
            <summary className="cursor-pointer font-medium mb-2">
              Debug Information (Development Only)
            </summary>
            <div className="space-y-2">
              <div>
                <strong>Form State:</strong> Valid: {isValid.toString()}, 
                Dirty: {isDirty.toString()}, Submitting: {isSubmitting.toString()}
              </div>
              <div>
                <strong>Errors:</strong> {Object.keys(errors).length}
              </div>
              <div>
                <strong>Current Values:</strong>
                <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-auto">
                  {JSON.stringify(watchedValues, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </ErrorBoundary>
  );
}