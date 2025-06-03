/**
 * React Query hooks for table field data management.
 * Provides intelligent caching, background synchronization, and optimistic updates
 * for field CRUD operations with real-time validation support.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { 
  TableField, 
  FieldTableRow, 
  FieldsResponse,
  FieldFilters,
  FieldError,
  fieldQueryKeys
} from './types';

/**
 * Custom hook for fetching table fields with intelligent caching
 * Implements React Query patterns for optimal performance and UX
 */
export function useTableFields(
  serviceName: string, 
  tableName: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    filters?: FieldFilters;
  }
) {
  const { apiClient } = useApi();
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: fieldQueryKeys.all(serviceName, tableName),
    queryFn: async (): Promise<FieldTableRow[]> => {
      try {
        const endpoint = `${serviceName}/_schema/${tableName}/_field`;
        const response = await apiClient.get<FieldsResponse>(endpoint);
        
        // Transform API response to table row format
        return response.resource.map((field: TableField): FieldTableRow => {
          const constraints = [];
          if (field.isPrimaryKey) constraints.push('PK');
          if (field.isForeignKey) constraints.push('FK');
          if (field.isUnique) constraints.push('UNIQUE');
          if (field.required) constraints.push('NOT NULL');
          if (field.autoIncrement) constraints.push('AUTO_INCREMENT');

          return {
            id: field.name,
            name: field.name,
            alias: field.alias || field.name,
            label: field.label || field.name,
            type: field.type,
            dbType: field.dbType || field.type,
            isVirtual: field.isVirtual,
            required: field.required,
            isPrimaryKey: field.isPrimaryKey,
            isForeignKey: field.isForeignKey,
            isUnique: field.isUnique,
            length: field.length,
            default: field.default,
            description: field.description,
            constraints: constraints.join(', '),
          };
        });
      } catch (error) {
        const fieldError: FieldError = {
          type: 'network',
          message: 'Failed to fetch table fields',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Check your network connection',
            'Verify service and table names are correct',
            'Ensure you have proper permissions'
          ]
        };
        handleError(fieldError);
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!serviceName && !!tableName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (error && 'status' in error && (error as any).status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Error fetching fields:', error);
      toast.error('Failed to load table fields');
    }
  });
}

/**
 * Hook for fetching specific field details
 * Used for field detail views and editing
 */
export function useFieldDetail(
  serviceName: string,
  tableName: string,
  fieldName: string,
  options?: { enabled?: boolean }
) {
  const { apiClient } = useApi();
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: fieldQueryKeys.detail(serviceName, tableName, fieldName),
    queryFn: async (): Promise<TableField> => {
      try {
        const endpoint = `${serviceName}/_schema/${tableName}/_field/${fieldName}`;
        const response = await apiClient.get<TableField>(endpoint);
        return response;
      } catch (error) {
        const fieldError: FieldError = {
          type: 'network',
          message: `Failed to fetch field '${fieldName}' details`,
          details: error instanceof Error ? error.message : 'Unknown error',
          fieldName,
          suggestions: [
            'Verify the field name is correct',
            'Check if the field still exists',
            'Ensure you have proper permissions'
          ]
        };
        handleError(fieldError);
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!serviceName && !!tableName && !!fieldName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry for specific field fetches
    onError: (error) => {
      console.error('Error fetching field detail:', error);
      toast.error(`Failed to load field '${fieldName}' details`);
    }
  });
}

/**
 * Mutation hook for deleting table fields
 * Implements optimistic updates and proper error handling
 */
