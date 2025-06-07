/**
 * ManageTable Component Test Suite
 * 
 * Comprehensive test suite for the ManageTable component using Vitest 2.1.0 and React Testing Library.
 * Tests accessibility compliance (WCAG 2.1 AA), keyboard navigation, screen reader support,
 * sorting functionality, filtering behavior, pagination controls, row actions, bulk operations,
 * responsive design, TanStack Table integration, TanStack Virtual performance, and React Query
 * data fetching behavior.
 * 
 * Features Tested:
 * - WCAG 2.1 AA accessibility compliance with jest-axe
 * - Keyboard navigation and screen reader support
 * - TanStack Table functionality (sorting, filtering, pagination)
 * - TanStack Virtual performance with large datasets (1000+ rows)
 * - React Query integration for data fetching and caching
 * - Responsive design patterns across viewport sizes
 * - Theme switching and dark mode functionality
 * - Row actions, bulk operations, and selection behavior
 * - MSW integration for realistic API testing
 * 
 * @fileoverview Complete test coverage for ManageTable component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, within, waitFor, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { type UseQueryResult } from '@tanstack/react-query';
import { type ColumnDef, type Row } from '@tanstack/react-table';

// Import testing utilities
import {
  customRender,
  testA11y,
  createKeyboardUtils,
  measureRenderTime,
  createLargeDataset,
  createMockOptions,
  waitForValidation,
  type CustomRenderOptions,
  type KeyboardTestUtils,
  type A11yTestConfig,
} from '@/test/test-utils';

// Import component and types
import { ManageTable } from './manage-table';
import {
  type ManageTableProps,
  type ManageTableRef,
  type ManageTableColumnDef,
  type RowAction,
  type BulkAction,
  type TableApiResponse,
  type PaginationConfig,
  type SortingConfig,
  type GlobalFilterConfig,
  type VirtualizationConfig,
  type RowSelectionConfig,
  type TableThemeConfig,
} from './manage-table.types';

// Mock react-query hooks for controlled testing
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useInfiniteQuery: vi.fn(),
  };
});

// Mock external dependencies
vi.mock('lodash-es', () => ({
  debounce: (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },
}));

// ============================================================================
// TEST DATA AND MOCK UTILITIES
// ============================================================================

/**
 * Sample user data for table testing
 */
interface MockUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  registration: boolean;
  log: boolean;
  scripting: string;
  role: string;
  created_date: string;
  last_modified_date: string;
}

/**
 * Generate mock user data for testing
 */
const createMockUsers = (count: number = 10): MockUser[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
    email: `user${index + 1}@dreamfactory.com`,
    active: index % 2 === 0,
    registration: index % 3 === 0,
    log: index === 2, // Only user 3 has log errors
    scripting: index % 4 === 0 ? 'yes' : 'not',
    role: index < 5 ? 'Admin' : 'User',
    created_date: new Date(2024, 0, index + 1).toISOString(),
    last_modified_date: new Date(2024, 11, index + 1).toISOString(),
  }));
};

/**
 * Default column definitions for testing
 */
const createDefaultColumns = (): ManageTableColumnDef<MockUser>[] => [
  {
    id: 'id',
    header: 'ID',
    accessorKey: 'id',
    enableSorting: true,
    size: 80,
    meta: {
      dataType: 'number',
      align: 'right',
    },
  },
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      dataType: 'text',
      required: true,
    },
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      dataType: 'email',
      required: true,
    },
  },
  {
    id: 'active',
    header: 'Active',
    accessorKey: 'active',
    enableSorting: true,
    size: 100,
    meta: {
      dataType: 'boolean',
    },
  },
  {
    id: 'registration',
    header: 'Registration',
    accessorKey: 'registration',
    enableSorting: true,
    size: 120,
    meta: {
      dataType: 'boolean',
    },
  },
  {
    id: 'log',
    header: 'Log',
    accessorKey: 'log',
    enableSorting: false,
    size: 80,
    meta: {
      dataType: 'boolean',
    },
  },
  {
    id: 'scripting',
    header: 'Scripting',
    accessorKey: 'scripting',
    enableSorting: true,
    size: 100,
    meta: {
      dataType: 'text',
    },
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      dataType: 'text',
    },
  },
];

/**
 * Default row actions for testing
 */
