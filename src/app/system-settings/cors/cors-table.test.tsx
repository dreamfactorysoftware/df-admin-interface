/**
 * Comprehensive Vitest unit tests for the CORS table component
 * 
 * Tests cover table rendering, virtualization, CORS operations, modal interactions,
 * and error scenarios with React Testing Library and MSW mocking.
 * 
 * Key Testing Areas:
 * - Virtualized table rendering with 1000+ entries per scaling requirements
 * - Modal accessibility testing with keyboard navigation per WCAG 2.1 AA compliance
 * - CORS operation testing with optimistic updates and rollback scenarios per Section 4.3.2
 * - Responsive table testing across mobile and desktop breakpoints per UI requirements
 * - Error state testing with comprehensive error recovery scenarios per Section 4.2
 * 
 * @fileoverview CORS table component tests
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup-tests';
import { CorsTable } from './cors-table';
import type { CorsConfig } from '../../../types/cors';

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Test wrapper component that provides React Query context
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
 * Custom render function with React Query provider
 */
const renderWithQueryClient = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options,
  });
};

/**
 * Generate mock CORS configuration data for testing
 */
const generateMockCorsConfig = (id: number, overrides: Partial<CorsConfig> = {}): CorsConfig => ({
  id,
  description: `CORS config ${id}`,
  enabled: true,
  path: `/api/v2/test${id}/*`,
  origin: `https://app${id}.example.com`,
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  header: 'Content-Type, Authorization, X-Requested-With',
  exposedHeader: null,
  maxAge: 3600,
  supportsCredentials: false,
  createdById: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModifiedById: 1,
  lastModifiedDate: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Generate large dataset for virtualization testing
 */
const generateLargeCorsDataset = (count: number): CorsConfig[] => {
  return Array.from({ length: count }, (_, index) => 
    generateMockCorsConfig(index + 1, {
      description: `Large dataset CORS config ${index + 1}`,
      path: `/api/v2/large${index + 1}/*`,
      origin: index % 2 === 0 ? 'https://app.example.com' : '*',
      enabled: index % 3 !== 0, // Mix of enabled/disabled
    })
  );
};

/**
 * Mock viewport resize for responsive testing
 */
const mockViewportResize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

/**
 * Mock IntersectionObserver for virtualization testing
 */
const mockIntersectionObserver = () => {
  const mockObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockObserver,
  });
  
  return mockObserver;
};

// ============================================================================
// TEST SUITE: BASIC COMPONENT RENDERING
// ============================================================================

