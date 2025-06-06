/**
 * Database Service List Container Component
 * 
 * React container component that manages the database service list page, implementing
 * paywall logic, route data handling, and service state management. Combines the
 * functionality of the Angular df-manage-services.component.ts and .html files into
 * a single React component with modern patterns and performance optimizations.
 * 
 * Features:
 * - Next.js App Router integration with dynamic routing and search params
 * - Zustand store integration for service list state management
 * - SWR configuration for real-time connection testing and caching
 * - Paywall access control functionality maintaining existing authorization patterns
 * - React Context API for component communication and shared state
 * - Comprehensive error handling and loading states
 * - Performance optimizations with React.memo and useMemo
 * 
 * Migrated from Angular df-manage-services.component.ts with enhanced React patterns:
 * - ActivatedRoute.data subscription → useSearchParams and server components
 * - Angular *ngIf template logic → React conditional rendering with early returns
 * - Angular DfSnackbarService → React notification context and state management
 * - Angular route resolver data → Next.js server components and client-side data fetching
 * - Angular OnInit lifecycle → React useEffect hooks with proper dependency arrays
 * 
 * @fileoverview Service list container with paywall, state management, and data fetching
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useTransition,
  Suspense,
  ComponentType,
} from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import useSWR from 'swr';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

// Import database service provider and context
import {
  useDatabaseServiceContext,
  useDatabaseServiceStore,
  useDatabaseServiceActions,
} from '../database-service-provider';

// Import child components
import { ServiceListTable } from './service-list-table';
import { Paywall } from '../../ui/paywall';

// Import types
import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ServiceQueryParams,
  ServiceListQueryData,
  ServiceListViewState,
  GenericListResponse,
  ApiErrorResponse,
} from './service-list-types';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

/**
 * Route data interface matching Angular resolver output
 */
interface ServiceListRouteData {
  /** Available service types for current user/license */
  serviceTypes?: DatabaseDriver[];
  
  /** System services flag from resolver */
  system?: boolean;
  
  /** Service groups filter */
  groups?: string[];
  
  /** Initial services data */
  services?: DatabaseService[];
  
  /** Response metadata */
  meta?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

/**
 * Service list container props interface
 */
interface ServiceListContainerProps {
  /** Custom CSS class name */
  className?: string;
  
  /** Initial route data (from server component) */
  initialData?: ServiceListRouteData;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Custom paywall component */
  PaywallComponent?: ComponentType<PaywallProps>;
  
  /** Custom loading component */
  LoadingComponent?: ComponentType;
  
  /** Custom error component */
  ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  
  /** Container test ID */
  testId?: string;
}

/**
 * Paywall component props
 */
interface PaywallProps {
  /** Required subscription tier */
  requiredTier?: 'basic' | 'professional' | 'enterprise';
  
  /** Feature being accessed */
  feature?: string;
  
  /** Custom message */
  message?: string;
  
  /** Show upgrade button */
  showUpgrade?: boolean;
  
  /** Upgrade action callback */
  onUpgrade?: () => void;
}

/**
 * Service list query parameters from URL
 */
interface ServiceListUrlParams {
  /** Current page number */
  page?: string;
  
  /** Page size */
  limit?: string;
  
  /** Search query */
  search?: string;
  
  /** Service type filter */
  type?: DatabaseDriver;
  
  /** Service status filter */
  status?: ServiceStatus;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  
  /** Show inactive services */
  includeInactive?: string;
  
  /** System services mode */
  system?: string;
}

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to manage URL search parameters and synchronize with store
 */
function useServiceListUrlParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  
  // Parse URL parameters
  const urlParams = useMemo<ServiceListUrlParams>(() => ({
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    search: searchParams.get('search') || undefined,
    type: searchParams.get('type') as DatabaseDriver || undefined,
    status: searchParams.get('status') as ServiceStatus || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
    includeInactive: searchParams.get('includeInactive') || undefined,
    system: searchParams.get('system') || undefined,
  }), [searchParams]);
  
  // Create query object from URL params
  const query = useMemo<Partial<ServiceListQueryData>>(() => ({
    pagination: {
      page: parseInt(urlParams.page || '1', 10),
      limit: parseInt(urlParams.limit || '20', 10),
    },
    filters: {
      search: urlParams.search,
      type: urlParams.type,
      status: urlParams.status,
      isActive: urlParams.includeInactive ? undefined : true,
    },
    sort: urlParams.sortBy ? {
      field: urlParams.sortBy as any,
      direction: urlParams.sortOrder || 'asc',
    } : undefined,
    includeInactive: urlParams.includeInactive === 'true',
    includeSystemServices: urlParams.system === 'true',
  }), [urlParams]);
  
