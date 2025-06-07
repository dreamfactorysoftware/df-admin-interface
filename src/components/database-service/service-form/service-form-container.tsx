/**
 * Service Form Container Component
 * 
 * React container component that manages the database service form page, implementing
 * routing, form state initialization, and component orchestration. Combines the 
 * functionality of the Angular df-service-details component into a React container 
 * that handles both creation and editing workflows, paywall logic, service type 
 * detection, and navigation patterns. Provides context and shared state to child 
 * form components.
 * 
 * Features:
 * - Next.js 15.1+ App Router with dynamic routing for service management pages
 * - React Context API for component communication and shared state
 * - React 19 server components for initial page loads
 * - Integration with database service provider context for service configuration
 * - Support for both service creation and editing workflows
 * - Paywall access control functionality maintaining existing authorization patterns
 * - Navigation integration with Next.js router for service management flows
 * 
 * @fileoverview Database service form container with routing and state management
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import { ServiceFormWizard } from './service-form-wizard';
import { useDatabaseServiceContext, useDatabaseServiceStore } from '../database-service-provider';
import { useAuth } from '../../../hooks/use-auth';
import { apiClient } from '../../../lib/api-client';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

import type {
  ServiceFormMode,
  ServiceFormData,
  ServiceFormInput,
  ServiceTierAccess,
  WizardStep,
  ServiceFormContainerProps,
  DatabaseService,
  DatabaseDriver,
  ServiceType
} from './service-form-types';
import type { 
  BaseComponentProps,
  ApiErrorResponse 
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Container initialization state for loading management
 */
interface ContainerState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  service: DatabaseService | null;
  mode: ServiceFormMode;
  canAccess: boolean;
  tierRequired: ServiceTierAccess | null;
}

/**
 * Route parameters for service form pages
 */
interface ServiceFormRouteParams {
  service?: string;
  serviceId?: string;
}

/**
 * Search parameters for service form configuration
 */
interface ServiceFormSearchParams {
  mode?: ServiceFormMode;
  type?: DatabaseDriver;
  clone?: string;
  redirect?: string;
  step?: string;
}

/**
 * Navigation configuration for service form flows
 */
interface NavigationConfig {
  backUrl: string;
  apiDocsUrl?: string;
  serviceListUrl: string;
  redirectOnSuccess?: string;
  redirectOnCancel?: string;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default wizard steps for service creation
 */
const DEFAULT_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'service-type',
    title: 'Database Type',
    description: 'Choose the type of database you want to connect',
    fields: ['type', 'serviceTypeId'],
    optional: false,
  },
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Provide basic details about your service',
    fields: ['name', 'label', 'description'],
    optional: false,
  },
  {
    id: 'connection-config',
    title: 'Connection Settings',
    description: 'Configure database connection parameters',
    fields: ['config.host', 'config.port', 'config.database', 'config.username', 'config.password'],
    optional: false,
  },
  {
    id: 'security-config',
    title: 'Security Configuration',
    description: 'Set up access control and security settings',
    fields: ['security'],
    optional: true,
  },
  {
    id: 'advanced-config',
    title: 'Advanced Options',
    description: 'Configure advanced features and optimizations',
    fields: ['advanced'],
    optional: true,
  },
];

/**
 * Default tier access mapping for service types
 */
const SERVICE_TIER_MAPPING: Record<DatabaseDriver, ServiceTierAccess> = {
  mysql: 'free',
  pgsql: 'free',
  sqlite: 'free',
  sqlsrv: 'basic',
  mongodb: 'basic',
  oracle: 'premium',
  snowflake: 'premium',
  ibmdb2: 'enterprise',
  informix: 'enterprise',
  sqlanywhere: 'enterprise',
  memsql: 'premium',
  salesforce_db: 'premium',
  hana: 'enterprise',
  apache_hive: 'premium',
  databricks: 'premium',
  dremio: 'premium',
};

// =============================================================================
// LOADING COMPONENT
// =============================================================================

/**
 * Loading skeleton component for container initialization
 */
const ContainerLoadingSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="p-8 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 p-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Error display component for container errors
 */
interface ContainerErrorProps {
  error: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

const ContainerError: React.FC<ContainerErrorProps> = ({ 
  error, 
  onRetry, 
  onGoBack 
}) => (
  <div className="max-w-2xl mx-auto p-6">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Unable to Load Service Form
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error}
      </p>
      <div className="flex justify-center space-x-4">
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>
    </div>
  </div>
);

