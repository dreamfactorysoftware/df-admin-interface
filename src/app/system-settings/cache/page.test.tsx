import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolationsJestAxe } from 'jest-axe';
import { server } from '@/test/setup-tests';
import { http, HttpResponse } from 'msw';
import CachePage from './page';
import { CacheType } from '@/types/cache';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolationsJestAxe);

// Mock the cache table component to isolate page component testing
vi.mock('./cache-table', () => ({
  default: ({ children, onSystemCacheFlush }: any) => (
    <div data-testid="cache-table">
      <div>{children}</div>
      {onSystemCacheFlush && (
        <button onClick={onSystemCacheFlush} data-testid="mock-system-flush">
          Flush System Cache
        </button>
      )}
    </div>
  ),
}));

// Mock next/navigation for router functionality
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock React i18n for translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'cache.title': 'Cache Management',
        'cache.description': 'Manage system and service-specific caches to optimize performance.',
        'cache.flushSystemCache': 'Flush System Cache',
        'cache.systemCacheFlushed': 'System cache flushed successfully',
        'cache.errorFlushingCache': 'Error flushing cache',
        'cache.loading': 'Loading cache data...',
        'common.error': 'Error',
        'common.tryAgain': 'Try Again',
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Test data
const mockCacheData: CacheType[] = [
  {
    name: 'system',
    label: 'System Management',
    description: 'Service for managing system resources.',
    type: 'system',
  },
  {
    name: 'database',
    label: 'Database Service',
    description: 'Service for managing database connections.',
    type: 'database',
  },
  {
    name: 'files',
    label: 'File Service',
    description: 'Service for managing file operations.',
    type: 'files',
  },
];

// Test wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
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

