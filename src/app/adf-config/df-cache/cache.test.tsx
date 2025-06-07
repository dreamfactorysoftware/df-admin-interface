/**
 * Cache Management Test Suite
 * 
 * Comprehensive Vitest test suite for the cache management page component implementing
 * React Testing Library patterns with MSW for realistic API mocking. Provides thorough
 * test coverage for cache operations, user interactions, error handling, and accessibility
 * compliance including keyboard navigation and screen reader support.
 * 
 * Key Features:
 * - Vitest 2.1.0 testing framework for 10x faster test execution
 * - React Testing Library with React 19 compatibility  
 * - MSW (Mock Service Worker) for realistic API behavior simulation
 * - Comprehensive accessibility testing with jest-axe integration
 * - SWR/React Query hooks testing for data fetching patterns
 * - User interaction testing with keyboard navigation support
 * - Error boundary and loading state validation
 * - WCAG 2.1 AA compliance verification
 * 
 * Test Coverage:
 * - Cache table rendering and data display
 * - Cache flush operations (system-wide and per-service)
 * - Modal interactions and form submissions
 * - Loading states and error handling
 * - Accessibility features and keyboard navigation
 * - Network error scenarios and retry mechanisms
 * - Authentication and permission validation
 * - Performance optimization testing
 * 
 * Architecture:
 * - Enterprise-grade test organization with clear separation of concerns
 * - Comprehensive MSW handlers for all cache-related API endpoints
 * - Accessibility-first testing approach with automated compliance checks
 * - Realistic data scenarios with edge case coverage
 * - Performance measurement and optimization validation
 */

import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';

// Import components under test
import CachePage from './page';
import CacheTable from './cache-table';
import CacheModal from './cache-modal';

// Import testing utilities and mocks
import { handlers } from '@/test/mocks/handlers';
import { createJsonResponse, simulateNetworkDelay } from '@/test/mocks/utils';
import { 
  createUnauthorizedError, 
  createServerError, 
  createValidationError,
  createNetworkTimeoutError
} from '@/test/mocks/error-responses';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK DATA AND CONSTANTS
// ============================================================================

/**
 * Comprehensive Mock Cache Data
 * 
 * Realistic cache data covering different cache types, sizes, and states
 * to support thorough testing scenarios including edge cases and performance
 * optimization validation.
 */
const mockCacheData = {
  system: {
    total_size: '245.7 MB',
    cache_count: 1247,
    last_cleared: '2024-12-06T10:30:00Z',
    status: 'healthy',
    hit_ratio: 0.87,
    memory_usage: {
      used: '245.7 MB',
      available: '512 MB',
      percentage: 48
    },
    performance_metrics: {
      avg_response_time: '12ms',
      cache_hits_per_minute: 2450,
      cache_misses_per_minute: 380
    }
  },
  services: [
    {
      id: 1,
      service_name: 'db_mysql_customers',
      service_label: 'MySQL Customer Database',
      cache_size: '89.3 MB',
      entry_count: 456,
      last_accessed: '2024-12-06T11:45:23Z',
      last_cleared: '2024-12-05T09:15:00Z',
      hit_ratio: 0.92,
      status: 'active',
      cache_type: 'database',
      auto_refresh: true,
      ttl: 3600,
      performance: {
        avg_query_time: '8ms',
        hits_today: 15670,
        misses_today: 1340
      }
    },
    {
      id: 2,
      service_name: 'db_postgres_inventory',
      service_label: 'PostgreSQL Inventory System',
      cache_size: '156.4 MB',
      entry_count: 791,
      last_accessed: '2024-12-06T11:47:12Z',
      last_cleared: '2024-12-04T14:22:30Z',
      hit_ratio: 0.78,
      status: 'active',
      cache_type: 'database',
      auto_refresh: false,
      ttl: 7200,
      performance: {
        avg_query_time: '15ms',
        hits_today: 8920,
        misses_today: 2480
      }
    },
    {
      id: 3,
      service_name: 'api_external_payments',
      service_label: 'External Payment Gateway',
      cache_size: '12.8 MB',
      entry_count: 234,
      last_accessed: '2024-12-06T11:44:01Z',
      last_cleared: '2024-12-06T08:00:00Z',
      hit_ratio: 0.65,
      status: 'warning',
      cache_type: 'api',
      auto_refresh: true,
      ttl: 300,
      performance: {
        avg_query_time: '125ms',
        hits_today: 1250,
        misses_today: 670
      }
    }
  ],
  configuration: {
    global_cache_enabled: true,
    default_ttl: 3600,
    max_cache_size: '1 GB',
    compression_enabled: true,
    automatic_cleanup: true,
    cleanup_threshold: 0.8,
    cache_driver: 'redis',
    redis_config: {
      host: 'localhost',
      port: 6379,
      database: 0,
      connection_timeout: 5000
    }
  }
};

/**
 * Cache Operation Test Scenarios
 * 
 * Comprehensive test scenarios covering success cases, error conditions,
 * permission checks, and edge cases for realistic testing coverage.
 */
