/**
 * Root provider component for the DreamFactory Admin Interface application.
 * 
 * This component combines all application context providers in the correct hierarchical order,
 * replacing Angular module dependency injection with React context composition. It ensures
 * proper provider dependencies, error boundary protection, and performance optimization
 * through provider memoization patterns compatible with React 19 concurrent features.
 * 
 * Provider Hierarchy (ordered by dependency requirements):
 * 1. ErrorBoundary - Catches errors from all child providers and components
 * 2. QueryProvider - Provides TanStack React Query client for server state management
 * 3. AuthProvider - Provides authentication context (depends on QueryProvider for user data)
 * 4. ThemeProvider - Provides theme context (depends on AuthProvider for user preferences)
 * 5. NotificationProvider - Provides notification context (depends on AuthProvider for user settings)
 * 
 * @version 1.0.0
 * @requires React 19.0.0 with enhanced concurrent features and context optimizations
 * @requires TypeScript 5.8+ with enhanced React 19 support for context typing
 * @requires Next.js 15.1+ for SSR-compatible provider composition patterns
 */

'use client';

import React, { memo, useMemo, type ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { NotificationProvider } from './notification-provider';
import type { 
  AppProvidersConfig, 
  AppProvidersProps,
  AuthProviderProps,
  ThemeProviderProps,
  QueryProviderProps,
  NotificationProviderProps,
  ErrorProviderProps,
  DEFAULT_PROVIDER_CONFIG,
  PROVIDER_DISPLAY_NAMES 
} from './provider-types';

// =============================================================================
// Constants & Configuration
// =============================================================================

/**
 * Default configuration for all providers with performance-optimized settings.
 * These values are derived from the technical specification requirements for
 * cache hit responses under 50ms and real-time validation under 100ms.
 */
const DEFAULT_APP_CONFIG: Required<AppProvidersConfig> = {
  auth: {
    refreshInterval: DEFAULT_PROVIDER_CONFIG.auth.refreshInterval,
    autoRefresh: DEFAULT_PROVIDER_CONFIG.auth.autoRefresh,
    debug: process.env.NODE_ENV === 'development',
  },
  theme: {
    defaultTheme: DEFAULT_PROVIDER_CONFIG.theme.defaultTheme,
    enableSystemDetection: DEFAULT_PROVIDER_CONFIG.theme.enableSystemDetection,
    storageKey: DEFAULT_PROVIDER_CONFIG.theme.storageKey,
    debug: process.env.NODE_ENV === 'development',
  },
  query: {
    cacheConfig: DEFAULT_PROVIDER_CONFIG.query.cacheConfig,
    devtools: {
      enabled: process.env.NODE_ENV === 'development',
      position: 'bottom-right',
      initialIsOpen: false,
      buttonPosition: 'bottom-right',
    },
    debug: process.env.NODE_ENV === 'development',
  },
  notification: {
    maxQueueSize: DEFAULT_PROVIDER_CONFIG.notification.maxQueueSize,
    position: DEFAULT_PROVIDER_CONFIG.notification.position,
    persistAcrossRoutes: DEFAULT_PROVIDER_CONFIG.notification.persistAcrossRoutes,
    debug: process.env.NODE_ENV === 'development',
  },
  error: {
    maxHistoryEntries: DEFAULT_PROVIDER_CONFIG.error.maxHistoryEntries,
    developmentMode: DEFAULT_PROVIDER_CONFIG.error.developmentMode,
    reportingConfig: {
      enabled: process.env.NODE_ENV === 'production',
      includeUserContext: true,
      includeStackTrace: true,
      sampleRate: 1.0,
      maxErrorsPerSession: 50,
      ignoredErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Loading chunk',
      ],
    },
    debug: process.env.NODE_ENV === 'development',
  },
  development: {
    enableDevtools: process.env.NODE_ENV === 'development',
    enableDebugLogging: process.env.NODE_ENV === 'development',
    mockApiCalls: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_API === 'true',
  },
} as const;

/**
 * Provider order configuration ensuring proper dependency resolution.
 * Lower numbers indicate higher priority (outer providers).
 */
