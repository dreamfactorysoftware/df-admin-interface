/**
 * Log Viewer Page Component Test Suite
 * 
 * Comprehensive Vitest test suite for the log viewer page component with Mock Service Worker
 * integration. Tests component instantiation, log content rendering, React Ace Editor 
 * integration, navigation functionality, and error handling scenarios. Replaces Angular 
 * Jasmine tests with modern React testing patterns using Testing Library and MSW for 
 * realistic API mocking.
 * 
 * Testing Coverage:
 * - Component rendering and instantiation
 * - Log content loading and display via React Query
 * - React Ace Editor integration with syntax highlighting
 * - Navigation functionality and back button behavior
 * - Loading states and skeleton UI
 * - Error handling and network failure scenarios
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Responsive design and mobile compatibility
 * - Next.js router integration and middleware behavior
 * 
 * Technical Implementation:
 * - Vitest 2.1.0 testing framework for 10x faster test execution
 * - Mock Service Worker 0.49.0 for realistic API mocking
 * - React Testing Library with enhanced component testing utilities
 * - React Query testing patterns for server state management
 * - Next.js 15.1 router mocking for navigation testing
 * - TypeScript 5.8+ integration with enhanced type safety
 * 
 * Performance Requirements:
 * - Test suite execution < 5 seconds
 * - 90%+ code coverage across all test scenarios
 * - Memory efficient test isolation and cleanup
 * - Parallel test execution capability
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { 
  render, 
  screen, 
  waitFor, 
  fireEvent,
  within,
  renderWithProviders,
  renderWithQuery,
  createMockRouter,
  accessibilityUtils,
  headlessUIUtils,
  userEvent,
} from '@/test/utils/test-utils';
import { QueryClient } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import LogViewerPage from './page';

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Data and Configuration
 * 
 * Realistic mock data that simulates DreamFactory log file content with various
 * scenarios including different log levels, timestamps, and content types.
 */
const mockLogContent = {
  application: `[2024-03-15 11:45:00] INFO: Application started successfully
[2024-03-15 11:44:30] INFO: Database connection established
[2024-03-15 11:44:25] INFO: Loading configuration from /config.json
[2024-03-15 11:44:20] INFO: DreamFactory initializing...
[2024-03-15 11:30:15] INFO: User 'admin' logged in successfully
[2024-03-15 11:25:42] INFO: API endpoint /api/v2/mysql/users accessed
[2024-03-15 11:20:18] INFO: File upload completed: /uploads/document.pdf
[2024-03-15 11:15:33] WARN: High memory usage detected: 85%
[2024-03-15 11:10:27] INFO: Schema discovery completed for service 'mysql_production'
[2024-03-15 11:05:45] INFO: Service 'mysql_production' connection tested successfully`,

  error: `[2024-03-15 09:30:15] ERROR: Database connection timeout for service 'mysql_staging'
[2024-03-15 09:25:42] ERROR: Invalid API key provided in request header
[2024-03-15 09:20:18] ERROR: File upload failed: insufficient disk space
[2024-03-15 09:15:33] WARN: Rate limit exceeded for IP 192.168.1.100
[2024-03-15 09:10:27] ERROR: Schema discovery failed: table 'users' not found
[2024-03-15 09:05:45] ERROR: Authentication failed for user 'test@example.com'`,

  access: `192.168.1.100 - admin [15/Mar/2024:11:45:00 +0000] "GET /api/v2/mysql/users HTTP/1.1" 200 2048
192.168.1.101 - developer [15/Mar/2024:11:40:30 +0000] "POST /api/v2/system/service HTTP/1.1" 201 1024
192.168.1.102 - user1 [15/Mar/2024:11:35:15 +0000] "GET /api/v2/files/ HTTP/1.1" 200 4096
192.168.1.100 - admin [15/Mar/2024:11:30:45 +0000] "GET /api/v2/mysql/_schema HTTP/1.1" 200 8192
192.168.1.103 - analyst [15/Mar/2024:11:25:20 +0000] "GET /api/v2/postgresql/products HTTP/1.1" 200 3072`,

  empty: '',

  large: Array.from({ length: 1000 }, (_, i) => 
    `[2024-03-15 ${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00] INFO: Log entry ${i + 1} with detailed information`
  ).join('\n'),
};

