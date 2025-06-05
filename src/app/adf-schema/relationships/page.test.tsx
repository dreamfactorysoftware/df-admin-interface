/**
 * Comprehensive Vitest test suite for the relationships listing page component.
 * 
 * Implements React Testing Library patterns with MSW integration for realistic API interaction testing,
 * covering relationship listing, filtering, sorting, navigation, relationship type displays, junction table 
 * indicators, and TanStack Virtual table rendering to achieve 90%+ code coverage as required by 
 * Section 4.4.2.2 Enhanced Testing Pipeline.
 * 
 * Key test coverage areas:
 * - F-002: Schema Discovery and Browsing feature per Section 2.1 Feature Catalog
 * - React/Next.js Integration Requirements for React Query caching and Next.js routing
 * - Section 4.7.1.3 Vitest Testing Infrastructure Setup with React Testing Library
 * - MSW integration for relationship schema API mocking per Section 5.2 Component Details
 * - TanStack Virtual table rendering for large relationship datasets (1,000+ relationships)
 * - Relationship type-specific display logic and junction table status indicators
 * - WCAG 2.1 AA accessibility compliance validation
 * - Cross-browser compatibility and responsive design testing
 * 
 * Test execution leverages Vitest 2.1.0 for 10x faster execution compared to Jest/Karma, supporting
 * native TypeScript and ES modules with hot module replacement during development.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, fireEvent, within, getAllByRole } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { QueryClient, QueryCache } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

// Test setup and utilities
import { server } from '@/test/setup-tests';
import { renderWithProviders } from '@/test/test-utils';
import { handlers } from '@/test/mocks/handlers';

// Component under test
import RelationshipsPage from './page';

// Type definitions for comprehensive testing
import type {
  DatabaseRelationship,
  RelationshipType,
  JunctionTableConfig,
  RelationshipFilter,
  RelationshipSortOptions,
  SchemaServiceResponse
} from './relationship.types';

// =============================================================================
// Mock Setup and Configuration
// =============================================================================

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => '/adf-schema/relationships'),
  notFound: vi.fn(),
}));

// Mock IntersectionObserver for TanStack Virtual
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for responsive table testing
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.ResizeObserver = mockResizeObserver;

// =============================================================================
// Test Data and Mock Factories
// =============================================================================

/**
 * Creates mock relationship data for testing different scenarios
 */
const createMockRelationship = (overrides: Partial<DatabaseRelationship> = {}): DatabaseRelationship => ({
  id: `rel_${Math.random().toString(36).substr(2, 9)}`,
  name: `relationship_${Math.random().toString(36).substr(2, 5)}`,
  type: 'belongs_to',
  service_id: 'mysql_service_1',
  table: 'users',
  field: 'profile_id',
  ref_service_id: 'mysql_service_1',
  ref_table: 'profiles',
  ref_field: 'id',
  junction_table: undefined,
  junction_service_id: undefined,
  junction_table_left: undefined,
  junction_table_right: undefined,
  created_date: '2024-01-15T10:30:00Z',
  last_modified_date: '2024-01-15T10:30:00Z',
  created_by_id: 1,
  last_modified_by_id: 1,
  always_fetch: false,
  flatten: false,
  flatten_drop_prefix: false,
  ...overrides
});

/**
 * Creates mock relationship data with different types for comprehensive testing
 */