const PROVIDER_ORDER = {
  error: 1,      // Must be outermost to catch all errors
  query: 2,      // Required by auth provider for user data fetching
  auth: 3,       // Required by theme and notification providers for user preferences
  theme: 4,      // Required by notification provider for theme-aware styling
  notification: 5, // Innermost provider
} as const;

// =============================================================================
// Provider Composition Component
// =============================================================================

/**
 * Optimized provider composition component that avoids provider hell anti-pattern.
 * Uses React 19's enhanced context optimizations and proper dependency ordering.
 */
const ProviderComposition = memo<{
  children: ReactNode;
  config: Required<AppProvidersConfig>;
}>(({ children, config }) => {
  // Memoize provider configurations to prevent unnecessary re-renders
  const errorConfig = useMemo<ErrorProviderProps>(() => ({
    reportingConfig: config.error.reportingConfig,
    maxHistoryEntries: config.error.maxHistoryEntries,
    developmentMode: config.error.developmentMode,
    debug: config.error.debug,
  }), [config.error]);

  const queryConfig = useMemo<QueryProviderProps>(() => ({
    cacheConfig: config.query.cacheConfig,
    devtools: config.query.devtools,
    debug: config.query.debug,
  }), [config.query]);

  const authConfig = useMemo<AuthProviderProps>(() => ({
    refreshInterval: config.auth.refreshInterval,
    autoRefresh: config.auth.autoRefresh,
    debug: config.auth.debug,
  }), [config.auth]);

  const themeConfig = useMemo<ThemeProviderProps>(() => ({
    defaultTheme: config.theme.defaultTheme,
    enableSystemDetection: config.theme.enableSystemDetection,
    storageKey: config.theme.storageKey,
    debug: config.theme.debug,
  }), [config.theme]);

  const notificationConfig = useMemo<NotificationProviderProps>(() => ({
    maxQueueSize: config.notification.maxQueueSize,
    position: config.notification.position,
    persistAcrossRoutes: config.notification.persistAcrossRoutes,
    debug: config.notification.debug,
  }), [config.notification]);

  return (
    <ErrorBoundary {...errorConfig}>
      <QueryProvider {...queryConfig}>
        <AuthProvider {...authConfig}>
          <ThemeProvider {...themeConfig}>
            <NotificationProvider {...notificationConfig}>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
});

ProviderComposition.displayName = 'ProviderComposition';

// =============================================================================
// Main AppProviders Component
// =============================================================================

/**
 * Root application providers component that combines all context providers
 * in the correct hierarchical order with comprehensive error handling and
 * performance optimizations for React 19 concurrent features.
 * 
 * This component replaces Angular's NgModule providers array and dependency
 * injection system with React's context composition pattern, ensuring:
 * - Proper provider hierarchy for dependency resolution
 * - Error boundary protection for the entire provider tree
 * - Performance optimization through memoization and React 19 optimizations
 * - Type-safe provider composition with TypeScript inference
 * - Development mode debugging and monitoring capabilities
 * 
 * @param props - Component props with children and optional configuration
 * @returns JSX element with all providers composed in correct order
 */
export const AppProviders: React.FC<AppProvidersProps> = memo<AppProvidersProps>(({
  children,
  config = {},
  strictMode = false,
  enableProfiling = process.env.NODE_ENV === 'development',
}) => {
  // Merge provided configuration with defaults, optimizing for performance
  const mergedConfig = useMemo<Required<AppProvidersConfig>>(() => ({
    auth: { ...DEFAULT_APP_CONFIG.auth, ...config.auth },
    theme: { ...DEFAULT_APP_CONFIG.theme, ...config.theme },
    query: { ...DEFAULT_APP_CONFIG.query, ...config.query },
    notification: { ...DEFAULT_APP_CONFIG.notification, ...config.notification },
    error: { 
      ...DEFAULT_APP_CONFIG.error, 
      ...config.error,
      reportingConfig: {
        ...DEFAULT_APP_CONFIG.error.reportingConfig,
        ...config.error?.reportingConfig,
      },
    },
    development: { ...DEFAULT_APP_CONFIG.development, ...config.development },
  }), [config]);

  // Log provider initialization in development mode
  if (mergedConfig.development.enableDebugLogging) {
    console.group('🔧 AppProviders Initialization');
    console.log('Provider Order:', PROVIDER_ORDER);
    console.log('Configuration:', mergedConfig);
    console.log('Strict Mode:', strictMode);
    console.log('Profiling:', enableProfiling);
    console.groupEnd();
  }

  // Create provider tree with proper error boundaries and performance optimization
  const providerTree = useMemo(() => (
    <ProviderComposition config={mergedConfig}>
      {children}
    </ProviderComposition>
  ), [children, mergedConfig]);

  // Wrap in React.StrictMode if enabled for enhanced development debugging
  if (strictMode) {
    return (
      <React.StrictMode>
        {enableProfiling ? (
          <React.Profiler
            id="AppProviders"
            onRender={(id, phase, actualDuration) => {
              if (mergedConfig.development.enableDebugLogging) {
                console.log(`🔍 Profiler [${id}]: ${phase} phase took ${actualDuration}ms`);
              }
            }}
          >
            {providerTree}
          </React.Profiler>
        ) : (
          providerTree
        )}
      </React.StrictMode>
    );
  }

  return enableProfiling ? (
    <React.Profiler
      id="AppProviders"
      onRender={(id, phase, actualDuration) => {
        if (mergedConfig.development.enableDebugLogging) {
          console.log(`🔍 Profiler [${id}]: ${phase} phase took ${actualDuration}ms`);
        }
      }}
    >
      {providerTree}
    </React.Profiler>
  ) : (
    providerTree
  );
});

AppProviders.displayName = PROVIDER_DISPLAY_NAMES.app;

// =============================================================================
// Development Utilities
// =============================================================================

/**
 * Development utility hook for inspecting provider configuration.
 * Only available in development mode for debugging purposes.
 */
export const useAppProvidersDebug = () => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('useAppProvidersDebug is only available in development mode');
  }

  return useMemo(() => ({
    defaultConfig: DEFAULT_APP_CONFIG,
    providerOrder: PROVIDER_ORDER,
    displayNames: PROVIDER_DISPLAY_NAMES,
    isReactStrictMode: typeof window !== 'undefined' && !!document.querySelector('[data-reactroot]'),
  }), []);
};

