'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Type definitions for email template system
interface EmailTemplate {
  id: string;
  name: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  defaults?: Record<string, any>;
  created: string;
  modified: string;
}

interface EmailTemplateError {
  type: 'network' | 'validation' | 'server' | 'permission';
  message: string;
  code?: string;
  details?: Record<string, any>;
}

interface EmailTemplateContextValue {
  // Error handling
  error: EmailTemplateError | null;
  setError: (error: EmailTemplateError | null) => void;
  clearError: () => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Template operations
  refreshTemplates: () => void;
  
  // Search and filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Selected template
  selectedTemplate: EmailTemplate | null;
  setSelectedTemplate: (template: EmailTemplate | null) => void;
}

// Email Template Context
const EmailTemplateContext = createContext<EmailTemplateContextValue | null>(null);

// Custom hook for accessing email template context
export const useEmailTemplateContext = () => {
  const context = useContext(EmailTemplateContext);
  if (!context) {
    throw new Error('useEmailTemplateContext must be used within EmailTemplateProvider');
  }
  return context;
};

// Error Boundary Component for Email Templates
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class EmailTemplateErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Email Template Error Boundary:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Integration with error reporting service would go here
      // Example: errorReporting.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
              Email Templates Error
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              An unexpected error occurred while loading the email templates section.
              Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded border text-sm">
                <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Email Template Provider Component
interface EmailTemplateProviderProps {
  children: React.ReactNode;
}

const EmailTemplateProvider: React.FC<EmailTemplateProviderProps> = ({ children }) => {
  const [error, setError] = React.useState<EmailTemplateError | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh templates handler
  const refreshTemplates = useCallback(() => {
    // This would typically trigger a refetch from React Query
    // The actual implementation will depend on the query key structure
    console.log('Refreshing email templates...');
  }, []);

  const contextValue: EmailTemplateContextValue = {
    error,
    setError,
    clearError,
    isLoading,
    setIsLoading,
    refreshTemplates,
    searchTerm,
    setSearchTerm,
    selectedTemplate,
    setSelectedTemplate,
  };

  return (
    <EmailTemplateContext.Provider value={contextValue}>
      {children}
    </EmailTemplateContext.Provider>
  );
};

// Authentication wrapper to ensure user is authenticated
interface AuthenticationWrapperProps {
  children: React.ReactNode;
}

const AuthenticationWrapper: React.FC<AuthenticationWrapperProps> = ({ children }) => {
  // Placeholder for authentication logic
  // This will integrate with useAuth hook when available
  const isAuthenticated = true; // This will be replaced with actual auth logic
  const isLoading = false; // This will be replaced with actual auth loading state

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be logged in to access email template management.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Theme integration placeholder
interface ThemeWrapperProps {
  children: React.ReactNode;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  // Placeholder for theme logic
  // This will integrate with useTheme hook when available
  const theme = 'light'; // This will be replaced with actual theme logic

  React.useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
};

// React Query client configuration optimized for email templates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure caching for email template data
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Global error handling for mutations
      onError: (error) => {
        console.error('Email template mutation error:', error);
        // Integration with notification system when available
      },
    },
  },
});

// Main Layout Component
interface EmailTemplateLayoutProps {
  children: React.ReactNode;
}

export default function EmailTemplateLayout({ children }: EmailTemplateLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EmailTemplateErrorBoundary>
        <AuthenticationWrapper>
          <ThemeWrapper>
            <EmailTemplateProvider>
              {/* Main layout structure with responsive design */}
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header section for breadcrumbs and actions */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                      {/* Breadcrumb navigation */}
                      <nav className="flex items-center space-x-2 text-sm">
                        <a
                          href="/system-settings"
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          System Settings
                        </a>
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span className="text-gray-900 dark:text-white font-medium">
                          Email Templates
                        </span>
                      </nav>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          Import Templates
                        </button>
                        
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Create Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content area */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    {children}
                  </div>
                </main>
              </div>
            </EmailTemplateProvider>
          </ThemeWrapper>
        </AuthenticationWrapper>
      </EmailTemplateErrorBoundary>

      {/* React Query DevTools for development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// Export the context hook for use in child components
export { useEmailTemplateContext };

// Export types for use in other components
export type { EmailTemplate, EmailTemplateError, EmailTemplateContextValue };