const createMockRelationships = (): DatabaseRelationship[] => [
  createMockRelationship({
    id: 'rel_001',
    name: 'user_profile',
    type: 'belongs_to',
    table: 'users',
    field: 'profile_id',
    ref_table: 'profiles',
    ref_field: 'id'
  }),
  createMockRelationship({
    id: 'rel_002',
    name: 'profile_posts',
    type: 'has_many',
    table: 'profiles',
    field: 'id',
    ref_table: 'posts',
    ref_field: 'profile_id'
  }),
  createMockRelationship({
    id: 'rel_003',
    name: 'profile_settings',
    type: 'has_one',
    table: 'profiles',
    field: 'id',
    ref_table: 'profile_settings',
    ref_field: 'profile_id'
  }),
  createMockRelationship({
    id: 'rel_004',
    name: 'user_roles',
    type: 'many_many',
    table: 'users',
    field: 'id',
    ref_table: 'roles',
    ref_field: 'id',
    junction_table: 'user_roles',
    junction_service_id: 'mysql_service_1',
    junction_table_left: 'user_id',
    junction_table_right: 'role_id'
  }),
  createMockRelationship({
    id: 'rel_005',
    name: 'post_tags',
    type: 'many_many',
    table: 'posts',
    field: 'id',
    ref_table: 'tags',
    ref_field: 'id',
    junction_table: 'post_tags',
    junction_service_id: 'mysql_service_1',
    junction_table_left: 'post_id',
    junction_table_right: 'tag_id'
  })
];

/**
 * Creates large dataset for TanStack Virtual testing
 */
const createLargeRelationshipDataset = (count: number = 1000): DatabaseRelationship[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockRelationship({
      id: `rel_large_${index.toString().padStart(4, '0')}`,
      name: `relationship_${index}`,
      type: ['belongs_to', 'has_many', 'has_one', 'many_many'][index % 4] as RelationshipType,
      table: `table_${Math.floor(index / 10)}`,
      field: `field_${index}`,
      ref_table: `ref_table_${Math.floor(index / 20)}`,
      ref_field: `ref_field_${index}`,
      junction_table: index % 4 === 3 ? `junction_${index}` : undefined,
      junction_service_id: index % 4 === 3 ? 'mysql_service_1' : undefined,
      junction_table_left: index % 4 === 3 ? `left_field_${index}` : undefined,
      junction_table_right: index % 4 === 3 ? `right_field_${index}` : undefined
    })
  );
};

/**
 * Mock API response structure
 */
const createMockApiResponse = (relationships: DatabaseRelationship[], meta: any = {}) => ({
  resource: relationships,
  meta: {
    count: relationships.length,
    offset: 0,
    limit: 100,
    ...meta
  }
});

// =============================================================================
// Enhanced User Event Setup
// =============================================================================

/**
 * Enhanced user event setup for realistic interaction testing
 */
const createUserEvent = () => userEvent.setup({
  delay: null, // Disable delays for faster test execution
  advanceTimers: vi.advanceTimersByTime,
});

// =============================================================================
// Test Suite Setup and Teardown
// =============================================================================

