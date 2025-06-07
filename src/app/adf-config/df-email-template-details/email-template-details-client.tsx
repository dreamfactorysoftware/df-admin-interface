/**
 * Email Template Details Client Component
 * 
 * Client-side React component that handles the interactive functionality for
 * email template details page including data fetching, form state management,
 * and navigation. Integrates with React Hook Form, SWR caching, and provides
 * comprehensive error handling and loading states.
 * 
 * Features:
 * - SWR/React Query for intelligent caching and synchronization per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per performance requirements
 * - Real-time validation under 100ms with React Hook Form
 * - Tailwind CSS 4.1+ styling with dark mode support
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design with breakpoint-aware layouts
 * - Error boundary integration with proper fallback states
 * 
 * @fileoverview Client component for email template details page
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

// Import hooks and utilities
import { useEmailTemplate, type EmailTemplate } from './use-email-template';
import { EmailTemplateForm } from './email-template-form';
import { useTheme } from '@/hooks/use-theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';

// Import UI components (referenced but may not exist yet)
// import { Alert } from '@/components/ui/alert';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Props interface for EmailTemplateDetailsClient component
 */
export interface EmailTemplateDetailsClientProps {
  /** Template ID for edit mode (null for create) */
  templateId: number | null;
  
  /** Whether component is in edit mode */
  isEdit: boolean;
  
  /** Current mode of operation */
  mode: 'create' | 'edit';
  
  /** Initial error from server-side rendering */
  initialError?: string | null;
}

/**
 * Navigation state interface
 */
interface NavigationState {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  
  /** Target path for navigation */
  targetPath: string | null;
  
  /** Navigation delay for UX smoothness */
  navigationDelay: number;
}

/**
 * Page state interface for comprehensive state management
 */
interface PageState {
  /** Whether the page has mounted (for SSR compatibility) */
  mounted: boolean;
  
  /** Whether the component is in readonly mode */
  readonly: boolean;
  
  /** Current operation being performed */
  currentOperation: 'none' | 'saving' | 'loading' | 'deleting' | 'navigating';
  
  /** User confirmation states */
  confirmation: {
    show: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  };
}

// ============================================================================
// ALERT COMPONENT (PLACEHOLDER)
// ============================================================================

/**
 * Temporary alert component until the full UI library is available
 */
