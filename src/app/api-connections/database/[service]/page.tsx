/**
 * Database Service Details Page - Next.js App Router
 * 
 * Main service details page component implementing Next.js server component with 
 * React Hook Form for database service configuration. Handles service editing, 
 * connection testing, and multi-step wizard interface for database API generation.
 * 
 * Replaces Angular DfServiceDetailsComponent with modern React patterns including:
 * - SWR for connection testing and intelligent caching
 * - React Hook Form with Zod validation for real-time form validation under 100ms
 * - Tailwind CSS styling with consistent theme injection
 * - Paywall integration for premium features
 * - Next.js useRouter for navigation to schema and API docs
 * 
 * Key Features:
 * - Database service configuration and editing
 * - Real-time connection testing with SWR mutation hooks
 * - Multi-step wizard interface for API generation
 * - Schema discovery integration
 * - Security configuration workflows
 * - Premium feature access control with paywall integration
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { ChevronLeftIcon, CogIcon, PlayIcon, BookOpenIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

// Type imports
import type { 
  Service, 
  ServiceConfiguration, 
  ServiceType,
  DatabaseServiceConfig,
  ServiceTestResult,
  ServiceFormData
} from '@/types/services';
import type { DatabaseType } from '@/types/database';

// Hook imports
import { useAuth } from '@/hooks/use-auth';
import { useLoading } from '@/hooks/use-loading';
import { useNotifications } from '@/hooks/use-notifications';
import { usePaywall } from '@/hooks/use-paywall';
import { useTheme } from '@/hooks/use-theme';

// Component imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Feature-specific component imports (these would be created by other files)
import { ServiceForm } from '@/components/database-service/service-form';
import { ConnectionTest } from '@/components/database-service/connection-test';
import { PaywallModal } from '@/components/ui/paywall-modal';

// API client
import { apiClient } from '@/lib/api-client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Service form validation schema using Zod
 * Provides real-time validation under 100ms per integration requirements
 */
const serviceFormSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(50, 'Service name must be 50 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Service name must start with a letter and contain only letters, numbers, and underscores'),
  label: z.string().min(1, 'Service label is required'),
  description: z.string().optional(),
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake']),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).default({})
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// ============================================================================
// API FETCHERS FOR SWR
// ============================================================================

/**
 * Fetches service details from the API
 */
