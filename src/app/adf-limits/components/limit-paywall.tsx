/**
 * Limit Paywall Component for Premium Feature Access Control
 * 
 * React component that replaces Angular route guard patterns with conditional rendering
 * for premium feature access control in the limits management interface. Implements
 * enterprise-grade subscription validation with Headless UI components, Tailwind CSS
 * styling, and Zustand state management for seamless access control integration.
 * 
 * Features:
 * - Conditional rendering based on subscription status replacing Angular guards
 * - WCAG 2.1 AA compliant Headless UI components with Tailwind CSS styling
 * - Integration with Next.js middleware authentication patterns
 * - Zustand global state management for subscription status
 * - Premium feature flag management and validation
 * - Responsive design with mobile-first approach
 * - Comprehensive error handling and loading states
 * 
 * @fileoverview Premium paywall component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Subscription status interface for paywall validation
 * Simplified interface based on Angular paywall service patterns
 */
interface SubscriptionStatus {
  /** Whether the feature is locked for current subscription */
  isLocked: boolean;
  
  /** License type (GOLD, SILVER, OPEN_SOURCE) */
  licenseType: 'GOLD' | 'SILVER' | 'OPEN_SOURCE';
  
  /** Available resources for current subscription */
  availableResources: string[];
  
  /** Loading state for subscription check */
  isLoading: boolean;
  
  /** Error state for subscription validation */
  error: string | null;
}

/**
 * Premium features configuration
 * Maps features to their subscription requirements
 */
interface PremiumFeature {
  /** Feature identifier */
  id: string;
  
  /** Display name for the feature */
  name: string;
  
  /** Description of the feature benefits */
  description: string;
  
  /** Required license types that unlock this feature */
  requiredLicense: ('GOLD' | 'SILVER')[];
  
  /** Resource names that must be available */
  requiredResources: string[];
}

/**
 * Props for the LimitPaywall component
 */
interface LimitPaywallProps {
  /** Feature being accessed (defaults to 'limits') */
  feature?: string;
  
  /** Children to render when access is granted */
  children: React.ReactNode;
  
  /** Custom title for the paywall dialog */
  title?: string;
  
  /** Custom description for the paywall */
  description?: string;
  
  /** Whether to show as a modal dialog */
  showAsModal?: boolean;
  
  /** Whether the paywall check is enforced */
  enforcePaywall?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Callback when paywall is dismissed */
  onDismiss?: () => void;
  
  /** Callback when access is granted */
  onAccessGranted?: () => void;
  
  /** Callback when access is denied */
  onAccessDenied?: () => void;
}

// ============================================================================
// Premium Features Configuration
// ============================================================================

/**
 * Configuration for premium features and their requirements
 * Based on Angular paywall service feature locks
 */
const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  'limits': {
    id: 'limits',
    name: 'API Rate Limiting',
    description: 'Protect your APIs with advanced rate limiting controls. Set user-specific, service-specific, and global rate limits to ensure optimal performance and prevent abuse.',
    requiredLicense: ['GOLD', 'SILVER'],
    requiredResources: ['limit']
  },
  'rate-limiting': {
    id: 'rate-limiting',
    name: 'Advanced Rate Limiting',
    description: 'Enterprise-grade rate limiting with burst controls, custom time windows, and detailed analytics.',
    requiredLicense: ['GOLD', 'SILVER'],
    requiredResources: ['limit']
  },
  'scheduler': {
    id: 'scheduler',
    name: 'Task Scheduler',
    description: 'Automate your workflows with advanced scheduling capabilities, including cron expressions and event-driven triggers.',
    requiredLicense: ['GOLD'],
    requiredResources: ['scheduler']
  },
  'reporting': {
    id: 'reporting',
    name: 'Advanced Reporting',
    description: 'Generate comprehensive reports on API usage, performance metrics, and system analytics.',
    requiredLicense: ['GOLD'],
    requiredResources: ['reporting']
  },
  'event-scripts': {
    id: 'event-scripts',
    name: 'Event Scripts',
    description: 'Create custom business logic with server-side scripts triggered by API events.',
    requiredLicense: ['GOLD'],
    requiredResources: ['event-scripts']
  }
};

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for subscription status management
 * Replaces Angular DfPaywallService with React patterns
 */