const testScenarios = {
  flushOperations: {
    systemFlushSuccess: {
      operation: 'system_flush',
      expectedDuration: 2500,
      expectedMessage: 'System cache cleared successfully',
      affectedServices: ['all']
    },
    serviceFlushSuccess: {
      operation: 'service_flush',
      serviceId: 1,
      expectedDuration: 800,
      expectedMessage: 'Service cache cleared successfully',
      affectedServices: ['db_mysql_customers']
    },
    permissionDenied: {
      operation: 'system_flush',
      error: 'insufficient_permissions',
      expectedStatus: 403,
      expectedMessage: 'Insufficient permissions to clear system cache'
    },
    networkTimeout: {
      operation: 'service_flush',
      serviceId: 2,
      error: 'network_timeout',
      expectedStatus: 408,
      expectedMessage: 'Cache operation timed out'
    }
  },
  dataValidation: {
    largeCacheDataset: {
      serviceCount: 50,
      totalCacheSize: '2.3 GB',
      entriesPerService: 10000
    },
    emptyCacheState: {
      systemCacheSize: '0 MB',
      serviceCount: 0,
      message: 'No cache data available'
    },
    corruptedCacheData: {
      error: 'data_corruption',
      expectedRecovery: 'fallback_display'
    }
  }
};

// ============================================================================
// MSW CACHE HANDLERS
// ============================================================================

/**
 * Cache-Specific MSW Handlers
 * 
 * Comprehensive mock handlers for all cache-related API endpoints including
 * CRUD operations, flush operations, status monitoring, and performance metrics.
 * Designed to simulate realistic API behavior with proper error handling.
 */
const cacheHandlers = [
  // GET /api/v2/system/cache - Retrieve cache configuration and status
  http.get('/api/v2/system/cache', async ({ request }) => {
    await simulateNetworkDelay();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for cache access');
    }
    
    return createJsonResponse({
      resource: [mockCacheData.configuration]
    });
  }),

  // GET /api/v2/system/cache/status - Retrieve system cache status and metrics
  http.get('/api/v2/system/cache/status', async ({ request }) => {
    await simulateNetworkDelay();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for cache status');
    }
    
    return createJsonResponse({
      system: mockCacheData.system,
      services: mockCacheData.services,
      configuration: mockCacheData.configuration
    });
  }),

  // GET /api/v2/system/cache/services - Retrieve per-service cache data
  http.get('/api/v2/system/cache/services', async ({ request }) => {
    await simulateNetworkDelay();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for service cache data');
    }
    
    const url = new URL(request.url);
    const serviceParam = url.searchParams.get('service');
    
    if (serviceParam) {
      const service = mockCacheData.services.find(s => s.service_name === serviceParam);
      if (!service) {
        return HttpResponse.json(
          { error: { message: `Service '${serviceParam}' not found`, status_code: 404 }},
          { status: 404 }
        );
      }
      return createJsonResponse({ resource: [service] });
    }
    
    return createJsonResponse({
      resource: mockCacheData.services
    });
  }),

  // DELETE /api/v2/system/cache/flush - Flush system cache
  http.delete('/api/v2/system/cache/flush', async ({ request }) => {
    await simulateNetworkDelay(2000); // Simulate longer operation for system flush
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for cache flush');
    }

    // Simulate permission check failure scenario
    if (authHeader.includes('limited_user')) {
      return HttpResponse.json(
        { 
          error: { 
            message: 'Insufficient permissions to clear system cache',
            status_code: 403,
            context: { required_permission: 'cache.system.flush' }
          }
        },
        { status: 403 }
      );
    }

    // Simulate network timeout scenario
    if (authHeader.includes('timeout_test')) {
      return createNetworkTimeoutError('Cache flush operation timed out');
    }
    
    return createJsonResponse({
      message: 'System cache cleared successfully',
      operation: 'system_flush',
      duration_ms: 2456,
      affected_services: ['all'],
      cleared_entries: 1247,
      freed_memory: '245.7 MB',
      timestamp: new Date().toISOString()
    });
  }),

  // DELETE /api/v2/system/cache/services/{serviceName} - Flush service-specific cache
  http.delete('/api/v2/system/cache/services/:serviceName', async ({ request, params }) => {
    await simulateNetworkDelay(800); // Shorter delay for service-specific flush
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for service cache flush');
    }

    const serviceName = params.serviceName as string;
    const service = mockCacheData.services.find(s => s.service_name === serviceName);
    
    if (!service) {
      return HttpResponse.json(
        { error: { message: `Service '${serviceName}' not found`, status_code: 404 }},
        { status: 404 }
      );
    }

    // Simulate network timeout for specific service
    if (serviceName === 'timeout_service') {
      return createNetworkTimeoutError('Service cache flush operation timed out');
    }
    
    return createJsonResponse({
      message: 'Service cache cleared successfully',
      operation: 'service_flush',
      service_name: serviceName,
      duration_ms: 823,
      cleared_entries: service.entry_count,
      freed_memory: service.cache_size,
      timestamp: new Date().toISOString()
    });
  }),

  // PUT /api/v2/system/cache/configuration - Update cache configuration
  http.put('/api/v2/system/cache/configuration', async ({ request }) => {
    await simulateNetworkDelay();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for cache configuration');
    }

    try {
      const configData = await request.json();
      
      // Validate configuration data
      const validationErrors = [];
      if (configData.default_ttl && (configData.default_ttl < 0 || configData.default_ttl > 86400)) {
        validationErrors.push({ field: 'default_ttl', message: 'TTL must be between 0 and 86400 seconds' });
      }
      if (configData.max_cache_size && !configData.max_cache_size.match(/^\d+(\.\d+)?\s*(MB|GB)$/i)) {
        validationErrors.push({ field: 'max_cache_size', message: 'Invalid cache size format' });
      }

      if (validationErrors.length > 0) {
        return createValidationError('Cache configuration validation failed', validationErrors);
      }

      const updatedConfig = {
        ...mockCacheData.configuration,
        ...configData,
        last_modified: new Date().toISOString()
      };

      return createJsonResponse(updatedConfig);
    } catch (error) {
      return createValidationError('Invalid JSON payload for cache configuration');
    }
  }),

  // POST /api/v2/system/cache/refresh - Refresh cache for specific service
  http.post('/api/v2/system/cache/refresh/:serviceName', async ({ request, params }) => {
    await simulateNetworkDelay(1200);
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError('Authentication required for cache refresh');
    }

    const serviceName = params.serviceName as string;
    const service = mockCacheData.services.find(s => s.service_name === serviceName);
    
    if (!service) {
      return HttpResponse.json(
        { error: { message: `Service '${serviceName}' not found`, status_code: 404 }},
        { status: 404 }
      );
    }
    
    return createJsonResponse({
      message: 'Cache refreshed successfully',
      operation: 'cache_refresh',
      service_name: serviceName,
      duration_ms: 1156,
      refreshed_entries: service.entry_count,
      timestamp: new Date().toISOString()
    });
  })
];

