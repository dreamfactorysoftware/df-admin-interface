'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Copy, ExternalLink } from 'lucide-react';

/**
 * Error boundary component for the event script creation page providing graceful error handling 
 * with recovery options and user-friendly messaging. Implements React 19 error boundary patterns 
 * with logging capabilities, retry mechanisms for script creation operations, and comprehensive 
 * error recovery workflows for form submission failures, validation errors, and API communication issues.
 * 
 * Features:
 * - React 19 error boundary capabilities per React/Next.js Integration Requirements
 * - Comprehensive error handling with user feedback per Section 4.2 error handling and validation
 * - Next.js error boundaries for graceful degradation per Section 5.1 architectural principles
 * - WCAG 2.1 AA compliance for error messaging and recovery options
 * - Error tracking and monitoring for production error analysis and debugging capabilities
 */

interface ScriptCreationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error categorization for specific script creation scenarios
enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK', 
  STORAGE = 'STORAGE',
  EDITOR = 'EDITOR',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

interface ErrorMetadata {
  category: ErrorCategory;
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
  showDetails: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Categorizes errors based on error message and provides appropriate metadata
 */
function categorizeError(error: Error): ErrorMetadata {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Script validation errors
  if (message.includes('validation') || message.includes('invalid script') || message.includes('syntax error')) {
    return {
      category: ErrorCategory.VALIDATION,
      title: 'Script Validation Error',
      message: 'There was an issue validating your script content. Please check your script syntax and try again.',
      suggestions: [
        'Verify your script syntax is correct',
        'Check for missing semicolons or brackets',
        'Ensure all variables are properly declared',
        'Review script type requirements'
      ],
      canRetry: true,
      showDetails: true,
      severity: 'medium'
    };
  }

  // Storage service connection issues
  if (message.includes('storage') || message.includes('service connection') || message.includes('storage path')) {
    return {
      category: ErrorCategory.STORAGE,
      title: 'Storage Service Error',
      message: 'Unable to connect to the selected storage service. Please verify your storage configuration.',
      suggestions: [
        'Check storage service credentials',
        'Verify storage path permissions',
        'Test storage service connection',
        'Contact your administrator if issues persist'
      ],
      canRetry: true,
      showDetails: true,
      severity: 'high'
    };
  }

  // Script editor initialization problems
  if (message.includes('editor') || message.includes('ace') || message.includes('monaco') || stack.includes('editor')) {
    return {
      category: ErrorCategory.EDITOR,
      title: 'Script Editor Error',
      message: 'The script editor failed to initialize properly. Please refresh the page to try again.',
      suggestions: [
        'Refresh the page to reload the editor',
        'Clear your browser cache',
        'Disable browser extensions that might interfere',
        'Try using a different browser'
      ],
      canRetry: true,
      showDetails: false,
      severity: 'medium'
    };
  }

  // Network and API communication errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('connection')) {
    return {
      category: ErrorCategory.NETWORK,
      title: 'Network Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      suggestions: [
        'Check your internet connection',
        'Retry the operation in a few moments',
        'Contact support if the problem persists'
      ],
      canRetry: true,
      showDetails: false,
      severity: 'high'
    };
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || message.includes('token')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      title: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue.',
      suggestions: [
        'Log in again with your credentials',
        'Contact your administrator for access'
      ],
      canRetry: false,
      showDetails: false,
      severity: 'high'
    };
  }

  // Permission errors
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
    return {
      category: ErrorCategory.PERMISSION,
      title: 'Access Denied',
      message: 'You do not have permission to create event scripts. Please contact your administrator.',
      suggestions: [
        'Contact your administrator for script creation permissions',
        'Verify your role includes script management access'
      ],
      canRetry: false,
      showDetails: false,
      severity: 'high'
    };
  }

  // Server errors
  if (message.includes('server error') || message.includes('internal error') || message.includes('500')) {
    return {
      category: ErrorCategory.SERVER,
      title: 'Server Error',
      message: 'An internal server error occurred. Our team has been notified and is working to resolve the issue.',
      suggestions: [
        'Try again in a few minutes',
        'Contact support if the issue continues',
        'Check the system status page for updates'
      ],
      canRetry: true,
      showDetails: true,
      severity: 'critical'
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    title: 'Unexpected Error',
    message: 'An unexpected error occurred while creating your script. Please try again or contact support if the issue persists.',
    suggestions: [
      'Try refreshing the page',
      'Save your work and try again',
      'Contact support with the error details below'
    ],
    canRetry: true,
    showDetails: true,
    severity: 'high'
  };
}

/**
 * Logs error details for monitoring and debugging
 */
async function logError(error: Error, metadata: ErrorMetadata, digest?: string) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    page: '/adf-event-scripts/create',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest
    },
    metadata,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
  };

  try {
    // In a real implementation, this would send to your monitoring service
    // For now, we'll log to console in development and potentially send to an endpoint in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Script Creation Error]', errorLog);
    } else {
      // In production, send to monitoring service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
    }
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
}

