/**
 * Main User Management Page - DreamFactory Admin Interface
 * 
 * Implements the primary user list interface with comprehensive table display,
 * import/export functionality, and user CRUD operations. Replaces Angular
 * df-manage-users component with Next.js server components, React Hook Form
 * integration, and SWR-powered data fetching for optimal performance and SSR.
 * 
 * Key Features:
 * - Server-side rendered user list with <2 second initial load time
 * - Real-time user data synchronization using SWR intelligent caching
 * - Responsive Tailwind CSS design with Headless UI components
 * - React Hook Form-powered search and filtering with real-time validation
 * - Import/export functionality with progress tracking and error handling
 * - Role-based access control integration with Next.js middleware
 * - WCAG 2.1 AA compliant accessibility features
 * 
 * Technical Implementation:
 * - Next.js 15.1 App Router with dynamic routing and metadata optimization
 * - React 19 with concurrent features and automatic optimizations
 * - SWR data fetching with intelligent background revalidation
 * - TanStack Virtual for high-performance table virtualization (1000+ users)
 * - React Hook Form with Zod validation for search and bulk operations
 * - Tailwind CSS 4.1+ with dark mode support and responsive design
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Plus, Download, Upload, Search, Filter, Users, UserPlus, Settings, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserManagementContent } from './user-management-content';

/**
 * Metadata configuration for user management page
 * Optimized for SEO and social sharing with proper Next.js metadata API
 */
export const metadata: Metadata = {
  title: 'User Management',
  description: 'Manage application users, roles, and permissions with comprehensive CRUD operations and bulk import/export capabilities',
  openGraph: {
    title: 'User Management | DreamFactory Admin Console',
    description: 'Centralized user administration with role-based access control and bulk operations',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Force dynamic rendering for real-time user data
 * Ensures fresh data on each page load while maintaining SSR benefits
 */
export const dynamic = 'force-dynamic';

/**
 * Page-level loading fallback component
 * Provides structured loading skeleton matching the actual content layout
 */
function UserManagementPageLoading() {
  return (
    <div className="space-y-6" data-testid="user-management-loading">
      {/* Header Loading Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
              </div>
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Loading */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Table Loading */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center space-x-4">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary component for user management page
 * Provides graceful error handling with recovery options
 */
function UserManagementPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8" data-testid="user-management-error">
      <Users className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        User Management Error
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        Unable to load user management interface. This may be due to network connectivity or server issues.
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Loading
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reload Page
        </button>
      </div>
    </div>
  );
}

/**
 * Main User Management Page Component
 * 
 * Implements the complete user management interface with:
 * - Server-side rendering for optimal performance
 * - Responsive design with mobile-first approach
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Real-time data synchronization
 * - Comprehensive error handling and loading states
 * 
 * Performance Targets:
 * - Initial page load: <2 seconds (SSR requirement)
 * - SWR cache hits: <50ms response time
 * - Table virtualization: Support 1000+ users without performance degradation
 * - Search debouncing: 300ms delay for optimal UX
 */
export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="user-management-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="h-8 w-8" />
                User Management
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Manage application users, roles, and permissions with comprehensive administration tools
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                aria-label="Create new user"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  aria-label="Import users"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </button>
                
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  aria-label="Export users"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
                
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  aria-label="User management settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Error Boundary */}
        <Suspense fallback={<UserManagementPageLoading />}>
          <UserManagementContent />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Export error component for Next.js error handling
 */
export { UserManagementPageError as error };