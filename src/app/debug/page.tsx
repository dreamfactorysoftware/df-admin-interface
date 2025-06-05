'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Development-only debug page component for Next.js app router
 * Provides comprehensive debugging capabilities during development
 * 
 * Features:
 * - Development environment restriction
 * - localStorage data inspection
 * - React Query cache status monitoring
 * - Next.js development metrics
 * - Application state inspection
 * - Enhanced error tracking capabilities
 */
export default function DebugPage() {
  const router = useRouter();
  const [debugData, setDebugData] = useState({
    localStorage: {} as Record<string, any>,
    sessionStorage: {} as Record<string, any>,
    environment: {} as Record<string, any>,
    performance: {} as Record<string, any>,
    cache: {} as Record<string, any>,
    buildInfo: {} as Record<string, any>,
    errors: [] as Array<{ timestamp: string; error: string; stack?: string }>,
  });
  const [isClient, setIsClient] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Development environment check
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setIsClient(true);
    
    // Redirect to home if not in development environment
    if (!isDevelopment) {
      router.push('/');
      return;
    }

    // Load initial debug data
    loadDebugData();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(loadDebugData, 5000);
    setRefreshInterval(interval);

    // Set up error tracking
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      addError(args.join(' '));
    };

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      addError(event.message, event.error?.stack);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError(`Unhandled Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isDevelopment, router, refreshInterval]);

  const addError = (error: string, stack?: string) => {
    setDebugData(prev => ({
      ...prev,
      errors: [
        ...prev.errors.slice(-19), // Keep only last 20 errors
        {
          timestamp: new Date().toISOString(),
          error,
          stack,
        },
      ],
    }));
  };

  const loadDebugData = () => {
    if (!isClient) return;

    try {
      // Extract localStorage data
      const localStorageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            localStorageData[key] = value ? JSON.parse(value) : value;
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      // Extract sessionStorage data
      const sessionStorageData: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const value = sessionStorage.getItem(key);
            sessionStorageData[key] = value ? JSON.parse(value) : value;
          } catch {
            sessionStorageData[key] = sessionStorage.getItem(key);
          }
        }
      }

      // Extract environment information
      const environmentData = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      };

      // Extract performance metrics
      const performanceData: Record<string, any> = {};
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          performanceData.navigation = {
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
            loadComplete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
            firstPaint: navigation.responseStart ? Math.round(navigation.responseStart - navigation.navigationStart) : 0,
            responseTime: Math.round(navigation.responseEnd - navigation.responseStart),
            transferSize: navigation.transferSize,
            encodedBodySize: navigation.encodedBodySize,
            decodedBodySize: navigation.decodedBodySize,
          };
        }

        const memory = (performance as any).memory;
        if (memory) {
          performanceData.memory = {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
          };
        }
      }

      // Extract React Query cache data (if available)
      const cacheData: Record<string, any> = {};
      try {
        // Check for React Query cache in window object
        const queryClient = (window as any).__REACT_QUERY_CLIENT__;
        if (queryClient && queryClient.getQueryCache) {
          const cache = queryClient.getQueryCache();
          cacheData.reactQuery = {
            queriesCount: cache.getAll().length,
            queries: cache.getAll().map((query: any) => ({
              queryKey: query.queryKey,
              state: query.state.status,
              dataUpdateCount: query.state.dataUpdateCount,
              errorUpdateCount: query.state.errorUpdateCount,
              lastUpdated: query.state.dataUpdatedAt,
            })),
          };
        }

        // Check for SWR cache (if available)
        const swrCache = (window as any).__SWR_CACHE__;
        if (swrCache) {
          cacheData.swr = {
            keys: Object.keys(swrCache),
            count: Object.keys(swrCache).length,
          };
        }

        // Check for Zustand stores (if available)
        const zustandStores = (window as any).__ZUSTAND_STORES__;
        if (zustandStores) {
          cacheData.zustand = {
            storesCount: Object.keys(zustandStores).length,
            stores: Object.keys(zustandStores),
          };
        }
      } catch (error) {
        cacheData.error = 'Cache inspection failed';
      }

      // Extract build information
      const buildData = {
        nodeEnv: process.env.NODE_ENV,
        nextVersion: process.env.NEXT_PUBLIC_VERSION || 'unknown',
        buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
        gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
        features: {
          turbopack: process.env.NODE_ENV === 'development' && process.env.TURBOPACK === '1',
          typescript: true,
          tailwind: true,
          swc: true,
        },
      };

      setDebugData(prev => ({
        ...prev,
        localStorage: localStorageData,
        sessionStorage: sessionStorageData,
        environment: environmentData,
        performance: performanceData,
        cache: cacheData,
        buildInfo: buildData,
      }));
    } catch (error) {
      console.error('Failed to load debug data:', error);
      addError(`Debug data loading failed: ${error}`);
    }
  };

  const clearStorage = (type: 'localStorage' | 'sessionStorage') => {
    try {
      if (type === 'localStorage') {
        localStorage.clear();
      } else {
        sessionStorage.clear();
      }
      loadDebugData();
    } catch (error) {
      addError(`Failed to clear ${type}: ${error}`);
    }
  };

  const clearErrors = () => {
    setDebugData(prev => ({
      ...prev,
      errors: [],
    }));
  };

  const exportDebugData = () => {
    try {
      const dataStr = JSON.stringify(debugData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `debug-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      addError(`Export failed: ${error}`);
    }
  };

  // Don't render in production or during SSR
  if (!isDevelopment || !isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Debug Console</h1>
              <p className="mt-2 text-sm text-gray-600">
                Development-only debugging interface for DreamFactory Admin Interface
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadDebugData}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                🔄 Refresh
              </button>
              <button
                onClick={exportDebugData}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                📥 Export
              </button>
            </div>
          </div>
        </div>

        {/* Debug Cards Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Build Information */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                🏗️ Build Information
              </h3>
              <div className="mt-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Environment</dt>
                    <dd className="text-sm text-gray-900">{debugData.buildInfo.nodeEnv}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Next.js Version</dt>
                    <dd className="text-sm text-gray-900">{debugData.buildInfo.nextVersion}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Build Time</dt>
                    <dd className="text-sm text-gray-900">{debugData.buildInfo.buildTime}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Git Commit</dt>
                    <dd className="text-sm text-gray-900 font-mono text-xs">
                      {debugData.buildInfo.gitCommit}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500">Enabled Features</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(debugData.buildInfo.features || {}).map(([feature, enabled]) => (
                      <span
                        key={feature}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {feature}: {enabled ? '✅' : '❌'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                ⚡ Performance Metrics
              </h3>
              <div className="mt-4">
                {debugData.performance.navigation && (
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">DOM Content Loaded</dt>
                      <dd className="text-sm text-gray-900">
                        {debugData.performance.navigation.domContentLoaded}ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Load Complete</dt>
                      <dd className="text-sm text-gray-900">
                        {debugData.performance.navigation.loadComplete}ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Response Time</dt>
                      <dd className="text-sm text-gray-900">
                        {debugData.performance.navigation.responseTime}ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Transfer Size</dt>
                      <dd className="text-sm text-gray-900">
                        {Math.round(debugData.performance.navigation.transferSize / 1024)}KB
                      </dd>
                    </div>
                  </dl>
                )}
                {debugData.performance.memory && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500">Memory Usage</h4>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-gray-500">Used</dt>
                        <dd className="text-sm text-gray-900">
                          {debugData.performance.memory.usedJSHeapSize}MB
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Total</dt>
                        <dd className="text-sm text-gray-900">
                          {debugData.performance.memory.totalJSHeapSize}MB
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Limit</dt>
                        <dd className="text-sm text-gray-900">
                          {debugData.performance.memory.jsHeapSizeLimit}MB
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cache Status */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                🗄️ Cache Status
              </h3>
              <div className="mt-4 space-y-4">
                {debugData.cache.reactQuery && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">React Query</h4>
                    <p className="text-sm text-gray-900">
                      {debugData.cache.reactQuery.queriesCount} queries cached
                    </p>
                    {debugData.cache.reactQuery.queries.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <ul className="text-xs space-y-1">
                          {debugData.cache.reactQuery.queries.slice(0, 5).map((query: any, index: number) => (
                            <li key={index} className="flex justify-between">
                              <span className="truncate">{JSON.stringify(query.queryKey)}</span>
                              <span className={`ml-2 ${
                                query.state === 'success' ? 'text-green-600' : 
                                query.state === 'error' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {query.state}
                              </span>
                            </li>
                          ))}
                          {debugData.cache.reactQuery.queries.length > 5 && (
                            <li className="text-gray-500">
                              +{debugData.cache.reactQuery.queries.length - 5} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {debugData.cache.swr && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">SWR</h4>
                    <p className="text-sm text-gray-900">
                      {debugData.cache.swr.count} keys cached
                    </p>
                  </div>
                )}

                {debugData.cache.zustand && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Zustand</h4>
                    <p className="text-sm text-gray-900">
                      {debugData.cache.zustand.storesCount} stores active
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {debugData.cache.zustand.stores.map((store: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {store}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {debugData.cache.error && (
                  <div className="text-sm text-red-600">
                    Cache inspection error: {debugData.cache.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Local Storage */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  💾 Local Storage
                </h3>
                <button
                  onClick={() => clearStorage('localStorage')}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4">
                {Object.keys(debugData.localStorage).length === 0 ? (
                  <p className="text-sm text-gray-500">No localStorage data</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <dl className="space-y-2">
                      {Object.entries(debugData.localStorage).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-medium text-gray-500 truncate">{key}</dt>
                          <dd className="text-xs text-gray-900 font-mono bg-gray-50 p-1 rounded mt-1">
                            {typeof value === 'object' 
                              ? JSON.stringify(value, null, 2) 
                              : String(value)
                            }
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Storage */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  🔒 Session Storage
                </h3>
                <button
                  onClick={() => clearStorage('sessionStorage')}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4">
                {Object.keys(debugData.sessionStorage).length === 0 ? (
                  <p className="text-sm text-gray-500">No sessionStorage data</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <dl className="space-y-2">
                      {Object.entries(debugData.sessionStorage).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-medium text-gray-500 truncate">{key}</dt>
                          <dd className="text-xs text-gray-900 font-mono bg-gray-50 p-1 rounded mt-1">
                            {typeof value === 'object' 
                              ? JSON.stringify(value, null, 2) 
                              : String(value)
                            }
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Environment Information */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                🌍 Environment
              </h3>
              <div className="mt-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Platform</dt>
                    <dd className="text-sm text-gray-900">{debugData.environment.platform}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Language</dt>
                    <dd className="text-sm text-gray-900">{debugData.environment.language}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Online</dt>
                    <dd className="text-sm text-gray-900">
                      {debugData.environment.onLine ? '✅ Online' : '❌ Offline'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cookies</dt>
                    <dd className="text-sm text-gray-900">
                      {debugData.environment.cookieEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <dt className="text-sm font-medium text-gray-500">Current URL</dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">
                    {debugData.environment.url}
                  </dd>
                </div>
                <div className="mt-3">
                  <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                  <dd className="text-xs text-gray-900 font-mono break-all">
                    {debugData.environment.userAgent}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Log */}
        {debugData.errors.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg bg-red-50 shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold leading-6 text-red-900">
                  🚨 Error Log ({debugData.errors.length})
                </h3>
                <button
                  onClick={clearErrors}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Clear Errors
                </button>
              </div>
              <div className="mt-4 max-h-64 overflow-y-auto">
                <ul className="space-y-3">
                  {debugData.errors.slice().reverse().map((error, index) => (
                    <li key={index} className="bg-white p-3 rounded-md border border-red-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-red-900 font-medium">{error.error}</p>
                          {error.stack && (
                            <pre className="mt-2 text-xs text-red-700 font-mono overflow-x-auto whitespace-pre-wrap">
                              {error.stack}
                            </pre>
                          )}
                        </div>
                        <span className="text-xs text-red-500 ml-3 flex-shrink-0">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {debugData.environment.timestamp}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This debug interface is only available in development mode
          </p>
        </div>
      </div>
    </div>
  );
}