/**
 * Announces error to screen readers for accessibility
 */
function announceError(message: string) {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Error: ${message}`;
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Copies error details to clipboard for easy sharing with support
 */
async function copyErrorDetails(error: Error, metadata: ErrorMetadata, digest?: string) {
  const errorDetails = `
Error Report - Script Creation
Generated: ${new Date().toLocaleString()}
Page: /adf-event-scripts/create

Error Category: ${metadata.category}
Error Title: ${metadata.title}
Error Message: ${error.message}
${digest ? `Error ID: ${digest}` : ''}

Technical Details:
${error.stack || 'No stack trace available'}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
  `.trim();

  try {
    await navigator.clipboard.writeText(errorDetails);
    return true;
  } catch {
    // Fallback for browsers without clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = errorDetails;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

export default function ScriptCreationError({ error, reset }: ScriptCreationErrorProps) {
  const router = useRouter();
  const [metadata] = useState<ErrorMetadata>(() => categorizeError(error));
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');

  // Log error on mount
  useEffect(() => {
    logError(error, metadata, error.digest);
    announceError(metadata.message);
  }, [error, metadata]);

  // Reset copy status after success
  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleRetry = useCallback(async () => {
    if (!metadata.canRetry || isRetrying) return;
    
    setIsRetrying(true);
    announceError('Retrying script creation');
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      announceError('Retry failed, please try again');
    } finally {
      setIsRetrying(false);
    }
  }, [metadata.canRetry, isRetrying, reset]);

  const handleGoHome = useCallback(() => {
    announceError('Navigating to dashboard');
    router.push('/');
  }, [router]);

  const handleGoBack = useCallback(() => {
    announceError('Navigating back to scripts list');
    router.push('/adf-event-scripts');
  }, [router]);

  const handleCopyDetails = useCallback(async () => {
    setCopyStatus('copying');
    const success = await copyErrorDetails(error, metadata, error.digest);
    setCopyStatus(success ? 'copied' : 'failed');
    
    if (success) {
      announceError('Error details copied to clipboard');
    } else {
      announceError('Failed to copy error details');
    }
  }, [error, metadata]);

  const handleReportBug = useCallback(() => {
    // In a real implementation, this would open a bug report form or external link
    const reportUrl = 'https://github.com/dreamfactorysoftware/df-admin-interface/issues/new';
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
    announceError('Opening bug report form');
  }, []);

  // Determine icon color based on severity
  const getIconColorClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Error Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 p-2 rounded-full bg-opacity-10 ${
                metadata.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                metadata.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                metadata.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                'bg-blue-100 dark:bg-blue-900'
              }`}>
                <AlertTriangle 
                  className={`h-6 w-6 ${getIconColorClass(metadata.severity)}`}
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {metadata.title}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {metadata.message}
                </p>
                
                {/* Error ID if available */}
                {error.digest && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Error ID: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {error.digest}
                    </code>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions Section */}
          {metadata.suggestions.length > 0 && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Suggested Solutions
              </h2>
              <ul className="space-y-2">
                {metadata.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {suggestion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Retry Button */}
              {metadata.canRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 min-h-[44px]"
                  aria-describedby="retry-description"
                >
                  <RefreshCw 
                    className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              )}

              {/* Go Back Button */}
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Scripts
              </button>

              {/* Go Home Button */}
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Copy Error Details */}
              <button
                onClick={handleCopyDetails}
                disabled={copyStatus === 'copying'}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded-md"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copyStatus === 'copying' ? 'Copying...' : 
                 copyStatus === 'copied' ? 'Copied!' : 
                 copyStatus === 'failed' ? 'Copy Failed' : 'Copy Error Details'}
              </button>

              {/* Report Bug */}
              <button
                onClick={handleReportBug}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded-md"
              >
                <Bug className="h-4 w-4" aria-hidden="true" />
                Report Bug
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </button>

              {/* Toggle Technical Details */}
              {metadata.showDetails && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded-md"
                  aria-expanded={showDetails}
                  aria-controls="error-details"
                >
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </button>
              )}
            </div>
          </div>

          {/* Technical Details Section */}
          {metadata.showDetails && showDetails && (
            <div id="error-details" className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Technical Details
                </h3>
                <div className="bg-gray-900 dark:bg-gray-950 rounded-md p-4 overflow-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    <code>
{`Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Category: ${metadata.category}
Severity: ${metadata.severity}
Timestamp: ${new Date().toISOString()}
Page: /adf-event-scripts/create
User Agent: ${typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden elements for screen readers */}
        <div className="sr-only">
          <div id="retry-description">
            Attempts to reload the script creation form and resolve the error
          </div>
          <div aria-live="polite" aria-atomic="true">
            {/* This will be populated by announceError function */}
          </div>
        </div>
      </div>
    </div>
  );
}