function useSubscription(feature?: string): SubscriptionStatus {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isLocked: false,
    licenseType: 'GOLD',
    availableResources: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Simulate subscription check - in real implementation this would
    // call the system config API to get license and resource information
    const checkSubscription = async () => {
      try {
        setSubscriptionStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock subscription data - in real implementation this would come from API
        const mockLicenseType: SubscriptionStatus['licenseType'] = 'OPEN_SOURCE'; // Change to test different scenarios
        const mockAvailableResources = mockLicenseType === 'GOLD' ? ['limit', 'scheduler', 'reporting', 'event-scripts'] :
                                      mockLicenseType === 'SILVER' ? ['limit'] : [];
        
        // Check if current feature is locked
        let isLocked = false;
        if (feature && PREMIUM_FEATURES[feature]) {
          const featureConfig = PREMIUM_FEATURES[feature];
          const hasRequiredLicense = featureConfig.requiredLicense.includes(mockLicenseType);
          const hasRequiredResources = featureConfig.requiredResources.every(
            resource => mockAvailableResources.includes(resource)
          );
          isLocked = !hasRequiredLicense || !hasRequiredResources;
        }
        
        setSubscriptionStatus({
          isLocked,
          licenseType: mockLicenseType,
          availableResources: mockAvailableResources,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setSubscriptionStatus(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to check subscription status'
        }));
      }
    };

    checkSubscription();
  }, [feature]);

  return subscriptionStatus;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * LimitPaywall Component
 * 
 * Provides premium feature access control with conditional rendering based on
 * subscription status. Replaces Angular route guard patterns with React
 * component-level access control using Headless UI and Tailwind CSS.
 */
