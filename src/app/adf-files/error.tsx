'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  DocumentIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  ClockIcon,
  WifiIcon,
  LockClosedIcon,
  ServerIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

// Enhanced error types for file operations
interface FileOperationError extends Error {
  code?: string;
  statusCode?: number;
  operation?: 'upload' | 'download' | 'delete' | 'rename' | 'move' | 'list' | 'read' | 'write';
  fileName?: string;
  fileSize?: number;
  retryable?: boolean;
  originalError?: Error;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: FileOperationError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showRetryButton?: boolean;
  showReportButton?: boolean;
}

/**
 * Enhanced error boundary component for file management operations
 * Handles upload failures, network errors, permission issues, and file system errors
 * Provides user-friendly error messages with recovery options and retry mechanisms
 */
export class FileOperationErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger error UI
    return {
      hasError: true,
      error: error as FileOperationError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('File Operation Error Boundary caught an error:', error, errorInfo);
    }

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error to error reporting service
    this.logError(error as FileOperationError, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Enhanced error logging with file operation context
   */
  private logError = async (error: FileOperationError, errorInfo?: ErrorInfo) => {
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          operation: error.operation,
          fileName: error.fileName,
          fileSize: error.fileSize,
          stack: error.stack,
        },
        errorInfo: errorInfo ? {
          componentStack: errorInfo.componentStack,
        } : undefined,
        context: {
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          timestamp: Date.now(),
        },
        retryCount: this.state.retryCount,
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('File Operation Error Log:', errorData);
      }

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
        // await errorReportingService.captureException(errorData);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  /**
   * Determine if an error is retryable based on its characteristics
   */
  private isRetryableError = (error: FileOperationError): boolean => {
    // Explicitly marked as retryable
    if (error.retryable === true) return true;
    if (error.retryable === false) return false;

    // Network-related errors are generally retryable
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') return true;
    
    // Server errors (5xx) are retryable
    if (error.statusCode && error.statusCode >= 500) return true;
    
    // Rate limiting is retryable
    if (error.statusCode === 429) return true;
    
    // Client errors (4xx) are generally not retryable
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false;
    
    // File size errors for chunked uploads might be retryable
    if (error.code === 'FILE_TOO_LARGE' && error.operation === 'upload') return true;
    
    return false;
  };

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage = (error: FileOperationError): { title: string; description: string; icon: React.ComponentType<any> } => {
    const operation = error.operation || 'file operation';
    
    // Network-related errors
    if (error.code === 'NETWORK_ERROR') {
      return {
        title: 'Connection Error',
        description: `Unable to connect to the server during ${operation}. Please check your internet connection and try again.`,
        icon: WifiIcon,
      };
    }
    
    if (error.code === 'TIMEOUT') {
      return {
        title: 'Request Timeout',
        description: `The ${operation} operation took too long to complete. This may be due to a large file size or slow connection.`,
        icon: ClockIcon,
      };
    }
    
    // Permission-related errors
    if (error.statusCode === 403 || error.code === 'PERMISSION_DENIED') {
      return {
        title: 'Access Denied',
        description: `You don't have permission to perform this ${operation} operation. Please contact your administrator.`,
        icon: LockClosedIcon,
      };
    }
    
    if (error.statusCode === 401) {
      return {
        title: 'Authentication Required',
        description: 'Your session has expired. Please log in again to continue.',
        icon: LockClosedIcon,
      };
    }
    
    // File-specific errors
    if (error.code === 'FILE_NOT_FOUND' || error.statusCode === 404) {
      return {
        title: 'File Not Found',
        description: error.fileName 
          ? `The file "${error.fileName}" could not be found. It may have been moved or deleted.`
          : 'The requested file could not be found.',
        icon: DocumentIcon,
      };
    }
    
    if (error.code === 'FILE_TOO_LARGE') {
      return {
        title: 'File Too Large',
        description: error.fileSize 
          ? `The file "${error.fileName}" (${this.formatFileSize(error.fileSize)}) exceeds the maximum upload size.`
          : 'The selected file is too large to upload.',
        icon: DocumentIcon,
      };
    }
    
    if (error.code === 'UNSUPPORTED_FILE_TYPE') {
      return {
        title: 'Unsupported File Type',
        description: error.fileName 
          ? `The file type of "${error.fileName}" is not supported.`
          : 'This file type is not supported.',
        icon: DocumentIcon,
      };
    }
    
    if (error.code === 'DISK_FULL' || error.code === 'STORAGE_QUOTA_EXCEEDED') {
      return {
        title: 'Storage Full',
        description: 'There is not enough storage space available to complete this operation.',
        icon: FolderIcon,
      };
    }
    
    // Server errors
    if (error.statusCode && error.statusCode >= 500) {
      return {
        title: 'Server Error',
        description: `A server error occurred during the ${operation} operation. Please try again later.`,
        icon: ServerIcon,
      };
    }
    
    // Generic errors
    return {
      title: 'Operation Failed',
      description: error.message || `An unexpected error occurred during the ${operation} operation.`,
      icon: ExclamationTriangleIcon,
    };
  };

  /**
   * Format file size for display
   */
  private formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Handle retry operation with exponential backoff
   */
  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount >= maxRetries) {
      return;
    }
    
    this.setState({ isRetrying: true });
    
    // Calculate exponential backoff delay
    const delay = retryDelay * Math.pow(2, retryCount);
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastRetryTime: Date.now(),
      }));
    }, delay);
  };

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
    });
  };

  /**
   * Navigate back to file list or previous page
   */
  private handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to file list route
      window.location.href = '/adf-files';
    }
  };

  /**
   * Report error to administrators
   */
  private handleReportError = async () => {
    try {
      // Send detailed error report
      const errorReport = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
      };
      
      // In a real implementation, this would send to a reporting service
      console.log('Error report generated:', errorReport);
      
      // Show success message
      alert('Error report has been sent. Thank you for helping us improve the application.');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      alert('Failed to send error report. Please try again later.');
    }
  };

  render() {
    const { children, fallback, maxRetries = 3, showRetryButton = true, showReportButton = true } = this.props;
    const { hasError, error, isRetrying, retryCount } = this.state;

    if (hasError && error) {
      const { title, description, icon: Icon } = this.getErrorMessage(error);
      const canRetry = showRetryButton && this.isRetryableError(error) && retryCount < maxRetries;
      
      // Return custom fallback if provided
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {/* Error Icon and Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Icon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6">
                  <details className="group cursor-pointer">
                    <summary className="text-xs font-medium text-gray-500 hover:text-gray-700 list-none">
                      <span className="inline-flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Error Details (Development)
                        <svg className="w-4 h-4 ml-1 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify({
                          name: error.name,
                          message: error.message,
                          code: error.code,
                          statusCode: error.statusCode,
                          operation: error.operation,
                          fileName: error.fileName,
                          retryCount,
                        }, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="mb-6 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Retry Button */}
                {canRetry && (
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    disabled={isRetrying}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRetrying ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                        Try Again
                      </>
                    )}
                  </button>
                )}

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Start Over
                </button>

                {/* Go Back Button */}
                <button
                  type="button"
                  onClick={this.handleGoBack}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FolderIcon className="-ml-1 mr-2 h-4 w-4" />
                  Back to Files
                </button>

                {/* Report Error Button */}
                {showReportButton && (
                  <button
                    type="button"
                    onClick={this.handleReportError}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Report Issue
                  </button>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with file operation error boundary
 */
export function withFileErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WithFileErrorBoundaryComponent = (props: P) => (
    <FileOperationErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </FileOperationErrorBoundary>
  );
  
  WithFileErrorBoundaryComponent.displayName = `withFileErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithFileErrorBoundaryComponent;
}

/**
 * Hook for throwing file operation errors that will be caught by the error boundary
 */
export function useFileOperationError() {
  const throwFileError = (
    message: string,
    options: Partial<FileOperationError> = {}
  ) => {
    const error = new Error(message) as FileOperationError;
    Object.assign(error, options);
    throw error;
  };

  return { throwFileError };
}

/**
 * Utility function to create standardized file operation errors
 */
export const createFileOperationError = (
  type: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'FILE_NOT_FOUND' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FILE_TYPE' | 'TIMEOUT' | 'DISK_FULL',
  operation: FileOperationError['operation'],
  fileName?: string,
  additionalData?: Partial<FileOperationError>
): FileOperationError => {
  const errorMessages = {
    NETWORK_ERROR: 'Network connection failed',
    PERMISSION_DENIED: 'Access denied',
    FILE_NOT_FOUND: 'File not found',
    FILE_TOO_LARGE: 'File exceeds size limit',
    UNSUPPORTED_FILE_TYPE: 'File type not supported',
    TIMEOUT: 'Operation timed out',
    DISK_FULL: 'Storage space full',
  };

  const error = new Error(errorMessages[type]) as FileOperationError;
  error.code = type;
  error.operation = operation;
  error.fileName = fileName;
  
  // Set retryable status based on error type
  switch (type) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'DISK_FULL':
      error.retryable = true;
      break;
    case 'PERMISSION_DENIED':
    case 'FILE_NOT_FOUND':
    case 'UNSUPPORTED_FILE_TYPE':
      error.retryable = false;
      break;
    case 'FILE_TOO_LARGE':
      error.retryable = operation === 'upload'; // Might be retryable with chunked upload
      break;
  }

  return Object.assign(error, additionalData);
};

// Export the main error boundary as default
export default FileOperationErrorBoundary;