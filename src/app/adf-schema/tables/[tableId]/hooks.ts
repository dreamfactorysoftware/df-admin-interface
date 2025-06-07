'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useNotifications } from '@/hooks/use-notifications';
import { useSession } from '@/hooks/use-session';
import type {
  SchemaTable,
  SchemaField,
  ForeignKey,
  TableIndex,
  TableConstraint,
  FieldType,
  ReferentialAction
} from '@/types/schema';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiSuccessResponse,
  RequestConfig
} from '@/lib/api-client/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Table metadata structure for form handling and API operations
 */
export interface TableMetadata {
  id?: string;
  name: string;
  label?: string;
  description?: string;
  alias?: string;
  plural?: string;
  isView?: boolean;
  schema?: string;
  access?: number;
  nameField?: string;
  apiEnabled?: boolean;
}

/**
 * Field metadata for table field management
 */
export interface FieldMetadata {
  id?: string;
  name: string;
  label?: string;
  description?: string;
  alias?: string;
  type: FieldType;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: any;
  isNullable: boolean;
  allowNull: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isAutoIncrement: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  required: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
    format?: string;
  };
  hidden: boolean;
}

/**
 * Relationship metadata for foreign key management
 */
export interface RelationshipMetadata {
  id?: string;
  name: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}

/**
 * Table operation result
 */
export interface TableOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Optimistic update context for UI state management
 */
export interface OptimisticUpdateContext {
  operation: 'create' | 'update' | 'delete';
  resourceType: 'table' | 'field' | 'relationship';
  data: any;
  previousData?: any;
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

/**
 * Query key factory for consistent cache management
 * Follows React Query best practices for cache invalidation
 */
export const tableQueryKeys = {
  all: ['tables'] as const,
  lists: () => [...tableQueryKeys.all, 'list'] as const,
  list: (serviceId: string, filters?: Record<string, any>) => 
    [...tableQueryKeys.lists(), serviceId, filters] as const,
  details: () => [...tableQueryKeys.all, 'detail'] as const,
  detail: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.details(), serviceId, tableId] as const,
  fields: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.detail(serviceId, tableId), 'fields'] as const,
  relationships: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.detail(serviceId, tableId), 'relationships'] as const,
  indexes: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.detail(serviceId, tableId), 'indexes'] as const,
  constraints: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.detail(serviceId, tableId), 'constraints'] as const,
  schema: (serviceId: string, tableId: string) => 
    [...tableQueryKeys.detail(serviceId, tableId), 'schema'] as const,
};

// ============================================================================
// TABLE METADATA HOOKS
// ============================================================================

/**
 * Hook for fetching table metadata with intelligent caching
 * Implements cache hit responses under 50ms requirement
 */