describe('CorsTable Component - Basic Rendering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    mockIntersectionObserver();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders loading state initially', async () => {
    renderWithQueryClient(<CorsTable />);

    // Check for loading spinner and message
    expect(screen.getByText('Loading CORS configurations...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Verify spinner animation class
    const spinner = screen.getByRole('status').querySelector('[class*="animate-spin"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders table header with all required columns', async () => {
    // Mock successful API response
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: [generateMockCorsConfig(1)],
          meta: { count: 1, total: 1 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading CORS configurations...')).not.toBeInTheDocument();
    });

    // Check table header columns
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Path')).toBeInTheDocument();
    expect(screen.getByText('Origin')).toBeInTheDocument();
    expect(screen.getByText('Methods')).toBeInTheDocument();
    expect(screen.getByText('Max Age')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check select all checkbox
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    expect(selectAllCheckbox).toBeInTheDocument();
    expect(selectAllCheckbox).not.toBeChecked();
  });

  it('renders empty state when no CORS configurations exist', async () => {
    // Mock empty API response
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: [],
          meta: { count: 0, total: 0 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('No CORS configurations')).toBeInTheDocument();
    });

    expect(screen.getByText('Get started by creating a new CORS policy.')).toBeInTheDocument();
    
    // Check for empty state icon
    const emptyIcon = screen.getByRole('img', { hidden: true });
    expect(emptyIcon).toBeInTheDocument();
  });

  it('displays total count in header', async () => {
    const mockData = Array.from({ length: 25 }, (_, i) => generateMockCorsConfig(i + 1));
    
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 25, total: 25 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Manage Cross-Origin Resource Sharing policies (25 total)')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: VIRTUALIZED TABLE TESTING
// ============================================================================

describe('CorsTable Component - Virtualization', () => {
  beforeEach(() => {
    mockIntersectionObserver();
  });

  it('handles large datasets with virtualization (1000+ entries)', async () => {
    const largeDataset = generateLargeCorsDataset(1500);
    
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: largeDataset,
          meta: { count: 1500, total: 1500 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Manage Cross-Origin Resource Sharing policies (1500 total)')).toBeInTheDocument();
    });

    // Verify only visible rows are rendered (virtualization working)
    const visibleRows = screen.getAllByRole('row');
    // Should have header row + limited visible rows due to virtualization
    expect(visibleRows.length).toBeLessThan(50); // Much less than 1500
    expect(visibleRows.length).toBeGreaterThan(1); // But more than just header

    // Check that virtual container has correct height
    const virtualContainer = document.querySelector('[style*="height"]');
    expect(virtualContainer).toBeInTheDocument();
  });

  it('maintains scroll position during updates', async () => {
    const largeDataset = generateLargeCorsDataset(500);
    
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: largeDataset,
          meta: { count: 500, total: 500 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Manage Cross-Origin Resource Sharing policies (500 total)')).toBeInTheDocument();
    });

    // Simulate scrolling to a specific position
    const scrollContainer = document.querySelector('[ref]');
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
    }

    // Trigger a refresh
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify scroll position is maintained (virtualization should handle this)
    await waitFor(() => {
      expect(scrollContainer?.scrollTop).toBeGreaterThan(0);
    });
  });

  it('renders rows outside viewport on demand', async () => {
    const largeDataset = generateLargeCorsDataset(200);
    
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: largeDataset,
          meta: { count: 200, total: 200 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Manage Cross-Origin Resource Sharing policies (200 total)')).toBeInTheDocument();
    });

    // Check that first few items are visible
    expect(screen.getByText('/api/v2/large1/*')).toBeInTheDocument();
    
    // Items far down should not be in DOM initially
    expect(screen.queryByText('/api/v2/large150/*')).not.toBeInTheDocument();
    
    // Simulate scrolling down
    const scrollContainer = document.querySelector('[style*="height: 600px"]');
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 3000 } });
    }

    // After scrolling, different items should be visible
    await waitFor(() => {
      // The exact item depends on virtualization logic, but should be different
      const visiblePaths = screen.getAllByText(/\/api\/v2\/large\d+\/\*/);
      expect(visiblePaths.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TEST SUITE: SEARCH AND FILTERING
// ============================================================================

describe('CorsTable Component - Search and Filtering', () => {
  const mockData = [
    generateMockCorsConfig(1, {
      path: '/api/v2/users/*',
      origin: 'https://app.example.com',
      description: 'User API CORS policy'
    }),
    generateMockCorsConfig(2, {
      path: '/api/v2/products/*',
      origin: 'https://shop.example.com',
      description: 'Product API CORS policy'
    }),
    generateMockCorsConfig(3, {
      path: '/api/v2/orders/*',
      origin: '*',
      description: 'Order API CORS policy'
    }),
  ];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 3, total: 3 }
        });
      })
    );
  });

  it('filters CORS configurations by path', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    });

    // Search for "users"
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'users');

    // Should show only user-related config
    expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    expect(screen.queryByText('/api/v2/products/*')).not.toBeInTheDocument();
    expect(screen.queryByText('/api/v2/orders/*')).not.toBeInTheDocument();
  });

  it('filters CORS configurations by origin', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('https://app.example.com')).toBeInTheDocument();
    });

    // Search for "shop"
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'shop');

    // Should show only shop-related config
    expect(screen.getByText('https://shop.example.com')).toBeInTheDocument();
    expect(screen.queryByText('https://app.example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('filters CORS configurations by description', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('User API CORS policy')).toBeInTheDocument();
    });

    // Search for "Product"
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'Product');

    // Should show only product-related config
    expect(screen.getByText('Product API CORS policy')).toBeInTheDocument();
    expect(screen.queryByText('User API CORS policy')).not.toBeInTheDocument();
    expect(screen.queryByText('Order API CORS policy')).not.toBeInTheDocument();
  });

  it('shows no results message when search yields no matches', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    });

    // Search for non-existent term
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'nonexistent');

    // Should show empty state with search message
    expect(screen.getByText('No CORS configurations')).toBeInTheDocument();
    expect(screen.getByText('No configurations match your search.')).toBeInTheDocument();
  });

  it('clears search and shows all results', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    });

    // Search for "users"
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'users');

    // Verify filtering
    expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    expect(screen.queryByText('/api/v2/products/*')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Should show all results again
    expect(screen.getByText('/api/v2/users/*')).toBeInTheDocument();
    expect(screen.getByText('/api/v2/products/*')).toBeInTheDocument();
    expect(screen.getByText('/api/v2/orders/*')).toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE: ROW SELECTION AND BULK OPERATIONS
// ============================================================================

describe('CorsTable Component - Row Selection', () => {
  const mockData = [
    generateMockCorsConfig(1),
    generateMockCorsConfig(2),
    generateMockCorsConfig(3),
  ];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 3, total: 3 }
        });
      })
    );
  });

  it('selects individual rows', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Get all row checkboxes (excluding select all)
    const rowCheckboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = rowCheckboxes[1]; // [0] is select all

    // Select first row
    await user.click(firstRowCheckbox);
    expect(firstRowCheckbox).toBeChecked();

    // Other rows should remain unselected
    expect(rowCheckboxes[2]).not.toBeChecked();
    expect(rowCheckboxes[3]).not.toBeChecked();
  });

  it('selects all rows with select all checkbox', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Get select all checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];

    // Click select all
    await user.click(selectAllCheckbox);

    // All checkboxes should be checked
    const allCheckboxes = screen.getAllByRole('checkbox');
    allCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('deselects all rows when select all is unchecked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];

    // Select all first
    await user.click(selectAllCheckbox);
    
    // Then deselect all
    await user.click(selectAllCheckbox);

    // All checkboxes should be unchecked
    const allCheckboxes = screen.getAllByRole('checkbox');
    allCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('updates select all state based on individual selections', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    const allCheckboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = allCheckboxes[0];
    const rowCheckboxes = allCheckboxes.slice(1);

    // Select all individual rows manually
    for (const checkbox of rowCheckboxes) {
      await user.click(checkbox);
    }

    // Select all should become checked
    expect(selectAllCheckbox).toBeChecked();

    // Deselect one row
    await user.click(rowCheckboxes[0]);

    // Select all should become unchecked
    expect(selectAllCheckbox).not.toBeChecked();
  });
});

