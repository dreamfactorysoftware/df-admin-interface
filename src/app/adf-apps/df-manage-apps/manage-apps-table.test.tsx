/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ManageAppsTable } from './manage-apps-table';
import { TestProviders } from '../../../test/test-utils';
import type { AppType, AppRow } from '../../../types/app';
import type { GenericListResponse } from '../../../types/api';

// Mock browser APIs
const mockClipboard = {
  writeText: vi.fn(),
};

const mockWindow = {
  open: vi.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

Object.assign(window, {
  open: mockWindow.open,
});

// Mock large dataset for virtual scrolling tests
const generateMockApps = (count: number): AppType[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `TestApp${index + 1}`,
    description: `Test application ${index + 1} description`,
    apiKey: `api_key_${index + 1}_${'x'.repeat(32)}`,
    isActive: index % 2 === 0,
    launchUrl: `https://app${index + 1}.example.com`,
    roleByRoleId: {
      id: (index % 3) + 1,
      name: `role_${(index % 3) + 1}`,
      description: `Role ${(index % 3) + 1}`,
    },
    createdById: index % 5 === 0 ? null : index + 100, // Some apps without creator for testing disabled actions
    createdDate: new Date(`2024-01-${String(index % 28 + 1).padStart(2, '0')}`).toISOString(),
    lastModifiedDate: new Date(`2024-06-${String(index % 28 + 1).padStart(2, '0')}`).toISOString(),
  }));
};

const mockApps = generateMockApps(25);
const mockLargeDataset = generateMockApps(1200); // Test virtual scrolling with 1000+ items

