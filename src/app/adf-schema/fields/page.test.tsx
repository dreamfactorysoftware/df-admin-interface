/**
 * Comprehensive Vitest Test Suite for Fields Listing Page Component
 * 
 * This test suite validates the React/Next.js implementation of the database fields 
 * listing interface, covering field listing, filtering, sorting, navigation, and 
 * TanStack Virtual table rendering functionality.
 * 
 * Key Testing Objectives:
 * - Convert Angular TestBed configuration to Vitest with React Testing Library setup
 * - Replace HttpClientTestingModule with Mock Service Worker (MSW) for API mocking
 * - Transform Angular ComponentFixture testing to React Testing Library patterns
 * - Implement TanStack Virtual testing scenarios for large field datasets
 * - Add React Query caching and invalidation testing patterns
 * - Test Next.js routing navigation to field creation and editing routes
 * 
 * Performance Targets:
 * - 10x faster test execution with Vitest 2.1.0
 * - Sub-100ms test rendering for component tests
 * - Comprehensive field type testing coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';

// Import the component under test
import FieldsPage from './page';

// Import types and test utilities
import type { DatabaseSchemaField, FieldTableRow, FieldType } from './field.types';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock TanStack Virtual for virtualization testing
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => [
      { index: 0, start: 0, size: 50, key: '0' },
      { index: 1, start: 50, size: 50, key: '1' },
      { index: 2, start: 100, size: 50, key: '2' },
    ]),
    getTotalSize: vi.fn(() => 150),
    scrollToIndex: vi.fn(),
    getOffsetForIndex: vi.fn(() => 0),
    getOffsetForAlignment: vi.fn(() => 0),
    measure: vi.fn(),
  })),
}));

/**
 * Mock Field Data Factory
 * Generates realistic field data for testing different scenarios
 */
const createMockField = (overrides: Partial<DatabaseSchemaField> = {}): DatabaseSchemaField => ({
  name: 'test_field',
  label: 'Test Field',
  type: 'string' as FieldType,
  db_type: 'varchar',
  length: 255,
  precision: null,
  scale: null,
  default: null,
  required: false,
  allow_null: true,
  fixed_length: false,
  supports_multibyte: true,
  auto_increment: false,
  is_primary_key: false,
  is_unique: false,
  is_index: false,
  is_foreign_key: false,
  ref_table: null,
  ref_field: null,
  ref_on_update: null,
  ref_on_delete: null,
  picklist: null,
  validation: null,
  db_function: null,
  is_virtual: false,
  is_aggregate: false,
  description: null,
  alias: null,
  native: [],
  ...overrides,
});

/**
 * Create large dataset for virtualization testing
 * Simulates databases with 1000+ fields for performance validation
 */
const createLargeFieldDataset = (count: number = 1500): DatabaseSchemaField[] => {
  const fieldTypes: FieldType[] = ['string', 'integer', 'boolean', 'datetime', 'text', 'float', 'id'];
  
  return Array.from({ length: count }, (_, index) => 
    createMockField({
      name: `field_${index.toString().padStart(4, '0')}`,
      label: `Field ${index + 1}`,
      type: fieldTypes[index % fieldTypes.length],
      is_primary_key: index === 0,
      is_unique: index < 10,
      is_index: index < 50,
      is_foreign_key: index % 10 === 0 && index > 0,
      ref_table: index % 10 === 0 && index > 0 ? `ref_table_${Math.floor(index / 10)}` : null,
      ref_field: index % 10 === 0 && index > 0 ? 'id' : null,
    })
  );
};

