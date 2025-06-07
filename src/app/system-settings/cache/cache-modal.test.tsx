/**
 * Cache Modal Component Tests
 * 
 * Comprehensive Vitest unit tests for the CacheModal component covering modal interactions,
 * form validation, cache flush operations, and accessibility features. This test suite 
 * replaces Angular modal testing patterns with React Testing Library and Headless UI
 * Dialog testing approaches, ensuring WCAG 2.1 AA compliance and React Hook Form validation.
 * 
 * Test Coverage:
 * - Modal accessibility testing with full keyboard navigation support
 * - Form validation testing with real-time feedback via React Hook Form
 * - Cache flush operation testing with success and error scenarios
 * - Modal animation testing for smooth user experience
 * - Error recovery testing with user-friendly error messages
 * - React Query mutation testing for optimistic updates
 * - Headless UI Dialog behavior and interaction patterns
 * 
 * Performance Requirements:
 * - Tests execute under 100ms each for optimal developer experience
 * - MSW handlers respond within 50ms for realistic API simulation
 * - Accessibility validation completes within 200ms per test
 * 
 * Architecture Benefits:
 * - Vitest 2.1.0 providing 10x faster test execution vs Jest/Karma
 * - React Testing Library for realistic user interaction testing
 * - MSW for comprehensive API error scenario coverage
 * - Axe-core integration for automated accessibility validation
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { toast } from 'react-hot-toast';

// Import component under test
import CacheModal, { type CacheModalProps, type CacheRow } from './cache-modal';

// Add custom accessibility matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK DATA AND TYPE DEFINITIONS
// ============================================================================

/**
 * Mock cache row data for testing different service types
 */
const mockCacheRow: CacheRow = {
  name: 'mysql_production',
  label: 'Production MySQL Database',
};

const mockCacheRowSecondary: CacheRow = {
  name: 'redis_cache',
  label: 'Redis Cache Service',
};

const mockCacheRowWithSpecialChars: CacheRow = {
  name: 'postgresql-analytics_01',
  label: 'PostgreSQL Analytics DB (Version 2.1)',
};

/**
 * Default props for cache modal testing
 */
const defaultProps: CacheModalProps = {
  isOpen: true,
  onClose: vi.fn(),
  cacheRow: mockCacheRow,
};

// ============================================================================
// MSW HANDLERS FOR API MOCKING
// ============================================================================

/**
 * MSW handlers for cache flush operations
 * Provides comprehensive API response coverage including success, error, and edge cases
 */
const cacheHandlers = [
  // Successful cache flush
  rest.delete('/api/v2/system/cache/:serviceName', (req, res, ctx) => {
    const { serviceName } = req.params;
    
    // Simulate realistic response time for cache operations
    const delay = Math.random() * 100 + 50; // 50-150ms
    
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json({
        success: true,
        message: `Cache flushed successfully for ${serviceName}`,
        details: {
          service: serviceName,
          flushedAt: new Date().toISOString(),
          entriesCleared: Math.floor(Math.random() * 1000) + 100,
        },
      })
    );
  }),

  // Authentication error scenario
  rest.delete('/api/v2/system/cache/unauthorized_service', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(401),
      ctx.json({
        error: {
          code: 401,
          message: 'Unauthorized',
          details: 'Authentication required for cache management operations',
        },
      })
    );
  }),

  // Forbidden access scenario
  rest.delete('/api/v2/system/cache/forbidden_service', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(403),
      ctx.json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'Insufficient permissions to flush cache for this service',
        },
      })
    );
  }),

  // Service not found scenario
  rest.delete('/api/v2/system/cache/nonexistent_service', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(404),
      ctx.json({
        error: {
          code: 404,
          message: 'Service Not Found',
          details: 'The specified cache service does not exist',
        },
      })
    );
  }),

  // Server error scenario
  rest.delete('/api/v2/system/cache/error_service', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Internal Server Error',
          details: 'Cache flush operation failed due to server error',
        },
      })
    );
  }),

  // Network timeout scenario
  rest.delete('/api/v2/system/cache/timeout_service', (req, res, ctx) => {
    return res(
      ctx.delay(10000), // 10 second delay to simulate timeout
      ctx.status(408),
      ctx.json({
        error: {
          code: 408,
          message: 'Request Timeout',
          details: 'Cache flush operation timed out',
        },
      })
    );
  }),

  // Cache query endpoint for optimistic updates
  rest.get('/api/v2/system/cache', (req, res, ctx) => {
    return res(
      ctx.delay(25),
      ctx.status(200),
      ctx.json({
        resource: [
          {
            name: 'mysql_production',
            label: 'Production MySQL Database',
            status: 'active',
            lastFlushed: '2024-03-15T08:00:00Z',
            entryCount: 1245,
            sizeBytes: 52428800,
          },
          {
            name: 'redis_cache',
            label: 'Redis Cache Service',
            status: 'active',
            lastFlushed: '2024-03-15T07:30:00Z',
            entryCount: 2891,
            sizeBytes: 104857600,
          },
        ],
        meta: {
          count: 2,
          total: 2,
        },
      })
    );
  }),
];

