/**
 * @fileoverview Vitest test suite for LimitPaywall React component
 * 
 * This test suite replaces Angular route guard testing with React component-based
 * paywall testing, implementing comprehensive coverage for subscription status
 * handling, conditional rendering, and access control scenarios.
 * 
 * Key Testing Areas:
 * - Conditional rendering based on subscription status and feature flags
 * - Subscription API mocking using MSW for realistic testing scenarios
 * - Zustand store state management testing for subscription data
 * - Accessibility compliance testing for WCAG 2.1 AA standards
 * - Premium feature access control and messaging validation
 * - Next.js middleware integration testing for authentication flows
 * 
 * Performance Requirements:
 * - Test execution under 30 seconds for complete suite
 * - Coverage target: 90%+ code coverage
 * - Realistic API mocking with MSW for subscription endpoints
 * 
 * Migration Context:
 * - Converts Angular guard testing to React conditional rendering patterns
 * - Replaces Jest with Vitest for 10x faster test execution
 * - Transforms Angular service mocking to MSW subscription handlers
 * - Implements React Testing Library for modern component testing
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ migration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/setup'

// Component under test
import LimitPaywall from './limit-paywall'

// Testing utilities and providers
import { TestProviders } from '@/test/utils/test-utils'
import { createMockSubscription, createMockUser } from '@/test/utils/component-factories'

// Types and interfaces
import type { SubscriptionPlan, SubscriptionStatus, PremiumFeature } from '@/types/subscription'
import type { User } from '@/types/auth'

// Hook mocks for subscription and authentication
import { useSubscription } from '@/hooks/use-subscription'
import { useAuth } from '@/hooks/use-auth'

// Zustand store for state management testing
import { useAppStore } from '@/stores/app-store'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock hooks to control test scenarios
vi.mock('@/hooks/use-subscription')
vi.mock('@/hooks/use-auth')
vi.mock('@/stores/app-store')

// Type-safe mock implementations
const mockUseSubscription = vi.mocked(useSubscription)
const mockUseAuth = vi.mocked(useAuth)
const mockUseAppStore = vi.mocked(useAppStore)

/**
 * Mock subscription data fixtures for different test scenarios
 * Provides realistic subscription states matching DreamFactory subscription model
 */
