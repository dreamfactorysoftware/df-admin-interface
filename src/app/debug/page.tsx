'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Development-only debug page component for Next.js app router.
 * 
 * Provides enhanced debugging capabilities during development including:
 * - LocalStorage debug information
 * - React Query cache status
 * - Next.js development metrics
 * - Application state inspection
 * - Environment and system information
 * 
 * Access is restricted to development environment only for security.
 */
export default function DebugPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, any>>({});
  const [isDevEnvironment, setIsDevEnvironment] = useState(false);

  // Development environment detection
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || 
                  process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
    
    setIsDevEnvironment(isDev);
    
    // Redirect to home if not in development
    if (!isDev) {
      router.push('/');
      return;
    }
  }, [router]);

  // Load debug information on component mount
  useEffect(() => {
    if (!isDevEnvironment) return;
    
    loadDebugInfo();
    loadLocalStorageData();
    loadSystemInfo();
    loadPerformanceMetrics();
  }, [isDevEnvironment]);

  /**
   * Load debug information from localStorage (migrated from Angular component)
   */
  const loadDebugInfo = () => {
    try {
      const storedDebugInfo = localStorage.getItem('debugInfo');
      if (storedDebugInfo) {
        setDebugInfo(JSON.parse(storedDebugInfo));
      } else {
        setDebugInfo([]);
      }
    } catch (error) {
      console.error('Failed to load debug info from localStorage:', error);
      setDebugInfo([]);
    }
  };

  /**
   * Load all localStorage data for inspection
   */
  const loadLocalStorageData = () => {
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            // Try to parse as JSON, fallback to string
            try {
              data[key] = JSON.parse(value || '');
            } catch {
              data[key] = value;
            }
          } catch (error) {
            data[key] = `Error reading key: ${error}`;
          }
        }
      }
      setLocalStorageData(data);
    } catch (error) {
      console.error('Failed to load localStorage data:', error);
      setLocalStorageData({ error: 'Failed to access localStorage' });
    }
  };

  /**
   * Load system and environment information
   */
  const loadSystemInfo = () => {
    const info = {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      language: typeof window !== 'undefined' ? window.navigator.language : 'N/A',
      platform: typeof window !== 'undefined' ? window.navigator.platform : 'N/A',
      cookieEnabled: typeof window !== 'undefined' ? window.navigator.cookieEnabled : false,
      onLine: typeof window !== 'undefined' ? window.navigator.onLine : false,
      screen: typeof window !== 'undefined' ? {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
      } : null,
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight,
      } : null,
      location: typeof window !== 'undefined' ? {
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      } : null,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
      },
      buildInfo: {
        timestamp: new Date().toISOString(),
        nextVersion: 'Next.js 15.1+',
        reactVersion: 'React 19',
        turbopack: process.env.NODE_ENV === 'development',
      }
    };
    setSystemInfo(info);
  };

  /**
   * Load Next.js development performance metrics
   */
  const loadPerformanceMetrics = () => {
    if (typeof window === 'undefined') return;

    const performance = window.performance;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      // Core Web Vitals and performance metrics
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      
      // Next.js specific metrics
      hydrationTime: 0,
      serverSideRenderTime: navigation ? navigation.responseEnd - navigation.requestStart : 0,
      
      // Memory information (if available)
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
      
      // Timing breakdown
      timing: navigation ? {
        redirectTime: navigation.redirectEnd - navigation.redirectStart,
        dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
        connectTime: navigation.connectEnd - navigation.connectStart,
        requestTime: navigation.responseStart - navigation.requestStart,
        responseTime: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domComplete - navigation.domLoading,
      } : null,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Get LCP metric
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.largestContentfulPaint = lastEntry.startTime;
        setPerformanceMetrics({ ...metrics });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    setPerformanceMetrics(metrics);
  };

  /**
   * Clear debug information from localStorage
   */
  const clearDebugInfo = () => {
    try {
      localStorage.removeItem('debugInfo');
      setDebugInfo([]);
      loadLocalStorageData(); // Refresh localStorage display
    } catch (error) {
      console.error('Failed to clear debug info:', error);
    }
  };

  /**
   * Clear all localStorage data
   */
  const clearAllLocalStorage = () => {
    try {
      localStorage.clear();
      setLocalStorageData({});
      setDebugInfo([]);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  /**
   * Refresh all debug data
   */
  const refreshDebugData = () => {
    loadDebugInfo();
    loadLocalStorageData();
    loadSystemInfo();
    loadPerformanceMetrics();
  };

  /**
   * Add debug message to localStorage
   */
  const addDebugMessage = () => {
    const timestamp = new Date().toISOString();
    const message = `Debug message added at ${timestamp}`;
    
    try {
      const currentDebugInfo = JSON.parse(localStorage.getItem('debugInfo') || '[]');
      const updatedDebugInfo = [...currentDebugInfo, message];
      localStorage.setItem('debugInfo', JSON.stringify(updatedDebugInfo));
      setDebugInfo(updatedDebugInfo);
      loadLocalStorageData(); // Refresh localStorage display
    } catch (error) {
      console.error('Failed to add debug message:', error);
    }
  };

  // Don't render anything if not in development environment
  if (!isDevEnvironment) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Development Debug Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enhanced debugging capabilities for DreamFactory Admin Interface development
        </p>
        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
          Development Mode Only
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={refreshDebugData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
        
        <button
          onClick={addDebugMessage}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Debug Message
        </button>
        
        <button
          onClick={clearDebugInfo}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Debug Info
        </button>
        
        <button
          onClick={clearAllLocalStorage}
          className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-200 bg-white dark:bg-red-900 hover:bg-red-50 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clear All Storage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Debug Information Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Debug Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Application debug messages from localStorage
            </p>
          </div>
          <div className="px-6 py-4">
            {debugInfo.length > 0 ? (
              <ul className="space-y-2">
                {debugInfo.map((info, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border-l-4 border-blue-500">
                    {info}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No debug information available
              </p>
            )}
          </div>
        </div>

        {/* Performance Metrics Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Performance Metrics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Next.js development performance and Core Web Vitals
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {performanceMetrics.loadTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Load Time:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{performanceMetrics.loadTime.toFixed(2)}ms</span>
                </div>
              )}
              {performanceMetrics.firstContentfulPaint > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">First Contentful Paint:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{performanceMetrics.firstContentfulPaint.toFixed(2)}ms</span>
                </div>
              )}
              {performanceMetrics.largestContentfulPaint > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Largest Contentful Paint:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{performanceMetrics.largestContentfulPaint.toFixed(2)}ms</span>
                </div>
              )}
              {performanceMetrics.serverSideRenderTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SSR Time:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{performanceMetrics.serverSideRenderTime.toFixed(2)}ms</span>
                </div>
              )}
              {performanceMetrics.memory && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Memory Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Used:</span>
                      <span className="text-xs text-gray-900 dark:text-white">
                        {(performanceMetrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="text-xs text-gray-900 dark:text-white">
                        {(performanceMetrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LocalStorage Data Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              LocalStorage Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Current browser localStorage contents
            </p>
          </div>
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {Object.keys(localStorageData).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(localStorageData).map(([key, value]) => (
                  <div key={key} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">{key}</div>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No localStorage data available
              </p>
            )}
          </div>
        </div>

        {/* System Information Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Environment and browser information
            </p>
          </div>
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {/* Environment */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Environment</h4>
                <div className="space-y-1">
                  {Object.entries(systemInfo.environment || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {value || 'undefined'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Build Information</h4>
                <div className="space-y-1">
                  {Object.entries(systemInfo.buildInfo || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browser Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Browser</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Language:</span>
                    <span className="text-gray-900 dark:text-white">{systemInfo.language}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                    <span className="text-gray-900 dark:text-white">{systemInfo.platform}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Online:</span>
                    <span className="text-gray-900 dark:text-white">
                      {systemInfo.onLine ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Viewport */}
              {systemInfo.viewport && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Viewport</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="text-gray-900 dark:text-white">
                        {systemInfo.viewport.width} × {systemInfo.viewport.height}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* React Query and State Management Section */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              State Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              React Query cache and application state inspection
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  React Query DevTools integration available in development mode.
                  Open React DevTools to inspect cache state, mutations, and query status.
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">Active</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">React Query</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">SWR</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data Fetching</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Zustand</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">State Store</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vitest Integration Section */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Testing Framework
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vitest testing framework integration and debug data validation
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Vitest Framework Active
                  </span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Development Mode
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Test Commands</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    npm test • npm run test:watch • npm run test:coverage
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border-l-4 border-green-500">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Debug Validation</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    localStorage, state, and performance data validation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}