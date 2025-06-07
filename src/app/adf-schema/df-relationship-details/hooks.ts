'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../../hooks/use-notifications';
import { useErrorHandler } from '../../../hooks/use-error-handler';
import type { 
  ApiListResponse, 
  ApiSuccessResponse,
  ApiErrorResponse 
} from '../../../types/api';
import type { DatabaseService } from '../../../types/database';
import type { SchemaTable, SchemaField, TableRelated } from '../../../types/schema';

// ============================================================================
// RELATIONSHIP MANAGEMENT TYPE DEFINITIONS
// ============================================================================

/**
 * Relationship form data structure
 * Maps directly to DreamFactory relationship API format
 */
export interface RelationshipFormData {
  name?: string;
  alias: string;
  label: string;
  description?: string;
  alwaysFetch: boolean;
  type: RelationshipType;
  isVirtual: boolean;
  field: string;
  refServiceId: number;
  refTable: string;
  refField: string;
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
}

/**
 * Relationship types supported by DreamFactory
 */
export type RelationshipType = 'belongs_to' | 'has_many' | 'has_one' | 'many_many';

/**
 * Option interface for form dropdowns
 */
export interface SelectOption {
  label: string;
  value: string | number;
  name?: string;
}

/**
 * Relationship API operations context
 */
export interface RelationshipOperationContext {
  serviceName: string;
  tableName: string;
  relationshipId?: string;
}

// ============================================================================
// SERVICE DATA FETCHING HOOKS
// ============================================================================

/**
 * Hook for fetching database services for relationship configuration
 * Provides caching and background refetching for service dropdown options
 * 
 * @param options - TanStack React Query options for customizing cache behavior
 * @returns Query result with service options for dropdowns
 */
export function useDatabaseServices(options?: {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: ['database-services'],
    queryFn: async (): Promise<SelectOption[]> => {
      const response = await fetch('/api/v2/system/service?type=sql_db,nosql_db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, private',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch database services');
      }

      const data: ApiListResponse<DatabaseService> = await response.json();
      
      return data.resource.map((service) => ({
        label: service.label || service.name,
        value: service.id,
        name: service.name,
      }));
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    cacheTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to load database services',
        description: 'Unable to fetch available database services for relationship configuration.',
      });
    },
  });
}

/**
 * Hook for fetching table fields for a specific table
 * Used to populate field dropdown options in relationship forms
 * 
 * @param tableName - Name of the table to fetch fields for
 * @param serviceName - Name of the database service
 * @param options - Query configuration options
 * @returns Query result with field options for dropdowns
 */
export function useTableFields(
  tableName: string,
  serviceName: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: ['table-fields', serviceName, tableName],
    queryFn: async (): Promise<SelectOption[]> => {
      if (!tableName || !serviceName) {
        return [];
      }

      const response = await fetch(`/api/v2/${serviceName}/_schema/${tableName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, private',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch fields for table ${tableName}`);
      }

      const data: { field: SchemaField[] } = await response.json();
      
      return data.field.map((field) => ({
        label: field.label || field.name,
        value: field.name,
      }));
    },
    enabled: (options?.enabled ?? true) && !!tableName && !!serviceName,
    staleTime: options?.staleTime ?? 15 * 60 * 1000, // 15 minutes
    cacheTime: options?.cacheTime ?? 30 * 60 * 1000, // 30 minutes
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to load table fields',
        description: `Unable to fetch fields for table ${tableName}.`,
      });
    },
  });
}

/**
 * Hook for fetching tables from a specific database service
 * Provides table options for reference and junction table selection
 * 
 * @param serviceId - ID of the database service
 * @param serviceName - Name of the database service (for API calls)
 * @param options - Query configuration options
 * @returns Query result with table options for dropdowns
 */