export function useDeleteField(serviceName: string, tableName: string) {
  const queryClient = useQueryClient();
  const { apiClient } = useApi();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (fieldName: string): Promise<void> => {
      const endpoint = `${serviceName}/_schema/${tableName}/_field/${fieldName}`;
      await apiClient.delete(endpoint);
    },
    onMutate: async (fieldName: string) => {
      // Cancel outgoing refetches
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousFields = queryClient.getQueryData<FieldTableRow[]>(queryKey);

      // Optimistically update cache
      if (previousFields) {
        queryClient.setQueryData<FieldTableRow[]>(
          queryKey,
          previousFields.filter(field => field.name !== fieldName)
        );
      }

      return { previousFields };
    },
    onError: (error, fieldName, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        const queryKey = fieldQueryKeys.all(serviceName, tableName);
        queryClient.setQueryData(queryKey, context.previousFields);
      }

      const fieldError: FieldError = {
        type: 'network',
        message: `Failed to delete field '${fieldName}'`,
        details: error instanceof Error ? error.message : 'Unknown error',
        fieldName,
        suggestions: [
          'Check if the field is being used by other tables',
          'Verify you have deletion permissions',
          'Try refreshing and deleting again'
        ]
      };
      
      handleError(fieldError);
      toast.error(`Failed to delete field '${fieldName}'`);
    },
    onSuccess: (_, fieldName) => {
      toast.success(`Field '${fieldName}' deleted successfully`);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      queryClient.invalidateQueries({ queryKey });
    }
  });
}

/**
 * Mutation hook for creating new fields
 * Supports optimistic updates and validation
 */
export function useCreateField(serviceName: string, tableName: string) {
  const queryClient = useQueryClient();
  const { apiClient } = useApi();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (fieldData: Partial<TableField>): Promise<TableField> => {
      const endpoint = `${serviceName}/_schema/${tableName}/_field`;
      const response = await apiClient.post<TableField>(endpoint, fieldData);
      return response;
    },
    onMutate: async (fieldData) => {
      // Cancel outgoing refetches
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousFields = queryClient.getQueryData<FieldTableRow[]>(queryKey);

      // Optimistically add new field
      if (previousFields && fieldData.name) {
        const constraints = [];
        if (fieldData.isPrimaryKey) constraints.push('PK');
        if (fieldData.isForeignKey) constraints.push('FK');
        if (fieldData.isUnique) constraints.push('UNIQUE');
        if (fieldData.required) constraints.push('NOT NULL');
        if (fieldData.autoIncrement) constraints.push('AUTO_INCREMENT');

        const optimisticField: FieldTableRow = {
          id: fieldData.name,
          name: fieldData.name,
          alias: fieldData.alias || fieldData.name,
          label: fieldData.label || fieldData.name,
          type: fieldData.type || 'string',
          dbType: fieldData.dbType || fieldData.type || 'string',
          isVirtual: fieldData.isVirtual || false,
          required: fieldData.required || false,
          isPrimaryKey: fieldData.isPrimaryKey || false,
          isForeignKey: fieldData.isForeignKey || false,
          isUnique: fieldData.isUnique || false,
          length: fieldData.length,
          default: fieldData.default,
          description: fieldData.description,
          constraints: constraints.join(', '),
        };

        queryClient.setQueryData<FieldTableRow[]>(
          queryKey,
          [...previousFields, optimisticField]
        );
      }

      return { previousFields };
    },
    onError: (error, fieldData, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        const queryKey = fieldQueryKeys.all(serviceName, tableName);
        queryClient.setQueryData(queryKey, context.previousFields);
      }

      const fieldError: FieldError = {
        type: 'validation',
        message: `Failed to create field '${fieldData.name || 'unnamed'}'`,
        details: error instanceof Error ? error.message : 'Unknown error',
        fieldName: fieldData.name,
        suggestions: [
          'Check field configuration',
          'Verify field name is unique',
          'Ensure data type is valid'
        ]
      };
      
      handleError(fieldError);
      toast.error(`Failed to create field '${fieldData.name || 'unnamed'}'`);
    },
    onSuccess: (createdField) => {
      toast.success(`Field '${createdField.name}' created successfully`);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      queryClient.invalidateQueries({ queryKey });
    }
  });
}

/**
 * Mutation hook for updating existing fields
 * Implements optimistic updates and conflict resolution
 */
