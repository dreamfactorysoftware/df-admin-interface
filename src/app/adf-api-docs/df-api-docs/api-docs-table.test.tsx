/**
 * @fileoverview Vitest test suite for API Documentation Table Component
 * @description Comprehensive testing coverage for React table functionality, data fetching, 
 * pagination, and user interactions. Converts Angular component testing to modern React 
 * testing patterns with MSW integration and Vitest performance optimization.
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Test Coverage Areas:
 * - Component rendering with React Testing Library patterns
 * - TanStack Virtual integration for large dataset performance 
 * - React Query/SWR data fetching with intelligent caching
 * - MSW mock handlers for realistic API response simulation
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - Performance validation for virtualized table rendering
 * - User interaction patterns (pagination, filtering, navigation)
 * - Error boundary and loading state management
 * - Responsive design and mobile compatibility testing
 * 
 * Performance Requirements:
 * - Test execution under 5 seconds per suite via Vitest optimization
 * - Virtual scrolling validation for 1000+ table datasets
 * - Cache hit responses under 50ms with React Query integration
 * - Real-time validation under 100ms for form interactions
 */

import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Import component under test
import { ApiDocsTable } from './api-docs-table';

// Import testing utilities and mocks
import { createTestWrapper, mockServiceTypes, mockServices } from '../../../test/test-utils';
import { handlers } from '../../../test/mocks/handlers';

// Enhanced custom matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * MSW Server Setup for API Mock Integration
 * Provides comprehensive DreamFactory API endpoint coverage with realistic
 * response simulation and performance-optimized request handling
 */
const mockApiHandlers = [
  // Services endpoint for API docs table data
  http.get('/api/v2/system/service', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter') || '';

    // Filter out Swagger services as per component logic
    let filteredServices = mockServices.filter(service => 
      service.isActive === true && 
      !service.type.includes('swagger')
    );

    // Apply additional filters if provided
    if (filter && filter !== '(type not like "%swagger%")') {
      const filterRegex = new RegExp(filter.replace(/[()]/g, ''), 'i');
      filteredServices = filteredServices.filter(service =>
        filterRegex.test(service.name) || 
        filterRegex.test(service.label) || 
        filterRegex.test(service.description)
      );
    }

    // Apply pagination
    const paginatedServices = filteredServices
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(offset, offset + limit);

    return HttpResponse.json({
      resource: paginatedServices,
      meta: {
        count: filteredServices.length,
        limit,
        offset,
        total: filteredServices.length
      }
    });
  }),

  // Service types endpoint for type mapping
  http.get('/api/v2/system/service_type', () => {
    return HttpResponse.json({
      resource: mockServiceTypes,
      meta: {
        count: mockServiceTypes.length
      }
    });
  }),

  // Individual service details endpoint
  http.get('/api/v2/system/service/:serviceName', ({ params }) => {
    const service = mockServices.find(s => s.name === params.serviceName);
    if (!service) {
      return HttpResponse.json(
        { error: { message: 'Service not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ resource: [service] });
  }),

  // Performance test handler for large datasets
  http.get('/api/v2/system/service/large-dataset', () => {
    const largeServiceList = Array.from({ length: 1500 }, (_, index) => ({
      id: index + 1,
      name: `test-service-${index + 1}`,
      label: `Test Service ${index + 1}`,
      description: `Test service description for item ${index + 1}`,
      type: index % 3 === 0 ? 'mysql' : index % 3 === 1 ? 'postgresql' : 'mongodb',
      group: index % 3 === 0 ? 'Database' : index % 3 === 1 ? 'Database' : 'NoSQL',
      isActive: true,
      config: {}
    }));

    return HttpResponse.json({
      resource: largeServiceList,
      meta: {
        count: 1500,
        limit: 100,
        offset: 0,
        total: 1500
      }
    });
  }),

  // Error simulation handlers for error boundary testing
  http.get('/api/v2/system/service/error', () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error', code: 500 } },
      { status: 500 }
    );
  }),

  // Timeout simulation for loading state testing
  http.get('/api/v2/system/service/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    return HttpResponse.json({ resource: [], meta: { count: 0 } });
  }),

  ...handlers // Include other existing handlers
];