export function useServiceTables(
  serviceId: number | null,
  serviceName: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: ['service-tables', serviceId, serviceName],
    queryFn: async (): Promise<SelectOption[]> => {
      if (!serviceId || !serviceName) {
        return [];
      }

      const response = await fetch(`/api/v2/${serviceName}/_schema`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, private',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch tables for service ${serviceName}`);
      }

      const data: { resource: SchemaTable[] } = await response.json();
      
      return data.resource.map((table) => ({
        label: table.label || table.name,
        value: table.name,
      }));
    },
    enabled: (options?.enabled ?? true) && !!serviceId && !!serviceName,
    staleTime: options?.staleTime ?? 15 * 60 * 1000, // 15 minutes  
    cacheTime: options?.cacheTime ?? 30 * 60 * 1000, // 30 minutes
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to load service tables',
        description: `Unable to fetch tables for service ${serviceName}.`,
      });
    },
  });
}

/**
 * Hook for fetching existing relationship data for editing
 * Loads current relationship configuration and populates form
 * 
 * @param context - Operation context with service, table, and relationship identifiers
 * @param options - Query configuration options
 * @returns Query result with relationship data
 */
export function useRelationshipData(
  context: RelationshipOperationContext,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: ['relationship-data', context.serviceName, context.tableName, context.relationshipId],
    queryFn: async (): Promise<TableRelated | null> => {
      if (!context.relationshipId || !context.serviceName || !context.tableName) {
        return null;
      }

      const response = await fetch(
        `/api/v2/${context.serviceName}/_schema/${context.tableName}/_related/${context.relationshipId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, private',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch relationship ${context.relationshipId}`);
      }

      const data: TableRelated = await response.json();
      return data;
    },
    enabled: (options?.enabled ?? true) && !!context.relationshipId && !!context.serviceName && !!context.tableName,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    cacheTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to load relationship data',
        description: `Unable to fetch relationship data for editing.`,
      });
    },
  });
}

// ============================================================================
// RELATIONSHIP MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating new table relationships
 * Handles optimistic updates and cache invalidation
 * 
 * @param context - Operation context with service and table identifiers
 * @returns Mutation hook for relationship creation
 */
export function useCreateRelationship(context: RelationshipOperationContext) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (formData: RelationshipFormData): Promise<ApiSuccessResponse> => {
      const payload = {
        resource: [formData],
      };

      const response = await fetch(
        `/api/v2/${context.serviceName}/_schema/${context.tableName}/_related`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        const errorMessage = errorData.error?.context?.resource?.[0]?.error?.message 
          || errorData.error?.message 
          || 'Failed to create relationship';
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['relationship-data', context.serviceName, context.tableName],
      });
      queryClient.invalidateQueries({
        queryKey: ['table-relationships', context.serviceName, context.tableName],
      });

      showNotification({
        type: 'success',
        title: 'Relationship Created',
        message: 'Database relationship has been successfully created.',
      });

      // Navigate back to relationships list
      router.push(`/adf-schema/tables/${context.tableName}/relationships`);
    },
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to create relationship',
        description: error.message,
      });
    },
  });
}

/**
 * Hook for updating existing table relationships
 * Handles optimistic updates and cache invalidation
 * 
 * @param context - Operation context with service, table, and relationship identifiers
 * @returns Mutation hook for relationship updates
 */
export function useUpdateRelationship(context: RelationshipOperationContext) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (formData: RelationshipFormData): Promise<ApiSuccessResponse> => {
      const payload = {
        resource: [formData],
      };

      const response = await fetch(
        `/api/v2/${context.serviceName}/_schema/${context.tableName}/_related`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update relationship');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate specific relationship data and list queries
      queryClient.invalidateQueries({
        queryKey: ['relationship-data', context.serviceName, context.tableName, context.relationshipId],
      });
      queryClient.invalidateQueries({
        queryKey: ['table-relationships', context.serviceName, context.tableName],
      });

      showNotification({
        type: 'success',
        title: 'Relationship Updated',
        message: 'Database relationship has been successfully updated.',
      });

      // Navigate back to relationships list
      router.push(`/adf-schema/tables/${context.tableName}/relationships`);
    },
    onError: (error: Error) => {
      handleError(error, {
        title: 'Failed to update relationship',
        description: error.message,
      });
    },
  });
}

// ============================================================================
// UTILITY AND COMPOSITE HOOKS
// ============================================================================

