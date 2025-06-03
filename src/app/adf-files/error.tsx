'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, Upload, FolderX, Wifi, Shield } from 'lucide-react';

// Define file operation specific error types
interface FileOperationError extends Error {
  code?: string;
  operation?: 'upload' | 'download' | 'delete' | 'create' | 'read' | 'permissions';
  fileType?: string;
  fileSize?: number;
  statusCode?: number;
}

interface FileErrorBoundaryState {
  hasError: boolean;
  error: FileOperationError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface FileErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: FileOperationError, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  fallbackComponent?: React.ComponentType<FileErrorFallbackProps>;
  maxRetries?: number;
}

interface FileErrorFallbackProps {
  error: FileOperationError;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onResetError: () => void;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

/**
 * Error boundary component for file management operations handling upload failures,
 * network errors, permission issues, and file system errors. Provides user-friendly
 * error messages with recovery options, retry mechanisms, and error reporting
 * capabilities using React 19 error boundary patterns.
 */
export default class FileErrorBoundary extends Component<
  FileErrorBoundaryProps,
  FileErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: FileErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  /**
   * React 19 enhanced error boundary method for deriving state from errors
   */
  static getDerivedStateFromError(error: Error): Partial<FileErrorBoundaryState> {
    // Enhanced file operation error detection
    const fileError = error as FileOperationError;
    
    return {
      hasError: true,
      error: fileError,
      isRetrying: false,
    };
  }

  /**
   * React 19 error boundary lifecycle method for error logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const fileError = error as FileOperationError;
    
    this.setState({
      errorInfo,
    });

    // Enhanced error logging for file operations
    this.logFileError(fileError, errorInfo);

    // Call optional error handler prop
    if (this.props.onError) {
      this.props.onError(fileError, errorInfo);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Enhanced error logging with file operation context
   */
  private logFileError = (error: FileOperationError, errorInfo: ErrorInfo): void => {
    const errorData = {
      timestamp: new Date().toISOString(),
      operation: error.operation || 'unknown',
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      fileType: error.fileType,
      fileSize: error.fileSize,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 File Operation Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // This would typically integrate with services like Sentry, LogRocket, etc.
      // For now, we'll use a simple API call pattern
      this.reportError(errorData);
    }
  };

  /**
   * Report error to external monitoring service
   */
  private reportError = async (errorData: any): Promise<void> => {
    try {
      // Example error reporting - would integrate with actual service
      if (typeof window !== 'undefined' && 'reportError' in window) {
        // Use React 19's enhanced error reporting
        (window as any).reportError(new Error(JSON.stringify(errorData)));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  /**
   * Retry mechanism with exponential backoff for file operations
   */
  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const retryDelay = Math.pow(2, retryCount) * 1000;

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));

      // Call optional retry handler
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }, retryDelay);
  };

  /**
   * Reset error state completely
   */
  private handleResetError = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallbackComponent || DefaultFileErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onResetError={this.handleResetError}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          isRetrying={this.state.isRetrying}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback component for file operation errors with user-friendly
 * error messages and recovery options
 */