/**
 * Type guard to check if provider configuration is valid.
 * Ensures runtime type safety for provider configuration objects.
 */
export const isValidProviderConfig = (config: unknown): config is AppProvidersConfig => {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;
  
  // Check for valid optional configuration objects
  const validKeys = ['auth', 'theme', 'query', 'notification', 'error', 'development'];
  const configKeys = Object.keys(c);
  
  return configKeys.every(key => validKeys.includes(key));
};

/**
 * Provider configuration validator for development debugging.
 * Validates provider configuration structure and warns about potential issues.
 */
export const validateProviderConfig = (config: AppProvidersConfig): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group('🔍 Provider Configuration Validation');

  try {
    // Validate configuration structure
    if (!isValidProviderConfig(config)) {
      console.warn('⚠️ Invalid provider configuration structure detected');
    }

    // Check for potential performance issues
    if (config.query?.cacheConfig?.defaultStaleTime && config.query.cacheConfig.defaultStaleTime < 30000) {
      console.warn('⚠️ Short stale time may cause excessive API requests');
    }

    if (config.notification?.maxQueueSize && config.notification.maxQueueSize > 20) {
      console.warn('⚠️ Large notification queue size may impact performance');
    }

    // Validate provider dependencies
    if (config.auth?.autoRefresh === false && config.auth?.refreshInterval) {
      console.warn('⚠️ Refresh interval set but auto-refresh is disabled');
    }

    console.log('✅ Provider configuration validation completed');
  } catch (error) {
    console.error('❌ Provider configuration validation failed:', error);
  } finally {
    console.groupEnd();
  }
};

// =============================================================================
// Exports
// =============================================================================

export default AppProviders;

export type {
  AppProvidersProps,
  AppProvidersConfig,
} from './provider-types';

/**
 * Re-export provider types for convenience
 */
export type {
  AuthProviderProps,
  ThemeProviderProps,
  QueryProviderProps,
  NotificationProviderProps,
  ErrorProviderProps,
} from './provider-types';

/**
 * Export configuration constants for external use
 */
export {
  DEFAULT_APP_CONFIG,
  PROVIDER_ORDER,
};