/**
 * Paywall Modal Component
 * 
 * React modal component for database service paywall functionality, implementing premium 
 * service access control and subscription upgrade prompts. Replaces the Angular DfPaywallModal 
 * component with React patterns, including embedded Calendly widget integration for scheduling 
 * premium feature unlock demos. Provides consistent paywall enforcement across the service 
 * creation workflow.
 * 
 * @fileoverview Database service paywall modal with Calendly integration
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Star, 
  Crown, 
  Calendar,
  ExternalLink,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Mail,
  Phone,
  User,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { 
  PaywallModalProps,
  PaywallModalState,
  PaywallFeatureAccess,
  PremiumServiceConfig,
  ServiceTierAccess,
  DatabaseDriver
} from './service-form-types';

// =============================================================================
// TYPE DEFINITIONS AND SCHEMAS
// =============================================================================

/**
 * Contact form data structure for premium service inquiries
 */
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  serviceType: DatabaseDriver;
  requestType: 'trial' | 'upgrade' | 'consultation';
}

/**
 * Calendly widget configuration interface
 */
interface CalendlyConfig {
  url: string;
  height: number;
  hideEventTypeDetails?: boolean;
  hideLandingPageDetails?: boolean;
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
}

/**
 * Paywall feature highlight configuration
 */
interface FeatureHighlight {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tier: ServiceTierAccess;
  highlight?: boolean;
}

/**
 * Contact form validation schema with comprehensive business rules
 */
const ContactFormSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name must contain only letters, spaces, hyphens, and apostrophes'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name must contain only letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),
  
  company: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  message: z.string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),
  
  serviceType: z.enum([
    'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
    'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
    'apache_hive', 'databricks', 'dremio'
  ]),
  
  requestType: z.enum(['trial', 'upgrade', 'consultation'])
});

// =============================================================================
// PREMIUM SERVICE CONFIGURATIONS
// =============================================================================

/**
 * Premium service configurations for different database types
 */
const PREMIUM_SERVICES: Record<DatabaseDriver, PremiumServiceConfig> = {
  oracle: {
    serviceType: 'oracle',
    tierRequired: 'premium',
    features: [
      'Advanced Oracle PL/SQL stored procedure integration',
      'Oracle RAC cluster support with failover',
      'Advanced partitioning and compression support',
      'Enterprise security features integration',
      'Real-time Oracle GoldenGate replication support'
    ],
    trialPeriod: 14,
    upgradeIncentives: [
      {
        title: 'Enterprise Oracle Integration',
        description: 'Full Oracle Enterprise Edition feature support',
        value: 'Complete PL/SQL and advanced feature access',
        highlight: true,
        icon: Shield
      },
      {
        title: 'High Availability Support',
        description: 'Oracle RAC and Data Guard integration',
        value: '99.99% uptime SLA with automatic failover',
        highlight: false,
        icon: Zap
      }
    ]
  },
  
  snowflake: {
    serviceType: 'snowflake',
    tierRequired: 'premium',
    features: [
      'Advanced Snowflake warehouse scaling',
      'Multi-cluster warehouse support',
      'Time travel and data cloning capabilities',
      'Secure data sharing features',
      'Advanced analytics and ML function support'
    ],
    trialPeriod: 14,
    upgradeIncentives: [
      {
        title: 'Cloud Data Warehouse Power',
        description: 'Full Snowflake enterprise capabilities',
        value: 'Unlimited warehouse scaling and optimization',
        highlight: true,
        icon: Crown
      },
      {
        title: 'Advanced Analytics',
        description: 'ML and data science function integration',
        value: 'Native support for advanced analytics workloads',
        highlight: false,
        icon: Star
      }
    ]
  },
  
  databricks: {
    serviceType: 'databricks',
    tierRequired: 'enterprise',
    features: [
      'Databricks SQL warehouse integration',
      'MLflow experiment tracking',
      'Advanced Delta Lake features',
      'Collaborative notebook support',
      'Enterprise security and governance'
    ],
    trialPeriod: 21,
    upgradeIncentives: [
      {
        title: 'Unified Analytics Platform',
        description: 'Complete Databricks ecosystem integration',
        value: 'Data engineering, ML, and analytics in one platform',
        highlight: true,
        icon: Zap
      }
    ]
  },
  
  // Default configuration for other premium services
  sqlsrv: {
    serviceType: 'sqlsrv',
    tierRequired: 'premium',
    features: [
      'Advanced SQL Server features',
      'Always On availability groups',
      'Advanced security features',
      'SQL Server Agent integration'
    ],
    trialPeriod: 14,
    upgradeIncentives: []
  },
  
  // Free tier services (won't trigger paywall)
  mysql: { serviceType: 'mysql', tierRequired: 'free', features: [], upgradeIncentives: [] },
  pgsql: { serviceType: 'pgsql', tierRequired: 'free', features: [], upgradeIncentives: [] },
  sqlite: { serviceType: 'sqlite', tierRequired: 'free', features: [], upgradeIncentives: [] },
  mongodb: { serviceType: 'mongodb', tierRequired: 'free', features: [], upgradeIncentives: [] },
  ibmdb2: { serviceType: 'ibmdb2', tierRequired: 'basic', features: [], upgradeIncentives: [] },
  informix: { serviceType: 'informix', tierRequired: 'basic', features: [], upgradeIncentives: [] },
  sqlanywhere: { serviceType: 'sqlanywhere', tierRequired: 'basic', features: [], upgradeIncentives: [] },
  memsql: { serviceType: 'memsql', tierRequired: 'basic', features: [], upgradeIncentives: [] },
  salesforce_db: { serviceType: 'salesforce_db', tierRequired: 'premium', features: [], upgradeIncentives: [] },
  hana: { serviceType: 'hana', tierRequired: 'premium', features: [], upgradeIncentives: [] },
  apache_hive: { serviceType: 'apache_hive', tierRequired: 'premium', features: [], upgradeIncentives: [] }
};

