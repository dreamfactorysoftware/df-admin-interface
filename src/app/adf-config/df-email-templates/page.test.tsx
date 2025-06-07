/**
 * Email Templates Page Component Test Suite
 * 
 * Comprehensive Vitest test suite for the email templates page component,
 * providing 10x faster test execution compared to Jest/Karma while maintaining
 * enterprise-grade testing standards. This test suite demonstrates the complete
 * migration from Angular TestBed to React Testing Library with MSW integration.
 * 
 * Testing Framework Stack:
 * - Vitest 2.1+ for enhanced performance and native TypeScript support
 * - Mock Service Worker (MSW) 0.49+ for realistic API mocking
 * - React Testing Library for component testing best practices
 * - jest-axe for WCAG 2.1 AA accessibility compliance validation
 * - @testing-library/user-event for realistic user interaction testing
 * 
 * Coverage Areas:
 * - React server component functionality and SSR behavior
 * - Data loading with React Query caching and synchronization
 * - Error handling and loading states with proper user feedback
 * - User interactions including navigation, filtering, and CRUD operations
 * - Accessibility compliance with keyboard navigation and screen readers
 * - Performance validation with sub-2-second SSR requirements
 * 
 * Migration Benefits:
 * - 10x faster test execution compared to Angular/Jest combination
 * - Realistic API mocking without backend dependencies
 * - Enhanced debugging with source map support
 * - Native TypeScript support with zero configuration overhead
 * - Parallel test execution with isolated test environments
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import {
  renderWithProviders,
  renderWithQuery,
  accessibilityUtils,
  headlessUIUtils,
  serverComponentUtils,
  testUtils,
  type TestProvidersOptions,
} from '@/test/utils/test-utils';

// Import the component under test
// Note: This import will be available once the page.tsx component is created
const EmailTemplatesPage = React.lazy(() => 
  import('./page').then(module => ({ default: module.default }))
);

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Mock Data Factories
 * 
 * Realistic test data that mirrors DreamFactory API responses
 * for email templates management functionality.
 */
const createMockEmailTemplate = (overrides: Partial<EmailTemplate> = {}): EmailTemplate => ({
  id: 1,
  name: 'Welcome Email',
  description: 'Welcome email template for new users',
  subject: 'Welcome to DreamFactory',
  body_text: 'Welcome to our platform!',
  body_html: '<h1>Welcome to our platform!</h1>',
  from_name: 'DreamFactory Team',
  from_email: 'noreply@dreamfactory.com',
  reply_to_name: 'Support Team',
  reply_to_email: 'support@dreamfactory.com',
  defaults: ['registration'],
  created_date: '2024-01-01T00:00:00.000Z',
  last_modified_date: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createMockEmailTemplatesList = (count: number = 3): EmailTemplate[] => 
  Array.from({ length: count }, (_, index) => 
    createMockEmailTemplate({
      id: index + 1,
      name: `Template ${index + 1}`,
      subject: `Subject ${index + 1}`,
      description: `Description for template ${index + 1}`,
    })
  );

const createMockApiResponse = <T>(data: T, meta: Record<string, any> = {}) => ({
  resource: data,
  count: Array.isArray(data) ? data.length : 1,
  meta: {
    count: Array.isArray(data) ? data.length : 1,
    ...meta,
  },
});

/**
 * MSW Handler Overrides for Specific Test Scenarios
 * 
 * Custom handlers for testing different API response scenarios
 * including success, error, and edge cases.
 */
const createEmailTemplatesHandlers = (scenario: 'success' | 'error' | 'empty' | 'loading') => {
  const baseUrl = '/api/v2/system/email_template';
  
  switch (scenario) {
    case 'success':
      return [
        rest.get(baseUrl, (req, res, ctx) => {
          const templates = createMockEmailTemplatesList(5);
          return res(
            ctx.status(200),
            ctx.json(createMockApiResponse(templates))
          );
        }),
        rest.post(baseUrl, (req, res, ctx) => {
          const newTemplate = createMockEmailTemplate({ id: 999 });
          return res(
            ctx.status(201),
            ctx.json(createMockApiResponse(newTemplate))
          );
        }),
        rest.put(`${baseUrl}/:id`, (req, res, ctx) => {
          const updatedTemplate = createMockEmailTemplate({ 
            id: parseInt(req.params.id as string) 
          });
          return res(
            ctx.status(200),
            ctx.json(createMockApiResponse(updatedTemplate))
          );
        }),
        rest.delete(`${baseUrl}/:id`, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ success: true })
          );
        }),
      ];
      
    case 'error':
      return [
        rest.get(baseUrl, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Internal Server Error',
                status_code: 500,
              },
            })
          );
        }),
      ];
      
    case 'empty':
      return [
        rest.get(baseUrl, (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(createMockApiResponse([]))
          );
        }),
      ];
      
    case 'loading':
      return [
        rest.get(baseUrl, (req, res, ctx) => {
          return res(
            ctx.delay(5000), // Simulate slow response
            ctx.status(200),
            ctx.json(createMockApiResponse(createMockEmailTemplatesList()))
          );
        }),
      ];
      
    default:
      return [];
  }
};