const DefaultFileErrorFallback: React.FC<FileErrorFallbackProps> = ({
  error,
  onRetry,
  onResetError,
  retryCount,
  maxRetries,
  isRetrying,
}) => {
  const getErrorDetails = (error: FileOperationError) => {
    const baseDetails = {
      title: 'File Operation Error',
      description: 'An unexpected error occurred during the file operation.',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      solutions: ['Please try again later.'],
    };

    // File operation specific error handling
    switch (error.operation) {
      case 'upload':
        return {
          ...baseDetails,
          title: 'File Upload Failed',
          description: getUploadErrorMessage(error),
          icon: Upload,
          solutions: [
            'Check your internet connection',
            'Verify the file size is within limits',
            'Ensure you have sufficient storage space',
            'Try uploading a different file format',
          ],
        };

      case 'download':
        return {
          ...baseDetails,
          title: 'File Download Failed',
          description: getDownloadErrorMessage(error),
          icon: Download,
          solutions: [
            'Check your internet connection',
            'Verify the file still exists',
            'Check your browser\'s download permissions',
            'Try downloading with a different browser',
          ],
        };

      case 'delete':
        return {
          ...baseDetails,
          title: 'File Deletion Failed',
          description: 'Unable to delete the selected file or folder.',
          icon: FolderX,
          solutions: [
            'Check if you have delete permissions',
            'Verify the file is not currently in use',
            'Refresh the page and try again',
          ],
        };

      case 'permissions':
        return {
          ...baseDetails,
          title: 'Permission Denied',
          description: 'You do not have the required permissions for this operation.',
          icon: Shield,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          solutions: [
            'Contact your administrator for access',
            'Log out and log back in',
            'Check if your session has expired',
          ],
        };

      default:
        // Check for network errors
        if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
          return {
            ...baseDetails,
            title: 'Network Connection Error',
            description: 'Unable to connect to the server.',
            icon: Wifi,
            solutions: [
              'Check your internet connection',
              'Verify the server is accessible',
              'Try again in a few moments',
              'Contact support if the problem persists',
            ],
          };
        }

        return baseDetails;
    }
  };

  const getUploadErrorMessage = (error: FileOperationError): string => {
    if (error.statusCode === 413) {
      return `File is too large (${formatFileSize(error.fileSize)}). Maximum allowed size exceeded.`;
    }
    if (error.statusCode === 415) {
      return `File type "${error.fileType}" is not supported for upload.`;
    }
    if (error.statusCode === 507) {
      return 'Insufficient storage space available on the server.';
    }
    return 'The file could not be uploaded due to an unexpected error.';
  };

  const getDownloadErrorMessage = (error: FileOperationError): string => {
    if (error.statusCode === 404) {
      return 'The requested file could not be found on the server.';
    }
    if (error.statusCode === 403) {
      return 'You do not have permission to download this file.';
    }
    return 'The file could not be downloaded due to an unexpected error.';
  };

  const formatFileSize = (size?: number): string => {
    if (!size) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;
  const canRetry = retryCount < maxRetries && !isRetrying;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div
        className={`max-w-md w-full rounded-lg border-2 ${errorDetails.borderColor} ${errorDetails.bgColor} shadow-sm`}
        role="alert"
        aria-labelledby="error-title"
        aria-describedby="error-description"
      >
        {/* Error Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${errorDetails.color}`}>
              <IconComponent className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="error-title"
                className="text-lg font-semibold text-gray-900 truncate"
              >
                {errorDetails.title}
              </h2>
              <p
                id="error-description"
                className="text-sm text-gray-600 mt-1"
              >
                {errorDetails.description}
              </p>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="p-6 space-y-4">
          {/* Solutions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Suggested Solutions:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {errorDetails.solutions.map((solution, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded border text-gray-700 font-mono">
                <div><strong>Error:</strong> {error.message}</div>
                {error.code && <div><strong>Code:</strong> {error.code}</div>}
                {error.statusCode && <div><strong>Status:</strong> {error.statusCode}</div>}
                {error.operation && <div><strong>Operation:</strong> {error.operation}</div>}
                {error.fileType && <div><strong>File Type:</strong> {error.fileType}</div>}
                {error.fileSize && <div><strong>File Size:</strong> {formatFileSize(error.fileSize)}</div>}
                <div><strong>Retry Count:</strong> {retryCount}/{maxRetries}</div>
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex space-x-3">
            {canRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={`Retry file operation (attempt ${retryCount + 1} of ${maxRetries})`}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Try Again ({maxRetries - retryCount} left)
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={onResetError}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Return to file browser"
            >
              Return to Files
            </button>
          </div>

          {retryCount >= maxRetries && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the error boundary and fallback component
export { FileErrorBoundary, DefaultFileErrorFallback };
export type { FileOperationError, FileErrorBoundaryProps, FileErrorFallbackProps };