/**
 * Composite hook that provides all relationship management functionality
 * Combines data fetching and mutation capabilities for relationship forms
 * 
 * @param context - Operation context with service and table identifiers
 * @param mode - Form mode: 'create' or 'edit'
 * @returns Comprehensive relationship management interface
 */
export function useRelationshipManagement(
  context: RelationshipOperationContext,
  mode: 'create' | 'edit'
) {
  // Data fetching hooks
  const servicesQuery = useDatabaseServices();
  const relationshipQuery = useRelationshipData(context, {
    enabled: mode === 'edit' && !!context.relationshipId,
  });

  // Mutation hooks
  const createMutation = useCreateRelationship(context);
  const updateMutation = useUpdateRelationship(context);

  // Service name lookup utility
  const getServiceName = useCallback((serviceId: number): string => {
    const service = servicesQuery.data?.find((s) => s.value === serviceId);
    return service?.name as string || '';
  }, [servicesQuery.data]);

  // Form submission handler
  const handleSubmit = useCallback((formData: RelationshipFormData) => {
    if (mode === 'create') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  }, [mode, createMutation, updateMutation]);

  // Loading states
  const isLoading = useMemo(() => {
    return servicesQuery.isLoading || 
           (mode === 'edit' && relationshipQuery.isLoading);
  }, [servicesQuery.isLoading, relationshipQuery.isLoading, mode]);

  const isSubmitting = useMemo(() => {
    return createMutation.isPending || updateMutation.isPending;
  }, [createMutation.isPending, updateMutation.isPending]);

  // Error states
  const error = useMemo(() => {
    return servicesQuery.error || 
           relationshipQuery.error || 
           createMutation.error || 
           updateMutation.error;
  }, [servicesQuery.error, relationshipQuery.error, createMutation.error, updateMutation.error]);

  return {
    // Data
    services: servicesQuery.data || [],
    relationshipData: relationshipQuery.data,
    
    // Loading states
    isLoading,
    isSubmitting,
    
    // Error state
    error,
    
    // Actions
    handleSubmit,
    getServiceName,
    
    // Individual hooks for advanced usage
    hooks: {
      services: servicesQuery,
      relationship: relationshipQuery,
      create: createMutation,
      update: updateMutation,
    },
  };
}

/**
 * Hook for managing dynamic field dependencies in relationship forms
 * Handles cascading dropdown updates when service/table selections change
 * 
 * @param serviceId - Selected service ID
 * @param tableName - Selected table name
 * @param serviceName - Service name for API calls
 * @returns Field options and loading states
 */
export function useRelationshipFields(
  serviceId: number | null,
  tableName: string,
  serviceName: string
) {
  const tablesQuery = useServiceTables(serviceId, serviceName, {
    enabled: !!serviceId && !!serviceName,
  });
  
  const fieldsQuery = useTableFields(tableName, serviceName, {
    enabled: !!tableName && !!serviceName,
  });

  return {
    tables: tablesQuery.data || [],
    fields: fieldsQuery.data || [],
    isLoadingTables: tablesQuery.isLoading,
    isLoadingFields: fieldsQuery.isLoading,
    tablesError: tablesQuery.error,
    fieldsError: fieldsQuery.error,
    refetch: {
      tables: tablesQuery.refetch,
      fields: fieldsQuery.refetch,
    },
  };
}

/**
 * Hook for managing relationship type-specific form behavior
 * Handles field enabling/disabling based on relationship type
 * 
 * @param relationshipType - Current relationship type selection
 * @returns Configuration for form field states
 */
export function useRelationshipTypeConfig(relationshipType: RelationshipType | null) {
  return useMemo(() => {
    const isManyToMany = relationshipType === 'many_many';
    
    return {
      junctionFields: {
        enabled: isManyToMany,
        required: isManyToMany,
      },
      relationshipTypeOptions: [
        { label: 'Belongs To', value: 'belongs_to' },
        { label: 'Has Many', value: 'has_many' },
        { label: 'Has One', value: 'has_one' },
        { label: 'Many To Many', value: 'many_many' },
      ],
    };
  }, [relationshipType]);
}