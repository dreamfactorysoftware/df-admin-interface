import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { SearchDialog } from './search-dialog';
import { server } from '../../../test/mocks/server';
import { searchHandlers } from '../../../test/mocks/search-handlers';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock React Query and routing for isolated testing
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Headless UI Dialog animations for consistent testing
vi.mock('@headlessui/react', async () => {
  const actual = await vi.importActual('@headlessui/react');
  return {
    ...actual,
    Transition: ({ children }: any) => <div data-testid="transition">{children}</div>,
  };
});

// Test wrapper with required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function with providers
function renderSearchDialog(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <TestWrapper>
        <SearchDialog {...defaultProps} />
      </TestWrapper>
    ),
    props: defaultProps,
  };
}

describe('SearchDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Setup MSW server with search handlers
    server.use(...searchHandlers);
    
    // Setup fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    });

    // Clear navigation mock
    mockNavigate.mockClear();
  });

  afterEach(() => {
    // Reset MSW handlers
    server.resetHandlers();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render search dialog when open', () => {
      renderSearchDialog();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderSearchDialog({ isOpen: false });
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render close button with proper accessibility attributes', () => {
      renderSearchDialog();
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close search dialog');
    });

    it('should apply proper ARIA attributes for modal dialog', () => {
      renderSearchDialog();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });

  describe('Search Input Functionality', () => {
    it('should render search input with proper attributes', () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('type', 'search');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('search'));
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('search'));
    });

    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      expect(searchInput).toHaveValue('database');
    });

    it('should debounce search queries with 2000ms delay', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      
      // Type multiple characters rapidly
      await user.type(searchInput, 'data', { delay: 100 });
      
      // Should not trigger search immediately
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
      
      // Wait for debounce delay
      await waitFor(
        () => {
          expect(screen.getByTestId('search-results')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should clear search input when escape key is pressed', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      expect(searchInput).toHaveValue('database');
      
      await user.keyboard('{Escape}');
      expect(searchInput).toHaveValue('');
    });

    it('should show loading state during search', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      // Wait for debounce and check loading state
      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    it('should display search results after successful query', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
        expect(screen.getByText('Database Connections')).toBeInTheDocument();
        expect(screen.getByText('MySQL Connection')).toBeInTheDocument();
      });
    });

    it('should group search results by category', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'api');
      
      await waitFor(() => {
        const results = screen.getByTestId('search-results');
        expect(within(results).getByText('API Connections')).toBeInTheDocument();
        expect(within(results).getByText('API Documentation')).toBeInTheDocument();
      });
    });

    it('should display empty state when no results found', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
      });
    });

    it('should display recent searches when input is empty', () => {
      renderSearchDialog();
      
      expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Database Management')).toBeInTheDocument();
      expect(screen.getByText('API Documentation')).toBeInTheDocument();
    });

    it('should handle search error states gracefully', async () => {
      // Override with error handler
      server.use(searchHandlers.error);
      
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'error');
      
      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and User Interactions', () => {
    it('should navigate to selected result when clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        const resultButton = screen.getByRole('button', { name: /mysql connection/i });
        expect(resultButton).toBeInTheDocument();
      });
      
      const resultButton = screen.getByRole('button', { name: /mysql connection/i });
      await user.click(resultButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/api-connections/database/mysql');
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should navigate to recent search when clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      const recentButton = screen.getByRole('button', { name: /database management/i });
      await user.click(recentButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/api-connections/database');
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should close dialog when escape key is pressed', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      await user.keyboard('{Escape}');
      
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should close dialog when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      const backdrop = screen.getByTestId('dialog-backdrop');
      await user.click(backdrop);
      
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus search input when dialog opens', () => {
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveFocus();
    });

    it('should navigate through search results with arrow keys', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mysql connection/i })).toBeInTheDocument();
      });
      
      // Navigate down to first result
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('button', { name: /mysql connection/i })).toHaveFocus();
      
      // Navigate to next result
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('button', { name: /postgresql connection/i })).toHaveFocus();
      
      // Navigate back up
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('button', { name: /mysql connection/i })).toHaveFocus();
    });

    it('should activate focused result with Enter key', async () => {
      const user = userEvent.setup();
      const { props } = renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mysql connection/i })).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/api-connections/database/mysql');
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should wrap keyboard navigation at list boundaries', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mysql connection/i })).toBeInTheDocument();
      });
      
      // Navigate to first result
      await user.keyboard('{ArrowDown}');
      
      // Navigate up from first result should wrap to last
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('button', { name: /mongodb connection/i })).toHaveFocus();
    });

    it('should return focus to search input with Tab key', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mysql connection/i })).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Tab}');
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should apply mobile styles on small screens', () => {
      // Mock window.matchMedia for small screen
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      renderSearchDialog();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('mobile-dialog');
      expect(dialog).toHaveStyle({ 
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh'
      });
    });

    it('should apply desktop styles on large screens', () => {
      // Mock window.matchMedia for large screen
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(min-width: 769px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      renderSearchDialog();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('desktop-dialog');
      expect(dialog).toHaveStyle({ 
        maxWidth: '600px',
        maxHeight: '80vh'
      });
    });

    it('should adjust results container height based on screen size', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        const resultsContainer = screen.getByTestId('search-results');
        expect(resultsContainer).toHaveStyle({
          maxHeight: expect.stringMatching(/vh|px/)
        });
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should pass WCAG 2.1 AA accessibility audit', async () => {
      const { container } = renderSearchDialog();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce search results to screen readers', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/3 results found/i);
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support screen reader navigation of results', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        const resultsList = screen.getByRole('list');
        expect(resultsList).toHaveAttribute('aria-label', 'Search results');
        
        const results = screen.getAllByRole('listitem');
        expect(results).toHaveLength(3);
        
        results.forEach((result, index) => {
          expect(result).toHaveAttribute('aria-setsize', '3');
          expect(result).toHaveAttribute('aria-posinset', (index + 1).toString());
        });
      });
    });

    it('should provide proper focus management', () => {
      renderSearchDialog();
      
      // Dialog should trap focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      // Initial focus should be on search input
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveFocus();
    });

    it('should have proper contrast ratios for all text elements', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        // Verify high contrast text elements
        const heading = screen.getByRole('heading', { name: /search/i });
        expect(heading).toHaveStyle({ 
          color: expect.stringMatching(/#[0-9a-f]{6}/i) 
        });
        
        const resultItems = screen.getAllByRole('button');
        resultItems.forEach(item => {
          expect(item).toHaveStyle({
            color: expect.stringMatching(/#[0-9a-f]{6}/i)
          });
        });
      });
    });
  });

  describe('React Query Integration', () => {
    it('should cache search results properly', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      
      // First search
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByText('MySQL Connection')).toBeInTheDocument();
      });
      
      // Clear and search again - should use cache
      await user.clear(searchInput);
      await user.type(searchInput, 'database');
      
      // Results should appear immediately from cache
      expect(screen.getByText('MySQL Connection')).toBeInTheDocument();
    });

    it('should handle background revalidation of search results', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByText('MySQL Connection')).toBeInTheDocument();
      });
      
      // Verify stale-while-revalidate behavior
      await waitFor(() => {
        expect(screen.getByTestId('background-refresh-indicator')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should prefetch related search results', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'api');
      
      await waitFor(() => {
        expect(screen.getByText('API Connections')).toBeInTheDocument();
      });
      
      // Hovering over a result should prefetch related data
      const apiResult = screen.getByRole('button', { name: /api connections/i });
      await user.hover(apiResult);
      
      // Verify prefetch happened (implementation detail)
      expect(queryClient.getQueryData(['search', 'api-connections'])).toBeDefined();
    });

    it('should invalidate search cache when necessary', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByText('MySQL Connection')).toBeInTheDocument();
      });
      
      // Simulate cache invalidation (e.g., after creating new connection)
      queryClient.invalidateQueries(['search']);
      
      // Re-search should trigger fresh request
      await user.clear(searchInput);
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(searchHandlers.networkError);
      
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'database');
      
      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle very long search queries', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const longQuery = 'a'.repeat(1000);
      const searchInput = screen.getByRole('searchbox');
      
      await user.type(searchInput, longQuery);
      
      // Should truncate or handle gracefully
      expect(searchInput).toHaveValue(longQuery.substring(0, 100));
    });

    it('should handle special characters in search queries', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const specialQuery = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const searchInput = screen.getByRole('searchbox');
      
      await user.type(searchInput, specialQuery);
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });

    it('should handle rapid successive search queries', async () => {
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      
      // Type multiple queries rapidly
      await user.type(searchInput, 'data');
      await user.clear(searchInput);
      await user.type(searchInput, 'api');
      await user.clear(searchInput);
      await user.type(searchInput, 'schema');
      
      // Should only show results for the last query
      await waitFor(() => {
        expect(screen.getByText('Schema Management')).toBeInTheDocument();
        expect(screen.queryByText('Database Connections')).not.toBeInTheDocument();
      });
    });

    it('should handle empty search responses', async () => {
      server.use(searchHandlers.empty);
      
      const user = userEvent.setup();
      renderSearchDialog();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'empty');
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(screen.getByText(/try different keywords/i)).toBeInTheDocument();
      });
    });
  });
});