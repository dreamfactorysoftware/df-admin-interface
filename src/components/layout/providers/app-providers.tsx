/**
 * App Providers - Root Provider Component for DreamFactory Admin Interface
 * 
 * This component combines all application context providers in the correct hierarchy order,
 * replacing Angular module dependency injection with React context composition. Implements
 * efficient provider composition patterns to avoid provider hell anti-pattern while ensuring
 * proper dependency relationships and type safety.
 * 
 * Key Features:
 * - React 19 optimized context composition with minimal re-renders
 * - Correct provider hierarchy ensuring authentication context availability to query provider
 * - Error boundary integration protecting entire application provider tree
 * - Type-safe provider composition with proper TypeScript inference
 * - Performance optimization preventing unnecessary re-renders through provider memoization
 * - Graceful degradation with error recovery mechanisms
 * - Development tools integration for debugging and monitoring
 * 
 * Provider Hierarchy (outer to inner):
 * 1. ErrorBoundary - Catches and handles React errors across entire app
 * 2. ThemeProvider - Provides theme context independent of other providers
 * 3. AuthProvider - Provides authentication context needed by QueryProvider
 * 4. QueryProvider - Uses auth context for API authentication headers
 * 5. NotificationProvider - Provides notifications that may be used by other systems
 * 
 * @version 1.0.0
 * @requires React 19.0.0 for enhanced context composition and concurrent features
 * @requires Next.js 15.1+ for middleware integration and error handling
 * @requires TypeScript 5.8+ for enhanced type inference and React 19 support
 */

'use client';