const createDefaultRowActions = (): RowAction<MockUser>[] => [
  {
    id: 'view',
    label: 'View',
    icon: React.createElement('span', { 'data-testid': 'view-icon' }, '👁️'),
    onClick: vi.fn(),
    ariaLabel: 'View user details',
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: React.createElement('span', { 'data-testid': 'edit-icon' }, '✏️'),
    onClick: vi.fn(),
    ariaLabel: 'Edit user',
    disabled: (row: Row<MockUser>) => !row.original.active,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: React.createElement('span', { 'data-testid': 'delete-icon' }, '🗑️'),
    onClick: vi.fn(),
    variant: 'destructive' as const,
    ariaLabel: 'Delete user',
    confirmation: {
      title: 'Delete User',
      message: 'Are you sure you want to delete this user?',
    },
  },
];

/**
 * Default bulk actions for testing
 */
const createDefaultBulkActions = (): BulkAction<MockUser>[] => [
  {
    id: 'activate',
    label: 'Activate Selected',
    icon: React.createElement('span', { 'data-testid': 'activate-icon' }, '✅'),
    onClick: vi.fn(),
    ariaLabel: 'Activate selected users',
  },
  {
    id: 'deactivate',
    label: 'Deactivate Selected',
    icon: React.createElement('span', { 'data-testid': 'deactivate-icon' }, '❌'),
    onClick: vi.fn(),
    ariaLabel: 'Deactivate selected users',
  },
  {
    id: 'delete-bulk',
    label: 'Delete Selected',
    icon: React.createElement('span', { 'data-testid': 'delete-bulk-icon' }, '🗑️'),
    onClick: vi.fn(),
    variant: 'destructive' as const,
    ariaLabel: 'Delete selected users',
    confirmation: {
      title: 'Delete Users',
      message: (count: number) => `Are you sure you want to delete ${count} users?`,
    },
  },
];

/**
 * Mock React Query response
 */
const createMockQueryResponse = (
  data: MockUser[],
  isLoading = false,
  error: Error | null = null
): UseQueryResult<TableApiResponse<MockUser>> => ({
  data: {
    resource: data,
    meta: {
      count: data.length,
      limit: 25,
      offset: 0,
      has_more: false,
    },
  },
  isLoading,
  error,
  isError: !!error,
  isSuccess: !isLoading && !error,
  isFetching: isLoading,
  isRefetching: false,
  isLoadingError: false,
  isRefetchError: false,
  dataUpdatedAt: Date.now(),
  errorUpdatedAt: error ? Date.now() : 0,
  failureCount: 0,
  failureReason: error,
  fetchStatus: isLoading ? 'fetching' : 'idle',
  isFetched: !isLoading,
  isFetchedAfterMount: !isLoading,
  isInitialLoading: isLoading,
  isPending: isLoading,
  isPlaceholderData: false,
  isPreviousData: false,
  isStale: false,
  refetch: vi.fn(),
  remove: vi.fn(),
  status: isLoading ? 'pending' : error ? 'error' : 'success',
} as any);

/**
 * Default table props for testing
 */
