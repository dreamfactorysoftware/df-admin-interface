'use client';

/**
 * Log Viewer Page Component
 * 
 * Main log viewer page component for the Next.js app router providing log content 
 * display functionality. Built as a React 19 client component with React Query 
 * for data fetching, React Ace Editor for interactive log viewing, and Next.js 
 * useRouter for navigation. 
 * 
 * Replaces the Angular DfLogViewerComponent with modern React patterns while 
 * maintaining the same core functionality of displaying log content with syntax 
 * highlighting and providing back navigation.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

// Dynamic import of ACE Editor to prevent SSR issues
const AceEditor = dynamic(
  () => import('@uiw/react-ace-editor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => <LogViewerSkeleton />
  }
);

// Import ACE themes and modes
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/ext-language_tools';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface LogViewerProps {
  // Props will be passed via URL parameters and search params
}

interface LogContent {
  content: string;
  filename?: string;
  type?: string;
}

// ============================================================================
// SKELETON LOADER COMPONENT
// ============================================================================

const LogViewerSkeleton: React.FC = () => (
  <div className="w-full h-96 border border-gray-200 rounded-lg animate-pulse bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 dark:bg-gray-700"></div>
    </div>
  </div>
);

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

const LogViewerError: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-96 p-8 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        Error Loading Log File
      </h3>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        {error.message || 'Failed to load the log file. Please try again.'}
      </p>
      <Button 
        onClick={retry}
        variant="destructive"
        size="sm"
      >
        Retry
      </Button>
    </div>
  </div>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines the appropriate ACE Editor mode based on file extension or content
 */
const getEditorMode = (filename?: string, content?: string): string => {
  if (!filename) return 'text';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'json':
      return 'json';
    case 'xml':
    case 'html':
      return 'xml';
    case 'js':
    case 'ts':
      return 'javascript';
    case 'log':
    case 'txt':
    default:
      return 'text';
  }
};

/**
 * Fetches log content from the API
 */
const fetchLogContent = async (type: string, entity: string): Promise<LogContent> => {
  try {
    // First, get the file blob
    const response = await fetch(`/api/v2/${type}/${entity}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch log file: ${response.statusText}`);
    }

    // Get the blob and convert to text
    const blob = await response.blob();
    const content = await blob.text();

    return {
      content,
      filename: entity,
      type,
    };
  } catch (error) {
    console.error('Error fetching log content:', error);
    throw error;
  }
};

// ============================================================================
// MAIN LOG VIEWER COMPONENT
// ============================================================================

const LogViewerContent: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Extract parameters from URL
  const type = searchParams.get('type') || 'logs';
  const entity = Array.isArray(params?.slug) ? params.slug.join('/') : (params?.slug as string) || '';

  // React Query for data fetching with intelligent caching
  const {
    data: logData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['log-content', type, entity],
    queryFn: () => fetchLogContent(type, entity),
    enabled: !!entity, // Only fetch if entity is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Navigation handler
  const handleGoBack = () => {
    // Navigate back two levels (equivalent to Angular's ../../)
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const backPath = pathSegments.slice(0, -2).join('/');
    router.push(backPath ? `/${backPath}` : '/adf-files');
  };

  // Determine editor configuration
  const editorMode = getEditorMode(logData?.filename, logData?.content);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Error state
  if (error) {
    return <LogViewerError error={error as Error} retry={() => refetch()} />;
  }

  return (
    <div className="details-section">
      {/* Header with back button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            size="default"
            className="save-btn"
          >
            ← Go Back
          </Button>
          {logData?.filename && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {logData.filename}
            </h2>
          )}
        </div>
        {logData && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {logData.content.length.toLocaleString()} characters
          </div>
        )}
      </div>

      {/* Log content display */}
      <div className="full-width">
        {isLoading ? (
          <LogViewerSkeleton />
        ) : logData ? (
          <AceEditor
            value={logData.content}
            mode={editorMode}
            theme={isDarkMode ? 'monokai' : 'github'}
            readOnly={true}
            fontSize={14}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={false}
            width="100%"
            height="500px"
            setOptions={{
              enableBasicAutocompletion: false,
              enableLiveAutocompletion: false,
              enableSnippets: false,
              showLineNumbers: true,
              tabSize: 2,
              useWorker: false,
              wrap: true,
            }}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
            }}
            className="full-width border border-gray-300 rounded-lg dark:border-gray-600"
          />
        ) : (
          <div className="flex items-center justify-center min-h-96 p-8 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No log content available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE COMPONENT WITH SUSPENSE
// ============================================================================

const LogViewerPage: React.FC<LogViewerProps> = () => {
  return (
    <Suspense fallback={<LogViewerSkeleton />}>
      <div className="container mx-auto px-4 py-6">
        <LogViewerContent />
      </div>
    </Suspense>
  );
};

// ============================================================================
// METADATA AND EXPORTS
// ============================================================================

export const metadata = {
  title: 'Log Viewer - DreamFactory Admin',
  description: 'View log file contents with syntax highlighting',
};

export default LogViewerPage;