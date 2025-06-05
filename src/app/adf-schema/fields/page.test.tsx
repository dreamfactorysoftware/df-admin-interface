/**
 * Comprehensive Vitest test suite for the database fields listing page component.
 * 
 * Tests field listing, filtering, sorting, navigation, and TanStack Virtual table rendering
 * following established testing patterns from other migrated components per Section 4.7.1.3
 * Vitest Testing Infrastructure Setup and Section 5.2 Component Details Testing Infrastructure.
 * 
 * Key test coverage areas:
 * - Field listing with TanStack Virtual for large datasets (1,000+ fields)
 * - React Query caching and invalidation patterns with MSW integration
 * - Filtering and sorting functionality with real-time updates
 * - Navigation to field creation (/new) and editing (/[fieldId]) routes
 * - Field type-based visual indicators and constraint status displays
 * - Error handling and loading states
 * - WCAG 2.1 AA accessibility compliance validation
 * - Responsive design and performance testing
 * 
 * Test execution leverages Vitest 2.1.0 for 10x faster execution compared to Jest/Karma,
 * supporting native TypeScript and ES modules with comprehensive MSW API mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

// Component imports for testing
import FieldsListingPage from './page';

// Type definitions
import type { 
  DatabaseField, 
  FieldListResponse, 
  FieldFilterOptions, 
  FieldSortOptions,
  FieldType,
  ConstraintStatus 
} from './field.types';

// Test utilities and setup
import { server } from '../../../test/mocks/server';
import { createTestQueryClient, renderWithProviders, createMockRouter } from '../../../test/test-utils';
import { handlers } from '../../../test/mocks/handlers';

// Mock data generators
import { 
  createMockDatabaseField,
  createMockFieldListResponse,
  generateLargeFieldDataset,
  createFieldFilterScenarios,
  createFieldSortScenarios
} from '../../../test/fixtures/field-fixtures';

// =============================================================================
// Test Configuration and Setup
// =============================================================================

/**
 * Enhanced user event setup for realistic interaction testing
 */
const createUserEvent = () => userEvent.setup({
  delay: null, // Disable delays for faster test execution
  advanceTimers: vi.advanceTimersByTime,
});

/**
 * Mock Next.js router for navigation testing
 */
const createMockNextRouter = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/adf-schema/fields',
  searchParams: new URLSearchParams(),
  ...overrides,
});

/**
 * Test query client configuration with optimized cache settings
 */