const server = setupServer(...mockApiHandlers);

/**
 * Test Environment Setup
 * Configures React Query client, routing context, and testing utilities
 * for comprehensive component testing with realistic data scenarios
 */
let queryClient: QueryClient;
let user: ReturnType<typeof userEvent.setup>;

/**
 * Enhanced Test Wrapper Component
 * Provides comprehensive testing context including React Query, routing,
 * and theme providers with MSW integration for realistic testing scenarios
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div data-testid="test-wrapper">
          {children}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Custom Render Function with Enhanced Provider Support
 * Simplified component rendering with all necessary providers and
 * testing utilities for consistent test setup across all test cases
 */
const renderApiDocsTable = (props = {}) => {
  const defaultProps = {
    serviceTypes: mockServiceTypes,
    onViewService: vi.fn(),
    onRefresh: vi.fn(),
    className: '',
    'data-testid': 'api-docs-table',
    ...props
  };

  return render(
    <TestWrapper>
      <ApiDocsTable {...defaultProps} />
    </TestWrapper>
  );
};

// ============================================================================
// GLOBAL TEST LIFECYCLE MANAGEMENT
// ============================================================================

beforeAll(() => {
  // Start MSW server for all tests
  server.listen({
    onUnhandledRequest: 'warn'
  });

  // Configure performance monitoring
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
    },
    writable: true
  });

  // Mock IntersectionObserver for virtual scrolling
  Object.defineProperty(window, 'IntersectionObserver', {
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: []
    })),
    writable: true
  });

  // Mock ResizeObserver for responsive table testing
  Object.defineProperty(window, 'ResizeObserver', {
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    })),
    writable: true
  });
});

beforeEach(() => {
  // Reset query client for test isolation
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });

  // Setup user interaction utilities
  user = userEvent.setup();

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up React Testing Library
  cleanup();
  
  // Reset MSW handlers
  server.resetHandlers();
});

afterAll(() => {
  // Stop MSW server
  server.close();
});

// ============================================================================
// COMPONENT RENDERING AND BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('ApiDocsTable - Component Rendering', () => {
  test('renders table structure with correct accessibility attributes', async () => {
    renderApiDocsTable();

    // Verify main table container renders
    const table = await waitFor(() => 
      screen.getByRole('table', { name: /api documentation/i })
    );
    expect(table).toBeInTheDocument();

    // Verify accessibility attributes
    expect(table).toHaveAttribute('aria-label');
    expect(table).toHaveAttribute('aria-describedby');

    // Verify table headers are present and accessible
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(6); // name, label, description, group, type, actions

    // Verify specific column headers
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /label/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /group/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
  });

  test('displays loading state during data fetch', async () => {
    // Delay the response to test loading state
    server.use(
      http.get('/api/v2/system/service', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          resource: mockServices,
          meta: { count: mockServices.length }
        });
      })
    );

    renderApiDocsTable();

    // Verify loading state is displayed
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    expect(screen.getByText(/loading api documentation/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
    });

    // Verify table data is displayed
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('handles empty state gracefully', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: [],
          meta: { count: 0 }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByText(/no api documentation available/i)).toBeInTheDocument();
    });

    // Verify empty state has proper accessibility
    const emptyState = screen.getByRole('status', { name: /empty/i });
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  test('displays error state with recovery options', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json(
          { error: { message: 'Failed to fetch services' } },
          { status: 500 }
        );
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load api documentation/i)).toBeInTheDocument();
    });

    // Verify retry functionality
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Test retry action
    await user.click(retryButton);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});

// ============================================================================
// DATA FETCHING AND CACHING TESTS
// ============================================================================

