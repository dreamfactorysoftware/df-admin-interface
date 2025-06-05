'use client';

import { Suspense, ErrorBoundary } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ClockIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';

/**
 * Security section navigation items with permissions and route configuration
 */
interface SecurityNavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  description: string;
}

const SECURITY_NAV_ITEMS: SecurityNavItem[] = [
  {
    id: 'security-overview',
    path: '/api-security',
    label: 'Security Overview',
    icon: ShieldCheckIcon,
    permissions: ['api.security.read'],
    description: 'API security dashboard and configuration overview'
  },
  {
    id: 'roles',
    path: '/api-security/roles',
    label: 'Roles',
    icon: UsersIcon,
    permissions: ['api.security.read', 'roles.read'],
    description: 'User role management and permission assignment'
  },
  {
    id: 'limits',
    path: '/api-security/limits',
    label: 'Rate Limits',
    icon: ClockIcon,
    permissions: ['api.security.read', 'limits.read'],
    description: 'API rate limiting and throttling configuration'
  }
];

/**
 * Security Section Error Boundary Component
 * Provides graceful error handling specifically for security-related operations
 */
interface SecurityErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

function SecurityErrorBoundary({ children, fallback: Fallback }: SecurityErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={Fallback || SecurityErrorFallback}
      onError={(error, errorInfo) => {
        // Log security-specific errors with appropriate context
        console.error('[Security Error Boundary]', {
          error: error.message,
          stack: error.stack,
          errorInfo,
          timestamp: new Date().toISOString(),
          section: 'api-security'
        });

        // In production, you would send this to your error tracking service
        if (process.env.NODE_ENV === 'production') {
          // sendErrorToTrackingService(error, { section: 'api-security', ...errorInfo });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Default error fallback component for security section
 */
interface SecurityErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function SecurityErrorFallback({ error, resetError }: SecurityErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
        <div className="flex justify-center mb-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Security Section Error
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          An error occurred while loading the security management interface. 
          This may be due to insufficient permissions or a temporary system issue.
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
          <strong>Error:</strong> {error.message}
        </div>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className={cn(
              "w-full px-4 py-2 text-sm font-medium rounded-md",
              "bg-primary-600 text-white hover:bg-primary-700",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Try Again
          </button>
          
          <Link
            href="/api-security"
            className={cn(
              "block w-full px-4 py-2 text-sm font-medium rounded-md",
              "text-gray-700 bg-gray-100 hover:bg-gray-200",
              "dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Return to Security Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Security Navigation Component
 * Provides section-specific navigation with active state highlighting
 */
function SecurityNavigation() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Filter navigation items based on user permissions
  const filteredNavItems = SECURITY_NAV_ITEMS.filter(item => {
    if (!isAuthenticated || !user) return false;
    
    // Root admins have access to all security features
    if (user.isRootAdmin || user.isSysAdmin) return true;
    
    // Check if user has any of the required permissions
    return item.permissions.some(permission => 
      user.permissions?.includes(permission)
    );
  });

  const isActiveRoute = (itemPath: string): boolean => {
    if (itemPath === '/api-security') {
      return pathname === '/api-security';
    }
    return pathname.startsWith(itemPath);
  };

  if (filteredNavItems.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Limited Access
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You don't have permissions to access security management features. 
              Contact your administrator for access to API security configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav 
      className="space-y-1" 
      aria-label="Security section navigation"
      role="navigation"
    >
      {filteredNavItems.map((item) => {
        const isActive = isActiveRoute(item.path);
        const IconComponent = item.icon;
        
        return (
          <Link
            key={item.id}
            href={item.path}
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
              isActive
                ? "bg-primary-100 text-primary-900 border-r-4 border-primary-600 dark:bg-primary-900/50 dark:text-primary-100"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            )}
            aria-current={isActive ? "page" : undefined}
            title={item.description}
          >
            <IconComponent 
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                isActive 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
              )}
              aria-hidden="true"
            />
            <span className="flex-1">{item.label}</span>
            
            {/* Active route indicator */}
            {isActive && (
              <ChevronRightIcon 
                className="ml-2 h-4 w-4 text-primary-600 dark:text-primary-400" 
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Security Section Loading Component
 * Provides consistent loading state for security-related operations
 */
function SecurityLoadingState() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-primary-500 bg-white dark:bg-gray-800 transition ease-in-out duration-150">
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" 
            xmlns="http://www.w3.org/2000/svg" 
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
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading security configuration...</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Verifying permissions and loading security management interface
        </p>
      </div>
    </div>
  );
}

/**
 * Security Section Layout Component
 * 
 * Provides the layout structure for all API security pages including roles management,
 * rate limits configuration, and security overview. Features comprehensive error boundaries,
 * authentication context integration, responsive design, and accessibility compliance.
 * 
 * Key Features:
 * - Next.js 15.1+ app router layout conventions
 * - Authentication context providers and middleware integration
 * - Security-specific navigation with permission-based filtering
 * - Error boundaries for graceful error handling
 * - Loading states for security workflows
 * - Responsive design with Tailwind CSS
 * - WCAG 2.1 AA accessibility compliance
 * - Active route highlighting with semantic markup
 * 
 * @param props Layout component props
 * @param props.children Child page components to render within the layout
 * @returns Security section layout with navigation, error handling, and authentication
 */
interface ApiSecurityLayoutProps {
  children: React.ReactNode;
}

export default function ApiSecurityLayout({ children }: ApiSecurityLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 p-6 overflow-y-auto">
            <SecurityLoadingState />
          </main>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (handled by middleware, but defensive check)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to access the API security management interface.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Main Sidebar */}
      <Sidebar />
      
      {/* Security Section Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Security Section Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  API Security
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage roles, permissions, and security policies for your APIs
                </p>
              </div>
            </div>
            
            {/* Breadcrumb Navigation */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                  <Link 
                    href="/" 
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <ChevronRightIcon className="h-4 w-4 mx-2" aria-hidden="true" />
                </li>
                <li>
                  <span className="text-gray-900 dark:text-white font-medium">
                    API Security
                  </span>
                </li>
                {pathname !== '/api-security' && (
                  <>
                    <li>
                      <ChevronRightIcon className="h-4 w-4 mx-2" aria-hidden="true" />
                    </li>
                    <li>
                      <span className="text-gray-900 dark:text-white">
                        {SECURITY_NAV_ITEMS.find(item => pathname.startsWith(item.path))?.label}
                      </span>
                    </li>
                  </>
                )}
              </ol>
            </nav>
          </div>
          
          {/* Security Section Navigation */}
          <div className="mt-4">
            <SecurityNavigation />
          </div>
        </header>
        
        {/* Main Content Area with Error Boundary */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <SecurityErrorBoundary>
            <Suspense fallback={<SecurityLoadingState />}>
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </Suspense>
          </SecurityErrorBoundary>
        </main>
      </div>
    </div>
  );
}