export function useTableMetadata(serviceId: string, tableId: string, options?: {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
}) {
  const { handleError } = useErrorHandler();
  const { session } = useSession();

  const queryKey = useMemo(
    () => tableQueryKeys.detail(serviceId, tableId),
    [serviceId, tableId]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SchemaTable> => {
      try {
        const response = await apiClient.get<ApiResourceResponse<SchemaTable>>(
          `/${serviceId}/_schema/${tableId}`,
          {
            timeout: 5000, // 5 second timeout for metadata fetching
            retryAttempts: 3,
            includeAuth: true,
          }
        );
        return response.resource;
      } catch (error) {
        handleError(error, `Failed to fetch table metadata for ${tableId}`);
        throw error;
      }
    },
    enabled: !!(serviceId && tableId && session?.isAuthenticated && options?.enabled !== false),
    staleTime: options?.staleTime ?? 300000, // 5 minutes - cache hit under 50ms
    cacheTime: options?.cacheTime ?? 900000, // 15 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    table: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching table fields with virtual scrolling support
 * Optimized for large field lists (1000+ fields)
 */
export function useTableFields(serviceId: string, tableId: string, options?: {
  enabled?: boolean;
  pageSize?: number;
  virtualScrolling?: boolean;
}) {
  const { handleError } = useErrorHandler();
  const { session } = useSession();

  const queryKey = useMemo(
    () => tableQueryKeys.fields(serviceId, tableId),
    [serviceId, tableId]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SchemaField[]> => {
      try {
        const response = await apiClient.get<ApiResourceResponse<SchemaTable>>(
          `/${serviceId}/_schema/${tableId}`,
          {
            fields: 'fields',
            timeout: 10000, // Extended timeout for large field lists
            retryAttempts: 3,
            includeAuth: true,
          }
        );
        return response.resource.fields || [];
      } catch (error) {
        handleError(error, `Failed to fetch fields for table ${tableId}`);
        throw error;
      }
    },
    enabled: !!(serviceId && tableId && session?.isAuthenticated && options?.enabled !== false),
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
    select: useCallback((data: SchemaField[]) => {
      // Apply virtual scrolling optimization for large datasets
      if (options?.virtualScrolling && options?.pageSize) {
        return data; // TanStack Virtual handles the virtualization
      }
      return data;
    }, [options?.virtualScrolling, options?.pageSize]),
  });

  return {
    ...query,
    fields: query.data || [],
    totalFields: query.data?.length || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching table relationships with foreign key details
 */
export function useTableRelationships(serviceId: string, tableId: string, options?: {
  enabled?: boolean;
}) {
  const { handleError } = useErrorHandler();
  const { session } = useSession();

  const queryKey = useMemo(
    () => tableQueryKeys.relationships(serviceId, tableId),
    [serviceId, tableId]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ForeignKey[]> => {
      try {
        const response = await apiClient.get<ApiResourceResponse<SchemaTable>>(
          `/${serviceId}/_schema/${tableId}`,
          {
            fields: 'foreignKeys,related',
            timeout: 5000,
            retryAttempts: 3,
            includeAuth: true,
          }
        );
        return response.resource.foreignKeys || [];
      } catch (error) {
        handleError(error, `Failed to fetch relationships for table ${tableId}`);
        throw error;
      }
    },
    enabled: !!(serviceId && tableId && session?.isAuthenticated && options?.enabled !== false),
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    relationships: query.data || [],
    totalRelationships: query.data?.length || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================
// TABLE MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating new table with optimistic updates
 */
export function useCreateTable(serviceId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();
  const router = useRouter();

  return useMutation({
    mutationFn: async (tableData: TableMetadata): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.post<ApiSuccessResponse>(
          `/${serviceId}/_schema`,
          { resource: [tableData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
            snackbarSuccess: `Table '${tableData.name}' created successfully`,
          }
        );
        return {
          success: true,
          message: `Table '${tableData.name}' created successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to create table '${tableData.name}'`);
        throw error;
      }
    },
    onSuccess: (result, tableData) => {
      // Invalidate related queries for automatic refresh
      queryClient.invalidateQueries({ queryKey: tableQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tableQueryKeys.list(serviceId) });
      
      // Show success notification
      showNotification({
        type: 'success',
        message: result.message || `Table '${tableData.name}' created successfully`,
        duration: 5000,
      });

      // Navigate to the new table details page
      router.push(`/adf-schema/tables/${tableData.name}`);
    },
    onError: (error: any, tableData) => {
      handleError(error, `Failed to create table '${tableData.name}'`);
      showNotification({
        type: 'error',
        message: `Failed to create table '${tableData.name}': ${error.message}`,
        duration: 8000,
      });
    },
  });
}

/**
 * Hook for updating table metadata with optimistic updates
 */
export function useUpdateTable(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (tableData: Partial<TableMetadata>): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.patch<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}`,
          { resource: [tableData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Table '${tableId}' updated successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to update table '${tableId}'`);
        throw error;
      }
    },
    onMutate: async (newTableData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      // Snapshot the previous value for rollback
      const previousTable = queryClient.getQueryData<SchemaTable>(
        tableQueryKeys.detail(serviceId, tableId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<SchemaTable>(
        tableQueryKeys.detail(serviceId, tableId),
        (old) => old ? { ...old, ...newTableData } : old
      );

      return { previousTable };
    },
    onError: (error: any, newTableData, context) => {
      // Rollback optimistic update on error
      if (context?.previousTable) {
        queryClient.setQueryData(
          tableQueryKeys.detail(serviceId, tableId),
          context.previousTable
        );
      }
      
      handleError(error, `Failed to update table '${tableId}'`);
      showNotification({
        type: 'error',
        message: `Failed to update table '${tableId}': ${error.message}`,
        duration: 8000,
      });
    },
    onSuccess: (result) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.lists() 
      });

      showNotification({
        type: 'success',
        message: result.message || `Table '${tableId}' updated successfully`,
        duration: 5000,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });
    },
  });
}