import React, { useMemo, useCallback, ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { NotificationProvider } from './notification-provider';
import type { 
  AppProvidersProps,
  ProviderConfig,
  ProviderComposition,
  AppProvidersContextValue 
} from './provider-types';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Default configuration for all providers
 * Provides sensible defaults while allowing customization through props
 */
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  auth: {
    autoRefresh: true,
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    debug: process.env.NODE_ENV === 'development',
  },
  theme: {
    defaultTheme: 'system',
    enableSystemDetection: true,
    debug: process.env.NODE_ENV === 'development',
  },
  query: {
    enableDevtools: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
    cacheConfig: {
      defaultStaleTime: 5 * 60 * 1000, // 5 minutes
      defaultCacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
  notification: {
    maxQueueSize: 10,
    position: 'top-right',
    persistAcrossRoutes: true,
    debug: process.env.NODE_ENV === 'development',
  },
  errorBoundary: {
    enableReporting: process.env.NODE_ENV === 'production',
    developmentMode: process.env.NODE_ENV === 'development',
    maxRetries: 3,
    enableAutoRetry: true,
  },
};

/**
 * Provider composition order with dependency management
 * Ensures providers are initialized in correct order based on dependencies
 */
const PROVIDER_COMPOSITION: ProviderComposition[] = [
  {
    name: 'ErrorBoundary',
    priority: 1, // Highest priority - must wrap everything
    dependencies: [],
  },
  {
    name: 'ThemeProvider',
    priority: 2, // Independent provider
    dependencies: [],
  },
  {
    name: 'AuthProvider',
    priority: 3, // Needed by QueryProvider
    dependencies: [],
  },
  {
    name: 'QueryProvider',
    priority: 4, // Depends on AuthProvider for authentication headers
    dependencies: ['AuthProvider'],
  },
  {
    name: 'NotificationProvider',
    priority: 5, // Can use other providers internally
    dependencies: ['ThemeProvider'],
  },
];

// =============================================================================
// App Providers Props Interface
// =============================================================================

/**
 * Props interface for AppProviders component with comprehensive configuration options
 */
export interface AppProvidersProps {
  /** Child components to wrap with all providers */
  children: ReactNode;
  
  /** Configuration for individual providers */
  config?: Partial<ProviderConfig>;
  
  /** Whether to enable debug mode for all providers */
  debug?: boolean;
  
  /** Custom error boundary component */
  errorBoundary?: React.ComponentType<any>;
  
  /** Custom error fallback component */
  errorFallback?: React.ComponentType<any>;
  
  /** Provider-specific overrides */
  providerOverrides?: {
    auth?: Partial<React.ComponentProps<typeof AuthProvider>>;
    theme?: Partial<React.ComponentProps<typeof ThemeProvider>>;
    query?: Partial<React.ComponentProps<typeof QueryProvider>>;
    notification?: Partial<React.ComponentProps<typeof NotificationProvider>>;
    errorBoundary?: Partial<React.ComponentProps<typeof ErrorBoundary>>;
  };
  
  /** Environment-specific configuration */
  environment?: 'development' | 'staging' | 'production';
  
  /** Feature flags for conditional provider loading */
  features?: {
    enableAuth?: boolean;
    enableThemes?: boolean;
    enableNotifications?: boolean;
    enableErrorReporting?: boolean;
    enableQueryDevtools?: boolean;
  };
  
  /** Custom provider initialization hooks */
  onProvidersInitialized?: () => void;
  onProviderError?: (providerName: string, error: Error) => void;
}

// =============================================================================
// Provider Composition Utility Functions
// =============================================================================

/**
 * Merges default configuration with user-provided overrides
 * Implements deep merge strategy for nested configuration objects
 */
function mergeProviderConfig(
  defaultConfig: ProviderConfig,
  userConfig?: Partial<ProviderConfig>
): ProviderConfig {
  if (!userConfig) return defaultConfig;
  
  return {
    auth: { ...defaultConfig.auth, ...userConfig.auth },
    theme: { ...defaultConfig.theme, ...userConfig.theme },
    query: { 
      ...defaultConfig.query, 
      ...userConfig.query,
      cacheConfig: {
        ...defaultConfig.query.cacheConfig,
        ...userConfig.query?.cacheConfig,
      },
    },
    notification: { ...defaultConfig.notification, ...userConfig.notification },
    errorBoundary: { ...defaultConfig.errorBoundary, ...userConfig.errorBoundary },
  };
}

/**
 * Validates provider dependencies are met in the composition order
 * Ensures providers are rendered in correct hierarchy for dependency injection
 */
function validateProviderDependencies(composition: ProviderComposition[]): boolean {
  const availableProviders = new Set<string>();
  
  for (const provider of composition.sort((a, b) => a.priority - b.priority)) {
    // Check if all dependencies are available
    for (const dependency of provider.dependencies) {
      if (!availableProviders.has(dependency)) {
        console.error(
          `Provider ${provider.name} depends on ${dependency} but it's not available. ` +
          `Check provider composition order.`
        );
        return false;
      }
    }
    
    availableProviders.add(provider.name);
  }
  
  return true;
}

/**
 * Creates provider error handler with context information
 * Provides detailed error reporting for provider-specific failures
 */
function createProviderErrorHandler(
  providerName: string, 
  onError?: (providerName: string, error: Error) => void
) {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    const enhancedError = new Error(
      `Provider ${providerName} encountered an error: ${error.message}`
    );
    enhancedError.stack = error.stack;
    
    console.error(`[${providerName}] Provider Error:`, error);
    
    if (errorInfo) {
      console.error(`[${providerName}] Component Stack:`, errorInfo.componentStack);
    }
    
    if (onError) {
      onError(providerName, enhancedError);
    }
  };
}

// =============================================================================
// Individual Provider Wrapper Components
// =============================================================================

/**
 * Memoized AuthProvider wrapper with error handling
 */
const MemoizedAuthProvider = React.memo<{
  children: ReactNode;
  config: ProviderConfig['auth'];
  overrides?: Partial<React.ComponentProps<typeof AuthProvider>>;
  onError?: (error: Error) => void;
}>(({ children, config, overrides, onError }) => {
  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      createProviderErrorHandler('AuthProvider', 
        onError ? (_, err) => onError(err) : undefined
      )(error, errorInfo);
    },
    [onError]
  );

  return (
    <AuthProvider
      autoRefresh={config.autoRefresh}
      refreshInterval={config.refreshInterval}
      debug={config.debug}
      {...overrides}
    >
      {children}
    </AuthProvider>
  );
});

