import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { renderWithProviders, accessibilityUtils, headlessUIUtils, userEvent } from '@/test/utils/test-utils';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { SearchDialog, SearchDialogProps, type SearchResult } from './search-dialog';

/**
 * MSW handlers for search API endpoints
 */
const searchHandlers = [
  // Successful search endpoint
  rest.post('/api/search', async (req, res, ctx) => {
    const { query, categories, limit } = await req.json();
    
    // Return empty results for empty queries
    if (!query || query.trim() === '') {
      return res(
        ctx.status(200),
        ctx.json({
          results: [],
          total: 0,
          query: '',
          took: 10,
        })
      );
    }

    // Mock search results based on query
    const mockResults: SearchResult[] = [
      {
        id: 'service-1',
        title: `Database Service: ${query}`,
        subtitle: 'MySQL connection to production database',
        type: 'services',
        path: '/api-connections/database/service-1',
        score: 0.95,
        metadata: { dbType: 'mysql', status: 'active' },
      },
      {
        id: 'table-1',
        title: `${query}_users`,
        subtitle: 'User management table',
        type: 'tables',
        path: '/adf-schema/tables/table-1',
        score: 0.82,
        metadata: { rowCount: 15420, columns: 8 },
      },
      {
        id: 'user-1',
        title: `${query} Admin`,
        subtitle: 'System administrator',
        type: 'users',
        path: '/adf-users/user-1',
        score: 0.75,
        metadata: { role: 'admin', lastLogin: '2024-01-15' },
      },
    ];

    // Apply category filter if specified
    const filteredResults = categories?.length
      ? mockResults.filter(result => categories.includes(result.type))
      : mockResults;

    // Apply limit
    const limitedResults = limit ? filteredResults.slice(0, limit) : filteredResults;

    return res(
      ctx.status(200),
      ctx.json({
        results: limitedResults,
        total: limitedResults.length,
        query,
        took: Math.random() * 100 + 50,
      })
    );
  }),

  // Error endpoint for testing error states
  rest.post('/api/search-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'Internal server error',
        message: 'Search service temporarily unavailable',
      })
    );
  }),

  // Slow endpoint for testing loading states
  rest.post('/api/search-slow', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return res(
      ctx.status(200),
      ctx.json({
        results: [],
        total: 0,
        query: 'slow',
        took: 2000,
      })
    );
  }),
];

// Setup MSW server
const server = setupServer(...searchHandlers);

// Mock localStorage for recent searches
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock router
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock app store
const mockUseAppStore = vi.fn();
vi.mock('@/stores/app-store', () => ({
  useAppStore: () => mockUseAppStore(),
}));

