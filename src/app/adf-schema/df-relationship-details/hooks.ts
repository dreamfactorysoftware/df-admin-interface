'use client';

/**
 * Custom React hooks for relationship management business logic including data fetching, form state management, 
 * and API integration. Encapsulates complex relationship logic with proper error handling and loading states 
 * using TanStack React Query patterns.
 * 
 * Key features:
 * - TanStack React Query 5.79.2 for complex server-state management per Section 3.2.4 HTTP client data fetching
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements performance standards
 * - Intelligent caching with deduplication and SSR support per Section 3.2.2 server state management
 * - Background refetching and automatic cache invalidation per Section 3.2.4 HTTP client integration patterns
 * - Transform Angular service dependencies to React hooks pattern per Section 4.7.1.2 Angular to React component migration
 * - Replace RxJS observables with TanStack React Query for server state management per Section 3.2.2 state management architecture
 * - Convert Angular HTTP interceptors logic to React Query error handling per Section 4.7.1.2 interceptor migration architecture
 * - Implement intelligent caching with background synchronization per Section 3.2.4 HTTP client integration patterns
 * - Migrate Angular dependency injection to React hooks composition per React/Next.js Integration Requirements
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions 
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Core API and utility types
interface GenericListResponse<T> {
  resource: Array<T>;
  meta: {
    count: number;
  };
}

interface GenericSuccessResponse {
  success: boolean;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  context?: any;
  retryable?: boolean;
}

// Relationship management types
interface TableField {
  id: string;
  name: string;
  alias?: string;
  label?: string;
  type: string;
  dbType?: string;
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  allowNull?: boolean;
  autoIncrement?: boolean;
  isIndex?: boolean;
  isUnique?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  isVirtual?: boolean;
  isAggregate?: boolean;
}

interface TableRelationship {
  id?: string;
  name: string;
  alias?: string;
  label?: string;
  description?: string;
  type: 'belongs_to' | 'has_one' | 'has_many' | 'many_to_many';
  refServiceId?: string;
  refTable?: string;
  refField?: string;
  field?: string;
  alwaysFetch?: boolean;
  isVirtual?: boolean;
  junctionServiceId?: string;
  junctionTable?: string;
  junctionLeftField?: string;
  junctionRightField?: string;
}

interface DatabaseService {
  id: string;
  name: string;
  label?: string;
  description?: string;
  type: string;
  isActive?: boolean;
}

interface TableMetadata {
  id: string;
  name: string;
  label?: string;
  description?: string;
  fields?: TableField[];
  relationships?: TableRelationship[];
}

// Request options interface
interface RequestOptions {
  showSpinner?: boolean;
  filter?: string;
  sort?: string;
  fields?: string;
  related?: string;
  limit?: number;
  offset?: number;
  includeCount?: boolean;
  refresh?: boolean;
  snackbarSuccess?: string;
  snackbarError?: string;
}

// Temporary API client interface - will be replaced by actual api-client when available
interface ApiClient {
  get: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
  post: <T>(endpoint: string, data: any, options?: RequestOptions) => Promise<T>;
  put: <T>(endpoint: string, data: any, options?: RequestOptions) => Promise<T>;
  patch: <T>(endpoint: string, data: any, options?: RequestOptions) => Promise<T>;
  delete: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
}

// Mock API client - will be replaced by actual implementation
const mockApiClient: ApiClient = {
  get: async <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    // Temporary implementation - will be replaced by actual API client
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },
  
  post: async <T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },
  
  put: async <T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> => {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },
  
  patch: async <T>(endpoint: string, data: any, options?: RequestOptions): Promise<T> => {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },
  
  delete: async <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },
};

/**
 * Hook for fetching database services for relationship reference selection
 * Implements intelligent caching with background synchronization per Section 3.2.4
 */
