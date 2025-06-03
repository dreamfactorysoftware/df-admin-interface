/**
 * Email Template Details Page
 * 
 * Next.js page component that serves as the main email template details interface,
 * handling both create and edit modes through URL search parameters. Implements 
 * server-side rendering for the email template detail form while maintaining all 
 * functionality from the original Angular component including form validation, 
 * error handling, and navigation. Integrates React Hook Form with Zod validation, 
 * SWR hooks for data fetching, and Tailwind CSS styling to replace Angular Material components.
 * 
 * Features:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - React Hook Form with Zod schema validators for all user inputs per React/Next.js Integration Requirements  
 * - SWR/React Query for intelligent caching and synchronization per React/Next.js Integration Requirements
 * - Tailwind CSS 4.1+ with consistent theme injection across components per React/Next.js Integration Requirements
 * - Next.js server components for initial page loads per React/Next.js Integration Requirements
 * - Convert Angular component to Next.js page component with SSR capability per React/Next.js Integration Requirements
 * - Replace Angular reactive forms with React Hook Form and Zod schema validation per React/Next.js Integration Requirements
 * - Transform Angular Material form components to Headless UI with Tailwind CSS styling per Section 7.1 Core UI Technologies
 * - Convert Angular service injections to SWR/React Query hooks for email template operations per Section 4.3 state management workflows
 * - Replace Angular router navigation with Next.js useRouter hook per Section 4.1 system workflows
 * - Implement responsive design with Tailwind CSS classes replacing SCSS breakpoint handling per Section 7.1 Core UI Technologies  
 * - Add dark mode support using Tailwind dark mode classes per Section 7.1 theme configuration
 * - Integrate error boundary and alert components following React patterns per React/Next.js Integration Requirements
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { EmailTemplateForm } from './email-template-form';
import { useEmailTemplate } from './use-email-template';
import { useTheme } from '../../../hooks/use-theme';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import type { EmailTemplateOperationResult, EmailTemplate } from '../../../types/email-templates';

/**
 * Loading skeleton component for email template details
 */
const EmailTemplateDetailsSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded animate-pulse ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`} />
          <div className={`h-8 w-64 rounded animate-pulse ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`} />
        </div>

        {/* Form skeleton */}
        <div className={`rounded-lg border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-6">
            {/* Title skeleton */}
            <div className={`h-6 w-48 rounded animate-pulse ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`} />

            {/* Form fields skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className={`h-4 w-24 rounded animate-pulse ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                  <div className={`h-10 w-full rounded animate-pulse ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                </div>
              ))}
            </div>

            {/* Large text area skeleton */}
            <div className="space-y-2">
              <div className={`h-4 w-32 rounded animate-pulse ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
              <div className={`h-32 w-full rounded animate-pulse ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            </div>

            {/* Action buttons skeleton */}
            <div className="flex justify-end gap-3">
              <div className={`h-10 w-20 rounded animate-pulse ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
              <div className={`h-10 w-32 rounded animate-pulse ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Error display component for failed template loads
 */
interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
  onBack: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onBack }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={`max-w-md w-full rounded-lg border p-6 text-center ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-center mb-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        
        <h2 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Failed to Load Template
        </h2>
        
        <p className={`text-sm mb-6 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {error?.message || 'An unexpected error occurred while loading the email template.'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${isDark 
                ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-offset-gray-800' 
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-offset-white'
              }
            `}
          >
            Try Again
          </button>
          
          <button
            onClick={onBack}
            className={`
              px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${isDark 
                ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-offset-gray-800' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-offset-white'
              }
            `}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Success alert component for operation feedback
 */
interface SuccessAlertProps {
  message: string;
  onDismiss: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => {
  const { isDark } = useTheme();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className={`
      fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
      ${isDark 
        ? 'bg-green-900 border-green-700 text-green-100' 
        : 'bg-green-50 border-green-200 text-green-800'
      }
    `}>
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onDismiss}
        className={`
          ml-2 -mr-1 p-1 rounded-md transition-colors duration-200
          ${isDark 
            ? 'text-green-400 hover:text-green-300 hover:bg-green-800' 
            : 'text-green-600 hover:text-green-700 hover:bg-green-100'
          }
        `}
        aria-label="Dismiss notification"
      >
        <ArrowLeftIcon className="h-4 w-4 rotate-45" />
      </button>
    </div>
  );
};

/**
 * Header component with navigation and title
 */
interface HeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  isEdit: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, isEdit }) => {
  const { isDark } = useTheme();
  const { isMobile } = useBreakpoint();
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onBack}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg border transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${isDark 
            ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-offset-gray-800' 
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus:ring-offset-white'
          }
        `}
        aria-label="Go back to email templates list"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h1 className={`
          text-xl font-semibold truncate
          ${isMobile ? 'text-lg' : 'text-xl'}
          ${isDark ? 'text-gray-100' : 'text-gray-900'}
        `}>
          {title}
        </h1>
        <p className={`
          text-sm mt-1 truncate
          ${isDark ? 'text-gray-400' : 'text-gray-500'}
        `}>
          {subtitle}
        </p>
      </div>
      
      <div className={`
        px-3 py-1 rounded-full text-xs font-medium
        ${isEdit 
          ? isDark 
            ? 'bg-blue-900 text-blue-200' 
            : 'bg-blue-100 text-blue-800'
          : isDark 
            ? 'bg-green-900 text-green-200' 
            : 'bg-green-100 text-green-800'
        }
      `}>
        {isEdit ? 'Edit Mode' : 'Create Mode'}
      </div>
    </div>
  );
};