MemoizedAuthProvider.displayName = 'MemoizedAuthProvider';

/**
 * Memoized ThemeProvider wrapper with error handling
 */
const MemoizedThemeProvider = React.memo<{
  children: ReactNode;
  config: ProviderConfig['theme'];
  overrides?: Partial<React.ComponentProps<typeof ThemeProvider>>;
  onError?: (error: Error) => void;
}>(({ children, config, overrides, onError }) => {
  return (
    <ThemeProvider
      defaultTheme={config.defaultTheme}
      enableSystemDetection={config.enableSystemDetection}
      debug={config.debug}
      {...overrides}
    >
      {children}
    </ThemeProvider>
  );
});

MemoizedThemeProvider.displayName = 'MemoizedThemeProvider';

/**
 * Memoized QueryProvider wrapper with error handling
 */
const MemoizedQueryProvider = React.memo<{
  children: ReactNode;
  config: ProviderConfig['query'];
  overrides?: Partial<React.ComponentProps<typeof QueryProvider>>;
  onError?: (error: Error) => void;
}>(({ children, config, overrides, onError }) => {
  return (
    <QueryProvider
      cacheConfig={config.cacheConfig}
      devtools={{ enabled: config.enableDevtools }}
      debug={config.debug}
      {...overrides}
    >
      {children}
    </QueryProvider>
  );
});

MemoizedQueryProvider.displayName = 'MemoizedQueryProvider';

/**
 * Memoized NotificationProvider wrapper with error handling
 */
const MemoizedNotificationProvider = React.memo<{
  children: ReactNode;
  config: ProviderConfig['notification'];
  overrides?: Partial<React.ComponentProps<typeof NotificationProvider>>;
  onError?: (error: Error) => void;
}>(({ children, config, overrides, onError }) => {
  return (
    <NotificationProvider
      maxQueueSize={config.maxQueueSize}
      position={config.position}
      persistAcrossRoutes={config.persistAcrossRoutes}
      debug={config.debug}
      {...overrides}
    >
      {children}
    </NotificationProvider>
  );
});

MemoizedNotificationProvider.displayName = 'MemoizedNotificationProvider';

/**
 * Memoized ErrorBoundary wrapper with enhanced error handling
 */
const MemoizedErrorBoundary = React.memo<{
  children: ReactNode;
  config: ProviderConfig['errorBoundary'];
  overrides?: Partial<React.ComponentProps<typeof ErrorBoundary>>;
  fallback?: React.ComponentType<any>;
  onError?: (error: Error) => void;
}>(({ children, config, overrides, fallback, onError }) => {
  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      createProviderErrorHandler('ErrorBoundary', 
        onError ? (_, err) => onError(err) : undefined
      )(error, errorInfo);
    },
    [onError]
  );

  return (
    <ErrorBoundary
      boundaryId="app-providers-root"
      enableReporting={config.enableReporting}
      developmentMode={config.developmentMode}
      maxRetries={config.maxRetries}
      enableAutoRetry={config.enableAutoRetry}
      fallback={fallback}
      onError={handleError}
      {...overrides}
    >
      {children}
    </ErrorBoundary>
  );
});

MemoizedErrorBoundary.displayName = 'MemoizedErrorBoundary';

// =============================================================================
// Main App Providers Component
// =============================================================================

/**
 * App Providers - Root provider component that combines all application providers
 * 
 * This component implements the provider composition pattern to combine AuthProvider,
 * ThemeProvider, QueryProvider, NotificationProvider, and ErrorBoundary in the correct
 * hierarchy order. Provides performance optimizations through memoization and ensures
 * type safety with comprehensive TypeScript support.
 * 
 * @param props - App providers configuration and children
 * @returns JSX element with all providers properly composed
 */
