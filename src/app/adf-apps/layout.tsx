import { Metadata } from 'next';
import { Suspense } from 'react';

// Import providers and UI components based on technical specification structure
import { ThemeProvider } from '@/components/layout/theme/theme-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// Metadata configuration for app management section with SEO optimization
export const metadata: Metadata = {
  title: {
    template: '%s | Application Management | DreamFactory Admin Console',
    default: 'Application Management | DreamFactory Admin Console',
  },
  description: 'Manage and configure DreamFactory applications, including app settings, API access, and deployment configurations.',
  keywords: ['application management', 'DreamFactory apps', 'API applications', 'app configuration', 'deployment settings'],
  openGraph: {
    title: 'Application Management | DreamFactory Admin Console',
    description: 'Configure and manage your DreamFactory applications with comprehensive settings and deployment controls.',
    type: 'website',
    siteName: 'DreamFactory Admin Console',
    images: [
      {
        url: '/images/og-app-management.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Application Management Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Application Management | DreamFactory',
    description: 'Manage DreamFactory applications with advanced configuration tools.',
    images: ['/images/og-app-management.png'],
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

// Force dynamic rendering for real-time application management
export const dynamic = 'force-dynamic';

/**
 * Application Management Layout Component
 * 
 * Provides consistent structure and navigation for the application management section,
 * implementing error boundaries, loading states, and theme providers per React 19 
 * architecture patterns.
 * 
 * Features:
 * - React 19 Suspense for progressive loading with <2 second performance targets
 * - Error boundary protection for graceful error handling
 * - Theme provider integration supporting light/dark modes
 * - Responsive layout optimized for application management workflows
 * - SEO optimization with proper metadata configuration
 * 
 * @param children - Child components to render within the layout
 */
export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ErrorBoundary
        fallback={
          <div 
            className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white dark:bg-gray-900"
            role="alert"
            data-testid="apps-layout-error"
          >
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900">
              <svg 
                className="w-8 h-8 text-red-600 dark:text-red-400" 
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Application Management Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
              Unable to load the application management interface. This may be due to a temporary service issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              aria-label="Reload application management interface"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Retry Loading
            </button>
          </div>
        }
        onError={(error, errorInfo) => {
          // Log error details for monitoring and debugging
          console.error('Apps Layout Error:', error);
          console.error('Error Info:', errorInfo);
          
          // In production, send to error reporting service
          if (process.env.NODE_ENV === 'production') {
            // Example: sendErrorToService(error, errorInfo, 'apps-layout');
          }
        }}
      >
        <div 
          className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200"
          data-testid="apps-layout-container"
        >
          {/* Application Management Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <svg 
                      className="w-6 h-6 text-primary-600 dark:text-primary-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                      />
                    </svg>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Application Management
                    </h1>
                  </div>
                  <nav 
                    className="hidden md:flex space-x-8" 
                    aria-label="Application management navigation"
                  >
                    <a 
                      href="/adf-apps" 
                      className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                      aria-current="page"
                    >
                      Applications
                    </a>
                    <a 
                      href="/adf-apps/resolvers" 
                      className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      App Resolvers
                    </a>
                  </nav>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    aria-label="Create new application"
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
                    New App
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area with React 19 Suspense */}
          <main 
            className="flex-1"
            data-testid="apps-layout-main"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Suspense
                fallback={
                  <div 
                    className="space-y-6 animate-pulse"
                    data-testid="apps-layout-loading"
                    role="status"
                    aria-label="Loading application management interface"
                  >
                    {/* Page Header Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <LoadingSkeleton className="h-8 w-64" />
                        <LoadingSkeleton className="h-5 w-96" />
                      </div>
                      <LoadingSkeleton className="h-10 w-32" />
                    </div>
                    
                    {/* Content Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div 
                          key={index}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
                        >
                          <LoadingSkeleton className="h-6 w-3/4" />
                          <LoadingSkeleton className="h-4 w-full" />
                          <LoadingSkeleton className="h-4 w-2/3" />
                          <div className="flex justify-between items-center">
                            <LoadingSkeleton className="h-8 w-20" />
                            <LoadingSkeleton className="h-8 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Screen reader announcement for loading state */}
                    <div className="sr-only" aria-live="polite">
                      Loading application management interface...
                    </div>
                  </div>
                }
              >
                {/* Progressive Loading Container */}
                <div 
                  className="transition-opacity duration-300 ease-in-out"
                  data-testid="apps-layout-content"
                >
                  {children}
                </div>
              </Suspense>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <p>© {new Date().getFullYear()} DreamFactory Software Inc. All rights reserved.</p>
                <div className="flex items-center space-x-4">
                  <span>Application Management</span>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>Admin Console</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}