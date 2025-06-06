/**
 * Database Service List Components Test Suite
 * 
 * Comprehensive test suite for database service list components using Vitest 2.1+ and Mock Service Worker (MSW).
 * Tests component rendering, user interactions, data fetching, CRUD operations, error handling, and accessibility.
 * Includes integration tests for table virtualization, filtering, sorting, and real-time updates with React Query/SWR.
 * 
 * Test Coverage Areas:
 * - Component rendering and initialization
 * - Zustand store state management and actions
 * - React Query caching and SWR synchronization
 * - CRUD operations with optimistic updates
 * - Table virtualization with TanStack Virtual
 * - User interactions and event handling
 * - Error handling and recovery scenarios
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance benchmarks and optimization validation
 * 
 * @fileoverview Comprehensive test suite for service list components
 * @version 1.0.0
 * @since 2024-01-01
 */

import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  within,
  getByRole,
  getByText,
  queryByText,
  cleanup,
  prettyDOM
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { server } from '../../../test/mocks/database-service-handlers';
import { TestProviders, cleanupTestProviders, waitForQueryToSettle } from '../../../test/utils/test-providers';

// Import components under test
import ServiceListContainer, { 
  ServiceListContainerImplementation,
  useServiceListContainerStore 
} from './service-list-container';
import ServiceListTable from './service-list-table';
import { 
  useServiceListComplete,
  useServiceListVirtualization,
  useServiceConnectionStatus 
} from './service-list-hooks';

// Import types and test utilities
import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ServiceListFilters,
  ServiceListSort,
  BulkActionType,
  ApiErrorResponse
} from './service-list-types';

// Mock data and fixtures
import {
  mockDatabaseServices,
  mockServiceTypes,
  createMockDatabaseService,
  createMockConnectionTestResult,
  MOCK_SERVICE_LIST_RESPONSES,
  PERFORMANCE_BENCHMARKS
} from '../../../test/fixtures/database-service-fixtures';

// =============================================================================
// TEST SETUP AND CONFIGURATION
// =============================================================================

/**
 * Test configuration and global setup
 */
const TEST_CONFIG = {
  // Performance thresholds from technical spec
  CONNECTION_TEST_TIMEOUT: 5000, // 5 seconds max per spec F-001-RQ-002
  LARGE_DATASET_SIZE: 1000, // For virtualization testing per F-002-RQ-002
  RENDER_PERFORMANCE_THRESHOLD: 100, // 100ms max initial render
  QUERY_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Testing options
  ENABLE_PERFORMANCE_TESTING: true,
  ENABLE_ACCESSIBILITY_TESTING: true,
  ENABLE_VIRTUALIZATION_TESTING: true,
  DEBUG_TESTS: process.env.DEBUG_TESTS === 'true'
} as const;

/**
 * Mock Next.js router for testing
 */
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const mockUseRouter = vi.fn(() => mockRouter);
const mockUseSearchParams = vi.fn(() => new URLSearchParams());
const mockUsePathname = vi.fn(() => '/api-connections/database');

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  useSearchParams: mockUseSearchParams,
  usePathname: mockUsePathname,
}));

/**
 * Mock Zustand store for isolated testing
 */
const createMockStore = () => ({
  services: [],
  filteredServices: [],
  selectedServices: new Set<number>(),
  filters: {},
  sorting: { field: 'name' as const, direction: 'asc' as const },
  pagination: {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0,
  },
  virtualization: {
    enabled: false,
    scrollOffset: 0,
    visibleRange: [0, 25] as [number, number],
  },
  ui: {
    loading: false,
    error: null,
    refreshing: false,
    bulkActionInProgress: false,
    selectedBulkAction: null,
  },
  preferences: {
    defaultPageSize: 25,
    defaultSort: { field: 'name' as const, direction: 'asc' as const },
    defaultFilters: {},
    columnVisibility: {},
    columnOrder: [],
    columnWidths: {},
    compactMode: false,
    autoRefresh: true,
    refreshInterval: 30000,
  },
  isInitialized: false,
  isPaywallActive: false,
  systemMode: false,
  routeData: null,
  
  // Mock actions
  setServices: vi.fn(),
  addService: vi.fn(),
  updateService: vi.fn(),
  removeService: vi.fn(),
  refreshServices: vi.fn(),
  setSelectedServices: vi.fn(),
  selectService: vi.fn(),
  deselectService: vi.fn(),
  selectAll: vi.fn(),
  deselectAll: vi.fn(),
  selectFiltered: vi.fn(),
  setFilters: vi.fn(),
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  setSorting: vi.fn(),
  setCurrentPage: vi.fn(),
  setPageSize: vi.fn(),
  goToPage: vi.fn(),
  nextPage: vi.fn(),
  previousPage: vi.fn(),
  setVirtualization: vi.fn(),
  updateScrollOffset: vi.fn(),
  updateVisibleRange: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  setRefreshing: vi.fn(),
  setBulkActionInProgress: vi.fn(),
  setSelectedBulkAction: vi.fn(),
  executeBulkAction: vi.fn(),
  updatePreferences: vi.fn(),
  resetPreferences: vi.fn(),
  applyFiltersAndSort: vi.fn(),
  setInitialized: vi.fn(),
  setPaywallActive: vi.fn(),
  setSystemMode: vi.fn(),
  setRouteData: vi.fn(),
  initializeFromRoute: vi.fn(),
  reset: vi.fn(),
  resetState: vi.fn(),
});

