/**
 * Vitest Unit Test Suite for React Database Table Schemas Component
 * 
 * This test suite replaces Angular TestBed-based testing with modern React testing patterns
 * using Vitest, React Testing Library, and Mock Service Worker (MSW) for API mocking.
 * 
 * Key Features:
 * - 10x faster test execution with Vitest 2.1.0
 * - Realistic API mocking with MSW for schema discovery endpoints
 * - Component rendering and user interaction testing with React Testing Library
 * - Database schema API testing for /{dbName}/_schema endpoints
 * - Performance validation for sub-5-second response times
 * - Accessibility compliance testing (WCAG 2.1 AA)
 * 
 * Coverage Target: 90%+ code coverage
 * Performance Target: <30 seconds for complete test suite execution
 * 
 * @version 1.0.0
 * @framework React 19/Next.js 15.1/Vitest 2.1.0
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { server } from '../../../test/mocks/server';
import { createTestQueryClient, renderWithProviders } from '../../../test/utils/test-utils';
import { TablesTable } from './tables-table';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// Mock Data Factories for Database Schema Testing
// ============================================================================

interface DatabaseTableMetadata {
  name: string;
  label: string;
  description?: string;
  access?: string[];
  fieldCount?: number;
  primaryKey?: string[];
  indexes?: string[];
}

interface SchemaApiResponse {
  resource: DatabaseTableMetadata[];
  meta: {
    count: number;
    schema: string[];
  };
}

/**
 * Factory function for creating realistic database table metadata
 * Replaces Angular service mocks with standardized test data creation
 */
const createMockTableMetadata = (count: number = 5): DatabaseTableMetadata[] => {
  return Array.from({ length: count }, (_, index) => ({
    name: `table_${index + 1}`,
    label: `Table ${index + 1}`,
    description: `Test table ${index + 1} description`,
    access: ['GET', 'POST', 'PUT', 'DELETE'],
    fieldCount: Math.floor(Math.random() * 20) + 5,
    primaryKey: [`id`],
    indexes: [`idx_table_${index + 1}_created`, `idx_table_${index + 1}_updated`],
  }));
};

/**
 * Factory for large dataset testing (1000+ tables for virtual scrolling validation)
 */
const createLargeTableDataset = (count: number = 1500): DatabaseTableMetadata[] => {
  return Array.from({ length: count }, (_, index) => ({
    name: `large_table_${String(index + 1).padStart(4, '0')}`,
    label: `Large Table ${index + 1}`,
    description: `Large dataset test table ${index + 1}`,
    access: ['GET', 'POST'],
    fieldCount: Math.floor(Math.random() * 50) + 10,
    primaryKey: [`id`],
    indexes: [`idx_large_${index + 1}`],
  }));
};

/**
 * Error response factory for testing error scenarios
 */
const createErrorResponse = (statusCode: number, message: string) => ({
  error: {
    code: statusCode,
    message: message,
    details: `Schema discovery failed for database`,
  },
});

// ============================================================================
// MSW Handlers for Schema Discovery API Endpoints
// ============================================================================

/**
 * MSW handlers for database schema endpoints (/{dbName}/_schema)
 * Replaces HttpClientTestingModule with realistic API mocking
 */