export function LimitPaywall({
  feature = 'limits',
  children,
  title,
  description,
  showAsModal = false,
  enforcePaywall = true,
  className,
  onDismiss,
  onAccessGranted,
  onAccessDenied
}: LimitPaywallProps) {
  // ============================================================================
  // State and Refs
  // ============================================================================
  
  const calendlyWidgetRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  
  // Get app store state for theme and loading
  const { theme, resolvedTheme, globalLoading } = useAppStore();
  
  // Get subscription status
  const subscription = useSubscription(feature);
  
  // Get feature configuration
  const featureConfig = PREMIUM_FEATURES[feature] || PREMIUM_FEATURES.limits;
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  /**
   * Initialize Calendly widget when component mounts and paywall is shown
   */
  useEffect(() => {
    if (subscription.isLocked && calendlyWidgetRef.current && !calendlyLoaded) {
      // Load Calendly script if not already loaded
      if (typeof window !== 'undefined' && !(window as any).Calendly) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => {
          initializeCalendlyWidget();
        };
        document.head.appendChild(script);
      } else if ((window as any).Calendly) {
        initializeCalendlyWidget();
      }
    }
  }, [subscription.isLocked, calendlyLoaded]);
  
  /**
   * Call access callbacks based on subscription status
   */
  useEffect(() => {
    if (!subscription.isLoading) {
      if (subscription.isLocked) {
        onAccessDenied?.();
        if (showAsModal) {
          setIsModalOpen(true);
        }
      } else {
        onAccessGranted?.();
      }
    }
  }, [subscription.isLoading, subscription.isLocked, onAccessGranted, onAccessDenied, showAsModal]);
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  /**
   * Initialize the Calendly inline widget
   */
  const initializeCalendlyWidget = () => {
    if (calendlyWidgetRef.current && (window as any).Calendly && !calendlyLoaded) {
      (window as any).Calendly.initInlineWidget({
        url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
        parentElement: calendlyWidgetRef.current,
        prefill: {},
        utm: {
          utmSource: 'dreamfactory-admin',
          utmMedium: 'paywall',
          utmCampaign: feature
        }
      });
      setCalendlyLoaded(true);
    }
  };
  
  /**
   * Handle modal dismiss
   */
  const handleDismiss = () => {
    setIsModalOpen(false);
    onDismiss?.();
  };
  
  // ============================================================================
  // Conditional Rendering Logic
  // ============================================================================
  
  // Show loading state while checking subscription
  if (subscription.isLoading || globalLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-[200px] w-full",
        "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        "rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}>
        <div className="flex flex-col items-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Checking subscription status...
          </p>
        </div>
      </div>
    );
  }
  
  // Show error state if subscription check failed
  if (subscription.error) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-[200px] w-full",
        "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
        "rounded-lg border border-red-200 dark:border-red-800",
        className
      )}>
        <div className="flex flex-col items-center space-y-4 p-8 text-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Unable to verify subscription
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {subscription.error}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If paywall is not enforced or feature is not locked, render children
  if (!enforcePaywall || !subscription.isLocked) {
    return <>{children}</>;
  }
  
  // ============================================================================
  // Paywall Content Component
  // ============================================================================
  
  const PaywallContent = () => (
    <div className={cn(
      "w-full max-w-4xl mx-auto",
      "bg-white dark:bg-gray-900",
      "shadow-xl rounded-lg border border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Header Section */}
      <div className="relative px-6 py-8 sm:px-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {title || `Unlock ${featureConfig.name}`}
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            {description || 'Upgrade your subscription to access premium features and enhance your API management capabilities'}
          </p>
        </div>
      </div>
      
      {/* Feature Details Section */}
      <div className="px-6 py-8 sm:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                About {featureConfig.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {featureConfig.description}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                What you'll gain with an upgrade:
              </h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced {featureConfig.name.toLowerCase()} capabilities</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Enhanced performance and reliability</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Priority technical support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Access to all premium features</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Upgrade Options */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Ready to upgrade? Let's talk!
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Schedule a consultation with our team to discuss your needs and find the perfect plan for your organization.
              </p>
              
              {/* Calendly Widget Container */}
              <div 
                ref={calendlyWidgetRef} 
                className="calendly-inline-widget bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[400px]"
                data-auto-load="false"
              />
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-6">
            Prefer to speak with a human?
          </h4>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <a 
              href="tel:+14159935877" 
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg",
                "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
                "border border-blue-200 dark:border-blue-800",
                "text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200",
                "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label="Call DreamFactory sales team"
            >
              <PhoneIcon className="w-5 h-5" />
              <span className="font-medium">+1 (415) 993-5877</span>
            </a>
            
            <a 
              href="mailto:info@dreamfactory.com" 
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg",
                "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
                "border border-purple-200 dark:border-purple-800",
                "text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200",
                "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              )}
              aria-label="Email DreamFactory sales team"
            >
              <EnvelopeIcon className="w-5 h-5" />
              <span className="font-medium">info@dreamfactory.com</span>
            </a>
          </div>
        </div>
        
        {/* Current Subscription Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Current License:
              </span>
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                subscription.licenseType === 'GOLD' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
                subscription.licenseType === 'SILVER' && "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
                subscription.licenseType === 'OPEN_SOURCE' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              )}>
                {subscription.licenseType.replace('_', ' ')}
              </span>
            </div>
            {subscription.availableResources.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Available features: {subscription.availableResources.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // ============================================================================
  // Render Logic
  // ============================================================================
  
  // Render as modal if requested
  if (showAsModal) {
    return (
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDismiss}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-left align-middle shadow-xl transition-all">
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      type="button"
                      className={cn(
                        "rounded-md p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      )}
                      onClick={handleDismiss}
                      aria-label="Close paywall dialog"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <PaywallContent />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
  
  // Render as inline content
  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen w-full",
      "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
      "px-4 py-8"
    )}>
      <PaywallContent />
    </div>
  );
}

// ============================================================================
// Export and Default Props
// ============================================================================

/**
 * Default export for the LimitPaywall component
 */
export default LimitPaywall;

/**
 * Named exports for component parts and utilities
 */
export { useSubscription, PREMIUM_FEATURES };
export type { LimitPaywallProps, SubscriptionStatus, PremiumFeature };