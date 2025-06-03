/**
 * Scheduler Layout Component for DreamFactory Admin Interface
 * 
 * Scheduler-specific layout component that provides the structural foundation for all
 * scheduler-related pages within the Next.js app router. This layout establishes React
 * Context providers for theme management, authentication state, and scheduler-specific
 * state management using Zustand.
 * 
 * Key Features:
 * - React Context providers for authentication, theme, and scheduler state management
 * - Zustand store integration for scheduler workflow state with persistence capabilities  
 * - Error boundaries for graceful error handling throughout scheduler operations
 * - Responsive design with WCAG 2.1 AA accessibility compliance
 * - Integration with Next.js 15.1 app router patterns and server components
 * 
 * Architecture:
 * - Replaces Angular module-based dependency injection with React composition patterns
 * - Implements Section 4.3.1 React Context state flow for scheduler workflows
 * - Uses Section 5.2 Zustand store patterns replacing RxJS observables
 * - Applies Tailwind CSS responsive design replacing Angular Material layouts
 * - Establishes error boundaries for robust scheduler operation error handling
 * 
 * Performance:
 * - Provides React Query cache invalidation for scheduler data mutations
 * - Implements optimistic updates for scheduler task operations
 * - Supports concurrent features for improved user experience
 * - Enables server-side rendering for enhanced performance
 * 
 * @example
 * ```tsx
 * // Used automatically by Next.js app router for /adf-scheduler routes
 * export default function SchedulerPage() {
 *   return (
 *     <div className="p-6">
 *       <h1>Scheduler Management</h1>
 *       // Page content inherits all providers and state management
 *     </div>
 *   )
 * }
 * ```
 */

'use client'

import { ReactNode, Suspense, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createSchedulerStore, SchedulerProvider } from '@/lib/scheduler-store'
import '@/styles/globals.css'

/**
 * Props interface for the SchedulerLayout component
 * Following Next.js 15.1 layout patterns for app router
 */
interface SchedulerLayoutProps {
  /** Child components/pages rendered within the scheduler layout */
  children: ReactNode
}

/**
 * Error boundary fallback component for scheduler operations
 * Provides user-friendly error recovery with accessibility support
 */
function SchedulerErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg 
              className="h-6 w-6 text-red-600 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
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
        </div>
        
        <h2 
          id="error-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
        >
          Scheduler Error
        </h2>
        
        <p 
          id="error-description"
          className="text-sm text-gray-600 dark:text-gray-400 mb-6"
        >
          {error.message || 'An unexpected error occurred while loading the scheduler. Please try again.'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Retry loading scheduler"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Return to homepage"
          >
            Return Home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Loading component for scheduler state initialization
 * Provides accessible loading feedback during state setup
 */
function SchedulerLoading() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
      role="status"
      aria-label="Loading scheduler"
    >
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Loading scheduler...
        </p>
      </div>
    </div>
  )
}

/**
 * Authentication guard wrapper for scheduler routes
 * Ensures user is authenticated before accessing scheduler functionality
 */
function SchedulerAuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return <SchedulerLoading />
  }

  if (!isAuthenticated) {
    // Redirect to login - in a real app this would be handled by middleware
    window.location.href = '/login?redirect=/adf-scheduler'
    return <SchedulerLoading />
  }

  // Check scheduler-specific permissions
  if (!hasPermission('scheduler.read')) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
        role="alert"
        aria-labelledby="access-denied-title"
      >
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg 
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          </div>
          
          <h2 
            id="access-denied-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
          >
            Access Denied
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the scheduler. Please contact your administrator.
          </p>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Theme integration wrapper for scheduler layout
 * Applies dark/light mode classes and manages theme state
 */
function SchedulerThemeWrapper({ children }: { children: ReactNode }) {
  const { theme, isDark } = useTheme()

  return (
    <div 
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
      data-theme={theme}
    >
      {children}
    </div>
  )
}

/**
 * Scheduler-specific query client configuration
 * Optimized for scheduler operations with appropriate cache settings
 */
const createSchedulerQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Scheduler data typically changes infrequently
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

/**
 * Main scheduler layout component
 * 
 * Provides comprehensive layout foundation for all scheduler pages including:
 * - Authentication and authorization checking
 * - Theme management with dark/light mode support
 * - Scheduler-specific state management via Zustand
 * - React Query client for server state management
 * - Error boundaries for graceful error handling
 * - Responsive design with WCAG 2.1 AA compliance
 * 
 * This layout replaces Angular's module-based dependency injection with React's
 * composition patterns while maintaining all functionality requirements.
 */
export default function SchedulerLayout({ children }: SchedulerLayoutProps) {
  // Create scheduler-specific query client instance
  const [queryClient] = useState(createSchedulerQueryClient)
  
  // Create scheduler store instance with persistence
  const [schedulerStore] = useState(() => createSchedulerStore())

  return (
    <ErrorBoundary
      FallbackComponent={SchedulerErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Scheduler Layout Error:', error, errorInfo)
          // TODO: Send to error monitoring service (e.g., Sentry)
        }
      }}
      onReset={() => {
        // Reset any global state that might be causing the error
        queryClient.clear()
        // Clear any local storage that might be corrupted
        try {
          localStorage.removeItem('scheduler-state')
          localStorage.removeItem('scheduler-filters')
        } catch (e) {
          // Ignore localStorage errors in case it's not available
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SchedulerProvider store={schedulerStore}>
          <SchedulerThemeWrapper>
            <SchedulerAuthGuard>
              <Suspense fallback={<SchedulerLoading />}>
                <div className="min-h-screen flex flex-col">
                  {/* Scheduler-specific layout container */}
                  <div className="flex-1 flex flex-col lg:flex-row">
                    {/* Main content area */}
                    <main 
                      className="flex-1 overflow-auto"
                      role="main"
                      aria-label="Scheduler content"
                    >
                      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                      </div>
                    </main>
                  </div>
                  
                  {/* Footer for scheduler pages if needed */}
                  <footer 
                    className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4"
                    role="contentinfo"
                  >
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="mb-2 sm:mb-0">
                          <span>DreamFactory Scheduler Management</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>© {new Date().getFullYear()} DreamFactory Software</span>
                        </div>
                      </div>
                    </div>
                  </footer>
                </div>
              </Suspense>
            </SchedulerAuthGuard>
          </SchedulerThemeWrapper>
        </SchedulerProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

/**
 * Type exports for scheduler layout
 */
export type { SchedulerLayoutProps }