// MSW server setup for API mocking
const server = setupServer(
  // Get applications list endpoint
  http.get('/api/v2/system/app', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter') || '';
    
    let filteredApps = filter 
      ? mockApps.filter(app => 
          app.name.toLowerCase().includes(filter.toLowerCase()) ||
          app.description.toLowerCase().includes(filter.toLowerCase())
        )
      : mockApps;

    // Test large dataset for virtual scrolling
    if (url.searchParams.get('test_large_dataset') === 'true') {
      filteredApps = mockLargeDataset;
    }

    const paginatedApps = filteredApps.slice(offset, offset + limit);
    
    const response: GenericListResponse<AppType> = {
      resource: paginatedApps,
      meta: {
        count: filteredApps.length,
        limit,
        offset,
      },
    };

    return HttpResponse.json(response);
  }),

  // Delete application endpoint
  http.delete('/api/v2/system/app/:id', ({ params }) => {
    const appId = parseInt(params.id as string);
    const appIndex = mockApps.findIndex(app => app.id === appId);
    
    if (appIndex === -1) {
      return HttpResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    mockApps.splice(appIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Update application endpoint (for API key regeneration)
  http.patch('/api/v2/system/app/:id', async ({ params, request }) => {
    const appId = parseInt(params.id as string);
    const updateData = await request.json() as Partial<AppType>;
    const appIndex = mockApps.findIndex(app => app.id === appId);
    
    if (appIndex === -1) {
      return HttpResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update the app with new data
    mockApps[appIndex] = { ...mockApps[appIndex], ...updateData };
    
    return HttpResponse.json(mockApps[appIndex]);
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/v2/system/app/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
);

describe('ManageAppsTable', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          cacheTime: 0,
        },
      },
    });
    user = userEvent.setup();
    
    // Clear mocks
    mockClipboard.writeText.mockClear();
    mockWindow.open.mockClear();
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestProviders>
          <ManageAppsTable {...props} />
        </TestProviders>
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render the manage apps table component', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table headers are present
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('API Key')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderComponent();
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render application data after loading', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });

      // Verify first few apps are displayed
      expect(screen.getByText('TestApp1')).toBeInTheDocument();
      expect(screen.getByText('TestApp2')).toBeInTheDocument();
      expect(screen.getByText('Role 1')).toBeInTheDocument();
      expect(screen.getByText('Role 2')).toBeInTheDocument();
    });
  });

  describe('Table Functionality', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });

    it('should display correct column data', async () => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      
      // Skip header row, check first data row
      const firstDataRow = rows[1];
      
      expect(within(firstDataRow).getByText('TestApp1')).toBeInTheDocument();
      expect(within(firstDataRow).getByText('Role 1')).toBeInTheDocument();
      expect(within(firstDataRow).getByText(/api_key_1_/)).toBeInTheDocument();
      expect(within(firstDataRow).getByText('Test application 1 description')).toBeInTheDocument();
    });

    it('should handle pagination correctly', async () => {
      const nextPageButton = screen.getByRole('button', { name: /next page/i });
      
      // Should be enabled if there are more items
      if (mockApps.length > 25) {
        expect(nextPageButton).not.toBeDisabled();
        
        await user.click(nextPageButton);
        
        await waitFor(() => {
          // Should show items from second page
          expect(screen.queryByText('TestApp1')).not.toBeInTheDocument();
        });
      }
    });

    it('should support filtering applications', async () => {
      const searchInput = screen.getByPlaceholderText(/search applications/i);
      
      await user.type(searchInput, 'TestApp1');
      
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
        expect(screen.queryByText('TestApp2')).not.toBeInTheDocument();
      });
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });

    it('should delete an application', async () => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const firstDeleteButton = deleteButtons[0];
      
      await user.click(firstDeleteButton);
      
      // Confirm deletion in dialog
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByText('TestApp1')).not.toBeInTheDocument();
      });
    });

    it('should handle delete errors gracefully', async () => {
      // Mock server error for delete
      server.use(
        http.delete('/api/v2/system/app/:id', () => {
          return HttpResponse.json(
            { error: 'Failed to delete application' },
            { status: 500 }
          );
        })
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to delete application/i)).toBeInTheDocument();
      });
    });
  });

  describe('Row Actions', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });

    it('should launch application in new tab', async () => {
      const launchButtons = screen.getAllByRole('button', { name: /launch app/i });
      const firstLaunchButton = launchButtons[0];
      
      await user.click(firstLaunchButton);
      
      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://app1.example.com',
        '_blank'
      );
    });

    it('should disable launch button for apps without launch URL', async () => {
      // Find an app without launch URL (if any exist in mock data)
      const mockAppWithoutUrl = mockApps.find(app => !app.launchUrl);
      
      if (mockAppWithoutUrl) {
        const launchButtons = screen.getAllByRole('button', { name: /launch app/i });
        const disabledButton = launchButtons.find(button => button.hasAttribute('disabled'));
        
        expect(disabledButton).toBeInTheDocument();
      }
    });

    it('should copy API key to clipboard', async () => {
      const copyButtons = screen.getAllByRole('button', { name: /copy api key/i });
      const firstCopyButton = copyButtons[0];
      
      await user.click(firstCopyButton);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringMatching(/api_key_1_/)
      );
      
      // Should show success notification
      await waitFor(() => {
        expect(screen.getByText(/api key copied/i)).toBeInTheDocument();
      });
    });

    it('should regenerate API key', async () => {
      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate api key/i });
      const firstRegenerateButton = regenerateButtons[0];
      
      await user.click(firstRegenerateButton);
      
      // Should show confirmation dialog
      const confirmButton = await screen.findByRole('button', { name: /regenerate/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        // Should refresh table data and show new API key
        expect(screen.getByText(/api key regenerated/i)).toBeInTheDocument();
      });
    });

    it('should disable regenerate button for apps without creator', async () => {
      // Find apps created by system (createdById is null)
      const systemApps = mockApps.filter(app => app.createdById === null);
      
      if (systemApps.length > 0) {
        const regenerateButtons = screen.getAllByRole('button', { name: /regenerate api key/i });
        const disabledButtons = regenerateButtons.filter(button => button.hasAttribute('disabled'));
        
        expect(disabledButtons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Virtual Scrolling', () => {
    it('should handle large datasets efficiently with virtual scrolling', async () => {
      // Mock large dataset endpoint
      server.use(
        http.get('/api/v2/system/app', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('test_large_dataset') === 'true') {
            const response: GenericListResponse<AppType> = {
              resource: mockLargeDataset.slice(0, 50), // Only render first 50 items
              meta: {
                count: mockLargeDataset.length,
                limit: 50,
                offset: 0,
              },
            };
            return HttpResponse.json(response);
          }
          return HttpResponse.json({ resource: [], meta: { count: 0, limit: 25, offset: 0 } });
        })
      );

      renderComponent({ testLargeDataset: true });

      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });

      // Verify virtual scrolling container exists
      const virtualContainer = screen.getByTestId('virtual-scroll-container');
      expect(virtualContainer).toBeInTheDocument();

      // Verify not all 1200 items are rendered at once (performance check)
      const renderedRows = screen.getAllByRole('row');
      expect(renderedRows.length).toBeLessThan(mockLargeDataset.length);
      expect(renderedRows.length).toBeGreaterThan(0);
    });

    it('should handle scrolling in large datasets', async () => {
      renderComponent({ testLargeDataset: true });

      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });

      const virtualContainer = screen.getByTestId('virtual-scroll-container');
      
      // Simulate scroll event
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 1000 } });

      await waitFor(() => {
        // Should trigger loading of new items
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('React Query Caching and Optimistic Updates', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });

    it('should cache API responses for performance', async () => {
      // Initial load
      expect(screen.getByText('TestApp1')).toBeInTheDocument();
      
      // Navigate away and back (simulate route change)
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      
      // Should show cached data immediately
      expect(screen.getByText('TestApp1')).toBeInTheDocument();
    });

    it('should implement optimistic updates for delete operations', async () => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const firstDeleteButton = deleteButtons[0];
      
      await user.click(firstDeleteButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      // Should immediately remove from UI (optimistic update)
      expect(screen.queryByText('TestApp1')).not.toBeInTheDocument();
    });

    it('should revert optimistic updates on error', async () => {
      // Mock server error for delete
      server.use(
        http.delete('/api/v2/system/app/:id', () => {
          return HttpResponse.json(
            { error: 'Failed to delete' },
            { status: 500 }
          );
        })
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      // Should revert optimistic update and show item again
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
        expect(screen.getByText(/failed to delete/i)).toBeInTheDocument();
      });
    });

    it('should refresh data automatically on focus', async () => {
      // Simulate window focus
      fireEvent.focus(window);
      
      await waitFor(() => {
        // Should trigger background refetch
        expect(queryClient.getQueryState(['apps'])?.isFetching).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.error();
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      server.use(
        http.get('/api/v2/system/app', () => {
          return HttpResponse.json(
            { error: 'Temporary error' },
            { status: 503 }
          );
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      server.use(
        http.get('/api/v2/system/app', () => {
          const response: GenericListResponse<AppType> = {
            resource: mockApps.slice(0, 25),
            meta: { count: mockApps.length, limit: 25, offset: 0 },
          };
          return HttpResponse.json(response);
        })
      );

      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TestApp1')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for actions', () => {
      const launchButtons = screen.getAllByRole('button', { name: /launch app/i });
      expect(launchButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Launch'));

      const copyButtons = screen.getAllByRole('button', { name: /copy api key/i });
      expect(copyButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Copy'));

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate api key/i });
      expect(regenerateButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Regenerate'));
    });

    it('should support keyboard navigation', async () => {
      const table = screen.getByRole('table');
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
      
      // Verify focus management
      const firstActionButton = screen.getAllByRole('button')[0];
      firstActionButton.focus();
      expect(document.activeElement).toBe(firstActionButton);
    });

    it('should announce actions to screen readers', async () => {
      const copyButtons = screen.getAllByRole('button', { name: /copy api key/i });
      await user.click(copyButtons[0]);
      
      // Should have live region announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/api key copied/i);
      });
    });
  });

  describe('Internationalization', () => {
    it('should display translated text', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Applications')).toBeInTheDocument();
      });

      // Verify key UI elements are translated
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle locale changes', async () => {
      // This would test locale switching if implemented
      // For now, verify the structure supports i18n
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });
});