/**
 * Mock Router Configuration
 * 
 * Configures Next.js router mocking for navigation testing with proper
 * hierarchy and parameter handling.
 */
const createLogViewerMockRouter = (params = {}) => {
  return createMockRouter({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    ...params,
  });
};

/**
 * Query Client Configuration
 * 
 * Creates a fresh QueryClient for each test with optimized settings for
 * testing scenarios including disabled retries and reduced cache times.
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// ============================================================================
// MSW HANDLERS FOR LOG VIEWER TESTING
// ============================================================================

/**
 * Log File API Handlers
 * 
 * Mock Service Worker handlers specifically for log file access endpoints
 * including success scenarios, error conditions, and edge cases.
 */
const logHandlers = {
  /**
   * Successful log content retrieval
   */
  success: (logType: keyof typeof mockLogContent = 'application') =>
    http.get('/api/v2/logs/:filename', ({ params }) => {
      const { filename } = params;
      const content = mockLogContent[logType] || mockLogContent.application;
      
      return HttpResponse.json({
        name: filename,
        path: `/logs/${filename}`,
        type: 'file',
        size: content.length,
        content_type: 'text/plain',
        content,
        last_modified: '2024-03-15T11:45:00Z',
      });
    }),

  /**
   * Network error simulation
   */
  networkError: () =>
    http.get('/api/v2/logs/:filename', () => {
      return HttpResponse.error();
    }),

  /**
   * 404 Not Found error
   */
  notFound: () =>
    http.get('/api/v2/logs/:filename', () => {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'Log file not found',
            context: {
              resource: 'log file',
              service: 'logs',
            },
          },
        },
        { status: 404 }
      );
    }),

  /**
   * 403 Forbidden error (insufficient permissions)
   */
  forbidden: () =>
    http.get('/api/v2/logs/:filename', () => {
      return HttpResponse.json(
        {
          error: {
            code: 403,
            message: 'Insufficient permissions to access log files',
            context: {
              resource: 'log file',
              service: 'logs',
              required_role: 'admin',
            },
          },
        },
        { status: 403 }
      );
    }),

  /**
   * Large file with streaming support
   */
  largeFile: () =>
    http.get('/api/v2/logs/:filename', ({ params }) => {
      const { filename } = params;
      
      return HttpResponse.json({
        name: filename,
        path: `/logs/${filename}`,
        type: 'file',
        size: mockLogContent.large.length,
        content_type: 'text/plain',
        content: mockLogContent.large,
        last_modified: '2024-03-15T11:45:00Z',
        metadata: {
          line_count: 1000,
          file_size_mb: 2.5,
          encoding: 'utf-8',
        },
      });
    }),

  /**
   * Empty log file
   */
  emptyFile: () =>
    http.get('/api/v2/logs/:filename', ({ params }) => {
      const { filename } = params;
      
      return HttpResponse.json({
        name: filename,
        path: `/logs/${filename}`,
        type: 'file',
        size: 0,
        content_type: 'text/plain',
        content: '',
        last_modified: '2024-03-15T10:00:00Z',
      });
    }),

  /**
   * Slow response simulation for loading state testing
   */
  slowResponse: (delay = 2000) =>
    http.get('/api/v2/logs/:filename', async ({ params }) => {
      const { filename } = params;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return HttpResponse.json({
        name: filename,
        path: `/logs/${filename}`,
        type: 'file',
        size: mockLogContent.application.length,
        content_type: 'text/plain',
        content: mockLogContent.application,
        last_modified: '2024-03-15T11:45:00Z',
      });
    }),
};

// ============================================================================
// HELPER FUNCTIONS AND UTILITIES
// ============================================================================

/**
 * Render Log Viewer Component
 * 
 * Utility function for rendering the LogViewerPage component with all
 * necessary providers and mock configurations.
 */
