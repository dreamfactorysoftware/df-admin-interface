import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockApp, createMockApps } from '../../../test/utils/component-factories';
import { ManageAppsTable } from './manage-apps-table';
import type { AppType, AppRow } from '../../../types/app';
import type { GenericListResponse } from '../../../types/generic-http';

// Mock the clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock window.open
const mockWindowOpen = vi.fn();
Object.assign(window, {
  open: mockWindowOpen,
});

// Mock data factories
const mockApps: AppType[] = createMockApps(10);
const largeMockApps: AppType[] = createMockApps(1500); // Large dataset for virtual scrolling

// MSW handlers for app management endpoints
const handlers = [
  // GET apps list endpoint
  http.get('/api/v2/system/app', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    const includeCount = url.searchParams.get('include_count') === 'true';

    let filteredApps = mockApps;
    
    if (filter) {
      filteredApps = mockApps.filter(app => 
        app.name.toLowerCase().includes(filter.toLowerCase()) ||
        app.description?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    const paginatedApps = filteredApps.slice(offset, offset + limit);
    
    const response: GenericListResponse<AppType> = {
      resource: paginatedApps,
      meta: includeCount ? { count: filteredApps.length } : {},
    };

    return HttpResponse.json(response);
  }),

  // GET large dataset for performance testing
  http.get('/api/v2/system/app/large', () => {
    const response: GenericListResponse<AppType> = {
      resource: largeMockApps,
      meta: { count: largeMockApps.length },
    };
    return HttpResponse.json(response);
  }),

  // DELETE app endpoint
  http.delete('/api/v2/system/app/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const appIndex = mockApps.findIndex(app => app.id === id);
    
    if (appIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    mockApps.splice(appIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // PUT app update endpoint (for API key refresh)
  http.put('/api/v2/system/app/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json() as Partial<AppType>;
    const appIndex = mockApps.findIndex(app => app.id === id);
    
    if (appIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    // Update the app with new data
    mockApps[appIndex] = { ...mockApps[appIndex], ...body };
    return HttpResponse.json(mockApps[appIndex]);
  }),

  // GET system config for host URL
  http.get('/api/v2/system/config', () => {
    return HttpResponse.json({
      platform: {
        server: {
          host: 'https://test.dreamfactory.com'
        }
      }
    });
  }),
];

const server = setupServer(...handlers);

describe('ManageAppsTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  describe('Component Rendering', () => {
    it('renders the apps table with correct columns', async () => {
      renderWithProviders(<ManageAppsTable />, { queryClient });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByRole('columnheader', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /api key/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('displays app data correctly in table rows', async () => {
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check first app data is displayed
      const firstApp = mockApps[0];
      expect(screen.getByText(firstApp.name)).toBeInTheDocument();
      expect(screen.getByText(firstApp.description || '')).toBeInTheDocument();
      if (firstApp.roleByRoleId?.description) {
        expect(screen.getByText(firstApp.roleByRoleId.description)).toBeInTheDocument();
      }
    });

    it('shows loading state initially', () => {
      renderWithProviders(<ManageAppsTable />, { queryClient });
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('handles empty state when no apps exist', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json({ resource: [], meta: { count: 0 } });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/no applications found/i)).toBeInTheDocument();
      });
    });
  });

  describe('CRUD Operations', () => {
    it('deletes an app when delete action is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find the first app row and delete button
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const deleteButton = within(firstAppRow).getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      // Confirm deletion in modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify app is removed from the list
      await waitFor(() => {
        expect(screen.queryByText(mockApps[0].name)).not.toBeInTheDocument();
      });
    });

    it('refreshes table data after CRUD operations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Trigger refresh by performing a delete operation
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const deleteButton = within(firstAppRow).getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Wait for table to refresh with updated data
      await waitFor(() => {
        expect(screen.queryByText(mockApps[0].name)).not.toBeInTheDocument();
      });
    });

    it('handles delete operation failures gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock delete failure
      server.use(
        http.delete('/api/v2/system/app/:id', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const deleteButton = within(firstAppRow).getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/error deleting application/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Key Management', () => {
    it('copies API key to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find copy API key button
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const copyButton = within(firstAppRow).getByRole('button', { name: /copy api key/i });

      await user.click(copyButton);

      // Verify clipboard API was called
      expect(mockClipboard.writeText).toHaveBeenCalledWith(mockApps[0].apiKey);
      
      // Check for success notification
      await waitFor(() => {
        expect(screen.getByText(/api key copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('regenerates API key when refresh button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const originalApiKey = mockApps[0].apiKey;

      // Find refresh API key button
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const refreshButton = within(firstAppRow).getByRole('button', { name: /refresh api key/i });

      await user.click(refreshButton);

      // Confirm regeneration in modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Wait for table to refresh with new API key
      await waitFor(() => {
        expect(screen.queryByText(originalApiKey)).not.toBeInTheDocument();
      });
    });

    it('disables refresh API key for system-created apps', async () => {
      // Create a mock app with no creator (system-created)
      const systemApp = createMockApp({ createdById: null });
      
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json({
            resource: [systemApp],
            meta: { count: 1 }
          });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find refresh API key button - should be disabled
      const appRow = screen.getByRole('row', { name: new RegExp(systemApp.name) });
      const refreshButton = within(appRow).getByRole('button', { name: /refresh api key/i });

      expect(refreshButton).toBeDisabled();
    });
  });

  describe('External URL Launch', () => {
    it('opens app URL in new window when launch button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find launch app button
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const launchButton = within(firstAppRow).getByRole('button', { name: /launch app/i });

      await user.click(launchButton);

      // Verify window.open was called with correct URL
      expect(mockWindowOpen).toHaveBeenCalledWith(mockApps[0].launchUrl, '_blank');
    });

    it('disables launch button when app has no launch URL', async () => {
      // Create a mock app with no launch URL
      const appWithoutUrl = createMockApp({ launchUrl: '' });
      
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json({
            resource: [appWithoutUrl],
            meta: { count: 1 }
          });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find launch app button - should be disabled
      const appRow = screen.getByRole('row', { name: new RegExp(appWithoutUrl.name) });
      const launchButton = within(appRow).getByRole('button', { name: /launch app/i });

      expect(launchButton).toBeDisabled();
    });
  });

  describe('Data Filtering and Pagination', () => {
    it('filters apps based on search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search applications/i);
      await user.type(searchInput, mockApps[0].name);

      // Wait for filtered results
      await waitFor(() => {
        expect(screen.getByText(mockApps[0].name)).toBeInTheDocument();
        // Other apps should not be visible
        expect(screen.queryByText(mockApps[1].name)).not.toBeInTheDocument();
      });
    });

    it('handles pagination correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check pagination controls exist
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();

      // Check page size selector
      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      expect(pageSizeSelect).toBeInTheDocument();

      // Change page size
      await user.click(pageSizeSelect);
      await user.click(screen.getByRole('option', { name: '50' }));

      // Verify more items are loaded
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(26); // Header + 25 default items
      });
    });
  });

  describe('TanStack Virtual Performance Testing', () => {
    it('handles large datasets efficiently with virtual scrolling', async () => {
      const startTime = performance.now();

      // Use large dataset endpoint
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json({
            resource: largeMockApps,
            meta: { count: largeMockApps.length }
          });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify render time is acceptable (< 2 seconds for 1500 items)
      expect(renderTime).toBeLessThan(2000);

      // Check that virtual scrolling is working - only visible rows should be rendered
      const visibleRows = screen.getAllByRole('row');
      // Should be much less than the total dataset size due to virtualization
      expect(visibleRows.length).toBeLessThan(100);
    });

    it('maintains smooth scrolling performance with large datasets', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json({
            resource: largeMockApps,
            meta: { count: largeMockApps.length }
          });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const tableContainer = screen.getByTestId('virtual-table-container');
      
      // Simulate scrolling
      const scrollEvents = [];
      for (let i = 0; i < 10; i++) {
        const scrollStart = performance.now();
        fireEvent.scroll(tableContainer, { target: { scrollTop: i * 100 } });
        scrollEvents.push(performance.now() - scrollStart);
      }

      // Average scroll handling should be under 16ms (60fps)
      const averageScrollTime = scrollEvents.reduce((sum, time) => sum + time, 0) / scrollEvents.length;
      expect(averageScrollTime).toBeLessThan(16);
    });
  });

  describe('React Query Caching and Optimistic Updates', () => {
    it('caches app data and serves from cache on subsequent renders', async () => {
      renderWithProviders(<ManageAppsTable />, { queryClient });

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Re-render component (simulating navigation back)
      const { rerender } = renderWithProviders(<ManageAppsTable />, { queryClient });
      rerender(<ManageAppsTable />);

      // Data should load immediately from cache (no loading state)
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('implements optimistic updates for API key regeneration', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const refreshButton = within(firstAppRow).getByRole('button', { name: /refresh api key/i });

      await user.click(refreshButton);

      // Confirm regeneration
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // UI should update immediately (optimistic update)
      // New API key should appear before server response
      await waitFor(() => {
        const apiKeyCell = within(firstAppRow).getByTestId('api-key-cell');
        expect(apiKeyCell.textContent).not.toBe(mockApps[0].apiKey);
      });
    });

    it('validates cache invalidation after mutations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Get initial cache state
      const initialCacheData = queryClient.getQueryData(['apps']);
      expect(initialCacheData).toBeDefined();

      // Perform delete operation
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const deleteButton = within(firstAppRow).getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify cache is invalidated and fresh data is fetched
      await waitFor(() => {
        const updatedCacheData = queryClient.getQueryData(['apps']);
        expect(updatedCacheData).not.toEqual(initialCacheData);
      });
    });

    it('handles concurrent mutations without race conditions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Start multiple concurrent operations
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const secondAppRow = screen.getByRole('row', { name: new RegExp(mockApps[1].name) });

      const firstRefreshButton = within(firstAppRow).getByRole('button', { name: /refresh api key/i });
      const secondRefreshButton = within(secondAppRow).getByRole('button', { name: /refresh api key/i });

      // Trigger both operations simultaneously
      await Promise.all([
        user.click(firstRefreshButton),
        user.click(secondRefreshButton)
      ]);

      // Both operations should complete successfully without conflicts
      await waitFor(() => {
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
      });

      const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
      await Promise.all([
        user.click(confirmButtons[0]),
        user.click(confirmButtons[1])
      ]);

      // Verify both operations completed successfully
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API requests fail', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument();
      });
    });

    it('handles network connectivity issues gracefully', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for action buttons', async () => {
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      
      // Check ARIA labels
      expect(within(firstAppRow).getByRole('button', { name: /launch app/i })).toHaveAttribute('aria-label');
      expect(within(firstAppRow).getByRole('button', { name: /copy api key/i })).toHaveAttribute('aria-label');
      expect(within(firstAppRow).getByRole('button', { name: /refresh api key/i })).toHaveAttribute('aria-label');
      expect(within(firstAppRow).getByRole('button', { name: /delete/i })).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation for table actions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Tab through action buttons
      await user.tab();
      await user.tab();
      await user.tab();

      const focusedElement = screen.getByRole('button', { name: /launch app/i });
      expect(focusedElement).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockWindowOpen).toHaveBeenCalled();
    });

    it('announces changes to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManageAppsTable />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Perform an action that should announce changes
      const firstAppRow = screen.getByRole('row', { name: new RegExp(mockApps[0].name) });
      const copyButton = within(firstAppRow).getByRole('button', { name: /copy api key/i });

      await user.click(copyButton);

      // Check for live region announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/api key copied/i);
      });
    });
  });
});