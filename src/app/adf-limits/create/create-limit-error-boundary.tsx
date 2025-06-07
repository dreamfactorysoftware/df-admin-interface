/**
 * Error boundary component for create limit page.
 * 
 * Implements React 19 error boundary patterns with fallback UI rendering
 * and comprehensive error logging. Provides graceful degradation when
 * the create limit form encounters unexpected errors, maintaining user
 * experience and providing actionable recovery options.
 * 
 * @fileoverview Error boundary for create limit functionality
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import type { ApiErrorResponse } from '../../../types/api';

// ============================================================================
// Error Boundary State and Props Types
// ============================================================================

/**
 * Props for the CreateLimitErrorBoundary component
 */
interface CreateLimitErrorBoundaryProps {
  /** Child components to render when no error */
  children: ReactNode;
  
  /** Optional fallback component override */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  
  /** Optional error reporting callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Whether to show retry functionality */
  showRetry?: boolean;
}

/**
 * State for the error boundary component
 */
interface CreateLimitErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  
  /** The caught error object */
  error: Error | null;
  
  /** React error information */
  errorInfo: ErrorInfo | null;
  
  /** Error occurrence timestamp */
  errorTime: Date | null;
  
  /** Number of retry attempts */
  retryCount: number;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * CreateLimitErrorBoundary - React Error Boundary for Create Limit Page
 * 
 * Provides comprehensive error capture and graceful fallback UI for the
 * create limit workflow. Implements React 19 error boundary patterns with
 * enhanced error reporting and user recovery options.
 */
export class CreateLimitErrorBoundary extends Component<
  CreateLimitErrorBoundaryProps,
  CreateLimitErrorBoundaryState
> {
  /**
   * Maximum number of automatic retry attempts
   */
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Constructor - Initialize error boundary state
   */
  constructor(props: CreateLimitErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorTime: null,
      retryCount: 0
    };
  }

  /**
   * Static method to update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<CreateLimitErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorTime: new Date()
    };
  }

  /**
   * Handle component error with logging and notification
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error information
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Log error details for debugging
    console.error('CreateLimitErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    });

    // Call optional error reporting callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show user notification
    toast.error('Something went wrong', {
      description: 'The form encountered an unexpected error. Please try refreshing the page.',
      duration: 10000
    });

    // Report to error monitoring service (if available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        page_title: 'Create Limit Form Error'
      });
    }
  }

  /**
   * Reset error boundary state for retry functionality
   */
  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorTime: null
      // Keep retryCount for tracking
    });
  };

  /**
   * Navigate back to limits list
   */
  private navigateToLimitsList = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/adf-limits';
    }
  };

  /**
   * Refresh the current page
   */
  private refreshPage = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /**
   * Render method - Show error fallback or children
   */
  render(): ReactNode {
    // If error occurred, render fallback UI
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.resetErrorBoundary
        );
      }

      // Default fallback UI
      return this.renderDefaultErrorFallback();
    }

    // No error - render children normally
    return this.props.children;
  }

  /**
   * Render the default error fallback UI
   */
  private renderDefaultErrorFallback(): ReactNode {
    const { error, errorTime, retryCount } = this.state;
    const { showRetry = true } = this.props;
    
    const canRetry = retryCount < CreateLimitErrorBoundary.MAX_RETRY_ATTEMPTS;
    const isFormError = error?.message?.includes('form') || error?.message?.includes('validation');

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                />
              </svg>
            </div>
            
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800">
                {isFormError ? 'Form Error' : 'Unexpected Error'}
              </h3>
              
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  {isFormError 
                    ? 'The limit creation form encountered a validation or processing error.'
                    : 'An unexpected error occurred while loading the limit creation form.'
                  }
                </p>
                
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium hover:text-red-800">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono">
                    <p><strong>Message:</strong> {error?.message || 'Unknown error'}</p>
                    {errorTime && (
                      <p><strong>Time:</strong> {errorTime.toLocaleString()}</p>
                    )}
                    <p><strong>Attempts:</strong> {retryCount}</p>
                  </div>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {showRetry && canRetry && (
                  <button
                    type="button"
                    onClick={this.resetErrorBoundary}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg 
                      className="mr-2 h-4 w-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5} 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
                      />
                    </svg>
                    Try Again
                  </button>
                )}

                <button
                  type="button"
                  onClick={this.refreshPage}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg 
                    className="mr-2 h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
                    />
                  </svg>
                  Refresh Page
                </button>

                <button
                  type="button"
                  onClick={this.navigateToLimitsList}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <svg 
                    className="mr-2 h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" 
                    />
                  </svg>
                  Back to Limits
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 text-xs text-red-600">
                <p>
                  If this error persists, please contact your system administrator 
                  or check the browser console for additional details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Error Information */}
        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Development Error Information
            </h4>
            <pre className="text-xs text-gray-700 overflow-auto">
              {this.state.errorInfo.componentStack}
            </pre>
          </div>
        )}
      </div>
    );
  }
}

// ============================================================================
// Functional Error Boundary Hook (React 19 alternative)
// ============================================================================

/**
 * Hook-based error boundary for functional components (React 19 pattern)
 * Can be used as an alternative to class-based error boundaries
 */
export function useCreateLimitErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Create limit error caught:', error, errorInfo);
    
    toast.error('Form error occurred', {
      description: error.message || 'An unexpected error happened in the form.',
      duration: 8000
    });
  };

  return { handleError };
}

// ============================================================================
// Export Default
// ============================================================================

export default CreateLimitErrorBoundary;