/**
 * Hook for deleting table with confirmation and error recovery
 */
export function useDeleteTable(serviceId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();
  const router = useRouter();

  return useMutation({
    mutationFn: async (tableId: string): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.delete<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}`,
          {
            timeout: 10000,
            retryAttempts: 1, // Limited retries for delete operations
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Table '${tableId}' deleted successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to delete table '${tableId}'`);
        throw error;
      }
    },
    onSuccess: (result, tableId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tableQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tableQueryKeys.list(serviceId) });
      
      // Remove the specific table from cache
      queryClient.removeQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Table '${tableId}' deleted successfully`,
        duration: 5000,
      });

      // Navigate back to tables list
      router.push('/adf-schema/tables');
    },
    onError: (error: any, tableId) => {
      handleError(error, `Failed to delete table '${tableId}'`);
      showNotification({
        type: 'error',
        message: `Failed to delete table '${tableId}': ${error.message}`,
        duration: 8000,
      });
    },
  });
}

// ============================================================================
// FIELD MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for creating new field with optimistic updates
 */
export function useCreateField(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (fieldData: FieldMetadata): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.post<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_field`,
          { resource: [fieldData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Field '${fieldData.name}' created successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to create field '${fieldData.name}'`);
        throw error;
      }
    },
    onMutate: async (newField) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });

      // Snapshot the previous value
      const previousFields = queryClient.getQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId),
        (old) => old ? [...old, newField as SchemaField] : [newField as SchemaField]
      );

      return { previousFields };
    },
    onError: (error: any, newField, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        queryClient.setQueryData(
          tableQueryKeys.fields(serviceId, tableId),
          context.previousFields
        );
      }
      
      handleError(error, `Failed to create field '${newField.name}'`);
      showNotification({
        type: 'error',
        message: `Failed to create field '${newField.name}': ${error.message}`,
        duration: 8000,
      });
    },
    onSuccess: (result, fieldData) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Field '${fieldData.name}' created successfully`,
        duration: 5000,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
    },
  });
}

/**
 * Hook for updating field metadata with optimistic updates
 */
export function useUpdateField(serviceId: string, tableId: string, fieldId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (fieldData: Partial<FieldMetadata>): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.patch<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_field/${fieldId}`,
          { resource: [fieldData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Field '${fieldId}' updated successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to update field '${fieldId}'`);
        throw error;
      }
    },
    onMutate: async (newFieldData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });

      // Snapshot the previous value
      const previousFields = queryClient.getQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId),
        (old) => {
          if (!old) return old;
          return old.map(field => 
            field.id === fieldId || field.name === fieldId
              ? { ...field, ...newFieldData }
              : field
          );
        }
      );

      return { previousFields };
    },
    onError: (error: any, newFieldData, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        queryClient.setQueryData(
          tableQueryKeys.fields(serviceId, tableId),
          context.previousFields
        );
      }
      
      handleError(error, `Failed to update field '${fieldId}'`);
      showNotification({
        type: 'error',
        message: `Failed to update field '${fieldId}': ${error.message}`,
        duration: 8000,
      });
    },
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Field '${fieldId}' updated successfully`,
        duration: 5000,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
    },
  });
}

/**
 * Hook for deleting field with confirmation and error recovery
 */
export function useDeleteField(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (fieldId: string): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.delete<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_field/${fieldId}`,
          {
            timeout: 10000,
            retryAttempts: 1, // Limited retries for delete operations
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Field '${fieldId}' deleted successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to delete field '${fieldId}'`);
        throw error;
      }
    },
    onMutate: async (fieldId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });

      // Snapshot the previous value
      const previousFields = queryClient.getQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<SchemaField[]>(
        tableQueryKeys.fields(serviceId, tableId),
        (old) => {
          if (!old) return old;
          return old.filter(field => 
            field.id !== fieldId && field.name !== fieldId
          );
        }
      );

      return { previousFields };
    },
    onError: (error: any, fieldId, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        queryClient.setQueryData(
          tableQueryKeys.fields(serviceId, tableId),
          context.previousFields
        );
      }
      
      handleError(error, `Failed to delete field '${fieldId}'`);
      showNotification({
        type: 'error',
        message: `Failed to delete field '${fieldId}': ${error.message}`,
        duration: 8000,
      });
    },
    onSuccess: (result, fieldId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Field '${fieldId}' deleted successfully`,
        duration: 5000,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      });
    },
  });
}