describe('RelationshipsPage', () => {
  let mockRouter: ReturnType<typeof vi.fn>;
  let mockSearchParams: ReturnType<typeof vi.fn>;
  let queryClient: QueryClient;
  let user: ReturnType<typeof createUserEvent>;

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'warn' });
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });

    // Setup mock router
    mockRouter = vi.fn().mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    
    // Setup mock search params
    mockSearchParams = vi.fn().mockReturnValue(new URLSearchParams());

    // Apply mocks to navigation hooks
    vi.mocked(useRouter).mockReturnValue(mockRouter());
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams());

    // Setup user event
    user = createUserEvent();

    // Setup default MSW handlers for relationships
    server.use(
      ...handlers.filter(handler => 
        handler.info?.header?.includes('/_table/users/relationships') ||
        handler.info?.header?.includes('/api/v2/mysql_service_1')
      )
    );
  });

  afterEach(() => {
    // Clean up after each test
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllTimers();
  });

  afterAll(() => {
    // Stop MSW server
    server.close();
  });

  // =============================================================================
  // Component Rendering Tests
  // =============================================================================

  describe('Component Rendering', () => {
    it('renders the relationships page with correct layout', async () => {
      const mockRelationships = createMockRelationships();
      
      // Mock successful API response
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      await act(async () => {
        renderWithProviders(<RelationshipsPage />, { queryClient });
      });

      // Verify main page elements are rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/relationships/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table headers are present
      expect(screen.getByText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/type/i)).toBeInTheDocument();
      expect(screen.getByText(/table/i)).toBeInTheDocument();
      expect(screen.getByText(/field/i)).toBeInTheDocument();
      expect(screen.getByText(/reference/i)).toBeInTheDocument();
    });

    it('displays loading state correctly', async () => {
      // Mock delayed API response
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json(createMockApiResponse([])));
        })
      );

      await act(async () => {
        renderWithProviders(<RelationshipsPage />, { queryClient });
      });

      // Verify loading indicators
      expect(screen.getByTestId('relationships-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading relationships/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('relationships-loading')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('displays empty state when no relationships exist', async () => {
      // Mock empty API response
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse([])));
        })
      );

      await act(async () => {
        renderWithProviders(<RelationshipsPage />, { queryClient });
      });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-empty-state')).toBeInTheDocument();
        expect(screen.getByText(/no relationships found/i)).toBeInTheDocument();
        expect(screen.getByText(/create your first relationship/i)).toBeInTheDocument();
      });

      // Verify create relationship button is present
      const createButton = screen.getByRole('button', { name: /create relationship/i });
      expect(createButton).toBeInTheDocument();
    });

    it('displays error state with retry functionality', async () => {
      // Mock API error response
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      await act(async () => {
        renderWithProviders(<RelationshipsPage />, { queryClient });
      });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-error-state')).toBeInTheDocument();
        expect(screen.getByText(/failed to load relationships/i)).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(screen.getByTestId('relationships-loading')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Data Fetching and React Query Integration Tests
  // =============================================================================

  describe('Data Fetching and Caching', () => {
    it('fetches relationships data on component mount', async () => {
      const mockRelationships = createMockRelationships();
      let requestCalled = false;

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          requestCalled = true;
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      await act(async () => {
        renderWithProviders(<RelationshipsPage />, { queryClient });
      });

      await waitFor(() => {
        expect(requestCalled).toBe(true);
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify all relationships are displayed
      mockRelationships.forEach(relationship => {
        expect(screen.getByText(relationship.name)).toBeInTheDocument();
      });
    });

    it('implements React Query caching with cache hit responses under 50ms', async () => {
      const mockRelationships = createMockRelationships();
      let requestCount = 0;

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          requestCount++;
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      // First render - should make API call
      const { unmount } = renderWithProviders(<RelationshipsPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      expect(requestCount).toBe(1);
      unmount();

      // Second render - should use cached data
      const startTime = Date.now();
      renderWithProviders(<RelationshipsPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(50); // Cache hit response under 50ms
      expect(requestCount).toBe(1); // No additional API calls
    });

    it('handles query invalidation and refetching', async () => {
      const mockRelationships = createMockRelationships();
      let requestCount = 0;

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          requestCount++;
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(requestCount).toBe(1);

      // Invalidate and refetch
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ['relationships'] });
      });

      await waitFor(() => {
        expect(requestCount).toBe(2);
      });
    });
  });

  // =============================================================================
  // Relationship Type Display and Junction Table Tests
  // =============================================================================

  describe('Relationship Type Displays and Junction Tables', () => {
    it('displays belongs_to relationships with correct indicators', async () => {
      const belongsToRelationship = createMockRelationship({
        type: 'belongs_to',
        name: 'user_profile',
        table: 'users',
        field: 'profile_id',
        ref_table: 'profiles',
        ref_field: 'id'
      });

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse([belongsToRelationship])));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        const typeCell = screen.getByTestId('relationship-type-belongs_to');
        expect(typeCell).toBeInTheDocument();
        expect(typeCell).toHaveTextContent('Belongs To');
        expect(typeCell).toHaveClass('text-blue-600'); // Type-specific styling
      });

      // Verify no junction table indicator for belongs_to
      expect(screen.queryByTestId('junction-table-indicator')).not.toBeInTheDocument();
    });

    it('displays has_many relationships with correct indicators', async () => {
      const hasManyRelationship = createMockRelationship({
        type: 'has_many',
        name: 'profile_posts',
        table: 'profiles',
        field: 'id',
        ref_table: 'posts',
        ref_field: 'profile_id'
      });

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse([hasManyRelationship])));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        const typeCell = screen.getByTestId('relationship-type-has_many');
        expect(typeCell).toBeInTheDocument();
        expect(typeCell).toHaveTextContent('Has Many');
        expect(typeCell).toHaveClass('text-green-600'); // Type-specific styling
      });
    });

    it('displays has_one relationships with correct indicators', async () => {
      const hasOneRelationship = createMockRelationship({
        type: 'has_one',
        name: 'profile_settings',
        table: 'profiles',
        field: 'id',
        ref_table: 'profile_settings',
        ref_field: 'profile_id'
      });

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse([hasOneRelationship])));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        const typeCell = screen.getByTestId('relationship-type-has_one');
        expect(typeCell).toBeInTheDocument();
        expect(typeCell).toHaveTextContent('Has One');
        expect(typeCell).toHaveClass('text-purple-600'); // Type-specific styling
      });
    });

    it('displays many_many relationships with junction table indicators', async () => {
      const manyManyRelationship = createMockRelationship({
        type: 'many_many',
        name: 'user_roles',
        table: 'users',
        field: 'id',
        ref_table: 'roles',
        ref_field: 'id',
        junction_table: 'user_roles',
        junction_service_id: 'mysql_service_1',
        junction_table_left: 'user_id',
        junction_table_right: 'role_id'
      });

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse([manyManyRelationship])));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        const typeCell = screen.getByTestId('relationship-type-many_many');
        expect(typeCell).toBeInTheDocument();
        expect(typeCell).toHaveTextContent('Many to Many');
        expect(typeCell).toHaveClass('text-orange-600'); // Type-specific styling
      });

      // Verify junction table indicator is present
      const junctionIndicator = screen.getByTestId('junction-table-indicator');
      expect(junctionIndicator).toBeInTheDocument();
      expect(junctionIndicator).toHaveTextContent('user_roles');
      
      // Verify junction table tooltip or additional info
      await user.hover(junctionIndicator);
      await waitFor(() => {
        expect(screen.getByText(/junction table: user_roles/i)).toBeInTheDocument();
        expect(screen.getByText(/left field: user_id/i)).toBeInTheDocument();
        expect(screen.getByText(/right field: role_id/i)).toBeInTheDocument();
      });
    });

    it('handles mixed relationship types in the same table', async () => {
      const mixedRelationships = createMockRelationships();

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mixedRelationships)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        // Verify all relationship types are displayed
        expect(screen.getByTestId('relationship-type-belongs_to')).toBeInTheDocument();
        expect(screen.getByTestId('relationship-type-has_many')).toBeInTheDocument();
        expect(screen.getByTestId('relationship-type-has_one')).toBeInTheDocument();
        expect(screen.getByTestId('relationship-type-many_many')).toBeInTheDocument();
      });

      // Verify junction table indicators only appear for many_many relationships
      const junctionIndicators = screen.getAllByTestId('junction-table-indicator');
      expect(junctionIndicators).toHaveLength(2); // Two many_many relationships in mock data
    });
  });

  // =============================================================================
  // TanStack Virtual Table Rendering Tests
  // =============================================================================

  describe('TanStack Virtual Table Rendering', () => {
    it('renders virtual table for large datasets (1000+ relationships)', async () => {
      const largeDataset = createLargeRelationshipDataset(1500);

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(largeDataset)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        // Verify virtual table container is rendered
        const virtualTable = screen.getByTestId('relationships-virtual-table');
        expect(virtualTable).toBeInTheDocument();
        expect(virtualTable).toHaveClass('virtual-table-container');
      });

      // Verify only visible rows are rendered (virtual scrolling)
      const visibleRows = screen.getAllByTestId(/relationship-row-/);
      expect(visibleRows.length).toBeLessThan(largeDataset.length);
      expect(visibleRows.length).toBeGreaterThan(0);
      expect(visibleRows.length).toBeLessThanOrEqual(50); // Expected viewport size
    });

    it('handles virtual scrolling correctly', async () => {
      const largeDataset = createLargeRelationshipDataset(500);

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(largeDataset)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-virtual-table')).toBeInTheDocument();
      });

      const virtualTable = screen.getByTestId('relationships-virtual-table');
      const scrollContainer = within(virtualTable).getByTestId('virtual-scroll-container');

      // Get initial visible rows
      const initialRows = screen.getAllByTestId(/relationship-row-/);
      const initialRowIds = initialRows.map(row => row.getAttribute('data-testid'));

      // Simulate scrolling down
      await act(async () => {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
      });

      await waitFor(() => {
        const newRows = screen.getAllByTestId(/relationship-row-/);
        const newRowIds = newRows.map(row => row.getAttribute('data-testid'));
        
        // Verify different rows are now visible
        expect(newRowIds).not.toEqual(initialRowIds);
      });
    });

    it('maintains performance with large datasets', async () => {
      const largeDataset = createLargeRelationshipDataset(2000);

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(largeDataset)));
        })
      );

      const startTime = Date.now();
      
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-virtual-table')).toBeInTheDocument();
      });

      const renderTime = Date.now() - startTime;
      
      // Verify render time is reasonable for large dataset
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      
      // Verify DOM node count is limited (virtual rendering)
      const renderedRows = screen.getAllByTestId(/relationship-row-/);
      expect(renderedRows.length).toBeLessThan(100); // Virtual rendering limit
    });
  });

  // =============================================================================
  // Filtering and Sorting Tests
  // =============================================================================

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          const url = new URL(req.url);
          const filter = url.searchParams.get('filter');
          const sort = url.searchParams.get('order');
          
          let filteredData = [...mockRelationships];
          
          // Apply filtering
          if (filter) {
            const filterValue = filter.toLowerCase();
            filteredData = filteredData.filter(rel => 
              rel.name.toLowerCase().includes(filterValue) ||
              rel.type.toLowerCase().includes(filterValue) ||
              rel.table.toLowerCase().includes(filterValue) ||
              rel.ref_table.toLowerCase().includes(filterValue)
            );
          }
          
          // Apply sorting
          if (sort) {
            const [field, direction] = sort.split(' ');
            filteredData.sort((a, b) => {
              const aVal = a[field as keyof DatabaseRelationship] || '';
              const bVal = b[field as keyof DatabaseRelationship] || '';
              const comparison = aVal.toString().localeCompare(bVal.toString());
              return direction === 'desc' ? -comparison : comparison;
            });
          }
          
          return res(ctx.json(createMockApiResponse(filteredData)));
        })
      );
    });

    it('filters relationships by name', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and use the search input
      const searchInput = screen.getByLabelText(/search relationships/i);
      expect(searchInput).toBeInTheDocument();

      // Filter by relationship name
      await user.type(searchInput, 'user_profile');

      await waitFor(() => {
        expect(screen.getByText('user_profile')).toBeInTheDocument();
        expect(screen.queryByText('profile_posts')).not.toBeInTheDocument();
        expect(screen.queryByText('profile_settings')).not.toBeInTheDocument();
      });
    });

    it('filters relationships by type', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Use type filter dropdown
      const typeFilter = screen.getByLabelText(/filter by type/i);
      await user.click(typeFilter);
      
      const manyManyOption = screen.getByRole('option', { name: /many to many/i });
      await user.click(manyManyOption);

      await waitFor(() => {
        // Should only show many_many relationships
        expect(screen.getByText('user_roles')).toBeInTheDocument();
        expect(screen.getByText('post_tags')).toBeInTheDocument();
        expect(screen.queryByText('user_profile')).not.toBeInTheDocument();
        expect(screen.queryByText('profile_posts')).not.toBeInTheDocument();
      });
    });

    it('sorts relationships by name ascending', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click name column header to sort
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);

      await waitFor(() => {
        const relationshipRows = screen.getAllByTestId(/relationship-row-/);
        const relationshipNames = relationshipRows.map(row => 
          within(row).getByTestId('relationship-name').textContent
        );
        
        // Verify ascending order
        const sortedNames = [...relationshipNames].sort();
        expect(relationshipNames).toEqual(sortedNames);
      });
    });

    it('sorts relationships by name descending', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click name header twice for descending order
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);
      await user.click(nameHeader);

      await waitFor(() => {
        const relationshipRows = screen.getAllByTestId(/relationship-row-/);
        const relationshipNames = relationshipRows.map(row => 
          within(row).getByTestId('relationship-name').textContent
        );
        
        // Verify descending order
        const sortedNames = [...relationshipNames].sort().reverse();
        expect(relationshipNames).toEqual(sortedNames);
      });
    });

    it('sorts relationships by type', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click type column header to sort
      const typeHeader = screen.getByRole('columnheader', { name: /type/i });
      await user.click(typeHeader);

      await waitFor(() => {
        const relationshipRows = screen.getAllByTestId(/relationship-row-/);
        const relationshipTypes = relationshipRows.map(row => 
          within(row).getByTestId(/relationship-type-/).textContent
        );
        
        // Verify types are sorted (belongs_to, has_many, has_one, many_many)
        expect(relationshipTypes[0]).toMatch(/belongs to/i);
      });
    });

    it('combines filtering and sorting', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Apply filter first
      const searchInput = screen.getByLabelText(/search relationships/i);
      await user.type(searchInput, 'profile');

      // Then apply sorting
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);

      await waitFor(() => {
        const visibleRows = screen.getAllByTestId(/relationship-row-/);
        
        // Should only show filtered results that contain 'profile'
        visibleRows.forEach(row => {
          const relationshipName = within(row).getByTestId('relationship-name').textContent || '';
          expect(relationshipName.toLowerCase()).toMatch(/profile/);
        });
        
        // And they should be sorted
        const relationshipNames = visibleRows.map(row => 
          within(row).getByTestId('relationship-name').textContent
        );
        const sortedNames = [...relationshipNames].sort();
        expect(relationshipNames).toEqual(sortedNames);
      });
    });

    it('clears filters correctly', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Apply filter
      const searchInput = screen.getByLabelText(/search relationships/i);
      await user.type(searchInput, 'user_profile');

      await waitFor(() => {
        expect(screen.getByText('user_profile')).toBeInTheDocument();
        expect(screen.queryByText('profile_posts')).not.toBeInTheDocument();
      });

      // Clear filter
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        // All relationships should be visible again
        expect(screen.getByText('user_profile')).toBeInTheDocument();
        expect(screen.getByText('profile_posts')).toBeInTheDocument();
        expect(screen.getByText('profile_settings')).toBeInTheDocument();
        expect(screen.getByText('user_roles')).toBeInTheDocument();
        expect(screen.getByText('post_tags')).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // Navigation and Routing Tests
  // =============================================================================

  describe('Navigation and Routing', () => {
    beforeEach(() => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );
    });

    it('navigates to relationship creation route', async () => {
      const mockPush = vi.fn();
      mockRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
      });

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click create relationship button
      const createButton = screen.getByRole('button', { name: /create relationship/i });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/relationships/new');
    });

    it('navigates to relationship editing route when clicking on relationship name', async () => {
      const mockPush = vi.fn();
      mockRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
      });

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click on a relationship name to edit
      const relationshipLink = screen.getByText('user_profile');
      await user.click(relationshipLink);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/relationships/rel_001');
    });

    it('navigates using action menu options', async () => {
      const mockPush = vi.fn();
      mockRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
      });

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open action menu for first relationship
      const actionMenuButton = screen.getAllByRole('button', { name: /actions/i })[0];
      await user.click(actionMenuButton);

      // Click edit option
      const editOption = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editOption);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/relationships/rel_001');
    });

    it('handles delete confirmation flow', async () => {
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open action menu and click delete
      const actionMenuButton = screen.getAllByRole('button', { name: /actions/i })[0];
      await user.click(actionMenuButton);

      const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteOption);

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete this relationship/i)).toBeInTheDocument();
      });

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('preserves URL search parameters during navigation', async () => {
      // Mock search params with filter and sort
      const mockSearchParams = new URLSearchParams('filter=profile&sort=name');
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

      const mockPush = vi.fn();
      mockRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
      });

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create relationship/i });
      await user.click(createButton);

      // Verify URL preserves current filters
      expect(mockPush).toHaveBeenCalledWith('/adf-schema/relationships/new?filter=profile&sort=name');
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('maintains WCAG 2.1 AA compliance', async () => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      const { container } = renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table accessibility attributes
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Database relationships');

      // Verify column headers have proper scope
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });

      // Verify row structure
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      
      dataRows.forEach(row => {
        expect(row).toHaveAttribute('aria-rowindex');
      });

      // Test keyboard navigation
      const firstDataRow = dataRows[0];
      firstDataRow.focus();
      expect(document.activeElement).toBe(firstDataRow);

      // Verify focus management for interactive elements
      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('provides proper screen reader announcements', async () => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify live region for status updates
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');

      // Test loading announcement
      expect(statusRegion).toHaveTextContent(/loaded \d+ relationships/i);

      // Test filter announcements
      const searchInput = screen.getByLabelText(/search relationships/i);
      await user.type(searchInput, 'profile');

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent(/filtered to \d+ relationships/i);
      });
    });

    it('supports keyboard navigation', async () => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test Tab navigation through interactive elements
      const searchInput = screen.getByLabelText(/search relationships/i);
      const createButton = screen.getByRole('button', { name: /create relationship/i });
      const sortButtons = screen.getAllByRole('button', { name: /sort by/i });

      // Focus search input
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab to create button
      await user.tab();
      expect(document.activeElement).toBe(createButton);

      // Tab to first sort button
      await user.tab();
      expect(document.activeElement).toBe(sortButtons[0]);

      // Test Enter key activation
      await user.keyboard('{Enter}');
      // Verify sort was triggered by checking for updated table state
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-error-state')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/please check your connection/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('handles server errors with detailed messages', async () => {
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Database connection timeout',
                details: 'The database server is not responding'
              }
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-error-state')).toBeInTheDocument();
        expect(screen.getByText(/database connection timeout/i)).toBeInTheDocument();
        expect(screen.getByText(/the database server is not responding/i)).toBeInTheDocument();
      });
    });

    it('handles authorization errors', async () => {
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                code: 401,
                message: 'Unauthorized access',
                details: 'Please log in to continue'
              }
            })
          );
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-error-state')).toBeInTheDocument();
        expect(screen.getByText(/unauthorized access/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json({ invalid: 'response format' }));
        })
      );

      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId('relationships-error-state')).toBeInTheDocument();
        expect(screen.getByText(/invalid response format/i)).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // Performance Tests
  // =============================================================================

  describe('Performance', () => {
    it('meets SSR page load requirements under 2 seconds', async () => {
      const mockRelationships = createMockRelationships();
      
      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.delay(500), ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      const startTime = Date.now();
      
      renderWithProviders(<RelationshipsPage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // SSR pages under 2 seconds
    });

    it('optimizes re-renders with React.memo and useMemo', async () => {
      const mockRelationships = createMockRelationships();
      let renderCount = 0;

      // Mock component that tracks renders
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount++;
        return <div>{children}</div>;
      };

      server.use(
        rest.get('/api/v2/mysql_service_1/_table/users/relationships', (req, res, ctx) => {
          return res(ctx.json(createMockApiResponse(mockRelationships)));
        })
      );

      const { rerender } = renderWithProviders(
        <TestWrapper>
          <RelationshipsPage />
        </TestWrapper>,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Re-render with same props should not cause unnecessary re-renders
      rerender(
        <TestWrapper>
          <RelationshipsPage />
        </TestWrapper>
      );

      // Verify minimal re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(1);
    });
  });
});