// Setup MSW server with cache handlers
const server = setupServer(...handlers, ...cacheHandlers);

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Enhanced Testing Utilities
 * 
 * Comprehensive collection of testing utilities that provide consistent
 * component rendering, user interaction simulation, and assertion helpers
 * for cache management testing scenarios.
 */

/**
 * Create Enhanced Query Client for Testing
 * 
 * Configures React Query client with testing-optimized settings including
 * disabled retries, shorter cache times, and enhanced error handling.
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for predictable testing
        cacheTime: 0, // Disable caching for fresh data in each test
        staleTime: 0, // Always consider data stale for testing
        refetchOnWindowFocus: false, // Disable automatic refetching
      },
      mutations: {
        retry: false, // Disable mutation retries for testing
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(), // Suppress error logs during testing
    },
  });
};

/**
 * Enhanced Component Wrapper with Providers
 * 
 * Provides comprehensive wrapper component with all necessary providers
 * for realistic component testing including query client, theme provider,
 * and authentication context.
 */
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  authToken?: string;
  permissions?: string[];
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  authToken = 'valid_token',
  permissions = ['cache.read', 'cache.flush', 'cache.configure']
}) => {
  // Mock authentication context
  const mockAuthContext = {
    token: authToken,
    permissions,
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      is_sys_admin: true
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div data-testid="test-wrapper" data-auth-token={authToken}>
        {children}
      </div>
    </QueryClientProvider>
  );
};

/**
 * Custom Render Function with Enhanced Configuration
 * 
 * Provides enhanced render function that automatically wraps components
 * with necessary providers and returns additional testing utilities.
 */
interface CustomRenderOptions {
  queryClient?: QueryClient;
  authToken?: string;
  permissions?: string[];
  route?: string;
}

const renderWithProviders = (
  component: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    queryClient = createTestQueryClient(),
    authToken = 'valid_token',
    permissions = ['cache.read', 'cache.flush', 'cache.configure'],
    route = '/adf-config/df-cache'
  } = options;

  // Mock Next.js router
  const mockRouter: Partial<NextRouter> = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: route,
    query: {},
    asPath: route,
    route: route,
  };

  vi.mocked(require('next/router').useRouter).mockReturnValue(mockRouter);

  const renderResult = render(
    <TestWrapper 
      queryClient={queryClient}
      authToken={authToken}
      permissions={permissions}
    >
      {component}
    </TestWrapper>
  );

  return {
    ...renderResult,
    queryClient,
    mockRouter,
    user: userEvent.setup({
      // Configure userEvent for more realistic interactions
      advanceTimers: vi.advanceTimersByTime,
      pointerEventsCheck: 0, // Disable pointer events check for testing
    }),
  };
};

/**
 * Cache Operation Testing Utilities
 * 
 * Specialized utilities for testing cache operations including flush operations,
 * status monitoring, and configuration updates with realistic timing and
 * network behavior simulation.
 */