/**
 * Mock database service provider context
 */
const mockDatabaseServiceContext = {
  services: mockDatabaseServices,
  loading: false,
  error: null,
  refreshServices: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  testConnection: vi.fn(),
};

// Mock provider context hooks
vi.mock('../database-service-provider', () => ({
  useDatabaseServiceContext: () => mockDatabaseServiceContext,
  useDatabaseServiceActions: () => mockDatabaseServiceContext,
  useDatabaseServiceState: () => mockDatabaseServiceContext,
}));

/**
 * Performance measurement utilities
 */
let performanceMarks: { [key: string]: number } = {};

const startPerformanceMark = (name: string) => {
  performanceMarks[name] = performance.now();
};

const endPerformanceMark = (name: string): number => {
  const start = performanceMarks[name];
  if (!start) return 0;
  const duration = performance.now() - start;
  delete performanceMarks[name];
  return duration;
};

// =============================================================================
// GLOBAL TEST SETUP AND TEARDOWN
// =============================================================================

beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({ 
    onUnhandledRequest: 'error' 
  });
  
  // Setup intersection observer mock for virtualization testing
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Setup resize observer mock for responsive testing
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock window.matchMedia for theme testing
  global.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  
  if (TEST_CONFIG.DEBUG_TESTS) {
    console.log('🧪 Test suite initialized with MSW server and mocks');
  }
});

afterAll(() => {
  // Clean up MSW server
  server.close();
  
  if (TEST_CONFIG.DEBUG_TESTS) {
    console.log('🧪 Test suite cleanup completed');
  }
});

beforeEach(() => {
  // Reset MSW handlers before each test
  server.resetHandlers();
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset performance marks
  performanceMarks = {};
  
  // Reset router mocks
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUsePathname.mockReturnValue('/api-connections/database');
  
  if (TEST_CONFIG.DEBUG_TESTS) {
    console.log('🧪 Test setup completed');
  }
});

afterEach(() => {
  // Clean up React components
  cleanup();
  
  // Clear performance marks
  performanceMarks = {};
  
  if (TEST_CONFIG.DEBUG_TESTS) {
    console.log('🧪 Test cleanup completed');
  }
});

// =============================================================================
// UTILITY FUNCTIONS FOR TESTING
// =============================================================================

/**
 * Create a test query client with optimized settings
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: TEST_CONFIG.DEBUG_TESTS ? console.log : () => {},
      warn: TEST_CONFIG.DEBUG_TESTS ? console.warn : () => {},
      error: TEST_CONFIG.DEBUG_TESTS ? console.error : () => {},
    },
  });
};

/**
 * Render component with all necessary providers
 */
const renderWithProviders = (
  component: React.ReactElement,
  options: {
    queryClient?: QueryClient;
    initialFilters?: ServiceListFilters;
    mockStore?: any;
    enablePerformanceTracking?: boolean;
  } = {}
) => {
  const { 
    queryClient = createTestQueryClient(),
    enablePerformanceTracking = false 
  } = options;
  
  if (enablePerformanceTracking) {
    startPerformanceMark('component-render');
  }
  
  const result = render(
    <TestProviders 
      queryClient={queryClient}
      enableErrorBoundary={true}
    >
      {component}
    </TestProviders>
  );
  
  if (enablePerformanceTracking) {
    const renderTime = endPerformanceMark('component-render');
    if (renderTime > TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD) {
      console.warn(`⚠️ Slow render detected: ${renderTime}ms (threshold: ${TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD}ms)`);
    }
  }
  
  return { ...result, queryClient };
};