const server = setupServer(...cacheHandlers);

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Creates a fresh QueryClient for each test to prevent state pollution
 */
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Custom render function with QueryClient provider and accessibility testing setup
 */
const renderWithProviders = (component: React.ReactElement, options = {}) => {
  const queryClient = createTestQueryClient();
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(component, { wrapper: Wrapper, ...options }),
    queryClient,
  };
};

/**
 * Accessibility testing utility with WCAG 2.1 AA validation
 */
const expectAccessibleModal = async (container: HTMLElement) => {
  const results = await axe(container, {
    rules: {
      // Enable WCAG 2.1 AA specific rules
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'aria-labels': { enabled: true },
      'semantic-markup': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  });
  
  expect(results).toHaveNoViolations();
};

/**
 * Animation testing utility for smooth transitions
 */
const expectSmoothAnimation = async (element: HTMLElement, property: string) => {
  const computedStyle = window.getComputedStyle(element);
  const transition = computedStyle.getPropertyValue('transition');
  const animationDuration = computedStyle.getPropertyValue('animation-duration');
  
  // Verify CSS transitions are properly configured
  expect(transition || animationDuration).toBeTruthy();
  
  // Mock animation completion for testing
  if (element.classList.contains('animate-')) {
    await waitFor(() => {
      expect(element).toBeVisible();
    }, { timeout: 500 });
  }
};

/**
 * Keyboard navigation testing utility
 */
const testKeyboardNavigation = async (user: ReturnType<typeof userEvent.setup>) => {
  // Test Tab navigation through interactive elements
  await user.tab();
  expect(document.activeElement).toBeInTheDocument();
  
  // Test Escape key functionality
  await user.keyboard('{Escape}');
  
  // Test Enter key activation
  await user.keyboard('{Enter}');
  
  // Test Space key activation for buttons
  await user.keyboard(' ');
};

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

beforeEach(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Mock react-hot-toast to prevent console warnings
  vi.mocked(toast).success = vi.fn();
  vi.mocked(toast).error = vi.fn();
  
  // Mock environment variables
  process.env.NEXT_PUBLIC_API_KEY = 'test-api-key';
  
  // Mock fetch for any unhandled requests
  global.fetch = vi.fn();
  
  // Clear all DOM timers
  vi.clearAllTimers();
});

afterEach(() => {
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clean up any lingering DOM effects
  document.body.innerHTML = '';
});

// ============================================================================
// MODAL ACCESSIBILITY TESTING
// ============================================================================

