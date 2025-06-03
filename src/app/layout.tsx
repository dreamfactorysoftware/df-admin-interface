/**
 * @fileoverview Root Layout Component for DreamFactory Admin Interface
 * 
 * Serves as the foundational layout for Next.js 15.1 App Router implementation,
 * replacing Angular's app.module.ts and app.component.ts functionality.
 * Provides comprehensive SSR-compatible provider infrastructure including
 * React Query for server state management, Zustand for global state coordination,
 * theme management with Tailwind CSS 4.1+, and authentication context integration.
 * 
 * Key Features:
 * - React 19 server components with SSR under 2 seconds
 * - React Query intelligent caching with cache hit responses under 50ms
 * - Zustand global state management with persistence
 * - Tailwind CSS dark mode with consistent theme injection
 * - Next.js middleware-based authentication integration
 * - Comprehensive error boundaries and loading states
 * - WCAG 2.1 AA accessibility compliance
 * - SEO optimization with metadata API
 * 
 * Performance Requirements:
 * - SSR page loads under 2 seconds (React/Next.js Integration Requirements)
 * - Cache hit responses under 50ms (React/Next.js Integration Requirements)
 * - Middleware processing integration under 100ms
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { PropsWithChildren, Suspense } from 'react';

// Global styles with Tailwind CSS 4.1+
import '@/styles/globals.css';

// Core provider components (will be created by other team members)
import { AppProviders } from '@/lib/providers';

// Layout components (will be created by other team members)
import { SideNavigation } from '@/components/layout/side-nav';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Authentication types for middleware integration
import type { UserSession } from '@/types/auth';

/**
 * Font configuration optimized for DreamFactory admin interface
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: true,
});

/**
 * Metadata configuration for SEO optimization and responsive design
 * Implements Next.js metadata API for enhanced performance and search visibility
 */
export const metadata: Metadata = {
  title: {
    template: '%s | DreamFactory Admin',
    default: 'DreamFactory Admin - Database API Management Platform',
  },
  description: 'Comprehensive database API management platform enabling REST API generation from any database in under 5 minutes. Supports MySQL, PostgreSQL, Oracle, MongoDB, Snowflake and more.',
  keywords: [
    'database api',
    'rest api generation',
    'database management',
    'api development',
    'dreamfactory',
    'mysql api',
    'postgresql api',
    'mongodb api',
    'oracle api',
    'snowflake api'
  ],
  authors: [{ name: 'DreamFactory Software Inc.' }],
  creator: 'DreamFactory Software Inc.',
  publisher: 'DreamFactory Software Inc.',
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://admin.dreamfactory.com',
    siteName: 'DreamFactory Admin',
    title: 'DreamFactory Admin - Database API Management Platform',
    description: 'Generate comprehensive REST APIs from any database in under 5 minutes with advanced security, documentation, and management features.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Admin Interface',
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    site: '@dreamfactory',
    creator: '@dreamfactory',
    title: 'DreamFactory Admin - Database API Management',
    description: 'Generate REST APIs from any database in under 5 minutes. Advanced security, auto-documentation, and comprehensive management.',
    images: ['/og-image.png'],
  },
  
  // Robot directives
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  
  // Additional metadata
  category: 'technology',
  classification: 'Database API Management Platform',
  
  // Security and privacy
  referrer: 'strict-origin-when-cross-origin',
  
  // Verification and ownership
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  
  // Alternate versions
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://admin.dreamfactory.com',
  },
  
  // App-specific metadata
  applicationName: 'DreamFactory Admin',
  generator: 'Next.js 15.1',
  
  // Icons and manifest
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#6366f1' },
    ],
  },
  manifest: '/manifest.json',
  
  // Theme color for browser UI
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  
  // App links and deep linking
  appLinks: {
    web: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://admin.dreamfactory.com',
      should_fallback: true,
    },
  },
};

/**
 * Viewport configuration for responsive design and mobile optimization
 * Ensures proper rendering across all device types and screen sizes
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

/**
 * Interface for authentication context derived from middleware
 * Represents the user session state passed from Next.js middleware
 */
interface AuthenticationContext {
  isAuthenticated: boolean;
  user: UserSession | null;
  sessionToken: string | null;
  permissions: string[];
  isAdmin: boolean;
  isRootAdmin: boolean;
}

/**
 * Extract authentication context from middleware headers
 * Safely parses authentication information injected by middleware
 * 
 * @returns Authentication context derived from middleware
 */
