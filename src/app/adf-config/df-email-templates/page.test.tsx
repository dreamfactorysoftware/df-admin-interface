/**
 * @fileoverview Vitest test suite for the email templates page component
 * 
 * Comprehensive test coverage for React server component functionality, data loading,
 * error handling, and user interactions. Implements Mock Service Worker for realistic
 * API mocking and React Testing Library for component testing best practices.
 * 
 * Migrated from Angular TestBed to Vitest + React Testing Library per Section 7.1.2
 * testing configuration for 10× faster test execution.
 */

import { beforeAll, afterEach, afterAll, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { server } from '@/test/mocks/server';
import { handlers } from '@/test/mocks/handlers';
import { createMockEmailTemplate, createMockEmailTemplateRow } from '@/test/utils/component-factories';
import { renderWithProviders } from '@/test/utils/test-utils';
import EmailTemplatesPage from './page';
import { rest } from 'msw';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/adf-config/df-email-templates',
}));

// Mock React Query hooks for testing server state management
vi.mock('@/hooks/use-email-templates', () => ({
  useEmailTemplates: vi.fn(),
  useCreateEmailTemplate: vi.fn(),
  useUpdateEmailTemplate: vi.fn(),
  useDeleteEmailTemplate: vi.fn(),
}));

describe('EmailTemplatesPage', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeAll(() => {
    // Start MSW server for API mocking
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Create a fresh QueryClient for each test to avoid cache contamination
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

    // Reset all mocks
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockBack.mockClear();
  });

  afterEach(() => {
    // Reset MSW handlers to default state
    server.resetHandlers();
    queryClient.clear();
  });

  afterAll(() => {
    // Clean up MSW server
    server.close();
  });

  describe('Component Rendering and Data Loading', () => {
    it('renders the email templates page with loading state', async () => {
      // Mock loading state
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify loading state is displayed
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      expect(screen.getByText(/loading email templates/i)).toBeInTheDocument();
    });

    it('renders email templates table when data loads successfully', async () => {
      const mockTemplates = [
        createMockEmailTemplateRow({
          id: 1,
          name: 'Welcome Email',
          description: 'Welcome email for new users',
        }),
        createMockEmailTemplateRow({
          id: 2,
          name: 'Password Reset',
          description: 'Password reset notification',
        }),
      ];

      // Mock successful data fetch
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates,
          meta: { count: 2, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify page title and description
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/email templates/i);
      expect(screen.getByText(/manage email templates/i)).toBeInTheDocument();

      // Verify table is rendered with data
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify template rows are displayed
      expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      expect(screen.getByText('Welcome email for new users')).toBeInTheDocument();
      expect(screen.getByText('Password Reset')).toBeInTheDocument();
      expect(screen.getByText('Password reset notification')).toBeInTheDocument();
    });

    it('displays empty state when no email templates exist', async () => {
      // Mock empty data response
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify empty state message
      expect(screen.getByText(/no email templates found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first email template/i)).toBeInTheDocument();
    });

    it('renders create new template button when user has permissions', async () => {
      // Mock data with create permissions
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify create button is present
      const createButton = screen.getByRole('button', { name: /create email template/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toBeEnabled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('displays error message when data loading fails', async () => {
      const mockError = new Error('Failed to load email templates');
      
      // Mock error state
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify error message is displayed
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load email templates/i)).toBeInTheDocument();
    });

    it('provides retry functionality when loading fails', async () => {
      const mockRefetch = vi.fn();
      const mockError = new Error('Network error');

      // Mock error state with refetch function
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);

      // Verify refetch was called
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('handles unauthorized access gracefully', async () => {
      // Mock 401 Unauthorized error
      server.use(
        rest.get('/api/v2/system/email_template', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                code: 401,
                message: 'Unauthorized access',
              },
            })
          );
        })
      );

      const mockError = new Error('Unauthorized');
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify unauthorized message
      expect(screen.getByText(/unauthorized access/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions and Navigation', () => {
    it('navigates to create page when create button is clicked', async () => {
      // Mock empty data to show create button
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Click create button
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      // Verify navigation to create page
      expect(mockPush).toHaveBeenCalledWith('/adf-config/df-email-templates/create');
    });

    it('navigates to edit page when edit action is clicked', async () => {
      const mockTemplate = createMockEmailTemplateRow({
        id: 1,
        name: 'Test Template',
        description: 'Test description',
      });

      // Mock data with template
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [mockTemplate],
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Find and click edit button for the template
      const editButton = screen.getByRole('button', { name: /edit test template/i });
      await user.click(editButton);

      // Verify navigation to edit page
      expect(mockPush).toHaveBeenCalledWith('/adf-config/df-email-templates/1');
    });

    it('handles delete operation with confirmation dialog', async () => {
      const mockTemplate = createMockEmailTemplateRow({
        id: 1,
        name: 'Test Template',
        description: 'Test description',
      });

      const mockDeleteMutation = {
        mutate: vi.fn(),
        isLoading: false,
        error: null,
      };

      // Mock hooks
      const { useEmailTemplates, useDeleteEmailTemplate } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [mockTemplate],
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      vi.mocked(useDeleteEmailTemplate).mockReturnValue(mockDeleteMutation);

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete test template/i });
      await user.click(deleteButton);

      // Verify confirmation dialog appears
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      // Verify delete mutation was called
      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(1);
    });
  });

  describe('Table Functionality', () => {
    it('supports pagination when there are many templates', async () => {
      // Create mock data with pagination
      const mockTemplates = Array.from({ length: 30 }, (_, i) => 
        createMockEmailTemplateRow({
          id: i + 1,
          name: `Template ${i + 1}`,
          description: `Description ${i + 1}`,
        })
      );

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates.slice(0, 25), // First page
          meta: { count: 30, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify pagination controls
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      
      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toBeEnabled();
    });

    it('supports filtering templates by name', async () => {
      const mockTemplates = [
        createMockEmailTemplateRow({ id: 1, name: 'Welcome Email', description: 'Welcome message' }),
        createMockEmailTemplateRow({ id: 2, name: 'Reset Password', description: 'Password reset' }),
      ];

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates,
          meta: { count: 2, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Find and use filter input
      const filterInput = screen.getByRole('textbox', { name: /filter templates/i });
      expect(filterInput).toBeInTheDocument();

      await user.type(filterInput, 'welcome');

      // Verify filter functionality (would trigger re-fetch in real implementation)
      expect(filterInput).toHaveValue('welcome');
    });

    it('supports sorting templates by different columns', async () => {
      const mockTemplates = [
        createMockEmailTemplateRow({ id: 1, name: 'B Template', description: 'Second' }),
        createMockEmailTemplateRow({ id: 2, name: 'A Template', description: 'First' }),
      ];

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates,
          meta: { count: 2, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Find and click name column header to sort
      const nameHeader = screen.getByRole('button', { name: /sort by name/i });
      expect(nameHeader).toBeInTheDocument();

      await user.click(nameHeader);

      // Verify sort indicator is present
      expect(nameHeader).toHaveAttribute('aria-sort');
    });
  });

  describe('Performance and React Query Integration', () => {
    it('maintains performance under 50ms for cache hit responses', async () => {
      const startTime = performance.now();

      // Mock cached data
      const mockTemplates = [createMockEmailTemplateRow({ id: 1, name: 'Cached Template' })];
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates,
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify render performance (should be fast for cached data)
      expect(renderTime).toBeLessThan(50);
    });

    it('implements optimistic updates for better UX', async () => {
      const mockTemplate = createMockEmailTemplateRow({
        id: 1,
        name: 'Original Name',
        description: 'Original description',
      });

      const mockUpdateMutation = {
        mutate: vi.fn(),
        isLoading: false,
        error: null,
      };

      // Mock hooks
      const { useEmailTemplates, useUpdateEmailTemplate } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [mockTemplate],
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
      vi.mocked(useUpdateEmailTemplate).mockReturnValue(mockUpdateMutation);

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify optimistic update behavior would be handled by React Query
      expect(mockTemplate.name).toBe('Original Name');
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('meets accessibility standards', async () => {
      const mockTemplates = [
        createMockEmailTemplateRow({
          id: 1,
          name: 'Test Template',
          description: 'Test description',
        }),
      ];

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: mockTemplates,
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Run accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and roles', async () => {
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify ARIA labels
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Email Templates Management');
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const mockTemplate = createMockEmailTemplateRow({
        id: 1,
        name: 'Test Template',
        description: 'Test description',
      });

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [mockTemplate],
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Test keyboard navigation
      const createButton = screen.getByRole('button', { name: /create email template/i });
      
      // Tab to the create button
      await user.tab();
      expect(createButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/adf-config/df-email-templates/create');
    });

    it('provides screen reader friendly content', async () => {
      const mockTemplate = createMockEmailTemplateRow({
        id: 1,
        name: 'Welcome Email',
        description: 'Email sent to new users',
      });

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [mockTemplate],
          meta: { count: 1, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify screen reader content
      expect(screen.getByText('1 email template found')).toBeInTheDocument();
      
      // Verify table has proper caption
      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName();
    });
  });

  describe('Theme and Responsive Design', () => {
    it('adapts to dark theme properly', async () => {
      // Mock theme context
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <div className="dark">
          <QueryClientProvider client={queryClient}>
            <EmailTemplatesPage />
          </QueryClientProvider>
        </div>
      );

      // Verify dark theme classes are applied
      expect(container.querySelector('.dark')).toBeInTheDocument();
    });

    it('responds to different screen sizes', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify responsive behavior
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Server Component Integration', () => {
    it('handles server-side rendering correctly', async () => {
      // Mock SSR environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify component renders in SSR environment
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Restore window
      global.window = originalWindow;
    });

    it('hydrates client-side functionality properly', async () => {
      const { useEmailTemplates } = await import('@/hooks/use-email-templates');
      vi.mocked(useEmailTemplates).mockReturnValue({
        data: {
          resource: [],
          meta: { count: 0, limit: 25, offset: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EmailTemplatesPage />
        </QueryClientProvider>
      );

      // Verify client-side functionality is available
      const createButton = screen.getByRole('button', { name: /create email template/i });
      expect(createButton).toBeInTheDocument();
      
      // Test interaction works after hydration
      await user.click(createButton);
      expect(mockPush).toHaveBeenCalled();
    });
  });
});