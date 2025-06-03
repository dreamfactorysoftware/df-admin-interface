/**
 * @fileoverview API Security Layout Component
 * 
 * Security section layout component that provides shared navigation, authentication 
 * context, and error boundaries for all security-related pages including limits 
 * and roles management. Implements consistent theming and responsive design across 
 * the security management interface.
 * 
 * This layout wraps all API security routes (/api-security/*) and provides:
 * - Shared navigation with active route highlighting
 * - Authentication context and middleware integration
 * - Error boundaries for security workflows
 * - Loading states and responsive design
 * - Consistent theme injection across components
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds (React/Next.js Integration Requirements)
 * - Client-side navigation under 100ms
 * - WCAG 2.1 AA compliance maintained
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Metadata } from 'next';

// Layout and navigation components
import { SecurityNavigation } from './components/security-nav';
import { Sidebar } from '@/components/layout/sidebar';

// UI components
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

// Global styles
import '@/styles/globals.css';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Props interface for the API Security Layout component
 */
interface ApiSecurityLayoutProps {
  /** Child pages rendered within the layout */
  children: React.ReactNode;
}

/**
 * Error boundary fallback component props
 */
interface SecurityErrorFallbackProps {
  /** Error object from React Error Boundary */
  error: Error;
  /** Reset error boundary function */
  resetErrorBoundary: () => void;
}

/**
 * Loading component props for security section
 */
interface SecurityLoadingProps {
  /** Optional loading message */
  message?: string;
}

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

/**
 * Metadata for API Security section
 * Provides SEO optimization and accessibility information
 */
export const metadata: Metadata = {
  title: {
    template: '%s | API Security | DreamFactory Admin',
    default: 'API Security | DreamFactory Admin'
  },
  description: 'Manage API security configurations including rate limits and role-based access controls for DreamFactory services.',
  keywords: ['API Security', 'Rate Limits', 'Role Management', 'Access Control', 'DreamFactory'],
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
  }
};

// ============================================================================
// ERROR BOUNDARY COMPONENTS
// ============================================================================

/**
 * Error fallback component for security section failures
 * Provides user-friendly error messages and recovery actions
 * 
 * @param props - Error fallback component props
 * @returns JSX element with error recovery interface
 */
function SecurityErrorFallback({ error, resetErrorBoundary }: SecurityErrorFallbackProps): JSX.Element {
  // Log error for monitoring (development only)
  if (process.env.NODE_ENV === 'development') {
    console.error('[API_SECURITY_ERROR]', error);
  }

  return (
    <div 
      className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 p-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Security Configuration Error
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          We encountered an issue loading the security management interface. 
          This may be due to a temporary service interruption or network connectivity issue.
        </p>
      </div>
      
      <Alert variant="destructive" className="max-w-md">
        <Alert.Icon name="alert-triangle" />
        <Alert.Title>Error Details</Alert.Title>
        <Alert.Description className="font-mono text-sm">
          {error.message || 'Unknown security configuration error'}
        </Alert.Description>
      </Alert>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={resetErrorBoundary}
          variant="default"
          size="default"
          className="min-w-[120px]"
        >
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          size="default"
          className="min-w-[120px]"
        >
          Go to Dashboard
        </Button>
      </div>
      
      <details className="mt-4 max-w-md">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Technical Details
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
          {error.stack || error.toString()}
        </pre>
      </details>
    </div>
  );
}

/**
 * Loading component for security section data fetching
 * Displays skeleton states and loading indicators
 * 
 * @param props - Loading component props
 * @returns JSX element with loading interface
 */
