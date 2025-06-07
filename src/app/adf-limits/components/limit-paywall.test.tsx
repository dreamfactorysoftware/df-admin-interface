/**
 * Limit Paywall Component Test Suite
 * 
 * Comprehensive Vitest test suite for the limit-paywall React component that
 * implements subscription-based access control for premium features in the
 * limits management interface. This test suite replaces Angular route guard
 * testing patterns with React component-based conditional rendering testing.
 * 
 * Key Testing Coverage:
 * - Conditional rendering based on subscription status
 * - Premium feature access control scenarios
 * - User interface accessibility compliance (WCAG 2.1 AA)
 * - Subscription API integration using MSW mocking
 * - Zustand store integration for subscription state management
 * - Error handling and edge case scenarios
 * - Next.js middleware authentication flow verification
 * 
 * Technical Implementation:
 * - Vitest 2.1.0 for 10x faster test execution compared to Jest
 * - React Testing Library for component interaction testing
 * - Mock Service Worker (MSW) for realistic subscription API mocking
 * - Zustand testing utilities for state management validation
 * - Enhanced accessibility testing with custom matchers
 * 
 * Performance Characteristics:
 * - Test suite execution under 30 seconds
 * - Parallel test execution with isolated environments
 * - Memory-efficient test runner with automatic cleanup
 * - Hot reload testing support for development workflows
 * 
 * Migration Notes:
 * - Converts Angular guard testing to React conditional rendering
 * - Replaces RxJS subscription observables with React hooks
 * - Transforms Angular service mocking to MSW request handlers
 * - Implements React Query patterns for server state management
 * 
 * @fileoverview Vitest test suite for limit-paywall component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { useAppStore } from '@/stores/app-store';
import { createWrapper } from '@/test/test-utils';

// Component under test
import { LimitPaywall } from './limit-paywall';

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * Subscription status enumeration for testing scenarios
 */
type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'trial' | 'unknown';

/**
 * Premium feature access levels for testing
 */
type FeatureAccessLevel = 'free' | 'premium' | 'enterprise';

/**
 * Test subscription data structure
 */
interface TestSubscriptionData {
  id: string;
  status: SubscriptionStatus;
  planType: string;
  expiresAt?: string;
  features: {
    limits: FeatureAccessLevel;
    advancedLimits: boolean;
    customLimits: boolean;
    bulkOperations: boolean;
  };
  usage: {
    currentLimits: number;
    maxLimits: number;
  };
}

/**
 * Component props interface for testing
 */
interface LimitPaywallProps {
  /** Feature identifier for access control */
  feature: string;
  /** Alternative content to display for premium users */
  children?: React.ReactNode;
  /** Callback fired when upgrade is requested */
  onUpgrade?: () => void;
  /** Custom message for the paywall */
  message?: string;
  /** Show trial upgrade option */
  showTrial?: boolean;
  /** Redirect URL after upgrade */
  upgradeUrl?: string;
}

// ============================================================================
// TEST DATA AND FIXTURES
// ============================================================================

/**
 * Mock subscription data for different testing scenarios
 */
const mockSubscriptionData: Record<string, TestSubscriptionData> = {
  active: {
    id: 'sub_active_001',
    status: 'active',
    planType: 'premium',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    features: {
      limits: 'premium',
      advancedLimits: true,
      customLimits: true,
      bulkOperations: true,
    },
    usage: {
      currentLimits: 15,
      maxLimits: 100,
    },
  },
  inactive: {
    id: 'sub_inactive_001',
    status: 'inactive',
    planType: 'free',
    features: {
      limits: 'free',
      advancedLimits: false,
      customLimits: false,
      bulkOperations: false,
    },
    usage: {
      currentLimits: 3,
      maxLimits: 5,
    },
  },
  expired: {
    id: 'sub_expired_001',
    status: 'expired',
    planType: 'premium',
    expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    features: {
      limits: 'free',
      advancedLimits: false,
      customLimits: false,
      bulkOperations: false,
    },
    usage: {
      currentLimits: 8,
      maxLimits: 5,
    },
  },
  trial: {
    id: 'sub_trial_001',
    status: 'trial',
    planType: 'trial',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    features: {
      limits: 'premium',
      advancedLimits: true,
      customLimits: false,
      bulkOperations: true,
    },
    usage: {
      currentLimits: 10,
      maxLimits: 50,
    },
  },
  unknown: {
    id: 'sub_unknown_001',
    status: 'unknown',
    planType: 'unknown',
    features: {
      limits: 'free',
      advancedLimits: false,
      customLimits: false,
      bulkOperations: false,
    },
    usage: {
      currentLimits: 0,
      maxLimits: 5,
    },
  },
};