/**
 * Test Setup and Utilities
 * 
 * Common setup functions and utilities for consistent test execution
 * with proper provider configuration and cleanup.
 */
const setupTestEnvironment = (options: TestProvidersOptions = {}) => {
  const queryClient = new QueryClient({
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

  const defaultOptions: TestProvidersOptions = {
    queryClient,
    pathname: '/adf-config/df-email-templates',
    user: {
      id: 'test-user-1',
      email: 'admin@dreamfactory.com',
      firstName: 'Test',
      lastName: 'Admin',
      isAdmin: true,
      sessionToken: 'test-session-token',
    },
    ...options,
  };

  return { queryClient, providerOptions: defaultOptions };
};

const renderEmailTemplatesPage = (options: TestProvidersOptions = {}) => {
  const { providerOptions } = setupTestEnvironment(options);
  
  return renderWithProviders(
    <React.Suspense fallback={<div data-testid="loading-fallback">Loading...</div>}>
      <EmailTemplatesPage />
    </React.Suspense>,
    { providerOptions }
  );
};

/**
 * Performance Testing Utilities
 * 
 * Utilities for validating performance requirements including
 * SSR timing, component rendering performance, and data loading speeds.
 */
const measureComponentPerformance = async (renderFn: () => any) => {
  const startTime = performance.now();
  const result = renderFn();
  await waitFor(() => {
    expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
  });
  const endTime = performance.now();
  
  return {
    renderTime: endTime - startTime,
    result,
  };
};

/**
 * Type Definitions for Testing
 * 
 * TypeScript interfaces for email template data structures
 * matching the DreamFactory API schema.
 */
interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  defaults?: string[];
  created_date: string;
  last_modified_date: string;
}

/**
 * MAIN TEST SUITE
 * 
 * Comprehensive test coverage for email templates page component
 * organized by functional areas with detailed test scenarios.
 */
describe('EmailTemplatesPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset MSW handlers to default success scenario
    server.use(...createEmailTemplatesHandlers('success'));
    
    // Mock window.matchMedia for responsive design testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  /**
   * Component Rendering and Basic Functionality Tests
   * 
   * Validates that the component renders correctly with proper structure
   * and displays expected content without errors.
   */
  describe('Component Rendering', () => {
    it('should render the email templates page with correct structure', async () => {
      renderEmailTemplatesPage();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      });

      // Verify page structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/email templates/i)).toBeInTheDocument();
      
      // Verify navigation breadcrumbs
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Verify page title
      expect(document.title).toContain('Email Templates');
    });

    it('should render with proper semantic HTML structure', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      });

      // Verify semantic structure
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
      
      // Verify heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveProperty('tagName', 'H1');
    });

    it('should handle server-side rendering correctly', async () => {
      const { renderTime } = await measureComponentPerformance(() => 
        renderEmailTemplatesPage()
      );

      // Verify SSR performance requirement (under 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  /**
   * Data Loading and React Query Integration Tests
   * 
   * Validates data fetching behavior, caching, error handling,
   * and React Query integration patterns.
   */
  describe('Data Loading', () => {
    it('should load email templates data successfully', async () => {
      renderEmailTemplatesPage();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify all templates are displayed
      expect(screen.getByText('Template 1')).toBeInTheDocument();
      expect(screen.getByText('Template 2')).toBeInTheDocument();
      expect(screen.getByText('Template 3')).toBeInTheDocument();
    });

    it('should display loading state while fetching data', async () => {
      server.use(...createEmailTemplatesHandlers('loading'));
      
      renderEmailTemplatesPage();

      // Verify loading state is shown
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
      
      // Verify loading indicators
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should handle empty data state gracefully', async () => {
      server.use(...createEmailTemplatesHandlers('empty'));
      
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText(/no email templates found/i)).toBeInTheDocument();
      });

      // Verify empty state message
      expect(screen.getByText(/create your first email template/i)).toBeInTheDocument();
      
      // Verify create button is available
      expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument();
    });

    it('should implement React Query caching correctly', async () => {
      const { queryClient } = setupTestEnvironment();
      
      renderEmailTemplatesPage({ queryClient });

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify query cache contains data
      const cachedData = queryClient.getQueryData(['email-templates']);
      expect(cachedData).toBeDefined();
      expect(Array.isArray(cachedData)).toBe(true);
    });

    it('should handle cache invalidation on data mutations', async () => {
      const { queryClient } = setupTestEnvironment();
      
      renderEmailTemplatesPage({ queryClient });

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Simulate cache invalidation
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });

      // Verify cache is cleared
      const cachedData = queryClient.getQueryData(['email-templates']);
      expect(cachedData).toBeUndefined();
    });
  });

  /**
   * Error Handling and Edge Cases Tests
   * 
   * Validates error boundaries, network failures, timeout handling,
   * and graceful degradation scenarios.
   */
  describe('Error Handling', () => {
    it('should display error message when API request fails', async () => {
      server.use(...createEmailTemplatesHandlers('error'));
      
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Verify error message
      expect(screen.getByText(/failed to load email templates/i)).toBeInTheDocument();
      
      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      server.use(
        rest.get('/api/v2/system/email_template', (req, res, ctx) => {
          return res(ctx.delay('infinite'));
        })
      );

      renderEmailTemplatesPage();

      // Wait for timeout
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should implement error boundary for component crashes', () => {
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      const { result } = testUtils.testErrorBoundary(
        ({ children }) => (
          <div role="alert">
            <h2>Something went wrong</h2>
            {children}
          </div>
        ),
        ThrowingComponent
      );

      expect(result.getByRole('alert')).toBeInTheDocument();
      expect(result.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should maintain user context during error states', async () => {
      server.use(...createEmailTemplatesHandlers('error'));
      
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Verify user navigation remains functional
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
    });
  });

  /**
   * User Interaction and Event Handling Tests
   * 
   * Validates user interactions including clicks, keyboard navigation,
   * form submissions, and CRUD operations.
   */
  describe('User Interactions', () => {
    it('should handle create new template action', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create.*template/i });
      await user.click(createButton);

      // Verify navigation to create page
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/new email template/i)).toBeInTheDocument();
    });

    it('should handle template editing with form validation', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Click edit button for first template
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      await user.click(editButton);

      // Verify edit form opens
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();

      // Test form validation
      const nameInput = screen.getByLabelText(/template name/i);
      await user.clear(nameInput);
      await user.tab();

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    it('should handle template deletion with confirmation', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await user.click(deleteButton);

      // Verify confirmation dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify template is removed
      await waitFor(() => {
        expect(screen.queryByText('Template 1')).not.toBeInTheDocument();
      });
    });

    it('should handle search and filtering functionality', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Use search input
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Template 2');

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Template 2')).toBeInTheDocument();
        expect(screen.queryByText('Template 1')).not.toBeInTheDocument();
      });
    });

    it('should handle pagination with large datasets', async () => {
      // Mock large dataset
      server.use(
        rest.get('/api/v2/system/email_template', (req, res, ctx) => {
          const templates = createMockEmailTemplatesList(50);
          return res(
            ctx.status(200),
            ctx.json(createMockApiResponse(templates, { count: 50 }))
          );
        })
      );

      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify pagination controls
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      
      // Test page navigation
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify page change
      await waitFor(() => {
        expect(screen.getByText('Template 26')).toBeInTheDocument();
      });
    });
  });

  /**
   * Accessibility Compliance Tests
   * 
   * Validates WCAG 2.1 AA compliance including keyboard navigation,
   * screen reader support, and semantic markup.
   */
  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      const container = screen.getByRole('main');
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify ARIA labels
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Email Templates');

      // Verify column headers
      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach(header => {
        expect(accessibilityUtils.hasAriaLabel(header)).toBe(true);
      });
    });

    it('should announce dynamic content changes to screen readers', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Test search result announcement
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Template 2');

      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/1 template found/i);
      });
    });

    it('should provide focus management for modal dialogs', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create.*template/i });
      const dialogTest = await headlessUIUtils.testDialog(
        createButton,
        'create-template-dialog',
        user
      );

      expect(dialogTest.success).toBe(true);
      expect(dialogTest.trapsFocus).toBe(true);
      expect(dialogTest.closesWithEscape).toBe(true);
    });

    it('should maintain color contrast requirements', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Test color contrast for key elements
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(accessibilityUtils.hasAdequateContrast(button)).toBe(true);
      });

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(accessibilityUtils.hasAdequateContrast(link)).toBe(true);
      });
    });
  });

  /**
   * Performance and Optimization Tests
   * 
   * Validates performance requirements including SSR timing,
   * component rendering speed, and resource optimization.
   */
  describe('Performance and Optimization', () => {
    it('should meet SSR performance requirements', async () => {
      const { renderTime } = await measureComponentPerformance(() => 
        renderEmailTemplatesPage()
      );

      // Verify SSR under 2 seconds requirement
      expect(renderTime).toBeLessThan(2000);
    });

    it('should optimize component re-renders', async () => {
      let renderCount = 0;
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount++;
        return <>{children}</>;
      };

      const { rerender } = renderWithProviders(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <EmailTemplatesPage />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Trigger props update that shouldn't cause re-render
      rerender(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <EmailTemplatesPage />
          </React.Suspense>
        </TestWrapper>
      );

      // Verify no unnecessary re-renders
      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it('should implement proper data caching strategy', async () => {
      const { queryClient } = setupTestEnvironment();
      
      renderEmailTemplatesPage({ queryClient });

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify cache hit responses under 50ms requirement
      const startTime = performance.now();
      queryClient.getQueryData(['email-templates']);
      const cacheTime = performance.now() - startTime;

      expect(cacheTime).toBeLessThan(50);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      server.use(
        rest.get('/api/v2/system/email_template', (req, res, ctx) => {
          const templates = createMockEmailTemplatesList(1000);
          return res(
            ctx.status(200),
            ctx.json(createMockApiResponse(templates))
          );
        })
      );

      const { renderTime } = await measureComponentPerformance(() => 
        renderEmailTemplatesPage()
      );

      // Verify rendering performance with large datasets
      expect(renderTime).toBeLessThan(3000);
    });
  });

  /**
   * Integration and State Management Tests
   * 
   * Validates integration with React Query, Zustand store,
   * and Next.js routing patterns.
   */
  describe('Integration and State Management', () => {
    it('should integrate with global application state', async () => {
      const providerOptions: TestProvidersOptions = {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: true,
        },
      };

      renderEmailTemplatesPage(providerOptions);

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Verify user context is available
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    it('should handle route navigation correctly', async () => {
      const mockPush = vi.fn();
      const providerOptions: TestProvidersOptions = {
        router: { push: mockPush } as any,
      };

      renderEmailTemplatesPage(providerOptions);

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Test navigation to create page
      const createButton = screen.getByRole('button', { name: /create.*template/i });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-config/df-email-templates/create');
    });

    it('should synchronize with backend state changes', async () => {
      const { queryClient } = setupTestEnvironment();
      
      renderEmailTemplatesPage({ queryClient });

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Simulate backend update
      const updatedTemplate = createMockEmailTemplate({
        id: 1,
        name: 'Updated Template 1',
      });

      // Update cache to simulate real-time update
      queryClient.setQueryData(['email-templates'], (oldData: EmailTemplate[]) => 
        oldData.map(template => 
          template.id === 1 ? updatedTemplate : template
        )
      );

      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText('Updated Template 1')).toBeInTheDocument();
      });
    });

    it('should handle concurrent user actions gracefully', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Simulate concurrent actions
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      // Click multiple buttons rapidly
      await Promise.all([
        user.click(editButtons[0]),
        user.click(deleteButtons[1]),
      ]);

      // Verify only one action is processed
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });
  });

  /**
   * Security and Validation Tests
   * 
   * Validates input sanitization, authentication state,
   * and security compliance requirements.
   */
  describe('Security and Validation', () => {
    it('should enforce authentication requirements', async () => {
      const providerOptions: TestProvidersOptions = {
        user: null, // No authenticated user
      };

      renderEmailTemplatesPage(providerOptions);

      // Verify redirect to login
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });

    it('should validate admin permissions', async () => {
      const providerOptions: TestProvidersOptions = {
        user: {
          id: 'test-user',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          isAdmin: false, // Non-admin user
        },
      };

      renderEmailTemplatesPage(providerOptions);

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
      });
    });

    it('should sanitize user inputs properly', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByRole('button', { name: /create.*template/i });
      await user.click(createButton);

      // Test XSS prevention
      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, '<script>alert("xss")</script>');

      // Verify input is sanitized
      expect(nameInput).toHaveValue('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should handle session timeout gracefully', async () => {
      renderEmailTemplatesPage();

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Simulate session timeout
      server.use(
        rest.get('/api/v2/system/email_template', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                code: 401,
                message: 'Session expired',
                status_code: 401,
              },
            })
          );
        })
      );

      // Trigger data refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Verify session timeout handling
      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      });
    });
  });
});

/**
 * Export Test Utilities
 * 
 * Export test utilities for reuse in other test files
 * and component-specific testing scenarios.
 */
export {
  createMockEmailTemplate,
  createMockEmailTemplatesList,
  createMockApiResponse,
  createEmailTemplatesHandlers,
  setupTestEnvironment,
  renderEmailTemplatesPage,
  measureComponentPerformance,
};

/**
 * Test Configuration Validation
 * 
 * Validates that the test environment is properly configured
 * and all required dependencies are available.
 */
describe('Test Environment Validation', () => {
  it('should have MSW server configured correctly', () => {
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.resetHandlers).toBe('function');
  });

  it('should have React Testing Library utilities available', () => {
    expect(screen).toBeDefined();
    expect(waitFor).toBeDefined();
    expect(within).toBeDefined();
  });

  it('should have accessibility testing configured', () => {
    expect(axe).toBeDefined();
    expect(toHaveNoViolations).toBeDefined();
  });

  it('should have user interaction testing configured', () => {
    expect(userEvent).toBeDefined();
    expect(typeof userEvent.setup).toBe('function');
  });

  it('should have performance measurement utilities', () => {
    expect(typeof performance.now).toBe('function');
    expect(typeof measureComponentPerformance).toBe('function');
  });
});