const schemaApiHandlers = [
  // Get database schema list - success scenario
  rest.get('/api/v2/:dbName/_schema', (req, res, ctx) => {
    const { dbName } = req.params;
    const limit = req.url.searchParams.get('limit') || '25';
    const offset = req.url.searchParams.get('offset') || '0';
    const filter = req.url.searchParams.get('filter') || '';
    const refresh = req.url.searchParams.get('refresh') === 'true';

    // Simulate database connection validation
    if (dbName === 'invalid_db') {
      return res(
        ctx.status(400),
        ctx.json(createErrorResponse(400, 'Invalid database connection'))
      );
    }

    // Simulate connection timeout
    if (dbName === 'timeout_db') {
      return res(
        ctx.status(408),
        ctx.json(createErrorResponse(408, 'Database connection timeout'))
      );
    }

    // Simulate large dataset for performance testing
    if (dbName === 'large_db') {
      const largeTables = createLargeTableDataset(1500);
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      const paginatedTables = largeTables.slice(offsetNum, offsetNum + limitNum);

      return res(
        ctx.json({
          resource: paginatedTables,
          meta: {
            count: largeTables.length,
            schema: ['name', 'label', 'description'],
          },
        })
      );
    }

    // Standard success response with filtering
    let tables = createMockTableMetadata(10);
    if (filter) {
      tables = tables.filter(table => 
        table.name.toLowerCase().includes(filter.toLowerCase()) ||
        table.label.toLowerCase().includes(filter.toLowerCase())
      );
    }

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    const paginatedTables = tables.slice(offsetNum, offsetNum + limitNum);

    return res(
      ctx.json({
        resource: paginatedTables,
        meta: {
          count: tables.length,
          schema: ['name', 'label', 'description'],
        },
      } as SchemaApiResponse)
    );
  }),

  // Get specific table details
  rest.get('/api/v2/:dbName/_schema/:tableName', (req, res, ctx) => {
    const { dbName, tableName } = req.params;

    if (dbName === 'invalid_db') {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse(404, 'Table not found'))
      );
    }

    return res(
      ctx.json({
        resource: {
          name: tableName,
          label: `${tableName} Label`,
          description: `Details for ${tableName}`,
          fields: [
            { name: 'id', type: 'integer', primary_key: true },
            { name: 'name', type: 'string', required: true },
            { name: 'created_at', type: 'timestamp' },
          ],
        },
      })
    );
  }),

  // Delete table endpoint
  rest.delete('/api/v2/:dbName/_schema/:tableName', (req, res, ctx) => {
    const { dbName, tableName } = req.params;

    if (dbName === 'readonly_db') {
      return res(
        ctx.status(403),
        ctx.json(createErrorResponse(403, 'Database is read-only'))
      );
    }

    return res(
      ctx.json({
        success: true,
        message: `Table ${tableName} deleted successfully`,
      })
    );
  }),
];

// ============================================================================
// Test Component Props and Mock Setup
// ============================================================================

interface TablesTableProps {
  databaseName: string;
  onTableSelect?: (tableName: string) => void;
  onTableDelete?: (tableName: string) => void;
  enableActions?: boolean;
  pageSize?: number;
}

const defaultProps: TablesTableProps = {
  databaseName: 'test_db',
  enableActions: true,
  pageSize: 25,
};