function SecurityLoading({ message = 'Loading security configuration...' }: SecurityLoadingProps): JSX.Element {
  return (
    <div 
      className="flex min-h-[200px] w-full flex-col items-center justify-center space-y-4 p-8"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner 
        size="lg" 
        className="text-primary"
        aria-label="Loading security data"
      />
      <p className="text-muted-foreground text-sm animate-pulse">
        {message}
      </p>
      
      {/* Skeleton UI for navigation */}
      <div className="w-full max-w-md space-y-2 mt-8">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse opacity-75" />
        <div className="h-8 bg-muted rounded animate-pulse opacity-50" />
      </div>
      
      {/* Screen reader only content */}
      <span className="sr-only">
        Loading API security management interface. Please wait while we fetch your security configurations.
      </span>
    </div>
  );
}

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

/**
 * API Security Layout Component
 * 
 * Provides the layout structure for all API security pages including shared
 * navigation, error boundaries, loading states, and consistent theming.
 * 
 * Features:
 * - Next.js app router layout conventions
 * - Security section navigation with active route highlighting
 * - Authentication context and middleware integration
 * - Error boundaries for security workflows
 * - Responsive design with Tailwind CSS
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @param props - Layout component props
 * @returns JSX element with complete layout structure
 */
export default function ApiSecurityLayout({ 
  children 
}: ApiSecurityLayoutProps): JSX.Element {
  
  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content"
        className="sr-only-focusable fixed top-4 left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:not-sr-only"
      >
        Skip to main content
      </a>
      
      {/* Main layout container */}
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-border bg-card">
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <div className="p-4">
                  <Alert variant="destructive">
                    <Alert.Icon name="alert-triangle" />
                    <Alert.Title>Navigation Error</Alert.Title>
                    <Alert.Description>
                      Unable to load navigation menu.
                    </Alert.Description>
                  </Alert>
                  <Button 
                    onClick={resetErrorBoundary} 
                    size="sm" 
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
              onError={(error) => {
                // Log navigation errors
                console.error('[SIDEBAR_ERROR]', error);
              }}
            >
              <Suspense fallback={
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              }>
                <Sidebar />
              </Suspense>
            </ErrorBoundary>
          </div>
        </aside>
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          
          {/* Security section navigation */}
          <header className="border-b border-border bg-card shadow-sm">
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <div className="p-4">
                  <Alert variant="destructive">
                    <Alert.Icon name="alert-triangle" />
                    <Alert.Title>Navigation Error</Alert.Title>
                    <Alert.Description>
                      Security navigation failed to load.
                    </Alert.Description>
                  </Alert>
                  <Button 
                    onClick={resetErrorBoundary} 
                    size="sm" 
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
              onError={(error) => {
                console.error('[SECURITY_NAV_ERROR]', error);
              }}
            >
              <Suspense fallback={
                <div className="px-6 py-4">
                  <div className="flex space-x-4">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              }>
                <SecurityNavigation />
              </Suspense>
            </ErrorBoundary>
          </header>
          
          {/* Main content with error boundary */}
          <main 
            id="main-content"
            className="flex-1 overflow-auto bg-background"
            role="main"
            aria-label="API Security Management"
          >
            <ErrorBoundary
              FallbackComponent={SecurityErrorFallback}
              onError={(error, errorInfo) => {
                // Log security page errors for monitoring
                console.error('[SECURITY_PAGE_ERROR]', error, errorInfo);
                
                // In production, send to error monitoring service
                if (process.env.NODE_ENV === 'production') {
                  // Example: Sentry, LogRocket, or custom error service
                  // errorMonitoring.captureException(error, { context: errorInfo });
                }
              }}
              onReset={() => {
                // Reset any global state if needed
                window.location.reload();
              }}
            >
              <Suspense 
                fallback={<SecurityLoading />}
              >
                <div className="container mx-auto px-6 py-8 max-w-7xl">
                  {children}
                </div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      
      {/* Mobile sidebar overlay (for responsive design) */}
      <div className="lg:hidden">
        {/* This would be handled by the Sidebar component's mobile state */}
      </div>
    </div>
  );
}

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

/**
 * Named export for testing and composition
 */
export { ApiSecurityLayout };

/**
 * Type exports for external usage
 */
export type {
  ApiSecurityLayoutProps,
  SecurityErrorFallbackProps,
  SecurityLoadingProps
};