/**
 * Feature highlights for different service tiers
 */
const TIER_FEATURES: Record<ServiceTierAccess, FeatureHighlight[]> = {
  free: [
    {
      id: 'basic-db',
      icon: CheckCircle,
      title: 'Basic Database Support',
      description: 'MySQL, PostgreSQL, SQLite, MongoDB',
      tier: 'free'
    },
    {
      id: 'rest-apis',
      icon: Zap,
      title: 'REST API Generation',
      description: 'Full CRUD operations with OpenAPI docs',
      tier: 'free'
    }
  ],
  
  basic: [
    {
      id: 'enterprise-db',
      icon: Shield,
      title: 'Enterprise Databases',
      description: 'IBM DB2, Informix, SQL Anywhere, MemSQL',
      tier: 'basic'
    },
    {
      id: 'advanced-security',
      icon: Crown,
      title: 'Advanced Security',
      description: 'Role-based access control and API keys',
      tier: 'basic'
    }
  ],
  
  premium: [
    {
      id: 'cloud-warehouses',
      icon: Star,
      title: 'Cloud Data Warehouses',
      description: 'Snowflake, Oracle, SQL Server, SAP HANA',
      tier: 'premium',
      highlight: true
    },
    {
      id: 'advanced-features',
      icon: Zap,
      title: 'Advanced Database Features',
      description: 'Stored procedures, triggers, advanced data types',
      tier: 'premium'
    },
    {
      id: 'priority-support',
      icon: Clock,
      title: 'Priority Support',
      description: '24/7 technical support and dedicated account management',
      tier: 'premium'
    }
  ],
  
  enterprise: [
    {
      id: 'analytics-platforms',
      icon: Crown,
      title: 'Analytics Platforms',
      description: 'Databricks, Apache Hive, Dremio integration',
      tier: 'enterprise',
      highlight: true
    },
    {
      id: 'white-glove',
      icon: User,
      title: 'White Glove Service',
      description: 'Custom implementation and migration assistance',
      tier: 'enterprise'
    }
  ]
};

/**
 * Default Calendly configuration for different request types
 */
const CALENDLY_CONFIGS: Record<string, CalendlyConfig> = {
  trial: {
    url: 'https://calendly.com/dreamfactory/premium-trial-setup',
    height: 700,
    hideEventTypeDetails: false,
    hideLandingPageDetails: true,
    backgroundColor: '#ffffff',
    textColor: '#232323',
    primaryColor: '#6366f1'
  },
  
  upgrade: {
    url: 'https://calendly.com/dreamfactory/upgrade-consultation',
    height: 700,
    hideEventTypeDetails: false,
    hideLandingPageDetails: true,
    backgroundColor: '#ffffff',
    textColor: '#232323',
    primaryColor: '#6366f1'
  },
  
  consultation: {
    url: 'https://calendly.com/dreamfactory/technical-consultation',
    height: 700,
    hideEventTypeDetails: false,
    hideLandingPageDetails: true,
    backgroundColor: '#ffffff',
    textColor: '#232323',
    primaryColor: '#6366f1'
  }
};