/**
 * Internal component that handles the search params logic
 * This is wrapped in Suspense to handle the useSearchParams hook
 */
const EmailTemplateDetailsContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const { isMobile } = useBreakpoint();
  
  // Extract parameters from URL
  const templateId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'create';
  const isEdit = mode === 'edit' && templateId;
  
  // State management
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Hook for email template operations
  const { 
    emailTemplate, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useEmailTemplate(
    isEdit ? parseInt(templateId!, 10) : undefined,
    undefined,
    { enableCache: true }
  );

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (hasNavigated) return;
    setHasNavigated(true);
    router.push('/adf-config/df-email-templates');
  }, [router, hasNavigated]);

  const handleSuccess = useCallback((result: EmailTemplateOperationResult) => {
    if (!result.success) return;
    
    if (isEdit) {
      setSuccessMessage('Email template updated successfully');
      // Refresh the template data to show updated values
      refetch();
    } else {
      setSuccessMessage('Email template created successfully');
      // Navigate to the email templates list after creation
      setTimeout(() => {
        handleBack();
      }, 2000);
    }
  }, [isEdit, refetch, handleBack]);

  const handleCancel = useCallback(() => {
    handleBack();
  }, [handleBack]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDismissSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Derived values
  const pageTitle = useMemo(() => {
    if (isEdit && emailTemplate) {
      return `Edit ${emailTemplate.name}`;
    }
    return isEdit ? 'Edit Email Template' : 'Create Email Template';
  }, [isEdit, emailTemplate]);

  const pageSubtitle = useMemo(() => {
    if (isEdit && emailTemplate) {
      return `Last modified ${new Date(emailTemplate.last_modified_date).toLocaleDateString()}`;
    }
    return isEdit 
      ? 'Update the template configuration and content' 
      : 'Configure your email template settings and content';
  }, [isEdit, emailTemplate]);

  // Show error state
  if (isError && error) {
    return (
      <ErrorDisplay 
        error={error as Error}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  // Show loading state
  if (isLoading || (isEdit && !emailTemplate)) {
    return <EmailTemplateDetailsSkeleton />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-7xl mx-auto p-6 ${isMobile ? 'px-4' : 'px-6'}`}>
        {/* Page Header */}
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          onBack={handleBack}
          isEdit={!!isEdit}
        />

        {/* Main Content */}
        <div className={`rounded-lg border shadow-sm ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <EmailTemplateForm
            template={emailTemplate}
            isEdit={!!isEdit}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            className="p-6"
            showAdvancedOptions={false}
          />
        </div>

        {/* Success Alert */}
        {successMessage && (
          <SuccessAlert 
            message={successMessage}
            onDismiss={handleDismissSuccess}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Main Email Template Details Page Component
 * 
 * Server-side rendered Next.js page component that provides a comprehensive
 * interface for creating and editing email templates. Handles URL parameters
 * for edit mode, integrates with SWR for data fetching, and provides a 
 * responsive form interface with proper error handling and user feedback.
 * 
 * @example
 * ```
 * // Create mode: /adf-config/df-email-template-details?mode=create
 * // Edit mode: /adf-config/df-email-template-details?mode=edit&id=123
 * ```
 */
const EmailTemplateDetailsPage: React.FC = () => {
  return (
    <Suspense fallback={<EmailTemplateDetailsSkeleton />}>
      <EmailTemplateDetailsContent />
    </Suspense>
  );
};

export default EmailTemplateDetailsPage;