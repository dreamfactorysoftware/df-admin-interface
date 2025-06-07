/**
 * Comprehensive Vitest test suite for LimitsTable React component
 * 
 * Replaces Jest-based Angular table testing with React Testing Library patterns,
 * MSW for realistic API mocking, and comprehensive coverage of table interactions,
 * sorting, filtering, pagination, and CRUD operations with accessibility compliance.
 * 
 * @fileoverview Test suite for limits-table component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, within, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-dom/extend-expect';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Component and types
import { LimitsTable } from './limits-table';
import type { 
  LimitTableRowData, 
  LimitListTableProps,
  LimitUsageStats 
} from '../types';

// Test utilities and mocks
import { 
  renderWithProviders, 
  createTestQueryClient,
  mockToast 
} from '../../../test/utils/test-utils';
import { 
  createMockLimitData, 
  createMockUsageStats,
  createPaginationMeta 
} from '../../../test/mocks/mock-data';
import { createErrorResponse } from '../../../test/mocks/error-responses';

// Add custom matchers
expect.extend(toHaveNoViolations);

// Mock API responses and data
const mockLimitsData: LimitTableRowData[] = [
  {
    id: 1,
    name: 'User API Rate Limit',
    limitType: 'user.calls_per_period',
    limitRate: '100 per hour',
    limitCounter: 'api.calls_made',
    user: 123,
    service: null,
    role: null,
    active: true,
    description: 'Rate limit for authenticated users',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'admin@dreamfactory.com',
    currentUsage: 45,
    period: { value: 1, unit: 'hour' }
  },
  {
    id: 2,
    name: 'Database Service Limit',
    limitType: 'service.calls_per_period',
    limitRate: '1000 per day',
    limitCounter: 'db.calls_made',
    user: null,
    service: 456,
    role: null,
    active: false,
    description: 'Database service rate limiting',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    createdBy: 'admin@dreamfactory.com',
    currentUsage: 750,
    period: { value: 1, unit: 'day' }
  },
  {
    id: 3,
    name: 'Admin Role Limit',
    limitType: 'api.calls_per_period',
    limitRate: '500 per minute',
    limitCounter: 'api.calls_made',
    user: null,
    service: null,
    role: 789,
    active: true,
    description: 'Rate limit for admin role users',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-13T16:45:00Z',
    createdBy: 'superadmin@dreamfactory.com',
    currentUsage: 25,
    period: { value: 1, unit: 'minute' }
  }
];

const mockUsageStats: Record<number, LimitUsageStats> = {
  1: {
    limitId: 1,
    currentUsage: 45,
    maxAllowed: 100,
    usagePercentage: 45,
    timeUntilReset: 3600,
    violations: 0,
    history: [
      { period: '2024-01-15T09:00:00Z', usage: 42, violations: 0 },
      { period: '2024-01-15T08:00:00Z', usage: 38, violations: 0 }
    ]
  },
  2: {
    limitId: 2,
    currentUsage: 750,
    maxAllowed: 1000,
    usagePercentage: 75,
    timeUntilReset: 54000,
    violations: 1,
    history: [
      { period: '2024-01-14T00:00:00Z', usage: 890, violations: 2 },
      { period: '2024-01-13T00:00:00Z', usage: 680, violations: 0 }
    ]
  },
  3: {
    limitId: 3,
    currentUsage: 25,
    maxAllowed: 500,
    usagePercentage: 5,
    timeUntilReset: 45,
    violations: 0,
    history: [
      { period: '2024-01-13T16:44:00Z', usage: 22, violations: 0 },
      { period: '2024-01-13T16:43:00Z', usage: 18, violations: 0 }
    ]
  }
};

// MSW server setup for API mocking
const server = setupServer(
  // Get limits list with pagination, filtering, and sorting
  http.get('/api/v2/system/limit', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('filter');
    const sort = url.searchParams.get('order');
    const activeFilter = url.searchParams.get('active');

    let filteredData = [...mockLimitsData];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(limit => 
        limit.name.toLowerCase().includes(searchLower) ||
        limit.description?.toLowerCase().includes(searchLower) ||
        limit.limitType.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filter
    if (activeFilter !== null) {
      const isActive = activeFilter === 'true';
      filteredData = filteredData.filter(limit => limit.active === isActive);
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(' ');
      filteredData.sort((a, b) => {
        const aValue = a[field as keyof LimitTableRowData];
        const bValue = b[field as keyof LimitTableRowData];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);

    return HttpResponse.json({
      resource: paginatedData,
      meta: {
        count: paginatedData.length,
        total: filteredData.length,
        offset,
        limit
      }
    });
  }),

  // Get individual limit details
  http.get('/api/v2/system/limit/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const limit = mockLimitsData.find(l => l.id === id);
    
    if (!limit) {
      return HttpResponse.json(
        createErrorResponse(404, 'Limit not found'),
        { status: 404 }
      );
    }

    return HttpResponse.json({ resource: limit });
  }),

  // Get limit usage statistics
  http.get('/api/v2/system/limit/:id/usage', ({ params }) => {
    const id = parseInt(params.id as string);
    const usage = mockUsageStats[id];
    
    if (!usage) {
      return HttpResponse.json(
        createErrorResponse(404, 'Usage stats not found'),
        { status: 404 }
      );
    }

    return HttpResponse.json({ resource: usage });
  }),

  // Create new limit
  http.post('/api/v2/system/limit', async ({ request }) => {
    const newLimit = await request.json() as Partial<LimitTableRowData>;
    const createdLimit: LimitTableRowData = {
      id: Date.now(), // Simple ID generation for testing
      name: newLimit.name || 'New Limit',
      limitType: newLimit.limitType || 'api.calls_per_period',
      limitRate: newLimit.limitRate || '100 per hour',
      limitCounter: newLimit.limitCounter || 'api.calls_made',
      user: newLimit.user || null,
      service: newLimit.service || null,
      role: newLimit.role || null,
      active: newLimit.active ?? true,
      description: newLimit.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin@dreamfactory.com',
      currentUsage: 0,
      period: newLimit.period || { value: 1, unit: 'hour' }
    };

    mockLimitsData.push(createdLimit);
    return HttpResponse.json({ resource: createdLimit }, { status: 201 });
  }),

  // Update existing limit
  http.patch('/api/v2/system/limit/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const updates = await request.json() as Partial<LimitTableRowData>;
    const limitIndex = mockLimitsData.findIndex(l => l.id === id);
    
    if (limitIndex === -1) {
      return HttpResponse.json(
        createErrorResponse(404, 'Limit not found'),
        { status: 404 }
      );
    }

    const updatedLimit = {
      ...mockLimitsData[limitIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    mockLimitsData[limitIndex] = updatedLimit;
    return HttpResponse.json({ resource: updatedLimit });
  }),

  // Delete limit
  http.delete('/api/v2/system/limit/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const limitIndex = mockLimitsData.findIndex(l => l.id === id);
    
    if (limitIndex === -1) {
      return HttpResponse.json(
        createErrorResponse(404, 'Limit not found'),
        { status: 404 }
      );
    }

    mockLimitsData.splice(limitIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Bulk operations
  http.patch('/api/v2/system/limit', async ({ request }) => {
    const { ids, data } = await request.json() as { ids: number[], data: Partial<LimitTableRowData> };
    
    const results = ids.map(id => {
      const limitIndex = mockLimitsData.findIndex(l => l.id === id);
      if (limitIndex === -1) {
        return { id, success: false, error: 'Limit not found' };
      }

      mockLimitsData[limitIndex] = {
        ...mockLimitsData[limitIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };

      return { id, success: true };
    });

    return HttpResponse.json({ 
      success: true, 
      message: 'Bulk operation completed',
      results 
    });
  }),

  // Bulk delete
  http.delete('/api/v2/system/limit', async ({ request }) => {
    const { ids } = await request.json() as { ids: number[] };
    
    const results = ids.map(id => {
      const limitIndex = mockLimitsData.findIndex(l => l.id === id);
      if (limitIndex === -1) {
        return { id, success: false, error: 'Limit not found' };
      }

      mockLimitsData.splice(limitIndex, 1);
      return { id, success: true };
    });

    return HttpResponse.json({ 
      success: true, 
      message: 'Bulk deletion completed',
      results 
    });
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/v2/system/limit/error/500', () => {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal server error'),
      { status: 500 }
    );
  }),

  http.get('/api/v2/system/limit/error/403', () => {
    return HttpResponse.json(
      createErrorResponse(403, 'Insufficient permissions'),
      { status: 403 }
    );
  })
);

// Setup and teardown
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  // Reset mock data to original state
  mockLimitsData.length = 0;
  mockLimitsData.push(
    {
      id: 1,
      name: 'User API Rate Limit',
      limitType: 'user.calls_per_period',
      limitRate: '100 per hour',
      limitCounter: 'api.calls_made',
      user: 123,
      service: null,
      role: null,
      active: true,
      description: 'Rate limit for authenticated users',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin@dreamfactory.com',
      currentUsage: 45,
      period: { value: 1, unit: 'hour' }
    },
    {
      id: 2,
      name: 'Database Service Limit',
      limitType: 'service.calls_per_period',
      limitRate: '1000 per day',
      limitCounter: 'db.calls_made',
      user: null,
      service: 456,
      role: null,
      active: false,
      description: 'Database service rate limiting',
      createdAt: '2024-01-14T14:30:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      createdBy: 'admin@dreamfactory.com',
      currentUsage: 750,
      period: { value: 1, unit: 'day' }
    },
    {
      id: 3,
      name: 'Admin Role Limit',
      limitType: 'api.calls_per_period',
      limitRate: '500 per minute',
      limitCounter: 'api.calls_made',
      user: null,
      service: null,
      role: 789,
      active: true,
      description: 'Rate limit for admin role users',
      createdAt: '2024-01-13T16:45:00Z',
      updatedAt: '2024-01-13T16:45:00Z',
      createdBy: 'superadmin@dreamfactory.com',
      currentUsage: 25,
      period: { value: 1, unit: 'minute' }
    }
  );
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Test wrapper component with providers
const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Helper function to render component with providers
const renderLimitsTable = (props: Partial<LimitListTableProps> = {}) => {
  const defaultProps: LimitListTableProps = {
    data: mockLimitsData,
    loading: false,
    error: null,
    pagination: createPaginationMeta({ total: mockLimitsData.length }),
    selection: {
      selectedIds: [],
      onSelectionChange: vi.fn(),
      onSelectAll: vi.fn(),
      onClearSelection: vi.fn()
    },
    sort: {
      field: 'name',
      direction: 'asc',
      onSortChange: vi.fn()
    },
    filters: {
      active: undefined,
      search: '',
      limitType: undefined,
      onFilterChange: vi.fn()
    },
    actions: {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onToggleActive: vi.fn(),
      onBulkAction: vi.fn()
    },
    display: {
      showUsageStats: true,
      showActions: true,
      showSelection: true,
      compact: false
    },
    accessibility: {
      tableCaption: 'API Rate Limits Management Table',
      announceChanges: true
    },
    ...props
  };

  return renderWithProviders(<LimitsTable {...defaultProps} />, {
    wrapper: TestWrapper
  });
};

describe('LimitsTable Component', () => {
  describe('Basic Rendering and Structure', () => {
    it('renders table with correct structure and accessibility attributes', async () => {
      renderLimitsTable();

      // Check table exists with proper caption
      const table = screen.getByRole('table', { name: /api rate limits management table/i });
      expect(table).toBeInTheDocument();

      // Check table headers
      expect(screen.getByRole('columnheader', { name: /limit name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /rate/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /usage/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /target/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Check data rows are rendered
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 3 data rows + 1 header row

      // Verify first data row content
      expect(screen.getByText('User API Rate Limit')).toBeInTheDocument();
      expect(screen.getByText('100 per hour')).toBeInTheDocument();
      expect(screen.getByText(/45\/100/)).toBeInTheDocument();
    });

    it('passes accessibility audit', async () => {
      const { container } = renderLimitsTable();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('displays loading state correctly', () => {
      renderLimitsTable({ loading: true, data: [] });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading limits/i)).toBeInTheDocument();
      
      // Should show loading skeleton rows
      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows).toHaveLength(5); // Default skeleton count
    });

    it('displays empty state when no data', () => {
      renderLimitsTable({ data: [], loading: false });

      expect(screen.getByText(/no limits found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first rate limit/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create limit/i })).toBeInTheDocument();
    });

    it('displays error state correctly', () => {
      const errorMessage = 'Failed to load limits';
      renderLimitsTable({ 
        error: createErrorResponse(500, errorMessage),
        data: [],
        loading: false 
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Data Display and Formatting', () => {
    it('displays limit data with correct formatting', () => {
      renderLimitsTable();

      // Test rate formatting
      expect(screen.getByText('100 per hour')).toBeInTheDocument();
      expect(screen.getByText('1000 per day')).toBeInTheDocument();
      expect(screen.getByText('500 per minute')).toBeInTheDocument();

      // Test usage display with progress indicators
      const usageElements = screen.getAllByTestId('usage-indicator');
      expect(usageElements).toHaveLength(3);

      // Test status badges
      const activeElements = screen.getAllByText('Active');
      const inactiveElements = screen.getAllByText('Inactive');
      expect(activeElements).toHaveLength(2);
      expect(inactiveElements).toHaveLength(1);

      // Test target assignments
      expect(screen.getByText(/user: 123/i)).toBeInTheDocument();
      expect(screen.getByText(/service: 456/i)).toBeInTheDocument();
      expect(screen.getByText(/role: 789/i)).toBeInTheDocument();
    });

    it('displays usage statistics with progress bars', () => {
      renderLimitsTable({ display: { showUsageStats: true, showActions: true, showSelection: true, compact: false } });

      // Check progress bars exist
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);

      // Check progress values
      expect(screen.getByText('45%')).toBeInTheDocument(); // User limit: 45/100
      expect(screen.getByText('75%')).toBeInTheDocument(); // DB limit: 750/1000
      expect(screen.getByText('5%')).toBeInTheDocument();  // Admin limit: 25/500

      // Check usage counters
      expect(screen.getByText('45 / 100')).toBeInTheDocument();
      expect(screen.getByText('750 / 1000')).toBeInTheDocument();
      expect(screen.getByText('25 / 500')).toBeInTheDocument();
    });

    it('hides usage statistics when disabled', () => {
      renderLimitsTable({ display: { showUsageStats: false, showActions: true, showSelection: true, compact: false } });

      const progressBars = screen.queryAllByRole('progressbar');
      expect(progressBars).toHaveLength(0);
      
      expect(screen.queryByText('45%')).not.toBeInTheDocument();
    });

    it('displays compact mode correctly', () => {
      renderLimitsTable({ display: { showUsageStats: true, showActions: true, showSelection: true, compact: true } });

      // In compact mode, descriptions should be hidden
      expect(screen.queryByText('Rate limit for authenticated users')).not.toBeInTheDocument();
      
      // Table should have compact styling classes
      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-compact');
    });
  });

  describe('Sorting Functionality', () => {
    const user = userEvent.setup();

    it('handles column header clicks for sorting', async () => {
      const mockSortChange = vi.fn();
      renderLimitsTable({
        sort: {
          field: 'name',
          direction: 'asc',
          onSortChange: mockSortChange
        }
      });

      // Click on name column header
      const nameHeader = screen.getByRole('columnheader', { name: /limit name/i });
      await user.click(nameHeader);

      expect(mockSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('displays sort indicators correctly', () => {
      renderLimitsTable({
        sort: {
          field: 'name',
          direction: 'asc',
          onSortChange: vi.fn()
        }
      });

      const nameHeader = screen.getByRole('columnheader', { name: /limit name/i });
      const sortIcon = within(nameHeader).getByTestId('sort-asc-icon');
      expect(sortIcon).toBeInTheDocument();
    });

    it('updates sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      const mockSortChange = vi.fn();
      
      renderLimitsTable({
        sort: {
          field: 'name',
          direction: 'asc',
          onSortChange: mockSortChange
        }
      });

      const nameHeader = screen.getByRole('columnheader', { name: /limit name/i });
      
      // First click should change to desc
      await user.click(nameHeader);
      expect(mockSortChange).toHaveBeenCalledWith('name', 'desc');

      // Update props to reflect new sort direction
      renderLimitsTable({
        sort: {
          field: 'name',
          direction: 'desc',
          onSortChange: mockSortChange
        }
      });

      // Second click should change to asc
      await user.click(nameHeader);
      expect(mockSortChange).toHaveBeenCalledWith('name', 'asc');
    });

    it('handles keyboard navigation for sorting', async () => {
      const user = userEvent.setup();
      const mockSortChange = vi.fn();
      
      renderLimitsTable({
        sort: {
          field: 'name',
          direction: 'asc',
          onSortChange: mockSortChange
        }
      });

      const nameHeader = screen.getByRole('columnheader', { name: /limit name/i });
      nameHeader.focus();
      
      await user.keyboard('{Enter}');
      expect(mockSortChange).toHaveBeenCalledWith('name', 'desc');

      await user.keyboard('{Space}');
      expect(mockSortChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filtering Functionality', () => {
    const user = userEvent.setup();

    it('handles search input changes', async () => {
      const mockFilterChange = vi.fn();
      renderLimitsTable({
        filters: {
          active: undefined,
          search: '',
          limitType: undefined,
          onFilterChange: mockFilterChange
        }
      });

      const searchInput = screen.getByRole('textbox', { name: /search limits/i });
      await user.type(searchInput, 'user');

      await waitFor(() => {
        expect(mockFilterChange).toHaveBeenCalledWith({
          search: 'user'
        });
      });
    });

    it('handles active status filter changes', async () => {
      const user = userEvent.setup();
      const mockFilterChange = vi.fn();
      
      renderLimitsTable({
        filters: {
          active: undefined,
          search: '',
          limitType: undefined,
          onFilterChange: mockFilterChange
        }
      });

      const activeFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(activeFilter);
      
      const activeOption = screen.getByRole('option', { name: /active only/i });
      await user.click(activeOption);

      expect(mockFilterChange).toHaveBeenCalledWith({
        active: true
      });
    });

    it('handles limit type filter changes', async () => {
      const user = userEvent.setup();
      const mockFilterChange = vi.fn();
      
      renderLimitsTable({
        filters: {
          active: undefined,
          search: '',
          limitType: undefined,
          onFilterChange: mockFilterChange
        }
      });

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i });
      await user.click(typeFilter);
      
      const userTypeOption = screen.getByRole('option', { name: /user limits/i });
      await user.click(userTypeOption);

      expect(mockFilterChange).toHaveBeenCalledWith({
        limitType: 'user.calls_per_period'
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockFilterChange = vi.fn();
      
      renderLimitsTable({
        filters: {
          active: true,
          search: 'test search',
          limitType: 'user.calls_per_period',
          onFilterChange: mockFilterChange
        }
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(mockFilterChange).toHaveBeenCalledWith({
        active: undefined,
        search: '',
        limitType: undefined
      });
    });
  });

  describe('Selection and Bulk Operations', () => {
    const user = userEvent.setup();

    it('handles individual row selection', async () => {
      const mockSelectionChange = vi.fn();
      renderLimitsTable({
        selection: {
          selectedIds: [],
          onSelectionChange: mockSelectionChange,
          onSelectAll: vi.fn(),
          onClearSelection: vi.fn()
        }
      });

      const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
      await user.click(firstCheckbox);

      expect(mockSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('handles select all functionality', async () => {
      const user = userEvent.setup();
      const mockSelectAll = vi.fn();
      
      renderLimitsTable({
        selection: {
          selectedIds: [],
          onSelectionChange: vi.fn(),
          onSelectAll: mockSelectAll,
          onClearSelection: vi.fn()
        }
      });

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]; // Header checkbox
      await user.click(selectAllCheckbox);

      expect(mockSelectAll).toHaveBeenCalled();
    });

    it('shows bulk actions when items are selected', () => {
      renderLimitsTable({
        selection: {
          selectedIds: [1, 2],
          onSelectionChange: vi.fn(),
          onSelectAll: vi.fn(),
          onClearSelection: vi.fn()
        }
      });

      expect(screen.getByText('2 items selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk activate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk deactivate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk delete/i })).toBeInTheDocument();
    });

    it('handles bulk activate operation', async () => {
      const user = userEvent.setup();
      const mockBulkAction = vi.fn();
      
      renderLimitsTable({
        selection: {
          selectedIds: [1, 2],
          onSelectionChange: vi.fn(),
          onSelectAll: vi.fn(),
          onClearSelection: vi.fn()
        },
        actions: {
          onEdit: vi.fn(),
          onDelete: vi.fn(),
          onToggleActive: vi.fn(),
          onBulkAction: mockBulkAction
        }
      });

      const bulkActivateButton = screen.getByRole('button', { name: /bulk activate/i });
      await user.click(bulkActivateButton);

      expect(mockBulkAction).toHaveBeenCalledWith('activate', [1, 2]);
    });

    it('handles bulk delete with confirmation', async () => {
      const user = userEvent.setup();
      const mockBulkAction = vi.fn();
      
      renderLimitsTable({
        selection: {
          selectedIds: [1, 2],
          onSelectionChange: vi.fn(),
          onSelectAll: vi.fn(),
          onClearSelection: vi.fn()
        },
        actions: {
          onEdit: vi.fn(),
          onDelete: vi.fn(),
          onToggleActive: vi.fn(),
          onBulkAction: mockBulkAction
        }
      });

      const bulkDeleteButton = screen.getByRole('button', { name: /bulk delete/i });
      await user.click(bulkDeleteButton);

      // Should show confirmation dialog
      const confirmDialog = await screen.findByRole('dialog');
      expect(confirmDialog).toBeInTheDocument();
      expect(screen.getByText(/delete 2 selected limits/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      expect(mockBulkAction).toHaveBeenCalledWith('delete', [1, 2]);
    });
  });

  describe('Individual Row Actions', () => {
    const user = userEvent.setup();

    it('handles edit button clicks', async () => {
      const mockEdit = vi.fn();
      renderLimitsTable({
        actions: {
          onEdit: mockEdit,
          onDelete: vi.fn(),
          onToggleActive: vi.fn(),
          onBulkAction: vi.fn()
        }
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(mockEdit).toHaveBeenCalledWith(mockLimitsData[0]);
    });

    it('handles delete button clicks with confirmation', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      
      renderLimitsTable({
        actions: {
          onEdit: vi.fn(),
          onDelete: mockDelete,
          onToggleActive: vi.fn(),
          onBulkAction: vi.fn()
        }
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      const confirmDialog = await screen.findByRole('dialog');
      expect(confirmDialog).toBeInTheDocument();
      expect(screen.getByText(/delete "user api rate limit"/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      expect(mockDelete).toHaveBeenCalledWith(mockLimitsData[0]);
    });

    it('handles toggle active status', async () => {
      const user = userEvent.setup();
      const mockToggleActive = vi.fn();
      
      renderLimitsTable({
        actions: {
          onEdit: vi.fn(),
          onDelete: vi.fn(),
          onToggleActive: mockToggleActive,
          onBulkAction: vi.fn()
        }
      });

      const toggleButtons = screen.getAllByRole('button', { name: /toggle status/i });
      await user.click(toggleButtons[0]);

      expect(mockToggleActive).toHaveBeenCalledWith(mockLimitsData[0]);
    });

    it('provides keyboard navigation for row actions', async () => {
      const user = userEvent.setup();
      const mockEdit = vi.fn();
      
      renderLimitsTable({
        actions: {
          onEdit: mockEdit,
          onDelete: vi.fn(),
          onToggleActive: vi.fn(),
          onBulkAction: vi.fn()
        }
      });

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      editButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockEdit).toHaveBeenCalledWith(mockLimitsData[0]);
    });
  });

  describe('Pagination', () => {
    const user = userEvent.setup();

    it('displays pagination controls when data spans multiple pages', () => {
      const paginationMeta = createPaginationMeta({
        total: 100,
        limit: 25,
        offset: 25
      });

      renderLimitsTable({
        pagination: paginationMeta
      });

      expect(screen.getByText('Showing 26-50 of 100')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      const paginationMeta = createPaginationMeta({
        total: 100,
        limit: 25,
        offset: 0
      });

      renderLimitsTable({
        pagination: paginationMeta
      });

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      const paginationMeta = createPaginationMeta({
        total: 100,
        limit: 25,
        offset: 75
      });

      renderLimitsTable({
        pagination: paginationMeta
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeDisabled();
    });

    it('handles page size changes', async () => {
      const user = userEvent.setup();
      const mockPaginationChange = vi.fn();
      
      renderLimitsTable({
        pagination: {
          ...createPaginationMeta({ total: 100 }),
          onPageChange: mockPaginationChange,
          onPageSizeChange: mockPaginationChange
        }
      });

      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      await user.click(pageSizeSelect);
      
      const option50 = screen.getByRole('option', { name: '50' });
      await user.click(option50);

      expect(mockPaginationChange).toHaveBeenCalledWith(0, 50);
    });
  });

  describe('Error Handling', () => {
    it('displays network error messages', () => {
      const networkError = createErrorResponse(0, 'Network connection failed');
      renderLimitsTable({
        error: networkError,
        data: [],
        loading: false
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('displays permission error messages', () => {
      const permissionError = createErrorResponse(403, 'Insufficient permissions to view limits');
      renderLimitsTable({
        error: permissionError,
        data: [],
        loading: false
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
    });

    it('displays generic server error messages', () => {
      const serverError = createErrorResponse(500, 'Internal server error');
      renderLimitsTable({
        error: serverError,
        data: [],
        loading: false
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('handles API errors during actions gracefully', async () => {
      const user = userEvent.setup();
      const mockEdit = vi.fn().mockRejectedValue(new Error('Update failed'));
      
      renderLimitsTable({
        actions: {
          onEdit: mockEdit,
          onDelete: vi.fn(),
          onToggleActive: vi.fn(),
          onBulkAction: vi.fn()
        }
      });

      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);

      // Should show error toast notification
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Performance and Virtualization', () => {
    it('handles large datasets efficiently', () => {
      // Create large dataset (1000+ items)
      const largeDataset = Array.from({ length: 1500 }, (_, index) => ({
        ...mockLimitsData[0],
        id: index + 1,
        name: `Limit ${index + 1}`,
        currentUsage: Math.floor(Math.random() * 100)
      }));

      const { container } = renderLimitsTable({
        data: largeDataset
      });

      // Should implement virtual scrolling for performance
      const virtualContainer = container.querySelector('[data-testid="virtual-container"]');
      expect(virtualContainer).toBeInTheDocument();

      // Should only render visible rows, not all 1500
      const renderedRows = screen.getAllByRole('row');
      expect(renderedRows.length).toBeLessThan(100); // Much less than total dataset
    });

    it('debounces search input for performance', async () => {
      const user = userEvent.setup();
      const mockFilterChange = vi.fn();
      
      renderLimitsTable({
        filters: {
          active: undefined,
          search: '',
          limitType: undefined,
          onFilterChange: mockFilterChange
        }
      });

      const searchInput = screen.getByRole('textbox', { name: /search limits/i });
      
      // Type quickly multiple characters
      await user.type(searchInput, 'quick typing');

      // Should debounce and only call once after delay
      await waitFor(() => {
        expect(mockFilterChange).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });

      expect(mockFilterChange).toHaveBeenCalledWith({
        search: 'quick typing'
      });
    });
  });

  describe('Accessibility Features', () => {
    const user = userEvent.setup();

    it('provides proper ARIA labels and roles', () => {
      renderLimitsTable();

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'API Rate Limits Management Table');

      // Check column headers have proper sort ARIA attributes
      const nameHeader = screen.getByRole('columnheader', { name: /limit name/i });
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Check selection checkboxes have proper labels
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('aria-label', 'Select all limits');
      expect(checkboxes[1]).toHaveAttribute('aria-label', 'Select User API Rate Limit');
    });

    it('announces changes to screen readers', async () => {
      const user = userEvent.setup();
      renderLimitsTable({
        accessibility: {
          tableCaption: 'API Rate Limits Management Table',
          announceChanges: true
        }
      });

      // Mock screen reader announcements
      const announceRegion = screen.getByRole('status', { name: /announcements/i });
      expect(announceRegion).toBeInTheDocument();

      // Select an item and verify announcement
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstCheckbox);

      await waitFor(() => {
        expect(announceRegion).toHaveTextContent(/selected user api rate limit/i);
      });
    });

    it('supports keyboard navigation throughout the table', async () => {
      const user = userEvent.setup();
      renderLimitsTable();

      // Tab navigation should work through all interactive elements
      await user.tab();
      expect(screen.getAllByRole('checkbox')[0]).toHaveFocus(); // Select all checkbox

      await user.tab();
      expect(screen.getByRole('textbox', { name: /search/i })).toHaveFocus(); // Search input

      await user.tab();
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toHaveFocus(); // Status filter

      // Test row navigation with arrow keys
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      firstRowCheckbox.focus();
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getAllByRole('checkbox')[2]).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(screen.getAllByRole('checkbox')[1]).toHaveFocus();
    });

    it('provides high contrast mode support', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderLimitsTable();
      
      // Should apply high contrast styles
      const table = container.querySelector('table');
      expect(table).toHaveClass('high-contrast');
    });

    it('supports reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderLimitsTable();
      
      // Animations should be disabled
      const loadingElements = container.querySelectorAll('.animate-pulse');
      loadingElements.forEach(element => {
        expect(element).toHaveClass('motion-reduce:animate-none');
      });
    });
  });

  describe('Integration with React Query', () => {
    it('displays optimistic updates during mutations', async () => {
      const user = userEvent.setup();
      
      // Mock a slow mutation to test optimistic updates
      server.use(
        http.patch('/api/v2/system/limit/:id', async ({ params }) => {
          // Simulate slow network
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({ 
            resource: { ...mockLimitsData[0], active: false } 
          });
        })
      );

      const mockToggleActive = vi.fn();
      renderLimitsTable({
        actions: {
          onEdit: vi.fn(),
          onDelete: vi.fn(),
          onToggleActive: mockToggleActive,
          onBulkAction: vi.fn()
        }
      });

      const toggleButton = screen.getAllByRole('button', { name: /toggle status/i })[0];
      await user.click(toggleButton);

      // Should show optimistic update immediately
      expect(screen.getByTestId('optimistic-indicator')).toBeInTheDocument();
      
      // Should show loading state
      expect(screen.getByTestId('mutation-loading')).toBeInTheDocument();
    });

    it('handles cache invalidation correctly', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      
      renderLimitsTable({
        actions: {
          onEdit: vi.fn(),
          onDelete: mockDelete,
          onToggleActive: vi.fn(),
          onBulkAction: vi.fn()
        }
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      // Confirm deletion
      const confirmDialog = await screen.findByRole('dialog');
      const confirmButton = within(confirmDialog).getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      // Should trigger cache invalidation and refetch
      await waitFor(() => {
        expect(screen.getByTestId('cache-refreshing')).toBeInTheDocument();
      });
    });

    it('displays stale data indicators when appropriate', () => {
      // Mock stale query state
      renderLimitsTable({
        data: mockLimitsData.map(limit => ({ ...limit, _isStale: true }))
      });

      // Should show stale data indicator
      expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
      expect(screen.getByText(/data may be outdated/i)).toBeInTheDocument();
    });
  });
});