const cacheTestUtils = {
  /**
   * Simulate Cache Flush Operation
   * 
   * Provides realistic simulation of cache flush operations with proper
   * timing, loading states, and success/error scenarios.
   */
  async simulateFlushOperation(
    type: 'system' | 'service',
    serviceName?: string,
    scenario: 'success' | 'permission_error' | 'timeout' = 'success'
  ) {
    const user = userEvent.setup();
    
    // Find and click the appropriate flush button
    const flushButton = type === 'system' 
      ? screen.getByTestId('system-cache-flush-button')
      : screen.getByTestId(`service-cache-flush-${serviceName}`);
    
    await user.click(flushButton);
    
    // Wait for confirmation modal to appear
    const modal = await screen.findByTestId('cache-flush-modal');
    expect(modal).toBeInTheDocument();
    
    // Find and click confirm button
    const confirmButton = within(modal).getByTestId('confirm-flush-button');
    await user.click(confirmButton);
    
    // Handle different scenarios
    switch (scenario) {
      case 'success':
        // Wait for loading state
        expect(within(modal).getByTestId('flush-loading-indicator')).toBeInTheDocument();
        
        // Wait for operation completion
        await waitFor(() => {
          expect(screen.getByTestId('flush-success-message')).toBeInTheDocument();
        }, { timeout: 5000 });
        break;
        
      case 'permission_error':
        await waitFor(() => {
          expect(screen.getByTestId('flush-error-message')).toBeInTheDocument();
          expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
        });
        break;
        
      case 'timeout':
        await waitFor(() => {
          expect(screen.getByTestId('flush-error-message')).toBeInTheDocument();
          expect(screen.getByText(/operation timed out/i)).toBeInTheDocument();
        }, { timeout: 10000 });
        break;
    }
  },

  /**
   * Validate Cache Table Data Display
   * 
   * Comprehensive validation of cache table rendering including data accuracy,
   * formatting, and interactive elements.
   */
  validateCacheTableDisplay() {
    const table = screen.getByTestId('cache-services-table');
    expect(table).toBeInTheDocument();
    
    // Validate table headers
    const expectedHeaders = [
      'Service Name',
      'Cache Size',
      'Entries',
      'Hit Ratio',
      'Last Accessed',
      'Actions'
    ];
    
    expectedHeaders.forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
    
    // Validate service data rows
    mockCacheData.services.forEach(service => {
      expect(screen.getByText(service.service_label)).toBeInTheDocument();
      expect(screen.getByText(service.cache_size)).toBeInTheDocument();
      expect(screen.getByText(service.entry_count.toString())).toBeInTheDocument();
    });
  },

  /**
   * Test Accessibility Compliance
   * 
   * Comprehensive accessibility testing using axe-core with WCAG 2.1 AA
   * compliance validation for all interactive elements.
   */
  async validateAccessibility(container: HTMLElement) {
    const results = await axe(container, {
      rules: {
        // WCAG 2.1 AA compliance rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true },
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    });
    
    expect(results).toHaveNoViolations();
  },

  /**
   * Test Keyboard Navigation
   * 
   * Validates comprehensive keyboard navigation support including tab order,
   * focus management, and keyboard shortcuts.
   */
  async testKeyboardNavigation() {
    const user = userEvent.setup();
    
    // Test tab navigation through main elements
    await user.tab();
    expect(screen.getByTestId('system-cache-flush-button')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByTestId('cache-refresh-button')).toHaveFocus();
    
    await user.tab();
    const firstServiceButton = screen.getAllByTestId(/service-cache-flush-/)[0];
    expect(firstServiceButton).toHaveFocus();
    
    // Test keyboard shortcuts
    await user.keyboard('{Meta>}{r}{/Meta}'); // Cmd+R for refresh
    expect(screen.getByTestId('cache-refresh-indicator')).toBeInTheDocument();
    
    // Test escape key to close modals
    const flushButton = screen.getByTestId('system-cache-flush-button');
    await user.click(flushButton);
    
    const modal = await screen.findByTestId('cache-flush-modal');
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });
  }
};

// ============================================================================
// TEST SUITE SETUP AND CONFIGURATION
// ============================================================================

/**
 * Global Test Setup and Teardown
 * 
 * Configures MSW server, mocks, and global test environment for optimal
 * test execution and isolation.
 */

beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn', // Log unhandled requests for debugging
  });

  // Mock localStorage for cache preferences
  const localStorageMock = {
    getItem: vi.fn((key: string) => {
      const mockData: Record<string, string> = {
        'cache-table-preferences': JSON.stringify({
          sortColumn: 'service_name',
          sortDirection: 'asc',
          pageSize: 25
        }),
        'cache-auto-refresh': 'true'
      };
      return mockData[key] || null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock performance API for timing measurements
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
    },
  });

  // Mock console methods with debugging capability
  if (!process.env.DEBUG_TESTS) {
    global.console = {
      ...console,
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: console.warn, // Keep warnings visible
      error: console.error, // Keep errors visible
    };
  }
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset MSW handlers to default state
  server.resetHandlers();
  
  // Mock authentication headers for requests
  const mockFetch = vi.fn().mockImplementation((url, options = {}) => {
    const headers = {
      'Authorization': 'Bearer valid_token',
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    return fetch(url, { ...options, headers });
  });
  
  global.fetch = mockFetch;
});

afterEach(() => {
  // Clean up DOM after each test
  document.body.innerHTML = '';
  
  // Clear any timers
  vi.clearAllTimers();
});

afterAll(() => {
  // Close MSW server
  server.close();
  
  // Restore all mocks
  vi.restoreAllMocks();
});

// ============================================================================
// CACHE PAGE COMPONENT TESTS
// ============================================================================

