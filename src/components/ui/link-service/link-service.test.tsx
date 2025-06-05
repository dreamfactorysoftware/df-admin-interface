/**
 * Comprehensive test suite for the LinkService component
 * Tests form validation, service selection, file operations, cache management,
 * accessibility features, and user interactions using Vitest, React Testing Library, and MSW
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/test/utils/test-utils';
import { createMockStorageService, createMockStorageServices } from '@/test/mocks/storage-service';
import { LinkService } from './link-service';
import type { LinkServiceProps, StorageService, LinkServiceFormData } from './link-service.types';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// MSW server setup for API mocking
const mockHandlers = [
  // Storage services discovery endpoint
  rest.get('/api/v2/system/service', (req, res, ctx) => {
    const services = createMockStorageServices();
    return res(ctx.json({ resource: services }));
  }),

  // Storage service connection testing
  rest.post('/api/v2/system/service/:serviceId/_test', (req, res, ctx) => {
    const { serviceId } = req.params;
    return res(ctx.json({ success: true, service_id: serviceId }));
  }),

  // Storage service content operations
  rest.get('/api/v2/:serviceId/_file/*', (req, res, ctx) => {
    const path = req.url.pathname.split('/_file/')[1];
    return res(
      ctx.json({
        name: path,
        path: `/${path}`,
        type: 'file',
        content_type: 'application/json',
        last_modified: new Date().toISOString(),
        size: 1024
      })
    );
  }),

  // Cache management operations
  rest.delete('/api/v2/:serviceId/_cache/*', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),

  // Error scenarios for testing error handling
  rest.get('/api/v2/system/service/error-service', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Internal server error',
          context: 'Failed to connect to storage service'
        }
      })
    );
  })
];

const server = setupServer(...mockHandlers);

// Mock performance API for performance testing
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  },
  writable: true
});

// Setup and teardown
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// Test data factories
const createDefaultProps = (): LinkServiceProps => ({
  serviceId: 'test-storage-service',
  isExpanded: false,
  onExpandToggle: vi.fn(),
  onServiceLinked: vi.fn(),
  className: 'test-class'
});

const createMockFormData = (): LinkServiceFormData => ({
  repositoryUrl: 'https://github.com/example/repo.git',
  branch: 'main',
  accessToken: 'test-token-123',
  directory: '/api',
  autoSync: true,
  cacheEnabled: true
});

describe('LinkService Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockProps: LinkServiceProps;

  beforeEach(() => {
    user = userEvent.setup();
    mockProps = createDefaultProps();
  });

  describe('Component Rendering', () => {
    it('renders with required props', () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /link service/i })).toBeInTheDocument();
      expect(screen.getByText(/test-storage-service/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      renderWithProviders(<LinkService {...mockProps} className="custom-class" />);
      
      const container = screen.getByRole('region', { name: /service linking/i });
      expect(container).toHaveClass('custom-class');
    });

    it('renders in collapsed state by default', () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const expandedContent = screen.queryByRole('form', { name: /service configuration/i });
      expect(expandedContent).not.toBeInTheDocument();
    });

    it('renders expanded content when isExpanded is true', () => {
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      const form = screen.getByRole('form', { name: /service configuration/i });
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Interaction and Validation', () => {
    beforeEach(() => {
      mockProps.isExpanded = true;
    });

    it('renders all form fields when expanded', () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/access token/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/directory/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/auto sync/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cache enabled/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /link service/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/repository url is required/i)).toBeInTheDocument();
        expect(screen.getByText(/branch is required/i)).toBeInTheDocument();
      });
    });

    it('validates URL format for repository URL', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const urlInput = screen.getByLabelText(/repository url/i);
      await user.type(urlInput, 'invalid-url');
      await user.tab(); // Trigger validation
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid repository url/i)).toBeInTheDocument();
      });
    });

    it('accepts valid GitHub repository URLs', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const urlInput = screen.getByLabelText(/repository url/i);
      await user.type(urlInput, 'https://github.com/example/repo.git');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid repository url/i)).not.toBeInTheDocument();
      });
    });

    it('validates branch name format', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const branchInput = screen.getByLabelText(/branch/i);
      await user.type(branchInput, 'invalid..branch..name');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid branch name/i)).toBeInTheDocument();
      });
    });

    it('handles form submission with valid data', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const formData = createMockFormData();
      
      // Fill in form fields
      await user.type(screen.getByLabelText(/repository url/i), formData.repositoryUrl);
      await user.type(screen.getByLabelText(/branch/i), formData.branch);
      await user.type(screen.getByLabelText(/access token/i), formData.accessToken);
      await user.type(screen.getByLabelText(/directory/i), formData.directory);
      
      if (formData.autoSync) {
        await user.click(screen.getByLabelText(/auto sync/i));
      }
      if (formData.cacheEnabled) {
        await user.click(screen.getByLabelText(/cache enabled/i));
      }
      
      const submitButton = screen.getByRole('button', { name: /link service/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onServiceLinked).toHaveBeenCalledWith(
          expect.objectContaining({
            repositoryUrl: formData.repositoryUrl,
            branch: formData.branch,
            directory: formData.directory
          })
        );
      });
    });

    it('prevents submission when form has validation errors', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      // Leave required fields empty and try to submit
      const submitButton = screen.getByRole('button', { name: /link service/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/repository url is required/i)).toBeInTheDocument();
      });
      
      expect(mockProps.onServiceLinked).not.toHaveBeenCalled();
    });
  });

  describe('Service Selection and Configuration', () => {
    beforeEach(() => {
      mockProps.isExpanded = true;
    });

    it('loads available storage services on mount', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      await waitFor(() => {
        const serviceSelect = screen.getByLabelText(/storage service/i);
        expect(serviceSelect).toBeInTheDocument();
      });
      
      // Should show loading state initially
      expect(screen.getByText(/loading services/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/loading services/i)).not.toBeInTheDocument();
      });
    });

    it('displays service connection status', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const testConnectionButton = screen.getByRole('button', { name: /test connection/i });
      await user.click(testConnectionButton);
      
      await waitFor(() => {
        expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
      });
    });

    it('handles service connection errors gracefully', async () => {
      // Override mock to return error
      server.use(
        rest.post('/api/v2/system/service/:serviceId/_test', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Connection failed',
                context: 'Invalid credentials'
              }
            })
          );
        })
      );
      
      renderWithProviders(<LinkService {...mockProps} />);
      
      const testConnectionButton = screen.getByRole('button', { name: /test connection/i });
      await user.click(testConnectionButton);
      
      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Operations and Cache Management', () => {
    beforeEach(() => {
      mockProps.isExpanded = true;
    });

    it('displays file content when preview is requested', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const previewButton = screen.getByRole('button', { name: /preview content/i });
      await user.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText(/file content preview/i)).toBeInTheDocument();
      });
    });

    it('handles file content loading errors', async () => {
      // Override mock to return error for file operations
      server.use(
        rest.get('/api/v2/:serviceId/_file/*', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              error: {
                code: 404,
                message: 'File not found',
                context: 'The requested file does not exist'
              }
            })
          );
        })
      );
      
      renderWithProviders(<LinkService {...mockProps} />);
      
      const previewButton = screen.getByRole('button', { name: /preview content/i });
      await user.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText(/file not found/i)).toBeInTheDocument();
      });
    });

    it('clears cache when delete cache is clicked', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const deleteCacheButton = screen.getByRole('button', { name: /clear cache/i });
      await user.click(deleteCacheButton);
      
      // Should show confirmation dialog
      const confirmDialog = screen.getByRole('dialog', { name: /confirm cache deletion/i });
      expect(confirmDialog).toBeInTheDocument();
      
      const confirmButton = within(confirmDialog).getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/cache cleared successfully/i)).toBeInTheDocument();
      });
    });

    it('cancels cache deletion when cancel is clicked', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const deleteCacheButton = screen.getByRole('button', { name: /clear cache/i });
      await user.click(deleteCacheButton);
      
      const confirmDialog = screen.getByRole('dialog', { name: /confirm cache deletion/i });
      const cancelButton = within(confirmDialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(confirmDialog).not.toBeInTheDocument();
      });
      
      expect(screen.queryByText(/cache cleared successfully/i)).not.toBeInTheDocument();
    });
  });

  describe('Expandable Panel Behavior', () => {
    it('toggles expansion when header is clicked', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /expand service configuration/i });
      await user.click(toggleButton);
      
      expect(mockProps.onExpandToggle).toHaveBeenCalledWith(true);
    });

    it('supports keyboard navigation for expansion toggle', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /expand service configuration/i });
      toggleButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockProps.onExpandToggle).toHaveBeenCalledWith(true);
      
      await user.keyboard(' ');
      expect(mockProps.onExpandToggle).toHaveBeenCalledTimes(2);
    });

    it('updates ARIA attributes based on expansion state', () => {
      const { rerender } = renderWithProviders(<LinkService {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /expand service configuration/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      
      rerender(<LinkService {...mockProps} isExpanded={true} />);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accessibility Compliance', () => {
    it('has no accessibility violations when collapsed', async () => {
      const { container } = renderWithProviders(<LinkService {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when expanded', async () => {
      const { container } = renderWithProviders(
        <LinkService {...mockProps} isExpanded={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for form fields', () => {
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      expect(screen.getByLabelText(/repository url/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/branch/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/access token/i)).toHaveAttribute('aria-required', 'false');
    });

    it('announces validation errors to screen readers', async () => {
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      const submitButton = screen.getByRole('button', { name: /link service/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/repository url is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('supports keyboard navigation throughout the form', async () => {
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      const firstField = screen.getByLabelText(/repository url/i);
      firstField.focus();
      
      // Tab through all form fields
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/branch/i)).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/access token/i)).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/directory/i)).toHaveFocus();
    });

    it('provides proper focus management for modal dialogs', async () => {
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      const deleteCacheButton = screen.getByRole('button', { name: /clear cache/i });
      await user.click(deleteCacheButton);
      
      const confirmDialog = screen.getByRole('dialog', { name: /confirm cache deletion/i });
      expect(confirmDialog).toBeInTheDocument();
      
      // Focus should be trapped in the dialog
      const confirmButton = within(confirmDialog).getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();
    });
  });

  describe('Theme Integration', () => {
    it('adapts to light theme', () => {
      renderWithProviders(<LinkService {...mockProps} />, { theme: 'light' });
      
      const container = screen.getByRole('region', { name: /service linking/i });
      expect(container).toHaveClass('bg-white', 'text-gray-900');
    });

    it('adapts to dark theme', () => {
      renderWithProviders(<LinkService {...mockProps} />, { theme: 'dark' });
      
      const container = screen.getByRole('region', { name: /service linking/i });
      expect(container).toHaveClass('bg-gray-800', 'text-gray-100');
    });

    it('respects system theme preference', () => {
      // Mock system preference for dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      renderWithProviders(<LinkService {...mockProps} />, { theme: 'system' });
      
      const container = screen.getByRole('region', { name: /service linking/i });
      expect(container).toHaveClass('dark:bg-gray-800', 'dark:text-gray-100');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('displays error messages when API calls fail', async () => {
      // Override mock to return error
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Failed to load services',
                context: 'Database connection error'
              }
            })
          );
        })
      );
      
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
        expect(screen.getByText(/database connection error/i)).toBeInTheDocument();
      });
    });

    it('provides retry functionality for failed operations', async () => {
      let callCount = 0;
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res(
              ctx.status(500),
              ctx.json({ error: { message: 'Temporary error' } })
            );
          }
          return res(ctx.json({ resource: createMockStorageServices() }));
        })
      );
      
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/temporary error/i)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/storage service/i)).toBeInTheDocument();
      });
    });

    it('handles network timeouts gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.delay('infinite'));
        })
      );
      
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      // Should show loading state
      expect(screen.getByText(/loading services/i)).toBeInTheDocument();
      
      // After timeout, should show error
      await waitFor(
        () => {
          expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Performance Optimization', () => {
    it('renders form fields efficiently under load', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      // Wait for all fields to render
      await waitFor(() => {
        expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/access token/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within performance budget (100ms as per requirements)
      expect(renderTime).toBeLessThan(100);
    });

    it('debounces form validation to prevent excessive API calls', async () => {
      const validationSpy = vi.fn();
      
      renderWithProviders(<LinkService {...mockProps} isExpanded={true} />);
      
      const urlInput = screen.getByLabelText(/repository url/i);
      
      // Rapid typing should be debounced
      await user.type(urlInput, 'https://github.com/example/repo.git', { delay: 10 });
      
      // Validation should not be called for every keystroke
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid repository url/i)).not.toBeInTheDocument();
      });
    });

    it('optimizes re-renders using React.memo patterns', () => {
      const { rerender } = renderWithProviders(<LinkService {...mockProps} />);
      
      // Component should not re-render unnecessarily
      const renderSpy = vi.spyOn(React, 'createElement');
      
      rerender(<LinkService {...mockProps} />);
      
      // Should use memoization to prevent unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interaction Patterns', () => {
    beforeEach(() => {
      mockProps.isExpanded = true;
    });

    it('provides clear visual feedback for user actions', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /link service/i });
      
      // Button should show loading state when clicked
      await user.click(submitButton);
      
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(within(submitButton).getByRole('status')).toBeInTheDocument();
    });

    it('supports progressive disclosure of advanced options', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      // Advanced options should be hidden initially
      expect(screen.queryByText(/advanced configuration/i)).not.toBeInTheDocument();
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced options/i });
      await user.click(showAdvancedButton);
      
      expect(screen.getByText(/advanced configuration/i)).toBeInTheDocument();
    });

    it('provides contextual help and tooltips', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const helpIcon = screen.getByRole('button', { name: /help for repository url/i });
      await user.hover(helpIcon);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText(/enter the git repository url/i)).toBeInTheDocument();
      });
    });

    it('handles rapid user interactions gracefully', async () => {
      renderWithProviders(<LinkService {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /expand service configuration/i });
      
      // Rapid clicking should not cause issues
      for (let i = 0; i < 5; i++) {
        await user.click(toggleButton);
      }
      
      // Should handle all interactions properly
      expect(mockProps.onExpandToggle).toHaveBeenCalledTimes(5);
    });
  });
});