export function useRelationshipServices(
  options: RequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<GenericListResponse<DatabaseService>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GenericListResponse<DatabaseService>>({
    queryKey: ['relationship-services'],
    queryFn: async () => {
      return mockApiClient.get<GenericListResponse<DatabaseService>>('/system/service', {
        filter: 'type=mysql,postgresql,sqlsrv,oracle,sqlite,mongodb',
        includeCount: true,
        ...options,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - cache hit responses under 50ms requirement
    gcTime: 10 * 60 * 1000, // 10 minutes for garbage collection
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
}

/**
 * Hook for fetching tables for a specific database service
 * Implements background refetching and automatic cache invalidation per Section 3.2.4
 */
export function useRelationshipTables(
  serviceId: string | null,
  options: RequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<GenericListResponse<TableMetadata>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GenericListResponse<TableMetadata>>({
    queryKey: ['relationship-tables', serviceId],
    queryFn: async () => {
      if (!serviceId) {
        return { resource: [], meta: { count: 0 } };
      }
      
      return mockApiClient.get<GenericListResponse<TableMetadata>>(`/${serviceId}/_schema`, {
        includeCount: true,
        ...options,
      });
    },
    enabled: Boolean(serviceId),
    staleTime: 5 * 60 * 1000, // 5 minutes for intelligent caching
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

/**
 * Hook for fetching fields for a specific table in a database service
 * Provides deduplication and SSR support per Section 3.2.2 server state management
 */
export function useRelationshipTableFields(
  serviceId: string | null,
  tableName: string | null,
  options: RequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<GenericListResponse<TableField>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GenericListResponse<TableField>>({
    queryKey: ['relationship-table-fields', serviceId, tableName],
    queryFn: async () => {
      if (!serviceId || !tableName) {
        return { resource: [], meta: { count: 0 } };
      }
      
      return mockApiClient.get<GenericListResponse<TableField>>(`/${serviceId}/_schema/${tableName}/_field`, {
        includeCount: true,
        ...options,
      });
    },
    enabled: Boolean(serviceId && tableName),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

/**
 * Hook for fetching existing relationships for a table
 * Implements intelligent caching with background synchronization per Section 3.2.4
 */
export function useTableRelationships(
  dbName: string,
  tableName: string,
  options: RequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<GenericListResponse<TableRelationship>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GenericListResponse<TableRelationship>>({
    queryKey: ['table-relationships', dbName, tableName],
    queryFn: async () => {
      return mockApiClient.get<GenericListResponse<TableRelationship>>(`/${dbName}/_schema/${tableName}/_related`, {
        includeCount: true,
        ...options,
      });
    },
    enabled: Boolean(dbName && tableName),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

/**
 * Hook for fetching a specific relationship for editing
 * Converts Angular HTTP interceptors logic to React Query error handling per Section 4.7.1.2
 */
export function useRelationshipDetails(
  dbName: string,
  tableName: string,
  relationshipName: string,
  options: RequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<TableRelationship>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TableRelationship>({
    queryKey: ['relationship-details', dbName, tableName, relationshipName],
    queryFn: async () => {
      return mockApiClient.get<TableRelationship>(`/${dbName}/_schema/${tableName}/_related/${relationshipName}`, {
        refresh: true,
        ...options,
      });
    },
    enabled: Boolean(dbName && tableName && relationshipName),
    staleTime: 2 * 60 * 1000, // 2 minutes for detail views
    gcTime: 5 * 60 * 1000,
    retry: 3,
    ...queryOptions,
  });
}

/**
 * Hook for creating new relationships
 * Replaces RxJS observables with TanStack React Query per Section 3.2.2 state management architecture
 */
export function useCreateRelationship(
  dbName: string,
  tableName: string,
  options: RequestOptions = {},
  mutationOptions?: Omit<UseMutationOptions<GenericSuccessResponse, ApiError, TableRelationship>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation<GenericSuccessResponse, ApiError, TableRelationship>({
    mutationFn: async (relationshipData: TableRelationship) => {
      return mockApiClient.post<GenericSuccessResponse>(
        `/${dbName}/_schema/${tableName}/_related`,
        relationshipData,
        {
          snackbarSuccess: 'Relationship created successfully',
          snackbarError: 'Failed to create relationship',
          ...options,
        }
      );
    },
    onSuccess: () => {
      // Automatic cache invalidation per Section 3.2.4 HTTP client integration patterns
      queryClient.invalidateQueries({ 
        queryKey: ['table-relationships', dbName, tableName] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['relationship-services'] 
      });
    },
    onError: (error: ApiError) => {
      // Enhanced error handling per Section 4.7.1.2 interceptor migration architecture
      console.error('Failed to create relationship:', error);
    },
    ...mutationOptions,
  });
}

/**
 * Hook for updating existing relationships
 * Implements optimistic updates with rollback capabilities
 */
export function useUpdateRelationship(
  dbName: string,
  tableName: string,
  relationshipName: string,
  options: RequestOptions = {},
  mutationOptions?: Omit<UseMutationOptions<GenericSuccessResponse, ApiError, Partial<TableRelationship>>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation<GenericSuccessResponse, ApiError, Partial<TableRelationship>>({
    mutationFn: async (relationshipData: Partial<TableRelationship>) => {
      return mockApiClient.patch<GenericSuccessResponse>(
        `/${dbName}/_schema/${tableName}/_related/${relationshipName}`,
        relationshipData,
        {
          snackbarSuccess: 'Relationship updated successfully',
          snackbarError: 'Failed to update relationship',
          ...options,
        }
      );
    },
    onMutate: async (newRelationshipData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ 
        queryKey: ['relationship-details', dbName, tableName, relationshipName] 
      });

      // Snapshot the previous value
      const previousRelationship = queryClient.getQueryData<TableRelationship>([
        'relationship-details', 
        dbName, 
        tableName, 
        relationshipName
      ]);

      // Optimistically update to the new value
      if (previousRelationship) {
        queryClient.setQueryData<TableRelationship>(
          ['relationship-details', dbName, tableName, relationshipName],
          { ...previousRelationship, ...newRelationshipData }
        );
      }

      // Return a context object with the snapshotted value
      return { previousRelationship };
    },
    onError: (err, newRelationshipData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRelationship) {
        queryClient.setQueryData(
          ['relationship-details', dbName, tableName, relationshipName],
          context.previousRelationship
        );
      }
      console.error('Failed to update relationship:', err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ 
        queryKey: ['relationship-details', dbName, tableName, relationshipName] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['table-relationships', dbName, tableName] 
      });
    },
    ...mutationOptions,
  });
}

/**
 * Hook for deleting relationships
 * Implements background refetching and automatic cache invalidation per Section 3.2.4
 */
export function useDeleteRelationship(
  dbName: string,
  tableName: string,
  options: RequestOptions = {},
  mutationOptions?: Omit<UseMutationOptions<GenericSuccessResponse, ApiError, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation<GenericSuccessResponse, ApiError, string>({
    mutationFn: async (relationshipName: string) => {
      return mockApiClient.delete<GenericSuccessResponse>(
        `/${dbName}/_schema/${tableName}/_related/${relationshipName}`,
        {
          snackbarSuccess: 'Relationship deleted successfully',
          snackbarError: 'Failed to delete relationship',
          ...options,
        }
      );
    },
    onSuccess: () => {
      // Automatic cache invalidation per Section 3.2.4 HTTP client integration patterns
      queryClient.invalidateQueries({ 
        queryKey: ['table-relationships', dbName, tableName] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['relationship-services'] 
      });
    },
    onError: (error: ApiError) => {
      console.error('Failed to delete relationship:', error);
    },
    ...mutationOptions,
  });
}

/**
 * Composite hook for relationship form management
 * Transforms Angular service dependencies to React hooks pattern per Section 4.7.1.2
 */
export function useRelationshipForm(dbName: string, tableName: string, relationshipName?: string) {
  const queryClient = useQueryClient();

  // Data fetching hooks
  const servicesQuery = useRelationshipServices();
  const relationshipQuery = useRelationshipDetails(
    dbName,
    tableName,
    relationshipName || '',
    {},
    { enabled: Boolean(relationshipName) }
  );

  // Mutation hooks
  const createMutation = useCreateRelationship(dbName, tableName);
  const updateMutation = useUpdateRelationship(dbName, tableName, relationshipName || '');

  // Computed state
  const isLoading = useMemo(() => {
    return servicesQuery.isLoading || 
           (relationshipName ? relationshipQuery.isLoading : false) ||
           createMutation.isPending ||
           updateMutation.isPending;
  }, [servicesQuery.isLoading, relationshipQuery.isLoading, createMutation.isPending, updateMutation.isPending, relationshipName]);

  const error = useMemo(() => {
    return servicesQuery.error || 
           relationshipQuery.error || 
           createMutation.error || 
           updateMutation.error;
  }, [servicesQuery.error, relationshipQuery.error, createMutation.error, updateMutation.error]);

  // Form submission handler
  const handleSubmit = useCallback(async (relationshipData: TableRelationship) => {
    try {
      if (relationshipName) {
        await updateMutation.mutateAsync(relationshipData);
      } else {
        await createMutation.mutateAsync(relationshipData);
      }
      return true;
    } catch (error) {
      console.error('Form submission failed:', error);
      return false;
    }
  }, [relationshipName, updateMutation, createMutation]);

  // Cache invalidation helper
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['table-relationships', dbName, tableName] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['relationship-services'] 
    });
  }, [queryClient, dbName, tableName]);

  return {
    // Data
    services: servicesQuery.data?.resource || [],
    relationship: relationshipQuery.data,
    
    // State
    isLoading,
    error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    
    // Actions
    handleSubmit,
    invalidateCache,
    
    // Raw queries for advanced usage
    servicesQuery,
    relationshipQuery,
    createMutation,
    updateMutation,
  };
}

/**
 * Hook for relationship field options management
 * Migrates Angular dependency injection to React hooks composition per React/Next.js Integration Requirements
 */
export function useRelationshipFieldOptions(serviceId: string | null, tableName: string | null) {
  const tablesQuery = useRelationshipTables(serviceId);
  const fieldsQuery = useRelationshipTableFields(serviceId, tableName);

  const tableOptions = useMemo(() => {
    return tablesQuery.data?.resource.map(table => ({
      value: table.name,
      label: table.label || table.name,
      description: table.description,
    })) || [];
  }, [tablesQuery.data]);

  const fieldOptions = useMemo(() => {
    return fieldsQuery.data?.resource.map(field => ({
      value: field.name,
      label: field.label || field.name,
      type: field.type,
      isPrimaryKey: field.isPrimaryKey,
      isForeignKey: field.isForeignKey,
    })) || [];
  }, [fieldsQuery.data]);

  return {
    tableOptions,
    fieldOptions,
    isLoadingTables: tablesQuery.isLoading,
    isLoadingFields: fieldsQuery.isLoading,
    tablesError: tablesQuery.error,
    fieldsError: fieldsQuery.error,
    refetchTables: tablesQuery.refetch,
    refetchFields: fieldsQuery.refetch,
  };
}

/**
 * Export all relationship management hooks for clean imports
 * Provides centralized access to all relationship-related functionality
 */
export default {
  useRelationshipServices,
  useRelationshipTables,
  useRelationshipTableFields,
  useTableRelationships,
  useRelationshipDetails,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  useRelationshipForm,
  useRelationshipFieldOptions,
};