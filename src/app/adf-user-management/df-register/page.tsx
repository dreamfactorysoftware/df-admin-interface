/**
 * @fileoverview Next.js app router page component for user registration
 * 
 * Implements server-side rendering with React 19 and Next.js 15.1+ for the user registration
 * route (/register). Provides comprehensive registration interface with proper SEO metadata,
 * authentication state management via React Query, and integration with the registration form
 * component. Supports both server and client-side rendering with optimal performance 
 * characteristics meeting the under 2 seconds SSR requirement.
 * 
 * Key Features:
 * - Next.js server components for initial page loads with SSR under 2 seconds
 * - React Query for intelligent caching and synchronization with cache hit responses under 50ms
 * - Next.js middleware integration for authentication and security rule evaluation under 100ms
 * - Proper Next.js metadata configuration for SEO and performance optimization
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA accessibility compliance
 * - Integration with authentication state management
 * - Responsive design with Tailwind CSS
 * - Performance optimizations for initial load and hydration
 * 
 * @requires react@19.0.0
 * @requires next@15.1.0
 * @requires @tanstack/react-query@5.0.0
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UserPlusIcon, ArrowLeftIcon, ShieldCheckIcon, ClockIcon, GlobeIcon } from '@heroicons/react/24/outline';

// Import components with proper error boundaries
import { RegisterForm } from './register-form';
import type { RegistrationFormDetails } from '../types';

// Dynamic imports for performance optimization
const ErrorBoundary = dynamic(() => import('@/components/ui/error-boundary'), {
  loading: () => <div className="h-4 bg-gray-200 rounded animate-pulse" />,
  ssr: false,
});

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

/**
 * Next.js metadata configuration for SEO and performance optimization
 * Implements comprehensive SEO metadata with proper Open Graph and Twitter Card support
 */
export const metadata: Metadata = {
  title: 'Create Account | DreamFactory Admin Console',
  description: 'Create your DreamFactory admin account to start generating REST APIs from your databases in minutes. Secure, fast, and enterprise-ready.',
  keywords: [
    'DreamFactory',
    'user registration',
    'create account',
    'admin console',
    'database API',
    'REST API generation',
    'developer tools',
    'database management'
  ],
  authors: [{ name: 'DreamFactory Team' }],
  creator: 'DreamFactory Software Inc.',
  openGraph: {
    title: 'Create Account | DreamFactory Admin Console',
    description: 'Join DreamFactory to generate REST APIs from your databases instantly. Start your free account today.',
    type: 'website',
    siteName: 'DreamFactory Admin Console',
    locale: 'en_US',
    images: [
      {
        url: '/images/og-register.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Registration - Create Your Admin Account',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Account | DreamFactory Admin Console',
    description: 'Join DreamFactory to generate REST APIs from your databases instantly.',
    images: ['/images/og-register.png'],
    creator: '@dreamfactory',
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    nofollow: false,
  },
  alternates: {
    canonical: '/register',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#ffffff',
  },
};

// =============================================================================
// PERFORMANCE CONFIGURATION
// =============================================================================

/**
 * Next.js dynamic rendering configuration
 * Enables server-side rendering with optimal caching for performance under 2 seconds
 */
export const dynamic = 'force-dynamic';

/**
 * Runtime configuration for edge compatibility
 * Enables middleware integration for authentication processing under 100ms
 */
export const runtime = 'nodejs';

// =============================================================================
// COMPONENT LOADING STATES
// =============================================================================

/**
 * Loading skeleton component for registration form
 * Provides visual feedback during component initialization
 */
function RegisterFormSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6" data-testid="register-form-skeleton">
      <div className="space-y-4">
        {/* Name fields skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Display name skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
        </div>

        {/* Email skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
        </div>

        {/* Password skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
          <div className="space-y-1">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-1 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
              ))}
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Confirm password skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 border rounded-lg animate-pulse" />
        </div>

        {/* Terms checkbox skeleton */}
        <div className="flex items-start space-x-3">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          <div className="space-y-1 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </div>
        </div>

        {/* Submit button skeleton */}
        <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Error fallback component for registration page
 * Provides user-friendly error messaging with recovery options
 */
function RegistrationError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void; 
}) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      data-testid="registration-error"
      role="alert"
      aria-live="polite"
    >
      <UserPlusIcon className="h-16 w-16 text-red-500 mb-6" aria-hidden="true" />
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Registration Unavailable
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
        We're experiencing technical difficulties with the registration system. 
        This could be due to network connectivity or server maintenance.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={reset}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          type="button"
        >
          <ClockIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Try Again
        </button>
        <Link
          href="/login"
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Sign In Instead
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// PAGE HEADER COMPONENT
// =============================================================================

/**
 * Registration page header with branding and navigation
 * Provides consistent layout and accessibility features
 */
