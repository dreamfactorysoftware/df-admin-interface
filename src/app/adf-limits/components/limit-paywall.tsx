/**
 * Rate Limit Paywall Component for Premium Feature Access Control
 * 
 * React paywall component that replaces Angular route guard patterns with conditional rendering
 * for premium feature access control in the limits management interface. Implements Next.js 
 * middleware authentication patterns, Headless UI with Tailwind CSS styling, and Zustand
 * state management for subscription status.
 * 
 * This component provides WCAG 2.1 AA compliant access control with comprehensive error
 * handling, loading states, and seamless integration with the DreamFactory subscription
 * system.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

// Type definitions for missing dependencies
// These will be replaced when the actual files are created
interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'enterprise'
  isActive: boolean
  features: string[]
  expiresAt?: string
  planName: string
  billingCycle?: 'monthly' | 'yearly'
  trialEndsAt?: string
  isTrialActive?: boolean
}

interface SubscriptionHook {
  data: SubscriptionStatus | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  mutate: (data: SubscriptionStatus) => void
}

interface AppStore {
  user: {
    id: number
    email: string
    permissions: string[]
  } | null
  subscription: SubscriptionStatus | null
  updateSubscription: (subscription: SubscriptionStatus) => void
  theme: 'light' | 'dark'
}

// Mock hooks and stores - these will be replaced with actual implementations
const useSubscription = (): SubscriptionHook => {
  const [data, setData] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Simulate loading subscription data
    const timer = setTimeout(() => {
      setData({
        tier: 'free',
        isActive: true,
        features: ['basic_limits'],
        planName: 'Free Plan',
        isTrialActive: false
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }, [])

  const mutate = useCallback((newData: SubscriptionStatus) => {
    setData(newData)
  }, [])

  return { data, isLoading, error, refetch, mutate }
}

const useAppStore = (): AppStore => {
  const [store] = useState<AppStore>({
    user: {
      id: 1,
      email: 'user@example.com',
      permissions: ['limits.read']
    },
    subscription: null,
    updateSubscription: () => {},
    theme: 'light'
  })

  return store
}

// UI Components - simplified versions that will be replaced with actual components
interface CardProps {
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
    {children}
  </div>
)

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
  type?: 'button' | 'submit' | 'reset'
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:text-gray-400'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

interface IconProps {
  name: string
  className?: string
  'aria-hidden'?: boolean
}

const Icon: React.FC<IconProps> = ({ name, className = '', 'aria-hidden': ariaHidden = true }) => {
  // Simplified icon component - will be replaced with actual icon library
  const iconMap: Record<string, string> = {
    'lock': '🔒',
    'star': '⭐',
    'check': '✓',
    'x': '✕',
    'arrow-right': '→',
    'credit-card': '💳',
    'shield': '🛡️',
    'zap': '⚡'
  }

  return (
    <span 
      className={`inline-block ${className}`}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : 'img'}
    >
      {iconMap[name] || '?'}
    </span>
  )
}

// =============================================================================
// MAIN PAYWALL COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the LimitPaywall component
 */
export interface LimitPaywallProps {
  /** Feature identifier that requires premium access */
  feature: string
  /** Child components to render when access is granted */
  children: React.ReactNode
  /** Fallback component when access is denied (optional) */
  fallback?: React.ReactNode
  /** Whether to show the upgrade modal automatically */
  showModal?: boolean
  /** Custom upgrade URL (optional) */
  upgradeUrl?: string
  /** Additional CSS classes */
  className?: string
  /** Component test ID for testing */
  'data-testid'?: string
  /** Callback when access is denied */
  onAccessDenied?: (feature: string) => void
  /** Callback when user attempts to upgrade */
  onUpgradeAttempt?: (feature: string, currentPlan: string) => void
}

/**
 * Configuration for premium features
 */
interface PremiumFeatureConfig {
  id: string
  name: string
  description: string
  icon: string
  requiredTier: 'premium' | 'enterprise'
  benefits: string[]
  unavailableMessage?: string
}

/**
 * Upgrade plan configuration
 */
interface UpgradePlan {
  id: string
  name: string
  tier: 'premium' | 'enterprise'
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  popular?: boolean
  description: string
}