export function AppProviders({
  children,
  config: userConfig,
  debug = false,
  errorBoundary: CustomErrorBoundary,
  errorFallback: CustomErrorFallback,
  providerOverrides = {},
  environment = process.env.NODE_ENV as 'development' | 'staging' | 'production',
  features = {
    enableAuth: true,
    enableThemes: true,
    enableNotifications: true,
    enableErrorReporting: environment === 'production',
    enableQueryDevtools: environment === 'development',
  },
  onProvidersInitialized,
  onProviderError,
}: AppProvidersProps): JSX.Element {
  // =============================================================================
  // Configuration and Validation
  // =============================================================================

  // Merge user configuration with defaults
  const config = useMemo(
    () => mergeProviderConfig(DEFAULT_PROVIDER_CONFIG, userConfig),
    [userConfig]
  );

  // Apply global debug override
  const finalConfig = useMemo(() => {
    if (debug) {
      return {
        auth: { ...config.auth, debug: true },
        theme: { ...config.theme, debug: true },
        query: { ...config.query, debug: true },
        notification: { ...config.notification, debug: true },
        errorBoundary: { ...config.errorBoundary, developmentMode: true },
      };
    }
    return config;
  }, [config, debug]);

  // Validate provider dependencies on mount
  React.useEffect(() => {
    const isValid = validateProviderDependencies(PROVIDER_COMPOSITION);
    if (!isValid) {
      console.error('Provider dependency validation failed. Check provider composition order.');
    }
    
    if (debug) {
      console.log('AppProviders initialized with configuration:', finalConfig);
      console.log('Provider composition order:', PROVIDER_COMPOSITION);
    }
    
    if (onProvidersInitialized) {
      onProvidersInitialized();
    }
  }, [finalConfig, debug, onProvidersInitialized]);

  // =============================================================================
  // Error Handling
  // =============================================================================

  // Create provider-specific error handlers
  const authErrorHandler = useCallback(
    (error: Error) => onProviderError?.('AuthProvider', error),
    [onProviderError]
  );

  const themeErrorHandler = useCallback(
    (error: Error) => onProviderError?.('ThemeProvider', error),
    [onProviderError]
  );

  const queryErrorHandler = useCallback(
    (error: Error) => onProviderError?.('QueryProvider', error),
    [onProviderError]
  );

  const notificationErrorHandler = useCallback(
    (error: Error) => onProviderError?.('NotificationProvider', error),
    [onProviderError]
  );

  const errorBoundaryHandler = useCallback(
    (error: Error) => onProviderError?.('ErrorBoundary', error),
    [onProviderError]
  );

  // =============================================================================
  // Provider Composition with Feature Flags
  // =============================================================================

  // Build provider tree with conditional rendering based on feature flags
  const providerTree = useMemo(() => {
    let tree = children;

    // Wrap with NotificationProvider (innermost, except for error boundary)
    if (features.enableNotifications) {
      tree = (
        <MemoizedNotificationProvider
          config={finalConfig.notification}
          overrides={providerOverrides.notification}
          onError={notificationErrorHandler}
        >
          {tree}
        </MemoizedNotificationProvider>
      );
    }

    // Wrap with QueryProvider (needs AuthProvider context)
    tree = (
      <MemoizedQueryProvider
        config={{
          ...finalConfig.query,
          enableDevtools: features.enableQueryDevtools && finalConfig.query.enableDevtools,
        }}
        overrides={providerOverrides.query}
        onError={queryErrorHandler}
      >
        {tree}
      </MemoizedQueryProvider>
    );

    // Wrap with AuthProvider (needed by QueryProvider)
    if (features.enableAuth) {
      tree = (
        <MemoizedAuthProvider
          config={finalConfig.auth}
          overrides={providerOverrides.auth}
          onError={authErrorHandler}
        >
          {tree}
        </MemoizedAuthProvider>
      );
    }

    // Wrap with ThemeProvider (independent)
    if (features.enableThemes) {
      tree = (
        <MemoizedThemeProvider
          config={finalConfig.theme}
          overrides={providerOverrides.theme}
          onError={themeErrorHandler}
        >
          {tree}
        </MemoizedThemeProvider>
      );
    }

    // Wrap with ErrorBoundary (outermost)
    const ErrorBoundaryComponent = CustomErrorBoundary || MemoizedErrorBoundary;
    tree = (
      <ErrorBoundaryComponent
        config={{
          ...finalConfig.errorBoundary,
          enableReporting: features.enableErrorReporting && finalConfig.errorBoundary.enableReporting,
        }}
        overrides={providerOverrides.errorBoundary}
        fallback={CustomErrorFallback}
        onError={errorBoundaryHandler}
      >
        {tree}
      </ErrorBoundaryComponent>
    );

    return tree;
  }, [
    children,
    finalConfig,
    features,
    providerOverrides,
    CustomErrorBoundary,
    CustomErrorFallback,
    authErrorHandler,
    themeErrorHandler,
    queryErrorHandler,
    notificationErrorHandler,
    errorBoundaryHandler,
  ]);

  // =============================================================================
  // Development Tools and Debugging
  // =============================================================================

  // Log provider hierarchy in development mode
  React.useEffect(() => {
    if (debug && typeof window !== 'undefined') {
      (window as any).__DREAMFACTORY_PROVIDERS__ = {
        config: finalConfig,
        features,
        composition: PROVIDER_COMPOSITION,
        timestamp: new Date().toISOString(),
      };
    }
  }, [debug, finalConfig, features]);

  return <>{providerTree}</>;
}