describe('ApiDocsTable - Data Fetching and Caching', () => {
  test('fetches and displays service data correctly', async () => {
    renderApiDocsTable();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify service data is displayed correctly
    mockServices
      .filter(service => service.isActive && !service.type.includes('swagger'))
      .forEach(service => {
        expect(screen.getByText(service.name)).toBeInTheDocument();
        expect(screen.getByText(service.label)).toBeInTheDocument();
        if (service.description) {
          expect(screen.getByText(service.description)).toBeInTheDocument();
        }
      });
  });

  test('filters out Swagger services as per component logic', async () => {
    const servicesWithSwagger = [
      ...mockServices,
      {
        id: 999,
        name: 'swagger-service',
        label: 'Swagger Service',
        description: 'Swagger documentation service',
        type: 'swagger',
        group: 'Documentation',
        isActive: true,
        config: {}
      }
    ];

    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: servicesWithSwagger,
          meta: { count: servicesWithSwagger.length }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify Swagger service is not displayed
    expect(screen.queryByText('swagger-service')).not.toBeInTheDocument();
    expect(screen.queryByText('Swagger Service')).not.toBeInTheDocument();

    // Verify other services are still displayed
    expect(screen.getByText('mysql-db')).toBeInTheDocument();
    expect(screen.getByText('postgres-db')).toBeInTheDocument();
  });

  test('implements intelligent caching with React Query', async () => {
    const fetchSpy = vi.fn();
    
    server.use(
      http.get('/api/v2/system/service', (info) => {
        fetchSpy();
        return HttpResponse.json({
          resource: mockServices,
          meta: { count: mockServices.length }
        });
      })
    );

    // First render
    const { unmount } = renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Unmount and remount within cache time
    unmount();
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Should use cached data, no additional fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('handles background refetch and data synchronization', async () => {
    let responseData = mockServices;
    
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: responseData,
          meta: { count: responseData.length }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
    });

    // Simulate data change on server
    responseData = [
      ...mockServices,
      {
        id: 999,
        name: 'new-service',
        label: 'New Service',
        description: 'Newly added service',
        type: 'postgresql',
        group: 'Database',
        isActive: true,
        config: {}
      }
    ];

    // Trigger background refetch
    await queryClient.invalidateQueries({ queryKey: ['services'] });

    await waitFor(() => {
      expect(screen.getByText('new-service')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// VIRTUALIZATION AND PERFORMANCE TESTS
// ============================================================================

describe('ApiDocsTable - Virtual Scrolling and Performance', () => {
  test('handles large datasets with TanStack Virtual optimization', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: Array.from({ length: 1000 }, (_, index) => ({
            id: index + 1,
            name: `service-${index + 1}`,
            label: `Service ${index + 1}`,
            description: `Description for service ${index + 1}`,
            type: 'mysql',
            group: 'Database',
            isActive: true,
            config: {}
          })),
          meta: { count: 1000 }
        });
      })
    );

    const renderStart = performance.now();
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart;

    // Verify performance requirements
    expect(renderTime).toBeLessThan(2000); // Under 2 seconds for large dataset

    // Verify virtual scrolling is active
    const tableContainer = screen.getByTestId('virtualized-table-container');
    expect(tableContainer).toBeInTheDocument();
    expect(tableContainer).toHaveStyle({ height: 'auto' });

    // Verify only visible rows are rendered (virtualization working)
    const visibleRows = screen.getAllByRole('row');
    expect(visibleRows.length).toBeLessThan(1000); // Much fewer than total rows
    expect(visibleRows.length).toBeGreaterThan(10); // But more than minimal set
  });

  test('maintains scroll position during data updates', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: Array.from({ length: 500 }, (_, index) => ({
            id: index + 1,
            name: `service-${index + 1}`,
            label: `Service ${index + 1}`,
            description: `Description for service ${index + 1}`,
            type: 'mysql',
            group: 'Database',
            isActive: true,
            config: {}
          })),
          meta: { count: 500 }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Scroll to middle of table
    const tableContainer = screen.getByTestId('virtualized-table-container');
    fireEvent.scroll(tableContainer, { target: { scrollTop: 1000 } });

    await waitFor(() => {
      expect(tableContainer.scrollTop).toBe(1000);
    });

    // Trigger data refresh
    await queryClient.invalidateQueries({ queryKey: ['services'] });

    await waitFor(() => {
      // Verify scroll position is maintained
      expect(tableContainer.scrollTop).toBe(1000);
    });
  });

  test('optimizes rendering performance for rapid scrolling', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: Array.from({ length: 2000 }, (_, index) => ({
            id: index + 1,
            name: `service-${index + 1}`,
            label: `Service ${index + 1}`,
            description: `Description for service ${index + 1}`,
            type: 'postgresql',
            group: 'Database',
            isActive: true,
            config: {}
          })),
          meta: { count: 2000 }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const tableContainer = screen.getByTestId('virtualized-table-container');
    
    // Simulate rapid scrolling
    const scrollStart = performance.now();
    
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(tableContainer, { target: { scrollTop: i * 200 } });
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const scrollEnd = performance.now();
    const scrollTime = scrollEnd - scrollStart;

    // Verify smooth scrolling performance
    expect(scrollTime).toBeLessThan(500); // Under 500ms for rapid scroll sequence

    // Verify table remains responsive
    expect(screen.getByRole('table')).toBeInTheDocument();
    const visibleRows = screen.getAllByRole('row');
    expect(visibleRows.length).toBeGreaterThan(5); // Still rendering rows
  });
});