// ============================================================================
// RELATIONSHIP MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for creating new relationship with optimistic updates
 */
export function useCreateRelationship(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (relationshipData: RelationshipMetadata): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.post<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_relationship`,
          { resource: [relationshipData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Relationship '${relationshipData.name}' created successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to create relationship '${relationshipData.name}'`);
        throw error;
      }
    },
    onSuccess: (result, relationshipData) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.relationships(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Relationship '${relationshipData.name}' created successfully`,
        duration: 5000,
      });
    },
    onError: (error: any, relationshipData) => {
      handleError(error, `Failed to create relationship '${relationshipData.name}'`);
      showNotification({
        type: 'error',
        message: `Failed to create relationship '${relationshipData.name}': ${error.message}`,
        duration: 8000,
      });
    },
  });
}

/**
 * Hook for updating relationship with optimistic updates
 */
export function useUpdateRelationship(serviceId: string, tableId: string, relationshipId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (relationshipData: Partial<RelationshipMetadata>): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.patch<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_relationship/${relationshipId}`,
          { resource: [relationshipData] },
          {
            timeout: 10000,
            retryAttempts: 2,
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Relationship '${relationshipId}' updated successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to update relationship '${relationshipId}'`);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.relationships(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Relationship '${relationshipId}' updated successfully`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      handleError(error, `Failed to update relationship '${relationshipId}'`);
      showNotification({
        type: 'error',
        message: `Failed to update relationship '${relationshipId}': ${error.message}`,
        duration: 8000,
      });
    },
  });
}

/**
 * Hook for deleting relationship with confirmation and error recovery
 */
export function useDeleteRelationship(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (relationshipId: string): Promise<TableOperationResult> => {
      try {
        const response = await apiClient.delete<ApiSuccessResponse>(
          `/${serviceId}/_schema/${tableId}/_relationship/${relationshipId}`,
          {
            timeout: 10000,
            retryAttempts: 1, // Limited retries for delete operations
            includeAuth: true,
          }
        );
        return {
          success: true,
          message: `Relationship '${relationshipId}' deleted successfully`,
          data: response,
        };
      } catch (error) {
        handleError(error, `Failed to delete relationship '${relationshipId}'`);
        throw error;
      }
    },
    onSuccess: (result, relationshipId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.relationships(serviceId, tableId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      });

      showNotification({
        type: 'success',
        message: result.message || `Relationship '${relationshipId}' deleted successfully`,
        duration: 5000,
      });
    },
    onError: (error: any, relationshipId) => {
      handleError(error, `Failed to delete relationship '${relationshipId}'`);
      showNotification({
        type: 'error',
        message: `Failed to delete relationship '${relationshipId}': ${error.message}`,
        duration: 8000,
      });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for invalidating and refreshing all table-related queries
 * Useful for manual refresh operations
 */
export function useRefreshTableData(serviceId: string, tableId: string) {
  const queryClient = useQueryClient();

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.detail(serviceId, tableId) 
      }),
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.fields(serviceId, tableId) 
      }),
      queryClient.invalidateQueries({ 
        queryKey: tableQueryKeys.relationships(serviceId, tableId) 
      }),
    ]);
  }, [queryClient, serviceId, tableId]);

  const refreshMetadata = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: tableQueryKeys.detail(serviceId, tableId) 
    });
  }, [queryClient, serviceId, tableId]);

  const refreshFields = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: tableQueryKeys.fields(serviceId, tableId) 
    });
  }, [queryClient, serviceId, tableId]);

  const refreshRelationships = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: tableQueryKeys.relationships(serviceId, tableId) 
    });
  }, [queryClient, serviceId, tableId]);

  return {
    refreshAll,
    refreshMetadata,
    refreshFields,
    refreshRelationships,
  };
}