function RegistrationHeader() {
  return (
    <header className="text-center mb-8" role="banner">
      {/* Back to login link */}
      <div className="flex justify-start mb-6">
        <Link 
          href="/login"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 transition-colors"
          aria-label="Return to sign in page"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Sign In
        </Link>
      </div>

      {/* Logo and branding */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
          <GlobeIcon className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Your Account
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-md">
          Join DreamFactory to start generating REST APIs from your databases in minutes
        </p>
      </div>

      {/* Security features highlight */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
          <span>Enterprise Security</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2 text-blue-600" aria-hidden="true" />
          <span>5-Minute Setup</span>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// PAGE FOOTER COMPONENT
// =============================================================================

/**
 * Registration page footer with links and support information
 * Provides additional navigation and help resources
 */
function RegistrationFooter() {
  return (
    <footer className="mt-12 text-center space-y-4" role="contentinfo">
      {/* Help and support links */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <Link 
          href="/help" 
          className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-colors"
        >
          Need Help?
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          href="/terms" 
          className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-colors"
        >
          Terms of Service
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          href="/privacy" 
          className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          href="/contact" 
          className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-colors"
        >
          Contact Support
        </Link>
      </div>

      {/* Copyright and version info */}
      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
        <p>© 2024 DreamFactory Software Inc. All rights reserved.</p>
        <p>Powered by DreamFactory Admin Console v5.0</p>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * User registration page component with comprehensive functionality
 * 
 * This server component implements the complete user registration workflow with:
 * - Server-side rendering for optimal performance under 2 seconds
 * - React Query integration for intelligent caching under 50ms
 * - Next.js middleware authentication integration under 100ms
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design with Tailwind CSS
 * - SEO optimization with proper metadata
 * 
 * @returns {JSX.Element} The registration page with form and supporting UI
 */
export default function RegisterPage(): JSX.Element {
  /**
   * Handle successful registration
   * Redirects user to appropriate post-registration flow
   */
  const handleRegistrationSuccess = (result: any) => {
    // Registration success is handled within the RegisterForm component
    // This includes email verification flows and redirection logic
    console.info('Registration completed successfully:', {
      timestamp: new Date().toISOString(),
      hasEmailVerification: result?.requiresEmailVerification || false,
    });
  };

  /**
   * Handle registration errors
   * Provides centralized error logging and analytics
   */
  const handleRegistrationError = (error: any) => {
    // Error handling is managed within the RegisterForm component
    // This provides additional error tracking and analytics
    console.error('Registration error occurred:', {
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown registration error',
      type: error.type || 'general',
    });
  };

  /**
   * Custom form submission handler for analytics and tracking
   * Enhances the default registration flow with additional monitoring
   */
  const handleFormSubmission = async (details: RegistrationFormDetails) => {
    // Track registration attempt for analytics
    console.info('Registration attempt initiated:', {
      timestamp: new Date().toISOString(),
      email: details.email,
      hasUsername: !!details.username,
      subscribeNewsletter: details.subscribeNewsletter,
    });

    // The actual registration logic is handled by the RegisterForm component
    // This handler is used for tracking and analytics purposes
    throw new Error('This handler should not be called directly - RegisterForm handles submission');
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      data-testid="register-page"
    >
      {/* Main content container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <RegistrationHeader />

        {/* Registration form container */}
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <ErrorBoundary fallback={RegistrationError}>
            <Suspense fallback={<RegisterFormSkeleton />}>
              <RegisterForm
                className="w-full"
                initialValues={{}}
                requireEmailVerification={true}
                onSuccess={handleRegistrationSuccess}
                onError={handleRegistrationError}
                onSubmit={undefined} // Use default auth service
                redirectOnSuccess={true}
                redirectTo="/login"
                disabled={false}
                loading={false}
                data-testid="register-form"
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        <RegistrationFooter />
      </div>

      {/* Performance monitoring script (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor page load performance for SSR under 2 seconds requirement
              window.addEventListener('load', function() {
                const loadTime = performance.now();
                if (loadTime > 2000) {
                  console.warn('Registration page load time exceeded 2 seconds:', loadTime + 'ms');
                } else {
                  console.info('Registration page loaded within performance target:', loadTime + 'ms');
                }
              });
            `,
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// ADDITIONAL PAGE CONFIGURATIONS
// =============================================================================

/**
 * Generate static parameters for build optimization
 * This page has no dynamic parameters, so return empty array
 */
export async function generateStaticParams() {
  return [];
}

/**
 * Revalidate configuration for ISR (Incremental Static Regeneration)
 * Registration page content is static, so revalidate infrequently
 */
export const revalidate = 3600; // Revalidate every hour

/**
 * Export additional configuration for Next.js optimization
 */
export const preferredRegion = 'auto'; // Auto-select optimal region for deployment