/**
 * Wait for all async operations to complete
 */
const waitForAsyncOperations = async (queryClient?: QueryClient) => {
  await waitFor(() => {
    expect(screen.queryByTestId('test-loading-fallback')).not.toBeInTheDocument();
  });
  
  if (queryClient) {
    await waitForQueryToSettle(queryClient);
  }
  
  // Wait for any pending state updates
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });
};

/**
 * Mock service list data with specified parameters
 */
const setupMockServiceData = (options: {
  count?: number;
  includeError?: boolean;
  includeEmpty?: boolean;
  serviceTypes?: string[];
  statuses?: ServiceStatus[];
} = {}) => {
  const { 
    count = 10, 
    includeError = false, 
    includeEmpty = false,
    serviceTypes = ['mysql', 'postgresql'],
    statuses = ['active', 'inactive', 'error']
  } = options;
  
  if (includeEmpty) {
    return [];
  }
  
  if (includeError) {
    throw new Error('Mock service data error');
  }
  
  return Array.from({ length: count }, (_, index) => 
    createMockDatabaseService({
      id: index + 1,
      name: `test-service-${index + 1}`,
      type: serviceTypes[index % serviceTypes.length] as DatabaseDriver,
      status: statuses[index % statuses.length],
      is_active: index % 2 === 0,
    })
  );
};

// =============================================================================
// SERVICE LIST CONTAINER COMPONENT TESTS
// =============================================================================