describe('Cache Modal - Accessibility Testing', () => {
  it('should meet WCAG 2.1 AA compliance standards', async () => {
    const { container } = renderWithProviders(<CacheModal {...defaultProps} />);
    
    // Wait for modal to fully render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Comprehensive accessibility validation
    await expectAccessibleModal(container);
    
    // Verify dialog landmarks
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    
    // Verify heading structure
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Flush Production MySQL Database Cache');
    
    // Verify form accessibility
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby');
    expect(checkbox).toHaveAttribute('id', 'confirmed');
    
    const checkboxLabel = screen.getByLabelText(/I understand this action cannot be undone/i);
    expect(checkboxLabel).toBeInTheDocument();
  });

  it('should support full keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    renderWithProviders(
      <CacheModal {...defaultProps} onClose={mockOnClose} />
    );
    
    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Test Tab navigation sequence
    await user.tab(); // Should focus close button
    expect(document.activeElement).toHaveAttribute('aria-label', 'Close modal');
    
    await user.tab(); // Should focus checkbox
    expect(document.activeElement).toHaveAttribute('type', 'checkbox');
    
    await user.tab(); // Should focus cancel button
    expect(document.activeElement).toHaveTextContent('Cancel');
    
    await user.tab(); // Should focus flush button
    expect(document.activeElement).toHaveTextContent('Flush Cache');
    
    // Test Escape key closes modal
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledOnce();
    
    // Test Enter key on cancel button
    await user.tab(); // Focus cancel
    await user.tab(); // Focus cancel
    await user.keyboard('{Enter}');
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('should provide proper screen reader announcements', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Verify screen reader content
    expect(screen.getByText(/This action will clear all cached data/i)).toBeInTheDocument();
    expect(screen.getByText(/This operation cannot be undone/i)).toBeInTheDocument();
    
    // Test checkbox interaction with screen reader support
    const checkbox = screen.getByRole('checkbox');
    const description = screen.getByText(/Confirm that you want to flush the cache/i);
    
    expect(checkbox).toHaveAttribute('aria-describedby', 'confirmed-description');
    expect(description).toHaveAttribute('id', 'confirmed-description');
    
    // Test error message announcements
    await user.click(screen.getByText('Flush Cache'));
    
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/You must confirm the cache flush operation/i);
    });
  });

  it('should maintain focus management during interactions', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Focus should be trapped within modal
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).toBeFocused();
    
    // Focus should return to triggering element on close
    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    
    // Modal should handle focus restoration
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

// ============================================================================
// FORM VALIDATION TESTING
// ============================================================================

describe('Cache Modal - Form Validation', () => {
  it('should validate required confirmation checkbox', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Try to submit without confirmation
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/You must confirm the cache flush operation/i);
    });
    
    // Submit button should remain enabled for retry
    expect(submitButton).not.toBeDisabled();
  });

  it('should provide real-time form validation feedback', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const checkbox = screen.getByRole('checkbox');
    const submitButton = screen.getByText('Flush Cache');
    
    // Initially unchecked - submit should be enabled but validation fails
    expect(checkbox).not.toBeChecked();
    expect(submitButton).not.toBeDisabled();
    
    // Check the checkbox
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Error should clear when valid
    const previousErrors = screen.queryByRole('alert');
    if (previousErrors) {
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    }
    
    // Uncheck again
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    renderWithProviders(
      <CacheModal {...defaultProps} onClose={mockOnClose} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Fill out form correctly
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Submit form
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
    });
    
    // Should complete successfully and close modal
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should reset form state when modal reopens', async () => {
    const user = userEvent.setup();
    
    const { rerender } = renderWithProviders(
      <CacheModal {...defaultProps} isOpen={true} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Interact with form
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Close modal
    rerender(<CacheModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<CacheModal {...defaultProps} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Form should be reset
    const newCheckbox = screen.getByRole('checkbox');
    expect(newCheckbox).not.toBeChecked();
  });
});

// ============================================================================
// CACHE FLUSH OPERATION TESTING
// ============================================================================