describe('CachePage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Setup default MSW handlers for cache operations
    server.use(
      http.get('/api/v2/system/cache', () => {
        return HttpResponse.json(mockCacheData);
      }),
      http.delete('/api/v2/system/cache', () => {
        return HttpResponse.json({ success: true });
      }),
      http.delete('/api/v2/system/cache/:service', () => {
        return HttpResponse.json({ success: true });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('should render the cache management page with correct title', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /cache management/i })).toBeInTheDocument();
      expect(screen.getByText(/manage system and service-specific caches/i)).toBeInTheDocument();
    });

    it('should render system cache flush button', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      expect(flushButton).toBeInTheDocument();
      expect(flushButton).toBeEnabled();
    });

    it('should render cache table component', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      expect(screen.getByTestId('cache-table')).toBeInTheDocument();
    });

    it('should display loading state initially', async () => {
      // Delay the response to test loading state
      server.use(
        http.get('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(mockCacheData);
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      expect(screen.getByText(/loading cache data/i)).toBeInTheDocument();
    });
  });

  describe('System Cache Flush Operations', () => {
    it('should handle system cache flush successfully', async () => {
      let flushCalled = false;
      server.use(
        http.delete('/api/v2/system/cache', () => {
          flushCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      await waitFor(() => {
        expect(flushCalled).toBe(true);
      });

      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/system cache flushed successfully/i)).toBeInTheDocument();
      });
    });

    it('should disable flush button during operation', async () => {
      // Simulate slow response
      server.use(
        http.delete('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      // Button should be disabled during operation
      expect(flushButton).toBeDisabled();

      // Wait for operation to complete
      await waitFor(() => {
        expect(flushButton).toBeEnabled();
      });
    });

    it('should show loading state during flush operation', async () => {
      server.use(
        http.delete('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle cache loading errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should handle system cache flush errors', async () => {
      server.use(
        http.delete('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      await waitFor(() => {
        expect(screen.getByText(/error flushing cache/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors with retry mechanism', async () => {
      let attemptCount = 0;
      server.use(
        http.get('/api/v2/system/cache', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockCacheData);
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      // First attempt should show error
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });

    it('should handle 403 authorization errors', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('React Query Cache Management', () => {
    it('should invalidate cache after successful system flush', async () => {
      let getCallCount = 0;
      server.use(
        http.get('/api/v2/system/cache', () => {
          getCallCount++;
          return HttpResponse.json(mockCacheData);
        }),
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getCallCount).toBe(1);
      });

      // Flush cache
      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      // Should invalidate and refetch cache data
      await waitFor(() => {
        expect(getCallCount).toBe(2);
      });
    });

    it('should handle optimistic updates correctly', async () => {
      server.use(
        http.delete('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      // Should show optimistic update immediately
      expect(screen.getByText(/flushing cache/i)).toBeInTheDocument();

      // Should confirm after success
      await waitFor(() => {
        expect(screen.getByText(/system cache flushed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle cache rollback on error', async () => {
      server.use(
        http.delete('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      // Should rollback optimistic update on error
      await waitFor(() => {
        expect(screen.getByText(/error flushing cache/i)).toBeInTheDocument();
      });

      // Original state should be restored
      expect(screen.getByTestId('cache-table')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      
      // Tab to button
      await user.tab();
      expect(flushButton).toHaveFocus();

      // Activate with keyboard
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText(/system cache flushed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle rapid consecutive clicks gracefully', async () => {
      let deleteCallCount = 0;
      server.use(
        http.delete('/api/v2/system/cache', () => {
          deleteCallCount++;
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      
      // Click multiple times rapidly
      await user.click(flushButton);
      await user.click(flushButton);
      await user.click(flushButton);

      // Should only make one request due to debouncing
      await waitFor(() => {
        expect(deleteCallCount).toBe(1);
      });
    });

    it('should focus management for screen readers', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      // After operation, focus should return to button or status message
      await waitFor(() => {
        const successMessage = screen.getByText(/system cache flushed successfully/i);
        expect(successMessage).toBeInTheDocument();
        expect(successMessage).toHaveAttribute('role', 'status');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      expect(flushButton).toHaveAttribute('aria-label');
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });

    it('should announce status changes to screen readers', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      await user.click(flushButton);

      await waitFor(() => {
        const statusMessage = screen.getByRole('status');
        expect(statusMessage).toBeInTheDocument();
        expect(statusMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support high contrast mode', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      expect(flushButton).toHaveClass('bg-primary-600');
      expect(flushButton).toHaveClass('text-white');
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and display component errors', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Mock the cache table to throw an error
      vi.mocked(require('./cache-table')).default = ThrowError;

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should allow error recovery', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="cache-table">Recovered</div>;
      };

      vi.mocked(require('./cache-table')).default = ConditionalError;

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Fix the error and retry
      shouldThrow = false;
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should recover
      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce rapid operations', async () => {
      let requestCount = 0;
      server.use(
        http.delete('/api/v2/system/cache', () => {
          requestCount++;
          return HttpResponse.json({ success: true });
        })
      );

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      const flushButton = screen.getByRole('button', { name: /flush system cache/i });
      
      // Simulate rapid clicks
      fireEvent.click(flushButton);
      fireEvent.click(flushButton);
      fireEvent.click(flushButton);

      await waitFor(() => {
        expect(requestCount).toBe(1);
      });
    });

    it('should handle large cache datasets efficiently', async () => {
      const largeCacheData = Array.from({ length: 1000 }, (_, i) => ({
        name: `service-${i}`,
        label: `Service ${i}`,
        description: `Description for service ${i}`,
        type: 'service',
      }));

      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json(largeCacheData);
        })
      );

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render efficiently even with large datasets
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('Internationalization', () => {
    it('should display translated text correctly', async () => {
      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      expect(screen.getByText('Cache Management')).toBeInTheDocument();
      expect(screen.getByText('Flush System Cache')).toBeInTheDocument();
      expect(screen.getByText(/manage system and service-specific caches/i)).toBeInTheDocument();
    });

    it('should handle missing translations gracefully', async () => {
      vi.mocked(require('react-i18next')).useTranslation = () => ({
        t: (key: string) => key, // Return key as fallback
        i18n: { language: 'en' },
      });

      render(
        <TestWrapper>
          <CachePage />
        </TestWrapper>
      );

      // Should display fallback keys instead of failing
      expect(screen.getByText('cache.title')).toBeInTheDocument();
    });
  });
});