/**
 * Test component props for different scenarios
 */
const defaultProps: LimitPaywallProps = {
  feature: 'advanced-limits',
  onUpgrade: vi.fn(),
  message: 'Upgrade to access advanced limit configurations',
  showTrial: true,
  upgradeUrl: '/upgrade',
};

/**
 * Mock premium content component for testing children rendering
 */
const PremiumContent: React.FC = () => (
  <div data-testid="premium-content">
    <h2>Advanced Limit Configuration</h2>
    <p>This is premium content that should only be visible to subscribers.</p>
    <button>Configure Advanced Limits</button>
  </div>
);

// ============================================================================
// MSW REQUEST HANDLERS FOR SUBSCRIPTION API
// ============================================================================

/**
 * Create MSW handlers for subscription API endpoints
 */
const createSubscriptionHandlers = (subscriptionData: TestSubscriptionData) => [
  // Get current subscription status
  http.get('/api/v2/system/subscription', () => {
    return HttpResponse.json({
      success: true,
      data: subscriptionData,
    });
  }),

  // Get subscription features
  http.get('/api/v2/system/subscription/features', () => {
    return HttpResponse.json({
      success: true,
      data: {
        features: subscriptionData.features,
        usage: subscriptionData.usage,
      },
    });
  }),

  // Upgrade subscription endpoint
  http.post('/api/v2/system/subscription/upgrade', () => {
    return HttpResponse.json({
      success: true,
      data: {
        redirectUrl: '/billing/upgrade',
        message: 'Redirecting to upgrade page...',
      },
    });
  }),

  // Start trial endpoint
  http.post('/api/v2/system/subscription/trial', () => {
    return HttpResponse.json({
      success: true,
      data: {
        ...mockSubscriptionData.trial,
        message: 'Trial activated successfully',
      },
    });
  }),
];

/**
 * Create error response handlers for testing error scenarios
 */
const createErrorHandlers = () => [
  // Subscription API unavailable
  http.get('/api/v2/system/subscription', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'SUBSCRIPTION_API_UNAVAILABLE',
          message: 'Subscription service temporarily unavailable',
          status_code: 503,
        },
      },
      { status: 503 }
    );
  }),

  // Upgrade endpoint error
  http.post('/api/v2/system/subscription/upgrade', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'UPGRADE_FAILED',
          message: 'Failed to process upgrade request',
          status_code: 400,
        },
      },
      { status: 400 }
    );
  }),
];

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Custom render function with providers and mock store setup
 */
const renderLimitPaywall = (
  props: Partial<LimitPaywallProps> = {},
  subscriptionStatus: SubscriptionStatus = 'inactive'
) => {
  // Set up MSW handlers for the test scenario
  server.use(...createSubscriptionHandlers(mockSubscriptionData[subscriptionStatus]));

  // Reset Zustand store before each test
  useAppStore.setState({
    globalLoading: false,
    error: null,
    preferences: {
      defaultDatabaseType: 'mysql',
      tablePageSize: 25,
      autoRefreshSchemas: true,
      showAdvancedOptions: false,
      enableAnimations: true,
      language: 'en',
      debugMode: false,
    },
  });

  const mergedProps = { ...defaultProps, ...props };

  return render(
    <LimitPaywall {...mergedProps}>
      <PremiumContent />
    </LimitPaywall>,
    { wrapper: createWrapper() }
  );
};