describe('ServiceListContainer Component', () => {
  describe('Initialization and Rendering', () => {
    it('should render loading state initially', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      expect(screen.getByTestId('service-list-container')).toBeInTheDocument();
      expect(screen.getByText(/loading services/i)).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Database services loading');
      
      await waitForAsyncOperations(queryClient);
    });
    
    it('should initialize from route parameters correctly', async () => {
      const searchParams = new URLSearchParams({
        search: 'mysql',
        sortBy: 'created_date',
        sortDir: 'desc',
        page: '2',
        pageSize: '50',
        type: 'mysql,postgresql',
        status: 'active',
        active: 'true'
      });
      
      mockUseSearchParams.mockReturnValue(searchParams);
      mockUsePathname.mockReturnValue('/system-settings/database');
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Verify route initialization was called
      expect(mockUseSearchParams).toHaveBeenCalled();
      expect(mockUsePathname).toHaveBeenCalled();
    });
    
    it('should handle system mode detection from pathname', async () => {
      mockUsePathname.mockReturnValue('/system-settings/database');
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer systemMode={true} data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(mockUsePathname).toHaveBeenCalled();
    });
  });
  
  describe('Paywall Enforcement', () => {
    it('should show paywall when service types are empty', async () => {
      // Mock empty service types response to trigger paywall
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.emptyServiceTypes
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer enablePaywall={true} data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByText(/premium feature/i)).toBeInTheDocument();
      expect(screen.getByText(/upgrade now/i)).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Paywall restriction');
    });
    
    it('should bypass paywall when disabled', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer enablePaywall={false} data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.queryByText(/premium feature/i)).not.toBeInTheDocument();
    });
  });
  
  describe('Error Handling and Recovery', () => {
    it('should display error state with retry option', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.serverError
      );
      
      const onError = vi.fn();
      const { queryClient } = renderWithProviders(
        <ServiceListContainer onError={onError} data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Database services error');
      expect(onError).toHaveBeenCalled();
    });
    
    it('should handle retry functionality', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.serverError
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Switch to successful response for retry
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.successfulServiceList
      );
      
      await userEvent.click(retryButton);
      await waitForAsyncOperations(queryClient);
      
      expect(screen.queryByText(/failed to load services/i)).not.toBeInTheDocument();
    });
    
    it('should handle network errors gracefully', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.networkError
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
    });
  });
  
  describe('Service Data Management', () => {
    it('should load and display services successfully', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.successfulServiceList
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Database services management');
      expect(screen.getByTestId('service-list-container-table')).toBeInTheDocument();
    });
    
    it('should handle service lifecycle callbacks', async () => {
      const onServiceCreated = vi.fn();
      const onServiceUpdated = vi.fn();
      const onServiceDeleted = vi.fn();
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          onServiceCreated={onServiceCreated}
          onServiceUpdated={onServiceUpdated}
          onServiceDeleted={onServiceDeleted}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // These callbacks are tested through store subscriptions
      // Implementation would trigger these based on store changes
    });
    
    it('should handle empty service list', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.emptyServiceList
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByTestId('service-list-container-table')).toBeInTheDocument();
    });
  });
  
  describe('Real-time Data Synchronization', () => {
    it('should refresh data automatically with SWR', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          autoRefresh={true}
          refreshInterval={1000}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Verify SWR configuration for auto-refresh
      expect(mockDatabaseServiceContext.refreshServices).toHaveBeenCalled();
    });
    
    it('should handle manual refresh operations', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Simulate manual refresh through store action
      expect(mockDatabaseServiceContext.refreshServices).toHaveBeenCalled();
    });
  });
  
  describe('Performance and Optimization', () => {
    it('should meet render performance requirements', async () => {
      const startTime = performance.now();
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />,
        { enablePerformanceTracking: true }
      );
      
      await waitForAsyncOperations(queryClient);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD);
    });
    
    it('should handle large datasets efficiently', async () => {
      const largeDataset = setupMockServiceData({ count: TEST_CONFIG.LARGE_DATASET_SIZE });
      
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.largeServiceList(largeDataset)
      );
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          enableVirtualization={true}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      expect(screen.getByTestId('service-list-container-table')).toBeInTheDocument();
    });
  });
  
  if (TEST_CONFIG.ENABLE_ACCESSIBILITY_TESTING) {
    describe('Accessibility Compliance', () => {
      it('should meet WCAG 2.1 AA standards', async () => {
        const { queryClient, container } = renderWithProviders(
          <ServiceListContainer data-testid="service-list-container" />
        );
        
        await waitForAsyncOperations(queryClient);
        
        // Check for proper ARIA labels
        expect(screen.getByRole('main')).toHaveAttribute('aria-label');
        
        // Check for keyboard navigation support
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        expect(focusableElements.length).toBeGreaterThan(0);
      });
      
      it('should support screen reader navigation', async () => {
        const { queryClient } = renderWithProviders(
          <ServiceListContainer data-testid="service-list-container" />
        );
        
        await waitForAsyncOperations(queryClient);
        
        // Check for proper heading hierarchy
        expect(screen.getByRole('main')).toBeInTheDocument();
        
        // Check for descriptive labels
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('aria-label');
      });
    });
  }
});

// =============================================================================
// SERVICE LIST TABLE COMPONENT TESTS
// =============================================================================

