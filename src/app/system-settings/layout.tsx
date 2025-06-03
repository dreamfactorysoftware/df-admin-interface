/**
 * System Settings Layout Component
 * 
 * Provides React Context providers for theme management, authentication state, and 
 * system configuration state using Zustand. Establishes the structural foundation 
 * for all system administration pages with consistent navigation, error boundaries, 
 * and responsive Tailwind CSS layouts while replacing Angular's module-based 
 * dependency injection.
 * 
 * Key Features:
 * - React Context providers for authentication, theme, and system configuration state
 * - Zustand store integration for system settings workflow state with persistence
 * - Responsive layout with WCAG 2.1 AA accessibility compliance
 * - Error boundaries for graceful error handling throughout system administration
 * - Next.js middleware authentication flow integration
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0 / Next.js 15.1+
 */

'use client';

import React, { Suspense, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useSystemSettingsStore } from '@/lib/system-settings-store';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

/**
 * System Settings Layout Props Interface
 * 
 * Defines the props interface for the system settings layout component,
 * supporting children components and optional error boundary configuration.
 */
interface SystemSettingsLayoutProps {
  /** Child components to render within the layout */
  children: ReactNode;
  /** Optional error boundary fallback component */
  errorFallback?: ReactNode;
  /** Optional className for layout customization */
  className?: string;
}

/**
 * System Configuration Context Interface
 * 
 * Defines the context interface for system configuration state management,
 * providing access to system settings, loading states, and configuration actions.
 */
interface SystemConfigurationContextType {
  /** Current system configuration state */
  systemConfig: SystemConfiguration | null;
  /** System configuration loading state */
  isLoading: boolean;
  /** System configuration error state */
  error: Error | null;
  /** Refresh system configuration action */
  refreshConfig: () => Promise<void>;
  /** Update system configuration action */
  updateConfig: (config: Partial<SystemConfiguration>) => Promise<void>;
  /** Reset system configuration to defaults */
  resetConfig: () => void;
}

/**
 * System Configuration Data Interface
 * 
 * Defines the structure for system configuration data including
 * environment settings, feature flags, and administrative preferences.
 */
interface SystemConfiguration {
  /** Environment configuration */
  environment: {
    version: string;
    buildDate: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
  };
  /** Feature flags and toggles */
  features: {
    advancedLogging: boolean;
    systemMetrics: boolean;
    maintenanceMode: boolean;
    apiDocumentation: boolean;
  };
  /** Administrative preferences */
  preferences: {
    defaultPageSize: number;
    autoRefreshInterval: number;
    notificationLevel: 'all' | 'important' | 'critical';
    systemTheme: 'light' | 'dark' | 'system';
  };
  /** Security configuration */
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordComplexity: boolean;
    twoFactorAuth: boolean;
  };
}

/**
 * System Configuration Context
 * 
 * React Context for sharing system configuration state across all
 * system administration components. Provides centralized access to
 * configuration data, loading states, and configuration actions.
 */
const SystemConfigurationContext = React.createContext<SystemConfigurationContextType | null>(null);

/**
 * Loading Fallback Component
 * 
 * Provides an accessible loading state with proper ARIA attributes
 * and responsive design for system configuration initialization.
 */
const LoadingFallback: React.FC = () => (
  <div 
    className="flex items-center justify-center min-h-screen bg-background"
    role="status"
    aria-label="Loading system settings"
  >
    <div className="flex flex-col items-center space-y-4">
      {/* Loading spinner with accessibility */}
      <div 
        className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"
        aria-hidden="true"
      />
      
      {/* Loading text with proper contrast */}
      <p className="text-sm text-muted-foreground font-medium">
        Loading system settings...
      </p>
      
      {/* Screen reader only progress indicator */}
      <span className="sr-only">
        Please wait while system configuration is being loaded
      </span>
    </div>
  </div>
);

/**
 * Error Fallback Component
 * 
 * Provides accessible error display with recovery options for
 * system configuration failures. Includes retry functionality
 * and proper error messaging.
 */
const ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div 
    className="flex items-center justify-center min-h-screen bg-background px-4"
    role="alert"
    aria-labelledby="error-title"
    aria-describedby="error-description"
  >
    <div className="max-w-md w-full text-center space-y-6">
      {/* Error icon */}
      <div className="mx-auto w-16 h-16 bg-error-50 rounded-full flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-error-600" 
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
      
      {/* Error title */}
      <h1 id="error-title" className="text-xl font-semibold text-foreground">
        System Configuration Error
      </h1>
      
      {/* Error description */}
      <p id="error-description" className="text-muted-foreground">
        Unable to load system settings configuration. This may be due to a temporary
        network issue or server problem.
      </p>
      
      {/* Error details (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-left">
          <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-auto text-muted-foreground">
            {error.message}
            {error.stack && `\n${error.stack}`}
          </pre>
        </details>
      )}
      
      {/* Recovery actions */}
      <div className="space-y-3">
        <button
          onClick={retry}
          className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md 
                   hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 
                   focus:ring-offset-2 transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="retry-description"
        >
          Retry Loading
        </button>
        
        <p id="retry-description" className="text-xs text-muted-foreground">
          Click to attempt loading the system configuration again
        </p>
      </div>
    </div>
  </div>
);