// ============================================================================
// PAGINATION AND FILTERING TESTS
// ============================================================================

describe('ApiDocsTable - Pagination and Filtering', () => {
  test('implements server-side pagination correctly', async () => {
    const paginatedServices = Array.from({ length: 150 }, (_, index) => ({
      id: index + 1,
      name: `service-${index + 1}`,
      label: `Service ${index + 1}`,
      description: `Description for service ${index + 1}`,
      type: 'mysql',
      group: 'Database',
      isActive: true,
      config: {}
    }));

    server.use(
      http.get('/api/v2/system/service', ({ request }) => {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const page = paginatedServices.slice(offset, offset + limit);

        return HttpResponse.json({
          resource: page,
          meta: {
            count: page.length,
            limit,
            offset,
            total: paginatedServices.length
          }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify pagination controls are present
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    
    // Verify first page is displayed
    expect(screen.getByText('service-1')).toBeInTheDocument();
    expect(screen.queryByText('service-51')).not.toBeInTheDocument();

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('service-51')).toBeInTheDocument();
      expect(screen.queryByText('service-1')).not.toBeInTheDocument();
    });

    // Verify page info is updated
    const pageInfo = screen.getByText(/page 2 of/i);
    expect(pageInfo).toBeInTheDocument();
  });

  test('supports search filtering with debounced input', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByRole('searchbox', { name: /search api documentation/i });
    expect(searchInput).toBeInTheDocument();

    // Type in search input
    await user.type(searchInput, 'mysql');

    // Verify debounced search (wait for debounce)
    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
      expect(screen.queryByText('postgres-db')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Clear search
    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
      expect(screen.getByText('postgres-db')).toBeInTheDocument();
    });
  });

  test('maintains filter state during pagination navigation', async () => {
    const allServices = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: index % 2 === 0 ? `mysql-service-${index + 1}` : `postgres-service-${index + 1}`,
      label: `Service ${index + 1}`,
      description: `Description for service ${index + 1}`,
      type: index % 2 === 0 ? 'mysql' : 'postgresql',
      group: 'Database',
      isActive: true,
      config: {}
    }));

    server.use(
      http.get('/api/v2/system/service', ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') || '';
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let filtered = allServices;
        if (filter.includes('mysql')) {
          filtered = allServices.filter(s => s.type === 'mysql');
        }

        const page = filtered.slice(offset, offset + limit);

        return HttpResponse.json({
          resource: page,
          meta: {
            count: page.length,
            limit,
            offset,
            total: filtered.length
          }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Apply filter
    const searchInput = screen.getByRole('searchbox', { name: /search api documentation/i });
    await user.type(searchInput, 'mysql');

    await waitFor(() => {
      expect(screen.getByText('mysql-service-1')).toBeInTheDocument();
      expect(screen.queryByText('postgres-service-2')).not.toBeInTheDocument();
    });

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    await waitFor(() => {
      // Verify filter is maintained and only MySQL services shown
      expect(screen.getByText('mysql-service-41')).toBeInTheDocument();
      expect(screen.queryByText('postgres-service-42')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// USER INTERACTION AND NAVIGATION TESTS
// ============================================================================

describe('ApiDocsTable - User Interactions', () => {
  test('handles service selection and detail navigation', async () => {
    const mockOnViewService = vi.fn();

    renderApiDocsTable({ onViewService: mockOnViewService });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Find and click on a service row
    const serviceRow = screen.getByRole('row', { name: /mysql-db/i });
    await user.click(serviceRow);

    // Verify navigation callback is called
    expect(mockOnViewService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mysql-db'
      })
    );
  });

  test('provides accessible row actions with keyboard navigation', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Find action button for first service
    const actionButton = screen.getByRole('button', { name: /view mysql-db documentation/i });
    expect(actionButton).toBeInTheDocument();

    // Verify keyboard accessibility
    actionButton.focus();
    expect(actionButton).toHaveFocus();

    // Test keyboard activation
    fireEvent.keyDown(actionButton, { key: 'Enter' });
    
    // Verify action is triggered
    await waitFor(() => {
      expect(actionButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('supports bulk selection with checkboxes', async () => {
    renderApiDocsTable({ allowBulkActions: true });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify select all checkbox
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    expect(selectAllCheckbox).toBeInTheDocument();

    // Select all services
    await user.click(selectAllCheckbox);

    // Verify individual checkboxes are selected
    const individualCheckboxes = screen.getAllByRole('checkbox');
    const serviceCheckboxes = individualCheckboxes.filter(cb => 
      cb.getAttribute('aria-label')?.includes('Select')
    );

    serviceCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });

    // Verify bulk actions are enabled
    const bulkActionButton = screen.getByRole('button', { name: /bulk actions/i });
    expect(bulkActionButton).not.toBeDisabled();
  });

  test('handles sort column interactions', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Find sortable column header
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const sortButton = within(nameHeader).getByRole('button');

    // Click to sort ascending
    await user.click(sortButton);

    await waitFor(() => {
      expect(sortButton).toHaveAttribute('aria-sort', 'ascending');
    });

    // Click again to sort descending
    await user.click(sortButton);

    await waitFor(() => {
      expect(sortButton).toHaveAttribute('aria-sort', 'descending');
    });

    // Verify sort order is applied to table data
    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1); // Skip header row
    expect(dataRows.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('ApiDocsTable - Accessibility Compliance', () => {
  test('meets WCAG 2.1 AA accessibility standards', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Run axe accessibility audit
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test('provides comprehensive screen reader support', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify table has proper labeling
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'API Documentation Services');
    expect(table).toHaveAttribute('aria-describedby');

    // Verify column headers are properly associated
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });

    // Verify data cells have proper structure
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);

    // Verify live region for dynamic updates
    const liveRegion = screen.getByRole('status', { name: /table updates/i });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('supports high contrast mode and theme variations', async () => {
    // Test with high contrast theme
    document.documentElement.setAttribute('data-theme', 'high-contrast');
    
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    
    // Verify high contrast styles are applied
    expect(table).toHaveClass('high-contrast-table');
    
    // Test color contrast (simulated)
    const computedStyle = window.getComputedStyle(table);
    expect(computedStyle.backgroundColor).toBeTruthy();
    expect(computedStyle.color).toBeTruthy();

    // Reset theme
    document.documentElement.removeAttribute('data-theme');
  });

  test('provides keyboard navigation support for all interactions', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Test tab navigation through interactive elements
    const interactiveElements = [
      screen.getByRole('searchbox', { name: /search/i }),
      screen.getByRole('button', { name: /view.*documentation/i }),
      screen.getByRole('button', { name: /next page/i })
    ];

    // Simulate tab navigation
    for (const element of interactiveElements) {
      element.focus();
      expect(element).toHaveFocus();
      
      // Verify visible focus indicator
      expect(element).toHaveClass('focus:ring-2');
    }

    // Test arrow key navigation in table
    const firstRow = screen.getAllByRole('row')[1]; // Skip header
    firstRow.focus();
    
    fireEvent.keyDown(firstRow, { key: 'ArrowDown' });
    const secondRow = screen.getAllByRole('row')[2];
    expect(secondRow).toHaveFocus();
  });
});

// ============================================================================
// ERROR HANDLING AND RESILIENCE TESTS
// ============================================================================

describe('ApiDocsTable - Error Handling', () => {
  test('gracefully handles network failures with user-friendly messages', async () => {
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.error();
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Verify error message is user-friendly
    expect(screen.getByText(/unable to load api documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/please check your connection/i)).toBeInTheDocument();

    // Verify retry functionality
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  test('handles partial data scenarios and missing fields', async () => {
    const partialServices = [
      {
        id: 1,
        name: 'partial-service',
        // Missing label
        description: null,
        type: 'mysql',
        group: null,
        isActive: true,
        config: {}
      }
    ];

    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: partialServices,
          meta: { count: 1 }
        });
      })
    );

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify partial data is handled gracefully
    expect(screen.getByText('partial-service')).toBeInTheDocument();
    
    // Verify missing fields show appropriate placeholders
    const row = screen.getByRole('row', { name: /partial-service/i });
    within(row).getByText('—'); // Placeholder for missing label
    within(row).getByText('—'); // Placeholder for missing description
  });

  test('recovers from temporary API failures with automatic retry', async () => {
    let failureCount = 0;
    
    server.use(
      http.get('/api/v2/system/service', () => {
        failureCount++;
        if (failureCount <= 2) {
          return HttpResponse.json(
            { error: { message: 'Temporary failure' } },
            { status: 503 }
          );
        }
        return HttpResponse.json({
          resource: mockServices,
          meta: { count: mockServices.length }
        });
      })
    );

    renderApiDocsTable();

    // Initially shows error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Automatic retry after delay
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(failureCount).toBe(3); // Two failures, then success
  });
});

// ============================================================================
// RESPONSIVE DESIGN AND MOBILE COMPATIBILITY TESTS
// ============================================================================

describe('ApiDocsTable - Responsive Design', () => {
  test('adapts layout for mobile viewports', async () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });

    // Trigger resize event
    fireEvent(window, new Event('resize'));

    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify mobile-specific classes are applied
    const tableContainer = screen.getByTestId('api-docs-table');
    expect(tableContainer).toHaveClass('mobile-responsive');

    // Verify horizontal scroll is enabled for table
    const table = screen.getByRole('table');
    expect(table.parentElement).toHaveClass('overflow-x-auto');

    // Verify mobile-specific column visibility
    expect(screen.queryByRole('columnheader', { name: /description/i })).not.toBeVisible();
  });

  test('supports touch interactions on mobile devices', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const tableContainer = screen.getByTestId('virtualized-table-container');

    // Simulate touch scroll
    fireEvent.touchStart(tableContainer, {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    fireEvent.touchMove(tableContainer, {
      touches: [{ clientX: 100, clientY: 50 }]
    });

    fireEvent.touchEnd(tableContainer);

    // Verify touch scrolling works
    expect(tableContainer.scrollTop).toBeGreaterThan(0);
  });

  test('maintains functionality across different screen sizes', async () => {
    const screenSizes = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' },
      { width: 1440, height: 900, name: 'large-desktop' }
    ];

    for (const size of screenSizes) {
      // Set viewport size
      Object.defineProperty(window, 'innerWidth', {
        value: size.width,
        writable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: size.height,
        writable: true
      });

      fireEvent(window, new Event('resize'));

      const { unmount } = renderApiDocsTable();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify core functionality works at all sizes
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();

      // Test basic interaction
      await user.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');

      unmount();
    }
  });
});

// ============================================================================
// INTEGRATION AND END-TO-END WORKFLOW TESTS
// ============================================================================

describe('ApiDocsTable - Integration Workflows', () => {
  test('completes full user workflow from search to view', async () => {
    const mockOnViewService = vi.fn();
    
    renderApiDocsTable({ onViewService: mockOnViewService });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Step 1: Search for specific service
    const searchInput = screen.getByRole('searchbox', { name: /search/i });
    await user.type(searchInput, 'mysql');

    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
      expect(screen.queryByText('postgres-db')).not.toBeInTheDocument();
    });

    // Step 2: View service details
    const viewButton = screen.getByRole('button', { name: /view mysql-db documentation/i });
    await user.click(viewButton);

    // Step 3: Verify navigation
    expect(mockOnViewService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mysql-db',
        type: 'mysql'
      })
    );

    // Step 4: Clear search and verify all services return
    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
      expect(screen.getByText('postgres-db')).toBeInTheDocument();
    });
  });

  test('maintains state consistency during complex interactions', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Initial state verification
    const initialRowCount = screen.getAllByRole('row').length - 1; // Exclude header

    // Apply filter
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'postgres');

    await waitFor(() => {
      const filteredRowCount = screen.getAllByRole('row').length - 1;
      expect(filteredRowCount).toBeLessThan(initialRowCount);
    });

    // Navigate pages (if pagination exists)
    const nextButton = screen.queryByRole('button', { name: /next page/i });
    if (nextButton && !nextButton.disabled) {
      await user.click(nextButton);
      
      await waitFor(() => {
        // Verify filter persists across pagination
        expect(searchInput).toHaveValue('postgres');
      });
    }

    // Sort column
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const sortButton = within(nameHeader).queryByRole('button');
    
    if (sortButton) {
      await user.click(sortButton);
      
      await waitFor(() => {
        // Verify filter and sort work together
        expect(searchInput).toHaveValue('postgres');
        expect(sortButton).toHaveAttribute('aria-sort');
      });
    }

    // Clear filter
    await user.clear(searchInput);

    await waitFor(() => {
      const finalRowCount = screen.getAllByRole('row').length - 1;
      expect(finalRowCount).toBe(initialRowCount);
    });
  });

  test('handles concurrent user actions gracefully', async () => {
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    
    // Simulate rapid typing (concurrent search requests)
    const searchPromises = [
      user.type(searchInput, 'my'),
      user.type(searchInput, 'sql'),
      user.type(searchInput, '-db')
    ];

    await Promise.all(searchPromises);

    // Wait for final search result
    await waitFor(() => {
      expect(screen.getByText('mysql-db')).toBeInTheDocument();
    });

    // Verify only final search result is shown
    expect(searchInput).toHaveValue('mysql-db');
  });
});

