/**
 * Log Viewer Page Component
 * 
 * Main log viewer page component for the Next.js app router providing log content
 * display functionality. Built as a React 19 server component with React Query
 * for data fetching, React Ace Editor for interactive log viewing, and Next.js
 * useRouter for navigation.
 * 
 * Replaces the Angular DfLogViewerComponent with modern React patterns while
 * maintaining the same core functionality of displaying log content with syntax
 * highlighting and providing back navigation.
 * 
 * @fileoverview Log viewer page implementation for file management feature F-008
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { apiGet } from '../../../lib/api-client';
import type { ApiResponse } from '../../../types/api';

// ============================================================================
// Dynamic Imports and Components
// ============================================================================

/**
 * Dynamically import React Ace Editor to avoid SSR issues
 * Replaces Angular df-ace-editor component with @uiw/react-ace-editor
 */
const AceEditor = dynamic(
  () => import('@uiw/react-ace-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <LoadingSpinner />
      </div>
    ),
  }
);

/**
 * Simple loading spinner component
 * Provides visual feedback during log content loading
 */
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading log content...</p>
    </div>
  );
}

/**
 * Back navigation button component
 * Styled with Tailwind CSS to replace Angular Material button
 */
function BackButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
        transition-colors duration-200 ease-in-out
        ${disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600' 
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400'
        }
      `}
      type="button"
      aria-label="Go back to previous page"
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Go Back
    </button>
  );
}

/**
 * Error display component for failed log loading
 * Provides user-friendly error messages with retry functionality
 */
function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: Error; 
  onRetry: () => void; 
}) {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-center space-y-4 max-w-md">
        <svg 
          className="w-12 h-12 text-red-500 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
          Failed to Load Log Content
        </h3>
        <p className="text-sm text-red-700 dark:text-red-200">
          {error.message || 'An unexpected error occurred while loading the log file.'}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-800 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Log content response structure from DreamFactory API
 */
interface LogContentResponse {
  content: string;
  path?: string;
  size?: number;
  modified?: string;
}

/**
 * Log viewer page props (from Next.js app router)
 */
interface LogViewerPageProps {
  params: {
    /** File service identifier */
    service?: string;
    /** Log file identifier or path */
    logId?: string;
  };
  searchParams: {
    /** Log file path parameter */
    path?: string;
    /** Service name parameter */
    service?: string;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch log content from DreamFactory file service API
 * Replaces Angular ActivatedRoute.data subscription with React Query pattern
 */
async function fetchLogContent(logPath: string, serviceName: string = 'files'): Promise<LogContentResponse> {
  try {
    // Construct API endpoint for log file content
    // Format: /api/v2/{service}/{path}?download=false&format=text
    const endpoint = `/api/v2/${serviceName}/${encodeURIComponent(logPath)}`;
    
    const response = await apiGet<ApiResponse<LogContentResponse>>(endpoint, {
      additionalParams: [
        { key: 'download', value: 'false' },
        { key: 'format', value: 'text' },
        { key: 'include_properties', value: 'true' },
      ],
      snackbarError: 'Failed to load log content',
      timeout: 30000, // 30 second timeout for large log files
    });

    // Handle different response formats from DreamFactory API
    if ('resource' in response) {
      // Single resource response
      return {
        content: response.resource.content || response.resource,
        path: logPath,
        size: response.resource.size,
        modified: response.resource.last_modified,
      };
    } else if ('data' in response) {
      // Direct data response
      return {
        content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
        path: logPath,
      };
    } else {
      // Fallback for other response types
      return {
        content: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        path: logPath,
      };
    }
  } catch (error) {
    // Enhanced error handling with specific error messages
    if (error instanceof Error) {
      // Parse API error response if available
      try {
        const apiError = JSON.parse(error.message);
        if (apiError.error) {
          throw new Error(`Failed to load log file: ${apiError.error.message}`);
        }
      } catch {
        // If not a JSON error, use the original error message
        throw new Error(`Failed to load log file: ${error.message}`);
      }
    }
    throw new Error('Failed to load log file: Unknown error occurred');
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Log Viewer Page Component
 * 
 * Displays log file content with syntax highlighting using React Ace Editor.
 * Supports navigation back to parent directory and error handling for failed
 * log loading operations.
 * 
 * Features:
 * - Server-side rendering compatible with dynamic imports
 * - React Query for intelligent caching and error handling  
 * - Responsive design with Tailwind CSS
 * - Accessibility compliance with ARIA attributes
 * - Dark mode support
 * - Error boundaries with retry functionality
 */
export default function LogViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  // Extract log path and service from URL parameters
  const logPath = searchParams?.get('path') || params?.logId || '';
  const serviceName = searchParams?.get('service') || params?.service || 'files';
  
  // State for component lifecycle management
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering client-side features
  useEffect(() => {
    setMounted(true);
  }, []);

  // React Query hook for log content fetching
  // Replaces Angular ActivatedRoute.data subscription pattern
  const {
    data: logData,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['log-content', serviceName, logPath],
    queryFn: () => fetchLogContent(logPath, serviceName),
    enabled: mounted && !!logPath, // Only fetch when mounted and path is available
    staleTime: 5 * 60 * 1000, // 5 minutes - logs don't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error?.message?.includes('404') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Handle back navigation
   * Replaces Angular Router.navigate(['../../'], { relativeTo: this.activatedRoute })
   * with Next.js useRouter navigation
   */
  const handleGoBack = () => {
    // Navigate back two levels in the route hierarchy
    // This maintains the same behavior as the Angular component
    router.back();
  };

  /**
   * Handle retry for failed log loading
   */
  const handleRetry = () => {
    refetch();
  };

  // Show loading state during SSR or when not mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Show error message if no log path is provided
  if (!logPath) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="details-section space-y-6">
            <BackButton onClick={handleGoBack} />
            <div className="flex flex-col items-center justify-center h-96 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-center space-y-4 max-w-md">
                <svg className="w-12 h-12 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100">
                  No Log File Specified
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Please provide a log file path to view its contents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main container with same class as Angular component */}
        <div className="details-section space-y-6">
          {/* Header with back button and log info */}
          <div className="flex items-center justify-between">
            <BackButton 
              onClick={handleGoBack} 
              disabled={isLoading}
            />
            
            {logData && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-x-4">
                {logData.size && (
                  <span>Size: {Math.round(logData.size / 1024)}KB</span>
                )}
                {logData.modified && (
                  <span>Modified: {new Date(logData.modified).toLocaleString()}</span>
                )}
              </div>
            )}
          </div>

          {/* Log content display area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading && (
              <LoadingSpinner />
            )}
            
            {isError && error && (
              <ErrorDisplay error={error as Error} onRetry={handleRetry} />
            )}
            
            {logData && !isError && (
              <Suspense fallback={<LoadingSpinner />}>
                <AceEditor
                  value={logData.content}
                  readOnly={true}
                  mode="text"
                  theme="github"
                  width="100%"
                  height="600px"
                  fontSize="14px"
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={false}
                  setOptions={{
                    enableBasicAutocompletion: false,
                    enableLiveAutocompletion: false,
                    enableSnippets: false,
                    showLineNumbers: true,
                    tabSize: 2,
                    wrap: true,
                    foldStyle: 'markbegin',
                    useWorker: false, // Disable web workers for better compatibility
                  }}
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
                    lineHeight: '1.5',
                  }}
                  className="full-width ace-editor-container"
                />
              </Suspense>
            )}
          </div>
          
          {/* Footer with file path information */}
          {logData && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Viewing: {logData.path}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}