// ============================================================================
// TEST SUITE: DELETE MODAL AND ACCESSIBILITY
// ============================================================================

describe('CorsTable Component - Delete Modal', () => {
  const mockData = [generateMockCorsConfig(1, { path: '/api/v2/test/*' })];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 1, total: 1 }
        });
      })
    );
  });

  it('opens delete confirmation modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Modal should be open
    expect(screen.getByText('Delete CORS Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete the CORS configuration for/)).toBeInTheDocument();
    expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Delete CORS Configuration')).not.toBeInTheDocument();
    });
  });

  it('supports keyboard navigation in modal per WCAG 2.1 AA compliance', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Modal should be open and focused
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test keyboard navigation
    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

    await user.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus();

    // Test escape key
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('Delete CORS Configuration')).not.toBeInTheDocument();
    });
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Test forward focus trap
    await user.keyboard('{Tab}'); // Cancel button
    await user.keyboard('{Tab}'); // Delete button
    await user.keyboard('{Tab}'); // Should cycle back to Cancel
    
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

    // Test backward focus trap
    await user.keyboard('{Shift>}{Tab}{/Shift}'); // Should go to Delete button
    expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus();
  });

  it('has proper ARIA attributes for accessibility', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Check modal ARIA attributes
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    
    const modalTitle = screen.getByText('Delete CORS Configuration');
    expect(modalTitle).toBeInTheDocument();
    
    // Check for proper labeling
    expect(modal).toHaveAccessibleName();
  });
});

// ============================================================================
// TEST SUITE: CORS OPERATIONS WITH REACT QUERY
// ============================================================================