// =============================================================================
// PREMIUM FEATURE CONFIGURATIONS
// =============================================================================

/**
 * Configuration for premium features in the limits system
 */
const PREMIUM_FEATURES: Record<string, PremiumFeatureConfig> = {
  'advanced_limits': {
    id: 'advanced_limits',
    name: 'Advanced Rate Limiting',
    description: 'Create sophisticated rate limiting rules with custom algorithms',
    icon: 'shield',
    requiredTier: 'premium',
    benefits: [
      'Custom rate limiting algorithms',
      'Per-user and per-role limits',
      'Advanced counter types (token bucket, leaky bucket)',
      'Burst allowance configuration',
      'Real-time monitoring and alerts'
    ],
    unavailableMessage: 'Advanced rate limiting features require a Premium subscription'
  },
  'enterprise_limits': {
    id: 'enterprise_limits',
    name: 'Enterprise Rate Limiting',
    description: 'Enterprise-grade rate limiting with advanced analytics',
    icon: 'zap',
    requiredTier: 'enterprise',
    benefits: [
      'All Premium features',
      'Multi-tenant rate limiting',
      'Advanced analytics and reporting',
      'Custom webhook notifications',
      'Priority support',
      'SLA guarantees'
    ],
    unavailableMessage: 'Enterprise rate limiting features require an Enterprise subscription'
  },
  'bulk_operations': {
    id: 'bulk_operations',
    name: 'Bulk Limit Operations',
    description: 'Manage multiple rate limits simultaneously',
    icon: 'check',
    requiredTier: 'premium',
    benefits: [
      'Bulk create, update, and delete limits',
      'CSV import/export functionality',
      'Batch testing and validation',
      'Mass configuration changes'
    ],
    unavailableMessage: 'Bulk operations require a Premium subscription'
  }
}

/**
 * Available upgrade plans
 */
const UPGRADE_PLANS: UpgradePlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    price: {
      monthly: 29,
      yearly: 299
    },
    features: [
      'Advanced rate limiting algorithms',
      'Per-user and per-role limits',
      'Bulk operations',
      'Real-time monitoring',
      'Email support'
    ],
    popular: true,
    description: 'Perfect for growing teams and applications'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: {
      monthly: 99,
      yearly: 999
    },
    features: [
      'All Premium features',
      'Multi-tenant management',
      'Advanced analytics',
      'Custom integrations',
      'Priority support',
      'SLA guarantees'
    ],
    description: 'For large-scale applications and organizations'
  }
]

// =============================================================================
// PAYWALL COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * LimitPaywall Component
 * 
 * Provides conditional access control for premium features in the rate limiting
 * interface. Replaces Angular route guards with React conditional rendering
 * patterns while maintaining security and user experience standards.
 */