const renderLogViewer = (options: {
  routerParams?: Record<string, any>;
  queryClient?: QueryClient;
  logFilename?: string;
  initialData?: any;
} = {}) => {
  const {
    routerParams = {},
    queryClient = createTestQueryClient(),
    logFilename = 'application.log',
    initialData,
  } = options;

  const mockRouter = createLogViewerMockRouter(routerParams);

  const providerOptions = {
    router: mockRouter,
    pathname: `/adf-files/df-log-viewer/${logFilename}`,
    searchParams: new URLSearchParams({ file: logFilename }),
    queryClient,
    user: {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      sessionToken: 'mock-session-token',
    },
  };

  // Set initial data if provided
  if (initialData) {
    queryClient.setQueryData(['log-content', logFilename], initialData);
  }

  const result = renderWithProviders(
    <LogViewerPage params={{ filename: logFilename }} />,
    { providerOptions }
  );

  return {
    ...result,
    mockRouter,
    queryClient,
  };
};

/**
 * Wait for Ace Editor to Load
 * 
 * Utility function that waits for the React Ace Editor component to be
 * fully loaded and rendered with content.
 */
const waitForAceEditor = async () => {
  await waitFor(() => {
    const editor = screen.getByTestId('ace-editor');
    expect(editor).toBeInTheDocument();
  }, { timeout: 5000 });
};

/**
 * Get Editor Content
 * 
 * Utility function to extract content from the React Ace Editor for
 * testing purposes.
 */
const getEditorContent = () => {
  const editor = screen.getByTestId('ace-editor');
  return editor.getAttribute('data-content') || '';
};

// ============================================================================
// MAIN TEST SUITES
// ============================================================================