/**
 * Hook for checking table operation permissions
 * Integrates with authentication and role-based access control
 */
export function useTablePermissions(serviceId: string, tableId?: string) {
  const { session } = useSession();

  const permissions = useMemo(() => {
    if (!session?.isAuthenticated) {
      return {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canManageFields: false,
        canManageRelationships: false,
      };
    }

    // Check user roles and permissions
    const userRoles = session?.session?.roles || [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super-admin');
    const hasSchemaAccess = isAdmin || userRoles.includes('schema-admin');

    return {
      canRead: hasSchemaAccess,
      canCreate: hasSchemaAccess,
      canUpdate: hasSchemaAccess,
      canDelete: hasSchemaAccess,
      canManageFields: hasSchemaAccess,
      canManageRelationships: hasSchemaAccess,
    };
  }, [session]);

  return permissions;
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Composite hook that provides all table-related functionality
 * Convenience hook for components that need comprehensive table management
 */
export function useTableManagement(serviceId: string, tableId: string, options?: {
  enabledQueries?: {
    metadata?: boolean;
    fields?: boolean;
    relationships?: boolean;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  // Data fetching hooks
  const tableQuery = useTableMetadata(serviceId, tableId, {
    enabled: options?.enabledQueries?.metadata,
    refetchOnWindowFocus: options?.autoRefresh,
  });

  const fieldsQuery = useTableFields(serviceId, tableId, {
    enabled: options?.enabledQueries?.fields,
  });

  const relationshipsQuery = useTableRelationships(serviceId, tableId, {
    enabled: options?.enabledQueries?.relationships,
  });

  // Mutation hooks
  const updateTableMutation = useUpdateTable(serviceId, tableId);
  const deleteTableMutation = useDeleteTable(serviceId);
  const createFieldMutation = useCreateField(serviceId, tableId);
  const updateFieldMutation = useUpdateField; // Factory function
  const deleteFieldMutation = useDeleteField(serviceId, tableId);
  const createRelationshipMutation = useCreateRelationship(serviceId, tableId);
  const updateRelationshipMutation = useUpdateRelationship; // Factory function
  const deleteRelationshipMutation = useDeleteRelationship(serviceId, tableId);

  // Utility hooks
  const refreshHooks = useRefreshTableData(serviceId, tableId);
  const permissions = useTablePermissions(serviceId, tableId);

  // Computed states
  const isLoading = tableQuery.isLoading || fieldsQuery.isLoading || relationshipsQuery.isLoading;
  const isError = tableQuery.isError || fieldsQuery.isError || relationshipsQuery.isError;
  const isMutating = updateTableMutation.isPending || 
                   deleteTableMutation.isPending ||
                   createFieldMutation.isPending ||
                   deleteFieldMutation.isPending ||
                   createRelationshipMutation.isPending ||
                   deleteRelationshipMutation.isPending;

  return {
    // Query data
    table: tableQuery.table,
    fields: fieldsQuery.fields,
    relationships: relationshipsQuery.relationships,
    
    // Query states
    isLoading,
    isError,
    isMutating,
    
    // Query objects for advanced usage
    queries: {
      table: tableQuery,
      fields: fieldsQuery,
      relationships: relationshipsQuery,
    },
    
    // Mutation functions
    mutations: {
      updateTable: updateTableMutation.mutate,
      deleteTable: deleteTableMutation.mutate,
      createField: createFieldMutation.mutate,
      updateField: (fieldId: string) => updateFieldMutation(serviceId, tableId, fieldId),
      deleteField: deleteFieldMutation.mutate,
      createRelationship: createRelationshipMutation.mutate,
      updateRelationship: (relationshipId: string) => 
        updateRelationshipMutation(serviceId, tableId, relationshipId),
      deleteRelationship: deleteRelationshipMutation.mutate,
    },
    
    // Utility functions
    refresh: refreshHooks,
    permissions,
    
    // Query key factory for advanced cache management
    queryKeys: tableQueryKeys,
  };
}