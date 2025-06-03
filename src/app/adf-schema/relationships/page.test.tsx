/**
 * Comprehensive Vitest Test Suite for Database Relationships Page
 * 
 * This test suite validates the relationships listing page component following
 * the migration from Angular TestBed to React Testing Library with Vitest.
 * Tests include relationship listing, filtering, sorting, navigation, TanStack
 * Virtual table rendering, and MSW API mocking integration.
 * 
 * Key Features Tested:
 * - Relationship listing with pagination and virtualization
 * - Filtering and sorting capabilities with real-time updates
 * - Navigation to relationship creation and editing routes
 * - Relationship type displays (belongs_to, has_many, has_one, many_many)
 * - Junction table indicators for many-to-many relationships
 * - React Query caching and invalidation patterns
 * - Error handling and loading states
 * - Accessibility compliance (WCAG 2.1 AA)
 * 
 * Performance Targets:
 * - Sub-50ms cache hit responses via React Query
 * - Large dataset handling (1000+ relationships) with TanStack Virtual
 * - Real-time filtering and sorting under 100ms response time
 * 
 * Testing Framework: Vitest 2.1.0 (10x faster than Jest/Karma)
 * Component Library: React Testing Library
 * API Mocking: Mock Service Worker (MSW)
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Import the component under test
// Note: This assumes the page component exists as specified in requirements
import RelationshipsPage from './page';

// Import types for relationship management
// Note: Creating comprehensive types based on technical specification requirements
interface DatabaseRelationship {
  id: string;
  name: string;
  type: 'belongs_to' | 'has_many' | 'has_one' | 'many_many';
  table: string;
  field: string;
  ref_table: string;
  ref_field: string;
  ref_on_update?: 'cascade' | 'set_null' | 'restrict' | 'no_action';
  ref_on_delete?: 'cascade' | 'set_null' | 'restrict' | 'no_action';
  junction_table?: string;
  junction_field?: string;
  junction_ref_field?: string;
  alias?: string;
  description?: string;
  is_virtual?: boolean;
  is_active: boolean;
  created_date?: string;
  last_modified_date?: string;
}

interface RelationshipListResponse {
  resource: DatabaseRelationship[];
  count: number;
}

interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  expiresAt: Date;
}

// Mock data factory for database relationships
const createMockRelationship = (overrides: Partial<DatabaseRelationship> = {}): DatabaseRelationship => ({
  id: `rel_${Math.random().toString(36).substr(2, 9)}`,
  name: 'user_profile_relationship',
  type: 'has_one',
  table: 'users',
  field: 'id',
  ref_table: 'user_profiles',
  ref_field: 'user_id',
  ref_on_update: 'cascade',
  ref_on_delete: 'cascade',
  alias: 'profile',
  description: 'User profile relationship',
  is_virtual: false,
  is_active: true,
  created_date: new Date().toISOString(),
  last_modified_date: new Date().toISOString(),
  ...overrides,
});

// Mock large dataset for virtualization testing
const createLargeRelationshipDataset = (count: number): DatabaseRelationship[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockRelationship({
      id: `rel_${index.toString().padStart(4, '0')}`,
      name: `relationship_${index}`,
      type: ['belongs_to', 'has_many', 'has_one', 'many_many'][index % 4] as any,
      table: `table_${Math.floor(index / 10)}`,
      ref_table: `ref_table_${Math.floor(index / 5)}`,
      junction_table: index % 4 === 3 ? `junction_table_${index}` : undefined,
    })
  );
};

// Mock session data for authentication testing
const mockSession: MockSession = {
  user: {
    id: '1',
    email: 'test@dreamfactory.com',
    name: 'Test User',
    role: 'admin',
  },
  token: 'mock-jwt-token-12345',
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
};

// MSW server setup for API mocking
const server = setupServer(
  // Relationship listing endpoint with pagination and filtering support
  rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
    const { serviceId, tableName } = req.params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const filter = url.searchParams.get('filter') || '';
    const sort = url.searchParams.get('sort') || 'name';
    
    // Generate appropriate dataset size for testing
    const baseDataset = createLargeRelationshipDataset(1000);
    
    // Apply filtering if provided
    let filteredDataset = baseDataset;
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredDataset = baseDataset.filter(rel => 
        rel.name.toLowerCase().includes(filterLower) ||
        rel.type.toLowerCase().includes(filterLower) ||
        rel.table.toLowerCase().includes(filterLower) ||
        rel.ref_table.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply sorting
    filteredDataset.sort((a, b) => {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '') as keyof DatabaseRelationship;
      const aVal = a[field]?.toString() || '';
      const bVal = b[field]?.toString() || '';
      return direction * aVal.localeCompare(bVal);
    });
    
    // Apply pagination
    const paginatedData = filteredDataset.slice(offset, offset + limit);
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: paginatedData,
        count: filteredDataset.length,
      } as RelationshipListResponse)
    );
  }),

  // Individual relationship details endpoint
  rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship/:relationshipId', (req, res, ctx) => {
    const { relationshipId } = req.params;
    const relationship = createMockRelationship({
      id: relationshipId as string,
      name: `relationship_${relationshipId}`,
    });
    
    return res(ctx.status(200), ctx.json(relationship));
  }),

  // Authentication endpoint
  rest.get('/api/v2/user/session', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSession));
  }),

  // Service discovery endpoint for database services
  rest.get('/api/v2/system/service', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: [
          { id: 'mysql-db', name: 'MySQL Database', type: 'mysql' },
          { id: 'postgres-db', name: 'PostgreSQL Database', type: 'postgresql' },
          { id: 'mongo-db', name: 'MongoDB Database', type: 'mongodb' },
        ],
      })
    );
  }),

  // Table listing endpoint for schema discovery
  rest.get('/api/v2/system/service/:serviceId/_schema', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: Array.from({ length: 50 }, (_, index) => ({
          name: `table_${index}`,
          label: `Table ${index}`,
          plural: `table_${index}s`,
          primary_key: ['id'],
          name_field: 'name',
        })),
      })
    );
  }),

  // Error handling endpoints for comprehensive testing
  rest.get('/api/v2/system/service/error-service/_schema/error-table/_relationship', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Internal server error during relationship discovery',
          status_code: 500,
        },
      })
    );
  }),

  rest.get('/api/v2/system/service/unauthorized-service/_schema/restricted-table/_relationship', (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.json({
        error: {
          code: 403,
          message: 'Access denied to relationship data',
          status_code: 403,
        },
      })
    );
  }),
);

// Test utilities for component rendering with providers
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/adf-schema/relationships'],
  } = {}
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/adf-schema/relationships',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ serviceId: 'mysql-db', tableName: 'users' }),
}));

// Setup and teardown
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

describe('RelationshipsPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Initial Rendering and Data Loading', () => {
    it('should render the relationships page with loading state initially', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      // Check for loading indicator
      expect(screen.getByTestId('relationships-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading relationships/i)).toBeInTheDocument();
    });

    it('should display relationships table after data loads successfully', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Verify table headers are present
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
      expect(screen.getByText('Reference Table')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display relationship count and pagination controls', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-count')).toBeInTheDocument();
      });

      // Check pagination controls
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByText(/showing \d+ of \d+ relationships/i)).toBeInTheDocument();
    });

    it('should handle error states appropriately', async () => {
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({
            error: {
              code: 500,
              message: 'Failed to load relationships',
              status_code: 500,
            },
          }));
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-error')).toBeInTheDocument();
        expect(screen.getByText(/failed to load relationships/i)).toBeInTheDocument();
      });
    });
  });

  describe('Relationship Type Display and Indicators', () => {
    it('should display correct relationship type badges', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Check for relationship type badges
      const typeBadges = screen.getAllByTestId(/relationship-type-badge/);
      expect(typeBadges.length).toBeGreaterThan(0);
      
      // Verify different relationship types are displayed
      expect(screen.getByText('belongs_to')).toBeInTheDocument();
      expect(screen.getByText('has_many')).toBeInTheDocument();
      expect(screen.getByText('has_one')).toBeInTheDocument();
      expect(screen.getByText('many_many')).toBeInTheDocument();
    });

    it('should show junction table indicators for many-to-many relationships', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Find many-to-many relationships
      const manyToManyRows = screen.getAllByTestId(/relationship-row-.*many_many/);
      expect(manyToManyRows.length).toBeGreaterThan(0);

      // Check for junction table indicators
      manyToManyRows.forEach(row => {
        expect(within(row).getByTestId('junction-table-indicator')).toBeInTheDocument();
      });
    });

    it('should display relationship status indicators', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Check for active/inactive status indicators
      const statusIndicators = screen.getAllByTestId(/relationship-status-/);
      expect(statusIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering and Search Functionality', () => {
    it('should filter relationships by name in real-time', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('relationship-search-input');
      expect(searchInput).toBeInTheDocument();

      // Type in search input
      await user.type(searchInput, 'user_profile');

      // Wait for filtered results
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/relationship-row-/);
        filteredRows.forEach(row => {
          expect(within(row).getByText(/user_profile/i)).toBeInTheDocument();
        });
      });
    });

    it('should filter relationships by type', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const typeFilter = screen.getByTestId('relationship-type-filter');
      await user.selectOptions(typeFilter, 'has_many');

      await waitFor(() => {
        const visibleTypeBadges = screen.getAllByTestId('relationship-type-badge');
        visibleTypeBadges.forEach(badge => {
          expect(badge).toHaveTextContent('has_many');
        });
      });
    });

    it('should clear filters and show all relationships', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Apply filter first
      const searchInput = screen.getByTestId('relationship-search-input');
      await user.type(searchInput, 'specific_filter');

      // Clear filter
      const clearButton = screen.getByTestId('clear-filters-button');
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        // Should show more relationships after clearing filter
        const allRows = screen.getAllByTestId(/relationship-row-/);
        expect(allRows.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort relationships by name ascending and descending', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const nameHeader = screen.getByTestId('sort-header-name');
      
      // Click to sort ascending
      await user.click(nameHeader);
      
      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-name-asc')).toBeInTheDocument();
      });

      // Click again to sort descending
      await user.click(nameHeader);
      
      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-name-desc')).toBeInTheDocument();
      });
    });

    it('should sort relationships by type', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const typeHeader = screen.getByTestId('sort-header-type');
      await user.click(typeHeader);
      
      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-type-asc')).toBeInTheDocument();
      });
    });

    it('should sort relationships by table name', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const tableHeader = screen.getByTestId('sort-header-table');
      await user.click(tableHeader);
      
      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-table-asc')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate to relationship creation page', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-relationship-button');
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/relationships/new');
    });

    it('should navigate to relationship editing page when clicking edit action', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId(/edit-relationship-/);
      expect(editButtons.length).toBeGreaterThan(0);

      const firstEditButton = editButtons[0];
      const relationshipId = firstEditButton.getAttribute('data-relationship-id');
      
      await user.click(firstEditButton);

      expect(mockPush).toHaveBeenCalledWith(`/adf-schema/relationships/${relationshipId}`);
    });

    it('should navigate to table schema page when clicking table name', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const tableLinks = screen.getAllByTestId(/table-link-/);
      expect(tableLinks.length).toBeGreaterThan(0);

      const firstTableLink = tableLinks[0];
      await user.click(firstTableLink);

      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/adf-schema\/tables\/.+/));
    });
  });

  describe('TanStack Virtual Table Rendering', () => {
    it('should handle large datasets with virtualization', async () => {
      // Use large dataset for this test
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          const largeDataset = createLargeRelationshipDataset(1500);
          return res(
            ctx.status(200),
            ctx.json({
              resource: largeDataset,
              count: largeDataset.length,
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-virtual-table')).toBeInTheDocument();
      });

      // Verify virtualization container exists
      expect(screen.getByTestId('virtual-table-container')).toBeInTheDocument();
      
      // Check that not all rows are rendered (virtualization working)
      const renderedRows = screen.getAllByTestId(/relationship-row-/);
      expect(renderedRows.length).toBeLessThan(100); // Should be much less than 1500
      
      // Verify scroll container has appropriate height
      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      expect(scrollContainer).toHaveStyle({ height: expect.stringMatching(/px/) });
    });

    it('should update visible rows when scrolling through large dataset', async () => {
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          const largeDataset = createLargeRelationshipDataset(1000);
          return res(
            ctx.status(200),
            ctx.json({
              resource: largeDataset,
              count: largeDataset.length,
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-virtual-table')).toBeInTheDocument();
      });

      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      
      // Get initial visible row IDs
      const initialRows = screen.getAllByTestId(/relationship-row-/);
      const initialRowIds = initialRows.map(row => row.getAttribute('data-row-id'));

      // Simulate scrolling
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });

      // Wait for virtual scrolling to update
      await waitFor(() => {
        const newRows = screen.getAllByTestId(/relationship-row-/);
        const newRowIds = newRows.map(row => row.getAttribute('data-row-id'));
        
        // Some row IDs should have changed due to virtualization
        expect(newRowIds).not.toEqual(initialRowIds);
      });
    });
  });

  describe('React Query Caching and Invalidation', () => {
    it('should cache relationship data for subsequent renders', async () => {
      const queryClient = createTestQueryClient();
      
      renderWithProviders(<RelationshipsPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Check that data is cached
      const cachedData = queryClient.getQueryData(['relationships', 'mysql-db', 'users']);
      expect(cachedData).toBeDefined();
    });

    it('should invalidate cache when relationships are modified', async () => {
      const queryClient = createTestQueryClient();
      
      renderWithProviders(<RelationshipsPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Simulate cache invalidation
      queryClient.invalidateQueries(['relationships']);
      
      // Should trigger refetch
      await waitFor(() => {
        expect(screen.getByTestId('relationships-loading')).toBeInTheDocument();
      });
    });

    it('should handle stale data revalidation', async () => {
      const queryClient = createTestQueryClient();
      
      renderWithProviders(<RelationshipsPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Set stale time to trigger revalidation
      queryClient.setQueryDefaults(['relationships'], { staleTime: 0 });
      
      // Should indicate stale data being refreshed
      await waitFor(() => {
        expect(screen.getByTestId('data-refreshing-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('network-error-message')).toBeInTheDocument();
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should handle unauthorized access appropriately', async () => {
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              error: {
                code: 403,
                message: 'Access denied to relationship data',
                status_code: 403,
              },
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-denied-error')).toBeInTheDocument();
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    it('should handle empty relationship list', async () => {
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              resource: [],
              count: 0,
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-relationships-state')).toBeInTheDocument();
        expect(screen.getByText(/no relationships found/i)).toBeInTheDocument();
      });

      // Should show create relationship option
      expect(screen.getByTestId('create-first-relationship-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility and WCAG 2.1 AA Compliance', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Check table accessibility attributes
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('Relationships'));

      // Check header accessibility
      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('aria-sort');
      });

      // Check row accessibility
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const firstRowButton = screen.getAllByRole('button')[0];
      firstRowButton.focus();
      
      // Test Tab navigation
      await user.keyboard('{Tab}');
      expect(document.activeElement).not.toBe(firstRowButton);
      
      // Test Enter key activation
      const createButton = screen.getByTestId('create-relationship-button');
      createButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockPush).toHaveBeenCalled();
    });

    it('should provide screen reader accessible descriptions', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Check for descriptive text elements
      expect(screen.getByText(/database relationships/i)).toBeInTheDocument();
      
      // Check for status announcements
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
    });

    it('should maintain focus management for modal interactions', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      // Test delete confirmation modal focus
      const deleteButtons = screen.getAllByTestId(/delete-relationship-/);
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        // Focus should move to modal
        await waitFor(() => {
          const modal = screen.getByRole('dialog');
          expect(modal).toBeInTheDocument();
          expect(modal).toHaveFocus();
        });
      }
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading indicators during data fetch', async () => {
      // Add delay to simulate network latency
      server.use(
        rest.get('/api/v2/system/service/:serviceId/_schema/:tableName/_relationship', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          const dataset = createLargeRelationshipDataset(25);
          return res(
            ctx.status(200),
            ctx.json({
              resource: dataset,
              count: dataset.length,
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />);
      
      // Should show loading state immediately
      expect(screen.getByTestId('relationships-loading')).toBeInTheDocument();
      
      // Should hide loading state after data loads
      await waitFor(() => {
        expect(screen.queryByTestId('relationships-loading')).not.toBeInTheDocument();
      });
    });

    it('should show skeleton placeholders during initial load', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      // Check for skeleton loading placeholders
      expect(screen.getByTestId('relationships-skeleton')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('relationships-skeleton')).not.toBeInTheDocument();
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });
    });

    it('should meet performance targets for filtering operations', async () => {
      renderWithProviders(<RelationshipsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('relationship-search-input');
      
      // Measure filtering performance
      const startTime = performance.now();
      await user.type(searchInput, 'test_filter');
      
      await waitFor(() => {
        const endTime = performance.now();
        const filterTime = endTime - startTime;
        
        // Should complete filtering in under 100ms per spec
        expect(filterTime).toBeLessThan(100);
      });
    });
  });
});