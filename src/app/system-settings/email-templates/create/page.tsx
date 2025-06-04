'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';

// Type imports (placeholder interfaces for missing dependencies)
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

interface ApiResponse<T> {
  resource?: T[];
  error?: {
    message: string;
    context?: {
      resource?: Array<{ message: string }>;
    };
  };
}

// Email template validation schema using Zod
const emailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(50, 'Template name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_\s-]+$/, 'Template name contains invalid characters'),
  
  description: z
    .string()
    .max(255, 'Description must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  to: z
    .string()
    .email('Invalid email format for recipient')
    .optional()
    .or(z.literal('')),
  
  cc: z
    .string()
    .email('Invalid email format for CC')
    .optional()
    .or(z.literal('')),
  
  bcc: z
    .string()
    .email('Invalid email format for BCC')
    .optional()
    .or(z.literal('')),
  
  subject: z
    .string()
    .max(200, 'Subject must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  attachment: z
    .string()
    .max(500, 'Attachment path must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  body: z
    .string()
    .max(10000, 'Body must be less than 10,000 characters')
    .optional()
    .or(z.literal('')),
  
  senderName: z
    .string()
    .max(100, 'Sender name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  senderEmail: z
    .string()
    .email('Invalid email format for sender')
    .optional()
    .or(z.literal('')),
  
  replyToName: z
    .string()
    .max(100, 'Reply-to name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  replyToEmail: z
    .string()
    .email('Invalid email format for reply-to')
    .optional()
    .or(z.literal(''))
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

// Mock API client function (placeholder for missing api-client)
const createEmailTemplate = async (payload: EmailTemplatePayload): Promise<ApiResponse<any>> => {
  const response = await fetch('/api/v2/system/email_template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_DF_API_KEY || '',
    },
    credentials: 'include',
    body: JSON.stringify({ resource: [payload] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create email template');
  }

  return response.json();
};

// Form input component with Tailwind styling
interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: any;
  required?: boolean;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  register,
  required = false,
  className = 'w-full'
}) => (
  <div className={`space-y-2 ${className}`}>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      {...register(id)}
      className={`block w-full rounded-md border shadow-sm px-3 py-2 text-sm
        ${error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:focus:border-primary-400'
        }
        dark:bg-gray-800 dark:text-white
        disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400
        focus:ring-1 focus:outline-none
        transition-colors duration-200
      `}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    )}
  </div>
);

// Textarea component with enhanced styling
interface FormTextareaProps {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  register: any;
  rows?: number;
  className?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  label,
  placeholder,
  error,
  register,
  rows = 4,
  className = 'w-full'
}) => (
  <div className={`space-y-2 ${className}`}>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      {...register(id)}
      className={`block w-full rounded-md border shadow-sm px-3 py-2 text-sm resize-vertical
        ${error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:focus:border-primary-400'
        }
        dark:bg-gray-800 dark:text-white
        disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400
        focus:ring-1 focus:outline-none
        transition-colors duration-200
      `}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    )}
  </div>
);

// Alert component for displaying messages
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose, className = '' }) => {
  const alertClasses = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`border rounded-md p-4 mb-6 animate-fade-in ${alertClasses[type]} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${iconClasses[type]}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            {type === 'success' && (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            )}
            {type === 'error' && (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
            {type === 'warning' && (
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            )}
            {type === 'info' && (
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            )}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${iconClasses[type]} hover:${iconClasses[type]}`}
            aria-label="Close alert"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Button component with variants
interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// Main email template creation page component
export default function CreateEmailTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setError
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      description: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      attachment: '',
      body: '',
      senderName: '',
      senderEmail: '',
      replyToName: '',
      replyToEmail: ''
    }
  });

  // Alert management functions
  const showAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertState({ show: true, type, message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, show: false }));
  }, []);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (!confirmed) return;
    }
    router.push('/system-settings/email-templates');
  }, [router, isDirty]);

  // Form submission handler
  const onSubmit = handleSubmit(async (data: EmailTemplateFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    hideAlert();

    try {
      // Transform form data to API payload
      const payload: EmailTemplatePayload = {
        name: data.name,
        description: data.description || undefined,
        to: data.to || undefined,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        subject: data.subject || undefined,
        attachment: data.attachment || undefined,
        bodyHtml: data.body || undefined,
        fromName: data.senderName || undefined,
        fromEmail: data.senderEmail || undefined,
        replyToName: data.replyToName || undefined,
        replyToEmail: data.replyToEmail || undefined
      };

      // Create email template via API
      await createEmailTemplate(payload);
      
      // Invalidate SWR cache for email templates list
      await mutate('/api/v2/system/email_template');
      
      // Show success message
      showAlert('success', 'Email template created successfully!');
      
      // Reset form and navigate back after short delay
      setTimeout(() => {
        reset();
        router.push('/system-settings/email-templates');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating email template:', error);
      
      // Handle validation errors from server
      if (error.message && error.message.includes('validation')) {
        setError('name', { message: 'Template name already exists or is invalid' });
        showAlert('error', 'Please check the template name and try again.');
      } else {
        showAlert('error', error.message || 'Failed to create email template. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Email Template
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new email template for system notifications and communications.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleGoBack}
              className="flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Templates
            </Button>
          </div>
        </div>

        {/* Alert Component */}
        {alertState.show && (
          <Alert
            type={alertState.type}
            message={alertState.message}
            onClose={hideAlert}
          />
        )}

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  id="name"
                  label="Template Name"
                  placeholder="Enter template name"
                  register={register}
                  error={errors.name?.message}
                  required
                  className="sm:col-span-1"
                />
                <FormInput
                  id="description"
                  label="Description"
                  placeholder="Enter template description"
                  register={register}
                  error={errors.description?.message}
                  className="sm:col-span-1"
                />
              </div>
            </div>

            {/* Recipients Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recipients
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <FormInput
                  id="to"
                  label="To"
                  type="email"
                  placeholder="recipient@example.com"
                  register={register}
                  error={errors.to?.message}
                />
                <FormInput
                  id="cc"
                  label="CC"
                  type="email"
                  placeholder="cc@example.com"
                  register={register}
                  error={errors.cc?.message}
                />
                <FormInput
                  id="bcc"
                  label="BCC"
                  type="email"
                  placeholder="bcc@example.com"
                  register={register}
                  error={errors.bcc?.message}
                />
              </div>
            </div>

            {/* Email Content Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Email Content
              </h2>
              <div className="space-y-6">
                <FormInput
                  id="subject"
                  label="Subject"
                  placeholder="Enter email subject"
                  register={register}
                  error={errors.subject?.message}
                />
                <FormInput
                  id="attachment"
                  label="Attachment"
                  placeholder="Enter attachment path"
                  register={register}
                  error={errors.attachment?.message}
                />
                <FormTextarea
                  id="body"
                  label="Email Body"
                  placeholder="Enter email body content (HTML supported)"
                  register={register}
                  error={errors.body?.message}
                  rows={8}
                />
              </div>
            </div>

            {/* Sender Information Section */}
            <div className="pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Sender Information
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  id="senderName"
                  label="Sender Name"
                  placeholder="Enter sender name"
                  register={register}
                  error={errors.senderName?.message}
                />
                <FormInput
                  id="senderEmail"
                  label="Sender Email"
                  type="email"
                  placeholder="sender@example.com"
                  register={register}
                  error={errors.senderEmail?.message}
                />
                <FormInput
                  id="replyToName"
                  label="Reply-To Name"
                  placeholder="Enter reply-to name"
                  register={register}
                  error={errors.replyToName?.message}
                />
                <FormInput
                  id="replyToEmail"
                  label="Reply-To Email"
                  type="email"
                  placeholder="replyto@example.com"
                  register={register}
                  error={errors.replyToEmail?.message}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            <strong>Note:</strong> Template names must be unique and contain only letters, numbers, spaces, hyphens, and underscores.
            Email addresses will be validated for proper format. HTML content is supported in the email body.
          </p>
        </div>
      </div>
    </div>
  );
}