describe('LogViewerPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  // ==========================================================================
  // COMPONENT INSTANTIATION AND RENDERING TESTS
  // ==========================================================================

  describe('Component Instantiation', () => {
    it('should render without crashing', () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient });
      
      expect(screen.getByTestId('log-viewer-page')).toBeInTheDocument();
    });

    it('should render with proper semantic structure', () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient });
      
      // Check main content area
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check navigation
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check back button
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should have proper page title and metadata', () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient, logFilename: 'application.log' });
      
      expect(document.title).toContain('Log Viewer');
      expect(screen.getByText(/application\.log/i)).toBeInTheDocument();
    });

    it('should render with proper CSS classes and styling', () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient });
      
      const page = screen.getByTestId('log-viewer-page');
      expect(page).toHaveTailwindClass('min-h-screen');
      expect(page).toHaveTailwindClass('bg-gray-50');
    });
  });

  // ==========================================================================
  // LOG CONTENT LOADING AND DISPLAY TESTS
  // ==========================================================================

  describe('Log Content Loading', () => {
    it('should display loading state while fetching log content', async () => {
      server.use(logHandlers.slowResponse(1000));
      
      renderLogViewer({ queryClient });
      
      // Check loading spinner is displayed
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading log content/i)).toBeInTheDocument();
      
      // Loading should have proper accessibility attributes
      const loadingElement = screen.getByTestId('loading-spinner');
      expect(loadingElement).toHaveAriaAttribute('aria-label', 'Loading log content');
      expect(loadingElement).toHaveAriaAttribute('role', 'status');
    });

    it('should display log content after successful loading', async () => {
      server.use(logHandlers.success('application'));
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const content = getEditorContent();
      expect(content).toContain('Application started successfully');
      expect(content).toContain('Database connection established');
      expect(content).toContain('DreamFactory initializing...');
    });

    it('should handle different log file types correctly', async () => {
      const testCases = [
        { type: 'application', expectedContent: 'Application started successfully' },
        { type: 'error', expectedContent: 'Database connection timeout' },
        { type: 'access', expectedContent: 'GET /api/v2/mysql/users HTTP/1.1' },
      ] as const;

      for (const { type, expectedContent } of testCases) {
        server.use(logHandlers.success(type));
        
        const { unmount } = renderLogViewer({ 
          queryClient: createTestQueryClient(),
          logFilename: `${type}.log`
        });
        
        await waitForAceEditor();
        
        const content = getEditorContent();
        expect(content).toContain(expectedContent);
        
        unmount();
      }
    });

    it('should display empty state for empty log files', async () => {
      server.use(logHandlers.emptyFile());
      
      renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-log-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/no log content available/i)).toBeInTheDocument();
      expect(screen.getByText(/this log file is empty/i)).toBeInTheDocument();
    });

    it('should handle large log files with performance optimization', async () => {
      server.use(logHandlers.largeFile());
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check that virtual scrolling is enabled for large files
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAttribute('data-virtual-scroll', 'true');
      
      // Check that line count is displayed
      expect(screen.getByText(/1000 lines/i)).toBeInTheDocument();
      
      // Check that file size is displayed
      expect(screen.getByText(/2\.5 MB/i)).toBeInTheDocument();
    });

    it('should refresh log content when refresh button is clicked', async () => {
      server.use(logHandlers.success('application'));
      
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
      
      // Click refresh button
      await user.click(refreshButton);
      
      // Should show loading state again
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      // Content should reload
      await waitForAceEditor();
      expect(getEditorContent()).toContain('Application started successfully');
    });
  });

  // ==========================================================================
  // REACT ACE EDITOR INTEGRATION TESTS
  // ==========================================================================

  describe('React Ace Editor Integration', () => {
    beforeEach(() => {
      server.use(logHandlers.success('application'));
    });

    it('should render Ace Editor with log content', async () => {
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('data-mode', 'log');
      expect(editor).toHaveAttribute('data-theme', 'monokai');
    });

    it('should configure Ace Editor with proper settings', async () => {
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const editor = screen.getByTestId('ace-editor');
      
      // Check editor configuration
      expect(editor).toHaveAttribute('data-read-only', 'true');
      expect(editor).toHaveAttribute('data-show-gutter', 'true');
      expect(editor).toHaveAttribute('data-show-line-numbers', 'true');
      expect(editor).toHaveAttribute('data-wrap', 'true');
      expect(editor).toHaveAttribute('data-font-size', '14');
    });

    it('should support syntax highlighting for different log formats', async () => {
      const testCases = [
        { logType: 'application', expectedMode: 'log' },
        { logType: 'error', expectedMode: 'log' },
        { logType: 'access', expectedMode: 'apache_access' },
      ] as const;

      for (const { logType, expectedMode } of testCases) {
        server.use(logHandlers.success(logType));
        
        const { unmount } = renderLogViewer({ 
          queryClient: createTestQueryClient(),
          logFilename: `${logType}.log`
        });
        
        await waitForAceEditor();
        
        const editor = screen.getByTestId('ace-editor');
        expect(editor).toHaveAttribute('data-mode', expectedMode);
        
        unmount();
      }
    });

    it('should support theme switching', async () => {
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      expect(themeToggle).toBeInTheDocument();
      
      // Toggle to dark theme
      await user.click(themeToggle);
      
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAttribute('data-theme', 'monokai');
      
      // Toggle back to light theme
      await user.click(themeToggle);
      expect(editor).toHaveAttribute('data-theme', 'github');
    });

    it('should support search functionality within logs', async () => {
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Open search dialog
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);
      
      const searchDialog = screen.getByRole('dialog', { name: /search logs/i });
      expect(searchDialog).toBeInTheDocument();
      
      // Enter search term
      const searchInput = within(searchDialog).getByRole('textbox', { name: /search term/i });
      await user.type(searchInput, 'Database');
      
      // Perform search
      const searchSubmitButton = within(searchDialog).getByRole('button', { name: /search/i });
      await user.click(searchSubmitButton);
      
      // Check search results are highlighted
      await waitFor(() => {
        expect(screen.getByTestId('search-highlight')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/1 of 1 matches/i)).toBeInTheDocument();
    });

    it('should handle copy to clipboard functionality', async () => {
      // Mock clipboard API
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });
      
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      await user.click(copyButton);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Application started successfully')
      );
      
      // Check success notification
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
    });

    it('should support keyboard shortcuts', async () => {
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const editor = screen.getByTestId('ace-editor');
      editor.focus();
      
      // Test Ctrl+F for search
      await user.keyboard('{Control>}f{/Control}');
      expect(screen.getByRole('dialog', { name: /search logs/i })).toBeInTheDocument();
      
      // Close search
      await user.keyboard('{Escape}');
      
      // Test Ctrl+A for select all
      await user.keyboard('{Control>}a{/Control}');
      
      // Test Ctrl+C for copy
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });
      
      await user.keyboard('{Control>}c{/Control}');
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // NAVIGATION FUNCTIONALITY TESTS
  // ==========================================================================

  describe('Navigation Functionality', () => {
    beforeEach(() => {
      server.use(logHandlers.success());
    });

    it('should render back button with proper accessibility', () => {
      renderLogViewer({ queryClient });
      
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toBeKeyboardAccessible();
      expect(backButton).toHaveAriaAttribute('aria-label', 'Go back to file list');
    });

    it('should navigate back when back button is clicked', async () => {
      const { user, mockRouter } = renderLogViewer({ queryClient });
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });

    it('should navigate back with keyboard activation', async () => {
      const { user, mockRouter } = renderLogViewer({ queryClient });
      
      const backButton = screen.getByRole('button', { name: /back/i });
      backButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockRouter.back).toHaveBeenCalledTimes(1);
      
      await user.keyboard('{Space}');
      expect(mockRouter.back).toHaveBeenCalledTimes(2);
    });

    it('should support browser back/forward navigation', async () => {
      const { mockRouter } = renderLogViewer({ queryClient });
      
      // Simulate browser back button
      fireEvent.popState(window);
      
      // Should handle browser navigation appropriately
      expect(mockRouter.back).not.toHaveBeenCalled(); // Component should not interfere
    });

    it('should maintain proper URL structure', () => {
      renderLogViewer({ 
        queryClient, 
        logFilename: 'application.log',
        routerParams: {
          pathname: '/adf-files/df-log-viewer/application.log',
        }
      });
      
      expect(screen.getByTestId('log-viewer-page')).toHaveAttribute(
        'data-current-path', 
        expect.stringContaining('application.log')
      );
    });

    it('should handle navigation with URL parameters', () => {
      renderLogViewer({ 
        queryClient,
        routerParams: {
          searchParams: new URLSearchParams({ 
            file: 'error.log',
            line: '10',
            highlight: 'ERROR'
          }),
        }
      });
      
      // Should apply URL parameters to log viewer
      expect(screen.getByTestId('log-viewer-page')).toHaveAttribute(
        'data-highlight-term', 
        'ERROR'
      );
      expect(screen.getByTestId('log-viewer-page')).toHaveAttribute(
        'data-initial-line', 
        '10'
      );
    });
  });

  // ==========================================================================
  // ERROR HANDLING AND EDGE CASES
  // ==========================================================================

  describe('Error Handling', () => {
    it('should display error state for network failures', async () => {
      server.use(logHandlers.networkError());
      
      renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/failed to load log content/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
      
      // Should have retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should display 404 error for missing log files', async () => {
      server.use(logHandlers.notFound());
      
      renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('not-found-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/log file not found/i)).toBeInTheDocument();
      expect(screen.getByText(/the requested log file does not exist/i)).toBeInTheDocument();
    });

    it('should display permission error for unauthorized access', async () => {
      server.use(logHandlers.forbidden());
      
      renderLogViewer({ 
        queryClient,
        routerParams: {
          user: {
            id: '2',
            email: 'user@example.com',
            firstName: 'Regular',
            lastName: 'User',
            isAdmin: false,
          }
        }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('permission-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
      expect(screen.getByText(/admin role required/i)).toBeInTheDocument();
    });

    it('should handle retry functionality after errors', async () => {
      // Start with network error
      server.use(logHandlers.networkError());
      
      const { user } = renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      
      // Switch to successful response
      server.use(logHandlers.success());
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      // Should load successfully
      await waitForAceEditor();
      expect(getEditorContent()).toContain('Application started successfully');
    });

    it('should handle malformed log content gracefully', async () => {
      server.use(
        http.get('/api/v2/logs/:filename', () => {
          return HttpResponse.json({
            name: 'malformed.log',
            path: '/logs/malformed.log',
            type: 'file',
            size: 100,
            content_type: 'text/plain',
            content: null, // Malformed content
            last_modified: '2024-03-15T11:45:00Z',
          });
        })
      );
      
      renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('content-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/invalid log content/i)).toBeInTheDocument();
    });

    it('should handle timeout scenarios', async () => {
      server.use(logHandlers.slowResponse(10000));
      
      renderLogViewer({ queryClient });
      
      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      // Wait for timeout
      await waitFor(() => {
        expect(screen.getByTestId('timeout-error')).toBeInTheDocument();
      }, { timeout: 15000 });
      
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY COMPLIANCE TESTS
  // ==========================================================================

  describe('Accessibility Compliance', () => {
    beforeEach(() => {
      server.use(logHandlers.success());
    });

    it('should meet WCAG 2.1 AA standards', async () => {
      const { container } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check overall accessibility
      expect(container.firstChild).toBeAccessible();
      
      // Check heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAccessibleName();
      
      // Check landmark roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const page = screen.getByTestId('log-viewer-page');
      const { success, focusedElements } = await accessibilityUtils.testKeyboardNavigation(page, user);
      
      expect(success).toBe(true);
      expect(focusedElements.length).toBeGreaterThan(0);
      
      // All interactive elements should be focusable
      const interactiveElements = accessibilityUtils.getFocusableElements(page);
      interactiveElements.forEach(element => {
        expect(accessibilityUtils.isKeyboardAccessible(element)).toBe(true);
      });
    });

    it('should have proper ARIA labels and descriptions', async () => {
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check main content area
      const main = screen.getByRole('main');
      expect(main).toHaveAriaAttribute('aria-label', 'Log file content viewer');
      
      // Check editor
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAriaAttribute('aria-label', 'Log file content');
      expect(editor).toHaveAriaAttribute('role', 'textbox');
      expect(editor).toHaveAriaAttribute('aria-readonly', 'true');
      
      // Check navigation
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAriaAttribute('aria-label', 'Log viewer navigation');
    });

    it('should support screen readers', async () => {
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check for screen reader announcements
      const liveRegion = screen.getByTestId('sr-live-region');
      expect(liveRegion).toHaveAriaAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAriaAttribute('aria-atomic', 'true');
      
      // Content should be announced
      expect(liveRegion).toHaveTextContent(/log content loaded/i);
    });

    it('should have adequate color contrast', async () => {
      const { container } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check all text elements for contrast
      const textElements = container.querySelectorAll('*');
      textElements.forEach(element => {
        if (element.textContent?.trim()) {
          expect(accessibilityUtils.hasAdequateContrast(element as HTMLElement)).toBe(true);
        }
      });
    });

    it('should handle focus management properly', async () => {
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Focus should start on the main content
      const main = screen.getByRole('main');
      expect(document.activeElement).toBe(main);
      
      // Tab to next focusable element
      await user.keyboard('{Tab}');
      
      // Should focus on back button
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(document.activeElement).toBe(backButton);
    });
  });

  // ==========================================================================
  // RESPONSIVE DESIGN AND MOBILE COMPATIBILITY
  // ==========================================================================

  describe('Responsive Design', () => {
    beforeEach(() => {
      server.use(logHandlers.success());
    });

    it('should render properly on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const page = screen.getByTestId('log-viewer-page');
      expect(page).toHaveTailwindClass('px-4'); // Mobile padding
      
      // Editor should adapt to mobile
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAttribute('data-mobile-optimized', 'true');
    });

    it('should render properly on tablet devices', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const page = screen.getByTestId('log-viewer-page');
      expect(page).toHaveTailwindClass('px-6'); // Tablet padding
    });

    it('should render properly on desktop devices', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const page = screen.getByTestId('log-viewer-page');
      expect(page).toHaveTailwindClass('px-8'); // Desktop padding
    });

    it('should support touch interactions on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const backButton = screen.getByRole('button', { name: /back/i });
      
      // Should handle touch events
      fireEvent.touchStart(backButton);
      fireEvent.touchEnd(backButton);
      
      // Should still work with touch
      expect(backButton).toHaveFocus();
    });
  });

  // ==========================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ==========================================================================

  describe('Performance and Optimization', () => {
    beforeEach(() => {
      server.use(logHandlers.success());
    });

    it('should load quickly with proper performance characteristics', async () => {
      const startTime = performance.now();
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle large log files efficiently', async () => {
      server.use(logHandlers.largeFile());
      
      const startTime = performance.now();
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should still load large files within reasonable time
      expect(loadTime).toBeLessThan(5000);
      
      // Should use virtual scrolling
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAttribute('data-virtual-scroll', 'true');
    });

    it('should implement proper memory management', async () => {
      const { unmount } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Unmount component
      unmount();
      
      // Should clean up React Query cache
      expect(queryClient.getQueryData(['log-content', 'application.log'])).toBeUndefined();
    });

    it('should optimize network requests with caching', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/v2/logs/:filename', ({ params }) => {
          requestCount++;
          const { filename } = params;
          
          return HttpResponse.json({
            name: filename,
            path: `/logs/${filename}`,
            type: 'file',
            size: mockLogContent.application.length,
            content_type: 'text/plain',
            content: mockLogContent.application,
            last_modified: '2024-03-15T11:45:00Z',
          });
        })
      );
      
      // First render
      const { unmount: unmount1 } = renderLogViewer({ queryClient });
      await waitForAceEditor();
      unmount1();
      
      expect(requestCount).toBe(1);
      
      // Second render with same query client (should use cache)
      const { unmount: unmount2 } = renderLogViewer({ queryClient });
      await waitForAceEditor();
      unmount2();
      
      // Should still be 1 (cached)
      expect(requestCount).toBe(1);
    });
  });

  // ==========================================================================
  // INTEGRATION WITH REACT QUERY TESTS
  // ==========================================================================

  describe('React Query Integration', () => {
    it('should use React Query for data fetching', async () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Check that data is in React Query cache
      const cacheData = queryClient.getQueryData(['log-content', 'application.log']);
      expect(cacheData).toBeDefined();
      expect(cacheData).toHaveProperty('content');
    });

    it('should handle React Query error states', async () => {
      server.use(logHandlers.networkError());
      
      renderLogViewer({ queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      
      // Check error is in React Query cache
      const queryState = queryClient.getQueryState(['log-content', 'application.log']);
      expect(queryState?.status).toBe('error');
    });

    it('should support React Query refetching', async () => {
      server.use(logHandlers.success());
      
      const { user } = renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      // Should trigger refetch
      const queryState = queryClient.getQueryState(['log-content', 'application.log']);
      expect(queryState?.isFetching).toBe(true);
    });

    it('should implement proper React Query cache invalidation', async () => {
      server.use(logHandlers.success());
      
      renderLogViewer({ queryClient });
      
      await waitForAceEditor();
      
      // Invalidate cache manually
      await queryClient.invalidateQueries({ queryKey: ['log-content'] });
      
      // Should trigger refetch
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// ADDITIONAL TEST UTILITIES AND EXPORTS
// ============================================================================

/**
 * Test utilities specific to log viewer testing
 */
export const logViewerTestUtils = {
  renderLogViewer,
  waitForAceEditor,
  getEditorContent,
  logHandlers,
  mockLogContent,
  createTestQueryClient,
  createLogViewerMockRouter,
};

/**
 * Export test configuration for reuse in other test files
 */
export { mockLogContent, logHandlers };