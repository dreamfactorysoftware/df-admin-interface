'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Transition } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Utility function for merging Tailwind CSS classes
 * Provides basic className concatenation with undefined filtering
 */
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Type definitions for props and interfaces
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showBranding?: boolean;
  className?: string;
  loading?: boolean;
}

/**
 * Theme context type definition - matches expected interface from use-theme hook
 */
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  systemTheme: 'light' | 'dark';
  mounted: boolean;
}

/**
 * Error boundary fallback component for authentication flows
 * Provides user-friendly error display with recovery options
 */
function AuthErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Authentication Error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
      role="alert"
      aria-labelledby="auth-error-title"
      aria-describedby="auth-error-description"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
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
                id="auth-error-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Authentication Error
              </h1>
            </div>
          </div>
          
          <p 
            id="auth-error-description"
            className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed"
          >
            Something went wrong during authentication. Please try again or contact your administrator if the problem persists.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
              aria-label="Try to recover from authentication error"
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
            
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
              aria-label="Return to login page"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-3 0V9a1 1 0 00-1-1H9a1 1 0 00-1 1v10M4 21h16" 
                />
              </svg>
              Back to Login
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading component for authentication operations
 * Displays during suspense loading states with branded styling
 */
function AuthLoadingFallback() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading authentication page"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
}

/**
 * DreamFactory logo component with responsive sizing
 */
function DreamFactoryLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center space-x-3">
        {/* Logo icon placeholder - replace with actual DreamFactory logo */}
        <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg 
            className="h-6 w-6 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          DreamFactory
        </div>
      </div>
    </div>
  );
}

/**
 * Theme toggle component for authentication pages
 */
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme preference
  useEffect(() => {
    if (mounted) {
      const stored = localStorage.getItem('df-admin-theme') as 'light' | 'dark' | 'system';
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        setTheme(stored);
      }
    }
  }, [mounted]);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      const effectiveTheme = theme === 'system' ? resolvedTheme : theme;
      
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      
      // Update meta theme-color for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute(
          'content', 
          effectiveTheme === 'dark' ? '#111827' : '#ffffff'
        );
      }
    }
  }, [theme, resolvedTheme, mounted]);

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('df-admin-theme', newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Skip link component for accessibility
 * Allows keyboard users to skip to main content
 */
function SkipLink() {
  return (
    <a
      href="#auth-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      Skip to main content
    </a>
  );
}

/**
 * Authentication Layout Component
 * 
 * React authentication layout wrapper component providing common structure for all 
 * authentication pages including login, registration, password reset, and SAML callback.
 * 
 * Features:
 * - Responsive centered layout optimized for mobile, tablet, and desktop
 * - Dark mode theme support with smooth transitions and system preference detection
 * - Consistent DreamFactory branding with logo and color schemes
 * - Error boundary implementation for graceful error handling in authentication flows
 * - Loading state management for authentication operations with user feedback
 * - WCAG 2.1 AA compliance with proper contrast ratios and accessibility features
 * - Integration with Next.js app router for consistent page structure
 * - Keyboard navigation support with focus management
 * - Mobile-responsive design with touch-friendly interactions
 * - Theme toggle for user preference selection
 * 
 * Replaces Angular Material card-based authentication page structure with modern
 * React patterns using Tailwind CSS utility-first approach for maintainable styling.
 */
export function AuthLayout({ 
  children, 
  title,
  subtitle,
  showLogo = true,
  showBranding = true,
  className,
  loading = false
}: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key to close any open dialogs or forms
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Allow form components to handle escape key events
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <AuthLoadingFallback />;
  }

  return (
    <ErrorBoundary
      FallbackComponent={AuthErrorFallback}
      onReset={() => {
        // Clear any error state and refresh if needed
        window.location.reload();
      }}
      onError={(error) => {
        // Log error to monitoring service
        console.error('Authentication Layout Error:', error);
      }}
    >
      <div className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300",
        "flex flex-col justify-center py-12 sm:px-6 lg:px-8",
        className
      )}>
        {/* Skip link for accessibility */}
        <SkipLink />

        {/* Loading overlay */}
        <Transition
          show={loading}
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
            aria-label="Processing authentication"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                <span className="text-gray-900 dark:text-white font-medium">
                  Processing...
                </span>
              </div>
            </div>
          </div>
        </Transition>

        {/* Theme toggle - positioned in top right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Main authentication content */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Header section with logo and branding */}
          {showLogo && (
            <div className="text-center mb-8">
              <DreamFactoryLogo className="mb-4" />
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Authentication form container */}
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
            <main 
              id="auth-content"
              className="focus:outline-none"
              role="main"
              aria-label="Authentication form"
              tabIndex={-1}
            >
              <Suspense fallback={<AuthLoadingFallback />}>
                <ErrorBoundary
                  FallbackComponent={AuthErrorFallback}
                  onReset={() => {
                    // Reset form state if needed
                    window.location.reload();
                  }}
                >
                  {children}
                </ErrorBoundary>
              </Suspense>
            </main>
          </div>

          {/* Footer branding */}
          {showBranding && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by{' '}
                <Link 
                  href="https://www.dreamfactory.com" 
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit DreamFactory website (opens in new tab)"
                >
                  DreamFactory
                </Link>
                {' '}API Platform
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Version 2024.1 • Build with modern APIs in minutes
              </p>
            </div>
          )}
        </div>

        {/* Accessibility announcements */}
        <div 
          id="auth-announcement-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </div>
    </ErrorBoundary>
  );
}

export default AuthLayout;