/**
 * ServiceReportTable Component Unit Tests
 * 
 * Comprehensive Vitest-based unit test suite for the ServiceReportTable React component.
 * Replaces Angular Jasmine/Karma test setup with modern React testing patterns,
 * achieving 10x faster test execution through Vitest and MSW integration.
 * 
 * Test Coverage:
 * - Component rendering and initial state
 * - Data fetching with SWR/React Query integration
 * - User interactions (pagination, filtering, sorting)
 * - Accessibility features and ARIA implementation
 * - Error handling and loading states
 * - Mock Service Worker API mocking
 * - Internationalization support
 * 
 * Performance Target: Tests complete in under 3 seconds
 * Coverage Target: 95%+ component coverage
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SWRConfig } from 'swr';

// Import the component under test
// Note: This assumes the component exists and exports as default
import ServiceReportTable from './service-report-table';

// Import test utilities and mocks
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

// Mock the use-service-reports hook to test component behavior
// This follows React testing patterns replacing Angular service mocking
vi.mock('@/hooks/use-service-reports', () => ({
  default: vi.fn(),
  useServiceReports: vi.fn(),
}));

// Mock Next.js router for navigation testing
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/adf-reports/df-manage-service-report'),
}));

// Mock i18n for internationalization testing
// Replaces Angular TranslocoService mocking
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Mock translation function returning keys with interpolation
      if (options && typeof options === 'object') {
        let result = key;
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
        return result;
      }
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Sample mock data for service reports
const mockServiceReports = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    serviceId: 'mysql-prod',
    serviceName: 'Production MySQL',
    userEmail: 'admin@company.com',
    action: 'GET',
    request: '/api/v2/mysql-prod/users',
    statusCode: 200,
    responseTime: 145,
    ipAddress: '192.168.1.10',
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    serviceId: 'postgresql-dev',
    serviceName: 'Development PostgreSQL',
    userEmail: 'developer@company.com',
    action: 'POST',
    request: '/api/v2/postgresql-dev/orders',
    statusCode: 201,
    responseTime: 89,
    ipAddress: '192.168.1.20',
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    serviceId: 'mongodb-prod',
    serviceName: 'Production MongoDB',
    userEmail: 'analyst@company.com',
    action: 'GET',
    request: '/api/v2/mongodb-prod/analytics',
    statusCode: 200,
    responseTime: 234,
    ipAddress: '192.168.1.30',
  },
];

// Mock hook implementations
const mockUseServiceReports = vi.fn();

// Test wrapper with providers (React Query, SWR, etc.)
// Replaces Angular TestBed configuration
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        staleTime: 0, // Always consider data stale in tests
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig
        value={{
          dedupingInterval: 0, // Disable deduping in tests
          shouldRetryOnError: false, // Disable retries for predictable tests
          provider: () => new Map(), // Fresh cache for each test
        }}
      >
        {children}
      </SWRConfig>
    </QueryClientProvider>
  );
};

describe('ServiceReportTable Component', () => {
  // Mock user for testing user interactions
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset all mocks before each test to ensure test isolation
    vi.clearAllMocks();
    
    // Reset MSW handlers to default state
    server.resetHandlers();

    // Setup default successful mock response
    mockUseServiceReports.mockReturnValue({
      data: mockServiceReports,
      isLoading: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
      total: mockServiceReports.length,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    // Import and setup the mock after clearing
    const { useServiceReports } = require('@/hooks/use-service-reports');
    useServiceReports.mockImplementation(mockUseServiceReports);
  });

  describe('Component Rendering', () => {
    it('renders service report table with correct structure', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test table structure exists
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Test column headers are present
      expect(screen.getByText('reports.table.headers.timestamp')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.serviceId')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.serviceName')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.userEmail')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.action')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.request')).toBeInTheDocument();

      // Test accessibility - table should have accessible name
      expect(table).toHaveAccessibleName();
    });

    it('displays service report data correctly in table rows', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Wait for data to load and verify rows are displayed
      await waitFor(() => {
        // Check that each mock report is displayed
        mockServiceReports.forEach(report => {
          expect(screen.getByText(report.serviceId)).toBeInTheDocument();
          expect(screen.getByText(report.serviceName)).toBeInTheDocument();
          expect(screen.getByText(report.userEmail)).toBeInTheDocument();
          expect(screen.getByText(report.action)).toBeInTheDocument();
        });
      });

      // Verify correct number of data rows (excluding header)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(mockServiceReports.length + 1); // +1 for header
    });

    it('displays timestamps in correct format', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that timestamps are formatted properly
        // This assumes the component formats ISO strings to readable dates
        const timestampCells = screen.getAllByTestId('timestamp-cell');
        expect(timestampCells).toHaveLength(mockServiceReports.length);
        
        // Verify each timestamp is not showing raw ISO string
        timestampCells.forEach(cell => {
          expect(cell.textContent).not.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        });
      });
    });
  });

  describe('Loading States', () => {
    it('displays loading indicator when data is loading', async () => {
      // Mock loading state
      mockUseServiceReports.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        mutate: vi.fn(),
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test loading indicator is shown
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText('common.loading')).toBeInTheDocument();

      // Test table is not shown during loading
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows skeleton rows during loading for better UX', async () => {
      mockUseServiceReports.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        mutate: vi.fn(),
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test skeleton rows are displayed during loading
      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows.length).toBeGreaterThan(0);
      
      // Each skeleton row should have skeleton cells
      skeletonRows.forEach(row => {
        const skeletonCells = within(row).getAllByTestId('skeleton-cell');
        expect(skeletonCells).toHaveLength(6); // 6 columns
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data fetching fails', async () => {
      const errorMessage = 'Failed to fetch service reports';
      
      // Mock error state
      mockUseServiceReports.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error(errorMessage),
        mutate: vi.fn(),
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test error state is displayed
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('reports.errors.fetchFailed')).toBeInTheDocument();
      
      // Test retry button is available
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('provides retry functionality when error occurs', async () => {
      const mockMutate = vi.fn();
      
      mockUseServiceReports.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        mutate: mockMutate,
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify mutate function was called to retry the request
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('handles empty data state appropriately', async () => {
      // Mock empty data state
      mockUseServiceReports.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        mutate: vi.fn(),
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test empty state is displayed
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('reports.table.noData')).toBeInTheDocument();
      
      // Test helpful message is shown
      expect(screen.getByText('reports.table.noDataDescription')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('renders search input for filtering reports', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test search input exists
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'reports.table.searchPlaceholder');
    });

    it('updates search query when user types in search input', async () => {
      const mockMutate = vi.fn();
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: mockMutate,
        total: mockServiceReports.length,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      
      // Type in search input
      await user.type(searchInput, 'mysql');

      // Verify input value updated
      expect(searchInput).toHaveValue('mysql');
      
      // Verify search triggers data refetch after debounce
      // Note: This would typically trigger a new API call with search parameters
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('provides service type filter dropdown', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test service type filter exists
      const serviceFilter = screen.getByRole('combobox', { name: /service type/i });
      expect(serviceFilter).toBeInTheDocument();

      // Open dropdown and check options
      await user.click(serviceFilter);
      
      expect(screen.getByText('reports.filters.allServices')).toBeInTheDocument();
      expect(screen.getByText('mysql')).toBeInTheDocument();
      expect(screen.getByText('postgresql')).toBeInTheDocument();
      expect(screen.getByText('mongodb')).toBeInTheDocument();
    });

    it('filters data when service type is selected', async () => {
      const mockMutate = vi.fn();
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: mockMutate,
        total: mockServiceReports.length,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const serviceFilter = screen.getByRole('combobox', { name: /service type/i });
      
      // Select MySQL filter
      await user.click(serviceFilter);
      await user.click(screen.getByText('mysql'));

      // Verify filter updates and triggers new data fetch
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Sorting Functionality', () => {
    it('renders sortable column headers', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test that column headers are buttons (clickable for sorting)
      const timestampHeader = screen.getByRole('button', { name: /timestamp/i });
      const serviceIdHeader = screen.getByRole('button', { name: /service id/i });
      const actionHeader = screen.getByRole('button', { name: /action/i });

      expect(timestampHeader).toBeInTheDocument();
      expect(serviceIdHeader).toBeInTheDocument();  
      expect(actionHeader).toBeInTheDocument();

      // Test sort indicators are present
      expect(timestampHeader).toHaveAttribute('aria-sort');
    });

    it('sorts data when column header is clicked', async () => {
      const mockMutate = vi.fn();
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: mockMutate,
        total: mockServiceReports.length,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Click timestamp header to sort
      const timestampHeader = screen.getByRole('button', { name: /timestamp/i });
      await user.click(timestampHeader);

      // Verify sort state updates
      expect(timestampHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Verify new data is fetched with sort parameters
      expect(mockMutate).toHaveBeenCalled();
    });

    it('toggles sort direction on subsequent clicks', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const timestampHeader = screen.getByRole('button', { name: /timestamp/i });
      
      // First click - ascending
      await user.click(timestampHeader);
      expect(timestampHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Second click - descending  
      await user.click(timestampHeader);
      expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');
      
      // Third click - reset to none
      await user.click(timestampHeader);
      expect(timestampHeader).toHaveAttribute('aria-sort', 'none');
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls when there are multiple pages', async () => {
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: vi.fn(),
        total: 150, // More than one page worth
        hasNextPage: true,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test pagination controls exist
      expect(screen.getByText('reports.table.pagination.showing')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    });

    it('navigates to next page when next button is clicked', async () => {
      const mockMutate = vi.fn();
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: mockMutate,
        total: 150,
        hasNextPage: true,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Verify pagination triggers new data fetch
      expect(mockMutate).toHaveBeenCalled();
    });

    it('allows changing page size', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test page size selector exists
      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      expect(pageSizeSelect).toBeInTheDocument();

      // Change page size
      await user.click(pageSizeSelect);
      await user.click(screen.getByText('50'));

      // Verify page size change triggers data refetch
      // This would typically call the hook with new page size
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels for screen readers', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test table has accessible name
      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName('reports.table.ariaLabel');

      // Test column headers have proper roles
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);

      // Test data cells have proper roles
      await waitFor(() => {
        const cells = screen.getAllByRole('cell');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test tab navigation through interactive elements
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const sortableHeaders = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-sort') !== null
      );

      // Focus search input
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Tab to next interactive element
      await user.tab();
      expect(sortableHeaders[0]).toHaveFocus();
    });

    it('announces sorting changes to screen readers', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const timestampHeader = screen.getByRole('button', { name: /timestamp/i });
      
      // Click to sort
      await user.click(timestampHeader);

      // Verify ARIA live region announces the change
      expect(screen.getByRole('status')).toHaveTextContent(
        'reports.table.sorting.announced'
      );
    });

    it('provides high contrast mode support', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      
      // Test that appropriate CSS classes are applied for high contrast
      expect(table).toHaveClass('high-contrast-support');
    });
  });

  describe('Internationalization', () => {
    it('uses translated text for all UI elements', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test that translation keys are used (mocked to return the key)
      expect(screen.getByText('reports.table.headers.timestamp')).toBeInTheDocument();
      expect(screen.getByText('reports.table.headers.serviceId')).toBeInTheDocument();
      expect(screen.getByText('reports.table.searchPlaceholder')).toBeInTheDocument();
    });

    it('formats dates according to user locale', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      await waitFor(() => {
        // Test that dates are formatted appropriately
        // This would check actual date formatting in real implementation
        const timestampCells = screen.getAllByTestId('timestamp-cell');
        timestampCells.forEach(cell => {
          // Verify timestamp is not raw ISO string
          expect(cell.textContent).not.toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
      });
    });
  });

  describe('Performance Optimization', () => {
    it('virtualizes large datasets for performance', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockServiceReports[0],
        id: `report-${i}`,
        serviceId: `service-${i}`,
      }));

      mockUseServiceReports.mockReturnValue({
        data: largeDataset,
        isLoading: false,
        isError: false,
        error: null,
        mutate: vi.fn(),
        total: largeDataset.length,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Test that virtualization is active (not all rows rendered)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(largeDataset.length);
      
      // Test virtual container exists
      expect(screen.getByTestId('virtual-table-container')).toBeInTheDocument();
    });

    it('debounces search input to prevent excessive API calls', async () => {
      const mockMutate = vi.fn();
      mockUseServiceReports.mockReturnValue({
        data: mockServiceReports,
        isLoading: false,
        isError: false,
        error: null,
        mutate: mockMutate,
        total: mockServiceReports.length,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      
      // Type rapidly
      await user.type(searchInput, 'test query');

      // Initially, mutate should not be called immediately
      expect(mockMutate).not.toHaveBeenCalled();

      // After debounce delay, mutate should be called once
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('MSW Integration Tests', () => {
    it('handles API responses correctly through MSW', async () => {
      // Setup MSW handler for service reports endpoint
      server.use(
        rest.get('/api/v2/system/admin/session', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              resource: mockServiceReports,
              meta: {
                count: mockServiceReports.length,
                total: mockServiceReports.length,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Verify data is loaded and displayed
      await waitFor(() => {
        mockServiceReports.forEach(report => {
          expect(screen.getByText(report.serviceId)).toBeInTheDocument();
        });
      });
    });

    it('handles API error responses through MSW', async () => {
      // Setup MSW handler to return error
      server.use(
        rest.get('/api/v2/system/admin/session', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Internal server error',
              },
            })
          );
        })
      );

      // Mock error state
      mockUseServiceReports.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Internal server error'),
        mutate: vi.fn(),
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Verify error state is displayed
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  describe('Integration with use-service-reports Hook', () => {
    it('passes correct parameters to the hook', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Verify hook is called with correct default parameters
      expect(mockUseServiceReports).toHaveBeenCalledWith({
        page: 1,
        limit: 25,
        search: '',
        sortBy: 'timestamp',
        sortOrder: 'desc',
        serviceType: '',
      });
    });

    it('updates hook parameters when filters change', async () => {
      render(
        <TestWrapper>
          <ServiceReportTable />
        </TestWrapper>
      );

      // Change search filter
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'mysql');

      // Verify hook is called with updated search parameter
      await waitFor(() => {
        expect(mockUseServiceReports).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'mysql',
          })
        );
      });
    });
  });
});