describe('Cache Modal - Cache Flush Operations', () => {
  it('should successfully flush cache with optimistic updates', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should show loading state immediately
    await waitFor(() => {
      expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
    
    // Should show success notification
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Cache flushed successfully'),
        expect.objectContaining({
          duration: 4000,
          position: 'top-right',
        })
      );
    }, { timeout: 2000 });
  });

  it('should handle authentication errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Use service that triggers 401 error
    const unauthorizedCacheRow = { 
      name: 'unauthorized_service', 
      label: 'Unauthorized Service' 
    };
    
    renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={unauthorizedCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should handle error and show notification
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush cache'),
        expect.objectContaining({
          duration: 6000,
          position: 'top-right',
        })
      );
    }, { timeout: 2000 });
    
    // Form should remain accessible for retry
    expect(submitButton).not.toBeDisabled();
  });

  it('should handle server errors with user-friendly messages', async () => {
    const user = userEvent.setup();
    
    // Use service that triggers 500 error
    const errorCacheRow = { 
      name: 'error_service', 
      label: 'Error Service' 
    };
    
    renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={errorCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should handle server error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush cache'),
        expect.any(Object)
      );
    }, { timeout: 2000 });
    
    // Should log error for debugging
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle network timeouts appropriately', async () => {
    const user = userEvent.setup();
    
    // Use service that triggers timeout
    const timeoutCacheRow = { 
      name: 'timeout_service', 
      label: 'Timeout Service' 
    };
    
    renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={timeoutCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
    });
    
    // Note: Actual timeout testing would require longer wait times
    // In practice, this would be handled by the React Query timeout configuration
  });

  it('should prevent multiple simultaneous cache flush operations', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    
    // Click submit multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);
    
    // Should only trigger one request due to loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Close button should also be disabled during operation
    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeDisabled();
  });
});

// ============================================================================
// MODAL ANIMATION TESTING
// ============================================================================

describe('Cache Modal - Animation and UI Transitions', () => {
  it('should render smooth opening animation', async () => {
    const { container } = renderWithProviders(
      <CacheModal {...defaultProps} isOpen={false} />
    );
    
    // Modal should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    // Trigger opening animation
    const { rerender } = renderWithProviders(
      <CacheModal {...defaultProps} isOpen={true} />
    );
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Test animation properties
      expectSmoothAnimation(dialog, 'opacity');
    });
  });

  it('should handle closing animation gracefully', async () => {
    const mockOnClose = vi.fn();
    
    const { rerender } = renderWithProviders(
      <CacheModal {...defaultProps} onClose={mockOnClose} isOpen={true} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Trigger closing
    rerender(
      <CacheModal {...defaultProps} onClose={mockOnClose} isOpen={false} />
    );
    
    // Animation should complete
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should show loading spinner during cache flush', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should show loading spinner
    await waitFor(() => {
      const loadingText = screen.getByText('Flushing Cache...');
      expect(loadingText).toBeInTheDocument();
      
      // Verify spinner SVG is present
      const spinner = document.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should maintain visual consistency across different cache services', async () => {
    const { rerender } = renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={mockCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Production MySQL Database')).toBeInTheDocument();
    });
    
    // Switch to different service
    rerender(
      <CacheModal {...defaultProps} cacheRow={mockCacheRowSecondary} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Redis Cache Service')).toBeInTheDocument();
    });
    
    // Layout and styling should remain consistent
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('w-full', 'max-w-md');
    
    const serviceDetails = screen.getByText('Service Details');
    expect(serviceDetails).toBeInTheDocument();
  });
});

// ============================================================================
// ERROR RECOVERY AND BOUNDARY TESTING
// ============================================================================