// Mock Next.js router for navigation testing
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/adf-schema/database/test_db',
  useParams: () => ({ name: 'test_db' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock authentication context for RBAC testing
const mockAuthContext = {
  user: {
    id: '1',
    email: 'test@dreamfactory.com',
    name: 'Test User',
    role: 'admin',
  },
  session: {
    token: 'mock-jwt-token',
    expiresAt: new Date(Date.now() + 3600000),
  },
  isAuthenticated: true,
  permissions: ['schema:read', 'schema:write', 'schema:delete'],
};

// ============================================================================
// Test Suite: TablesTable Component
// ============================================================================

describe('TablesTable Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeAll(() => {
    // Add MSW handlers for schema API endpoints
    server.use(...schemaApiHandlers);
  });

  beforeEach(() => {
    user = userEvent.setup();
    queryClient = createTestQueryClient();
    
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset MSW handlers to default state
    server.resetHandlers();
  });

  afterEach(() => {
    // Clear React Query cache between tests
    queryClient.clear();
  });

  // ============================================================================
  // Basic Component Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render tables table component successfully', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      // Verify loading state appears first
      expect(screen.getByTestId('tables-loading')).toBeInTheDocument();

      // Wait for data to load and table to render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table headers are present
      expect(screen.getByText('Table Name')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display table rows with correct data', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table data is displayed
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
      
      // Verify action buttons are present
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      
      expect(viewButtons).toHaveLength(5); // Based on mock data count
      expect(deleteButtons).toHaveLength(5);
    });

    it('should render with proper accessibility attributes', async () => {
      const { container } = renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test accessibility compliance
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Verify ARIA labels and roles
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Database tables');
      
      // Verify column headers have proper scope
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  // ============================================================================
  // Data Fetching and Caching Tests (React Query/SWR Integration)
  // ============================================================================

  describe('Data Fetching with React Query', () => {
    it('should fetch and cache schema data efficiently', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify performance target: initial render under 2 seconds
      expect(renderTime).toBeLessThan(2000);

      // Verify data is cached in React Query
      const cacheData = queryClient.getQueryData(['schema', 'test_db']);
      expect(cacheData).toBeDefined();
    });

    it('should handle pagination for large datasets efficiently', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} databaseName="large_db" pageSize={50} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify pagination controls
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();

      // Verify only first page of data is loaded (50 items)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(51); // 50 data rows + 1 header row
    });

    it('should implement stale-while-revalidate caching behavior', async () => {
      const { rerender } = renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Rerender with same props should use cached data
      const startTime = performance.now();
      rerender(<TablesTable {...defaultProps} />);
      
      // Should render immediately from cache
      expect(screen.getByRole('table')).toBeInTheDocument();
      const cacheHitTime = performance.now() - startTime;
      
      // Verify cache hit performance: under 50ms
      expect(cacheHitTime).toBeLessThan(50);
    });
  });

  // ============================================================================
  // User Interaction Tests
  // ============================================================================

  describe('User Interactions', () => {
    it('should handle table view action correctly', async () => {
      const onTableSelect = vi.fn();
      
      renderWithProviders(
        <TablesTable {...defaultProps} onTableSelect={onTableSelect} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click the first view button
      const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
      await user.click(viewButton);

      // Verify callback was called with correct table name
      expect(onTableSelect).toHaveBeenCalledWith('table_1');
    });

    it('should handle table deletion with confirmation', async () => {
      const onTableDelete = vi.fn();
      
      renderWithProviders(
        <TablesTable {...defaultProps} onTableDelete={onTableDelete} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify deletion callback and API call
      expect(onTableDelete).toHaveBeenCalledWith('table_1');
    });

    it('should support keyboard navigation for accessibility', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test tab navigation through action buttons
      const firstViewButton = screen.getAllByRole('button', { name: /view/i })[0];
      firstViewButton.focus();
      expect(document.activeElement).toBe(firstViewButton);

      // Tab to delete button
      await user.tab();
      const firstDeleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      expect(document.activeElement).toBe(firstDeleteButton);

      // Enter key should trigger button action
      await user.keyboard('{Enter}');
      
      // Verify delete confirmation dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle sorting by table name', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click on table name column header to sort
      const nameHeader = screen.getByRole('columnheader', { name: /table name/i });
      await user.click(nameHeader);

      // Verify sorting indicator appears
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click again to reverse sort
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should display error message for invalid database connection', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} databaseName="invalid_db" />,
        { queryClient, authContext: mockAuthContext }
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/invalid database connection/i)).toBeInTheDocument();
    });

    it('should handle connection timeout gracefully', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} databaseName="timeout_db" />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument();
      
      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle network errors with appropriate messaging', async () => {
      // Simulate network error
      server.use(
        rest.get('/api/v2/:dbName/_schema', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should handle permission errors for read-only access', async () => {
      const readOnlyAuthContext = {
        ...mockAuthContext,
        permissions: ['schema:read'], // No write/delete permissions
      };

      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: readOnlyAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify delete buttons are disabled for read-only users
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance Validation', () => {
    it('should render large datasets efficiently with virtual scrolling', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <TablesTable {...defaultProps} databaseName="large_db" pageSize={100} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // Verify performance target for large datasets
      expect(renderTime).toBeLessThan(3000); // 3 seconds max for 1500 tables
    });

    it('should meet sub-5-second API generation workflow target', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      // Wait for component to fully load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Simulate selecting a table and navigating to API generation
      const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
      await user.click(viewButton);

      const totalTime = performance.now() - startTime;
      
      // Verify end-to-end workflow performance
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should validate cache performance for repeated queries', async () => {
      // First render - cache miss
      const { unmount } = renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      unmount();

      // Second render - cache hit
      const startTime = performance.now();
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const cacheHitTime = performance.now() - startTime;
      
      // Verify cache hit performance target
      expect(cacheHitTime).toBeLessThan(50); // 50ms max for cache hits
    });
  });

  // ============================================================================
  // Integration Tests with MSW
  // ============================================================================

  describe('MSW Integration Tests', () => {
    it('should mock schema discovery API endpoints accurately', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify mock data structure matches expected API response
      const tableRows = screen.getAllByRole('row');
      expect(tableRows).toHaveLength(6); // 5 data rows + 1 header

      // Verify mock field data is rendered correctly
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
    });

    it('should simulate realistic API latency for development testing', async () => {
      // Add artificial delay to MSW handler
      server.use(
        rest.get('/api/v2/:dbName/_schema', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
          
          return res(
            ctx.json({
              resource: createMockTableMetadata(5),
              meta: { count: 5, schema: ['name', 'label'] },
            })
          );
        })
      );

      const startTime = performance.now();
      
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const responseTime = performance.now() - startTime;
      
      // Verify realistic latency simulation
      expect(responseTime).toBeGreaterThan(200);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should test API parameter handling correctly', async () => {
      let capturedRequest: any = null;

      server.use(
        rest.get('/api/v2/:dbName/_schema', (req, res, ctx) => {
          capturedRequest = {
            params: req.params,
            searchParams: Object.fromEntries(req.url.searchParams.entries()),
          };

          return res(
            ctx.json({
              resource: createMockTableMetadata(2),
              meta: { count: 2, schema: ['name', 'label'] },
            })
          );
        })
      );

      renderWithProviders(
        <TablesTable {...defaultProps} pageSize={10} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      // Verify correct API parameters were sent
      expect(capturedRequest.params.dbName).toBe('test_db');
      expect(capturedRequest.searchParams.limit).toBe('10');
      expect(capturedRequest.searchParams.offset).toBe('0');
    });
  });

  // ============================================================================
  // React Query Cache Management Tests
  // ============================================================================

  describe('React Query Cache Management', () => {
    it('should invalidate cache on table deletion', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial cache state
      const initialCacheData = queryClient.getQueryData(['schema', 'test_db']);
      expect(initialCacheData).toBeDefined();

      // Delete a table
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify cache invalidation triggered refetch
      await waitFor(() => {
        const updatedCacheData = queryClient.getQueryData(['schema', 'test_db']);
        expect(updatedCacheData).not.toBe(initialCacheData);
      });
    });

    it('should handle background refresh for stale data', async () => {
      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Mark query as stale to trigger background refresh
      queryClient.invalidateQueries(['schema', 'test_db']);

      // Verify component still shows cached data while refreshing
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Table 1')).toBeInTheDocument();

      // Wait for background refresh to complete
      await waitFor(() => {
        const refreshedData = queryClient.getQueryData(['schema', 'test_db']);
        expect(refreshedData).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Responsive Design and Theme Tests
  // ============================================================================

  describe('Responsive Design and Theming', () => {
    it('should adapt layout for mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: mockAuthContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify mobile-responsive classes are applied
      const table = screen.getByRole('table');
      expect(table).toHaveClass('responsive-table');
    });

    it('should support dark theme mode', async () => {
      const darkThemeContext = {
        ...mockAuthContext,
        theme: 'dark',
      };

      renderWithProviders(
        <TablesTable {...defaultProps} />,
        { queryClient, authContext: darkThemeContext }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify dark theme classes are applied
      const tableContainer = screen.getByTestId('tables-container');
      expect(tableContainer).toHaveClass('dark-theme');
    });
  });
});