export const LimitPaywall: React.FC<LimitPaywallProps> = ({
  feature,
  children,
  fallback,
  showModal: initialShowModal = false,
  upgradeUrl,
  className = '',
  'data-testid': testId = 'limit-paywall',
  onAccessDenied,
  onUpgradeAttempt
}) => {
  // Hooks for subscription data and app state
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError, refetch } = useSubscription()
  const { user, updateSubscription } = useAppStore()

  // Local state for modal management
  const [showUpgradeModal, setShowUpgradeModal] = useState(initialShowModal)
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Get feature configuration
  const featureConfig = PREMIUM_FEATURES[feature]

  /**
   * Determine if user has access to the requested feature
   */
  const hasAccess = useMemo(() => {
    if (!subscription || !featureConfig) return false

    // Check if subscription is active
    if (!subscription.isActive) return false

    // Check if user has required tier
    switch (featureConfig.requiredTier) {
      case 'premium':
        return subscription.tier === 'premium' || subscription.tier === 'enterprise'
      case 'enterprise':
        return subscription.tier === 'enterprise'
      default:
        return false
    }
  }, [subscription, featureConfig])

  /**
   * Handle access denied - show modal and call callback
   */
  const handleAccessDenied = useCallback(() => {
    setShowUpgradeModal(true)
    onAccessDenied?.(feature)
  }, [feature, onAccessDenied])

  /**
   * Handle upgrade attempt
   */
  const handleUpgradeAttempt = useCallback((plan: UpgradePlan) => {
    setSelectedPlan(plan)
    onUpgradeAttempt?.(feature, subscription?.planName || 'free')

    if (upgradeUrl) {
      // Navigate to custom upgrade URL
      window.open(upgradeUrl, '_blank', 'noopener,noreferrer')
    } else {
      // Handle upgrade within the application
      console.log('Upgrade to plan:', plan.name)
    }
  }, [feature, subscription?.planName, upgradeUrl, onUpgradeAttempt])

  /**
   * Close upgrade modal
   */
  const closeModal = useCallback(() => {
    setShowUpgradeModal(false)
    setSelectedPlan(null)
  }, [])

  /**
   * Refresh subscription data
   */
  const handleRefreshSubscription = useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    }
  }, [refetch])

  // Show loading state while subscription data is loading
  if (subscriptionLoading) {
    return (
      <div 
        className={`flex items-center justify-center p-6 ${className}`}
        data-testid={`${testId}-loading`}
        role="status"
        aria-label="Loading subscription information"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading subscription details...</span>
      </div>
    )
  }

  // Show error state if subscription loading failed
  if (subscriptionError) {
    return (
      <div 
        className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
        data-testid={`${testId}-error`}
        role="alert"
      >
        <div className="flex">
          <Icon name="x" className="text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Unable to verify subscription
            </h3>
            <p className="mt-1 text-sm text-red-700">
              There was an error loading your subscription information. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSubscription}
              className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show feature not found error
  if (!featureConfig) {
    return (
      <div 
        className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}
        data-testid={`${testId}-not-found`}
        role="alert"
      >
        <div className="flex">
          <Icon name="x" className="text-yellow-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Feature not configured
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              The requested feature "{feature}" is not properly configured.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If user has access, render children
  if (hasAccess) {
    return (
      <div className={className} data-testid={`${testId}-granted`}>
        {children}
      </div>
    )
  }

  // If user doesn't have access, show fallback or default paywall
  const paywallContent = fallback || (
    <Card className="p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
        <Icon name="lock" className="text-yellow-600 text-2xl" aria-hidden="false" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {featureConfig.name}
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        {featureConfig.unavailableMessage || featureConfig.description}
      </p>
      <div className="mt-4">
        <Button
          variant="primary"
          onClick={handleAccessDenied}
          aria-label={`Upgrade to access ${featureConfig.name}`}
        >
          <Icon name="star" className="mr-2" />
          Upgrade to Premium
        </Button>
      </div>
    </Card>
  )

  return (
    <>
      <div className={className} data-testid={`${testId}-denied`}>
        {paywallContent}
      </div>

      {/* Upgrade Modal */}
      <Transition appear show={showUpgradeModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-gray-900 text-center mb-2"
                  >
                    Upgrade to Access {featureConfig.name}
                  </Dialog.Title>
                  
                  <Dialog.Description className="text-center text-gray-600 mb-6">
                    {featureConfig.description}
                  </Dialog.Description>

                  {/* Benefits Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      What you'll get:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {featureConfig.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start">
                          <Icon name="check" className="text-green-500 mr-3 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingCycle === 'monthly'
                            ? 'bg-white text-gray-900 shadow'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setBillingCycle('monthly')}
                        aria-pressed={billingCycle === 'monthly'}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingCycle === 'yearly'
                            ? 'bg-white text-gray-900 shadow'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setBillingCycle('yearly')}
                        aria-pressed={billingCycle === 'yearly'}
                      >
                        Yearly
                        <span className="ml-1 text-xs text-green-600 font-bold">Save 17%</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {UPGRADE_PLANS
                      .filter(plan => 
                        plan.tier === featureConfig.requiredTier || 
                        (featureConfig.requiredTier === 'premium' && plan.tier === 'enterprise')
                      )
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className={`relative border-2 rounded-lg p-6 ${
                            plan.popular
                              ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                              : 'border-gray-200'
                          }`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <span className="bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full">
                                POPULAR
                              </span>
                            </div>
                          )}
                          
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                            <p className="text-gray-600 mt-1">{plan.description}</p>
                            
                            <div className="mt-4">
                              <span className="text-4xl font-bold text-gray-900">
                                ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                              </span>
                              <span className="text-gray-600">
                                /{billingCycle === 'monthly' ? 'month' : 'year'}
                              </span>
                            </div>
                            
                            {billingCycle === 'yearly' && (
                              <p className="text-sm text-green-600 mt-1">
                                ${plan.price.monthly * 12 - plan.price.yearly} saved annually
                              </p>
                            )}
                          </div>

                          <ul className="mt-6 space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Icon name="check" className="text-green-500 mr-3 mt-0.5" />
                                <span className="text-gray-700 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            variant={plan.popular ? "primary" : "outline"}
                            className="w-full mt-6"
                            onClick={() => handleUpgradeAttempt(plan)}
                            aria-label={`Upgrade to ${plan.name} plan`}
                          >
                            <Icon name="credit-card" className="mr-2" />
                            Choose {plan.name}
                          </Button>
                        </div>
                      ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      30-day money-back guarantee • Cancel anytime
                    </p>
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      aria-label="Close upgrade dialog"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

// =============================================================================
// UTILITY HOOKS FOR PAYWALL INTEGRATION
// =============================================================================

/**
 * Hook for checking premium feature access
 * 
 * Provides a convenient way to check feature access throughout the application
 * without rendering the full paywall component.
 */
export const usePremiumFeature = (feature: string) => {
  const { data: subscription, isLoading, error } = useSubscription()
  const featureConfig = PREMIUM_FEATURES[feature]

  const hasAccess = useMemo(() => {
    if (!subscription || !featureConfig) return false
    if (!subscription.isActive) return false

    switch (featureConfig.requiredTier) {
      case 'premium':
        return subscription.tier === 'premium' || subscription.tier === 'enterprise'
      case 'enterprise':
        return subscription.tier === 'enterprise'
      default:
        return false
    }
  }, [subscription, featureConfig])

  return {
    hasAccess,
    isLoading,
    error,
    featureConfig,
    subscription
  }
}

/**
 * Hook for managing paywall state
 * 
 * Provides centralized state management for paywall interactions
 * and upgrade flows throughout the application.
 */
export const usePaywallState = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { updateSubscription } = useAppStore()

  const openPaywall = useCallback((feature: string) => {
    setActiveFeature(feature)
    setShowUpgradeModal(true)
  }, [])

  const closePaywall = useCallback(() => {
    setActiveFeature(null)
    setShowUpgradeModal(false)
  }, [])

  const handleUpgradeSuccess = useCallback((newSubscription: SubscriptionStatus) => {
    updateSubscription(newSubscription)
    closePaywall()
  }, [updateSubscription, closePaywall])

  return {
    activeFeature,
    showUpgradeModal,
    openPaywall,
    closePaywall,
    handleUpgradeSuccess
  }
}

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export default LimitPaywall

/**
 * Pre-configured paywall components for common premium features
 */
export const AdvancedLimitsPaywall: React.FC<Omit<LimitPaywallProps, 'feature'>> = (props) => (
  <LimitPaywall {...props} feature="advanced_limits" />
)

export const EnterpriseLimitsPaywall: React.FC<Omit<LimitPaywallProps, 'feature'>> = (props) => (
  <LimitPaywall {...props} feature="enterprise_limits" />
)

export const BulkOperationsPaywall: React.FC<Omit<LimitPaywallProps, 'feature'>> = (props) => (
  <LimitPaywall {...props} feature="bulk_operations" />
)

/**
 * HOC for wrapping components with paywall protection
 */
export const withPaywall = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string
) => {
  const PaywallWrappedComponent: React.FC<P> = (props) => (
    <LimitPaywall feature={feature}>
      <WrappedComponent {...props} />
    </LimitPaywall>
  )

  PaywallWrappedComponent.displayName = `withPaywall(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return PaywallWrappedComponent
}

/**
 * Type exports for external use
 */
export type {
  LimitPaywallProps,
  SubscriptionStatus,
  PremiumFeatureConfig,
  UpgradePlan
}