function getAuthContextFromHeaders(): AuthenticationContext {
  try {
    const headersList = headers();
    
    // Extract authentication context from middleware headers (development only)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      const userId = headersList.get('x-user-id');
      const userEmail = headersList.get('x-user-email');
      const isAdmin = headersList.get('x-is-admin') === 'true';
      
      if (userId && userEmail) {
        return {
          isAuthenticated: true,
          user: {
            id: parseInt(userId, 10),
            email: userEmail,
            firstName: '',
            lastName: '',
            name: userEmail.split('@')[0],
            sessionId: '',
            sessionToken: '',
            isRootAdmin: false,
            isSysAdmin: isAdmin,
            roleId: 0,
            tokenExpiryDate: new Date(Date.now() + 3600000), // 1 hour
          },
          sessionToken: '',
          permissions: [],
          isAdmin,
          isRootAdmin: false,
        };
      }
    }
    
    // Default unauthenticated state
    return {
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      permissions: [],
      isAdmin: false,
      isRootAdmin: false,
    };
  } catch (error) {
    // Fallback to unauthenticated state on error
    console.warn('[LAYOUT] Failed to extract auth context from headers:', error);
    
    return {
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      permissions: [],
      isAdmin: false,
      isRootAdmin: false,
    };
  }
}

/**
 * Loading Fallback Component
 * Provides consistent loading state during navigation and initial load
 */
function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" className="text-primary-600" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Loading DreamFactory Admin
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Initializing database API management platform...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Fallback Component
 * Provides graceful error handling with recovery options
 */
function AppErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="flex items-center space-x-3">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Application Error
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              An unexpected error occurred while loading the application.
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {error.message}
            </pre>
          </details>
          
          <div className="flex space-x-3">
            <button
              onClick={reset}
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Layout Container Component
 * Provides the core layout structure with navigation and content areas
 */
function LayoutContainer({ 
  children, 
  authContext 
}: PropsWithChildren<{ authContext: AuthenticationContext }>) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation - Only show when authenticated */}
      {authContext.isAuthenticated && (
        <aside className="hidden w-64 overflow-y-auto bg-white shadow-sm dark:bg-gray-800 lg:block">
          <div className="flex h-full flex-col">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner size="sm" />
                </div>
              }
            >
              <SideNavigation 
                user={authContext.user}
                isAdmin={authContext.isAdmin}
                isRootAdmin={authContext.isRootAdmin}
              />
            </Suspense>
          </div>
        </aside>
      )}
      
      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col ${authContext.isAuthenticated ? 'lg:pl-0' : ''}`}>
        {/* Top Navigation Bar - Only show when authenticated */}
        {authContext.isAuthenticated && (
          <header className="sticky top-0 z-40 bg-white shadow-sm dark:bg-gray-800 lg:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Open sidebar"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                  DreamFactory Admin
                </h1>
              </div>
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Root Layout Component
 * 
 * Serves as the foundational layout for the entire Next.js application,
 * integrating all required providers and establishing the base HTML structure.
 * Implements SSR-compatible provider architecture with React 19 server components,
 * theme management, authentication context, and performance optimizations.
 * 
 * Key Features:
 * - React Query provider for intelligent caching and synchronization
 * - Zustand provider for global state management with persistence
 * - Theme provider for dark/light mode with Tailwind CSS integration
 * - Authentication context integration with Next.js middleware
 * - Error boundaries for graceful error handling and recovery
 * - Loading states for improved user experience during navigation
 * - SEO optimization with metadata API and structured data
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - Responsive design with mobile-first approach
 * 
 * @param children - Child components to render within the layout
 * @returns JSX element representing the complete application layout
 */
export default function RootLayout({ children }: PropsWithChildren) {
  // Extract authentication context from middleware headers
  const authContext = getAuthContextFromHeaders();
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Critical CSS for preventing FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
            }
            html {
              font-family: var(--font-inter), system-ui, sans-serif;
              line-height: 1.5;
              -webkit-text-size-adjust: 100%;
              -moz-tab-size: 4;
              tab-size: 4;
            }
            body {
              margin: 0;
              background-color: #f9fafb;
            }
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #111827;
              }
            }
          `
        }} />
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for API endpoints */}
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
      </head>
      
      <body className="min-h-screen bg-gray-50 font-sans antialiased dark:bg-gray-900">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        
        {/* Global Provider Infrastructure */}
        <Suspense fallback={<AppLoadingFallback />}>
          <AppProviders 
            initialAuthState={authContext}
            errorBoundaryFallback={AppErrorBoundary}
          >
            {/* Main Layout Container */}
            <LayoutContainer authContext={authContext}>
              <div id="main-content" className="focus:outline-none" tabIndex={-1}>
                {children}
              </div>
            </LayoutContainer>
          </AppProviders>
        </Suspense>
        
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Development Mode
          </div>
        )}
        
        {/* Screen reader announcements */}
        <div
          id="sr-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        
        {/* Theme script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('dreamfactory-admin-store');
                  if (theme) {
                    var parsed = JSON.parse(theme);
                    var themeValue = parsed.state?.theme;
                    if (themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {
                  console.warn('Failed to apply stored theme:', e);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

// Export types for use by other components
export type { AuthenticationContext };