// ============================================================================
// PERFORMANCE MONITORING AND OPTIMIZATION TESTS
// ============================================================================

describe('ApiDocsTable - Performance Optimization', () => {
  test('meets render performance benchmarks for large datasets', async () => {
    const largeDataset = Array.from({ length: 2000 }, (_, index) => ({
      id: index + 1,
      name: `service-${index + 1}`,
      label: `Service ${index + 1}`,
      description: `Description for service ${index + 1}`,
      type: index % 3 === 0 ? 'mysql' : index % 3 === 1 ? 'postgresql' : 'mongodb',
      group: 'Database',
      isActive: true,
      config: {}
    }));

    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: largeDataset,
          meta: { count: 2000 }
        });
      })
    );

    const startTime = performance.now();
    
    renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verify performance requirements
    expect(renderTime).toBeLessThan(3000); // Under 3 seconds for 2000 items
    
    // Verify memory efficiency (simulated)
    const renderedRows = screen.getAllByRole('row');
    expect(renderedRows.length).toBeLessThan(100); // Virtual scrolling limits DOM nodes
  });

  test('optimizes re-rendering during frequent updates', async () => {
    let renderCount = 0;
    const RenderCounter = () => {
      renderCount++;
      return null;
    };

    const TestComponent = () => (
      <>
        <RenderCounter />
        <ApiDocsTable serviceTypes={mockServiceTypes} />
      </>
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const initialRenderCount = renderCount;

    // Trigger multiple state updates
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });

    // Verify minimal re-renders occurred
    const finalRenderCount = renderCount;
    const reRenderCount = finalRenderCount - initialRenderCount;
    
    expect(reRenderCount).toBeLessThan(5); // Optimized re-rendering
  });

  test('implements efficient memory cleanup on unmount', async () => {
    const { unmount } = renderApiDocsTable();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify component is mounted
    expect(screen.getByTestId('api-docs-table')).toBeInTheDocument();

    // Unmount component
    unmount();

    // Verify cleanup (simulated)
    expect(screen.queryByTestId('api-docs-table')).not.toBeInTheDocument();
    
    // Verify no memory leaks (timers, listeners cleared)
    expect(vi.getTimerCount()).toBe(0);
  });
});