// =============================================================================
// Higher-Order Component for Provider Composition
// =============================================================================

/**
 * Higher-order component that wraps components with AppProviders
 * Useful for testing and isolated component development
 */
export function withProviders<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  providersConfig?: Partial<AppProvidersProps>
): React.ComponentType<P> {
  const WithProvidersComponent = (props: P) => (
    <AppProviders {...providersConfig}>
      <WrappedComponent {...props} />
    </AppProviders>
  );

  WithProvidersComponent.displayName = 
    `withProviders(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithProvidersComponent;
}

// =============================================================================
// Context Hook for Provider Status
// =============================================================================

/**
 * Custom hook to access information about provider status and configuration
 * Useful for debugging and monitoring provider health
 */
export function useProviderStatus(): AppProvidersContextValue {
  const [initializationTime] = React.useState(() => Date.now());
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    setRenderCount(count => count + 1);
  });

  return {
    isInitialized: true,
    initializationTime,
    renderCount,
    composition: PROVIDER_COMPOSITION,
    debug: process.env.NODE_ENV === 'development',
  };
}

// =============================================================================
// Provider Status Component for Development
// =============================================================================

/**
 * Development-only component for visualizing provider status
 * Renders provider hierarchy and configuration information
 */
export const ProviderStatusDebugger: React.FC<{ show?: boolean }> = ({ show = false }) => {
  const status = useProviderStatus();

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 10000,
        maxWidth: '300px',
      }}
    >
      <h4>Provider Status</h4>
      <p>Initialized: {status.isInitialized ? 'Yes' : 'No'}</p>
      <p>Render Count: {status.renderCount}</p>
      <p>Composition: {status.composition.length} providers</p>
      <details>
        <summary>Provider Order</summary>
        <ul>
          {status.composition.map((provider, index) => (
            <li key={provider.name}>
              {index + 1}. {provider.name} (Priority: {provider.priority})
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};

// =============================================================================
// Type Exports
// =============================================================================

export type { AppProvidersProps, ProviderConfig, ProviderComposition };

// =============================================================================
// Default Export
// =============================================================================

export default AppProviders;