export function useUpdateField(serviceName: string, tableName: string) {
  const queryClient = useQueryClient();
  const { apiClient } = useApi();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ 
      fieldName, 
      data 
    }: { 
      fieldName: string; 
      data: Partial<TableField> 
    }): Promise<TableField> => {
      const endpoint = `${serviceName}/_schema/${tableName}/_field/${fieldName}`;
      const response = await apiClient.patch<TableField>(endpoint, data);
      return response;
    },
    onMutate: async ({ fieldName, data }) => {
      // Cancel outgoing refetches
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousFields = queryClient.getQueryData<FieldTableRow[]>(queryKey);

      // Optimistically update field
      if (previousFields) {
        const updatedFields = previousFields.map(field => {
          if (field.name === fieldName) {
            const constraints = [];
            const isPrimaryKey = data.isPrimaryKey !== undefined ? data.isPrimaryKey : field.isPrimaryKey;
            const isForeignKey = data.isForeignKey !== undefined ? data.isForeignKey : field.isForeignKey;
            const isUnique = data.isUnique !== undefined ? data.isUnique : field.isUnique;
            const required = data.required !== undefined ? data.required : field.required;
            const autoIncrement = data.autoIncrement !== undefined ? data.autoIncrement : false;

            if (isPrimaryKey) constraints.push('PK');
            if (isForeignKey) constraints.push('FK');
            if (isUnique) constraints.push('UNIQUE');
            if (required) constraints.push('NOT NULL');
            if (autoIncrement) constraints.push('AUTO_INCREMENT');

            return {
              ...field,
              alias: data.alias || field.alias,
              label: data.label || field.label,
              type: data.type || field.type,
              dbType: data.dbType || field.dbType,
              isVirtual: data.isVirtual !== undefined ? data.isVirtual : field.isVirtual,
              required,
              isPrimaryKey,
              isForeignKey,
              isUnique,
              length: data.length !== undefined ? data.length : field.length,
              default: data.default !== undefined ? data.default : field.default,
              description: data.description !== undefined ? data.description : field.description,
              constraints: constraints.join(', '),
            };
          }
          return field;
        });

        queryClient.setQueryData<FieldTableRow[]>(queryKey, updatedFields);
      }

      return { previousFields };
    },
    onError: (error, { fieldName }, context) => {
      // Rollback optimistic update
      if (context?.previousFields) {
        const queryKey = fieldQueryKeys.all(serviceName, tableName);
        queryClient.setQueryData(queryKey, context.previousFields);
      }

      const fieldError: FieldError = {
        type: 'validation',
        message: `Failed to update field '${fieldName}'`,
        details: error instanceof Error ? error.message : 'Unknown error',
        fieldName,
        suggestions: [
          'Check updated field configuration',
          'Verify all constraints are valid',
          'Ensure changes don\'t create conflicts'
        ]
      };
      
      handleError(fieldError);
      toast.error(`Failed to update field '${fieldName}'`);
    },
    onSuccess: (updatedField) => {
      toast.success(`Field '${updatedField.name}' updated successfully`);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      const queryKey = fieldQueryKeys.all(serviceName, tableName);
      queryClient.invalidateQueries({ queryKey });
    }
  });
}

/**
 * Composite hook for managing all field table operations
 * Provides unified interface for field management
 */
export function useFieldTableManager(serviceName: string, tableName: string) {
  const fields = useTableFields(serviceName, tableName);
  const deleteField = useDeleteField(serviceName, tableName);
  const createField = useCreateField(serviceName, tableName);
  const updateField = useUpdateField(serviceName, tableName);

  const refreshTable = useCallback(() => {
    const queryKey = fieldQueryKeys.all(serviceName, tableName);
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey });
  }, [serviceName, tableName]);

  const isLoading = fields.isLoading || 
                   deleteField.isPending || 
                   createField.isPending || 
                   updateField.isPending;

  return {
    // Data and queries
    fields: fields.data || [],
    isLoading,
    error: fields.error,
    
    // Actions
    deleteField: deleteField.mutate,
    createField: createField.mutate,
    updateField: updateField.mutate,
    refreshTable,
    
    // Mutation states
    isDeleting: deleteField.isPending,
    isCreating: createField.isPending,
    isUpdating: updateField.isPending,
  };
}