const Alert: React.FC<{
  variant?: 'error' | 'warning' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'info', children, className = '' }) => {
  const { resolvedTheme } = useTheme();
  
  const variantStyles = {
    error: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200',
    success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const iconMap = {
    error: XCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: AlertTriangle,
  };

  const Icon = iconMap[variant];

  return (
    <div className={`rounded-md border p-4 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

/**
 * Email Template Details Client Component
 * 
 * Handles all client-side interactions for email template management including
 * data fetching, form submission, navigation, and error handling.
 */
export function EmailTemplateDetailsClient({
  templateId,
  isEdit,
  mode,
  initialError = null,
}: EmailTemplateDetailsClientProps): React.ReactElement {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, mounted: themeLoaded } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Page state management
  const [pageState, setPageState] = useState<PageState>({
    mounted: false,
    readonly: false,
    currentOperation: 'none',
    confirmation: {
      show: false,
      title: '',
      message: '',
      action: null,
    },
  });

  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    targetPath: null,
    navigationDelay: 300, // ms
  });

  // Error state management
  const [clientError, setClientError] = useState<string | null>(initialError);

  // Email template data fetching
  const {
    useEmailTemplateDetail,
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    invalidateEmailTemplateList,
  } = useEmailTemplate({
    onSuccess: (data) => {
      console.log('Operation successful:', data);
      setClientError(null);
    },
    onError: (error) => {
      console.error('Operation failed:', error);
      setClientError(error.message || 'An unexpected error occurred');
    },
  });

  // Fetch email template data for edit mode
  const {
    data: emailTemplateResponse,
    isLoading: isLoadingTemplate,
    error: fetchError,
    mutate: refetchTemplate,
  } = useEmailTemplateDetail(templateId || 0, {
    onError: (error) => {
      console.error('Failed to fetch email template:', error);
      setClientError(error.message || 'Failed to load email template');
    },
  });

  // Mutation hooks
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const emailTemplate = emailTemplateResponse?.resource || null;
  const isLoading = isLoadingTemplate || createMutation.isPending || updateMutation.isPending;
  const hasError = !!clientError || !!fetchError;
  const errorMessage = clientError || fetchError?.message || null;

  // Page title computation
  const pageTitle = useMemo(() => {
    if (isEdit && emailTemplate) {
      return `Edit "${emailTemplate.name}"`;
    }
    return isEdit ? `Edit Email Template #${templateId}` : 'Create Email Template';
  }, [isEdit, emailTemplate, templateId]);

  // Breadcrumb computation
  const breadcrumbs = useMemo(() => [
    { label: 'System Settings', href: '/adf-config' },
    { label: 'Email Templates', href: '/adf-config/df-email-templates' },
    { label: pageTitle, href: '', current: true },
  ], [pageTitle]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle successful form submission
   */
  const handleFormSuccess = useCallback(async (template: EmailTemplate) => {
    console.log('Form submitted successfully:', template);
    
    // Invalidate list cache to ensure fresh data
    await invalidateEmailTemplateList();
    
    // Navigate back to list with success state
    handleNavigation('/adf-config/df-email-templates', {
      message: isEdit 
        ? `Email template "${template.name}" updated successfully`
        : `Email template "${template.name}" created successfully`,
      type: 'success',
    });
  }, [isEdit, invalidateEmailTemplateList]);

  /**
   * Handle form cancellation
   */
  const handleFormCancel = useCallback(() => {
    // Check if there are unsaved changes (this would be handled by the form component)
    handleNavigation('/adf-config/df-email-templates');
  }, []);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (navigationState.isNavigating) return;
    
    handleNavigation('/adf-config/df-email-templates');
  }, [navigationState.isNavigating]);

  /**
   * Handle navigation with optional state
   */
  const handleNavigation = useCallback((
    path: string,
    state?: { message: string; type: 'success' | 'error' | 'info' }
  ) => {
    if (navigationState.isNavigating) return;

    setNavigationState({
      isNavigating: true,
      targetPath: path,
      navigationDelay: 300,
    });

    setPageState(prev => ({
      ...prev,
      currentOperation: 'navigating',
    }));

    // Add smooth transition delay
    setTimeout(() => {
      try {
        if (state) {
          // Store state in sessionStorage for display on target page
          sessionStorage.setItem('df-admin-notification', JSON.stringify(state));
        }
        router.push(path);
      } catch (error) {
        console.error('Navigation failed:', error);
        setNavigationState({
          isNavigating: false,
          targetPath: null,
          navigationDelay: 300,
        });
        setPageState(prev => ({
          ...prev,
          currentOperation: 'none',
        }));
      }
    }, navigationState.navigationDelay);
  }, [router, navigationState.isNavigating, navigationState.navigationDelay]);

  /**
   * Handle template data refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!isEdit || !templateId) return;

    setPageState(prev => ({ ...prev, currentOperation: 'loading' }));
    setClientError(null);

    try {
      await refetchTemplate();
    } catch (error) {
      console.error('Refresh failed:', error);
      setClientError(error instanceof Error ? error.message : 'Failed to refresh data');
    } finally {
      setPageState(prev => ({ ...prev, currentOperation: 'none' }));
    }
  }, [isEdit, templateId, refetchTemplate]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Mark component as mounted for SSR compatibility
   */
  useEffect(() => {
    setPageState(prev => ({ ...prev, mounted: true }));
  }, []);

  /**
   * Handle template not found in edit mode
   */
  useEffect(() => {
    if (isEdit && templateId && !isLoadingTemplate && !emailTemplate && !hasError) {
      // Template not found - redirect to create mode
      console.warn(`Email template #${templateId} not found`);
      setClientError(`Email template #${templateId} was not found`);
    }
  }, [isEdit, templateId, isLoadingTemplate, emailTemplate, hasError]);

  /**
   * Cleanup navigation state on unmount
   */
  useEffect(() => {
    return () => {
      setNavigationState({
        isNavigating: false,
        targetPath: null,
        navigationDelay: 300,
      });
    };
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render page header with title and actions
   */
  const renderPageHeader = (): React.ReactElement => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={navigationState.isNavigating}
              className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50"
              aria-label="Go back to email templates list"
            >
              <ArrowLeft className="h-5 w-5" />
              {!isMobile && <span className="ml-2">Back</span>}
            </button>

            {/* Page Title and Breadcrumbs */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pageTitle}
              </h1>
              {!isMobile && (
                <nav className="flex mt-1" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={crumb.href || index} className="flex items-center">
                        {index > 0 && (
                          <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                        )}
                        {crumb.current ? (
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {crumb.label}
                          </span>
                        ) : (
                          <button
                            onClick={() => crumb.href && handleNavigation(crumb.href)}
                            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                          >
                            {crumb.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isEdit && !isLoading && (
              <button
                onClick={handleRefresh}
                disabled={navigationState.isNavigating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50"
                aria-label="Refresh template data"
              >
                <RefreshCw className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Refresh</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render error state
   */
  const renderErrorState = (): React.ReactElement => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Alert variant="error" className="mb-6">
        <div>
          <h3 className="text-sm font-medium mb-2">
            {isEdit ? 'Failed to Load Email Template' : 'Email Template Error'}
          </h3>
          <p className="text-sm">{errorMessage}</p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-sm bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-200 px-3 py-1 rounded-md hover:bg-error-200 dark:hover:bg-error-900/50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
            >
              Try Again
            </button>
            <button
              onClick={handleBack}
              className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </Alert>
    </div>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = (): React.ReactElement => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin mr-3" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {isEdit ? 'Loading email template...' : 'Preparing form...'}
          </span>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Wait for client-side hydration and theme loading
  if (!pageState.mounted || !themeLoaded) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Page Header */}
      {renderPageHeader()}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && renderLoadingState()}

        {/* Error State */}
        {hasError && !isLoading && renderErrorState()}

        {/* Form Content */}
        {!hasError && !isLoading && (
          <div className="space-y-6">
            {/* Navigation Loading Overlay */}
            {navigationState.isNavigating && (
              <Alert variant="info">
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Navigating...</span>
                </div>
              </Alert>
            )}

            {/* Email Template Form */}
            <EmailTemplateForm
              emailTemplate={emailTemplate}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              isEditing={isEdit}
              showCancelButton={true}
              autoFocus={!isMobile}
              className="animate-fade-in"
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EmailTemplateDetailsClient;
export type { EmailTemplateDetailsClientProps, NavigationState, PageState };