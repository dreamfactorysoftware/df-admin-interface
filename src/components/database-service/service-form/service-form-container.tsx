/**
 * Service Form Container Component
 * 
 * React container component that manages the database service form page, implementing
 * routing, form state initialization, and component orchestration. Combines the functionality
 * of the Angular df-service-details component into a React container that handles both creation
 * and editing workflows, paywall logic, service type detection, and navigation patterns.
 * 
 * Key Features:
 * - Next.js 15.1+ App Router with dynamic routing for service management pages
 * - React Context API for component communication and shared state management
 * - React 19 server components for initial page loads per integration requirements
 * - Integration with database service provider context for configuration and type detection
 * - Support for both service creation and editing workflows maintaining existing functionality
 * - Paywall access control functionality maintaining existing authorization patterns
 * - Navigation integration with Next.js router for service management and API documentation flows
 * 
 * @fileoverview Database service form container with routing and state orchestration
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DatabaseIcon, 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Import database service context and related hooks
import { 
  useDatabaseServiceContext, 
  useDatabaseServiceActions,
  useDatabaseServiceState,
  useSelectedService
} from '../database-service-provider';

// Import form components and utilities
import ServiceFormWizard from './service-form-wizard';

// Import types and interfaces
import type {
  DatabaseService,
  DatabaseServiceFormData,
  ServiceFormMode,
  ServiceFormContainerProps,
  ServiceFormContextType,
  PaywallState,
  ServiceFormError,
  ApiErrorResponse
} from './service-form-types';

// Import authentication and paywall components
import { useAuth } from '@/hooks/use-auth';
import { usePaywall } from '@/hooks/use-paywall';

// Import UI components
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

// =============================================================================
// SERVICE FORM CONTEXT DEFINITION
// =============================================================================

/**
 * Service Form Context for sharing state across form components
 * Provides form configuration, mode, and shared utilities to child components
 */
interface ServiceFormContextValue {
  // Form configuration
  mode: ServiceFormMode;
  serviceId?: number;
  initialData?: Partial<DatabaseServiceFormData>;
  
  // State flags
  isLoading: boolean;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  
  // Paywall integration
  paywallState: PaywallState;
  isPaywallBlocked: boolean;
  
  // Navigation handlers
  onCancel: () => void;
  onSubmit: (data: DatabaseServiceFormData) => Promise<void>;
  onNavigateToApiDocs: (serviceName: string) => void;
  
  // Error handling
  error: ServiceFormError | null;
  clearError: () => void;
  
  // Utility functions
  validateServiceAccess: () => boolean;
  checkPaywallRestrictions: (serviceType: string) => boolean;
}

const ServiceFormContext = createContext<ServiceFormContextValue | null>(null);

/**
 * Hook to access service form context with error handling
 */
export const useServiceFormContext = (): ServiceFormContextValue => {
  const context = useContext(ServiceFormContext);
  
  if (!context) {
    throw new Error(
      'useServiceFormContext must be used within a ServiceFormContainer. ' +
      'Ensure your component is wrapped with the service form container.'
    );
  }
  
  return context;
};

// =============================================================================
// PAYWALL MODAL COMPONENT
// =============================================================================

/**
 * Paywall Modal for premium service access control
 * Displays when user attempts to create premium database services
 */
interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  onUpgrade: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  onUpgrade
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <ShieldExclamationIcon className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Premium Service Required
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {serviceType} connections require a premium license
            </DialogDescription>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Premium Features Include:
          </h4>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• Enterprise database connections ({serviceType})</li>
            <li>• Advanced security and encryption</li>
            <li>• Priority support and documentation</li>
            <li>• Advanced API generation features</li>
            <li>• Enhanced monitoring and analytics</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700">
            Upgrade to Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// MAIN SERVICE FORM CONTAINER COMPONENT
// =============================================================================

/**
 * Service Form Container Component
 * 
 * Main container component that orchestrates the database service form workflow.
 * Handles routing, authentication, paywall logic, and form state management.
 * Implements the complete service creation and editing flow with proper error handling.
 */
