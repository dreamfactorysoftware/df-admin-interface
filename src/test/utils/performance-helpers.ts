/**
 * Performance Testing Utilities for React/Next.js Migration
 * 
 * Provides comprehensive performance measurement utilities to validate:
 * - Sub-5-second API generation workflow completion
 * - Bundle size optimization for enhanced loading performance
 * - Memory usage validation for large dataset operations (1000+ tables)
 * - Cache performance testing for optimal data fetching patterns
 * 
 * Performance Targets (from React/Next.js Integration Requirements):
 * - Real-time validation: < 100ms
 * - Cache hit responses: < 50ms
 * - SSR pages: < 2 seconds
 * - API responses: < 2 seconds
 * - Middleware processing: < 100ms
 * - TTFB: < 600ms (alert at 800ms)
 * - Hydration: < 300ms (alert at 500ms)
 */

import { vi } from 'vitest';

/**
 * Performance measurement result interface
 */
export interface PerformanceMeasurement {
  name: string;
  duration: number;
  timestamp: number;
  threshold?: number;
  passed: boolean;
  metadata?: Record<string, any>;
}

/**
 * Bundle size analysis result interface
 */
export interface BundleSizeAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunkSizes: Array<{
    name: string;
    size: number;
    type: 'js' | 'css' | 'other';
  }>;
  recommendations: string[];
}

/**
 * Memory usage measurement interface
 */
export interface MemoryMeasurement {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentageUsed: number;
  timestamp: number;
}

/**
 * Cache performance metrics interface
 */
export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  cacheSize: number;
  invalidations: number;
  backgroundRefreshes: number;
}

/**
 * Component rendering performance measurement interface
 */
export interface ComponentRenderMetrics {
  component: string;
  initialRender: number;
  reRender: number;
  mountTime: number;
  updateTime: number;
  totalLifecycleTime: number;
}

/**
 * Performance testing utility class providing comprehensive measurement capabilities
 */
export class PerformanceTestHelper {
  private measurements: Map<string, PerformanceMeasurement[]> = new Map();
  private memoryBaseline: MemoryMeasurement | null = null;
  private static instance: PerformanceTestHelper;

  static getInstance(): PerformanceTestHelper {
    if (!PerformanceTestHelper.instance) {
      PerformanceTestHelper.instance = new PerformanceTestHelper();
    }
    return PerformanceTestHelper.instance;
  }

