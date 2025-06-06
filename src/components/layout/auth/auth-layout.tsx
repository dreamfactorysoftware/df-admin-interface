/**
 * Authentication Layout Component
 * 
 * React authentication layout wrapper component providing common structure for
 * all authentication pages including login, registration, password reset, and
 * SAML callback. Implements responsive design with centered content areas,
 * theme support, and consistent styling using Tailwind CSS.
 * 
 * Features:
 * - Responsive layout design supporting mobile, tablet, and desktop screen sizes
 * - Dark mode theme support with smooth transitions and consistent color schemes
 * - Centered content area with appropriate padding and spacing for optimal UX
 * - Consistent branding elements including DreamFactory logo and color schemes
 * - Error boundary implementation for graceful error handling in auth flows
 * - Loading state management for authentication operations with user feedback
 * - WCAG 2.1 AA compliance with proper contrast ratios and accessibility features
 * - Integration with Next.js app router for consistent page structure
 * 
 * Architecture:
 * - Replaces Angular Material card-based authentication page structure
 * - Uses Tailwind CSS flexbox utilities instead of Angular Material layout
 * - Integrates with React context for theme management and error handling
 * - Provides reusable container patterns for authentication form components
 * 
 * @fileoverview Authentication layout wrapper for all auth-related pages
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { Suspense } from 'react';
import { useTheme } from '../../../hooks/use-theme';
import type { ThemeMode } from '../../../types/theme';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface AuthLayoutProps {
  /** Child components to render within the authentication layout */
  children: React.ReactNode;
  
  /** Optional title for the authentication page */
  title?: string;
  
  /** Optional subtitle or description for the page */
  subtitle?: string;
  
  /** Whether to show the DreamFactory logo */
  showLogo?: boolean;
  
  /** Whether to show a theme toggle in the top corner */
  showThemeToggle?: boolean;
  
  /** Maximum width for the content container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether to show the background pattern */
  showBackgroundPattern?: boolean;
  
  /** Additional CSS classes for the container */
  className?: string;
  
  /** Custom loading message for authentication operations */
  loadingMessage?: string;
  
  /** Whether the layout is in a loading state */
  isLoading?: boolean;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Authentication Error Boundary Component
 * 
 * Provides comprehensive error handling specifically for authentication flows
 * with graceful degradation and user-friendly error messages. Implements
 * React error boundary patterns optimized for auth-related error scenarios.
 */
class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log authentication errors for monitoring
    console.error('Authentication Error Boundary caught an error:', error, errorInfo);
    
    // In production, integrate with error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // errorReporting.captureException(error, { context: 'authentication', ...errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI for authentication errors
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
          role="alert"
          aria-labelledby="auth-error-title"
          aria-describedby="auth-error-description"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400">
              <svg 
                className="w-full h-full" 
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
            </div>
            
            <h1 
              id="auth-error-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              Authentication Error
            </h1>
            
            <p 
              id="auth-error-description"
              className="text-gray-600 dark:text-gray-400 mb-4"
            >
              An error occurred during authentication. Please try again.
            </p>
            
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

/**
 * Authentication Loading Component
 * 
 * Provides loading state UI specifically designed for authentication operations
 * with accessible loading indicators and customizable messaging.
 */
const AuthLoading: React.FC<{ message?: string }> = ({ 
  message = 'Authenticating...' 
}) => (
  <div 
    className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
    role="status"
    aria-label={message}
  >
    <div className="text-center">
      {/* Loading Spinner */}
      <div className="w-8 h-8 mx-auto mb-4">
        <svg
          className="animate-spin text-primary-600 dark:text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {message}
      </p>
    </div>
  </div>
);

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================

/**
 * Theme Toggle Component
 * 
 * Compact theme toggle specifically designed for authentication pages,
 * positioned in the top-right corner for easy access without interfering
 * with the authentication workflow.
 */
const AuthThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolvedTheme === 'light' ? (
        // Moon icon for dark mode
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};

// ============================================================================
// DREAMFACTORY LOGO COMPONENT
// ============================================================================

/**
 * DreamFactory Logo Component
 * 
 * Renders the DreamFactory logo with consistent branding and responsive sizing.
 * Supports both light and dark themes with appropriate color schemes.
 */
const DreamFactoryLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    {/* Logo Container */}
    <div className="flex items-center space-x-3">
      {/* Logo Icon */}
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      
      {/* Logo Text */}
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          DreamFactory
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          Admin Interface
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN AUTHENTICATION LAYOUT COMPONENT
// ============================================================================

/**
 * Authentication Layout Component
 * 
 * Main layout wrapper component for all authentication pages. Provides
 * consistent structure, theming, error handling, and responsive design
 * across login, registration, password reset, and SAML callback pages.
 * 
 * @param props - Component properties
 * @returns Authentication layout with providers and structure
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
  showThemeToggle = true,
  maxWidth = 'md',
  showBackgroundPattern = true,
  className = '',
  loadingMessage,
  isLoading = false,
}) => {
  const { resolvedTheme, mounted } = useTheme();

  // Container max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Show loading state if specified
  if (isLoading) {
    return <AuthLoading message={loadingMessage} />;
  }

  return (
    <AuthErrorBoundary>
      <div 
        className={`
          min-h-screen flex flex-col
          bg-gray-50 dark:bg-gray-900
          transition-colors duration-200
          ${className}
        `}
      >
        {/* Background Pattern */}
        {showBackgroundPattern && (
          <div 
            className="absolute inset-0 opacity-5 dark:opacity-10"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600" />
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="auth-bg-pattern"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="1"
                    fill="currentColor"
                    className="text-primary-600 dark:text-primary-400"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#auth-bg-pattern)" />
            </svg>
          </div>
        )}

        {/* Theme Toggle */}
        {showThemeToggle && (
          <div className="absolute top-4 right-4 z-10">
            <Suspense fallback={<div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />}>
              <AuthThemeToggle />
            </Suspense>
          </div>
        )}

        {/* Main Content Container */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className={`w-full ${maxWidthClasses[maxWidth]} space-y-6`}>
            {/* Logo Section */}
            {showLogo && (
              <div className="text-center">
                <DreamFactoryLogo className="mb-4" />
              </div>
            )}

            {/* Title and Subtitle */}
            {(title || subtitle) && (
              <div className="text-center">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 sm:p-8">
                <Suspense 
                  fallback={
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 animate-spin border-2 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} DreamFactory Software, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export default AuthLayout;

// Export additional components for standalone use
export { AuthErrorBoundary, AuthLoading, AuthThemeToggle, DreamFactoryLogo };

// Export types for external usage
export type { AuthLayoutProps, AuthErrorBoundaryProps };