const fetchService = async (serviceId: string): Promise<Service> => {
  const response = await apiClient.get(`/system/service/${serviceId}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch service');
  }
  return response.data;
};

/**
 * Fetches service types and configuration schemas
 */
const fetchServiceTypes = async () => {
  const response = await apiClient.get('/system/service_type');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch service types');
  }
  return response.data;
};

/**
 * Tests database connection
 */
const testConnection = async (serviceId: string, config: ServiceConfiguration): Promise<ServiceTestResult> => {
  const response = await apiClient.post(`/system/service/${serviceId}/_test`, { config });
  return {
    success: response.success,
    connectionTime: response.execution_time || 0,
    message: response.success ? 'Connection successful' : 'Connection failed',
    details: response.data,
    error: response.success ? undefined : response.error
  };
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ServiceDetailsPage() {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================
  
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = params.service as string;
  const isNewService = serviceId === 'create';
  
  // Authentication and permissions
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotifications();
  const { isLoading, setLoading } = useLoading();
  const { checkFeatureAccess, showPaywall } = usePaywall();
  const { theme } = useTheme();

  // Component state
  const [activeTab, setActiveTab] = useState('configuration');
  const [isEditing, setIsEditing] = useState(isNewService);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ServiceTestResult | null>(null);

  // ============================================================================
  // DATA FETCHING WITH SWR
  // ============================================================================

  // Fetch service details (skip if creating new service)
  const { 
    data: service, 
    error: serviceError, 
    isLoading: isServiceLoading,
    mutate: mutateService 
  } = useSWR(
    isNewService ? null : ['service', serviceId],
    () => fetchService(serviceId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000
    }
  );

  // Fetch service types for form configuration
  const { 
    data: serviceTypes, 
    error: serviceTypesError,
    isLoading: isServiceTypesLoading 
  } = useSWR(
    'service-types',
    fetchServiceTypes,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // ============================================================================
  // FORM SETUP
  // ============================================================================

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      label: '',
      description: '',
      type: 'mysql' as ServiceType,
      isActive: true,
      config: {}
    },
    mode: 'onChange' // Real-time validation
  });

  const { handleSubmit, reset, watch, formState: { errors, isDirty, isValid } } = form;
  const watchedType = watch('type');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Redirect to login if not authenticated
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  /**
   * Initialize form with service data when editing
   */
  useEffect(() => {
    if (service && !isNewService) {
      reset({
        name: service.name,
        label: service.label,
        description: service.description || '',
        type: service.type as ServiceType,
        isActive: service.isActive,
        config: service.config || {}
      });
    }
  }, [service, isNewService, reset]);

  /**
   * Handle URL parameters for tab switching
   */
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['configuration', 'connection', 'security', 'documentation'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles form submission for service creation/update
   */
  const onSubmit = useCallback(async (data: ServiceFormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        id: isNewService ? undefined : parseInt(serviceId)
      };

      const endpoint = isNewService 
        ? '/system/service'
        : `/system/service/${serviceId}`;
      
      const method = isNewService ? 'post' : 'put';
      const response = await apiClient[method](endpoint, payload);

      if (response.success) {
        showNotification({
          type: 'success',
          message: `Service ${isNewService ? 'created' : 'updated'} successfully`,
          duration: 5000
        });

        // Update cache and navigate
        if (isNewService) {
          const newServiceId = response.data.id;
          router.push(`/api-connections/database/${newServiceId}`);
        } else {
          await mutateService();
          setIsEditing(false);
        }
      } else {
        throw new Error(response.error?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Service save error:', error);
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save service',
        duration: 7000
      });
    } finally {
      setLoading(false);
    }
  }, [isNewService, serviceId, setLoading, showNotification, router, mutateService]);

  /**
   * Handles connection testing with SWR mutation
   */
  const handleConnectionTest = useCallback(async () => {
    const formData = form.getValues();
    
    try {
      setLoading(true);
      const result = await testConnection(serviceId, formData.config);
      setLastTestResult(result);
      
      showNotification({
        type: result.success ? 'success' : 'error',
        message: result.message,
        duration: 5000
      });
      
      return result;
    } catch (error) {
      const errorResult: ServiceTestResult = {
        success: false,
        connectionTime: 0,
        message: 'Connection test failed',
        error: {
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      setLastTestResult(errorResult);
      showNotification({
        type: 'error',
        message: errorResult.message,
        duration: 7000
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [form, serviceId, setLoading, showNotification]);

  /**
   * Handles navigation to schema browser
   */
  const handleViewSchema = useCallback(async () => {
    // Check if premium feature requires paywall
    const hasAccess = await checkFeatureAccess('schema_browser');
    
    if (!hasAccess) {
      setShowPaywallModal(true);
      return;
    }

    router.push(`/api-connections/database/${serviceId}/schema`);
  }, [serviceId, router, checkFeatureAccess]);

  /**
   * Handles navigation to API generation
   */
  const handleGenerateAPI = useCallback(async () => {
    // Check if premium feature requires paywall
    const hasAccess = await checkFeatureAccess('api_generation');
    
    if (!hasAccess) {
      setShowPaywallModal(true);
      return;
    }

    router.push(`/api-connections/database/${serviceId}/generate`);
  }, [serviceId, router, checkFeatureAccess]);

  /**
   * Handles navigation to API documentation
   */
  const handleViewAPIDocs = useCallback(() => {
    router.push(`/api-connections/database/${serviceId}/docs`);
  }, [serviceId, router]);

  /**
   * Handles service deletion
   */
  const handleDeleteService = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete(`/system/service/${serviceId}`);
      
      if (response.success) {
        showNotification({
          type: 'success',
          message: 'Service deleted successfully',
          duration: 5000
        });
        router.push('/api-connections/database');
      } else {
        throw new Error(response.error?.message || 'Failed to delete service');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete service',
        duration: 7000
      });
    } finally {
      setLoading(false);
    }
  }, [serviceId, setLoading, showNotification, router]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const isDataLoading = isServiceLoading || isServiceTypesLoading;
  const hasError = serviceError || serviceTypesError;
  const canEdit = service?.mutable !== false;
  const canDelete = service?.deletable !== false;
  const isValidForTesting = isValid && !isNewService;

  // Get current service type configuration
  const currentServiceType = useMemo(() => {
    if (!serviceTypes) return null;
    return serviceTypes.find((type: any) => type.name === watchedType);
  }, [serviceTypes, watchedType]);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load service details. Please try again later.
            {serviceError && ` Error: ${serviceError.message}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isNewService && service === null && !isDataLoading) {
    notFound();
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isDataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isNewService ? 'Create Database Service' : service?.label || service?.name}
            </h1>
            {!isNewService && (
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={service?.isActive ? 'default' : 'secondary'}>
                  {service?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{service?.type}</Badge>
                {service?.healthStatus && (
                  <Badge 
                    variant={
                      service.healthStatus.status === 'healthy' ? 'success' : 
                      service.healthStatus.status === 'degraded' ? 'warning' : 'destructive'
                    }
                  >
                    {service.healthStatus.status}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isNewService && (
          <div className="flex items-center space-x-2">
            {!isEditing && canEdit && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <CogIcon className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
            
            {isValidForTesting && (
              <Button
                variant="outline"
                onClick={handleConnectionTest}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Test Connection</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleViewSchema}
              className="flex items-center space-x-2"
            >
              <BookOpenIcon className="h-4 w-4" />
              <span>View Schema</span>
            </Button>

            <Button
              onClick={handleGenerateAPI}
              className="flex items-center space-x-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Generate API</span>
            </Button>

            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDeleteService}
                disabled={isLoading}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {isNewService ? 'Service Configuration' : 'Service Details'}
              </CardTitle>
              <CardDescription>
                {isNewService 
                  ? 'Configure your database connection settings and generate REST APIs in under 5 minutes.'
                  : 'Manage your database service configuration and connection settings.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Service Configuration Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="configuration">Configuration</TabsTrigger>
                      <TabsTrigger value="connection" disabled={isNewService}>Connection</TabsTrigger>
                      <TabsTrigger value="security" disabled={isNewService}>Security</TabsTrigger>
                      <TabsTrigger value="documentation" disabled={isNewService}>Documentation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="configuration" className="mt-6">
                      <ServiceForm
                        serviceTypes={serviceTypes || []}
                        isEditing={isEditing}
                        isNew={isNewService}
                        currentServiceType={currentServiceType}
                      />
                    </TabsContent>

                    <TabsContent value="connection" className="mt-6">
                      <ConnectionTest
                        serviceId={serviceId}
                        config={watch('config')}
                        serviceType={watchedType}
                        onTestComplete={setLastTestResult}
                        lastResult={lastTestResult}
                      />
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          Security configuration will be available after service creation.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="documentation" className="mt-6">
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          API documentation will be generated after service creation.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleViewAPIDocs}
                          className="mt-4"
                        >
                          View API Documentation
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Form Actions */}
                  {(isEditing || isNewService) && (
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      {!isNewService && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            reset();
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      
                      <Button
                        type="submit"
                        disabled={!isDirty || !isValid || isLoading}
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        {isNewService ? 'Create Service' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {!isNewService && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewSchema}
                  className="w-full justify-start"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Browse Schema
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAPI}
                  className="w-full justify-start"
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Generate APIs
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAPIDocs}
                  className="w-full justify-start"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Service Info */}
          {service && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(service.createdDate).toLocaleDateString()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Modified
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(service.lastModifiedDate).toLocaleDateString()}
                  </dd>
                </div>
                
                {service.version && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Version
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {service.version}
                    </dd>
                  </div>
                )}
                
                {lastTestResult && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Test
                    </dt>
                    <dd className="text-sm">
                      <Badge variant={lastTestResult.success ? 'success' : 'destructive'}>
                        {lastTestResult.success ? 'Success' : 'Failed'}
                      </Badge>
                      {lastTestResult.connectionTime > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          ({lastTestResult.connectionTime}ms)
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help & Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">Need help setting up your database service?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your database connection settings</li>
                  <li>• Verify firewall and network access</li>
                  <li>• Ensure proper user permissions</li>
                  <li>• Review SSL/TLS configuration</li>
                </ul>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywallModal && (
        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          feature="Advanced Database Features"
          description="Access schema browsing, API generation, and advanced database management features."
        />
      )}
    </div>
  );
}