// =============================================================================
// MAIN PAYWALL MODAL COMPONENT
// =============================================================================

/**
 * PaywallModal Component
 * 
 * Comprehensive paywall modal for database service premium feature access control.
 * Implements React 19 patterns with Headless UI Dialog, Tailwind CSS styling,
 * and embedded Calendly widget integration for premium feature unlock scheduling.
 * 
 * Features:
 * - Premium service access enforcement with tier-based restrictions
 * - Embedded Calendly widget for scheduling premium feature demos
 * - Contact form integration with React Hook Form and Zod validation
 * - Responsive design with Tailwind CSS and theme support
 * - TypeScript interface compliance with strict type safety
 * - Authentication integration for personalized upgrade prompts
 * 
 * @param props PaywallModalProps interface for modal configuration
 * @returns JSX.Element Paywall modal component
 */
export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onContactSales,
  onStartTrial,
  modalState,
  featureAccess,
  premiumConfig,
  showCalendlyWidget = true,
  calendlyUrl,
  customContent,
  className,
  ...props
}) => {
  // =============================================================================
  // HOOKS AND STATE MANAGEMENT
  // =============================================================================

  const { user, isAuthenticated } = useAuth();
  const calendlyRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'contact' | 'calendar'>('features');
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // React Hook Form integration for contact form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      company: user?.company || '',
      phone: user?.phone || '',
      serviceType: modalState.serviceType || 'mysql',
      requestType: 'trial'
    }
  });

  const watchedRequestType = watch('requestType');

  // =============================================================================
  // COMPUTED VALUES AND MEMOIZED DATA
  // =============================================================================

  /**
   * Get premium service configuration for current service type
   */
  const serviceConfig = useMemo((): PremiumServiceConfig | null => {
    if (premiumConfig) return premiumConfig;
    if (modalState.serviceType) {
      return PREMIUM_SERVICES[modalState.serviceType] || null;
    }
    return null;
  }, [premiumConfig, modalState.serviceType]);

  /**
   * Get features for current and required tier
   */
  const currentTierFeatures = useMemo(() => {
    return TIER_FEATURES[modalState.currentTier] || [];
  }, [modalState.currentTier]);

  const requiredTierFeatures = useMemo(() => {
    return TIER_FEATURES[modalState.requiredTier] || [];
  }, [modalState.requiredTier]);

  /**
   * Get Calendly configuration based on request type
   */
  const calendlyConfig = useMemo((): CalendlyConfig => {
    if (calendlyUrl) {
      return {
        url: calendlyUrl,
        height: 700,
        hideEventTypeDetails: false,
        hideLandingPageDetails: true,
        backgroundColor: '#ffffff',
        textColor: '#232323',
        primaryColor: '#6366f1'
      };
    }
    return CALENDLY_CONFIGS[watchedRequestType] || CALENDLY_CONFIGS.trial;
  }, [calendlyUrl, watchedRequestType]);

  /**
   * Determine if trial is available for current service
   */
  const isTrialAvailable = useMemo(() => {
    return modalState.trialAvailable !== false && 
           serviceConfig?.trialPeriod && 
           serviceConfig.trialPeriod > 0;
  }, [modalState.trialAvailable, serviceConfig?.trialPeriod]);

  /**
   * Get tier display information
   */
  const tierInfo = useMemo(() => {
    const tierLabels: Record<ServiceTierAccess, string> = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };

    const tierColors: Record<ServiceTierAccess, string> = {
      free: 'text-gray-600',
      basic: 'text-blue-600',
      premium: 'text-purple-600',
      enterprise: 'text-amber-600'
    };

    return {
      current: {
        label: tierLabels[modalState.currentTier],
        color: tierColors[modalState.currentTier]
      },
      required: {
        label: tierLabels[modalState.requiredTier],
        color: tierColors[modalState.requiredTier]
      }
    };
  }, [modalState.currentTier, modalState.requiredTier]);

  // =============================================================================
  // CALENDLY WIDGET INTEGRATION
  // =============================================================================

  /**
   * Initialize Calendly widget with React patterns
   */
  useEffect(() => {
    if (!showCalendlyWidget || !isOpen || activeTab !== 'calendar') return;

    let isMounted = true;

    const loadCalendlyWidget = async () => {
      try {
        // Dynamically import Calendly widget script
        if (typeof window !== 'undefined' && !window.Calendly) {
          const script = document.createElement('script');
          script.src = 'https://assets.calendly.com/assets/external/widget.js';
          script.async = true;
          
          script.onload = () => {
            if (isMounted && window.Calendly && calendlyRef.current) {
              // Initialize Calendly widget with configuration
              window.Calendly.initInlineWidget({
                url: calendlyConfig.url,
                parentElement: calendlyRef.current,
                prefill: {
                  name: user ? `${user.firstName} ${user.lastName}` : '',
                  email: user?.email || '',
                  customAnswers: {
                    a1: modalState.serviceType || '',
                    a2: modalState.featureName || '',
                    a3: tierInfo.required.label
                  }
                },
                utm: {
                  utmCampaign: 'premium-upgrade',
                  utmSource: 'admin-interface',
                  utmMedium: 'paywall-modal',
                  utmContent: modalState.serviceType
                }
              });
              
              setIsCalendlyLoaded(true);
            }
          };

          script.onerror = () => {
            console.warn('Failed to load Calendly widget');
            if (isMounted) {
              setIsCalendlyLoaded(false);
            }
          };

          document.head.appendChild(script);
        } else if (window.Calendly && calendlyRef.current) {
          // Calendly already loaded, initialize widget
          window.Calendly.initInlineWidget({
            url: calendlyConfig.url,
            parentElement: calendlyRef.current,
            prefill: {
              name: user ? `${user.firstName} ${user.lastName}` : '',
              email: user?.email || '',
              customAnswers: {
                a1: modalState.serviceType || '',
                a2: modalState.featureName || '',
                a3: tierInfo.required.label
              }
            }
          });
          
          setIsCalendlyLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Calendly widget:', error);
        if (isMounted) {
          setIsCalendlyLoaded(false);
        }
      }
    };

    // Load widget with small delay for tab transition
    const timeoutId = setTimeout(loadCalendlyWidget, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [showCalendlyWidget, isOpen, activeTab, calendlyConfig.url, user, modalState, tierInfo.required.label]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle contact form submission with comprehensive error handling
   */
  const handleContactSubmit = useCallback(async (data: ContactFormData) => {
    try {
      // Simulate API call for contact form submission
      const response = await fetch('/api/v2/contact/premium-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          currentTier: modalState.currentTier,
          requiredTier: modalState.requiredTier,
          serviceType: modalState.serviceType,
          featureName: modalState.featureName,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit contact form: ${response.statusText}`);
      }

      setContactSubmitted(true);
      
      // Call external contact sales handler if provided
      if (onContactSales) {
        onContactSales();
      }

      // Show success state for 3 seconds then switch to calendar
      setTimeout(() => {
        setActiveTab('calendar');
      }, 2000);

    } catch (error) {
      console.error('Error submitting contact form:', error);
      // In a real implementation, you would show an error message to the user
    }
  }, [modalState, onContactSales]);

  /**
   * Handle trial start with authentication check
   */
  const handleStartTrial = useCallback(async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      if (onStartTrial) {
        await onStartTrial();
      }
      
      // Close modal after successful trial start
      onClose();
    } catch (error) {
      console.error('Error starting trial:', error);
    }
  }, [isAuthenticated, onStartTrial, onClose]);

  /**
   * Handle upgrade action with tier validation
   */
  const handleUpgrade = useCallback(async () => {
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else if (modalState.upgradeUrl) {
        // Open upgrade URL in new window
        window.open(modalState.upgradeUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error handling upgrade:', error);
    }
  }, [onUpgrade, modalState.upgradeUrl]);

  /**
   * Handle modal close with state cleanup
   */
  const handleClose = useCallback(() => {
    // Reset form state
    reset();
    setContactSubmitted(false);
    setActiveTab('features');
    setIsCalendlyLoaded(false);
    
    // Call external close handler
    onClose();
  }, [onClose, reset]);

  // =============================================================================
  // COMPONENT RENDERING HELPERS
  // =============================================================================

  /**
   * Render tier comparison section
   */
  const renderTierComparison = () => (
    <div className="space-y-6">
      {/* Current Tier */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Plan: <span className={cn('font-bold', tierInfo.current.color)}>
              {tierInfo.current.label}
            </span>
          </span>
        </div>
        
        <div className="space-y-2">
          {currentTierFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Required Tier */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center space-x-2 mb-3">
          <Star className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Required: <span className={cn('font-bold', tierInfo.required.color)}>
              {tierInfo.required.label}
            </span>
          </span>
        </div>
        
        <div className="space-y-2">
          {requiredTierFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center space-x-2">
              <feature.icon className={cn(
                'h-4 w-4',
                feature.highlight ? 'text-purple-600' : 'text-blue-500'
              )} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {feature.description}
              </span>
              {feature.highlight && (
                <span className="ml-auto px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Service-specific features */}
      {serviceConfig && serviceConfig.features.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {modalState.serviceType?.toUpperCase()} Premium Features
            </span>
          </div>
          
          <div className="space-y-2">
            {serviceConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Render contact form section
   */
  const renderContactForm = () => {
    if (contactSubmitted) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Thank You!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We've received your inquiry and will contact you within 24 hours.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            You can also schedule a call directly using the calendar tab.
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(handleContactSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
              errors.email ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company *
          </label>
          <input
            {...register('company')}
            type="text"
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
              errors.company ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="Enter your company name"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            {...register('phone')}
            type="tel"
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
              errors.phone ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="Enter your phone number (optional)"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Request Type *
          </label>
          <select
            {...register('requestType')}
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
              'border-gray-300'
            )}
          >
            <option value="trial">Start Free Trial</option>
            <option value="upgrade">Upgrade Subscription</option>
            <option value="consultation">Technical Consultation</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Additional Information
          </label>
          <textarea
            {...register('message')}
            rows={4}
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
              errors.message ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="Tell us more about your use case and requirements..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    );
  };

  /**
   * Render Calendly widget section
   */
  const renderCalendlyWidget = () => {
    if (!showCalendlyWidget) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Scheduling is currently unavailable. Please use the contact form instead.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Schedule a Demo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Book a 30-minute session with our team to explore premium features
          </p>
        </div>

        <div 
          ref={calendlyRef}
          className={cn(
            'min-h-[500px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
            !isCalendlyLoaded && 'flex items-center justify-center'
          )}
          style={{ height: calendlyConfig.height }}
        >
          {!isCalendlyLoaded && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading calendar...
              </p>
            </div>
          )}
        </div>

        {isTrialAvailable && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Or start your {serviceConfig?.trialPeriod}-day free trial immediately
            </p>
            <Button
              variant="outline"
              onClick={handleStartTrial}
              className="px-6"
            >
              Start Free Trial
            </Button>
          </div>
        )}
      </div>
    );
  };

  // =============================================================================
  // MAIN COMPONENT RENDER
  // =============================================================================

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      size="lg"
      className={cn('max-w-4xl', className)}
      closeOnOverlayClick={false}
      {...props}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Premium Feature Required
            </h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {modalState.featureName ? (
              <>The <strong>{modalState.featureName}</strong> feature requires a {tierInfo.required.label} subscription.</>
            ) : (
              <>This database type requires a {tierInfo.required.label} subscription for full feature access.</>
            )}
          </p>

          {modalState.trialDaysRemaining && modalState.trialDaysRemaining > 0 && (
            <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-full text-sm">
              <Clock className="h-4 w-4" />
              <span>{modalState.trialDaysRemaining} days remaining in trial</span>
            </div>
          )}
        </div>

        {/* Custom content override */}
        {customContent ? (
          <div>{customContent}</div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('features')}
                className={cn(
                  'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'features'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Star className="h-4 w-4 inline mr-2" />
                Features
              </button>
              
              <button
                onClick={() => setActiveTab('contact')}
                className={cn(
                  'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'contact'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Contact
              </button>
              
              {showCalendlyWidget && (
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'calendar'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Schedule
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'features' && renderTierComparison()}
              {activeTab === 'contact' && renderContactForm()}
              {activeTab === 'calendar' && renderCalendlyWidget()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <div className="flex space-x-3">
                {isTrialAvailable && activeTab !== 'calendar' && (
                  <Button
                    variant="outline"
                    onClick={handleStartTrial}
                    className="px-6"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start {serviceConfig?.trialPeriod}-Day Trial
                  </Button>
                )}

                <Button
                  onClick={handleUpgrade}
                  className="px-6"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to {tierInfo.required.label}
                  {modalState.upgradeUrl && (
                    <ExternalLink className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

// =============================================================================
// TYPE EXTENSIONS FOR CALENDLY
// =============================================================================

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          email?: string;
          customAnswers?: Record<string, string>;
        };
        utm?: {
          utmCampaign?: string;
          utmSource?: string;
          utmMedium?: string;
          utmContent?: string;
        };
      }) => void;
    };
  }
}

// =============================================================================
// EXPORT COMPONENT AND UTILITIES
// =============================================================================

export default PaywallModal;

export type {
  ContactFormData,
  CalendlyConfig,
  FeatureHighlight
};

export {
  PREMIUM_SERVICES,
  TIER_FEATURES,
  CALENDLY_CONFIGS,
  ContactFormSchema
};