describe('CorsTable Component - CORS Operations', () => {
  const mockData = [generateMockCorsConfig(1, { path: '/api/v2/test/*' })];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 1, total: 1 }
        });
      })
    );
  });

  it('performs optimistic delete with success', async () => {
    const user = userEvent.setup();
    
    // Mock successful delete
    server.use(
      http.delete('/api/v2/system/cors/1', () => {
        return HttpResponse.json({ success: true, resource: mockData[0] });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open delete modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmButton);

    // Row should disappear immediately (optimistic update)
    await waitFor(() => {
      expect(screen.queryByText('/api/v2/test/*')).not.toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText('No CORS configurations')).toBeInTheDocument();
  });

  it('performs optimistic delete with rollback on error', async () => {
    const user = userEvent.setup();
    
    // Mock failed delete
    server.use(
      http.delete('/api/v2/system/cors/1', () => {
        return HttpResponse.json(
          { error: 'Failed to delete CORS config: 500' },
          { status: 500 }
        );
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open delete modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmButton);

    // Row should disappear initially (optimistic update)
    await waitFor(() => {
      expect(screen.queryByText('/api/v2/test/*')).not.toBeInTheDocument();
    });

    // Then rollback on error - row should reappear
    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('disables delete buttons while deletion is in progress', async () => {
    const user = userEvent.setup();
    
    // Mock slow delete response
    server.use(
      http.delete('/api/v2/system/cors/1', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return HttpResponse.json({ success: true, resource: mockData[0] });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Open delete modal
    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    await user.click(deleteButton);

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmButton);

    // Modal should close and button should show loading state
    await waitFor(() => {
      expect(screen.queryByText('Delete CORS Configuration')).not.toBeInTheDocument();
    });

    // Delete button in table should be disabled
    const tableDeleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    expect(tableDeleteButton).toBeDisabled();
  });

  it('calls onEdit callback when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();

    renderWithQueryClient(<CorsTable onEdit={mockOnEdit} />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit cors configuration/i });
    await user.click(editButton);

    // Should call onEdit with the CORS config
    expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      path: '/api/v2/test/*'
    }));
  });

  it('calls onRefresh callback when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnRefresh = vi.fn();

    renderWithQueryClient(<CorsTable onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Should call onRefresh
    expect(mockOnRefresh).toHaveBeenCalled();
  });
});

// ============================================================================
// TEST SUITE: ERROR HANDLING AND RECOVERY
// ============================================================================

describe('CorsTable Component - Error Handling', () => {
  beforeEach(() => {
    mockIntersectionObserver();
  });

  it('displays error state when API request fails', async () => {
    // Mock API error
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load CORS configurations')).toBeInTheDocument();
    
    // Check for error icon
    const errorIcon = screen.getByRole('img', { hidden: true });
    expect(errorIcon).toBeInTheDocument();
    
    // Check for retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('allows retry after error', async () => {
    const user = userEvent.setup();
    
    // First request fails
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    // Mock successful retry
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: [generateMockCorsConfig(1)],
          meta: { count: 1, total: 1 }
        });
      })
    );

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Should show loading then data
    expect(screen.getByText('Loading CORS configurations...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });
  });

  it('displays specific error message from API response', async () => {
    // Mock API error with specific message
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    // Should show specific error message
    expect(screen.getByText('HTTP error! status: 401')).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    server.use(
      http.get('/api/v2/system/cors', () => {
        throw new Error('Network error');
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load CORS configurations')).toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE: RESPONSIVE DESIGN TESTING
// ============================================================================

describe('CorsTable Component - Responsive Design', () => {
  const mockData = [
    generateMockCorsConfig(1),
    generateMockCorsConfig(2),
    generateMockCorsConfig(3),
  ];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 3, total: 3 }
        });
      })
    );
  });

  it('adapts layout for mobile viewport (320px)', async () => {
    // Set mobile viewport
    mockViewportResize(320, 568);

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Check that header layout stacks vertically on mobile
    const header = screen.getByText('CORS Configurations').closest('div');
    expect(header).toHaveClass('flex-col', 'sm:flex-row');

    // Check that action buttons stack on mobile
    const searchContainer = screen.getByPlaceholderText('Search CORS policies...').closest('div');
    expect(searchContainer?.parentElement).toHaveClass('space-y-2', 'sm:space-y-0');
  });

  it('adapts layout for tablet viewport (768px)', async () => {
    // Set tablet viewport
    mockViewportResize(768, 1024);

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Verify responsive grid classes are applied
    const gridContainer = document.querySelector('.grid-cols-12');
    expect(gridContainer).toBeInTheDocument();
  });

  it('displays full layout for desktop viewport (1024px+)', async () => {
    // Set desktop viewport
    mockViewportResize(1024, 768);

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // All columns should be visible on desktop
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Path')).toBeInTheDocument();
    expect(screen.getByText('Origin')).toBeInTheDocument();
    expect(screen.getByText('Methods')).toBeInTheDocument();
    expect(screen.getByText('Max Age')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('maintains functionality across different viewport sizes', async () => {
    const user = userEvent.setup();

    // Start with mobile
    mockViewportResize(320, 568);

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Test search functionality on mobile
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    await user.type(searchInput, 'test1');

    expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    expect(screen.queryByText('/api/v2/test2/*')).not.toBeInTheDocument();

    // Switch to desktop
    mockViewportResize(1024, 768);

    // Functionality should still work
    await user.clear(searchInput);
    await user.type(searchInput, 'test2');

    expect(screen.getByText('/api/v2/test2/*')).toBeInTheDocument();
    expect(screen.queryByText('/api/v2/test1/*')).not.toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE: DATA FORMATTING AND DISPLAY
// ============================================================================

describe('CorsTable Component - Data Formatting', () => {
  beforeEach(() => {
    mockIntersectionObserver();
  });

  it('formats CORS status correctly', async () => {
    const mockData = [
      generateMockCorsConfig(1, { enabled: true }),
      generateMockCorsConfig(2, { enabled: false }),
    ];

    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 2, total: 2 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    // Check status icons
    const activeIcon = screen.getByText('Active').parentElement?.querySelector('svg');
    const inactiveIcon = screen.getByText('Inactive').parentElement?.querySelector('svg');
    
    expect(activeIcon).toBeInTheDocument();
    expect(inactiveIcon).toBeInTheDocument();
  });

  it('formats HTTP methods correctly', async () => {
    const mockData = [
      generateMockCorsConfig(1, { method: ['GET', 'POST', 'PUT'] }),
      generateMockCorsConfig(2, { method: [] }),
    ];

    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 2, total: 2 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('GET, POST, PUT')).toBeInTheDocument();
      expect(screen.getByText('ALL')).toBeInTheDocument();
    });
  });

  it('formats max age correctly', async () => {
    const mockData = [
      generateMockCorsConfig(1, { maxAge: 3600 }),
      generateMockCorsConfig(2, { maxAge: 0 }),
    ];

    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 2, total: 2 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('3600s')).toBeInTheDocument();
      expect(screen.getByText('0s')).toBeInTheDocument();
    });
  });

  it('truncates long paths and descriptions', async () => {
    const mockData = [
      generateMockCorsConfig(1, { 
        path: '/api/v2/very/long/path/that/should/be/truncated/in/the/display',
        description: 'This is a very long description that should be truncated in the table display'
      }),
    ];

    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 1, total: 1 }
        });
      })
    );

    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/very/long/path/that/should/be/truncated/in/the/display')).toBeInTheDocument();
    });

    // Check for truncate CSS class
    const pathElement = screen.getByText('/api/v2/very/long/path/that/should/be/truncated/in/the/display');
    expect(pathElement).toHaveClass('truncate');

    const descriptionElement = screen.getByText('This is a very long description that should be truncated in the table display');
    expect(descriptionElement).toHaveClass('truncate');
  });
});