// =============================================================================
// PAYWALL ACCESS COMPONENT
// =============================================================================

/**
 * Paywall blocking component for premium services
 */
interface PaywallAccessBlockProps {
  serviceType: DatabaseDriver;
  requiredTier: ServiceTierAccess;
  currentTier: ServiceTierAccess;
  onUpgrade?: () => void;
  onGoBack?: () => void;
}

const PaywallAccessBlock: React.FC<PaywallAccessBlockProps> = ({
  serviceType,
  requiredTier,
  currentTier,
  onUpgrade,
  onGoBack
}) => (
  <div className="max-w-2xl mx-auto p-6">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Cog6ToothIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Premium Database Service
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {serviceType.toUpperCase()} database connections require a{' '}
        <span className="font-semibold text-amber-600 dark:text-amber-400 capitalize">
          {requiredTier}
        </span>{' '}
        plan or higher. Your current plan is{' '}
        <span className="font-semibold capitalize">{currentTier}</span>.
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Upgrade to unlock:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• {serviceType.toUpperCase()} database connections</li>
          <li>• Advanced configuration options</li>
          <li>• Priority support</li>
          <li>• Enhanced security features</li>
        </ul>
      </div>
      <div className="flex justify-center space-x-4">
        {onUpgrade && (
          <Button onClick={onUpgrade} variant="primary">
            Upgrade to {requiredTier}
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Choose Different Database
          </Button>
        )}
      </div>
    </div>
  </div>
);

// =============================================================================
// MAIN CONTAINER COMPONENT
// =============================================================================

/**
 * Service Form Container Component Props
 */
interface ServiceFormContainerComponentProps extends BaseComponentProps {
  enablePaywall?: boolean;
  customSteps?: WizardStep[];
  onSuccess?: (service: DatabaseService) => void;
  onCancel?: () => void;
  onError?: (error: ApiErrorResponse) => void;
}

/**
 * Service Form Container Component
 * 
 * Main container component that handles database service form page routing,
 * state initialization, and component orchestration for both creation and
 * editing workflows.
 */