/**
 * System Configuration Provider Component
 * 
 * Provides system configuration context to child components with
 * integrated Zustand store management, error handling, and loading states.
 */
const SystemConfigurationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Zustand store integration for system settings state
  const {
    systemConfig,
    isLoading,
    error,
    refreshConfig,
    updateConfig,
    resetConfig,
    initializeConfig
  } = useSystemSettingsStore();

  // Initialize system configuration on mount
  React.useEffect(() => {
    initializeConfig();
  }, [initializeConfig]);

  // Memoized context value for performance optimization
  const contextValue = React.useMemo<SystemConfigurationContextType>(() => ({
    systemConfig,
    isLoading,
    error,
    refreshConfig,
    updateConfig,
    resetConfig
  }), [systemConfig, isLoading, error, refreshConfig, updateConfig, resetConfig]);

  // Error boundary for system configuration failures
  if (error && !systemConfig) {
    return <ErrorFallback error={error} retry={refreshConfig} />;
  }

  return (
    <SystemConfigurationContext.Provider value={contextValue}>
      {children}
    </SystemConfigurationContext.Provider>
  );
};

/**
 * Main System Settings Layout Component
 * 
 * Provides the complete layout structure for system administration pages
 * with integrated providers, error boundaries, and responsive design.
 * Replaces Angular module-based dependency injection with React patterns.
 */
const SystemSettingsLayout: React.FC<SystemSettingsLayoutProps> = ({
  children,
  errorFallback,
  className = ''
}) => {
  // Authentication state from custom hook
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Theme state from custom hook
  const { theme, systemTheme } = useTheme();

  // Apply theme classes dynamically
  const themeClasses = React.useMemo(() => {
    const appliedTheme = theme === 'system' ? systemTheme : theme;
    return appliedTheme === 'dark' ? 'dark' : '';
  }, [theme, systemTheme]);

  // Authentication guard - redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Authentication will be handled by Next.js middleware
      // This is a client-side validation for additional security
      console.warn('System settings access attempted without authentication');
    }
  }, [isAuthenticated, authLoading]);

  // Show loading state during authentication
  if (authLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className={`${themeClasses} theme-transition`}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#system-settings-main"
        className="sr-only-focusable fixed top-4 left-4 z-50 px-4 py-2 
                 bg-primary-600 text-white rounded-md focus:not-sr-only"
      >
        Skip to main content
      </a>

      {/* Error Boundary for React component errors */}
      <ErrorBoundary
        fallback={errorFallback || (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center space-y-4">
              <h1 className="text-xl font-semibold text-foreground">
                System Settings Error
              </h1>
              <p className="text-muted-foreground">
                An error occurred while loading the system settings interface.
                Please refresh the page or contact support if the problem persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      >
        {/* System Configuration Provider */}
        <SystemConfigurationProvider>
          {/* Main layout container with responsive design */}
          <div className={`min-h-screen bg-background ${className}`}>
            {/* System settings header with breadcrumbs */}
            <header className="bg-card border-b border-border">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  {/* Breadcrumb navigation */}
                  <nav aria-label="System settings breadcrumb" className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">System Settings</span>
                  </nav>
                  
                  {/* User context display */}
                  {user && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">
                        Welcome, {user.firstName || user.name || 'Administrator'}
                      </span>
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">
                          {(user.firstName?.[0] || user.name?.[0] || 'A').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main content area */}
            <main 
              id="system-settings-main"
              className="flex-1 relative"
              role="main"
              aria-label="System settings content"
            >
              {/* Suspense wrapper for lazy loading */}
              <Suspense fallback={<LoadingFallback />}>
                {/* Content container with responsive padding */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </Suspense>
            </main>

            {/* Footer for system information */}
            <footer className="bg-card border-t border-border py-4">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>DreamFactory Admin Interface</span>
                  <span>System Settings</span>
                </div>
              </div>
            </footer>
          </div>
        </SystemConfigurationProvider>
      </ErrorBoundary>
    </div>
  );
};

/**
 * Custom hook to access System Configuration Context
 * 
 * Provides access to system configuration state and actions.
 * Must be used within a SystemConfigurationProvider.
 */
export const useSystemConfiguration = (): SystemConfigurationContextType => {
  const context = React.useContext(SystemConfigurationContext);
  
  if (!context) {
    throw new Error(
      'useSystemConfiguration must be used within a SystemConfigurationProvider. ' +
      'Make sure your component is wrapped with SystemSettingsLayout.'
    );
  }
  
  return context;
};

// Export the main layout component
export default SystemSettingsLayout;

// Export additional types for consumers
export type {
  SystemSettingsLayoutProps,
  SystemConfigurationContextType,
  SystemConfiguration
};