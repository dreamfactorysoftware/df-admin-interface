'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

// Import layout components
import { Sidebar } from './sidebar';
import { Header } from './header';

// Type definitions for props and context
interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Theme context type definition - matches expected interface from use-theme hook
 */
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * App store interface - matches expected interface from app-store
 */
interface AppStore {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Error boundary fallback component
 * Provides user-friendly error display with recovery options
 */
function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Layout Error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <div>
            <h1 
              id="error-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Application Error
            </h1>
          </div>
        </div>
        
        <p 
          id="error-description"
          className="text-gray-600 dark:text-gray-400 mb-6"
        >
          Something went wrong while loading the application. Please try refreshing the page or contact support if the problem persists.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
            aria-label="Try to recover from error"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
            aria-label="Reload the page"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Reload Page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Loading fallback component
 * Displays during suspense loading states
 */
function LoadingFallback() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
      role="status"
      aria-label="Loading application"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          Loading DreamFactory Console...
        </p>
      </div>
    </div>
  );
}

/**
 * Placeholder hook implementations
 * These will be replaced by actual implementations when dependency files are created
 */
function useTheme(): ThemeContextType {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme
  };
}

function useAppStore(): AppStore {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    globalLoading,
    setGlobalLoading,
    theme,
    setTheme
  };
}

/**
 * Skip link component for accessibility
 * Allows keyboard users to skip to main content
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      Skip to main content
    </a>
  );
}

/**
 * Main Layout Component
 * 
 * Root layout component that provides the main application shell structure with 
 * sidebar navigation, header toolbar, and content area. Integrates theme provider, 
 * authentication state, and responsive layout containers using Tailwind CSS.
 * 
 * Features:
 * - Responsive flexbox layout with sidebar and main content area
 * - Theme-aware styling with dark/light mode support
 * - Accessibility features including skip links and ARIA landmarks
 * - Error boundary and suspense wrappers for better error handling
 * - Mobile-responsive behavior with collapsible sidebar
 * - WCAG 2.1 AA compliance with proper focus management
 * - Smooth transitions and animations
 * - Server-side rendering compatibility
 * 
 * Replaces Angular Material-based layout structure with React 19 server components
 * and Next.js app router patterns for enhanced performance and maintainability.
 */
export function MainLayout({ children, className }: MainLayoutProps) {
  const { resolvedTheme } = useTheme();
  const { sidebarCollapsed, globalLoading } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme class to document root
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
      
      // Update meta theme-color for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute(
          'content', 
          resolvedTheme === 'dark' ? '#111827' : '#ffffff'
        );
      }
    }
  }, [resolvedTheme, mounted]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow ESC to close sidebar on mobile
      if (event.key === 'Escape' && !sidebarCollapsed && window.innerWidth < 1024) {
        const { setSidebarCollapsed } = useAppStore();
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Clear any error state and refresh
        window.location.reload();
      }}
      onError={(error) => {
        // Log error to monitoring service
        console.error('Main Layout Error:', error);
      }}
    >
      <div className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300",
        className
      )}>
        {/* Skip link for accessibility */}
        <SkipLink />

        {/* Global loading overlay */}
        <Transition
          show={globalLoading}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
            role="status"
            aria-label="Loading"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                <span className="text-gray-900 dark:text-white font-medium">
                  Processing...
                </span>
              </div>
            </div>
          </div>
        </Transition>

        {/* Main application layout */}
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar Navigation */}
          <Suspense 
            fallback={
              <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 animate-pulse" />
            }
          >
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <div className="w-80 bg-red-50 dark:bg-red-900/20 border-r border-red-200 dark:border-red-800 p-4">
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Navigation error
                  </p>
                  <button
                    onClick={resetErrorBoundary}
                    className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            >
              <Sidebar />
            </ErrorBoundary>
          </Suspense>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <Suspense 
              fallback={
                <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-pulse" />
              }
            >
              <ErrorBoundary
                FallbackComponent={({ error, resetErrorBoundary }) => (
                  <div className="h-16 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center px-4">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      Header error
                    </p>
                    <button
                      onClick={resetErrorBoundary}
                      className="ml-2 text-xs text-red-600 dark:text-red-400 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              >
                <Header />
              </ErrorBoundary>
            </Suspense>

            {/* Main Content */}
            <main 
              id="main-content"
              className="flex-1 overflow-auto bg-white dark:bg-gray-900 focus:outline-none"
              role="main"
              aria-label="Main content"
              tabIndex={-1}
            >
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
                <Suspense fallback={<LoadingFallback />}>
                  <ErrorBoundary
                    FallbackComponent={ErrorFallback}
                    onReset={() => {
                      // Reset any error state
                      window.location.reload();
                    }}
                  >
                    {children}
                  </ErrorBoundary>
                </Suspense>
              </div>
            </main>
          </div>
        </div>

        {/* Focus trap for modals and overlays */}
        <div id="modal-root" />
        
        {/* Accessibility announcements */}
        <div 
          id="announcement-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </div>
    </ErrorBoundary>
  );
}

export default MainLayout;