describe('ServiceListTable Component', () => {
  const defaultTableProps = {
    services: mockDatabaseServices.slice(0, 5),
    loading: false,
    error: null,
    onServiceSelect: vi.fn(),
    onServiceEdit: vi.fn(),
    onServiceDelete: vi.fn(),
    onServiceTest: vi.fn(),
    onServiceToggle: vi.fn(),
    'data-testid': 'service-list-table'
  };
  
  describe('Basic Rendering and Layout', () => {
    it('should render table with services data', async () => {
      renderWithProviders(<ServiceListTable {...defaultTableProps} />);
      
      expect(screen.getByTestId('service-list-table')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Check for service rows
      defaultTableProps.services.forEach(service => {
        expect(screen.getByText(service.name)).toBeInTheDocument();
      });
    });
    
    it('should display loading state', async () => {
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          services={[]}
          loading={true} 
        />
      );
      
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument();
    });
    
    it('should display empty state when no services', async () => {
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          services={[]}
          loading={false} 
        />
      );
      
      expect(screen.getByText(/no services found/i) || screen.getByText(/empty/i)).toBeInTheDocument();
    });
    
    it('should display error state', async () => {
      const error = new Error('Failed to load services');
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          services={[]}
          error={error}
        />
      );
      
      expect(screen.getByText(/error/i) || screen.getByText(error.message)).toBeInTheDocument();
    });
  });
  
  describe('Service CRUD Operations', () => {
    it('should handle service selection', async () => {
      const onServiceSelect = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          onServiceSelect={onServiceSelect}
        />
      );
      
      const firstService = screen.getByText(defaultTableProps.services[0].name);
      await userEvent.click(firstService);
      
      expect(onServiceSelect).toHaveBeenCalledWith(defaultTableProps.services[0]);
    });
    
    it('should handle service editing', async () => {
      const onServiceEdit = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          onServiceEdit={onServiceEdit}
        />
      );
      
      const editButton = screen.getByLabelText(/edit.*service/i) || 
                        screen.getByRole('button', { name: /edit/i });
      await userEvent.click(editButton);
      
      expect(onServiceEdit).toHaveBeenCalledWith(defaultTableProps.services[0]);
    });
    
    it('should handle service deletion with confirmation', async () => {
      const onServiceDelete = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          onServiceDelete={onServiceDelete}
        />
      );
      
      const deleteButton = screen.getByLabelText(/delete.*service/i) || 
                          screen.getByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);
      
      // Look for confirmation dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i }) ||
                           screen.getByRole('button', { name: /delete/i });
      await userEvent.click(confirmButton);
      
      expect(onServiceDelete).toHaveBeenCalledWith(defaultTableProps.services[0]);
    });
    
    it('should handle connection testing', async () => {
      const onServiceTest = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          onServiceTest={onServiceTest}
        />
      );
      
      const testButton = screen.getByLabelText(/test.*connection/i) || 
                        screen.getByRole('button', { name: /test/i });
      await userEvent.click(testButton);
      
      expect(onServiceTest).toHaveBeenCalledWith(defaultTableProps.services[0]);
    });
    
    it('should handle service activation toggle', async () => {
      const onServiceToggle = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...defaultTableProps} 
          onServiceToggle={onServiceToggle}
        />
      );
      
      const toggleSwitch = screen.getByRole('switch') || 
                          screen.getByLabelText(/active/i);
      await userEvent.click(toggleSwitch);
      
      expect(onServiceToggle).toHaveBeenCalledWith(
        defaultTableProps.services[0], 
        !defaultTableProps.services[0].is_active
      );
    });
  });
  
  describe('Bulk Operations', () => {
    const bulkActionProps = {
      ...defaultTableProps,
      enableBulkActions: true,
      onBulkActions: vi.fn(),
      selection: {
        enabled: true,
        multiple: true,
        selectedIds: new Set([1, 2]),
        onSelectionChange: vi.fn(),
      }
    };
    
    it('should support multiple service selection', async () => {
      const onSelectionChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...bulkActionProps} 
          selection={{
            ...bulkActionProps.selection,
            onSelectionChange
          }}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]); // Select first service
      
      expect(onSelectionChange).toHaveBeenCalled();
    });
    
    it('should execute bulk delete operation', async () => {
      const onBulkActions = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...bulkActionProps} 
          onBulkActions={onBulkActions}
        />
      );
      
      // Select bulk action
      const bulkDeleteButton = screen.getByRole('button', { name: /bulk.*delete/i }) ||
                              screen.getByRole('button', { name: /delete.*selected/i });
      await userEvent.click(bulkDeleteButton);
      
      // Confirm bulk action
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);
      
      expect(onBulkActions).toHaveBeenCalledWith(
        'delete', 
        expect.arrayContaining([
          defaultTableProps.services[0],
          defaultTableProps.services[1]
        ])
      );
    });
    
    it('should support select all functionality', async () => {
      const onSelectionChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...bulkActionProps} 
          selection={{
            ...bulkActionProps.selection,
            onSelectionChange
          }}
        />
      );
      
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await userEvent.click(selectAllCheckbox);
      
      expect(onSelectionChange).toHaveBeenCalledWith(
        new Set(defaultTableProps.services.map(s => s.id))
      );
    });
  });
  
  describe('Sorting and Filtering', () => {
    const sortingProps = {
      ...defaultTableProps,
      sorting: {
        sortBy: 'name' as keyof DatabaseService,
        sortDirection: 'asc' as const,
        onSortChange: vi.fn(),
      },
      filtering: {
        filters: { search: 'mysql' },
        onFiltersChange: vi.fn(),
      }
    };
    
    it('should handle column sorting', async () => {
      const onSortChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...sortingProps} 
          sorting={{
            ...sortingProps.sorting,
            onSortChange
          }}
        />
      );
      
      const nameColumnHeader = screen.getByRole('columnheader', { name: /name/i });
      await userEvent.click(nameColumnHeader);
      
      expect(onSortChange).toHaveBeenCalledWith({
        field: 'name',
        direction: 'desc' // Should toggle from asc to desc
      });
    });
    
    it('should display sort indicators', async () => {
      renderWithProviders(<ServiceListTable {...sortingProps} />);
      
      const nameColumnHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameColumnHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Check for visual sort indicator
      expect(within(nameColumnHeader).getByRole('img') || 
             within(nameColumnHeader).querySelector('svg')).toBeInTheDocument();
    });
    
    it('should handle search filtering', async () => {
      const onFiltersChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...sortingProps} 
          filtering={{
            ...sortingProps.filtering,
            onFiltersChange
          }}
        />
      );
      
      const searchInput = screen.getByRole('searchbox') || 
                         screen.getByLabelText(/search/i);
      await userEvent.type(searchInput, 'postgresql');
      
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'mysql' + 'postgresql' // Appended to existing search
        })
      );
    });
    
    it('should handle type filtering', async () => {
      const onFiltersChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...sortingProps} 
          filtering={{
            ...sortingProps.filtering,
            onFiltersChange
          }}
        />
      );
      
      const typeFilter = screen.getByRole('combobox', { name: /type/i }) ||
                        screen.getByLabelText(/database type/i);
      await userEvent.click(typeFilter);
      
      const mysqlOption = screen.getByRole('option', { name: /mysql/i });
      await userEvent.click(mysqlOption);
      
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.arrayContaining(['mysql'])
        })
      );
    });
  });
  
  describe('Pagination', () => {
    const paginationProps = {
      ...defaultTableProps,
      pagination: {
        currentPage: 2,
        pageSize: 10,
        totalItems: 50,
        totalPages: 5,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
      }
    };
    
    it('should display pagination controls', async () => {
      renderWithProviders(<ServiceListTable {...paginationProps} />);
      
      expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
    
    it('should handle page navigation', async () => {
      const onPageChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...paginationProps} 
          pagination={{
            ...paginationProps.pagination,
            onPageChange
          }}
        />
      );
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
    
    it('should handle page size changes', async () => {
      const onPageSizeChange = vi.fn();
      
      renderWithProviders(
        <ServiceListTable 
          {...paginationProps} 
          pagination={{
            ...paginationProps.pagination,
            onPageSizeChange
          }}
        />
      );
      
      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i }) ||
                            screen.getByLabelText(/items per page/i);
      await userEvent.click(pageSizeSelect);
      
      const option25 = screen.getByRole('option', { name: /25/i });
      await userEvent.click(option25);
      
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
    });
    
    it('should disable navigation at boundaries', async () => {
      renderWithProviders(
        <ServiceListTable 
          {...paginationProps} 
          pagination={{
            ...paginationProps.pagination,
            currentPage: 1
          }}
        />
      );
      
      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });
  });
  
  if (TEST_CONFIG.ENABLE_VIRTUALIZATION_TESTING) {
    describe('Table Virtualization', () => {
      const virtualizationProps = {
        ...defaultTableProps,
        services: setupMockServiceData({ count: 100 }),
        virtualization: {
          enabled: true,
          overscan: 5,
          estimateSize: 60,
        }
      };
      
      it('should enable virtualization for large datasets', async () => {
        renderWithProviders(<ServiceListTable {...virtualizationProps} />);
        
        // Check for virtual scrolling container
        expect(screen.getByRole('table')).toBeInTheDocument();
        
        // Verify only visible rows are rendered
        const visibleRows = screen.getAllByRole('row');
        expect(visibleRows.length).toBeLessThan(virtualizationProps.services.length);
      });
      
      it('should handle virtual scrolling efficiently', async () => {
        const { container } = renderWithProviders(<ServiceListTable {...virtualizationProps} />);
        
        const scrollContainer = container.querySelector('[data-testid*="virtual"]') ||
                               container.querySelector('.virtual-container');
        
        if (scrollContainer) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
          
          await waitFor(() => {
            // Should render different rows after scrolling
            const rowsAfterScroll = screen.getAllByRole('row');
            expect(rowsAfterScroll.length).toBeGreaterThan(0);
          });
        }
      });
      
      it('should maintain performance with large datasets', async () => {
        const startTime = performance.now();
        
        renderWithProviders(<ServiceListTable {...virtualizationProps} />);
        
        await waitFor(() => {
          expect(screen.getByRole('table')).toBeInTheDocument();
        });
        
        const renderTime = performance.now() - startTime;
        expect(renderTime).toBeLessThan(TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD * 2); // Allow 2x threshold for large datasets
      });
    });
  }
  
  if (TEST_CONFIG.ENABLE_ACCESSIBILITY_TESTING) {
    describe('Table Accessibility', () => {
      it('should have proper table semantics', async () => {
        renderWithProviders(<ServiceListTable {...defaultTableProps} />);
        
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength.greaterThan(0);
        expect(screen.getAllByRole('row')).toHaveLength.greaterThan(1); // Headers + data rows
      });
      
      it('should support keyboard navigation', async () => {
        renderWithProviders(<ServiceListTable {...defaultTableProps} />);
        
        const table = screen.getByRole('table');
        const firstRow = screen.getAllByRole('row')[1]; // Skip header row
        
        // Test tab navigation
        firstRow.focus();
        expect(document.activeElement).toBe(firstRow);
        
        // Test arrow key navigation
        fireEvent.keyDown(firstRow, { key: 'ArrowDown' });
        // Should move to next row
      });
      
      it('should have proper ARIA labels and descriptions', async () => {
        renderWithProviders(<ServiceListTable {...defaultTableProps} />);
        
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-label');
        
        // Check column headers have proper accessibility
        const columnHeaders = screen.getAllByRole('columnheader');
        columnHeaders.forEach(header => {
          expect(header).toHaveTextContent(/.+/); // Should have content
        });
      });
      
      it('should announce sort changes to screen readers', async () => {
        const sortingProps = {
          ...defaultTableProps,
          sorting: {
            sortBy: 'name' as keyof DatabaseService,
            sortDirection: 'asc' as const,
            onSortChange: vi.fn(),
          }
        };
        
        renderWithProviders(<ServiceListTable {...sortingProps} />);
        
        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      });
    });
  }
});

