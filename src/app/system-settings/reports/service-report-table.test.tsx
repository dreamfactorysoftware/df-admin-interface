/**
 * Vitest Test Suite: Service Report Table Component
 * 
 * Comprehensive test coverage for the service report table component with Mock Service Worker
 * integration for realistic API mocking. Replaces Angular TestBed with React Testing Library
 * and provides 10x faster test execution per React/Next.js Integration Requirements.
 * 
 * Features Tested:
 * - Component rendering with various data states
 * - Data fetching with React Query/SWR integration
 * - Filtering, pagination, and sorting functionality
 * - Error handling and loading states
 * - Accessibility compliance (WCAG 2.1 AA)
 * - User interactions and form submissions
 * - MSW mock API integration for realistic testing
 * 
 * Performance Targets:
 * - Test execution: < 30 seconds for complete suite
 * - Coverage: 90%+ code coverage
 * - Cache hit responses: < 50ms simulation
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { server } from '../../../test/mocks/server';
import '@testing-library/jest-dom';

// Component and dependencies imports
import ServiceReportTable from './service-report-table';
import { useServiceReports } from '../../../hooks/use-service-reports';
import type { ServiceReport, ServiceReportFilters } from '../../../types/service-report';

// Test utilities and providers
import { createTestQueryClient, renderWithProviders } from '../../../test/utils/test-utils';
import { mockServiceReports, createMockServiceReport } from '../../../test/mocks/mock-data';
import { createErrorResponse } from '../../../test/mocks/error-responses';

// Mock data and test factories
const mockReportsData: ServiceReport[] = [
  createMockServiceReport({
    id: '1',
    serviceName: 'mysql-production',
    serviceType: 'mysql',
    requestCount: 1250,
    errorCount: 5,
    avgResponseTime: 145,
    lastActivity: '2024-01-15T10:30:00Z',
    status: 'active',
    uptime: 99.8,
  }),
  createMockServiceReport({
    id: '2',
    serviceName: 'postgresql-analytics',
    serviceType: 'postgresql',
    requestCount: 850,
    errorCount: 2,
    avgResponseTime: 89,
    lastActivity: '2024-01-15T10:25:00Z',
    status: 'active',
    uptime: 99.9,
  }),
  createMockServiceReport({
    id: '3',
    serviceName: 'mongodb-logs',
    serviceType: 'mongodb',
    requestCount: 450,
    errorCount: 12,
    avgResponseTime: 234,
    lastActivity: '2024-01-15T10:20:00Z',
    status: 'warning',
    uptime: 98.5,
  }),
  createMockServiceReport({
    id: '4',
    serviceName: 'redis-cache',
    serviceType: 'redis',
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    lastActivity: '2024-01-14T15:45:00Z',
    status: 'inactive',
    uptime: 0,
  }),
];

// Mock the custom hook for isolated component testing
vi.mock('../../../hooks/use-service-reports', () => ({
  useServiceReports: vi.fn(),
}));

// MSW handlers for service reports API
const serviceReportsHandlers = [
  // GET /api/v2/system/reports/services - Success response
  rest.get('/api/v2/system/reports/services', (req, res, ctx) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');

    let filteredData = [...mockReportsData];

    // Apply filtering
    if (filter) {
      const filterObj = JSON.parse(filter);
      if (filterObj.serviceName) {
        filteredData = filteredData.filter(report =>
          report.serviceName.toLowerCase().includes(filterObj.serviceName.toLowerCase())
        );
      }
      if (filterObj.serviceType) {
        filteredData = filteredData.filter(report =>
          report.serviceType === filterObj.serviceType
        );
      }
      if (filterObj.status) {
        filteredData = filteredData.filter(report =>
          report.status === filterObj.status
        );
      }
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(' ');
      filteredData.sort((a, b) => {
        const aVal = a[field as keyof ServiceReport];
        const bVal = b[field as keyof ServiceReport];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);

    return res(
      ctx.status(200),
      ctx.json({
        resource: paginatedData,
        meta: {
          count: paginatedData.length,
          total: filteredData.length,
          offset,
          limit,
        },
      })
    );
  }),

  // GET /api/v2/system/reports/services/:id - Individual report
  rest.get('/api/v2/system/reports/services/:id', (req, res, ctx) => {
    const { id } = req.params;
    const report = mockReportsData.find(r => r.id === id);

    if (!report) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse(404, 'Service report not found', {
          resource: 'service_reports',
          id,
        }))
      );
    }

    return res(ctx.status(200), ctx.json(report));
  }),

  // POST /api/v2/system/reports/services/refresh - Refresh reports
  rest.post('/api/v2/system/reports/services/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Service reports refreshed successfully',
        refreshedAt: new Date().toISOString(),
      })
    );
  }),

  // Error scenarios for testing
  rest.get('/api/v2/system/reports/services/error-500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json(createErrorResponse(500, 'Internal server error during report generation'))
    );
  }),

  rest.get('/api/v2/system/reports/services/timeout', (req, res, ctx) => {
    return res(
      ctx.delay('infinite') // Simulate network timeout
    );
  }),
];

describe('ServiceReportTable Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();
    
    // Add MSW handlers for this test suite
    server.use(...serviceReportsHandlers);

    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock console.error to prevent test pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up query client cache
    queryClient.clear();
    
    // Restore console.error
    vi.restoreAllMocks();
  });

  /**
   * Component Rendering Tests
   * Tests basic component rendering, structure, and accessibility
   */
  describe('Component Rendering', () => {
    it('should render service report table with loading state', async () => {
      // Mock loading state
      (useServiceReports as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Check for loading indicators
      expect(screen.getByLabelText(/loading service reports/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Accessibility: Loading state should be announced
      expect(screen.getByText(/loading service reports/i)).toBeVisible();
    });

    it('should render service report table with data successfully', async () => {
      // Mock successful data state
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Check table structure and headers
      const table = screen.getByRole('table', { name: /service reports/i });
      expect(table).toBeInTheDocument();

      // Verify all expected column headers
      expect(screen.getByRole('columnheader', { name: /service name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /service type/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /requests/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /errors/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /avg response time/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /uptime/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /last activity/i })).toBeInTheDocument();

      // Verify data rows are rendered
      mockReportsData.forEach(report => {
        expect(screen.getByText(report.serviceName)).toBeInTheDocument();
        expect(screen.getByText(report.serviceType.toUpperCase())).toBeInTheDocument();
      });

      // Check for pagination info
      expect(screen.getByText(/showing 1 to 4 of 4 results/i)).toBeInTheDocument();
    });

    it('should render empty state when no data is available', async () => {
      // Mock empty data state
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: [],
          meta: {
            count: 0,
            total: 0,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Check for empty state message
      expect(screen.getByText(/no service reports found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your filters or refresh the data/i)).toBeInTheDocument();

      // Check for refresh action
      expect(screen.getByRole('button', { name: /refresh reports/i })).toBeInTheDocument();
    });

    it('should meet accessibility requirements', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const table = screen.getByRole('table');
      
      // WCAG 2.1 AA Compliance checks
      expect(table).toHaveAttribute('aria-label', 'Service Reports');
      
      // Table should have proper table headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
      
      // Status indicators should have appropriate ARIA labels
      const statusElements = screen.getAllByLabelText(/service status/i);
      expect(statusElements.length).toBeGreaterThan(0);
      
      // Sortable columns should be keyboard navigable
      const sortableHeaders = screen.getAllByRole('button', { name: /sort by/i });
      sortableHeaders.forEach(header => {
        expect(header).toHaveAttribute('tabindex', '0');
      });
    });
  });

  /**
   * Data Fetching and Query Integration Tests
   * Tests React Query/SWR integration, caching, and synchronization
   */
  describe('Data Fetching and Query Integration', () => {
    it('should fetch service reports data on component mount', async () => {
      const mockRefetch = vi.fn();
      
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Verify the hook was called with default parameters
      expect(useServiceReports).toHaveBeenCalledWith({
        limit: 25,
        offset: 0,
        filters: {},
        sort: 'serviceName asc',
      });
    });

    it('should handle successful data refetch', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
      });

      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh reports/i });
      await user.click(refreshButton);

      // Verify refetch was called
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle cache invalidation and background updates', async () => {
      let hookReturn = {
        data: {
          resource: mockReportsData.slice(0, 2),
          meta: {
            count: 2,
            total: 2,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };

      (useServiceReports as any).mockReturnValue(hookReturn);

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Initial render with 2 items
      expect(screen.getByText('mysql-production')).toBeInTheDocument();
      expect(screen.getByText('postgresql-analytics')).toBeInTheDocument();

      // Simulate background update with fresh data
      hookReturn = {
        ...hookReturn,
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
      };

      (useServiceReports as any).mockReturnValue(hookReturn);
      rerender(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Verify new data is displayed
      await waitFor(() => {
        expect(screen.getByText('mongodb-logs')).toBeInTheDocument();
        expect(screen.getByText('redis-cache')).toBeInTheDocument();
      });
    });

    it('should implement optimistic updates for refresh operations', async () => {
      const mockRefetch = vi.fn().mockImplementation(() => {
        // Simulate optimistic update
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                resource: mockReportsData,
                meta: {
                  count: mockReportsData.length,
                  total: mockReportsData.length,
                  offset: 0,
                  limit: 25,
                },
              },
            });
          }, 100);
        });
      });

      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh reports/i });
      
      // Start refresh operation
      await user.click(refreshButton);

      // Should show loading state during refresh
      expect(refreshButton).toBeDisabled();
      
      // Wait for refresh to complete
      await waitFor(() => {
        expect(refreshButton).toBeEnabled();
      }, { timeout: 1000 });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  /**
   * Filtering and Search Tests
   * Tests filtering functionality, search inputs, and state management
   */
  describe('Filtering and Search', () => {
    beforeEach(() => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it('should filter by service name', async () => {
      const mockUseServiceReports = useServiceReports as any;
      
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Find and interact with service name filter
      const serviceNameFilter = screen.getByRole('textbox', { name: /filter by service name/i });
      expect(serviceNameFilter).toBeInTheDocument();

      await user.type(serviceNameFilter, 'mysql');

      // Verify filter was applied (debounced)
      await waitFor(() => {
        expect(mockUseServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              serviceName: 'mysql',
            }),
          })
        );
      }, { timeout: 1000 });
    });

    it('should filter by service type', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Find and interact with service type filter
      const serviceTypeFilter = screen.getByRole('combobox', { name: /filter by service type/i });
      expect(serviceTypeFilter).toBeInTheDocument();

      await user.selectOptions(serviceTypeFilter, 'postgresql');

      // Verify filter was applied
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              serviceType: 'postgresql',
            }),
          })
        );
      });
    });

    it('should filter by service status', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Find and interact with status filter
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      expect(statusFilter).toBeInTheDocument();

      await user.selectOptions(statusFilter, 'active');

      // Verify filter was applied
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              status: 'active',
            }),
          })
        );
      });
    });

    it('should clear all filters', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Apply some filters first
      const serviceNameFilter = screen.getByRole('textbox', { name: /filter by service name/i });
      await user.type(serviceNameFilter, 'test');

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusFilter, 'active');

      // Clear filters
      const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearFiltersButton);

      // Verify filters were cleared
      expect(serviceNameFilter).toHaveValue('');
      expect(statusFilter).toHaveValue('');

      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: {},
          })
        );
      });
    });

    it('should handle filter debouncing for performance', async () => {
      const mockUseServiceReports = useServiceReports as any;
      
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const serviceNameFilter = screen.getByRole('textbox', { name: /filter by service name/i });

      // Type rapidly to test debouncing
      await user.type(serviceNameFilter, 'mysql-prod');

      // Should not call immediately
      expect(mockUseServiceReports).not.toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            serviceName: 'mysql-prod',
          }),
        })
      );

      // Should call after debounce delay
      await waitFor(() => {
        expect(mockUseServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              serviceName: 'mysql-prod',
            }),
          })
        );
      }, { timeout: 1000 });
    });
  });

  /**
   * Pagination Tests
   * Tests pagination controls, navigation, and state management
   */
  describe('Pagination', () => {
    it('should display pagination controls when data spans multiple pages', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: 25,
            total: 150,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Check pagination info
      expect(screen.getByText(/showing 1 to 25 of 150 results/i)).toBeInTheDocument();

      // Check pagination controls
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to page 1/i })).toBeInTheDocument();

      // Previous button should be disabled on first page
      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    });

    it('should navigate to next page', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: 25,
            total: 150,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Verify hook called with updated offset
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 25,
            limit: 25,
          })
        );
      });
    });

    it('should navigate to previous page', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: 25,
            total: 150,
            offset: 25,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      // Verify hook called with updated offset
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
            limit: 25,
          })
        );
      });
    });

    it('should change page size', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: 25,
            total: 150,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      await user.selectOptions(pageSizeSelect, '50');

      // Verify hook called with updated limit and reset offset
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
            limit: 50,
          })
        );
      });
    });
  });

  /**
   * Sorting Tests
   * Tests column sorting functionality and state management
   */
  describe('Sorting', () => {
    beforeEach(() => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it('should sort by service name', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const serviceNameHeader = screen.getByRole('button', { name: /sort by service name/i });
      await user.click(serviceNameHeader);

      // Verify sort was applied (default is ascending, click should make it descending)
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'serviceName desc',
          })
        );
      });
    });

    it('should sort by request count', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const requestsHeader = screen.getByRole('button', { name: /sort by requests/i });
      await user.click(requestsHeader);

      // Verify sort was applied
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'requestCount asc',
          })
        );
      });
    });

    it('should toggle sort direction on multiple clicks', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const serviceNameHeader = screen.getByRole('button', { name: /sort by service name/i });
      
      // First click - descending (since default is ascending)
      await user.click(serviceNameHeader);
      
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'serviceName desc',
          })
        );
      });

      // Second click - ascending
      await user.click(serviceNameHeader);
      
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'serviceName asc',
          })
        );
      });
    });

    it('should display sort indicators in headers', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const serviceNameHeader = screen.getByRole('button', { name: /sort by service name/i });
      
      // Should show ascending indicator initially (default sort)
      expect(within(serviceNameHeader).getByLabelText(/sorted ascending/i)).toBeInTheDocument();

      await user.click(serviceNameHeader);

      // Should show descending indicator after click
      await waitFor(() => {
        expect(within(serviceNameHeader).getByLabelText(/sorted descending/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Error Handling Tests
   * Tests error states, retry mechanisms, and user feedback
   */
  describe('Error Handling', () => {
    it('should display error message when data fetching fails', async () => {
      (useServiceReports as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Failed to fetch service reports',
          status: 500,
        },
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Check for error message
      expect(screen.getByText(/failed to fetch service reports/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Check for retry action
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should handle network timeout errors', async () => {
      (useServiceReports as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Network timeout',
          status: 408,
        },
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
      expect(screen.getByText(/please check your connection and try again/i)).toBeInTheDocument();
    });

    it('should handle unauthorized errors', async () => {
      (useServiceReports as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Unauthorized access',
          status: 401,
        },
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      expect(screen.getByText(/unauthorized access/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login again/i })).toBeInTheDocument();
    });

    it('should retry data fetching on error recovery', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
      });

      (useServiceReports as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {
          message: 'Failed to fetch service reports',
          status: 500,
        },
        refetch: mockRefetch,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle partial data errors gracefully', async () => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData.slice(0, 2), // Partial data
          meta: {
            count: 2,
            total: 4,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: {
          message: 'Some data could not be loaded',
          status: 206,
        },
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Should still show available data
      expect(screen.getByText('mysql-production')).toBeInTheDocument();
      expect(screen.getByText('postgresql-analytics')).toBeInTheDocument();

      // Should show warning about partial data
      expect(screen.getByText(/some data could not be loaded/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh to try loading all data/i })).toBeInTheDocument();
    });
  });

  /**
   * User Interactions Tests
   * Tests complex user workflows and interactive scenarios
   */
  describe('User Interactions', () => {
    beforeEach(() => {
      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it('should support keyboard navigation for accessibility', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Test keyboard navigation through sortable headers
      const serviceNameHeader = screen.getByRole('button', { name: /sort by service name/i });
      serviceNameHeader.focus();
      
      expect(serviceNameHeader).toHaveFocus();

      // Press Tab to move to next sortable header
      await user.keyboard('{Tab}');
      const serviceTypeHeader = screen.getByRole('button', { name: /sort by service type/i });
      expect(serviceTypeHeader).toHaveFocus();

      // Press Enter to activate sort
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'serviceType asc',
          })
        );
      });
    });

    it('should handle complex filter combinations', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Apply multiple filters
      const serviceNameFilter = screen.getByRole('textbox', { name: /filter by service name/i });
      await user.type(serviceNameFilter, 'mysql');

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusFilter, 'active');

      // Verify combined filters
      await waitFor(() => {
        expect(useServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: {
              serviceName: 'mysql',
              status: 'active',
            },
          })
        );
      }, { timeout: 1000 });
    });

    it('should export service reports data', async () => {
      // Mock URL.createObjectURL for download testing
      global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
      global.URL.revokeObjectURL = vi.fn();

      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockAppendChild = vi.spyOn(document.body, 'appendChild');
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild');
      const mockClick = vi.fn();

      mockCreateElement.mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      } as any);
      
      mockAppendChild.mockImplementation(() => ({} as any));
      mockRemoveChild.mockImplementation(() => ({} as any));

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const exportButton = screen.getByRole('button', { name: /export reports/i });
      await user.click(exportButton);

      // Verify export functionality
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Clean up mocks
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('should handle service detail view navigation', async () => {
      const mockPush = vi.fn();
      
      // Mock Next.js router
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
        }),
      }));

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Click on a service name to view details
      const serviceLink = screen.getByRole('link', { name: /mysql-production/i });
      await user.click(serviceLink);

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/system-settings/reports/services/1');
    });

    it('should handle bulk operations selection', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Select multiple services using checkboxes
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all services/i });
      await user.click(selectAllCheckbox);

      // Verify all service checkboxes are checked
      const serviceCheckboxes = screen.getAllByRole('checkbox', { name: /select service/i });
      serviceCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      // Verify bulk actions are available
      expect(screen.getByRole('button', { name: /bulk refresh selected/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /bulk export selected/i })).toBeEnabled();
    });
  });

  /**
   * Performance Tests
   * Tests component performance, caching, and optimization
   */
  describe('Performance and Optimization', () => {
    it('should efficiently handle large datasets', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) =>
        createMockServiceReport({
          id: (index + 1).toString(),
          serviceName: `service-${index + 1}`,
          serviceType: 'mysql',
          requestCount: Math.floor(Math.random() * 10000),
          errorCount: Math.floor(Math.random() * 100),
          avgResponseTime: Math.floor(Math.random() * 500),
          lastActivity: new Date().toISOString(),
          status: 'active',
          uptime: 99.9,
        })
      );

      (useServiceReports as any).mockReturnValue({
        data: {
          resource: largeDataset.slice(0, 25), // Only first page
          meta: {
            count: 25,
            total: 1000,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const renderStart = performance.now();
      
      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      // Verify component renders efficiently even with large datasets
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
      
      // Verify only current page data is rendered
      expect(screen.getAllByRole('row')).toHaveLength(26); // 25 data rows + 1 header row
    });

    it('should implement efficient re-rendering with React.memo patterns', async () => {
      const renderSpy = vi.fn();
      
      // Mock component with render tracking
      const OriginalServiceReportTable = ServiceReportTable;
      const TrackedServiceReportTable = React.memo((props: any) => {
        renderSpy();
        return <OriginalServiceReportTable {...props} />;
      });

      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TrackedServiceReportTable />
        </QueryClientProvider>
      );

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not trigger component re-render
      rerender(
        <QueryClientProvider client={queryClient}>
          <TrackedServiceReportTable />
        </QueryClientProvider>
      );

      // Should not re-render if props haven't changed
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle cache invalidation efficiently', async () => {
      const cacheInvalidationStart = performance.now();

      (useServiceReports as any).mockReturnValue({
        data: {
          resource: mockReportsData,
          meta: {
            count: mockReportsData.length,
            total: mockReportsData.length,
            offset: 0,
            limit: 25,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceReportTable />
        </QueryClientProvider>
      );

      // Simulate cache invalidation
      queryClient.invalidateQueries({ queryKey: ['service-reports'] });

      const cacheInvalidationEnd = performance.now();
      const invalidationTime = cacheInvalidationEnd - cacheInvalidationStart;

      // Cache invalidation should be fast
      expect(invalidationTime).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  /**
   * Integration Tests
   * Tests integration with MSW, React Query, and other systems
   */
  describe('MSW Integration Tests', () => {
    it('should work with real MSW handlers for end-to-end testing', async () => {
      // Use actual hook without mocking for integration test
      vi.clearAllMocks();

      // This test uses the real MSW handlers defined at the top
      const { container } = renderWithProviders(
        <ServiceReportTable />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('mysql-production')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify all expected data is rendered
      expect(screen.getByText('postgresql-analytics')).toBeInTheDocument();
      expect(screen.getByText('mongodb-logs')).toBeInTheDocument();
      expect(screen.getByText('redis-cache')).toBeInTheDocument();

      // Test filtering with MSW
      const serviceNameFilter = screen.getByRole('textbox', { name: /filter by service name/i });
      await user.type(serviceNameFilter, 'mysql');

      await waitFor(() => {
        // Should only show mysql services after filtering
        expect(screen.getByText('mysql-production')).toBeInTheDocument();
        expect(screen.queryByText('postgresql-analytics')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle MSW error responses appropriately', async () => {
      // Add error handler to MSW
      server.use(
        rest.get('/api/v2/system/reports/services', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json(createErrorResponse(500, 'Internal server error'))
          );
        })
      );

      vi.clearAllMocks();

      renderWithProviders(
        <ServiceReportTable />
      );

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle MSW timeout scenarios', async () => {
      // Add timeout handler to MSW
      server.use(
        rest.get('/api/v2/system/reports/services', (req, res, ctx) => {
          return res(ctx.delay('infinite'));
        })
      );

      vi.clearAllMocks();

      renderWithProviders(
        <ServiceReportTable />
      );

      // Should show loading state
      expect(screen.getByLabelText(/loading service reports/i)).toBeInTheDocument();

      // After reasonable timeout, should show timeout error
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});

/**
 * Custom React component for isolated testing
 * This would normally be imported but is defined here for demonstration
 */
const React = require('react');

// Type definitions for demonstration (would normally be imported)
interface ServiceReport {
  id: string;
  serviceName: string;
  serviceType: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  uptime: number;
}

interface ServiceReportFilters {
  serviceName?: string;
  serviceType?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Mock implementations for testing
function createMockServiceReport(overrides: Partial<ServiceReport>): ServiceReport {
  return {
    id: '1',
    serviceName: 'test-service',
    serviceType: 'mysql',
    requestCount: 100,
    errorCount: 0,
    avgResponseTime: 150,
    lastActivity: new Date().toISOString(),
    status: 'active',
    uptime: 99.9,
    ...overrides,
  };
}

export default ServiceReportTable;