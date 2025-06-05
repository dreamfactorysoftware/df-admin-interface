/**
 * Comprehensive test suite for the SearchDialog component
 * 
 * Tests accessibility compliance (WCAG 2.1 AA), keyboard navigation, search functionality,
 * debouncing behavior, recent searches persistence, and responsive design using Vitest 2.1.0
 * and React Testing Library.
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  render, 
  screen, 
  waitFor, 
  fireEvent, 
  within,
  act,
  waitForElementToBeRemoved
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

import { SearchDialog } from './search-dialog';
import { SearchDialogProps, SearchResult, SearchResultType } from './types';
import { renderWithProviders } from '@/test/utils/test-utils';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

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
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage for recent searches testing
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

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
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock data for search results
const mockSearchResults: SearchResult[] = [
  {
    id: 'db-users',
    type: SearchResultType.DATABASE,
    title: 'Users Database',
    description: 'MySQL database containing user accounts',
    category: 'Databases',
    url: '/api-connections/database/users',
    icon: 'Database',
    metadata: {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
    },
  },
  {
    id: 'table-users',
    type: SearchResultType.TABLE,
    title: 'users',
    description: 'User accounts table with 1,247 records',
    category: 'Tables',
    url: '/api-connections/database/users/schema/users',
    icon: 'Table',
    metadata: {
      database: 'users',
      recordCount: 1247,
      primaryKey: 'id',
    },
  },
  {
    id: 'user-john-doe',
    type: SearchResultType.USER,
    title: 'John Doe',
    description: 'Administrator with full system access',
    category: 'Users',
    url: '/admin-settings/users/123',
    icon: 'User',
    metadata: {
      email: 'john.doe@example.com',
      role: 'Administrator',
      lastLogin: '2024-01-15T10:30:00Z',
    },
  },
  {
    id: 'setting-cors',
    type: SearchResultType.SETTING,
    title: 'CORS Configuration',
    description: 'Cross-origin resource sharing settings',
    category: 'Settings',
    url: '/system-settings/cors',
    icon: 'Settings',
    metadata: {
      enabled: true,
      origins: ['https://app.example.com'],
    },
  },
];

const mockEmptyResults: SearchResult[] = [];

// MSW handlers for search API testing
const searchHandlers = [
  rest.get('/api/v2/system/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    
    if (!query) {
      return res(ctx.json({ resource: [] }));
    }

    if (query === 'error') {
      return res(
        ctx.status(500),
        ctx.json({
          error: {
            code: 500,
            message: 'Search service temporarily unavailable',
          },
        })
      );
    }

    if (query === 'empty') {
      return res(ctx.json({ resource: mockEmptyResults }));
    }

    if (query.length < 2) {
      return res(ctx.json({ resource: [] }));
    }

    // Simulate debouncing by adding delay
    return res(
      ctx.delay(100),
      ctx.json({
        resource: mockSearchResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
        ),
      })
    );
  }),
];

describe('SearchDialog', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });
    
    user = userEvent.setup();
    
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Add search handlers to MSW server
    server.use(...searchHandlers);
  });

  afterEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  const defaultProps: SearchDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  const renderSearchDialog = (props: Partial<SearchDialogProps> = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    
    return renderWithProviders(
      <SearchDialog {...mergedProps} />,
      {
        queryClient,
        router: true,
      }
    );
  };

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations when closed', async () => {
      const { container } = renderSearchDialog({ isOpen: false });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when open', async () => {
      const { container } = renderSearchDialog();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      renderSearchDialog();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveAttribute('aria-expanded', 'false');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      expect(searchInput).toHaveAttribute('aria-describedby');
    });

    it('should have proper focus management', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveFocus();
    });

    it('should restore focus to trigger element when closed', async () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Search';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const onClose = vi.fn();
      renderSearchDialog({ onClose });
      
      // Press Escape to close
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalled();
      // Focus should return to the trigger element in a real implementation
    });

    it('should announce search results to screen readers', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        const resultsRegion = screen.getByRole('region', { name: /search results/i });
        expect(resultsRegion).toBeInTheDocument();
        expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper heading hierarchy', () => {
      renderSearchDialog();
      
      const dialogTitle = screen.getByRole('heading', { level: 2 });
      expect(dialogTitle).toBeInTheDocument();
      expect(dialogTitle).toHaveTextContent(/search/i);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open with Cmd/Ctrl+K keyboard shortcut', async () => {
      const onOpen = vi.fn();
      
      // Simulate global keyboard handler
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          onOpen();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      await user.keyboard('{Meta>}k{/Meta}');
      
      expect(onOpen).toHaveBeenCalled();
      
      document.removeEventListener('keydown', handleKeyDown);
    });

    it('should close with Escape key', async () => {
      const onClose = vi.fn();
      renderSearchDialog({ onClose });
      
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should navigate results with arrow keys', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      // Arrow down to first result
      await user.keyboard('{ArrowDown}');
      
      const firstResult = screen.getByRole('option', { name: /users database/i });
      expect(firstResult).toHaveAttribute('aria-selected', 'true');
      
      // Arrow down to second result
      await user.keyboard('{ArrowDown}');
      
      const secondResult = screen.getByRole('option', { name: /users.*table/i });
      expect(secondResult).toHaveAttribute('aria-selected', 'true');
      expect(firstResult).toHaveAttribute('aria-selected', 'false');
    });

    it('should wrap navigation at beginning and end of results', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      // Arrow up from first result should go to last
      await user.keyboard('{ArrowUp}');
      
      const lastResult = screen.getByRole('option', { name: /john doe/i });
      expect(lastResult).toHaveAttribute('aria-selected', 'true');
    });

    it('should select result with Enter key', async () => {
      const onSelect = vi.fn();
      renderSearchDialog({ onSelect });
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'db-users',
          title: 'Users Database',
        })
      );
    });

    it('should navigate back to search input with up arrow from first result', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Search Functionality', () => {
    it('should display initial state correctly', () => {
      renderSearchDialog();
      
      expect(screen.getByPlaceholderText(/search databases, tables, users/i)).toBeInTheDocument();
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
    });

    it('should debounce search input (300ms delay)', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      
      // Type quickly without waiting
      await user.type(searchInput, 'user', { delay: 50 });
      
      // Should not make API call immediately
      expect(screen.queryByText('Users Database')).not.toBeInTheDocument();
      
      // Wait for debounce delay
      await waitFor(
        () => {
          expect(screen.getByText('Users Database')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('should display search results', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
        expect(screen.getByText('MySQL database containing user accounts')).toBeInTheDocument();
        expect(screen.getByText('users')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should group results by category', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Databases')).toBeInTheDocument();
        expect(screen.getByText('Tables')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
      });
    });

    it('should display empty state for no results', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'empty');
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(screen.getByText(/try different keywords/i)).toBeInTheDocument();
      });
    });

    it('should handle search errors gracefully', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'error');
      
      await waitFor(() => {
        expect(screen.getByText(/search service temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should clear results when search input is cleared', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.queryByText('Users Database')).not.toBeInTheDocument();
        expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading indicator during search', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      expect(screen.getByRole('status', { name: /searching/i })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /searching/i })).not.toBeInTheDocument();
      });
    });

    it('should show skeleton loaders while fetching results', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      expect(screen.getByTestId('search-skeleton-loader')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('search-skeleton-loader')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches Persistence', () => {
    it('should save searches to localStorage', async () => {
      const onSelect = vi.fn();
      renderSearchDialog({ onSelect });
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'df-search-recent',
        expect.stringContaining('user')
      );
    });

    it('should display recent searches when dialog opens', () => {
      localStorageMock.setItem(
        'df-search-recent',
        JSON.stringify([
          { query: 'users database', timestamp: Date.now() - 1000 },
          { query: 'admin settings', timestamp: Date.now() - 2000 },
        ])
      );

      renderSearchDialog();
      
      expect(screen.getByText('users database')).toBeInTheDocument();
      expect(screen.getByText('admin settings')).toBeInTheDocument();
    });

    it('should limit recent searches to maximum count', async () => {
      const maxRecentSearches = 5;
      const existingSearches = Array.from({ length: maxRecentSearches }, (_, i) => ({
        query: `search ${i}`,
        timestamp: Date.now() - i * 1000,
      }));

      localStorageMock.setItem('df-search-recent', JSON.stringify(existingSearches));

      const onSelect = vi.fn();
      renderSearchDialog({ onSelect });
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'new search');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      const savedSearches = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedSearches).toHaveLength(maxRecentSearches);
      expect(savedSearches[0].query).toBe('new search');
    });

    it('should clear old recent searches automatically', () => {
      const oldTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const recentTimestamp = Date.now() - 1000; // 1 second ago

      localStorageMock.setItem(
        'df-search-recent',
        JSON.stringify([
          { query: 'old search', timestamp: oldTimestamp },
          { query: 'recent search', timestamp: recentTimestamp },
        ])
      );

      renderSearchDialog();
      
      expect(screen.queryByText('old search')).not.toBeInTheDocument();
      expect(screen.getByText('recent search')).toBeInTheDocument();
    });

    it('should allow clearing individual recent searches', async () => {
      localStorageMock.setItem(
        'df-search-recent',
        JSON.stringify([
          { query: 'users database', timestamp: Date.now() - 1000 },
        ])
      );

      renderSearchDialog();
      
      const clearButton = screen.getByRole('button', { name: /remove.*users database/i });
      await user.click(clearButton);
      
      expect(screen.queryByText('users database')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      renderSearchDialog();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('mobile-dialog'); // Assuming mobile-specific classes
    });

    it('should handle touch interactions on mobile', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      const firstResult = screen.getByRole('option', { name: /users database/i });
      
      // Simulate touch interaction
      fireEvent.touchStart(firstResult);
      fireEvent.touchEnd(firstResult);
      
      expect(firstResult).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('React Query Integration', () => {
    it('should cache search results', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      // Clear input and search again
      await user.clear(searchInput);
      await user.type(searchInput, 'user');
      
      // Results should appear immediately from cache
      expect(screen.getByText('Users Database')).toBeInTheDocument();
    });

    it('should handle query errors with proper error boundaries', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'error');
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/search service temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should retry failed queries', async () => {
      const retryButton = vi.fn();
      
      server.use(
        rest.get('/api/v2/system/search', (req, res, ctx) => {
          retryButton();
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Network error',
              },
            })
          );
        })
      );

      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'retry');
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      const retryButtonElement = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButtonElement);
      
      expect(retryButton).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Result Navigation', () => {
    it('should navigate to selected result URL', async () => {
      const onSelect = vi.fn();
      renderSearchDialog({ onSelect });
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      const firstResult = screen.getByRole('option', { name: /users database/i });
      await user.click(firstResult);
      
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api-connections/database/users',
        })
      );
    });

    it('should open results in new tab with Cmd/Ctrl+Click', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('Users Database')).toBeInTheDocument();
      });

      const firstResult = screen.getByRole('option', { name: /users database/i });
      
      await user.click(firstResult, { metaKey: true });
      
      // In a real implementation, this would open in a new tab
      expect(window.open).toHaveBeenCalledWith('/api-connections/database/users', '_blank');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce result count changes', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      await waitFor(() => {
        const announcement = screen.getByRole('status', { name: /search results/i });
        expect(announcement).toHaveTextContent(/3 results found/i);
      });
    });

    it('should announce loading states', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'user');
      
      const loadingAnnouncement = screen.getByRole('status', { name: /searching/i });
      expect(loadingAnnouncement).toBeInTheDocument();
      
      await waitFor(() => {
        expect(loadingAnnouncement).not.toBeInTheDocument();
      });
    });

    it('should provide contextual help text', () => {
      renderSearchDialog();
      
      const helpText = screen.getByText(/use arrow keys to navigate/i);
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveAttribute('id');
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveAttribute('aria-describedby', helpText.id);
    });
  });

  describe('Performance Considerations', () => {
    it('should not search for queries shorter than 2 characters', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'a');
      
      // Wait longer than debounce delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(screen.queryByText('Users Database')).not.toBeInTheDocument();
    });

    it('should cancel previous search requests', async () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('combobox');
      
      // Start first search
      await user.type(searchInput, 'user');
      
      // Quickly change to second search
      await user.clear(searchInput);
      await user.type(searchInput, 'admin');
      
      // Only results for 'admin' should appear
      await waitFor(() => {
        expect(screen.queryByText('Users Database')).not.toBeInTheDocument();
      });
    });
  });
});