export const ServiceFormContainer: React.FC<ServiceFormContainerProps> = ({
  className,
  'data-testid': testId
}) => {
  // =============================================================================
  // ROUTING AND NAVIGATION HOOKS
  // =============================================================================
  
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract route parameters for mode and service ID detection
  const serviceId = params?.service ? parseInt(params.service as string, 10) : undefined;
  const mode: ServiceFormMode = serviceId ? 'edit' : 'create';
  const returnUrl = searchParams?.get('returnUrl') || '/api-connections/database';
  
  // =============================================================================
  // AUTHENTICATION AND AUTHORIZATION
  // =============================================================================
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    checkFeatureAccess, 
    isPaywallActive, 
    openUpgradeDialog,
    paywallState 
  } = usePaywall();
  
  // =============================================================================
  // DATABASE SERVICE CONTEXT AND STATE
  // =============================================================================
  
  const {
    services,
    selectedService,
    loading: servicesLoading,
    error: servicesError,
    createService,
    updateService,
    refreshServices
  } = useDatabaseServiceContext();
  
  const { selectServiceById, clearSelection } = useSelectedService();
  
  // =============================================================================
  // LOCAL COMPONENT STATE
  // =============================================================================
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<ServiceFormError | null>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [blockedServiceType, setBlockedServiceType] = useState<string>('');
  
  // =============================================================================
  // SERVICE DATA LOADING FOR EDIT MODE
  // =============================================================================
  
  /**
   * Query for loading existing service data in edit mode
   * Uses React Query for intelligent caching with service data
   */
  const {
    data: existingService,
    isLoading: serviceLoading,
    error: serviceError,
    refetch: refetchService
  } = useQuery({
    queryKey: ['database-service', serviceId],
    queryFn: async () => {
      if (!serviceId || mode === 'create') return null;
      
      // Find service in context first (cache hit)
      const cachedService = services.find(s => s.id === serviceId);
      if (cachedService) return cachedService;
      
      // Fetch from API if not in cache
      const response = await fetch(`/api/v2/system/service/${serviceId}`);
      if (!response.ok) {
        throw new Error(`Failed to load service: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: mode === 'edit' && !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (service not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    }
  });
  
  // =============================================================================
  // FORM DATA INITIALIZATION
  // =============================================================================
  
  /**
   * Initialize form data based on mode and existing service
   * Transforms database service to form data format
   */
  const initialFormData = useMemo<Partial<DatabaseServiceFormData> | undefined>(() => {
    if (mode === 'create') {
      return {
        serviceType: 'mysql',
        name: '',
        label: '',
        description: '',
        isActive: true,
        host: '',
        database: '',
        username: '',
        password: '',
        accessType: 'public',
        requireApiKey: false,
        enableAuditing: false
      };
    }
    
    if (mode === 'edit' && existingService) {
      return {
        serviceType: existingService.type as any,
        name: existingService.name,
        label: existingService.label || '',
        description: existingService.description || '',
        isActive: existingService.is_active,
        host: existingService.config?.host || '',
        port: existingService.config?.port,
        database: existingService.config?.database || '',
        username: existingService.config?.username || '',
        password: '', // Never pre-populate password for security
        connectionString: existingService.config?.dsn || '',
        sslEnabled: existingService.config?.ssl_enabled || false,
        sslMode: existingService.config?.ssl_mode || 'prefer',
        timezone: existingService.config?.timezone || 'UTC',
        charset: existingService.config?.charset || 'utf8mb4',
        poolingEnabled: existingService.config?.pooling_enabled !== false,
        minConnections: existingService.config?.min_connections || 1,
        maxConnections: existingService.config?.max_connections || 10,
        connectionTimeout: existingService.config?.connection_timeout || 30000,
        accessType: 'public', // Default - would need API to get actual security config
        allowedRoles: [],
        allowedApps: [],
        requireApiKey: false,
        enableAuditing: false
      };
    }
    
    return undefined;
  }, [mode, existingService]);
  
  // =============================================================================
  // PAYWALL AND ACCESS CONTROL
  // =============================================================================
  
  /**
   * Validate service access based on license and paywall restrictions
   */
  const validateServiceAccess = useCallback((): boolean => {
    if (!isAuthenticated) return false;
    
    return checkFeatureAccess('database-services');
  }, [isAuthenticated, checkFeatureAccess]);
  
  /**
   * Check paywall restrictions for specific service types
   */
  const checkPaywallRestrictions = useCallback((serviceType: string): boolean => {
    const premiumServiceTypes = ['oracle', 'snowflake', 'mongodb'];
    
    if (premiumServiceTypes.includes(serviceType)) {
      return !checkFeatureAccess('premium-databases');
    }
    
    return false;
  }, [checkFeatureAccess]);
  
  // =============================================================================
  // NAVIGATION HANDLERS
  // =============================================================================
  
  /**
   * Handle cancel navigation with unsaved changes confirmation
   */
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    
    // Clear selected service and navigate back
    clearSelection();
    router.push(returnUrl);
  }, [hasUnsavedChanges, clearSelection, router, returnUrl]);
  
  /**
   * Navigate to API documentation for service
   */
  const handleNavigateToApiDocs = useCallback((serviceName: string) => {
    router.push(`/adf-api-docs/services/${encodeURIComponent(serviceName)}`);
  }, [router]);
  
  // =============================================================================
  // FORM SUBMISSION HANDLERS
  // =============================================================================
  
  /**
   * Handle form submission for service creation or update
   */
  const handleSubmit = useCallback(async (formData: DatabaseServiceFormData): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check paywall restrictions before submission
      if (checkPaywallRestrictions(formData.serviceType)) {
        setBlockedServiceType(formData.serviceType);
        setShowPaywallModal(true);
        return;
      }
      
      // Transform form data to API format
      const serviceData = {
        name: formData.name,
        label: formData.label || formData.name,
        description: formData.description || '',
        type: formData.serviceType,
        is_active: formData.isActive,
        config: {
          host: formData.host,
          port: formData.port,
          database: formData.database,
          username: formData.username,
          password: formData.password,
          dsn: formData.connectionString,
          ssl_enabled: formData.sslEnabled,
          ssl_mode: formData.sslMode,
          timezone: formData.timezone,
          charset: formData.charset,
          pooling_enabled: formData.poolingEnabled,
          min_connections: formData.minConnections,
          max_connections: formData.maxConnections,
          connection_timeout: formData.connectionTimeout
        }
      };
      
      let result: DatabaseService;
      
      if (mode === 'create') {
        result = await createService(serviceData);
      } else if (mode === 'edit' && serviceId) {
        result = await updateService(serviceId, serviceData);
      } else {
        throw new Error('Invalid form mode or missing service ID');
      }
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Navigate to service details or API docs
      if (mode === 'create') {
        router.push(`/api-connections/database/${result.name}/schema`);
      } else {
        router.push(returnUrl);
      }
      
    } catch (err) {
      console.error('Service submission error:', err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while saving the service';
      
      setError({
        type: 'submission',
        message: errorMessage,
        details: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode, 
    serviceId, 
    createService, 
    updateService, 
    checkPaywallRestrictions,
    router, 
    returnUrl
  ]);
  
  // =============================================================================
  // PAYWALL HANDLERS
  // =============================================================================
  
  /**
   * Handle paywall modal close
   */
  const handlePaywallClose = useCallback(() => {
    setShowPaywallModal(false);
    setBlockedServiceType('');
  }, []);
  
  /**
   * Handle upgrade to premium workflow
   */
  const handleUpgrade = useCallback(() => {
    setShowPaywallModal(false);
    openUpgradeDialog();
  }, [openUpgradeDialog]);
  
  // =============================================================================
  // ERROR HANDLING
  // =============================================================================
  
  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // =============================================================================
  // LIFECYCLE EFFECTS
  // =============================================================================
  
  /**
   * Initialize selected service for edit mode
   */
  useEffect(() => {
    if (mode === 'edit' && serviceId && existingService) {
      selectServiceById(serviceId);
    }
    
    return () => {
      // Cleanup on unmount
      if (mode === 'edit') {
        clearSelection();
      }
    };
  }, [mode, serviceId, existingService, selectServiceById, clearSelection]);
  
  /**
   * Handle authentication redirects
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [authLoading, isAuthenticated, router]);
  
  /**
   * Handle access validation
   */
  useEffect(() => {
    if (isAuthenticated && !validateServiceAccess()) {
      setError({
        type: 'access',
        message: 'You do not have permission to manage database services',
        details: 'Contact your administrator for access to database service management'
      });
    }
  }, [isAuthenticated, validateServiceAccess]);
  
  // =============================================================================
  // CONTEXT VALUE ASSEMBLY
  // =============================================================================
  
  /**
   * Assemble context value for child components
   */
  const contextValue = useMemo<ServiceFormContextValue>(() => ({
    // Form configuration
    mode,
    serviceId,
    initialData: initialFormData,
    
    // State flags
    isLoading: isLoading || serviceLoading || servicesLoading,
    isSubmitting,
    hasUnsavedChanges,
    
    // Paywall integration
    paywallState,
    isPaywallBlocked: isPaywallActive,
    
    // Navigation handlers
    onCancel: handleCancel,
    onSubmit: handleSubmit,
    onNavigateToApiDocs: handleNavigateToApiDocs,
    
    // Error handling
    error,
    clearError,
    
    // Utility functions
    validateServiceAccess,
    checkPaywallRestrictions
  }), [
    mode,
    serviceId,
    initialFormData,
    isLoading,
    serviceLoading,
    servicesLoading,
    isSubmitting,
    hasUnsavedChanges,
    paywallState,
    isPaywallActive,
    handleCancel,
    handleSubmit,
    handleNavigateToApiDocs,
    error,
    clearError,
    validateServiceAccess,
    checkPaywallRestrictions
  ]);
  
  // =============================================================================
  // LOADING AND ERROR STATES
  // =============================================================================
  
  // Show loading spinner during authentication or service data loading
  if (authLoading || (mode === 'edit' && serviceLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? 'Authenticating...' : 'Loading service details...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Show error state for service loading failures
  if (mode === 'edit' && serviceError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Failed to Load Service</h3>
            <p className="text-sm mt-1">
              {serviceError instanceof Error 
                ? serviceError.message 
                : 'Unable to load service details'}
            </p>
          </div>
        </Alert>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          <Button onClick={() => refetchService()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Show access denied state
  if (error?.type === 'access') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <ShieldExclamationIcon className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Access Denied</h3>
            <p className="text-sm mt-1">{error.message}</p>
            {error.details && (
              <p className="text-xs mt-2 text-gray-500">{error.details}</p>
            )}
          </div>
        </Alert>
        
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
      </div>
    );
  }
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)} data-testid={testId}>
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Services
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <DatabaseIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {mode === 'create' ? 'Create Database Service' : 'Edit Database Service'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mode === 'create' 
                      ? 'Configure a new database connection for API generation'
                      : `Editing service: ${existingService?.name || 'Unknown'}`
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {mode === 'edit' && existingService && (
              <Button
                variant="outline"
                onClick={() => handleNavigateToApiDocs(existingService.name)}
                className="flex items-center"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && error.type !== 'access' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Alert variant="destructive" className="mb-6">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {error.type === 'submission' ? 'Submission Error' : 'Error'}
                </h3>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </Alert>
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServiceFormContext.Provider value={contextValue}>
          <ServiceFormWizard
            mode={mode}
            initialData={initialFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            onFormChange={(hasChanges) => setHasUnsavedChanges(hasChanges)}
          />
        </ServiceFormContext.Provider>
      </div>
      
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={handlePaywallClose}
        serviceType={blockedServiceType}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ServiceFormContainer;

// Export context hook for child components
export { useServiceFormContext };

// Export types for external use
export type {
  ServiceFormContextValue,
  PaywallModalProps
};