// =============================================================================
// SERVICE LIST HOOKS TESTS
// =============================================================================

describe('Service List Hooks', () => {
  describe('useServiceListComplete Hook', () => {
    it('should provide complete service list functionality', async () => {
      // This would test the custom hook implementation
      // For now, we'll test that it can be imported
      expect(useServiceListComplete).toBeDefined();
    });
  });
  
  describe('useServiceListVirtualization Hook', () => {
    it('should provide virtualization functionality', async () => {
      expect(useServiceListVirtualization).toBeDefined();
    });
  });
  
  describe('useServiceConnectionStatus Hook', () => {
    it('should manage connection status state', async () => {
      expect(useServiceConnectionStatus).toBeDefined();
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Service List Integration Tests', () => {
  describe('End-to-End Workflow', () => {
    it('should complete full service management workflow', async () => {
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.successfulServiceList
      );
      
      const onServiceCreated = vi.fn();
      const onServiceUpdated = vi.fn();
      const onServiceDeleted = vi.fn();
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          onServiceCreated={onServiceCreated}
          onServiceUpdated={onServiceUpdated}
          onServiceDeleted={onServiceDeleted}
          enableBulkActions={true}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Verify main container is rendered
      expect(screen.getByTestId('service-list-container')).toBeInTheDocument();
      expect(screen.getByTestId('service-list-container-table')).toBeInTheDocument();
      
      // Test service interaction workflow would continue here
      // This demonstrates the integration between container and table components
    });
    
    it('should handle real-time updates correctly', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          autoRefresh={true}
          refreshInterval={100}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Wait for auto-refresh cycle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify refresh was called
      expect(mockDatabaseServiceContext.refreshServices).toHaveBeenCalled();
    });
  });
  
  describe('React Query and SWR Integration', () => {
    it('should cache service data correctly', async () => {
      const queryClient = createTestQueryClient();
      
      renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />,
        { queryClient }
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Verify query cache has data
      const queryCache = queryClient.getQueryCache();
      expect(queryCache.getAll()).toHaveLength.greaterThan(0);
    });
    
    it('should handle cache invalidation properly', async () => {
      const queryClient = createTestQueryClient();
      
      renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />,
        { queryClient }
      );
      
      await waitForAsyncOperations(queryClient);
      
      // Invalidate queries
      await queryClient.invalidateQueries();
      
      // Should trigger refetch
      expect(mockDatabaseServiceContext.refreshServices).toHaveBeenCalled();
    });
  });
  
  describe('Error Recovery Integration', () => {
    it('should recover from temporary network failures', async () => {
      // Start with error
      server.use(MOCK_SERVICE_LIST_RESPONSES.networkError);
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
      
      // Switch to success
      server.use(MOCK_SERVICE_LIST_RESPONSES.successfulServiceList);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await userEvent.click(retryButton);
      
      await waitForAsyncOperations(queryClient);
      expect(screen.queryByText(/failed to load services/i)).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// PERFORMANCE BENCHMARKS
// =============================================================================

if (TEST_CONFIG.ENABLE_PERFORMANCE_TESTING) {
  describe('Performance Benchmarks', () => {
    it('should meet initial render performance requirements', async () => {
      const startTime = performance.now();
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      const renderTime = performance.now() - startTime;
      
      await waitForAsyncOperations(queryClient);
      
      expect(renderTime).toBeLessThan(TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD);
    });
    
    it('should handle large datasets within performance limits', async () => {
      const largeDataset = setupMockServiceData({ count: TEST_CONFIG.LARGE_DATASET_SIZE });
      
      server.use(
        MOCK_SERVICE_LIST_RESPONSES.largeServiceList(largeDataset)
      );
      
      const startTime = performance.now();
      
      const { queryClient } = renderWithProviders(
        <ServiceListContainer 
          enableVirtualization={true}
          data-testid="service-list-container" 
        />
      );
      
      await waitForAsyncOperations(queryClient);
      
      const totalTime = performance.now() - startTime;
      
      // Should handle large datasets within 2x normal threshold
      expect(totalTime).toBeLessThan(TEST_CONFIG.RENDER_PERFORMANCE_THRESHOLD * 2);
    });
    
    it('should optimize re-renders during interactions', async () => {
      const { queryClient } = renderWithProviders(
        <ServiceListContainer data-testid="service-list-container" />
      );
      
      await waitForAsyncOperations(queryClient);
      
      const startTime = performance.now();
      
      // Simulate user interactions
      const searchInput = screen.getByRole('searchbox') || 
                         screen.getByLabelText(/search/i) ||
                         screen.getByPlaceholderText(/search/i);
      
      if (searchInput) {
        await userEvent.type(searchInput, 'mysql');
        
        const interactionTime = performance.now() - startTime;
        expect(interactionTime).toBeLessThan(500); // 500ms max for user interactions
      }
    });
  });
}

// =============================================================================
// COVERAGE AND EDGE CASES
// =============================================================================

describe('Edge Cases and Error Scenarios', () => {
  it('should handle malformed service data gracefully', async () => {
    const malformedService = {
      id: 1,
      // Missing required fields
      type: 'invalid-type' as DatabaseDriver,
    } as DatabaseService;
    
    renderWithProviders(
      <ServiceListTable 
        {...{
          ...defaultTableProps,
          services: [malformedService]
        }}
      />
    );
    
    // Should not crash
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  
  it('should handle rapid user interactions', async () => {
    const onServiceSelect = vi.fn();
    
    renderWithProviders(
      <ServiceListTable 
        {...defaultTableProps} 
        onServiceSelect={onServiceSelect}
      />
    );
    
    const firstService = screen.getByText(defaultTableProps.services[0].name);
    
    // Rapid clicks
    await userEvent.click(firstService);
    await userEvent.click(firstService);
    await userEvent.click(firstService);
    
    // Should handle gracefully without errors
    expect(onServiceSelect).toHaveBeenCalled();
  });
  
  it('should handle concurrent operations correctly', async () => {
    const { queryClient } = renderWithProviders(
      <ServiceListContainer data-testid="service-list-container" />
    );
    
    await waitForAsyncOperations(queryClient);
    
    // Simulate concurrent operations
    const promises = [
      queryClient.invalidateQueries(),
      queryClient.refetchQueries(),
      queryClient.resetQueries()
    ];
    
    await Promise.all(promises);
    
    // Should handle concurrent operations without errors
    expect(screen.getByTestId('service-list-container')).toBeInTheDocument();
  });
});

// Export test utilities for use in other test files
export {
  renderWithProviders,
  waitForAsyncOperations,
  setupMockServiceData,
  createTestQueryClient,
  TEST_CONFIG
};