/**
 * Test Component Wrapper
 * Provides necessary React Query and context providers for isolated testing
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Helper function to render component with providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('FieldsPage Component', () => {
  // Mock implementations
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();
  const mockRefresh = vi.fn();

  // Test data
  const mockFields = [
    createMockField({
      name: 'id',
      type: 'id',
      is_primary_key: true,
      auto_increment: true,
      required: true,
      allow_null: false,
    }),
    createMockField({
      name: 'name',
      type: 'string',
      length: 255,
      required: true,
      is_index: true,
    }),
    createMockField({
      name: 'email',
      type: 'string',
      length: 320,
      is_unique: true,
      validation: '^[^@]+@[^@]+\\.[^@]+$',
    }),
    createMockField({
      name: 'age',
      type: 'integer',
      length: 11,
      allow_null: true,
    }),
    createMockField({
      name: 'is_active',
      type: 'boolean',
      default: true,
    }),
    createMockField({
      name: 'created_at',
      type: 'datetime',
      default: 'CURRENT_TIMESTAMP',
    }),
    createMockField({
      name: 'user_id',
      type: 'integer',
      is_foreign_key: true,
      ref_table: 'users',
      ref_field: 'id',
      ref_on_delete: 'CASCADE',
    }),
  ];

  beforeAll(() => {
    // Setup MSW handlers for field management endpoints
    server.use(
      // Field listing endpoint
      http.get('/api/v2/:serviceName/_schema/:tableName', ({ params }) => {
        const { serviceName, tableName } = params;
        
        return HttpResponse.json({
          resource: mockFields,
          meta: {
            count: mockFields.length,
            schema: ['field_name', 'native_type', 'type', 'max_length', 'precision', 'scale', 'default_value'],
          },
        });
      }),

      // Large dataset endpoint for virtualization testing
      http.get('/api/v2/large-service/_schema/large-table', () => {
        const largeDataset = createLargeFieldDataset(1500);
        return HttpResponse.json({
          resource: largeDataset,
          meta: {
            count: largeDataset.length,
            schema: ['field_name', 'native_type', 'type', 'max_length', 'precision', 'scale', 'default_value'],
          },
        });
      }),

      // Field creation endpoint
      http.post('/api/v2/:serviceName/_schema/:tableName/:fieldName', ({ request, params }) => {
        return HttpResponse.json({
          success: true,
          message: `Field ${params.fieldName} created successfully`,
        });
      }),

      // Field update endpoint
      http.patch('/api/v2/:serviceName/_schema/:tableName/:fieldName', ({ request, params }) => {
        return HttpResponse.json({
          success: true,
          message: `Field ${params.fieldName} updated successfully`,
        });
      }),

      // Field deletion endpoint
      http.delete('/api/v2/:serviceName/_schema/:tableName/:fieldName', ({ params }) => {
        return HttpResponse.json({
          success: true,
          message: `Field ${params.fieldName} deleted successfully`,
        });
      }),

      // Error scenarios for testing error handling
      http.get('/api/v2/error-service/_schema/error-table', () => {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal server error',
              status_code: 500,
            },
          },
          { status: 500 }
        );
      })
    );
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      refresh: mockRefresh,
      prefetch: vi.fn(),
    });

    (useParams as any).mockReturnValue({
      service: 'test-service',
      table: 'test-table',
    });
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  describe('Component Rendering and Initial State', () => {
    it('should render the fields listing page with correct heading', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /fields/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/manage database fields/i)).toBeInTheDocument();
    });

    it('should display loading state during initial data fetch', () => {
      renderWithProviders(<FieldsPage />);

      // Check for loading indicators
      expect(screen.getByTestId('fields-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading fields/i)).toBeInTheDocument();
    });

    it('should render table headers correctly', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /field name/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /constraints/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /default/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('should display field data after successful API response', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('age')).toBeInTheDocument();
      expect(screen.getByText('is_active')).toBeInTheDocument();
      expect(screen.getByText('created_at')).toBeInTheDocument();
      expect(screen.getByText('user_id')).toBeInTheDocument();
    });
  });

  describe('Field Type Display and Constraints', () => {
    it('should display field types correctly', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Check field types are displayed
      expect(screen.getByText('string')).toBeInTheDocument();
      expect(screen.getByText('integer')).toBeInTheDocument();
      expect(screen.getByText('boolean')).toBeInTheDocument();
      expect(screen.getByText('datetime')).toBeInTheDocument();
    });

    it('should display primary key constraint badge', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('constraint-primary-key')).toBeInTheDocument();
      });

      expect(screen.getByText('Primary Key')).toBeInTheDocument();
    });

    it('should display unique constraint badge', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('constraint-unique')).toBeInTheDocument();
      });

      expect(screen.getByText('Unique')).toBeInTheDocument();
    });

    it('should display index constraint badge', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('constraint-index')).toBeInTheDocument();
      });

      expect(screen.getByText('Index')).toBeInTheDocument();
    });

    it('should display foreign key constraint with reference', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('constraint-foreign-key')).toBeInTheDocument();
      });

      expect(screen.getByText('Foreign Key')).toBeInTheDocument();
      expect(screen.getByText('users.id')).toBeInTheDocument();
    });

    it('should display required field indicator', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('field-required')).toHaveLength(2); // id and name fields
      });
    });

    it('should display default values correctly', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('true')).toBeInTheDocument(); // boolean default
      });

      expect(screen.getByText('CURRENT_TIMESTAMP')).toBeInTheDocument(); // datetime default
    });
  });

  describe('Filtering and Search Functionality', () => {
    it('should render search input field', async () => {
      renderWithProviders(<FieldsPage />);

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should filter fields by name when typing in search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      await user.type(searchInput, 'name');

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.queryByText('age')).not.toBeInTheDocument();
      });
    });

    it('should filter fields by type using type filter dropdown', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('string')).toBeInTheDocument();
      });

      const typeFilter = screen.getByLabelText(/filter by type/i);
      await user.selectOptions(typeFilter, 'string');

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('age')).not.toBeInTheDocument();
      });
    });

    it('should clear search filter when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      await user.type(searchInput, 'name');

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        expect(screen.getByText('age')).toBeInTheDocument();
      });
    });

    it('should show "no results" message when filter returns no matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      await user.type(searchInput, 'nonexistent_field');

      await waitFor(() => {
        expect(screen.getByText(/no fields found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort fields by name when name column header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /field name/i })).toBeInTheDocument();
      });

      const nameHeader = screen.getByRole('columnheader', { name: /field name/i });
      await user.click(nameHeader);

      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-asc')).toBeInTheDocument();
      });

      // Click again to reverse sort
      await user.click(nameHeader);

      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-desc')).toBeInTheDocument();
      });
    });

    it('should sort fields by type when type column header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      });

      const typeHeader = screen.getByRole('columnheader', { name: /type/i });
      await user.click(typeHeader);

      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-asc')).toBeInTheDocument();
      });
    });

    it('should maintain sort state during data refresh', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /field name/i })).toBeInTheDocument();
      });

      const nameHeader = screen.getByRole('columnheader', { name: /field name/i });
      await user.click(nameHeader);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('sort-indicator-asc')).toBeInTheDocument();
      });
    });
  });

  describe('TanStack Virtual Large Dataset Testing', () => {
    beforeEach(() => {
      // Mock params for large dataset testing
      (useParams as any).mockReturnValue({
        service: 'large-service',
        table: 'large-table',
      });
    });

    it('should render virtualized table for large datasets efficiently', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-table')).toBeInTheDocument();
      });

      // Verify virtualization is active
      expect(screen.getByTestId('virtual-list-container')).toBeInTheDocument();
      expect(screen.getByTestId('virtual-scrollbar')).toBeInTheDocument();
    });

    it('should display performance metrics for large datasets', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('performance-indicator')).toBeInTheDocument();
      });

      expect(screen.getByText(/1,500 fields/i)).toBeInTheDocument();
      expect(screen.getByText(/virtualized rendering/i)).toBeInTheDocument();
    });

    it('should handle scrolling in virtualized table', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('virtual-list-container')).toBeInTheDocument();
      });

      const virtualContainer = screen.getByTestId('virtual-list-container');
      
      // Simulate scrolling
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 500 } });

      await waitFor(() => {
        expect(screen.getByTestId('scroll-position-indicator')).toBeInTheDocument();
      });
    });

    it('should maintain performance under 50ms for virtualized rendering', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify rendering performance meets requirements
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate to field creation page when "Add Field" button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      const addButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields/new?service=test-service&table=test-table');
    });

    it('should navigate to field edit page when edit action is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('edit-field-name');
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields/name?service=test-service&table=test-table');
    });

    it('should navigate back to table schema when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      const backButton = screen.getByRole('button', { name: /back to table/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/tables/test-table?service=test-service');
    });

    it('should update URL parameters when service or table changes', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('test-service')).toBeInTheDocument();
      });

      expect(screen.getByText('test-table')).toBeInTheDocument();
    });
  });

  describe('React Query Caching and Data Management', () => {
    it('should cache field data and display cache status', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-status')).toBeInTheDocument();
      });

      expect(screen.getByText(/cached/i)).toBeInTheDocument();
    });

    it('should invalidate cache and refetch data when refresh is triggered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-status')).toHaveTextContent(/refreshing/i);
      });

      await waitFor(() => {
        expect(screen.getByTestId('cache-status')).toHaveTextContent(/cached/i);
      });
    });

    it('should handle stale data and background updates', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      // Verify stale-while-revalidate pattern
      expect(screen.getByTestId('data-freshness-indicator')).toBeInTheDocument();
    });

    it('should implement optimistic updates for field modifications', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      // Simulate field update
      const editButton = screen.getByTestId('edit-field-name');
      await user.click(editButton);

      // Verify optimistic update occurs before server response
      await waitFor(() => {
        expect(screen.getByTestId('optimistic-update-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      // Mock params for error testing
      (useParams as any).mockReturnValue({
        service: 'error-service',
        table: 'error-table',
      });
    });

    it('should display error message when API request fails', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/error loading fields/i)).toBeInTheDocument();
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });

    it('should provide retry functionality after error', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(screen.getByTestId('fields-loading')).toBeInTheDocument();
    });

    it('should handle network connectivity issues gracefully', async () => {
      // Mock network error
      server.use(
        http.get('/api/v2/error-service/_schema/error-table', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    });

    it('should handle empty field list gracefully', async () => {
      // Mock empty response
      server.use(
        http.get('/api/v2/test-service/_schema/test-table', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0 },
          });
        })
      );

      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText(/no fields found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first field/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Database fields listing');
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search fields');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Filter by field type');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.tab();
      expect(screen.getByPlaceholderText(/search fields/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/filter by type/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /add field/i })).toHaveFocus();
    });

    it('should announce filter results to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      await user.type(searchInput, 'name');

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/2 fields found/i);
      });
    });

    it('should provide clear focus indicators for interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add field/i });
      await user.tab();

      expect(addButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Performance and Optimization', () => {
    it('should lazy load field data for improved initial load times', async () => {
      const loadStartTime = performance.now();
      
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('fields-loading')).toBeInTheDocument();
      });

      const initialLoadTime = performance.now() - loadStartTime;
      expect(initialLoadTime).toBeLessThan(100); // Initial render under 100ms
    });

    it('should implement debounced search to reduce API calls', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search fields/i);
      
      // Type rapidly to test debouncing
      await user.type(searchInput, 'test');

      // Verify debounced behavior - only one API call should be made
      await waitFor(() => {
        expect(screen.getByTestId('search-debounce-indicator')).toHaveTextContent(/debounced/i);
      });
    });

    it('should use React.memo for field row components to prevent unnecessary re-renders', async () => {
      renderWithProviders(<FieldsPage />);

      await waitFor(() => {
        expect(screen.getByText('name')).toBeInTheDocument();
      });

      // Verify memoization by checking render count
      expect(screen.getByTestId('field-row-render-count')).toHaveTextContent('1');
    });
  });
});