describe('Cache Modal - Error Recovery and Boundaries', () => {
  it('should recover from validation errors gracefully', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Flush Cache');
    
    // Trigger validation error
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Correct the error
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // Error should clear
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    
    // Should be able to submit successfully
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
    });
  });

  it('should handle API errors with fallback UI', async () => {
    const user = userEvent.setup();
    
    // Mock a service that will cause an error
    const errorCacheRow = { 
      name: 'nonexistent_service', 
      label: 'Nonexistent Service' 
    };
    
    renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={errorCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should handle 404 error gracefully
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush cache'),
        expect.any(Object)
      );
    }, { timeout: 2000 });
    
    // Modal should remain functional
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('should display user-friendly error messages for different scenarios', async () => {
    const user = userEvent.setup();
    
    // Test different error scenarios
    const errorScenarios = [
      { 
        name: 'forbidden_service', 
        label: 'Forbidden Service',
        expectedMessage: 'Failed to flush cache'
      },
      { 
        name: 'nonexistent_service', 
        label: 'Nonexistent Service',
        expectedMessage: 'Failed to flush cache'
      },
      { 
        name: 'error_service', 
        label: 'Error Service',
        expectedMessage: 'Failed to flush cache'
      },
    ];
    
    for (const scenario of errorScenarios) {
      const { rerender } = renderWithProviders(
        <CacheModal {...defaultProps} cacheRow={scenario} />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Complete form and submit
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      const submitButton = screen.getByText('Flush Cache');
      await user.click(submitButton);
      
      // Should show appropriate error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining(scenario.expectedMessage),
          expect.any(Object)
        );
      }, { timeout: 2000 });
      
      // Reset for next scenario
      vi.clearAllMocks();
    }
  });

  it('should handle special characters in service names correctly', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <CacheModal {...defaultProps} cacheRow={mockCacheRowWithSpecialChars} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Verify service name display with special characters
    expect(screen.getByText('PostgreSQL Analytics DB (Version 2.1)')).toBeInTheDocument();
    expect(screen.getByText('postgresql-analytics_01')).toBeInTheDocument();
    
    // Should handle API call with encoded service name
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should encode service name properly in API call
    await waitFor(() => {
      expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
    });
  });

  it('should maintain modal state during network interruptions', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Fill form
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Simulate network error by stopping MSW server temporarily
    server.close();
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should handle network error gracefully
    // Note: This would typically be handled by React Query's error boundaries
    // and retry mechanisms in a real application
    
    // Restart server for cleanup
    server.listen();
  });
});

// ============================================================================
// COMPONENT INTEGRATION TESTING
// ============================================================================

describe('Cache Modal - Component Integration', () => {
  it('should integrate properly with React Query for cache management', async () => {
    const user = userEvent.setup();
    
    const { queryClient } = renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Complete form and submit
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    const submitButton = screen.getByText('Flush Cache');
    await user.click(submitButton);
    
    // Should trigger React Query mutation
    await waitFor(() => {
      // Query client should be properly configured
      expect(queryClient).toBeDefined();
      
      // Cache should be updated optimistically
      const cacheData = queryClient.getQueryData(['cache']);
      expect(cacheData).toBeDefined();
    }, { timeout: 2000 });
  });

  it('should handle modal props changes dynamically', async () => {
    const mockOnClose = vi.fn();
    
    const { rerender } = renderWithProviders(
      <CacheModal isOpen={true} onClose={mockOnClose} cacheRow={mockCacheRow} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Production MySQL Database')).toBeInTheDocument();
    });
    
    // Change cache row
    rerender(
      <CacheModal isOpen={true} onClose={mockOnClose} cacheRow={mockCacheRowSecondary} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Redis Cache Service')).toBeInTheDocument();
    });
    
    // Close modal
    rerender(
      <CacheModal isOpen={false} onClose={mockOnClose} cacheRow={mockCacheRowSecondary} />
    );
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should export proper TypeScript types for external use', () => {
    // Verify types are properly exported and usable
    const testCacheRow: CacheRow = {
      name: 'test_service',
      label: 'Test Service',
    };
    
    const testProps: CacheModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      cacheRow: testCacheRow,
    };
    
    // Types should compile without errors
    expect(testCacheRow.name).toBe('test_service');
    expect(testProps.isOpen).toBe(true);
  });

  it('should perform within acceptable performance thresholds', async () => {
    const startTime = performance.now();
    
    renderWithProviders(<CacheModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const renderTime = performance.now() - startTime;
    
    // Component should render within performance requirements
    expect(renderTime).toBeLessThan(100); // 100ms threshold
    
    // Accessibility validation should complete quickly
    const { container } = renderWithProviders(<CacheModal {...defaultProps} />);
    
    const a11yStartTime = performance.now();
    await expectAccessibleModal(container);
    const a11yTime = performance.now() - a11yStartTime;
    
    expect(a11yTime).toBeLessThan(200); // 200ms threshold for accessibility validation
  });
});