describe('Cache Management Page', () => {
  describe('Initial Rendering and Data Loading', () => {
    test('renders cache page with loading state initially', async () => {
      const { container } = renderWithProviders(<CachePage />);

      // Verify loading state
      expect(screen.getByTestId('cache-page-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading cache data/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Validate accessibility
      await cacheTestUtils.validateAccessibility(container);
    });

    test('displays system cache overview with metrics', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('system-cache-overview')).toBeInTheDocument();
      });

      // Verify system metrics display
      expect(screen.getByText('245.7 MB')).toBeInTheDocument(); // Total size
      expect(screen.getByText('1,247')).toBeInTheDocument(); // Cache count
      expect(screen.getByText('87%')).toBeInTheDocument(); // Hit ratio

      // Verify performance metrics
      expect(screen.getByText('12ms')).toBeInTheDocument(); // Avg response time
      expect(screen.getByText('2,450')).toBeInTheDocument(); // Hits per minute
    });

    test('renders cache services table with proper data', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        cacheTestUtils.validateCacheTableDisplay();
      });

      // Verify specific service data
      expect(screen.getByText('MySQL Customer Database')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL Inventory System')).toBeInTheDocument();
      expect(screen.getByText('External Payment Gateway')).toBeInTheDocument();

      // Verify status indicators
      expect(screen.getByTestId('service-status-active')).toBeInTheDocument();
      expect(screen.getByTestId('service-status-warning')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles API error gracefully with retry mechanism', async () => {
      // Configure server to return error
      server.use(
        http.get('/api/v2/system/cache/status', () => {
          return createServerError('Internal server error occurred');
        })
      );

      const { user } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-error-state')).toBeInTheDocument();
        expect(screen.getByText(/failed to load cache data/i)).toBeInTheDocument();
      });

      // Test retry mechanism
      const retryButton = screen.getByTestId('retry-cache-load');
      await user.click(retryButton);

      expect(screen.getByTestId('cache-page-loading')).toBeInTheDocument();
    });

    test('handles empty cache state appropriately', async () => {
      // Configure server to return empty cache data
      server.use(
        http.get('/api/v2/system/cache/status', () => {
          return createJsonResponse({
            system: { ...mockCacheData.system, cache_count: 0, total_size: '0 MB' },
            services: [],
            configuration: mockCacheData.configuration
          });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-cache-state')).toBeInTheDocument();
        expect(screen.getByText(/no cache data available/i)).toBeInTheDocument();
      });

      // Verify empty state actions
      expect(screen.getByTestId('configure-cache-button')).toBeInTheDocument();
    });

    test('handles network timeout with appropriate feedback', async () => {
      // Configure server to simulate timeout
      server.use(
        http.get('/api/v2/system/cache/status', async () => {
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
          return createNetworkTimeoutError('Request timed out');
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-timeout-error')).toBeInTheDocument();
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
      }, { timeout: 12000 });
    });
  });

  describe('Authentication and Permissions', () => {
    test('handles unauthorized access appropriately', async () => {
      // Configure server to return unauthorized error
      server.use(
        http.get('/api/v2/system/cache/status', () => {
          return createUnauthorizedError('Authentication required');
        })
      );

      renderWithProviders(<CachePage />, { authToken: '' });

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized-access-error')).toBeInTheDocument();
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });

      // Verify login redirect is available
      expect(screen.getByTestId('login-redirect-button')).toBeInTheDocument();
    });

    test('shows limited functionality for read-only permissions', async () => {
      renderWithProviders(<CachePage />, { 
        permissions: ['cache.read'] // Remove flush permissions
      });

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Verify flush buttons are disabled or hidden
      const systemFlushButton = screen.queryByTestId('system-cache-flush-button');
      if (systemFlushButton) {
        expect(systemFlushButton).toBeDisabled();
      } else {
        expect(systemFlushButton).not.toBeInTheDocument();
      }

      // Verify read-only message
      expect(screen.getByTestId('read-only-permissions-notice')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CACHE TABLE COMPONENT TESTS
// ============================================================================

describe('Cache Table Component', () => {
  describe('Data Display and Formatting', () => {
    test('renders table with correct column headers and data', async () => {
      renderWithProviders(<CacheTable services={mockCacheData.services} />);

      cacheTestUtils.validateCacheTableDisplay();

      // Verify data formatting
      expect(screen.getByText('92%')).toBeInTheDocument(); // Hit ratio formatting
      expect(screen.getByText(/nov 5, 2024/i)).toBeInTheDocument(); // Date formatting
    });

    test('supports sorting by different columns', async () => {
      const { user } = renderWithProviders(<CacheTable services={mockCacheData.services} />);

      // Test sorting by cache size
      const cacheSizeHeader = screen.getByTestId('column-header-cache-size');
      await user.click(cacheSizeHeader);

      // Verify sort indicator
      expect(within(cacheSizeHeader).getByTestId('sort-desc-indicator')).toBeInTheDocument();

      // Test sorting by hit ratio
      const hitRatioHeader = screen.getByTestId('column-header-hit-ratio');
      await user.click(hitRatioHeader);

      expect(within(hitRatioHeader).getByTestId('sort-desc-indicator')).toBeInTheDocument();
    });

    test('supports pagination for large datasets', async () => {
      // Create large dataset
      const largeServiceList = Array.from({ length: 100 }, (_, index) => ({
        ...mockCacheData.services[0],
        id: index + 1,
        service_name: `service_${index + 1}`,
        service_label: `Service ${index + 1}`,
      }));

      const { user } = renderWithProviders(
        <CacheTable services={largeServiceList} />
      );

      // Verify pagination controls
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();

      // Test page navigation
      const nextPageButton = screen.getByTestId('next-page-button');
      await user.click(nextPageButton);

      expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('allows filtering services by name and type', async () => {
      const { user } = renderWithProviders(<CacheTable services={mockCacheData.services} />);

      // Test name filtering
      const filterInput = screen.getByTestId('service-filter-input');
      await user.type(filterInput, 'mysql');

      await waitFor(() => {
        expect(screen.getByText('MySQL Customer Database')).toBeInTheDocument();
        expect(screen.queryByText('PostgreSQL Inventory System')).not.toBeInTheDocument();
      });

      // Clear filter
      await user.clear(filterInput);

      // Test type filtering
      const typeFilter = screen.getByTestId('service-type-filter');
      await user.selectOptions(typeFilter, 'database');

      await waitFor(() => {
        expect(screen.getByText('MySQL Customer Database')).toBeInTheDocument();
        expect(screen.getByText('PostgreSQL Inventory System')).toBeInTheDocument();
        expect(screen.queryByText('External Payment Gateway')).not.toBeInTheDocument();
      });
    });

    test('provides row selection and bulk operations', async () => {
      const { user } = renderWithProviders(<CacheTable services={mockCacheData.services} />);

      // Test individual row selection
      const firstRowCheckbox = screen.getByTestId('row-select-1');
      await user.click(firstRowCheckbox);

      expect(firstRowCheckbox).toBeChecked();
      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();

      // Test select all functionality
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      mockCacheData.services.forEach(service => {
        expect(screen.getByTestId(`row-select-${service.id}`)).toBeChecked();
      });

      // Test bulk flush operation
      const bulkFlushButton = screen.getByTestId('bulk-flush-button');
      await user.click(bulkFlushButton);

      expect(screen.getByTestId('bulk-flush-modal')).toBeInTheDocument();
    });
  });

  describe('Performance and Virtual Scrolling', () => {
    test('handles large datasets efficiently with virtual scrolling', async () => {
      // Create very large dataset
      const massiveServiceList = Array.from({ length: 10000 }, (_, index) => ({
        ...mockCacheData.services[0],
        id: index + 1,
        service_name: `service_${index + 1}`,
        service_label: `Service ${index + 1}`,
      }));

      const startTime = performance.now();
      
      renderWithProviders(<CacheTable services={massiveServiceList} />);

      await waitFor(() => {
        expect(screen.getByTestId('virtual-table-container')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify render time is acceptable (should be under 1 second)
      expect(renderTime).toBeLessThan(1000);

      // Verify only visible rows are rendered
      const renderedRows = screen.getAllByTestId(/^service-row-/);
      expect(renderedRows.length).toBeLessThan(50); // Should only render visible rows
    });

    test('maintains scroll position during data updates', async () => {
      const { user, rerender } = renderWithProviders(
        <CacheTable services={mockCacheData.services} />
      );

      // Scroll to specific position
      const tableContainer = screen.getByTestId('cache-services-table');
      fireEvent.scroll(tableContainer, { target: { scrollTop: 300 } });

      // Update data
      const updatedServices = mockCacheData.services.map(service => ({
        ...service,
        cache_size: '999 MB' // Update cache size
      }));

      rerender(<CacheTable services={updatedServices} />);

      // Verify scroll position is maintained
      expect(tableContainer.scrollTop).toBe(300);

      // Verify data is updated
      expect(screen.getByText('999 MB')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CACHE MODAL COMPONENT TESTS
// ============================================================================

describe('Cache Modal Component', () => {
  describe('Modal Rendering and Content', () => {
    test('renders flush confirmation modal with correct content', async () => {
      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const modal = screen.getByTestId('cache-flush-modal');
      expect(modal).toBeInTheDocument();

      // Verify modal content
      expect(screen.getByText(/clear system cache/i)).toBeInTheDocument();
      expect(screen.getByText(/this action will clear all cached data/i)).toBeInTheDocument();
      
      // Verify action buttons
      expect(screen.getByTestId('confirm-flush-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-flush-button')).toBeInTheDocument();

      // Test accessibility
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    test('renders service-specific flush modal with service details', async () => {
      const serviceData = mockCacheData.services[0];
      
      renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="service_flush"
          serviceData={serviceData}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Verify service-specific content
      expect(screen.getByText(serviceData.service_label)).toBeInTheDocument();
      expect(screen.getByText(serviceData.cache_size)).toBeInTheDocument();
      expect(screen.getByText(`${serviceData.entry_count} entries`)).toBeInTheDocument();

      // Verify warning message
      expect(screen.getByText(/clearing this service cache/i)).toBeInTheDocument();
    });

    test('displays configuration modal with form fields', async () => {
      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="configure"
          configData={mockCacheData.configuration}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Verify configuration form fields
      expect(screen.getByTestId('cache-ttl-input')).toBeInTheDocument();
      expect(screen.getByTestId('max-cache-size-input')).toBeInTheDocument();
      expect(screen.getByTestId('compression-enabled-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('auto-cleanup-toggle')).toBeInTheDocument();

      // Test form validation
      const ttlInput = screen.getByTestId('cache-ttl-input');
      await user.clear(ttlInput);
      await user.type(ttlInput, '-1'); // Invalid value

      const saveButton = screen.getByTestId('save-configuration-button');
      await user.click(saveButton);

      expect(screen.getByText(/ttl must be a positive number/i)).toBeInTheDocument();
    });
  });

  describe('Modal Interactions and Events', () => {
    test('handles confirmation with loading states', async () => {
      const mockOnConfirm = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={mockOnConfirm}
          onCancel={vi.fn()}
        />
      );

      const confirmButton = screen.getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Verify loading state
      expect(screen.getByTestId('flush-loading-indicator')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
      expect(screen.getByTestId('cancel-flush-button')).toBeDisabled();

      // Wait for operation completion
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });

    test('handles cancellation and escape key', async () => {
      const mockOnCancel = vi.fn();

      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={vi.fn()}
          onCancel={mockOnCancel}
        />
      );

      // Test cancel button
      const cancelButton = screen.getByTestId('cancel-flush-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);

      // Test escape key
      await user.keyboard('{Escape}');
      
      expect(mockOnCancel).toHaveBeenCalledTimes(2);
    });

    test('prevents outside clicks during loading', async () => {
      const mockOnCancel = vi.fn();
      const mockOnConfirm = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Start operation
      const confirmButton = screen.getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Try to click outside modal
      const modalOverlay = screen.getByTestId('modal-overlay');
      await user.click(modalOverlay);

      // Should not trigger cancel during loading
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and Focus Management', () => {
    test('manages focus correctly when modal opens and closes', async () => {
      const { user, rerender } = renderWithProviders(
        <>
          <button data-testid="trigger-button">Open Modal</button>
          <CacheModal 
            isOpen={false}
            operation="system_flush"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </>
      );

      // Focus trigger button
      const triggerButton = screen.getByTestId('trigger-button');
      triggerButton.focus();
      expect(triggerButton).toHaveFocus();

      // Open modal
      rerender(
        <>
          <button data-testid="trigger-button">Open Modal</button>
          <CacheModal 
            isOpen={true}
            operation="system_flush"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </>
      );

      // Verify focus moves to modal
      await waitFor(() => {
        const modal = screen.getByTestId('cache-flush-modal');
        expect(modal).toHaveFocus();
      });

      // Close modal
      rerender(
        <>
          <button data-testid="trigger-button">Open Modal</button>
          <CacheModal 
            isOpen={false}
            operation="system_flush"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </>
      );

      // Verify focus returns to trigger
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
    });

    test('supports keyboard navigation within modal', async () => {
      const { user } = renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Test tab navigation
      await user.tab();
      expect(screen.getByTestId('cancel-flush-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('confirm-flush-button')).toHaveFocus();

      // Test shift+tab navigation
      await user.tab({ shift: true });
      expect(screen.getByTestId('cancel-flush-button')).toHaveFocus();

      // Test focus trap - tabbing from last element goes to first
      await user.tab();
      await user.tab();
      expect(screen.getByTestId('cancel-flush-button')).toHaveFocus();
    });

    test('provides appropriate ARIA labels and descriptions', async () => {
      renderWithProviders(
        <CacheModal 
          isOpen={true}
          operation="system_flush"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const modal = screen.getByTestId('cache-flush-modal');
      
      // Verify ARIA attributes
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');

      // Verify button labels
      const confirmButton = screen.getByTestId('confirm-flush-button');
      expect(confirmButton).toHaveAttribute('aria-label', 
        expect.stringContaining('Confirm system cache flush operation')
      );

      const cancelButton = screen.getByTestId('cancel-flush-button');
      expect(cancelButton).toHaveAttribute('aria-label', 
        expect.stringContaining('Cancel cache flush operation')
      );
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Cache Management Integration', () => {
  describe('Complete Cache Operations Workflow', () => {
    test('performs end-to-end system cache flush operation', async () => {
      const { user, container } = renderWithProviders(<CachePage />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Initiate system flush
      await cacheTestUtils.simulateFlushOperation('system', undefined, 'success');

      // Verify success feedback
      expect(screen.getByTestId('flush-success-message')).toBeInTheDocument();
      expect(screen.getByText(/system cache cleared successfully/i)).toBeInTheDocument();

      // Verify data refresh
      await waitFor(() => {
        expect(screen.getByText('0 MB')).toBeInTheDocument(); // Updated cache size
      });

      // Validate accessibility after operation
      await cacheTestUtils.validateAccessibility(container);
    });

    test('performs service-specific cache flush with error recovery', async () => {
      const { user } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Configure server to return permission error initially
      server.use(
        http.delete('/api/v2/system/cache/services/db_mysql_customers', () => {
          return HttpResponse.json(
            { error: { message: 'Insufficient permissions', status_code: 403 }},
            { status: 403 }
          );
        })
      );

      // Attempt service flush
      await cacheTestUtils.simulateFlushOperation('service', 'db_mysql_customers', 'permission_error');

      // Verify error handling
      expect(screen.getByTestId('flush-error-message')).toBeInTheDocument();
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();

      // Test retry after permission fix
      server.resetHandlers(); // Reset to success handlers

      const retryButton = screen.getByTestId('retry-flush-button');
      await user.click(retryButton);

      // Verify success on retry
      await waitFor(() => {
        expect(screen.getByTestId('flush-success-message')).toBeInTheDocument();
      });
    });

    test('handles concurrent cache operations appropriately', async () => {
      const { user } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Start system flush
      const systemFlushButton = screen.getByTestId('system-cache-flush-button');
      await user.click(systemFlushButton);

      const systemModal = await screen.findByTestId('cache-flush-modal');
      const systemConfirmButton = within(systemModal).getByTestId('confirm-flush-button');
      await user.click(systemConfirmButton);

      // Verify loading state
      expect(screen.getByTestId('flush-loading-indicator')).toBeInTheDocument();

      // Try to start another operation - should be disabled
      const serviceFlushButton = screen.getByTestId('service-cache-flush-db_mysql_customers');
      expect(serviceFlushButton).toBeDisabled();

      // Wait for first operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('flush-success-message')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify other operations are re-enabled
      expect(serviceFlushButton).not.toBeDisabled();
    });
  });

  describe('Comprehensive Accessibility Testing', () => {
    test('maintains WCAG 2.1 AA compliance throughout all interactions', async () => {
      const { user, container } = renderWithProviders(<CachePage />);

      // Initial accessibility check
      await cacheTestUtils.validateAccessibility(container);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Accessibility during data display
      await cacheTestUtils.validateAccessibility(container);

      // Test keyboard navigation
      await cacheTestUtils.testKeyboardNavigation();

      // Accessibility during modal interactions
      const flushButton = screen.getByTestId('system-cache-flush-button');
      await user.click(flushButton);

      const modal = await screen.findByTestId('cache-flush-modal');
      await cacheTestUtils.validateAccessibility(modal);

      // Test screen reader announcements
      const confirmButton = within(modal).getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Verify ARIA live regions are updated
      await waitFor(() => {
        const liveRegion = screen.getByTestId('cache-status-live-region');
        expect(liveRegion).toHaveTextContent(/cache operation in progress/i);
      });
    });

    test('supports high contrast and reduced motion preferences', async () => {
      // Mock user preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn((query: string) => ({
          matches: query.includes('prefers-reduced-motion') || query.includes('prefers-contrast'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { container } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Verify high contrast classes are applied
      const dashboard = screen.getByTestId('cache-management-dashboard');
      expect(dashboard).toHaveClass('high-contrast');

      // Verify reduced motion classes
      expect(dashboard).toHaveClass('reduce-motion');

      // Validate accessibility with preferences
      await cacheTestUtils.validateAccessibility(container);
    });
  });

  describe('Performance and Optimization Testing', () => {
    test('maintains responsive performance with large datasets', async () => {
      // Create large dataset
      const largeServiceList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockCacheData.services[0],
        id: index + 1,
        service_name: `service_${index + 1}`,
        service_label: `Service ${index + 1}`,
      }));

      // Mock API to return large dataset
      server.use(
        http.get('/api/v2/system/cache/services', () => {
          return createJsonResponse({ resource: largeServiceList });
        })
      );

      const startTime = performance.now();
      
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify performance is acceptable
      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds

      // Verify virtual scrolling is working
      const virtualContainer = screen.getByTestId('virtual-table-container');
      expect(virtualContainer).toBeInTheDocument();

      // Verify only visible rows are rendered
      const renderedRows = screen.getAllByTestId(/^service-row-/);
      expect(renderedRows.length).toBeLessThan(100); // Should only render visible rows
    });

    test('optimizes API calls with intelligent caching', async () => {
      const apiCallSpy = vi.fn();
      
      // Track API calls
      server.use(
        http.get('/api/v2/system/cache/status', (req) => {
          apiCallSpy();
          return createJsonResponse({
            system: mockCacheData.system,
            services: mockCacheData.services,
            configuration: mockCacheData.configuration
          });
        })
      );

      const { rerender } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
      });

      // Initial API call should have been made
      expect(apiCallSpy).toHaveBeenCalledTimes(1);

      // Re-render component - should use cached data
      rerender(<CachePage />);

      // Should not make additional API call due to caching
      expect(apiCallSpy).toHaveBeenCalledTimes(1);

      // Test cache invalidation after flush operation
      const flushButton = screen.getByTestId('system-cache-flush-button');
      const user = userEvent.setup();
      await user.click(flushButton);

      const modal = await screen.findByTestId('cache-flush-modal');
      const confirmButton = within(modal).getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Should refresh data after successful flush
      await waitFor(() => {
        expect(apiCallSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});

// ============================================================================
// ERROR BOUNDARY AND RESILIENCE TESTS
// ============================================================================

describe('Error Handling and Resilience', () => {
  test('handles component rendering errors gracefully', async () => {
    // Mock a component that throws an error
    const ErrorComponent = () => {
      throw new Error('Component rendering error');
    };

    const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
      try {
        return <>{children}</>;
      } catch (error) {
        return (
          <div data-testid="error-boundary">
            <h2>Something went wrong</h2>
            <p>Cache management temporarily unavailable</p>
            <button data-testid="retry-button">Try Again</button>
          </div>
        );
      }
    };

    renderWithProviders(
      <ErrorBoundaryWrapper>
        <ErrorComponent />
      </ErrorBoundaryWrapper>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('recovers from network failures with retry mechanisms', async () => {
    let failureCount = 0;
    
    // Configure server to fail first two requests, then succeed
    server.use(
      http.get('/api/v2/system/cache/status', () => {
        failureCount++;
        if (failureCount <= 2) {
          return HttpResponse.error();
        }
        return createJsonResponse({
          system: mockCacheData.system,
          services: mockCacheData.services,
          configuration: mockCacheData.configuration
        });
      })
    );

    const { user } = renderWithProviders(<CachePage />);

    // Should show error state after failures
    await waitFor(() => {
      expect(screen.getByTestId('cache-error-state')).toBeInTheDocument();
    });

    // Test manual retry
    const retryButton = screen.getByTestId('retry-cache-load');
    await user.click(retryButton);

    // Should still fail on second attempt
    await waitFor(() => {
      expect(screen.getByTestId('cache-error-state')).toBeInTheDocument();
    });

    // Third retry should succeed
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('cache-management-dashboard')).toBeInTheDocument();
    });

    expect(failureCount).toBe(3);
  });
});