export const ServiceFormContainer: React.FC<ServiceFormContainerComponentProps> = ({
  enablePaywall = true,
  customSteps,
  onSuccess,
  onCancel,
  onError,
  className,
  ...props
}) => {
  // Next.js routing hooks
  const params = useParams<ServiceFormRouteParams>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract route parameters
  const serviceParam = params?.service;
  const serviceId = params?.serviceId ? parseInt(params.serviceId, 10) : undefined;
  
  // Extract search parameters
  const modeParam = searchParams?.get('mode') as ServiceFormMode | null;
  const typeParam = searchParams?.get('type') as DatabaseDriver | null;
  const cloneParam = searchParams?.get('clone');
  const redirectParam = searchParams?.get('redirect');
  const stepParam = searchParams?.get('step');

  // Authentication and context
  const { user, isAuthenticated, currentTier = 'free' } = useAuth();
  const { useStore, actions, selectors } = useDatabaseServiceContext();
  const store = useStore();

  // Container state management
  const [containerState, setContainerState] = useState<ContainerState>({
    isLoading: true,
    isInitialized: false,
    error: null,
    service: null,
    mode: 'create',
    canAccess: true,
    tierRequired: null,
  });

  // Determine operation mode
  const operationMode = useMemo((): ServiceFormMode => {
    if (modeParam) return modeParam;
    if (serviceId) return 'edit';
    if (cloneParam) return 'clone';
    return 'create';
  }, [modeParam, serviceId, cloneParam]);

  // Determine service type for paywall checking
  const serviceType = useMemo((): DatabaseDriver | null => {
    if (typeParam) return typeParam;
    if (containerState.service) return containerState.service.type;
    return null;
  }, [typeParam, containerState.service]);

  // Navigation configuration
  const navigationConfig = useMemo((): NavigationConfig => {
    const baseUrl = '/api-connections/database';
    return {
      backUrl: baseUrl,
      serviceListUrl: baseUrl,
      apiDocsUrl: serviceId ? `/api-docs/services/${serviceId}` : undefined,
      redirectOnSuccess: redirectParam || baseUrl,
      redirectOnCancel: redirectParam || baseUrl,
    };
  }, [serviceId, redirectParam]);

  // Check paywall access for service type
  const checkPaywallAccess = useCallback((dbType: DatabaseDriver): { canAccess: boolean; tierRequired: ServiceTierAccess | null } => {
    if (!enablePaywall) {
      return { canAccess: true, tierRequired: null };
    }

    const requiredTier = SERVICE_TIER_MAPPING[dbType] || 'free';
    const tierLevels = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    const canAccess = tierLevels[currentTier] >= tierLevels[requiredTier];

    return {
      canAccess,
      tierRequired: canAccess ? null : requiredTier,
    };
  }, [enablePaywall, currentTier]);

  // Initialize container state and load service data
  const initializeContainer = useCallback(async () => {
    try {
      setContainerState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check authentication
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      let service: DatabaseService | null = null;
      let mode = operationMode;

      // Load existing service for edit/clone modes
      if (serviceId && (mode === 'edit' || mode === 'view')) {
        try {
          const response = await apiClient.get(`/system/service/${serviceId}`);
          if (response.error) {
            throw new Error(response.error.message || 'Failed to load service');
          }
          service = response.data || response.resource;
          
          if (!service) {
            notFound();
            return;
          }
        } catch (error) {
          console.error('Failed to load service:', error);
          setContainerState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load service',
          }));
          return;
        }
      }

      // Load service for cloning
      if (cloneParam && mode === 'clone') {
        try {
          const cloneId = parseInt(cloneParam, 10);
          const response = await apiClient.get(`/system/service/${cloneId}`);
          if (response.error) {
            throw new Error(response.error.message || 'Failed to load service for cloning');
          }
          const sourceService = response.data || response.resource;
          
          if (sourceService) {
            // Create cloned service data with reset fields
            service = {
              ...sourceService,
              id: undefined,
              name: `${sourceService.name}_copy`,
              label: `${sourceService.label} (Copy)`,
              created_date: undefined,
              last_modified_date: undefined,
            } as DatabaseService;
            mode = 'create';
          }
        } catch (error) {
          console.error('Failed to load service for cloning:', error);
          setContainerState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load service for cloning',
          }));
          return;
        }
      }

      // Check paywall access if service type is determined
      let canAccess = true;
      let tierRequired: ServiceTierAccess | null = null;

      const dbType = serviceType || service?.type;
      if (dbType) {
        const accessCheck = checkPaywallAccess(dbType);
        canAccess = accessCheck.canAccess;
        tierRequired = accessCheck.tierRequired;
      }

      // Update store with selected service
      if (service) {
        store.selectService(service);
      }

      // Set initialized state
      setContainerState({
        isLoading: false,
        isInitialized: true,
        error: null,
        service,
        mode,
        canAccess,
        tierRequired,
      });

    } catch (error) {
      console.error('Container initialization failed:', error);
      setContainerState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize service form',
      }));
    }
  }, [
    isAuthenticated,
    serviceId,
    operationMode,
    cloneParam,
    serviceType,
    checkPaywallAccess,
    router,
    store
  ]);

  // Initialize container on mount and parameter changes
  useEffect(() => {
    initializeContainer();
  }, [initializeContainer]);

  // Form submission handler
  const handleFormSubmit = useCallback(async (formData: ServiceFormInput) => {
    try {
      let result: DatabaseService;

      if (containerState.mode === 'create' || containerState.mode === 'clone') {
        // Create new service
        result = await actions.createService(formData);
      } else if (containerState.mode === 'edit' && serviceId) {
        // Update existing service
        result = await actions.updateService(serviceId, formData);
      } else {
        throw new Error('Invalid operation mode or missing service ID');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Navigate to success page or service list
      if (navigationConfig.redirectOnSuccess) {
        router.push(navigationConfig.redirectOnSuccess);
      }

    } catch (error) {
      console.error('Form submission failed:', error);
      
      const apiError: ApiErrorResponse = {
        message: error instanceof Error ? error.message : 'Form submission failed',
        code: 'FORM_SUBMISSION_ERROR',
        details: error,
      };

      if (onError) {
        onError(apiError);
      }

      // Set error state for user feedback
      setContainerState(prev => ({
        ...prev,
        error: apiError.message,
      }));
    }
  }, [containerState.mode, serviceId, actions, onSuccess, onError, navigationConfig.redirectOnSuccess, router]);

  // Form cancellation handler
  const handleFormCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (navigationConfig.redirectOnCancel) {
      router.push(navigationConfig.redirectOnCancel);
    }
  }, [onCancel, navigationConfig.redirectOnCancel, router]);

  // Retry initialization handler
  const handleRetry = useCallback(() => {
    initializeContainer();
  }, [initializeContainer]);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    router.push(navigationConfig.backUrl);
  }, [router, navigationConfig.backUrl]);

  const handleUpgrade = useCallback(() => {
    // Navigate to upgrade page or show upgrade modal
    // This would integrate with the actual billing/upgrade system
    router.push('/upgrade');
  }, [router]);

  // Prepare wizard steps
  const wizardSteps = useMemo(() => {
    return customSteps || DEFAULT_WIZARD_STEPS;
  }, [customSteps]);

  // Prepare initial form data
  const initialFormData = useMemo((): Partial<ServiceFormData> | undefined => {
    if (!containerState.service) return undefined;

    return {
      name: containerState.service.name,
      label: containerState.service.label,
      description: containerState.service.description,
      type: containerState.service.type,
      config: containerState.service.config,
      is_active: containerState.service.is_active,
      // Map additional fields as needed
    };
  }, [containerState.service]);

  // Page title and breadcrumbs
  const pageTitle = useMemo(() => {
    switch (containerState.mode) {
      case 'create':
        return 'Create Database Service';
      case 'edit':
        return `Edit ${containerState.service?.label || 'Service'}`;
      case 'clone':
        return `Clone ${containerState.service?.label || 'Service'}`;
      case 'view':
        return `View ${containerState.service?.label || 'Service'}`;
      default:
        return 'Database Service';
    }
  }, [containerState.mode, containerState.service]);

  // Render loading state
  if (containerState.isLoading) {
    return <ContainerLoadingSkeleton />;
  }

  // Render error state
  if (containerState.error) {
    return (
      <ContainerError
        error={containerState.error}
        onRetry={handleRetry}
        onGoBack={handleGoBack}
      />
    );
  }

  // Render paywall block if access is denied
  if (!containerState.canAccess && containerState.tierRequired && serviceType) {
    return (
      <PaywallAccessBlock
        serviceType={serviceType}
        requiredTier={containerState.tierRequired}
        currentTier={currentTier}
        onUpgrade={handleUpgrade}
        onGoBack={handleGoBack}
      />
    );
  }

  // Render main form container
  return (
    <div className={cn('service-form-container', className)} {...props}>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              /
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* View API Docs Button (for existing services) */}
            {serviceId && containerState.mode !== 'create' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigationConfig.apiDocsUrl && router.push(navigationConfig.apiDocsUrl)}
                className="inline-flex items-center"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                API Docs
              </Button>
            )}

            {/* Status Indicator */}
            {containerState.service && (
              <div className="flex items-center space-x-2 text-sm">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  containerState.service.is_active 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
                )} />
                <span className="text-gray-600 dark:text-gray-400">
                  {containerState.service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Service Type Badge */}
        {serviceType && (
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              <Cog6ToothIcon className="w-4 h-4 mr-1" />
              {serviceType.toUpperCase()} Database
            </span>
          </div>
        )}
      </div>

      {/* Service Form Wizard */}
      <Suspense fallback={<ContainerLoadingSkeleton />}>
        <ServiceFormWizard
          mode={containerState.mode}
          serviceId={serviceId}
          initialData={initialFormData}
          steps={wizardSteps}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          enablePaywall={enablePaywall}
          currentTier={currentTier}
          redirectOnSuccess={navigationConfig.redirectOnSuccess}
          redirectOnCancel={navigationConfig.redirectOnCancel}
          submitButtonText={
            containerState.mode === 'create' ? 'Create Service' :
            containerState.mode === 'clone' ? 'Clone Service' :
            'Update Service'
          }
          showProgress={true}
          showStepIndicator={true}
          enableStepValidation={true}
          allowSkipOptionalSteps={true}
        />
      </Suspense>
    </div>
  );
};

// =============================================================================
// EXPORT DEFAULT COMPONENT
// =============================================================================

/**
 * Default export with Suspense wrapper for dynamic imports
 */
const ServiceFormContainerWithSuspense: React.FC<ServiceFormContainerComponentProps> = (props) => (
  <Suspense fallback={<ContainerLoadingSkeleton />}>
    <ServiceFormContainer {...props} />
  </Suspense>
);

export default ServiceFormContainerWithSuspense;

// Re-export component and types
export { ServiceFormContainer };
export type {
  ServiceFormContainerComponentProps,
  ContainerState,
  ServiceFormRouteParams,
  ServiceFormSearchParams,
  NavigationConfig,
};