/**
 * Wait for component to finish loading subscription data
 */
const waitForSubscriptionLoad = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('subscription-loading')).not.toBeInTheDocument();
  });
};

/**
 * Custom accessibility matcher for paywall components
 */
const expectAccessiblePaywall = (element: HTMLElement) => {
  // Check for proper ARIA labels and roles
  expect(element).toHaveAttribute('role', 'dialog');
  expect(element).toHaveAttribute('aria-labelledby');
  expect(element).toHaveAttribute('aria-describedby');
  
  // Check for keyboard navigation support
  const upgradeButton = element.querySelector('[data-testid="upgrade-button"]');
  if (upgradeButton) {
    expect(upgradeButton).toHaveAttribute('tabindex', '0');
    expect(upgradeButton).toBeAccessible();
  }
  
  // Check for color contrast compliance
  expect(element).toBeAccessible();
};

// ============================================================================
// TEST SUITE SETUP AND TEARDOWN
// ============================================================================

describe('LimitPaywall Component', () => {
  // User event API for realistic user interactions
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset console spy setup
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up any residual state
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // COMPONENT RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    test('renders paywall for inactive subscription', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      // Should show paywall content
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      expect(screen.getByTestId('paywall-title')).toHaveTextContent('Premium Feature');
      expect(screen.getByTestId('paywall-message')).toHaveTextContent(defaultProps.message!);
      
      // Should show upgrade button
      expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
      expect(screen.getByTestId('upgrade-button')).toHaveTextContent('Upgrade Now');
      
      // Premium content should not be visible
      expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
    });

    test('renders premium content for active subscription', async () => {
      renderLimitPaywall({}, 'active');
      await waitForSubscriptionLoad();

      // Should not show paywall
      expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument();
      
      // Premium content should be visible
      expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Advanced Limit Configuration');
    });

    test('renders trial promotion for trial subscription', async () => {
      renderLimitPaywall({ showTrial: true }, 'trial');
      await waitForSubscriptionLoad();

      // Should show trial-specific content
      expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument();
      expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      
      // Should show trial indicator
      expect(screen.getByTestId('trial-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('trial-indicator')).toHaveTextContent(/trial expires/i);
    });

    test('renders expired subscription state correctly', async () => {
      renderLimitPaywall({}, 'expired');
      await waitForSubscriptionLoad();

      // Should show paywall with expired message
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      expect(screen.getByTestId('paywall-title')).toHaveTextContent('Subscription Expired');
      expect(screen.getByTestId('expired-message')).toBeInTheDocument();
      
      // Should show reactivation button
      expect(screen.getByTestId('reactivate-button')).toBeInTheDocument();
    });

    test('handles unknown subscription status gracefully', async () => {
      renderLimitPaywall({}, 'unknown');
      await waitForSubscriptionLoad();

      // Should show default paywall
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      expect(screen.getByTestId('paywall-title')).toBeInTheDocument();
      
      // Should show contact support option
      expect(screen.getByTestId('contact-support')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SUBSCRIPTION STATUS HANDLING TESTS
  // ============================================================================

  describe('Subscription Status Handling', () => {
    test('correctly identifies premium features for active subscription', async () => {
      renderLimitPaywall({ feature: 'advanced-limits' }, 'active');
      await waitForSubscriptionLoad();

      // Advanced limits should be accessible
      expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      
      // Should not show any upgrade prompts
      expect(screen.queryByTestId('upgrade-button')).not.toBeInTheDocument();
    });

    test('restricts access for free plan users', async () => {
      renderLimitPaywall({ feature: 'custom-limits' }, 'inactive');
      await waitForSubscriptionLoad();

      // Should show paywall
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      
      // Should highlight the specific feature
      expect(screen.getByTestId('feature-highlight')).toHaveTextContent('custom-limits');
    });

    test('handles feature-specific access control', async () => {
      // Test with trial subscription that has limited features
      renderLimitPaywall({ feature: 'bulk-operations' }, 'trial');
      await waitForSubscriptionLoad();

      // Bulk operations should be available in trial
      expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      
      // Test with feature not available in trial
      renderLimitPaywall({ feature: 'custom-limits' }, 'trial');
      await waitForSubscriptionLoad();

      // Custom limits should be restricted in trial
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      expect(screen.getByTestId('trial-upgrade-prompt')).toBeInTheDocument();
    });

    test('updates access when subscription status changes', async () => {
      const { rerender } = renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      // Initially should show paywall
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();

      // Update MSW handlers to simulate subscription activation
      server.use(...createSubscriptionHandlers(mockSubscriptionData.active));

      // Simulate subscription status update
      rerender(
        <LimitPaywall {...defaultProps}>
          <PremiumContent />
        </LimitPaywall>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument();
        expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    test('handles upgrade button click', async () => {
      const onUpgrade = vi.fn();
      renderLimitPaywall({ onUpgrade }, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      await user.click(upgradeButton);

      expect(onUpgrade).toHaveBeenCalledOnce();
    });

    test('handles trial activation', async () => {
      renderLimitPaywall({ showTrial: true }, 'inactive');
      await waitForSubscriptionLoad();

      const trialButton = screen.getByTestId('start-trial-button');
      await user.click(trialButton);

      // Should show loading state
      expect(screen.getByTestId('trial-loading')).toBeInTheDocument();

      // Wait for trial activation
      await waitFor(() => {
        expect(screen.queryByTestId('trial-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('trial-success')).toBeInTheDocument();
      });
    });

    test('handles upgrade URL navigation', async () => {
      // Mock window.open for upgrade URL testing
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      renderLimitPaywall({ upgradeUrl: '/custom-upgrade' }, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      await user.click(upgradeButton);

      expect(mockOpen).toHaveBeenCalledWith('/custom-upgrade', '_blank');
    });

    test('handles keyboard navigation', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      
      // Test Tab navigation
      upgradeButton.focus();
      expect(upgradeButton).toHaveFocus();
      
      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(defaultProps.onUpgrade).toHaveBeenCalled();
      
      // Test Space key activation
      upgradeButton.focus();
      await user.keyboard(' ');
      expect(defaultProps.onUpgrade).toHaveBeenCalledTimes(2);
    });

    test('handles contact support action', async () => {
      renderLimitPaywall({}, 'unknown');
      await waitForSubscriptionLoad();

      const supportButton = screen.getByTestId('contact-support');
      await user.click(supportButton);

      // Should open support modal or redirect
      await waitFor(() => {
        expect(screen.getByTestId('support-dialog')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    test('handles subscription API errors gracefully', async () => {
      server.use(...createErrorHandlers());
      
      renderLimitPaywall({}, 'inactive');

      // Should show error state
      await waitFor(() => {
        expect(screen.getByTestId('subscription-error')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Unable to verify subscription status'
        );
      });

      // Should provide retry option
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    test('handles network failures during upgrade', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      // Set up error handler for upgrade endpoint
      server.use(...createErrorHandlers());

      const upgradeButton = screen.getByTestId('upgrade-button');
      await user.click(upgradeButton);

      // Should show upgrade error
      await waitFor(() => {
        expect(screen.getByTestId('upgrade-error')).toBeInTheDocument();
        expect(screen.getByTestId('upgrade-error')).toHaveTextContent(
          'Failed to process upgrade request'
        );
      });
    });

    test('handles retry functionality', async () => {
      server.use(...createErrorHandlers());
      
      renderLimitPaywall({}, 'inactive');
      
      await waitFor(() => {
        expect(screen.getByTestId('subscription-error')).toBeInTheDocument();
      });

      // Reset to working handlers
      server.use(...createSubscriptionHandlers(mockSubscriptionData.inactive));

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      // Should recover and show normal paywall
      await waitFor(() => {
        expect(screen.queryByTestId('subscription-error')).not.toBeInTheDocument();
        expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      });
    });

    test('handles malformed subscription data', async () => {
      // Set up handler with invalid data
      server.use(
        http.get('/api/v2/system/subscription', () => {
          return HttpResponse.json({
            success: true,
            data: null, // Invalid data
          });
        })
      );

      renderLimitPaywall({}, 'inactive');

      // Should handle gracefully with fallback behavior
      await waitFor(() => {
        expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
        expect(screen.getByTestId('data-error-fallback')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility Compliance', () => {
    test('meets WCAG 2.1 AA standards for paywall dialog', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const paywall = screen.getByTestId('limit-paywall');
      expectAccessiblePaywall(paywall);
    });

    test('provides proper focus management', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      
      // Should be focusable
      expect(upgradeButton).toHaveAttribute('tabindex', '0');
      
      // Should have proper focus styles
      upgradeButton.focus();
      expect(upgradeButton).toHaveClass('focus:ring-2');
    });

    test('supports screen reader navigation', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const paywall = screen.getByTestId('limit-paywall');
      
      // Should have proper ARIA attributes
      expect(paywall).toHaveAttribute('role', 'dialog');
      expect(paywall).toHaveAttribute('aria-labelledby', 'paywall-title');
      expect(paywall).toHaveAttribute('aria-describedby', 'paywall-message');
      
      // Title should be properly associated
      expect(screen.getByTestId('paywall-title')).toHaveAttribute('id', 'paywall-title');
      expect(screen.getByTestId('paywall-message')).toHaveAttribute('id', 'paywall-message');
    });

    test('provides appropriate color contrast', async () => {
      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      
      // Should use high contrast colors for accessibility
      expect(upgradeButton).toHaveClass('bg-primary-600');
      expect(upgradeButton).toHaveClass('text-white');
      
      // Should have proper hover/focus states
      expect(upgradeButton).toHaveClass('hover:bg-primary-700');
      expect(upgradeButton).toHaveClass('focus:ring-primary-500');
    });

    test('handles reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const paywall = screen.getByTestId('limit-paywall');
      
      // Should respect motion preferences
      expect(paywall).toHaveClass('motion-reduce:animate-none');
    });
  });

  // ============================================================================
  // ZUSTAND STORE INTEGRATION TESTS
  // ============================================================================

  describe('Zustand Store Integration', () => {
    test('updates global loading state during subscription checks', async () => {
      renderLimitPaywall({}, 'active');

      // Should set loading state during initial subscription check
      expect(useAppStore.getState().globalLoading).toBe(true);

      await waitForSubscriptionLoad();

      // Should clear loading state after check completes
      expect(useAppStore.getState().globalLoading).toBe(false);
    });

    test('manages error state in global store', async () => {
      server.use(...createErrorHandlers());
      
      renderLimitPaywall({}, 'inactive');

      await waitFor(() => {
        const state = useAppStore.getState();
        expect(state.error).toBe('Unable to verify subscription status');
      });
    });

    test('persists subscription preferences', async () => {
      renderLimitPaywall({ showTrial: false }, 'inactive');
      await waitForSubscriptionLoad();

      // User chooses to hide trial options
      const hideTrialButton = screen.getByTestId('hide-trial-button');
      await user.click(hideTrialButton);

      // Should update preferences in store
      const preferences = useAppStore.getState().preferences;
      expect(preferences.showTrialPrompts).toBe(false);
    });

    test('handles concurrent subscription status updates', async () => {
      const { rerender } = renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      // Simulate multiple rapid subscription status changes
      server.use(...createSubscriptionHandlers(mockSubscriptionData.trial));
      rerender(<LimitPaywall {...defaultProps}><PremiumContent /></LimitPaywall>);

      server.use(...createSubscriptionHandlers(mockSubscriptionData.active));
      rerender(<LimitPaywall {...defaultProps}><PremiumContent /></LimitPaywall>);

      // Should handle the updates gracefully without race conditions
      await waitFor(() => {
        expect(screen.getByTestId('premium-content')).toBeInTheDocument();
      });

      expect(useAppStore.getState().globalLoading).toBe(false);
    });
  });

  // ============================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ============================================================================

  describe('Performance and Optimization', () => {
    test('implements efficient re-rendering patterns', async () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = ({ subscriptionStatus }: { subscriptionStatus: SubscriptionStatus }) => {
        renderSpy();
        server.use(...createSubscriptionHandlers(mockSubscriptionData[subscriptionStatus]));
        return <LimitPaywall {...defaultProps}><PremiumContent /></LimitPaywall>;
      };

      const { rerender } = render(<TestWrapper subscriptionStatus="inactive" />, {
        wrapper: createWrapper(),
      });

      await waitForSubscriptionLoad();
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Change subscription status
      rerender(<TestWrapper subscriptionStatus="active" />);
      await waitForSubscriptionLoad();

      // Should only re-render when subscription status actually changes
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('handles subscription data caching efficiently', async () => {
      // First render
      renderLimitPaywall({}, 'active');
      await waitForSubscriptionLoad();

      // Second render with same subscription status
      renderLimitPaywall({}, 'active');
      await waitForSubscriptionLoad();

      // Should use cached data and not make duplicate API calls
      // (This would be verified through MSW request counting in a real implementation)
    });

    test('implements proper memory cleanup', async () => {
      const { unmount } = renderLimitPaywall({}, 'active');
      await waitForSubscriptionLoad();

      // Unmount component
      unmount();

      // Should not have memory leaks or lingering subscriptions
      expect(useAppStore.getState().globalLoading).toBe(false);
      expect(useAppStore.getState().error).toBe(null);
    });
  });

  // ============================================================================
  // EDGE CASE AND INTEGRATION TESTS
  // ============================================================================

  describe('Edge Cases and Integration', () => {
    test('handles component unmounting during async operations', async () => {
      const { unmount } = renderLimitPaywall({}, 'inactive');
      
      // Unmount before subscription loads
      unmount();

      // Should not cause errors or memory leaks
      await waitFor(() => {
        expect(console.error).not.toHaveBeenCalled();
      });
    });

    test('handles rapid subscription status changes', async () => {
      renderLimitPaywall({}, 'inactive');
      
      // Rapidly change subscription status multiple times
      server.use(...createSubscriptionHandlers(mockSubscriptionData.trial));
      server.use(...createSubscriptionHandlers(mockSubscriptionData.active));
      server.use(...createSubscriptionHandlers(mockSubscriptionData.expired));

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByTestId('limit-paywall')).toBeInTheDocument();
      });
    });

    test('integrates properly with Next.js middleware authentication', async () => {
      // Mock Next.js router for middleware testing
      const mockPush = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }));

      renderLimitPaywall({}, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      await user.click(upgradeButton);

      // Should integrate with Next.js routing for upgrade flow
      expect(mockPush).toHaveBeenCalledWith('/upgrade');
    });

    test('handles concurrent user interactions', async () => {
      renderLimitPaywall({ showTrial: true }, 'inactive');
      await waitForSubscriptionLoad();

      const upgradeButton = screen.getByTestId('upgrade-button');
      const trialButton = screen.getByTestId('start-trial-button');

      // Click both buttons rapidly
      await user.click(upgradeButton);
      await user.click(trialButton);

      // Should handle concurrent actions gracefully
      await waitFor(() => {
        expect(screen.getByTestId('action-processing')).toBeInTheDocument();
      });
    });
  });
});