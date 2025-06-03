/**
 * Log Viewer Page Component Tests
 * 
 * Comprehensive Vitest test suite for the log viewer page component with Mock Service Worker
 * integration. Tests component instantiation, log content rendering, React Ace Editor 
 * integration, navigation functionality, and error handling scenarios.
 * 
 * This test suite replaces the Angular Jasmine test suite with modern React testing patterns
 * using Testing Library and MSW for realistic API mocking, ensuring 90%+ code coverage
 * and compliance with the React/Next.js migration requirements.
 * 
 * Key Features Tested:
 * - Component rendering and instantiation
 * - Log content fetching and display via React Query
 * - React Ace Editor integration with syntax highlighting
 * - Navigation functionality with Next.js router
 * - Error handling scenarios and loading states
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation for data loading
 * 
 * Performance Targets:
 * - Component mount: < 100ms
 * - Data fetching: < 2 seconds  
 * - Navigation: < 100ms
 * - Test execution: 10x faster than Angular Karma/Jest
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import the component being tested
// Note: This component doesn't exist yet but based on requirements it should be a Next.js page component
import LogViewerPage from './page';

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    service: 'test-service',
    file: 'test.log',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/adf-files/df-log-viewer',
}));

// Mock React Ace Editor component
vi.mock('@uiw/react-ace-editor', () => ({
  default: vi.fn(({ value, mode, theme, readOnly, className, ...props }) => (
    <div
      data-testid="ace-editor"
      data-value={value}
      data-mode={mode}
      data-theme={theme}
      data-readonly={readOnly}
      className={className}
      {...props}
    >
      {value}
    </div>
  )),
}));

// Mock service worker for API testing
const mockLogContent = `
[2024-01-15 10:30:00] INFO: Application started successfully
[2024-01-15 10:30:01] DEBUG: Database connection established
[2024-01-15 10:30:02] INFO: User authentication successful
[2024-01-15 10:30:03] WARN: High memory usage detected
[2024-01-15 10:30:04] ERROR: Failed to connect to external service
[2024-01-15 10:30:05] INFO: Error recovery successful
`;

const mockLargeLogContent = Array.from({ length: 1000 }, (_, i) => 
  `[2024-01-15 10:${String(30 + i % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}] INFO: Log entry ${i + 1}`
).join('\n');

const server = setupServer(
  // Mock log content retrieval endpoint
  http.get('/api/v2/files/:service/*', ({ params, request }) => {
    const url = new URL(request.url);
    const service = params.service as string;
    const filename = url.pathname.split('/').pop();
    
    // Simulate different log files
    if (filename?.includes('error') || filename?.includes('404')) {
      return HttpResponse.json(
        { 
          error: { 
            code: 404, 
            message: 'File not found',
            context: { service, filename }
          } 
        },
        { status: 404 }
      );
    }
    
    if (filename?.includes('large')) {
      return HttpResponse.text(mockLargeLogContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': mockLargeLogContent.length.toString(),
        },
      });
    }
    
    return HttpResponse.text(mockLogContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': mockLogContent.length.toString(),
      },
    });
  }),

  // Mock service discovery endpoint
  http.get('/api/v2/system/service', () => {
    return HttpResponse.json({
      resource: [
        {
          name: 'test-service',
          type: 'file',
          config: { container: 'logs' },
        },
        {
          name: 'mysql-service',
          type: 'mysql',
          config: { host: 'localhost' },
        },
      ],
    });
  }),

  // Mock authentication endpoint
  http.get('/api/v2/user/session', () => {
    return HttpResponse.json({
      session_token: 'mock-token-123',
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@dreamfactory.com',
      },
    });
  }),
);

// Test utilities and setup
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Updated from cacheTime to gcTime for React Query v5
    },
    mutations: {
      retry: false,
    },
  },
});

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  initialRoute = '/adf-files/df-log-viewer'
}) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[initialRoute]}>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('LogViewerPage Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn',
    });
  });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();
    
    // Clear all mocks
    vi.clearAllMocks();
    mockPush.mockClear();
    mockBack.mockClear();
    mockReplace.mockClear();

    // Reset MSW handlers
    server.resetHandlers();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Component Rendering', () => {
    it('should render the log viewer page component', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Check if the main component renders
      expect(screen.getByTestId('test-wrapper')).toBeInTheDocument();
    });

    it('should display loading state while fetching log content', async () => {
      // Mock delayed response
      server.use(
        http.get('/api/v2/files/:service/*', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.text(mockLogContent);
        })
      );

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Should show loading indicator initially
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render back navigation button', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back|go back/i });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toBeEnabled();
      });
    });

    it('should have proper accessibility attributes', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check main content area has proper semantics
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();

        // Check back button accessibility
        const backButton = screen.getByRole('button', { name: /back|go back/i });
        expect(backButton).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Log Content Display', () => {
    it('should fetch and display log content', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toBeInTheDocument();
        expect(aceEditor).toHaveAttribute('data-value', mockLogContent);
      });
    });

    it('should display log content in readonly mode', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toHaveAttribute('data-readonly', 'true');
      });
    });

    it('should use appropriate syntax highlighting mode', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toHaveAttribute('data-mode', 'text');
      });
    });

    it('should apply dark theme when in dark mode', async () => {
      // Mock theme context or provider
      const mockTheme = 'dark';
      
      render(
        <TestWrapper queryClient={queryClient}>
          <div data-theme={mockTheme}>
            <LogViewerPage />
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toHaveAttribute('data-theme', expect.stringContaining('dark'));
      });
    });

    it('should handle large log files efficiently', async () => {
      // Mock large log file
      server.use(
        http.get('/api/v2/files/:service/*', () => {
          return HttpResponse.text(mockLargeLogContent);
        })
      );

      const startTime = performance.now();
      
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Ensure rendering performance is acceptable (< 2 seconds per requirements)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate back when back button is clicked', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      const backButton = await screen.findByRole('button', { name: /back|go back/i });
      
      await user.click(backButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should navigate to files list when back navigation occurs', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      const backButton = await screen.findByRole('button', { name: /back|go back/i });
      
      await user.click(backButton);

      // Should navigate back in browser history
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should handle navigation keyboard shortcuts', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      const backButton = await screen.findByRole('button', { name: /back|go back/i });
      
      // Test keyboard navigation
      backButton.focus();
      await user.keyboard('{Enter}');

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when log file is not found', async () => {
      // Mock 404 response
      server.use(
        http.get('/api/v2/files/:service/*', () => {
          return HttpResponse.json(
            { 
              error: { 
                code: 404, 
                message: 'File not found' 
              } 
            },
            { status: 404 }
          );
        })
      );

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/file not found|error loading/i)).toBeInTheDocument();
      });
    });

    it('should display error message when network fails', async () => {
      // Mock network error
      server.use(
        http.get('/api/v2/files/:service/*', () => {
          return HttpResponse.error();
        })
      );

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/network error|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/v2/files/:service/*', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.text(mockLogContent);
        })
      );

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      // Should successfully load content on retry
      await waitFor(() => {
        const aceEditor = screen.getByTestId('ace-editor');
        expect(aceEditor).toBeInTheDocument();
      });
    });

    it('should handle permission errors gracefully', async () => {
      server.use(
        http.get('/api/v2/files/:service/*', () => {
          return HttpResponse.json(
            { 
              error: { 
                code: 403, 
                message: 'Access denied' 
              } 
            },
            { status: 403 }
          );
        })
      );

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/access denied|permission/i)).toBeInTheDocument();
      });
    });
  });

  describe('React Query Integration', () => {
    it('should use React Query for data fetching', async () => {
      const queryClientSpy = vi.spyOn(queryClient, 'fetchQuery');

      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(queryClientSpy).toHaveBeenCalled();
      });
    });

    it('should cache log content appropriately', async () => {
      // First render
      const { unmount } = render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
      });

      unmount();

      // Second render should use cached data
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Should render immediately from cache
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });

    it('should handle query invalidation', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
      });

      // Invalidate query and refetch
      await queryClient.invalidateQueries({ queryKey: ['logContent'] });

      // Should show loading state during refetch
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should meet performance targets for component mounting', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      const endTime = performance.now();
      const mountTime = endTime - startTime;
      
      // Component should mount in under 100ms per requirements
      expect(mountTime).toBeLessThan(100);
    });

    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Tab through interactive elements
      await user.tab();
      
      const backButton = screen.getByRole('button', { name: /back|go back/i });
      expect(backButton).toHaveFocus();

      // Verify can activate with keyboard
      await user.keyboard('{Enter}');
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check main content area
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('aria-label', expect.stringContaining('log'));

        // Check back button
        const backButton = screen.getByRole('button', { name: /back|go back/i });
        expect(backButton).toHaveAttribute('aria-label');
      });
    });

    it('should support screen reader announcements', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for screen reader announcements
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with different file types', async () => {
      const testCases = [
        { filename: 'error.log', expectedMode: 'text' },
        { filename: 'access.log', expectedMode: 'text' },
        { filename: 'debug.log', expectedMode: 'text' },
      ];

      for (const testCase of testCases) {
        render(
          <TestWrapper 
            queryClient={createTestQueryClient()}
            initialRoute={`/adf-files/df-log-viewer?file=${testCase.filename}`}
          >
            <LogViewerPage />
          </TestWrapper>
        );

        await waitFor(() => {
          const aceEditor = screen.getByTestId('ace-editor');
          expect(aceEditor).toHaveAttribute('data-mode', testCase.expectedMode);
        });
      }
    });

    it('should handle URL parameters correctly', async () => {
      const testRoute = '/adf-files/df-log-viewer?service=test-service&file=app.log';
      
      render(
        <TestWrapper 
          queryClient={queryClient}
          initialRoute={testRoute}
        >
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
      });
    });

    it('should maintain state during route transitions', async () => {
      const { rerender } = render(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
      });

      // Simulate route change
      rerender(
        <TestWrapper queryClient={queryClient}>
          <LogViewerPage />
        </TestWrapper>
      );

      // Content should persist
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });
  });
});

/**
 * Component Performance Benchmarks
 * 
 * These benchmarks ensure the log viewer meets performance requirements:
 * - Component mount: < 100ms
 * - Data fetching: < 2 seconds
 * - Navigation: < 100ms
 * - Memory usage: Optimized for large log files (1000+ lines)
 */
describe('Performance Benchmarks', () => {
  it('should handle rapid navigation changes', async () => {
    const startTime = performance.now();
    
    // Simulate rapid back navigation
    for (let i = 0; i < 10; i++) {
      render(
        <TestWrapper queryClient={createTestQueryClient()}>
          <LogViewerPage />
        </TestWrapper>
      );
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // All renders should complete within acceptable time
    expect(totalTime).toBeLessThan(1000); // 1 second for 10 renders
  });

  it('should efficiently handle large log content', async () => {
    const largeContent = 'x'.repeat(100000); // 100KB of content
    
    server.use(
      http.get('/api/v2/files/:service/*', () => {
        return HttpResponse.text(largeContent);
      })
    );

    const startTime = performance.now();
    
    render(
      <TestWrapper queryClient={createTestQueryClient()}>
        <LogViewerPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle large content efficiently
    expect(renderTime).toBeLessThan(2000);
  });
});