const mockSubscriptions = {
  // Free tier subscription with limited features
  free: createMockSubscription({
    plan: 'free' as SubscriptionPlan,
    status: 'active' as SubscriptionStatus,
    features: {
      apiLimits: false,
      customRoles: false,
      advancedAuth: false,
      scheduledJobs: false,
      emailTemplates: false,
      fileManagement: false,
    },
    expiresAt: null, // Free tier doesn't expire
  }),

  // Professional tier with enhanced features
  professional: createMockSubscription({
    plan: 'professional' as SubscriptionPlan,
    status: 'active' as SubscriptionStatus,
    features: {
      apiLimits: true,
      customRoles: true,
      advancedAuth: false,
      scheduledJobs: true,
      emailTemplates: true,
      fileManagement: true,
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  }),

  // Enterprise tier with full access
  enterprise: createMockSubscription({
    plan: 'enterprise' as SubscriptionPlan,
    status: 'active' as SubscriptionStatus,
    features: {
      apiLimits: true,
      customRoles: true,
      advancedAuth: true,
      scheduledJobs: true,
      emailTemplates: true,
      fileManagement: true,
    },
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  }),

  // Expired subscription scenario
  expired: createMockSubscription({
    plan: 'professional' as SubscriptionPlan,
    status: 'expired' as SubscriptionStatus,
    features: {
      apiLimits: false,
      customRoles: false,
      advancedAuth: false,
      scheduledJobs: false,
      emailTemplates: false,
      fileManagement: false,
    },
    expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  }),

  // Cancelled subscription
  cancelled: createMockSubscription({
    plan: 'professional' as SubscriptionPlan,
    status: 'cancelled' as SubscriptionStatus,
    features: {
      apiLimits: false,
      customRoles: false,
      advancedAuth: false,
      scheduledJobs: false,
      emailTemplates: false,
      fileManagement: false,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Grace period
  }),
}

/**
 * Mock user data for authentication testing scenarios
 */
const mockUsers = {
  freeUser: createMockUser({
    id: '1',
    email: 'free.user@dreamfactory.com',
    name: 'Free User',
    role: 'user',
    subscriptionId: 'sub_free_123',
  }),

  proUser: createMockUser({
    id: '2',
    email: 'pro.user@dreamfactory.com',
    name: 'Professional User',
    role: 'admin',
    subscriptionId: 'sub_pro_456',
  }),

  enterpriseUser: createMockUser({
    id: '3',
    email: 'enterprise.user@dreamfactory.com',
    name: 'Enterprise User',
    role: 'admin',
    subscriptionId: 'sub_ent_789',
  }),
}

/**
 * MSW API handlers for subscription endpoints
 * Mocks DreamFactory subscription API for realistic testing
 */
const subscriptionHandlers = [
  // Get subscription details endpoint
  http.get('/api/v2/system/subscription', ({ request }) => {
    const url = new URL(request.url)
    const subscriptionId = url.searchParams.get('subscription_id')
    
    // Return appropriate subscription based on ID
    switch (subscriptionId) {
      case 'sub_free_123':
        return HttpResponse.json({ data: mockSubscriptions.free })
      case 'sub_pro_456':
        return HttpResponse.json({ data: mockSubscriptions.professional })
      case 'sub_ent_789':
        return HttpResponse.json({ data: mockSubscriptions.enterprise })
      case 'sub_expired_000':
        return HttpResponse.json({ data: mockSubscriptions.expired })
      case 'sub_cancelled_111':
        return HttpResponse.json({ data: mockSubscriptions.cancelled })
      default:
        return HttpResponse.json({ data: mockSubscriptions.free })
    }
  }),

  // Check feature access endpoint
  http.post('/api/v2/system/subscription/check-feature', async ({ request }) => {
    const body = await request.json() as { feature: PremiumFeature; subscriptionId: string }
    const { feature, subscriptionId } = body
    
    // Determine subscription based on ID
    let subscription
    switch (subscriptionId) {
      case 'sub_pro_456':
        subscription = mockSubscriptions.professional
        break
      case 'sub_ent_789':
        subscription = mockSubscriptions.enterprise
        break
      case 'sub_expired_000':
        subscription = mockSubscriptions.expired
        break
      case 'sub_cancelled_111':
        subscription = mockSubscriptions.cancelled
        break
      default:
        subscription = mockSubscriptions.free
    }
    
    const hasAccess = subscription.features[feature] === true
    
    return HttpResponse.json({
      data: {
        hasAccess,
        feature,
        subscription: subscription.plan,
        message: hasAccess 
          ? `Access granted to ${feature}` 
          : `${feature} requires a premium subscription`,
      }
    })
  }),

  // Upgrade subscription endpoint
  http.post('/api/v2/system/subscription/upgrade', async ({ request }) => {
    const body = await request.json() as { plan: SubscriptionPlan }
    
    return HttpResponse.json({
      data: {
        success: true,
        redirectUrl: `https://billing.dreamfactory.com/upgrade?plan=${body.plan}`,
        message: 'Redirect to billing portal initiated',
      }
    })
  }),
]

/**
 * Test Component Wrapper
 * Provides consistent test rendering with all necessary providers
 */
interface RenderLimitPaywallOptions {
  feature?: PremiumFeature
  showUpgradeButton?: boolean
  customMessage?: string
  user?: User
  subscription?: any
}

const renderLimitPaywall = (options: RenderLimitPaywallOptions = {}) => {
  const {
    feature = 'apiLimits',
    showUpgradeButton = true,
    customMessage,
    user = mockUsers.freeUser,
    subscription = mockSubscriptions.free,
  } = options

  // Setup mock implementations
  mockUseAuth.mockReturnValue({
    user,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
  })

  mockUseSubscription.mockReturnValue({
    subscription,
    isLoading: false,
    error: null,
    hasFeature: vi.fn((f: PremiumFeature) => subscription.features[f] === true),
    checkFeatureAccess: vi.fn(),
    upgradeSubscription: vi.fn(),
  })

  mockUseAppStore.mockReturnValue({
    theme: 'light',
    sidebarCollapsed: false,
    globalLoading: false,
    preferences: {
      defaultDatabaseType: 'mysql',
      tablePageSize: 25,
      autoRefreshSchemas: true,
      showAdvancedOptions: false,
    },
    setTheme: vi.fn(),
    setSidebarCollapsed: vi.fn(),
    setGlobalLoading: vi.fn(),
    updatePreferences: vi.fn(),
  })

  return render(
    <TestProviders>
      <LimitPaywall
        feature={feature}
        showUpgradeButton={showUpgradeButton}
        customMessage={customMessage}
      />
    </TestProviders>
  )
}

describe('LimitPaywall Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Setup MSW handlers for subscription endpoints
    server.use(...subscriptionHandlers)
  })

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers()
  })

  describe('Conditional Rendering', () => {
    it('should not render when user has access to the feature', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.professional,
        feature: 'apiLimits',
      })

      // Component should not be rendered when user has access
      expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument()
      expect(screen.queryByText(/premium feature required/i)).not.toBeInTheDocument()
    })

    it('should render paywall when user lacks access to the feature', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      // Paywall should be visible for free users accessing premium features
      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument()
      expect(screen.getByText(/premium feature required/i)).toBeInTheDocument()
    })

    it('should render paywall for expired subscriptions', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.expired,
        feature: 'apiLimits',
      })

      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument()
      expect(screen.getByText(/subscription has expired/i)).toBeInTheDocument()
    })

    it('should render paywall for cancelled subscriptions', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.cancelled,
        feature: 'customRoles',
      })

      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument()
      expect(screen.getByText(/subscription cancelled/i)).toBeInTheDocument()
    })

    it('should display custom message when provided', () => {
      const customMessage = 'Advanced API Limits require a Professional subscription or higher.'
      
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
        customMessage,
      })

      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })

    it('should hide upgrade button when showUpgradeButton is false', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
        showUpgradeButton: false,
      })

      expect(screen.getByTestId('limit-paywall')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument()
    })
  })

  describe('Subscription Status Handling', () => {
    it('should display appropriate messaging for free tier limitations', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'customRoles',
      })

      expect(screen.getByText(/custom roles/i)).toBeInTheDocument()
      expect(screen.getByText(/professional subscription/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upgrade to professional/i })).toBeInTheDocument()
    })

    it('should handle professional tier accessing enterprise features', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.professional,
        feature: 'advancedAuth',
      })

      expect(screen.getByText(/advanced authentication/i)).toBeInTheDocument()
      expect(screen.getByText(/enterprise subscription/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upgrade to enterprise/i })).toBeInTheDocument()
    })

    it('should display renewal messaging for expired subscriptions', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.expired,
        feature: 'apiLimits',
      })

      expect(screen.getByText(/subscription has expired/i)).toBeInTheDocument()
      expect(screen.getByText(/renew your subscription/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /renew subscription/i })).toBeInTheDocument()
    })

    it('should handle grace period for cancelled subscriptions', () => {
      renderLimitPaywall({
        user: mockUsers.proUser,
        subscription: mockSubscriptions.cancelled,
        feature: 'scheduledJobs',
      })

      expect(screen.getByText(/subscription cancelled/i)).toBeInTheDocument()
      expect(screen.getByText(/grace period/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reactivate/i })).toBeInTheDocument()
    })

    it('should show loading state while checking subscription status', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: true,
        error: null,
        hasFeature: vi.fn(),
        checkFeatureAccess: vi.fn(),
        upgradeSubscription: vi.fn(),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        feature: 'apiLimits',
      })

      expect(screen.getByTestId('subscription-loading')).toBeInTheDocument()
      expect(screen.getByRole('status', { name: /checking subscription/i })).toBeInTheDocument()
    })

    it('should handle subscription loading errors gracefully', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: false,
        error: new Error('Failed to load subscription data'),
        hasFeature: vi.fn(),
        checkFeatureAccess: vi.fn(),
        upgradeSubscription: vi.fn(),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        feature: 'apiLimits',
      })

      expect(screen.getByText(/unable to verify subscription/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle upgrade button click with proper tracking', async () => {
      const user = userEvent.setup()
      const mockUpgradeSubscription = vi.fn()
      
      mockUseSubscription.mockReturnValue({
        subscription: mockSubscriptions.free,
        isLoading: false,
        error: null,
        hasFeature: vi.fn(() => false),
        checkFeatureAccess: vi.fn(),
        upgradeSubscription: mockUpgradeSubscription,
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const upgradeButton = screen.getByRole('button', { name: /upgrade to professional/i })
      await user.click(upgradeButton)

      expect(mockUpgradeSubscription).toHaveBeenCalledWith('professional')
    })

    it('should handle learn more link for feature information', async () => {
      const user = userEvent.setup()
      
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'customRoles',
      })

      const learnMoreLink = screen.getByRole('link', { name: /learn more about custom roles/i })
      expect(learnMoreLink).toHaveAttribute('href', '/docs/features/custom-roles')
      expect(learnMoreLink).toHaveAttribute('target', '_blank')
      expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should support keyboard navigation for accessibility', async () => {
      const user = userEvent.setup()
      
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const upgradeButton = screen.getByRole('button', { name: /upgrade to professional/i })
      
      // Test keyboard navigation
      await user.tab()
      expect(upgradeButton).toHaveFocus()
      
      // Test Enter key activation
      await user.keyboard('{Enter}')
      expect(mockUseSubscription().upgradeSubscription).toHaveBeenCalled()
    })

    it('should close paywall when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)

      await waitFor(() => {
        expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument()
      })
    })
  })

  describe('Feature-Specific Messaging', () => {
    const featureTestCases: Array<{
      feature: PremiumFeature
      expectedMessage: RegExp
      requiredPlan: string
    }> = [
      {
        feature: 'apiLimits',
        expectedMessage: /api rate limiting/i,
        requiredPlan: 'Professional',
      },
      {
        feature: 'customRoles',
        expectedMessage: /custom roles and permissions/i,
        requiredPlan: 'Professional',
      },
      {
        feature: 'advancedAuth',
        expectedMessage: /advanced authentication/i,
        requiredPlan: 'Enterprise',
      },
      {
        feature: 'scheduledJobs',
        expectedMessage: /scheduled jobs and automation/i,
        requiredPlan: 'Professional',
      },
      {
        feature: 'emailTemplates',
        expectedMessage: /custom email templates/i,
        requiredPlan: 'Professional',
      },
      {
        feature: 'fileManagement',
        expectedMessage: /advanced file management/i,
        requiredPlan: 'Professional',
      },
    ]

    featureTestCases.forEach(({ feature, expectedMessage, requiredPlan }) => {
      it(`should display appropriate messaging for ${feature} feature`, () => {
        renderLimitPaywall({
          user: mockUsers.freeUser,
          subscription: mockSubscriptions.free,
          feature,
        })

        expect(screen.getByText(expectedMessage)).toBeInTheDocument()
        expect(screen.getByText(new RegExp(requiredPlan, 'i'))).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should provide proper ARIA labels and roles', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      // Check for proper ARIA attributes
      expect(screen.getByRole('dialog', { name: /premium feature required/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/premium feature notification/i)).toBeInTheDocument()
      
      // Check for descriptive text
      const description = screen.getByText(/api rate limiting requires a professional subscription/i)
      expect(description).toHaveAttribute('id')
    })

    it('should support screen reader announcements', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'customRoles',
      })

      // Check for live region updates
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveTextContent(/custom roles feature requires upgrade/i)
    })

    it('should provide sufficient color contrast', () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      // Check for proper contrast classes
      const paywallContainer = screen.getByTestId('limit-paywall')
      expect(paywallContainer).toHaveClass('bg-white', 'text-gray-900', 'border-gray-300')
      
      const upgradeButton = screen.getByRole('button', { name: /upgrade/i })
      expect(upgradeButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700')
    })

    it('should handle reduced motion preferences', () => {
      // Mock prefers-reduced-motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const paywallContainer = screen.getByTestId('limit-paywall')
      expect(paywallContainer).toHaveClass('motion-reduce:transition-none')
    })
  })

  describe('Next.js Middleware Integration', () => {
    it('should handle middleware authentication context', () => {
      // Mock Next.js middleware context
      const mockMiddlewareContext = {
        user: mockUsers.proUser,
        subscription: mockSubscriptions.professional,
        hasAccess: vi.fn((feature: PremiumFeature) => 
          mockSubscriptions.professional.features[feature] === true
        ),
      }

      // Test that component respects middleware context
      mockUseAuth.mockReturnValue({
        user: mockMiddlewareContext.user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      renderLimitPaywall({
        user: mockMiddlewareContext.user,
        subscription: mockMiddlewareContext.subscription,
        feature: 'apiLimits',
      })

      // Should not render paywall when middleware grants access
      expect(screen.queryByTestId('limit-paywall')).not.toBeInTheDocument()
    })

    it('should handle middleware redirect for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      renderLimitPaywall({
        user: null as any,
        subscription: null as any,
        feature: 'apiLimits',
      })

      // Should render authentication required message
      expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('should render within performance thresholds', async () => {
      const startTime = performance.now()
      
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      await waitFor(() => {
        expect(screen.getByTestId('limit-paywall')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Component should render within 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should implement lazy loading for upgrade flow components', async () => {
      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i })
      
      // Upgrade modal should not be in DOM until triggered
      expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument()
      
      fireEvent.click(upgradeButton)
      
      // Modal should be lazily loaded after interaction
      await waitFor(() => {
        expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle API failures', async () => {
      // Mock API failure response
      server.use(
        http.get('/api/v2/system/subscription', () => {
          return HttpResponse.json(
            { error: 'Subscription service unavailable' },
            { status: 503 }
          )
        })
      )

      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: false,
        error: new Error('Service unavailable'),
        hasFeature: vi.fn(() => false),
        checkFeatureAccess: vi.fn(),
        upgradeSubscription: vi.fn(),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        feature: 'apiLimits',
      })

      expect(screen.getByText(/unable to verify subscription status/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should handle upgrade flow errors', async () => {
      const user = userEvent.setup()
      const mockUpgradeSubscription = vi.fn().mockRejectedValue(
        new Error('Payment processing failed')
      )
      
      mockUseSubscription.mockReturnValue({
        subscription: mockSubscriptions.free,
        isLoading: false,
        error: null,
        hasFeature: vi.fn(() => false),
        checkFeatureAccess: vi.fn(),
        upgradeSubscription: mockUpgradeSubscription,
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i })
      await user.click(upgradeButton)

      await waitFor(() => {
        expect(screen.getByText(/upgrade failed/i)).toBeInTheDocument()
        expect(screen.getByText(/payment processing failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Zustand Store Integration', () => {
    it('should reflect subscription state changes from store', async () => {
      const mockSetSubscription = vi.fn()
      
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        sidebarCollapsed: false,
        globalLoading: false,
        preferences: {
          defaultDatabaseType: 'mysql',
          tablePageSize: 25,
          autoRefreshSchemas: true,
          showAdvancedOptions: false,
        },
        subscription: mockSubscriptions.free,
        setSubscription: mockSetSubscription,
        setTheme: vi.fn(),
        setSidebarCollapsed: vi.fn(),
        setGlobalLoading: vi.fn(),
        updatePreferences: vi.fn(),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      // Simulate subscription upgrade in store
      mockUseAppStore.mockReturnValue({
        ...mockUseAppStore(),
        subscription: mockSubscriptions.professional,
      })

      // Component should respond to store changes
      expect(mockSetSubscription).toHaveBeenCalled()
    })

    it('should persist paywall dismissal state', async () => {
      const user = userEvent.setup()
      const mockUpdatePreferences = vi.fn()
      
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        sidebarCollapsed: false,
        globalLoading: false,
        preferences: {
          defaultDatabaseType: 'mysql',
          tablePageSize: 25,
          autoRefreshSchemas: true,
          showAdvancedOptions: false,
          dismissedPaywalls: [],
        },
        updatePreferences: mockUpdatePreferences,
        setTheme: vi.fn(),
        setSidebarCollapsed: vi.fn(),
        setGlobalLoading: vi.fn(),
      })

      renderLimitPaywall({
        user: mockUsers.freeUser,
        subscription: mockSubscriptions.free,
        feature: 'apiLimits',
      })

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)

      expect(mockUpdatePreferences).toHaveBeenCalledWith({
        dismissedPaywalls: ['apiLimits'],
      })
    })
  })
})