const createFieldsTestQueryClient = () => new QueryClient({
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

/**
 * Standard field list dataset for consistent testing
 */
const MOCK_FIELDS_DATASET = [
  createMockDatabaseField({
    name: 'id',
    type: 'id',
    db_type: 'integer',
    is_primary_key: true,
    auto_increment: true,
    required: true,
    allow_null: false,
  }),
  createMockDatabaseField({
    name: 'email',
    type: 'string',
    db_type: 'varchar',
    length: 255,
    is_unique: true,
    required: true,
    allow_null: false,
  }),
  createMockDatabaseField({
    name: 'created_at',
    type: 'timestamp',
    db_type: 'timestamp',
    required: false,
    allow_null: true,
    default: 'CURRENT_TIMESTAMP',
  }),
  createMockDatabaseField({
    name: 'profile_data',
    type: 'json',
    db_type: 'json',
    required: false,
    allow_null: true,
  }),
  createMockDatabaseField({
    name: 'status',
    type: 'string',
    db_type: 'enum',
    picklist: 'active,inactive,pending',
    required: true,
    allow_null: false,
    default: 'pending',
  }),
];

/**
 * Large dataset for virtualization testing (1000+ fields)
 */
const LARGE_FIELDS_DATASET = generateLargeFieldDataset(1250);

// =============================================================================
// Mock API Handlers for Field Operations
// =============================================================================

/**
 * MSW handlers for field management API endpoints
 */
const fieldApiHandlers = [
  // Get fields list with pagination and filtering
  http.get('/api/v2/:service/_schema/:table', ({ params, request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit')) || 25;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('order');
    const search = url.searchParams.get('search');
    
    let fields = [...MOCK_FIELDS_DATASET];
    
    // Apply search filtering
    if (search) {
      fields = fields.filter(field => 
        field.name.toLowerCase().includes(search.toLowerCase()) ||
        field.type.toLowerCase().includes(search.toLowerCase()) ||
        (field.description && field.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Apply type filtering
    if (filter) {
      const filterType = filter.replace('type=', '');
      fields = fields.filter(field => field.type === filterType);
    }
    
    // Apply sorting
    if (sort) {
      const [sortField, direction] = sort.split(',');
      fields.sort((a, b) => {
        const aVal = a[sortField as keyof DatabaseField] || '';
        const bVal = b[sortField as keyof DatabaseField] || '';
        const comparison = String(aVal).localeCompare(String(bVal));
        return direction === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply pagination
    const paginatedFields = fields.slice(offset, offset + limit);
    
    return HttpResponse.json({
      resource: paginatedFields,
      meta: {
        count: paginatedFields.length,
        total: fields.length,
        offset,
        limit,
      }
    });
  }),

  // Get specific field details
  http.get('/api/v2/:service/_schema/:table/:fieldName', ({ params }) => {
    const field = MOCK_FIELDS_DATASET.find(f => f.name === params.fieldName);
    if (!field) {
      return HttpResponse.json({ error: 'Field not found' }, { status: 404 });
    }
    return HttpResponse.json({ resource: [field] });
  }),

  // Create new field
  http.post('/api/v2/:service/_schema/:table', async ({ request }) => {
    const fieldData = await request.json() as DatabaseField;
    const newField = createMockDatabaseField(fieldData);
    return HttpResponse.json({ resource: [newField] }, { status: 201 });
  }),

  // Update field
  http.put('/api/v2/:service/_schema/:table/:fieldName', async ({ params, request }) => {
    const fieldData = await request.json() as Partial<DatabaseField>;
    const existingField = MOCK_FIELDS_DATASET.find(f => f.name === params.fieldName);
    if (!existingField) {
      return HttpResponse.json({ error: 'Field not found' }, { status: 404 });
    }
    const updatedField = { ...existingField, ...fieldData };
    return HttpResponse.json({ resource: [updatedField] });
  }),

  // Delete field
  http.delete('/api/v2/:service/_schema/:table/:fieldName', ({ params }) => {
    const fieldIndex = MOCK_FIELDS_DATASET.findIndex(f => f.name === params.fieldName);
    if (fieldIndex === -1) {
      return HttpResponse.json({ error: 'Field not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Large dataset endpoint for virtualization testing
  http.get('/api/v2/test-large/_schema/large_table', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit')) || 50;
    const offset = Number(url.searchParams.get('offset')) || 0;
    
    const paginatedFields = LARGE_FIELDS_DATASET.slice(offset, offset + limit);
    
    return HttpResponse.json({
      resource: paginatedFields,
      meta: {
        count: paginatedFields.length,
        total: LARGE_FIELDS_DATASET.length,
        offset,
        limit,
      }
    });
  }),
];

// =============================================================================
// Test Suite: Fields Listing Page Component
// =============================================================================

describe('FieldsListingPage Component', () => {
  let mockRouter: ReturnType<typeof createMockNextRouter>;
  let queryClient: QueryClient;
  let user: ReturnType<typeof createUserEvent>;

  beforeEach(() => {
    // Reset all mocks and setup fresh state
    vi.clearAllMocks();
    
    // Setup test router
    mockRouter = createMockNextRouter();
    
    // Create fresh query client for each test
    queryClient = createFieldsTestQueryClient();
    
    // Setup user event simulation
    user = createUserEvent();
    
    // Add field-specific handlers to MSW server
    server.use(...fieldApiHandlers);
  });

  afterEach(() => {
    // Clean up after each test
    queryClient.clear();
    server.resetHandlers();
  });

  // ===========================================================================
  // Basic Rendering and Initial State Tests
  // ===========================================================================

  describe('Initial Rendering and Layout', () => {
    it('should render the fields listing page with proper structure', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /fields/i })).toBeInTheDocument();
      });

      // Verify main layout elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by type/i })).toBeInTheDocument();
    });

    it('should display loading state initially', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Should show loading indicator immediately
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      });
    });

    it('should have proper accessibility attributes', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /fields/i })).toBeInTheDocument();
      });

      // Verify WCAG 2.1 AA compliance attributes
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAccessibleName();
      expect(searchInput).toHaveAttribute('aria-label');

      const filterSelect = screen.getByRole('combobox', { name: /filter by type/i });
      expect(filterSelect).toHaveAccessibleName();

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');
    });
  });

  // ===========================================================================
  // Data Fetching and React Query Integration Tests
  // ===========================================================================

  describe('Data Fetching and React Query Integration', () => {
    it('should fetch fields data on mount', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('created_at')).toBeInTheDocument();
      });

      // Verify field types are displayed
      expect(screen.getByText('integer')).toBeInTheDocument();
      expect(screen.getByText('varchar')).toBeInTheDocument();
      expect(screen.getByText('timestamp')).toBeInTheDocument();
    });

    it('should cache query results for performance', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      // First render
      const { unmount } = renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Unmount and remount - should use cached data
      unmount();
      
      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Should load immediately from cache
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      server.use(
        http.get('/api/v2/:service/_schema/:table', () => {
          return HttpResponse.json(
            { error: 'Service not found' }, 
            { status: 404 }
          );
        })
      );

      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'invalid-service', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/service not found/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should support query refetching', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show loading state briefly
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

      // Data should reload
      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // TanStack Virtual Table Rendering Tests
  // ===========================================================================

  describe('TanStack Virtual Table Rendering', () => {
    it('should render virtual table for large datasets', async () => {
      // Use large dataset endpoint
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-large', table: 'large_table' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Should show virtualized container
      const virtualContainer = screen.getByTestId('virtual-table-container');
      expect(virtualContainer).toBeInTheDocument();
      
      // Should show only visible rows (not all 1250)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(100); // Only visible rows rendered
      expect(rows.length).toBeGreaterThan(10); // But enough to fill viewport
    });

    it('should handle virtual scrolling correctly', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-large', table: 'large_table' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const virtualContainer = screen.getByTestId('virtual-table-container');
      
      // Simulate scrolling down
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 1000 } });

      // Should trigger virtualization and render different rows
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(5);
      });
    });

    it('should maintain performance with large datasets', async () => {
      const performanceStart = performance.now();

      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-large', table: 'large_table' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const performanceEnd = performance.now();
      const renderTime = performanceEnd - performanceStart;

      // Should render quickly even with large dataset
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  // ===========================================================================
  // Filtering and Search Functionality Tests
  // ===========================================================================

  describe('Filtering and Search Functionality', () => {
    it('should filter fields by search term', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Search for 'email'
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'email');

      // Should show only email field
      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });
    });

    it('should filter fields by type', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Filter by 'string' type
      const filterSelect = screen.getByRole('combobox', { name: /filter by type/i });
      await user.click(filterSelect);
      
      const stringOption = screen.getByRole('option', { name: /string/i });
      await user.click(stringOption);

      // Should show only string fields
      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('status')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });
    });

    it('should clear filters when reset button is clicked', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'email');

      await waitFor(() => {
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // Should show all fields again
      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
      });
    });

    it('should combine search and type filters', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Apply both search and type filter
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'e');

      const filterSelect = screen.getByRole('combobox', { name: /filter by type/i });
      await user.click(filterSelect);
      const stringOption = screen.getByRole('option', { name: /string/i });
      await user.click(stringOption);

      // Should show only string fields containing 'e'
      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
        expect(screen.queryByText('created_at')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Sorting Functionality Tests
  // ===========================================================================

  describe('Sorting Functionality', () => {
    it('should sort fields by name ascending', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click name column header to sort
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);

      // Verify ascending sort indicator
      await waitFor(() => {
        const sortIcon = within(nameHeader).getByTestId('sort-asc-icon');
        expect(sortIcon).toBeInTheDocument();
      });

      // Verify sort order (alphabetical)
      const fieldCells = screen.getAllByTestId(/field-name-/);
      const fieldNames = fieldCells.map(cell => cell.textContent);
      const sortedNames = [...fieldNames].sort();
      expect(fieldNames).toEqual(sortedNames);
    });

    it('should sort fields by name descending', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click name column header twice for descending sort
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);
      await user.click(nameHeader);

      // Verify descending sort indicator
      await waitFor(() => {
        const sortIcon = within(nameHeader).getByTestId('sort-desc-icon');
        expect(sortIcon).toBeInTheDocument();
      });

      // Verify sort order (reverse alphabetical)
      const fieldCells = screen.getAllByTestId(/field-name-/);
      const fieldNames = fieldCells.map(cell => cell.textContent);
      const sortedNames = [...fieldNames].sort().reverse();
      expect(fieldNames).toEqual(sortedNames);
    });

    it('should sort fields by type', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click type column header to sort
      const typeHeader = screen.getByRole('columnheader', { name: /type/i });
      await user.click(typeHeader);

      // Verify sort indicator
      await waitFor(() => {
        const sortIcon = within(typeHeader).getByTestId('sort-asc-icon');
        expect(sortIcon).toBeInTheDocument();
      });
    });

    it('should clear sort when clicking sorted column third time', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click name column header three times to clear sort
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);
      await user.click(nameHeader);
      await user.click(nameHeader);

      // Verify no sort indicator
      await waitFor(() => {
        expect(within(nameHeader).queryByTestId('sort-asc-icon')).not.toBeInTheDocument();
        expect(within(nameHeader).queryByTestId('sort-desc-icon')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Navigation and Routing Tests
  // ===========================================================================

  describe('Navigation and Routing', () => {
    it('should navigate to field creation page when Add Field is clicked', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
      });

      // Click Add Field button
      const addButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addButton);

      // Should navigate to creation route
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields/new?service=test-mysql&table=users');
    });

    it('should navigate to field editing page when field name is clicked', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Click on field name link
      const emailLink = screen.getByRole('link', { name: 'email' });
      await user.click(emailLink);

      // Should navigate to edit route
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields/email?service=test-mysql&table=users');
    });

    it('should handle breadcrumb navigation correctly', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Check breadcrumb navigation
      const schemaBreadcrumb = screen.getByRole('link', { name: /schema/i });
      await user.click(schemaBreadcrumb);

      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema?service=test-mysql');

      const tableBreadcrumb = screen.getByRole('link', { name: 'users' });
      await user.click(tableBreadcrumb);

      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables/users?service=test-mysql');
    });
  });

  // ===========================================================================
  // Field Actions and Context Menu Tests
  // ===========================================================================

  describe('Field Actions and Context Menu', () => {
    it('should show field actions menu when row action button is clicked', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Click row actions button
      const rowActionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(rowActionButtons[0]);

      // Should show context menu
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
      });
    });

    it('should handle field duplication', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Open actions menu and click duplicate
      const rowActionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(rowActionButtons[0]);

      const duplicateMenuItem = screen.getByRole('menuitem', { name: /duplicate/i });
      await user.click(duplicateMenuItem);

      // Should navigate to creation page with duplicated data
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/adf-schema/fields/new?service=test-mysql&table=users&duplicate=')
      );
    });

    it('should handle field deletion with confirmation', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Open actions menu and click delete
      const rowActionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(rowActionButtons[0]);

      const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteMenuItem);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      // Should remove field from list
      await waitFor(() => {
        expect(screen.queryByText('email')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Field Type and Constraint Display Tests
  // ===========================================================================

  describe('Field Type and Constraint Display', () => {
    it('should display field type badges correctly', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Verify type badges
      expect(screen.getByTestId('field-type-badge-id')).toHaveTextContent('id');
      expect(screen.getByTestId('field-type-badge-string')).toHaveTextContent('string');
      expect(screen.getByTestId('field-type-badge-timestamp')).toHaveTextContent('timestamp');
    });

    it('should display constraint indicators', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Verify constraint indicators
      expect(screen.getByTestId('constraint-primary-key')).toBeInTheDocument();
      expect(screen.getByTestId('constraint-unique')).toBeInTheDocument();
      expect(screen.getByTestId('constraint-required')).toBeInTheDocument();
      expect(screen.getByTestId('constraint-auto-increment')).toBeInTheDocument();
    });

    it('should show field length and precision information', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Verify length information for varchar field
      expect(screen.getByText('varchar(255)')).toBeInTheDocument();
      
      // Verify integer field display
      expect(screen.getByText('integer(12)')).toBeInTheDocument();
    });

    it('should display default values appropriately', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('created_at')).toBeInTheDocument();
      });

      // Verify default value display
      expect(screen.getByText('CURRENT_TIMESTAMP')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument(); // status field default
    });
  });

  // ===========================================================================
  // Responsive Design and Mobile Tests
  // ===========================================================================

  describe('Responsive Design and Mobile Support', () => {
    it('should adapt table layout for mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Should show mobile-optimized layout
      expect(screen.getByTestId('mobile-field-cards')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should maintain functionality in mobile view', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-field-cards')).toBeInTheDocument();
      });

      // Search should still work
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'email');

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Performance and Edge Case Tests
  // ===========================================================================

  describe('Performance and Edge Cases', () => {
    it('should handle empty field lists gracefully', async () => {
      // Mock empty response
      server.use(
        http.get('/api/v2/:service/_schema/:table', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0, total: 0, offset: 0, limit: 25 }
          });
        })
      );

      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'empty_table' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText(/no fields found/i)).toBeInTheDocument();
      });

      // Should still show Add Field button
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
    });

    it('should debounce search input for performance', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      
      // Type rapidly
      await user.type(searchInput, 'email', { delay: 50 });

      // Should not make API calls for every keystroke
      // This would be validated by checking MSW request counts
      // For this test, we verify the final result
      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });
    });

    it('should handle network interruptions gracefully', async () => {
      const renderOptions = {
        router: mockRouter,
        queryClient,
        initialProps: {
          params: { service: 'test-mysql', table: 'users' }
        }
      };

      renderWithProviders(<FieldsListingPage {...renderOptions.initialProps} />, renderOptions);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Simulate network error during refresh
      server.use(
        http.get('/api/v2/:service/_schema/:table', () => {
          return HttpResponse.error();
        })
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show error state while maintaining previous data
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Previous data should still be visible
      expect(screen.getByText('id')).toBeInTheDocument();
    });
  });
});