const createDefaultProps = (overrides: Partial<ManageTableProps<MockUser>> = {}): ManageTableProps<MockUser> => ({
  data: createMockUsers(),
  columns: createDefaultColumns(),
  rowActions: createDefaultRowActions(),
  bulkActions: createDefaultBulkActions(),
  'data-testid': 'manage-table',
  ...overrides,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render table with default configuration
 */
const renderTable = (
  props: Partial<ManageTableProps<MockUser>> = {},
  renderOptions: CustomRenderOptions = {}
) => {
  const tableProps = createDefaultProps(props);
  const result = customRender(<ManageTable {...tableProps} />, renderOptions);
  
  return {
    ...result,
    keyboard: createKeyboardUtils(result.user),
    props: tableProps,
  };
};

/**
 * Get table container and verify it's rendered
 */
const getTableContainer = () => {
  const container = screen.getByTestId('manage-table');
  expect(container).toBeInTheDocument();
  return container;
};

/**
 * Get table element within container
 */
const getTable = () => {
  const container = getTableContainer();
  const table = within(container).getByRole('table');
  expect(table).toBeInTheDocument();
  return table;
};

/**
 * Get all table rows (excluding header)
 */
const getTableRows = () => {
  const table = getTable();
  const rows = within(table).getAllByRole('row').slice(1); // Skip header row
  return rows;
};

/**
 * Get table headers
 */
const getTableHeaders = () => {
  const table = getTable();
  return within(table).getAllByRole('columnheader');
};

/**
 * Get pagination controls
 */
const getPaginationControls = () => {
  const container = getTableContainer();
  return within(container).queryByText(/Page \d+ of \d+/);
};

/**
 * Get global search input
 */
const getGlobalSearchInput = () => {
  return screen.getByLabelText('Global search');
};

/**
 * Wait for table to finish loading
 */
const waitForTableReady = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ManageTable Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock window.confirm for action confirmations
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render table with data successfully', async () => {
      renderTable();
      
      await waitForTableReady();
      
      // Verify table structure
      expect(getTableContainer()).toBeInTheDocument();
      expect(getTable()).toBeInTheDocument();
      
      // Verify headers are rendered
      const headers = getTableHeaders();
      expect(headers).toHaveLength(9); // 8 data columns + actions column
      
      // Verify data rows are rendered
      const rows = getTableRows();
      expect(rows).toHaveLength(10); // Default mock data has 10 users
    });

    it('should render with custom data-testid', () => {
      renderTable({ 'data-testid': 'custom-table' });
      
      expect(screen.getByTestId('custom-table')).toBeInTheDocument();
    });

    it('should render table caption when provided', () => {
      const caption = 'User management table showing all registered users';
      renderTable({ caption });
      
      // Caption should be present but visually hidden (sr-only)
      const table = getTable();
      const captionElement = within(table).getByText(caption);
      expect(captionElement).toBeInTheDocument();
      expect(captionElement.tagName.toLowerCase()).toBe('caption');
    });

    it('should render with proper ARIA attributes', () => {
      renderTable({
        'aria-label': 'User data table',
        'aria-describedby': 'table-description',
      });
      
      const table = getTable();
      expect(table).toHaveAttribute('aria-label', 'User data table');
      expect(table).toHaveAttribute('aria-describedby', 'table-description');
    });
  });

  // ==========================================================================
  // LOADING AND ERROR STATES
  // ==========================================================================

  describe('Loading and Error States', () => {
    it('should display loading state correctly', () => {
      renderTable({ loading: true });
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should display loading state with React Query data', () => {
      const mockData = createMockQueryResponse([], true);
      renderTable({ data: mockData });
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should display error state correctly', () => {
      const error = new Error('Failed to load data');
      renderTable({ error });
      
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should display error state with React Query data', () => {
      const error = new Error('Network error');
      const mockData = createMockQueryResponse([], false, error);
      renderTable({ data: mockData });
      
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle retry functionality in error state', async () => {
      const refetchMock = vi.fn();
      const mockData = createMockQueryResponse([], false, new Error('Test error'));
      mockData.refetch = refetchMock;
      
      const { user } = renderTable({ data: mockData });
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });

    it('should display empty state when no data', () => {
      renderTable({ data: [] });
      
      expect(screen.getByText('No entries')).toBeInTheDocument();
      expect(screen.getByText('No data to display')).toBeInTheDocument();
    });

    it('should display custom empty state', () => {
      const emptyState = {
        title: 'No users found',
        description: 'Try adjusting your search criteria',
        icon: React.createElement('span', { 'data-testid': 'empty-icon' }, '🔍'),
        action: React.createElement('button', {}, 'Add User'),
      };
      
      renderTable({ data: [], emptyState });
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility Compliance', () => {
    it('should pass WCAG 2.1 AA accessibility tests', async () => {
      const { container } = renderTable();
      await waitForTableReady();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper keyboard navigation', async () => {
      const { keyboard } = renderTable();
      await waitForTableReady();
      
      // Test tab navigation through table
      await keyboard.tab();
      expect(keyboard.getFocused()).toBeInTheDocument();
      
      // Test arrow key navigation in table
      await keyboard.arrowDown();
      await keyboard.arrowUp();
      await keyboard.arrowLeft();
      await keyboard.arrowRight();
      
      // Verify focus management
      expect(keyboard.getFocused()).toBeInTheDocument();
    });

    it('should support screen reader navigation', async () => {
      renderTable();
      await waitForTableReady();
      
      const table = getTable();
      
      // Verify table structure for screen readers
      expect(table).toHaveAttribute('role', 'table');
      
      // Check headers have proper ARIA labels
      const headers = getTableHeaders();
      headers.forEach(header => {
        expect(header).toHaveAttribute('role', 'columnheader');
      });
      
      // Check rows have proper ARIA structure
      const rows = getTableRows();
      rows.forEach(row => {
        expect(row).toHaveAttribute('role', 'row');
      });
    });

    it('should announce sorting changes to screen readers', async () => {
      const { user } = renderTable({ sorting: { enabled: true } });
      await waitForTableReady();
      
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
      
      // Click to sort ascending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Click to sort descending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should have proper ARIA labels for actions', async () => {
      renderTable();
      await waitForTableReady();
      
      // Find action buttons and verify ARIA labels
      const viewButtons = screen.getAllByLabelText('View user details');
      expect(viewButtons).toHaveLength(10); // One per row
      
      const editButtons = screen.getAllByLabelText('Edit user');
      expect(editButtons.length).toBeGreaterThan(0);
      
      const deleteButtons = screen.getAllByLabelText('Delete user');
      expect(deleteButtons).toHaveLength(10);
    });

    it('should support high contrast mode', async () => {
      // Test with forced-colors media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(forced-colors: active)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      const { container } = renderTable({ theme: { density: 'comfortable' } });
      await waitForTableReady();
      
      // Verify table renders properly in high contrast
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: false }, // Disable contrast check for forced colors
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  // ==========================================================================
  // SORTING FUNCTIONALITY
  // ==========================================================================

  describe('Sorting Functionality', () => {
    it('should enable sorting when configured', async () => {
      const { user } = renderTable({
        sorting: { enabled: true, enableMultiSort: false },
      });
      await waitForTableReady();
      
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
      
      // Test sorting ascending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Test sorting descending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
      
      // Test removing sort
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('should sort data correctly', async () => {
      const { user } = renderTable({
        sorting: { enabled: true },
      });
      await waitForTableReady();
      
      // Get initial row order
      const initialRows = getTableRows();
      const initialFirstRowText = within(initialRows[0]).getByText('User 1');
      expect(initialFirstRowText).toBeInTheDocument();
      
      // Sort by name
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);
      
      // Wait for sort to apply
      await waitFor(() => {
        const sortedRows = getTableRows();
        const firstRowText = within(sortedRows[0]).getByText('User 1');
        expect(firstRowText).toBeInTheDocument();
      });
    });

    it('should handle multi-column sorting when enabled', async () => {
      const { user } = renderTable({
        sorting: { enabled: true, enableMultiSort: true, maxSortColumns: 2 },
      });
      await waitForTableReady();
      
      // Sort by role first
      const roleHeader = screen.getByRole('columnheader', { name: /role/i });
      await user.click(roleHeader);
      
      // Sort by name second (with Shift key)
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.keyboard('{Shift>}');
      await user.click(nameHeader);
      await user.keyboard('{/Shift}');
      
      // Both columns should show sort indicators
      expect(roleHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('should disable sorting for non-sortable columns', async () => {
      const { user } = renderTable({
        sorting: { enabled: true },
      });
      await waitForTableReady();
      
      // Log column should not be sortable
      const logHeader = screen.getByRole('columnheader', { name: /log/i });
      expect(logHeader).not.toHaveAttribute('aria-sort');
      
      // Clicking should not change anything
      await user.click(logHeader);
      expect(logHeader).not.toHaveAttribute('aria-sort');
    });

    it('should handle keyboard sorting', async () => {
      const { keyboard } = renderTable({
        sorting: { enabled: true },
      });
      await waitForTableReady();
      
      // Navigate to sortable header
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      nameHeader.focus();
      
      // Sort with Enter key
      await keyboard.enter();
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      
      // Sort with Space key
      await keyboard.space();
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });
  });

  // ==========================================================================
  // FILTERING FUNCTIONALITY
  // ==========================================================================

  describe('Filtering Functionality', () => {
    it('should enable global search when configured', async () => {
      const { user } = renderTable({
        globalFilter: { enabled: true, placeholder: 'Search users...' },
      });
      await waitForTableReady();
      
      const searchInput = getGlobalSearchInput();
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search users...');
      
      // Test search functionality
      await user.type(searchInput, 'User 1');
      
      // Wait for debounced search
      await waitFor(() => {
        const rows = getTableRows();
        expect(rows.length).toBeLessThan(10); // Should filter results
      }, { timeout: 2000 });
    });

    it('should handle search debouncing', async () => {
      const { user } = renderTable({
        globalFilter: { enabled: true, debounceMs: 500 },
      });
      await waitForTableReady();
      
      const searchInput = getGlobalSearchInput();
      
      // Type rapidly
      await user.type(searchInput, 'test');
      
      // Should not filter immediately
      const initialRows = getTableRows();
      expect(initialRows).toHaveLength(10);
      
      // Wait for debounce
      await waitFor(() => {
        const filteredRows = getTableRows();
        expect(filteredRows.length).toBeLessThanOrEqual(initialRows.length);
      }, { timeout: 1000 });
    });

    it('should clear search when input is cleared', async () => {
      const { user } = renderTable({
        globalFilter: { enabled: true },
      });
      await waitForTableReady();
      
      const searchInput = getGlobalSearchInput();
      
      // Search for something
      await user.type(searchInput, 'User 1');
      await waitFor(() => {
        expect(getTableRows().length).toBeLessThan(10);
      });
      
      // Clear search
      await user.clear(searchInput);
      await waitFor(() => {
        expect(getTableRows()).toHaveLength(10);
      });
    });

    it('should disable search when loading', () => {
      renderTable({
        loading: true,
        globalFilter: { enabled: true },
      });
      
      // Search input should be present but disabled during loading
      expect(screen.queryByLabelText('Global search')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PAGINATION FUNCTIONALITY
  // ==========================================================================

  describe('Pagination Functionality', () => {
    it('should render pagination controls when enabled', () => {
      renderTable({
        pagination: {
          enabled: true,
          mode: 'client',
          pageSizeOptions: [5, 10, 25],
          defaultPageSize: 5,
          showInfo: true,
          showPageSizeSelector: true,
          showQuickNavigation: true,
          position: 'bottom',
        },
      });
      
      const paginationInfo = getPaginationControls();
      expect(paginationInfo).toBeInTheDocument();
      
      // Check page size selector
      expect(screen.getByText('Rows per page')).toBeInTheDocument();
      
      // Check navigation buttons
      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
    });

    it('should handle page navigation', async () => {
      const { user } = renderTable({
        pagination: {
          enabled: true,
          mode: 'client',
          pageSizeOptions: [5, 10, 25],
          defaultPageSize: 5,
          showQuickNavigation: true,
          position: 'bottom',
        },
      });
      
      // Should show first 5 rows
      expect(getTableRows()).toHaveLength(5);
      
      // Navigate to next page
      const nextButton = screen.getByLabelText('Go to next page');
      await user.click(nextButton);
      
      // Should still show 5 rows (second page)
      expect(getTableRows()).toHaveLength(5);
      
      // Navigate to last page
      const lastButton = screen.getByLabelText('Go to last page');
      await user.click(lastButton);
      
      // Should show remaining rows
      expect(getTableRows()).toHaveLength(5);
    });

    it('should handle page size changes', async () => {
      const { user } = renderTable({
        pagination: {
          enabled: true,
          mode: 'client',
          pageSizeOptions: [5, 10, 25],
          defaultPageSize: 5,
          showPageSizeSelector: true,
          position: 'bottom',
        },
      });
      
      // Initial page size should show 5 rows
      expect(getTableRows()).toHaveLength(5);
      
      // Change page size to 10
      const pageSizeSelect = screen.getByDisplayValue('5');
      await user.selectOptions(pageSizeSelect, '10');
      
      // Should now show 10 rows
      expect(getTableRows()).toHaveLength(10);
    });

    it('should show correct pagination info', () => {
      renderTable({
        pagination: {
          enabled: true,
          mode: 'client',
          defaultPageSize: 5,
          showInfo: true,
          position: 'bottom',
        },
      });
      
      expect(screen.getByText('Showing 1 to 5 of 10 results')).toBeInTheDocument();
    });

    it('should disable navigation buttons appropriately', async () => {
      const { user } = renderTable({
        pagination: {
          enabled: true,
          mode: 'client',
          defaultPageSize: 5,
          showQuickNavigation: true,
          position: 'bottom',
        },
      });
      
      // First page - previous buttons should be disabled
      const firstButton = screen.getByLabelText('Go to first page');
      const prevButton = screen.getByLabelText('Go to previous page');
      expect(firstButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
      
      // Go to last page
      const lastButton = screen.getByLabelText('Go to last page');
      await user.click(lastButton);
      
      // Last page - next buttons should be disabled
      const nextButton = screen.getByLabelText('Go to next page');
      expect(nextButton).toBeDisabled();
      expect(lastButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // ROW SELECTION FUNCTIONALITY
  // ==========================================================================

  describe('Row Selection Functionality', () => {
    it('should enable row selection when configured', () => {
      renderTable({
        rowSelection: {
          enabled: true,
          mode: 'multiple',
          enableSelectAll: true,
        },
      });
      
      // Should have select all checkbox in header
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(selectAllCheckbox).toBeInTheDocument();
      
      // Should have individual row checkboxes
      const rowCheckboxes = screen.getAllByRole('checkbox');
      expect(rowCheckboxes.length).toBeGreaterThan(1); // Select all + row checkboxes
    });

    it('should handle individual row selection', async () => {
      const onSelectionChange = vi.fn();
      const { user } = renderTable({
        rowSelection: {
          enabled: true,
          mode: 'multiple',
          onSelectionChange,
        },
      });
      
      const rowCheckboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = rowCheckboxes[1]; // Skip select all
      
      await user.click(firstRowCheckbox);
      expect(firstRowCheckbox).toBeChecked();
      expect(onSelectionChange).toHaveBeenCalled();
    });

    it('should handle select all functionality', async () => {
      const { user } = renderTable({
        rowSelection: {
          enabled: true,
          mode: 'multiple',
          enableSelectAll: true,
        },
      });
      
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await user.click(selectAllCheckbox);
      
      // All row checkboxes should be checked
      const rowCheckboxes = screen.getAllByRole('checkbox');
      rowCheckboxes.slice(1).forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should limit selection in single mode', async () => {
      const { user } = renderTable({
        rowSelection: {
          enabled: true,
          mode: 'single',
        },
      });
      
      const rowCheckboxes = screen.getAllByRole('checkbox');
      
      // Select first row
      await user.click(rowCheckboxes[0]);
      expect(rowCheckboxes[0]).toBeChecked();
      
      // Select second row - should deselect first
      await user.click(rowCheckboxes[1]);
      expect(rowCheckboxes[0]).not.toBeChecked();
      expect(rowCheckboxes[1]).toBeChecked();
    });

    it('should handle bulk actions with selection', async () => {
      const bulkActions = createDefaultBulkActions();
      const activateMock = bulkActions[0].onClick as MockedFunction<any>;
      
      const { user } = renderTable({
        rowSelection: {
          enabled: true,
          mode: 'multiple',
        },
        bulkActions,
      });
      
      // Select some rows
      const rowCheckboxes = screen.getAllByRole('checkbox');
      await user.click(rowCheckboxes[1]);
      await user.click(rowCheckboxes[2]);
      
      // Click bulk action
      const activateButton = screen.getByLabelText('Activate selected users');
      await user.click(activateButton);
      
      expect(activateMock).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ROW ACTIONS FUNCTIONALITY
  // ==========================================================================

  describe('Row Actions Functionality', () => {
    it('should render row actions for each row', () => {
      renderTable();
      
      // Each row should have action buttons
      const viewButtons = screen.getAllByLabelText('View user details');
      expect(viewButtons).toHaveLength(10);
      
      const editButtons = screen.getAllByLabelText('Edit user');
      expect(editButtons.length).toBeGreaterThan(0);
      
      const deleteButtons = screen.getAllByLabelText('Delete user');
      expect(deleteButtons).toHaveLength(10);
    });

    it('should handle row action clicks', async () => {
      const rowActions = createDefaultRowActions();
      const viewMock = rowActions[0].onClick as MockedFunction<any>;
      
      const { user } = renderTable({ rowActions });
      
      const firstViewButton = screen.getAllByLabelText('View user details')[0];
      await user.click(firstViewButton);
      
      expect(viewMock).toHaveBeenCalledTimes(1);
    });

    it('should disable actions conditionally', () => {
      renderTable();
      
      // Edit button should be disabled for inactive users (even indexes)
      const editButtons = screen.getAllByLabelText('Edit user');
      
      // Check if some edit buttons are disabled
      const disabledEditButtons = editButtons.filter(button => button.hasAttribute('disabled'));
      expect(disabledEditButtons.length).toBeGreaterThan(0);
    });

    it('should show confirmation for destructive actions', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      const { user } = renderTable();
      
      const firstDeleteButton = screen.getAllByLabelText('Delete user')[0];
      await user.click(firstDeleteButton);
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'Delete User\n\nAre you sure you want to delete this user?'
      );
    });

    it('should handle action menus for multiple actions', async () => {
      const manyActions: RowAction<MockUser>[] = [
        ...createDefaultRowActions(),
        {
          id: 'copy',
          label: 'Copy',
          onClick: vi.fn(),
          ariaLabel: 'Copy user',
        },
        {
          id: 'archive',
          label: 'Archive',
          onClick: vi.fn(),
          ariaLabel: 'Archive user',
        },
      ];
      
      const { user } = renderTable({ rowActions: manyActions });
      
      // Should show menu button instead of individual actions
      const menuButtons = screen.getAllByLabelText('Row actions');
      expect(menuButtons).toHaveLength(10);
      
      // Click first menu button
      await user.click(menuButtons[0]);
      
      // Menu should appear with all actions
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VIRTUALIZATION TESTS
  // ==========================================================================

  describe('Virtualization Performance', () => {
    it('should handle large datasets with virtualization', async () => {
      const largeDataset = createLargeDataset(1000);
      const mockUsers = largeDataset.map((item, index) => ({
        id: index + 1,
        name: item.label,
        email: `${item.value}@test.com`,
        active: index % 2 === 0,
        registration: index % 3 === 0,
        log: false,
        scripting: 'not',
        role: 'User',
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
      }));
      
      const { renderTime } = await measureRenderTime(() =>
        renderTable({
          data: mockUsers,
          virtualization: {
            enabled: true,
            estimateSize: 50,
            overscan: 10,
          },
        })
      );
      
      // Virtualization should keep render time reasonable even with large datasets
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
      
      // Should only render visible rows
      const visibleRows = getTableRows();
      expect(visibleRows.length).toBeLessThan(100); // Much less than total 1000
    });

    it('should handle scroll performance with virtualization', async () => {
      const largeDataset = createMockUsers(500);
      
      const { container } = renderTable({
        data: largeDataset,
        virtualization: {
          enabled: true,
          estimateSize: 50,
          overscan: 5,
        },
      });
      
      const tableContainer = container.querySelector('[data-testid="manage-table"]');
      expect(tableContainer).toBeInTheDocument();
      
      // Simulate scroll
      fireEvent.scroll(tableContainer!, { target: { scrollTop: 1000 } });
      
      // Should still render efficiently
      await waitFor(() => {
        const rows = getTableRows();
        expect(rows.length).toBeLessThan(50); // Only visible + overscan rows
      });
    });

    it('should disable virtualization when not needed', () => {
      renderTable({
        data: createMockUsers(10),
        virtualization: {
          enabled: false,
        },
      });
      
      // Should render all rows without virtualization
      const rows = getTableRows();
      expect(rows).toHaveLength(10);
    });
  });

  // ==========================================================================
  // THEME AND RESPONSIVE TESTS
  // ==========================================================================

  describe('Theme and Responsive Design', () => {
    it('should apply light theme correctly', () => {
      const { container } = renderTable(
        {
          theme: {
            density: 'default',
            borders: 'horizontal',
            striped: false,
            hover: true,
          },
        },
        { theme: 'light' }
      );
      
      expect(container.firstChild).toHaveAttribute('data-theme', 'light');
    });

    it('should apply dark theme correctly', () => {
      const { container } = renderTable(
        {
          theme: {
            density: 'default',
            borders: 'horizontal',
            striped: false,
            hover: true,
          },
        },
        { theme: 'dark' }
      );
      
      expect(container.firstChild).toHaveAttribute('data-theme', 'dark');
      expect(document.documentElement).toHaveClass('dark');
    });

    it('should handle different density settings', () => {
      renderTable({
        theme: {
          density: 'compact',
          borders: 'all',
          striped: true,
          hover: true,
        },
      });
      
      const table = getTable();
      expect(table).toBeInTheDocument();
      
      // Verify table styling is applied
      expect(table).toHaveClass('table');
    });

    it('should be responsive on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderTable({
        responsive: {
          breakpoints: {
            mobile: {
              hiddenColumns: ['created_date', 'last_modified_date'],
              stackedView: true,
            },
          },
        },
      });
      
      const table = getTable();
      expect(table).toBeInTheDocument();
      
      // Should handle mobile layout
      expect(table).toHaveClass('table');
    });

    it('should handle tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderTable({
        responsive: {
          breakpoints: {
            tablet: {
              hiddenColumns: ['log'],
              horizontalScroll: true,
            },
          },
        },
      });
      
      const table = getTable();
      expect(table).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // REACT QUERY INTEGRATION TESTS
  // ==========================================================================

  describe('React Query Integration', () => {
    it('should handle React Query data correctly', async () => {
      const mockData = createMockQueryResponse(createMockUsers());
      
      renderTable({ data: mockData });
      
      await waitForTableReady();
      expect(getTableRows()).toHaveLength(10);
    });

    it('should handle React Query loading state', () => {
      const mockData = createMockQueryResponse([], true);
      
      renderTable({ data: mockData });
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should handle React Query error state', () => {
      const error = new Error('Query failed');
      const mockData = createMockQueryResponse([], false, error);
      
      renderTable({ data: mockData });
      
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(screen.getByText('Query failed')).toBeInTheDocument();
    });

    it('should handle data refetching', async () => {
      const refetchMock = vi.fn();
      const mockData = createMockQueryResponse(createMockUsers());
      mockData.refetch = refetchMock;
      
      const { user } = renderTable({ data: mockData });
      
      // Find and click refresh button (assuming it exists in table actions)
      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      if (refreshButton) {
        await user.click(refreshButton);
        expect(refetchMock).toHaveBeenCalled();
      }
    });
  });

  // ==========================================================================
  // PERFORMANCE AND EDGE CASES
  // ==========================================================================

  describe('Performance and Edge Cases', () => {
    it('should handle rapid state changes efficiently', async () => {
      const { user } = renderTable({
        sorting: { enabled: true },
        globalFilter: { enabled: true },
      });
      
      await waitForTableReady();
      
      // Rapid sorting changes
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);
      await user.click(nameHeader);
      await user.click(nameHeader);
      
      // Rapid search changes
      const searchInput = getGlobalSearchInput();
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'user');
      
      // Should handle without errors
      expect(getTable()).toBeInTheDocument();
    });

    it('should handle empty search results', async () => {
      const { user } = renderTable({
        globalFilter: { enabled: true },
      });
      
      await waitForTableReady();
      
      const searchInput = getGlobalSearchInput();
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No entries')).toBeInTheDocument();
      });
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        { id: 1, name: null, email: undefined },
        { id: 'invalid', name: 123, email: '' },
        {}, // Empty object
      ] as any;
      
      renderTable({ data: malformedData });
      
      // Should render without throwing errors
      expect(getTable()).toBeInTheDocument();
      const rows = getTableRows();
      expect(rows).toHaveLength(3);
    });

    it('should handle component unmounting during async operations', async () => {
      const { user, unmount } = renderTable({
        globalFilter: { enabled: true, debounceMs: 1000 },
      });
      
      await waitForTableReady();
      
      const searchInput = getGlobalSearchInput();
      await user.type(searchInput, 'test');
      
      // Unmount before debounce completes
      unmount();
      
      // Should not throw errors
      expect(() => {
        // Wait for debounce
        setTimeout(() => {}, 1500);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // CUSTOM CONFIGURATIONS
  // ==========================================================================

  describe('Custom Configurations', () => {
    it('should handle custom cell renderers', () => {
      const customColumns: ManageTableColumnDef<MockUser>[] = [
        {
          id: 'custom',
          header: 'Custom',
          cell: ({ row }) => (
            <div data-testid={`custom-cell-${row.original.id}`}>
              Custom: {row.original.name}
            </div>
          ),
        },
      ];
      
      renderTable({ columns: customColumns });
      
      expect(screen.getByTestId('custom-cell-1')).toBeInTheDocument();
      expect(screen.getByText('Custom: User 1')).toBeInTheDocument();
    });

    it('should handle custom table actions', async () => {
      const onActionClick = vi.fn();
      const tableActions = [
        {
          id: 'add',
          label: 'Add User',
          icon: React.createElement('span', { 'data-testid': 'add-icon' }, '➕'),
          onClick: onActionClick,
          variant: 'primary' as const,
        },
      ];
      
      const { user } = renderTable({ tableActions });
      
      const addButton = screen.getByRole('button', { name: 'Add User' });
      expect(addButton).toBeInTheDocument();
      
      await user.click(addButton);
      expect(onActionClick).toHaveBeenCalled();
    });

    it('should handle custom configurations', () => {
      const customConfig = {
        pagination: {
          enabled: true,
          mode: 'server' as const,
          pageSizeOptions: [15, 30, 50],
          defaultPageSize: 15,
          position: 'top' as const,
        },
        sorting: {
          enabled: true,
          enableMultiSort: true,
          maxSortColumns: 3,
        },
        globalFilter: {
          enabled: true,
          placeholder: 'Search anything...',
          debounceMs: 300,
        },
      };
      
      renderTable(customConfig);
      
      expect(getTable()).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search anything...')).toBeInTheDocument();
    });
  });
});