// ============================================================================
// TEST SUITE: ACCESSIBILITY COMPLIANCE
// ============================================================================

describe('CorsTable Component - Accessibility Compliance', () => {
  const mockData = [generateMockCorsConfig(1)];

  beforeEach(() => {
    mockIntersectionObserver();
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({
          resource: mockData,
          meta: { count: 1, total: 1 }
        });
      })
    );
  });

  it('has proper table semantics for screen readers', async () => {
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Check for proper table structure
    const table = screen.getByRole('table', { hidden: true });
    expect(table).toBeInTheDocument();

    // Check for column headers
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);

    // Check for row headers
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows
  });

  it('provides accessible button labels', async () => {
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Check button accessibility
    expect(screen.getByRole('button', { name: /edit cors configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete cors configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('has proper form labels and descriptions', async () => {
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Check search input accessibility
    const searchInput = screen.getByPlaceholderText('Search CORS policies...');
    expect(searchInput).toHaveAttribute('type', 'text');
    expect(searchInput).toHaveAccessibleName();
  });

  it('supports keyboard navigation throughout the table', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Tab through interactive elements
    await user.keyboard('{Tab}'); // Search input
    expect(screen.getByPlaceholderText('Search CORS policies...')).toHaveFocus();

    await user.keyboard('{Tab}'); // Refresh button
    expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();

    await user.keyboard('{Tab}'); // Select all checkbox
    expect(screen.getAllByRole('checkbox')[0]).toHaveFocus();

    await user.keyboard('{Tab}'); // First row checkbox
    expect(screen.getAllByRole('checkbox')[1]).toHaveFocus();

    await user.keyboard('{Tab}'); // Edit button
    expect(screen.getByRole('button', { name: /edit cors configuration/i })).toHaveFocus();

    await user.keyboard('{Tab}'); // Delete button
    expect(screen.getByRole('button', { name: /delete cors configuration/i })).toHaveFocus();
  });

  it('has proper ARIA labels and roles', async () => {
    renderWithQueryClient(<CorsTable />);

    await waitFor(() => {
      expect(screen.getByText('/api/v2/test1/*')).toBeInTheDocument();
    });

    // Check for loading state ARIA
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); // Should not be loading anymore

    // Check for proper button roles
    const editButton = screen.getByRole('button', { name: /edit cors configuration/i });
    expect(editButton).toHaveAttribute('title');

    const deleteButton = screen.getByRole('button', { name: /delete cors configuration/i });
    expect(deleteButton).toHaveAttribute('title');
  });
});