  // Update URL parameters
  const updateUrlParams = useCallback((
    updates: Partial<ServiceListUrlParams>
  ) => {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams);
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      
      // Navigate with new parameters
      const newUrl = `${pathname}?${newParams.toString()}`;
      router.replace(newUrl);
    });
  }, [searchParams, pathname, router]);
  
  return {
    urlParams,
    query,
    updateUrlParams,
    isPending,
  };
}

/**
 * Hook to fetch service types for paywall determination
 */
function useServiceTypes() {
  return useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const response = await apiClient.get('/system/service_type');
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.resource || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch services list with SWR for real-time updates
 */
function useServicesList(query: Partial<ServiceListQueryData>) {
  // Build SWR key
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (query.pagination?.page) {
      params.set('page', query.pagination.page.toString());
    }
    if (query.pagination?.limit) {
      params.set('limit', query.pagination.limit.toString());
    }
    
    // Add filters
    if (query.filters?.search) {
      params.set('filter', `name like '${query.filters.search}%'`);
    }
    if (query.filters?.type) {
      params.set('type', query.filters.type);
    }
    if (query.filters?.status) {
      params.set('status', query.filters.status);
    }
    if (query.filters?.isActive !== undefined) {
      params.set('is_active', query.filters.isActive.toString());
    }
    
    // Add sorting
    if (query.sort?.field) {
      params.set('order', `${query.sort.field} ${query.sort.direction || 'asc'}`);
    }
    
    // Add system flag
    if (query.includeSystemServices === false) {
      params.set('system', 'false');
    }
    
    return `/system/service?${params.toString()}`;
  }, [query]);
  
  return useSWR<GenericListResponse<DatabaseService>>(
    swrKey,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnInterval: 30000, // 30 seconds
      dedupingInterval: 2000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      keepPreviousData: true,
    }
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Service List Container Component
 * 
 * Main container component that orchestrates service list functionality including
 * paywall logic, data fetching, state management, and child component coordination.
 */