  /**
   * Start a performance measurement with high-resolution timing
   */
  startMeasurement(name: string): string {
    const measurementId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${measurementId}-start`);
    }
    
    return measurementId;
  }

  /**
   * End a performance measurement and record results
   */
  endMeasurement(
    measurementId: string, 
    threshold?: number, 
    metadata?: Record<string, any>
  ): PerformanceMeasurement {
    const endTime = Date.now();
    let duration = 0;

    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        const startMarkName = `${measurementId}-start`;
        const endMarkName = `${measurementId}-end`;
        const measureName = `${measurementId}-duration`;
        
        performance.mark(endMarkName);
        performance.measure(measureName, startMarkName, endMarkName);
        
        const measure = performance.getEntriesByName(measureName)[0] as PerformanceMeasure;
        duration = measure.duration;
        
        // Clean up marks to prevent memory leaks
        performance.clearMarks(startMarkName);
        performance.clearMarks(endMarkName);
        performance.clearMeasures(measureName);
      } catch (error) {
        console.warn('Performance API measurement failed, falling back to Date.now():', error);
        // Fallback to basic timing if performance API fails
        const extractedTime = measurementId.split('-')[1];
        duration = endTime - parseInt(extractedTime);
      }
    } else {
      // Fallback for environments without performance API
      const extractedTime = measurementId.split('-')[1];
      duration = endTime - parseInt(extractedTime);
    }

    const measurement: PerformanceMeasurement = {
      name: measurementId.split('-')[0],
      duration,
      timestamp: endTime,
      threshold,
      passed: threshold ? duration <= threshold : true,
      metadata
    };

    // Store measurement for analysis
    const name = measurement.name;
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(measurement);

    return measurement;
  }

  /**
   * Measure component rendering performance with React DevTools profiling
   */
  async measureComponentRender<T>(
    renderFunction: () => Promise<T> | T,
    componentName: string,
    threshold: number = 100 // Default 100ms threshold for component rendering
  ): Promise<{ result: T; metrics: ComponentRenderMetrics }> {
    const measurementId = this.startMeasurement(`component-render-${componentName}`);
    const startTime = performance.now();
    
    let mountTime = 0;
    let updateTime = 0;

    // Track React render phases if React DevTools profiling is available
    const originalProfiler = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot;
    let renderCount = 0;
    
    if (originalProfiler) {
      (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (
        id: number,
        root: any,
        priorityLevel: any
      ) => {
        const renderTime = performance.now() - startTime;
        if (renderCount === 0) {
          mountTime = renderTime;
        } else {
          updateTime = renderTime - mountTime;
        }
        renderCount++;
        
        // Call original profiler
        if (originalProfiler) {
          originalProfiler(id, root, priorityLevel);
        }
      };
    }

    try {
      const result = await renderFunction();
      const totalTime = performance.now() - startTime;
      
      const measurement = this.endMeasurement(measurementId, threshold, {
        componentName,
        renderCount,
        type: 'component-render'
      });

      const metrics: ComponentRenderMetrics = {
        component: componentName,
        initialRender: mountTime || totalTime,
        reRender: updateTime,
        mountTime: mountTime || totalTime,
        updateTime: updateTime,
        totalLifecycleTime: totalTime
      };

      return { result, metrics };
    } finally {
      // Restore original profiler
      if (originalProfiler) {
        (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = originalProfiler;
      }
    }
  }

  /**
   * Measure API response time with network timing details
   */
  async measureAPIResponse(
    apiCall: () => Promise<any>,
    endpoint: string,
    threshold: number = 2000 // Default 2 second threshold
  ): Promise<{ response: any; measurement: PerformanceMeasurement }> {
    const measurementId = this.startMeasurement(`api-${endpoint}`);
    
    try {
      const response = await apiCall();
      const measurement = this.endMeasurement(measurementId, threshold, {
        endpoint,
        type: 'api-response',
        responseSize: JSON.stringify(response).length
      });
      
      return { response, measurement };
    } catch (error) {
      const measurement = this.endMeasurement(measurementId, threshold, {
        endpoint,
        type: 'api-response',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Measure database connection testing performance
   */
  async measureDatabaseConnection(
    connectionTest: () => Promise<boolean>,
    connectionConfig: Record<string, any>,
    threshold: number = 5000 // 5 second threshold for database connections
  ): Promise<{ connected: boolean; measurement: PerformanceMeasurement }> {
    const measurementId = this.startMeasurement('database-connection');
    
    try {
      const connected = await connectionTest();
      const measurement = this.endMeasurement(measurementId, threshold, {
        connectionType: connectionConfig.type,
        host: connectionConfig.host,
        connected,
        type: 'database-connection'
      });
      
      return { connected, measurement };
    } catch (error) {
      const measurement = this.endMeasurement(measurementId, threshold, {
        connectionType: connectionConfig.type,
        host: connectionConfig.host,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'database-connection'
      });
      
      return { connected: false, measurement };
    }
  }

  /**
   * Set memory baseline for comparison testing
   */
  setMemoryBaseline(): MemoryMeasurement {
    const baseline = this.getCurrentMemoryUsage();
    this.memoryBaseline = baseline;
    return baseline;
  }

  /**
   * Get current memory usage measurement
   */
  getCurrentMemoryUsage(): MemoryMeasurement {
    let memoryUsage: MemoryMeasurement;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      const usage = process.memoryUsage();
      memoryUsage = {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        percentageUsed: (usage.heapUsed / usage.heapTotal) * 100,
        timestamp: Date.now()
      };
    } else if (typeof performance !== 'undefined' && (performance as any).memory) {
      // Browser environment with memory API
      const memory = (performance as any).memory;
      memoryUsage = {
        heapUsed: memory.usedJSHeapSize || 0,
        heapTotal: memory.totalJSHeapSize || 0,
        external: 0,
        rss: 0,
        percentageUsed: memory.totalJSHeapSize 
          ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 
          : 0,
        timestamp: Date.now()
      };
    } else {
      // Fallback for environments without memory measurement
      memoryUsage = {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        percentageUsed: 0,
        timestamp: Date.now()
      };
    }

    return memoryUsage;
  }

  /**
   * Measure memory usage for large dataset operations (1000+ tables)
   */
  async measureLargeDatasetMemory<T>(
    operation: () => Promise<T> | T,
    datasetSize: number,
    operationName: string
  ): Promise<{ result: T; memoryDelta: number; peak: MemoryMeasurement }> {
    // Set baseline if not already set
    if (!this.memoryBaseline) {
      this.setMemoryBaseline();
    }

    const beforeMemory = this.getCurrentMemoryUsage();
    let peakMemory = beforeMemory;

    // Monitor memory during operation
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getCurrentMemoryUsage();
      if (currentMemory.heapUsed > peakMemory.heapUsed) {
        peakMemory = currentMemory;
      }
    }, 100); // Sample every 100ms

    try {
      const result = await operation();
      clearInterval(memoryMonitor);
      
      const afterMemory = this.getCurrentMemoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;

      // Log warning for high memory usage
      if (memoryDelta > 50 * 1024 * 1024) { // 50MB threshold
        console.warn(`High memory usage detected for ${operationName}: ${memoryDelta / 1024 / 1024}MB delta`);
      }

      return {
        result,
        memoryDelta,
        peak: peakMemory
      };
    } catch (error) {
      clearInterval(memoryMonitor);
      throw error;
    }
  }

  /**
   * Clear all stored measurements
   */
  clearMeasurements(): void {
    this.measurements.clear();
    this.memoryBaseline = null;
  }

  /**
   * Get performance summary for analysis
   */
  getPerformanceSummary(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    passed: number;
    failed: number;
    measurements: PerformanceMeasurement[];
  }> {
    const summary: Record<string, any> = {};

    for (const [name, measurements] of this.measurements) {
      const durations = measurements.map(m => m.duration);
      const passed = measurements.filter(m => m.passed).length;
      
      summary[name] = {
        count: measurements.length,
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        passed,
        failed: measurements.length - passed,
        measurements
      };
    }

    return summary;
  }
}

/**
 * Bundle size analysis utilities for code splitting validation
 */
export class BundleSizeAnalyzer {
  /**
   * Analyze bundle sizes with recommendations
   */
  static analyzeBundleSize(
    chunks: Array<{ name: string; size: number; type: 'js' | 'css' | 'other' }>
  ): BundleSizeAnalysis {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = Math.round(totalSize * 0.3); // Rough gzip estimation
    
    const recommendations: string[] = [];
    
    // Large bundle warnings
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Consider implementing code splitting for better loading performance');
    }

    // Large JavaScript chunks
    const largeJSChunks = chunks.filter(chunk => 
      chunk.type === 'js' && chunk.size > 500 * 1024 // 500KB
    );
    if (largeJSChunks.length > 0) {
      recommendations.push(`Large JavaScript chunks detected: ${largeJSChunks.map(c => c.name).join(', ')}`);
    }

    // Too many chunks
    if (chunks.length > 20) {
      recommendations.push('Consider consolidating smaller chunks to reduce HTTP overhead');
    }

    return {
      totalSize,
      gzippedSize,
      chunkSizes: chunks,
      recommendations
    };
  }

  /**
   * Validate code splitting implementation
   */
  static validateCodeSplitting(
    mainChunkSize: number,
    totalChunks: number,
    thresholds = {
      maxMainChunkSize: 1024 * 1024, // 1MB
      minChunks: 3,
      maxChunks: 15
    }
  ): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    if (mainChunkSize > thresholds.maxMainChunkSize) {
      issues.push(`Main chunk size (${mainChunkSize / 1024 / 1024}MB) exceeds recommended limit`);
    }

    if (totalChunks < thresholds.minChunks) {
      issues.push('Insufficient code splitting detected');
    }

    if (totalChunks > thresholds.maxChunks) {
      issues.push('Excessive chunk fragmentation detected');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
}

/**
 * Cache performance testing utilities for TanStack React Query optimization
 */
export class CachePerformanceTester {
  private cacheHits = 0;
  private cacheMisses = 0;
  private responseTimes: number[] = [];
  private invalidationCount = 0;
  private backgroundRefreshCount = 0;

  /**
   * Mock query client for testing cache behavior
   */
  createMockQueryClient(): any {
    const cache = new Map();
    
    return {
      getQueryData: vi.fn((key: string) => {
        const hit = cache.has(key);
        if (hit) {
          this.cacheHits++;
        } else {
          this.cacheMisses++;
        }
        return hit ? cache.get(key) : undefined;
      }),
      
      setQueryData: vi.fn((key: string, data: any) => {
        cache.set(key, data);
      }),
      
      invalidateQueries: vi.fn((key: string) => {
        cache.delete(key);
        this.invalidationCount++;
      }),
      
      refetchQueries: vi.fn(() => {
        this.backgroundRefreshCount++;
      }),
      
      // Mock fetch with response time tracking
      fetchQuery: vi.fn(async (key: string, fetcher: () => Promise<any>) => {
        const startTime = performance.now();
        
        try {
          const result = await fetcher();
          const responseTime = performance.now() - startTime;
          this.responseTimes.push(responseTime);
          cache.set(key, result);
          return result;
        } catch (error) {
          const responseTime = performance.now() - startTime;
          this.responseTimes.push(responseTime);
          throw error;
        }
      })
    };
  }

  /**
   * Test cache hit rate for optimal performance
   */
  async testCacheHitRate(
    queries: Array<{ key: string; fetcher: () => Promise<any> }>,
    expectedHitRate: number = 0.8 // 80% hit rate target
  ): Promise<{ passed: boolean; metrics: CachePerformanceMetrics }> {
    const queryClient = this.createMockQueryClient();
    
    // Reset counters
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.responseTimes = [];

    // Execute queries multiple times to test caching
    for (let i = 0; i < 3; i++) {
      for (const query of queries) {
        await queryClient.fetchQuery(query.key, query.fetcher);
      }
    }

    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    const metrics: CachePerformanceMetrics = {
      hitRate,
      missRate: 1 - hitRate,
      averageResponseTime,
      cacheSize: queries.length,
      invalidations: this.invalidationCount,
      backgroundRefreshes: this.backgroundRefreshCount
    };

    return {
      passed: hitRate >= expectedHitRate && averageResponseTime <= 50, // 50ms target
      metrics
    };
  }

  /**
   * Reset cache performance counters
   */
  reset(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.responseTimes = [];
    this.invalidationCount = 0;
    this.backgroundRefreshCount = 0;
  }
}

/**
 * Lazy loading validation utilities
 */
export class LazyLoadingValidator {
  /**
   * Test lazy loading implementation for React components
   */
  static async testLazyComponent(
    lazyComponentFactory: () => Promise<{ default: React.ComponentType<any> }>,
    timeout: number = 5000
  ): Promise<{ loaded: boolean; loadTime: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      const component = await Promise.race([
        lazyComponentFactory(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Lazy loading timeout')), timeout)
        )
      ]);
      
      const loadTime = performance.now() - startTime;
      
      return {
        loaded: !!component.default,
        loadTime,
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      return {
        loaded: false,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate chunk loading performance for code splitting
   */
  static async validateChunkLoading(
    chunkLoaders: Array<() => Promise<any>>,
    concurrency: number = 3
  ): Promise<Array<{ loaded: boolean; loadTime: number; chunkIndex: number }>> {
    const results: Array<{ loaded: boolean; loadTime: number; chunkIndex: number }> = [];
    
    // Load chunks in batches to test concurrent loading
    for (let i = 0; i < chunkLoaders.length; i += concurrency) {
      const batch = chunkLoaders.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (loader, index) => {
          const startTime = performance.now();
          try {
            await loader();
            return {
              loaded: true,
              loadTime: performance.now() - startTime,
              chunkIndex: i + index
            };
          } catch (error) {
            return {
              loaded: false,
              loadTime: performance.now() - startTime,
              chunkIndex: i + index
            };
          }
        })
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            loaded: false,
            loadTime: 0,
            chunkIndex: -1
          });
        }
      });
    }
    
    return results;
  }
}

/**
 * API Generation workflow performance validator
 */
export class APIGenerationPerformanceValidator {
  /**
   * Validate the complete API generation workflow meets sub-5-second target
   */
  static async validateAPIGenerationWorkflow(
    workflow: {
      schemaDiscovery: () => Promise<any>;
      endpointGeneration: () => Promise<any>;
      securityConfiguration: () => Promise<any>;
      openAPIGeneration: () => Promise<any>;
    }
  ): Promise<{ 
    totalTime: number; 
    passed: boolean; 
    stepTimes: Record<string, number>;
    bottlenecks: string[];
  }> {
    const performance = PerformanceTestHelper.getInstance();
    const stepTimes: Record<string, number> = {};
    const bottlenecks: string[] = [];
    
    const workflowId = performance.startMeasurement('api-generation-workflow');
    
    try {
      // Step 1: Schema Discovery
      const schemaId = performance.startMeasurement('schema-discovery');
      await workflow.schemaDiscovery();
      const schemaMeasurement = performance.endMeasurement(schemaId, 2000);
      stepTimes['schema-discovery'] = schemaMeasurement.duration;
      
      if (schemaMeasurement.duration > 1500) {
        bottlenecks.push('Schema discovery exceeds 1.5s');
      }
      
      // Step 2: Endpoint Generation
      const endpointId = performance.startMeasurement('endpoint-generation');
      await workflow.endpointGeneration();
      const endpointMeasurement = performance.endMeasurement(endpointId, 1500);
      stepTimes['endpoint-generation'] = endpointMeasurement.duration;
      
      if (endpointMeasurement.duration > 1000) {
        bottlenecks.push('Endpoint generation exceeds 1s');
      }
      
      // Step 3: Security Configuration
      const securityId = performance.startMeasurement('security-configuration');
      await workflow.securityConfiguration();
      const securityMeasurement = performance.endMeasurement(securityId, 500);
      stepTimes['security-configuration'] = securityMeasurement.duration;
      
      if (securityMeasurement.duration > 300) {
        bottlenecks.push('Security configuration exceeds 300ms');
      }
      
      // Step 4: OpenAPI Generation
      const openApiId = performance.startMeasurement('openapi-generation');
      await workflow.openAPIGeneration();
      const openApiMeasurement = performance.endMeasurement(openApiId, 1000);
      stepTimes['openapi-generation'] = openApiMeasurement.duration;
      
      if (openApiMeasurement.duration > 700) {
        bottlenecks.push('OpenAPI generation exceeds 700ms');
      }
      
      const totalMeasurement = performance.endMeasurement(workflowId, 5000);
      
      return {
        totalTime: totalMeasurement.duration,
        passed: totalMeasurement.passed,
        stepTimes,
        bottlenecks
      };
    } catch (error) {
      const totalMeasurement = performance.endMeasurement(workflowId, 5000, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Export singleton instance for convenience
export const performanceHelper = PerformanceTestHelper.getInstance();

// Export utility functions for common use cases
export const measureComponentRender = performanceHelper.measureComponentRender.bind(performanceHelper);
export const measureAPIResponse = performanceHelper.measureAPIResponse.bind(performanceHelper);
export const measureDatabaseConnection = performanceHelper.measureDatabaseConnection.bind(performanceHelper);
export const measureLargeDatasetMemory = performanceHelper.measureLargeDatasetMemory.bind(performanceHelper);
export const getCurrentMemoryUsage = performanceHelper.getCurrentMemoryUsage.bind(performanceHelper);
export const getPerformanceSummary = performanceHelper.getPerformanceSummary.bind(performanceHelper);