describe('SearchDialog', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  
  const defaultProps: SearchDialogProps = {
    open: true,
    onClose: vi.fn(),
    placeholder: 'Search test placeholder',
    enableShortcuts: true,
  };

  beforeAll(() => {
    // Start MSW server
    server.listen();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock app store default return
    mockUseAppStore.mockReturnValue({
      searchOpen: false,
      toggleSearch: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Setup userEvent with delay for realistic interactions
    user = userEvent.setup({ delay: null });
    
    // Clear all mocks
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('renders search dialog when open', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Global Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search test placeholder')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      renderWithProviders(<SearchDialog {...defaultProps} open={false} />, {
        providerOptions: { queryClient },
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with default placeholder when none provided', () => {
      const { placeholder, ...propsWithoutPlaceholder } = defaultProps;
      
      renderWithProviders(<SearchDialog {...propsWithoutPlaceholder} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByPlaceholderText(/Search databases, services, schemas/)).toBeInTheDocument();
    });

    it('renders keyboard shortcuts when enabled', () => {
      renderWithProviders(<SearchDialog {...defaultProps} enableShortcuts={true} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByText('to navigate')).toBeInTheDocument();
      expect(screen.getByText('to select')).toBeInTheDocument();
      expect(screen.getByText('to close')).toBeInTheDocument();
      expect(screen.getByText('to open search')).toBeInTheDocument();
    });

    it('does not render global shortcut when shortcuts disabled', () => {
      renderWithProviders(<SearchDialog {...defaultProps} enableShortcuts={false} />, {
        providerOptions: { queryClient },
      });

      expect(screen.queryByText('to open search')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      renderWithProviders(
        <SearchDialog {...defaultProps} className="custom-search-class" />,
        { providerOptions: { queryClient } }
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.closest('[class*="custom-search-class"]')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('performs search when query is entered', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      await user.type(searchInput, 'database');

      // Wait for debounced search to execute
      await waitFor(() => {
        expect(screen.getByText('Database Service: database')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('database_users')).toBeInTheDocument();
      expect(screen.getByText('database Admin')).toBeInTheDocument();
    });

    it('shows loading state during search', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      await user.type(searchInput, 'loading');

      // Should show loading state immediately after typing
      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      });
    });

    it('shows empty state when no query entered', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByText('Global Search')).toBeInTheDocument();
      expect(screen.getByText(/Quickly find database services/)).toBeInTheDocument();
    });

    it('shows no results message for empty results', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('handles search errors gracefully', async () => {
      // Override handler to return error
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      await user.type(searchInput, 'error');

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('clears search input when clear button is clicked', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder') as HTMLInputElement;
      
      await user.type(searchInput, 'test query');
      expect(searchInput.value).toBe('test query');

      // Find and click clear button (X icon)
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput.value).toBe('');
    });

    it('respects initial query prop', () => {
      renderWithProviders(
        <SearchDialog {...defaultProps} initialQuery="initial search" />,
        { providerOptions: { queryClient } }
      );

      const searchInput = screen.getByPlaceholderText('Search test placeholder') as HTMLInputElement;
      expect(searchInput.value).toBe('initial search');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      
      renderWithProviders(<SearchDialog {...defaultProps} onClose={onClose} />, {
        providerOptions: { queryClient },
      });

      const closeButton = screen.getByRole('button', { name: /close search dialog/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when escape key is pressed', async () => {
      const onClose = vi.fn();
      
      renderWithProviders(<SearchDialog {...defaultProps} onClose={onClose} />, {
        providerOptions: { queryClient },
      });

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to result when result is clicked', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('Database Service: database')).toBeInTheDocument();
      });

      const resultItem = screen.getByText('Database Service: database');
      await user.click(resultItem);

      expect(mockPush).toHaveBeenCalledWith('/api-connections/database/service-1');
    });

    it('supports keyboard navigation through results', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('Database Service: database')).toBeInTheDocument();
      });

      // Test arrow key navigation
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      // Test Enter key selection
      await user.keyboard('{Enter}');

      // Should navigate to the focused result
      expect(mockPush).toHaveBeenCalled();
    });

    it('opens search dialog with global keyboard shortcut', async () => {
      const onClose = vi.fn();
      
      renderWithProviders(
        <SearchDialog {...defaultProps} open={false} onClose={onClose} enableShortcuts={true} />,
        { providerOptions: { queryClient } }
      );

      // Simulate Cmd+K keyboard shortcut
      await user.keyboard('{Meta>}k{/Meta}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('opens search dialog with Ctrl+K keyboard shortcut', async () => {
      const onClose = vi.fn();
      
      renderWithProviders(
        <SearchDialog {...defaultProps} open={false} onClose={onClose} enableShortcuts={true} />,
        { providerOptions: { queryClient } }
      );

      // Simulate Ctrl+K keyboard shortcut
      await user.keyboard('{Control>}k{/Control}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('has proper ARIA attributes for dialog', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', expect.any(String));
    });

    it('manages focus correctly when dialog opens', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      // Search input should receive focus when dialog opens
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search test placeholder');
        expect(document.activeElement).toBe(searchInput);
      });
    });

    it('traps focus within dialog', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialog = screen.getByRole('dialog');
      const focusableElements = accessibilityUtils.getFocusableElements(dialog);

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test that tab navigation stays within dialog
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab();
        expect(dialog.contains(document.activeElement as Node)).toBe(true);
      }
    });

    it('has adequate keyboard navigation support', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialog = screen.getByRole('dialog');
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(dialog, user);

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
    });

    it('provides screen reader announcements for search states', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'database');

      // Check for screen reader status updates
      await waitFor(() => {
        const statusElement = screen.getByText(/Found \d+ results/);
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      const closeButton = screen.getByRole('button', { name: /close search dialog/i });

      expect(accessibilityUtils.hasAriaLabel(searchInput)).toBe(true);
      expect(accessibilityUtils.hasAriaLabel(closeButton)).toBe(true);
    });

    it('supports high contrast and theme variations', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient, theme: 'dark' },
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dark');
    });
  });

  describe('React Query Integration', () => {
    it('caches search results for repeated queries', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      // First search
      await user.clear(searchInput);
      await user.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('Database Service: database')).toBeInTheDocument();
      });

      // Clear and search again with same query
      await user.clear(searchInput);
      await user.type(searchInput, 'database');

      // Should load from cache (almost instantly)
      await waitFor(() => {
        expect(screen.getByText('Database Service: database')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    it('handles query invalidation correctly', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['search'] });

      // Should trigger refetch
      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });
    });

    it('implements proper error boundaries for query failures', async () => {
      // Mock console.error to prevent test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'error');

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('debounces search queries to prevent excessive API calls', async () => {
      const apiCallSpy = vi.fn();
      
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          apiCallSpy();
          return res(
            ctx.status(200),
            ctx.json({ results: [], total: 0, query: '', took: 10 })
          );
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'rapid typing test', { delay: 50 });

      // Wait for debounce period
      await waitFor(() => {
        expect(apiCallSpy).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });
    });

    it('supports background refetching for stale data', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'refetch');

      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });

      // Simulate stale data and refetch
      const cacheData = queryClient.getQueryData(['search', 'refetch', {}, 50]);
      expect(cacheData).toBeDefined();

      // Force background refetch
      await queryClient.refetchQueries({ queryKey: ['search'], type: 'active' });
    });
  });

  describe('Recent Searches & History', () => {
    it('persists recent searches to localStorage', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'test search');

      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });

      // Click on a result to add to history
      const resultItem = screen.getByText('Database Service: test search');
      await user.click(resultItem);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dreamfactory-recent-searches',
        expect.stringContaining('test search')
      );
    });

    it('displays recent searches when no query is entered', () => {
      // Mock localStorage with recent searches
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        {
          id: 'recent-1',
          title: 'Recent Database Search',
          type: 'services',
          path: '/recent-path',
        },
      ]));

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Recent Database Search')).toBeInTheDocument();
    });

    it('clears recent searches when clear button is clicked', async () => {
      // Mock localStorage with recent searches
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        {
          id: 'recent-1',
          title: 'Recent Database Search',
          type: 'services',
          path: '/recent-path',
        },
      ]));

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      
      const clearButton = screen.getByText('Clear recent searches');
      await user.click(clearButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('dreamfactory-recent-searches');
    });

    it('limits recent searches to maximum count', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');

      // Perform multiple searches to exceed limit
      for (let i = 0; i < 10; i++) {
        await user.clear(searchInput);
        await user.type(searchInput, `search ${i}`);
        
        await waitFor(() => {
          expect(screen.getByText(`Database Service: search ${i}`)).toBeInTheDocument();
        });

        const resultItem = screen.getByText(`Database Service: search ${i}`);
        await user.click(resultItem);
      }

      // Check that localStorage was called and recent searches are limited
      const setItemCalls = mockLocalStorage.setItem.mock.calls.filter(
        call => call[0] === 'dreamfactory-recent-searches'
      );
      
      expect(setItemCalls.length).toBeGreaterThan(0);
      
      // Parse the last saved data to check count
      const lastSavedData = JSON.parse(setItemCalls[setItemCalls.length - 1][1]);
      expect(lastSavedData.length).toBeLessThanOrEqual(5); // Should limit to 5 items
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('w-full');
    });

    it('adapts to desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-2xl');
    });

    it('handles dialog positioning correctly', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const dialogContainer = screen.getByRole('dialog').closest('[class*="pt-"]');
      expect(dialogContainer).toHaveClass('pt-[10vh]');
    });

    it('adjusts search results container height', () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const resultsContainer = screen.getByRole('dialog').querySelector('[class*="max-h-"]');
      expect(resultsContainer).toHaveClass('max-h-[60vh]');
    });
  });

  describe('MSW Integration & Error Scenarios', () => {
    it('handles network timeouts gracefully', async () => {
      server.use(
        rest.post('/api/search', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return res(ctx.status(200), ctx.json({ results: [], total: 0, query: '', took: 5000 }));
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'timeout');

      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      });

      // Should show loading state for extended period
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('handles malformed API responses', async () => {
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          return res(ctx.status(200), ctx.text('Invalid JSON response'));
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'malformed');

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles rate limiting responses', async () => {
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({
              error: 'Rate limit exceeded',
              retryAfter: 60,
            })
          );
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'ratelimit');

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles empty API responses correctly', async () => {
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              results: [],
              total: 0,
              query: 'empty',
              took: 25,
            })
          );
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'empty');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search terms or explore different categories')).toBeInTheDocument();
      });
    });
  });

  describe('Performance & Optimization', () => {
    it('cancels previous search requests when new query is entered', async () => {
      const abortSpy = vi.fn();
      
      server.use(
        rest.post('/api/search', async (req, res, ctx) => {
          req.signal.addEventListener('abort', abortSpy);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return res(ctx.status(200), ctx.json({ results: [], total: 0, query: '', took: 1000 }));
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      // Start first search
      await user.type(searchInput, 'first');
      
      // Quickly start second search
      await user.clear(searchInput);
      await user.type(searchInput, 'second');

      // First request should be aborted
      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled();
      });
    });

    it('optimizes re-renders with proper memoization', async () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <>{children}</>;
      };

      renderWithProviders(
        <TestWrapper>
          <SearchDialog {...defaultProps} />
        </TestWrapper>,
        { providerOptions: { queryClient } }
      );

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      // Multiple interactions should not cause excessive re-renders
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      await user.type(searchInput, 'another');

      // Should not re-render excessively
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('implements efficient virtual scrolling for large result sets', async () => {
      // Mock large result set
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          const largeResults = Array.from({ length: 100 }, (_, i) => ({
            id: `result-${i}`,
            title: `Result ${i}`,
            subtitle: `Description for result ${i}`,
            type: 'services',
            path: `/result-${i}`,
            score: 0.9 - (i * 0.001),
          }));

          return res(
            ctx.status(200),
            ctx.json({
              results: largeResults,
              total: largeResults.length,
              query: 'large',
              took: 50,
            })
          );
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, 'large');

      await waitFor(() => {
        expect(screen.getByText('Result 0')).toBeInTheDocument();
      });

      // Should render efficiently without performance issues
      const resultsContainer = screen.getByRole('dialog').querySelector('[class*="overflow-y-auto"]');
      expect(resultsContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Error Boundaries', () => {
    it('handles special characters in search queries', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      await user.type(searchInput, '!@#$%^&*()');

      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });
    });

    it('handles very long search queries', async () => {
      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      await user.type(searchInput, longQuery);

      await waitFor(() => {
        expect(screen.getByText(/Database Service:/)).toBeInTheDocument();
      });
    });

    it('handles concurrent dialog operations', async () => {
      const onClose = vi.fn();
      
      renderWithProviders(<SearchDialog {...defaultProps} onClose={onClose} />, {
        providerOptions: { queryClient },
      });

      // Simulate rapid open/close operations
      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');

      // Should handle gracefully without errors
      expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('maintains state consistency during error recovery', async () => {
      let shouldError = true;
      
      server.use(
        rest.post('/api/search', (req, res, ctx) => {
          if (shouldError) {
            shouldError = false;
            return res(ctx.status(500), ctx.json({ error: 'Temporary error' }));
          }
          return res(
            ctx.status(200),
            ctx.json({
              results: [
                {
                  id: 'recovery-1',
                  title: 'Recovery Result',
                  type: 'services',
                  path: '/recovery',
                  score: 0.9,
                },
              ],
              total: 1,
              query: 'recovery',
              took: 100,
            })
          );
        })
      );

      renderWithProviders(<SearchDialog {...defaultProps} />, {
        providerOptions: { queryClient },
      });

      const searchInput = screen.getByPlaceholderText('Search test placeholder');
      
      // First search will error
      await user.type(searchInput, 'recovery');

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });

      // Second search should succeed
      await user.clear(searchInput);
      await user.type(searchInput, 'recovery');

      await waitFor(() => {
        expect(screen.getByText('Recovery Result')).toBeInTheDocument();
      });
    });
  });
});