export function ServiceListContainer({
  className,
  initialData,
  debug = false,
  PaywallComponent = Paywall,
  LoadingComponent,
  ErrorComponent,
  testId = 'service-list-container',
}: ServiceListContainerProps) {
  // Authentication and authorization
  const { user, isAuthenticated, permissions } = useAuth();
  
  // Database service context and store
  const databaseServiceContext = useDatabaseServiceContext();
  const store = useDatabaseServiceStore();
  const actions = useDatabaseServiceActions();
  
  // URL parameter management
  const { urlParams, query, updateUrlParams, isPending } = useServiceListUrlParams();
  
  // Router hooks
  const router = useRouter();
  const pathname = usePathname();
  
  // Local state
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Data fetching hooks
  const {
    data: serviceTypes,
    isLoading: serviceTypesLoading,
    error: serviceTypesError,
    refetch: refetchServiceTypes,
  } = useServiceTypes();
  
  const {
    data: servicesResponse,
    isLoading: servicesLoading,
    error: servicesError,
    mutate: mutateServices,
  } = useServicesList(query);
  
  // Compute paywall status based on service types availability
  const paywall = useMemo(() => {
    if (serviceTypesLoading || !isAuthenticated) {
      return false; // Don't show paywall while loading or not authenticated
    }
    
    if (serviceTypesError) {
      console.warn('Error loading service types:', serviceTypesError);
      return false; // Don't show paywall on error
    }
    
    // Show paywall if no service types are available (empty array)
    return Array.isArray(serviceTypes) && serviceTypes.length === 0;
  }, [serviceTypes, serviceTypesLoading, serviceTypesError, isAuthenticated]);
  
  // Compute loading state
  const isLoading = useMemo(() => {
    return serviceTypesLoading || servicesLoading || !isInitialized;
  }, [serviceTypesLoading, servicesLoading, isInitialized]);
  
  // Compute combined error state
  const combinedError = useMemo(() => {
    return error || serviceTypesError || servicesError || null;
  }, [error, serviceTypesError, servicesError]);
  
  // Extract services data
  const services = useMemo(() => {
    return servicesResponse?.resource || [];
  }, [servicesResponse]);
  
  // Extract pagination metadata
  const pagination = useMemo(() => {
    const meta = servicesResponse?.meta;
    return {
      currentPage: query.pagination?.page || 1,
      totalPages: Math.ceil((meta?.total || 0) / (query.pagination?.limit || 20)),
      totalItems: meta?.total || 0,
      pageSize: query.pagination?.limit || 20,
      hasNextPage: (query.pagination?.page || 1) < Math.ceil((meta?.total || 0) / (query.pagination?.limit || 20)),
      hasPreviousPage: (query.pagination?.page || 1) > 1,
    };
  }, [servicesResponse, query.pagination]);
  
  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('ServiceListContainer state:', {
        urlParams,
        query,
        paywall,
        isLoading,
        servicesCount: services.length,
        serviceTypesCount: serviceTypes?.length || 0,
        pagination,
        error: combinedError,
      });
    }
  }, [debug, urlParams, query, paywall, isLoading, services.length, serviceTypes?.length, pagination, combinedError]);
  
  // Initialize component and sync with store
  useEffect(() => {
    if (!isInitialized) {
      // Clear any existing snackbar messages (migrated from Angular DfSnackbarService)
      toast.dismiss();
      
      // Update store with initial data if available
      if (initialData?.services) {
        store.setServices(initialData.services, {
          total: initialData.meta?.total || initialData.services.length,
          pages: initialData.meta?.pages || 1,
        });
      }
      
      // Update store with current query parameters
      store.updateQueryParams(query.pagination || {});
      
      setIsInitialized(true);
    }
  }, [isInitialized, initialData, store, query.pagination]);
  
  // Sync URL parameters with store when they change
  useEffect(() => {
    if (isInitialized) {
      // Update store query parameters
      if (query.pagination) {
        store.setPage(query.pagination.page);
        store.setPageSize(query.pagination.limit);
      }
      
      if (query.filters?.search !== undefined) {
        store.setSearch(query.filters.search);
      }
      
      if (query.filters?.type !== undefined) {
        store.setTypeFilter(query.filters.type);
      }
      
      if (query.filters?.status !== undefined) {
        store.setStatusFilter(query.filters.status);
      }
      
      if (query.sort) {
        store.setSorting(query.sort.field, query.sort.direction);
      }
      
      if (query.includeInactive !== undefined) {
        store.setShowInactive(query.includeInactive);
      }
    }
  }, [isInitialized, query, store]);
  
  // Sync services data with store
  useEffect(() => {
    if (services.length > 0 || servicesResponse) {
      store.setServices(services, {
        total: servicesResponse?.meta?.total || services.length,
        pages: servicesResponse?.meta?.pages || 1,
      });
      store.setLoading(false);
      store.clearError();
    }
  }, [services, servicesResponse, store]);
  
  // Handle loading and error states in store
  useEffect(() => {
    store.setLoading(isLoading);
  }, [isLoading, store]);
  
  useEffect(() => {
    if (combinedError) {
      store.setError(combinedError.message);
    } else {
      store.clearError();
    }
  }, [combinedError, store]);
  
  // Error handling callback
  const handleError = useCallback((error: Error) => {
    console.error('ServiceListContainer error:', error);
    setError(error);
    toast.error(error.message || 'An unexpected error occurred');
  }, []);
  
  // Retry callback for error recovery
  const handleRetry = useCallback(() => {
    setError(null);
    refetchServiceTypes();
    mutateServices();
  }, [refetchServiceTypes, mutateServices]);
  
  // Query parameter update handlers
  const handleQueryChange = useCallback((updates: Partial<ServiceListQueryData>) => {
    const urlUpdates: Partial<ServiceListUrlParams> = {};
    
    // Handle pagination updates
    if (updates.pagination) {
      if (updates.pagination.page !== undefined) {
        urlUpdates.page = updates.pagination.page.toString();
      }
      if (updates.pagination.limit !== undefined) {
        urlUpdates.limit = updates.pagination.limit.toString();
      }
    }
    
    // Handle filter updates
    if (updates.filters) {
      if (updates.filters.search !== undefined) {
        urlUpdates.search = updates.filters.search || undefined;
      }
      if (updates.filters.type !== undefined) {
        urlUpdates.type = updates.filters.type || undefined;
      }
      if (updates.filters.status !== undefined) {
        urlUpdates.status = updates.filters.status || undefined;
      }
      if (updates.filters.isActive !== undefined) {
        urlUpdates.includeInactive = updates.filters.isActive ? undefined : 'true';
      }
    }
    
    // Handle sort updates
    if (updates.sort) {
      urlUpdates.sortBy = updates.sort.field;
      urlUpdates.sortOrder = updates.sort.direction;
    }
    
    // Handle system flag updates
    if (updates.includeSystemServices !== undefined) {
      urlUpdates.system = updates.includeSystemServices ? 'true' : undefined;
    }
    
    updateUrlParams(urlUpdates);
  }, [updateUrlParams]);
  
  // Service action handlers
  const handleServiceCreate = useCallback(() => {
    router.push(`${pathname}/create`);
  }, [router, pathname]);
  
  const handleServiceEdit = useCallback((service: DatabaseService) => {
    router.push(`${pathname}/${service.id}`);
  }, [router, pathname]);
  
  const handleServiceDelete = useCallback(async (service: DatabaseService) => {
    try {
      await actions.deleteService(service.id);
      toast.success(`Service "${service.name}" deleted successfully`);
      mutateServices(); // Refresh the list
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to delete service'));
    }
  }, [actions, mutateServices, handleError]);
  
  const handleServiceTest = useCallback(async (service: DatabaseService) => {
    try {
      const testResult = await actions.testConnection({
        type: service.type,
        host: service.host,
        port: service.port,
        database: service.database,
        username: service.username,
        password: service.password,
      } as any);
      
      if (testResult.success) {
        toast.success(`Connection to "${service.name}" successful`);
      } else {
        toast.error(`Connection to "${service.name}" failed: ${testResult.message}`);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to test connection'));
    }
  }, [actions, handleError]);
  
  const handleRefresh = useCallback(() => {
    actions.refreshServices();
    mutateServices();
  }, [actions, mutateServices]);
  
  // Paywall action handlers
  const handlePaywallUpgrade = useCallback(() => {
    // Navigate to upgrade page or open external link
    window.open('/upgrade', '_blank');
  }, []);
  
  // Render loading state
  if (isLoading && !servicesResponse) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8',
          className
        )}
        data-testid={`${testId}-loading`}
      >
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          <span className="text-sm text-gray-600">Loading services...</span>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (combinedError && !servicesResponse) {
    if (ErrorComponent) {
      return <ErrorComponent error={combinedError} retry={handleRetry} />;
    }
    
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
        data-testid={`${testId}-error`}
      >
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Services</h3>
        <p className="text-sm text-gray-600 mb-4">{combinedError.message}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Render paywall if no service types are available
  if (paywall) {
    return (
      <div
        className={cn('w-full', className)}
        data-testid={`${testId}-paywall`}
      >
        <PaywallComponent
          requiredTier="professional"
          feature="Database Service Management"
          message="Database service management requires a Professional or Enterprise subscription."
          showUpgrade
          onUpgrade={handlePaywallUpgrade}
        />
      </div>
    );
  }
  
  // Render main service list interface
  return (
    <div
      className={cn('w-full space-y-4', className)}
      data-testid={testId}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        }
      >
        <ServiceListTable
          services={services}
          loading={isLoading}
          error={combinedError?.message || null}
          pagination={pagination}
          query={query}
          onQueryChange={handleQueryChange}
          onServiceCreate={handleServiceCreate}
          onServiceEdit={handleServiceEdit}
          onServiceDelete={handleServiceDelete}
          onServiceTest={handleServiceTest}
          onRefresh={handleRefresh}
          className="w-full"
          testId={`${testId}-table`}
        />
      </Suspense>
    </div>
  );
}

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

/**
 * Memoized Service List Container Component
 * 
 * Performance-optimized version that prevents unnecessary re-renders when props
 * haven't changed, maintaining the same interface and functionality.
 */
export const MemoizedServiceListContainer = React.memo(ServiceListContainer);

// Set display name for debugging
ServiceListContainer.displayName = 'ServiceListContainer';
MemoizedServiceListContainer.displayName = 'MemoizedServiceListContainer';

// Default export
export default ServiceListContainer;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  ServiceListContainerProps,
  ServiceListRouteData,
  ServiceListUrlParams,
  PaywallProps,
};