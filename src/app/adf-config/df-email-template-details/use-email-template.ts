'use client';

/**
 * Email Template Management Hook
 * 
 * Custom React hook providing email template CRUD operations using SWR/React Query 
 * for intelligent caching and state management. Handles create, read, update operations 
 * for email templates with optimistic updates, error handling, and cache invalidation. 
 * Provides loading states, error states, and success callbacks while maintaining 
 * compatibility with the DreamFactory email templates API.
 * 
 * Features:
 * - SWR/React Query for intelligent caching and synchronization per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements  
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Optimistic updates with rollback capabilities per Section 4.3 state management workflows
 * - Comprehensive error handling and retry logic per Section 4.1 system workflows
 * - Convert Angular service injection to custom React hook per React/Next.js Integration Requirements
 * - Replace RxJS observables with React Query mutations and queries per React/Next.js Integration Requirements
 * - Implement cache invalidation strategies for related queries per Section 4.3 state management workflows
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useNotification } from '../../../hooks/use-notification';
import type {
  EmailTemplate,
  EmailTemplateRequest,
  EmailTemplateListResponse,
  EmailTemplateResponse,
  EmailTemplateCreateResponse,
  EmailTemplateUpdateResponse,
  EmailTemplateQueryParams,
  EmailTemplateHookConfig,
  EmailTemplatePreview,
  EmailTemplateTest,
  EmailTemplateTestResult,
  EmailTemplateOperationResult
} from '../../../types/email-templates';

/**
 * API error interface for comprehensive error handling
 */
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  context?: string;
}

/**
 * Query keys for React Query cache management
 */
const EMAIL_TEMPLATE_QUERY_KEYS = {
  all: ['email-templates'] as const,
  lists: () => [...EMAIL_TEMPLATE_QUERY_KEYS.all, 'list'] as const,
  list: (params?: EmailTemplateQueryParams) => [...EMAIL_TEMPLATE_QUERY_KEYS.lists(), params] as const,
  details: () => [...EMAIL_TEMPLATE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...EMAIL_TEMPLATE_QUERY_KEYS.details(), id] as const,
  preview: (id: number) => [...EMAIL_TEMPLATE_QUERY_KEYS.all, 'preview', id] as const,
} as const;

/**
 * Default configuration for React Query
 */
const DEFAULT_CONFIG: EmailTemplateHookConfig = {
  enableOptimisticUpdates: true,
  enableCache: true,
  cacheTime: 1000 * 60 * 5, // 5 minutes
  staleTime: 1000 * 30, // 30 seconds for cache hit under 50ms requirement
  retryCount: 3,
  retryDelay: 1000
};

/**
 * Email template hook return interface
 */
export interface UseEmailTemplateReturn {
  // Query operations
  emailTemplates: EmailTemplate[];
  emailTemplate: EmailTemplate | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  
  // Mutation operations
  createTemplate: (data: EmailTemplateRequest) => Promise<EmailTemplateOperationResult>;
  updateTemplate: (id: number, data: EmailTemplateRequest) => Promise<EmailTemplateOperationResult>;
  deleteTemplate: (id: number) => Promise<EmailTemplateOperationResult>;
  duplicateTemplate: (id: number, newName: string) => Promise<EmailTemplateOperationResult>;
  
  // Template operations
  previewTemplate: (id: number, testData?: Record<string, any>) => Promise<EmailTemplatePreview>;
  testTemplate: (test: EmailTemplateTest) => Promise<EmailTemplateTestResult>;
  
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPreviewing: boolean;
  isTesting: boolean;
  
  // Cache management
  invalidateQueries: () => void;
  refreshTemplate: (id: number) => void;
  
  // Optimistic update context
  rollbackOptimisticUpdate: () => void;
}

/**
 * Email template management hook providing comprehensive CRUD operations
 * with intelligent caching, optimistic updates, and error handling.
 * 
 * @param templateId - Optional template ID for single template operations
 * @param queryParams - Optional query parameters for list operations
 * @param config - Optional configuration overrides
 * @returns Email template hook interface with all operations and state
 * 
 * @example
 * ```tsx
 * // List all templates
 * const { emailTemplates, isLoading, createTemplate } = useEmailTemplate();
 * 
 * // Get specific template
 * const { emailTemplate, updateTemplate } = useEmailTemplate(123);
 * 
 * // Create new template
 * const handleCreate = async () => {
 *   const result = await createTemplate({
 *     name: 'Welcome Email',
 *     subject: 'Welcome to our platform',
 *     body_html: '<h1>Welcome!</h1>',
 *     is_active: true
 *   });
 *   if (result.success) {
 *     console.log('Template created:', result.data);
 *   }
 * };
 * 
 * // Preview template
 * const { previewTemplate } = useEmailTemplate();
 * const preview = await previewTemplate(123, { user_name: 'John Doe' });
 * ```
 */
export function useEmailTemplate(
  templateId?: number,
  queryParams?: EmailTemplateQueryParams,
  config: EmailTemplateHookConfig = {}
): UseEmailTemplateReturn {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Optimistic update context for rollback
  const optimisticUpdateContext = useRef<{
    queryKey: string[];
    previousData: any;
  } | null>(null);

  /**
   * Calculate exponential backoff delay for retries
   */
  const calculateRetryDelay = useCallback((attemptIndex: number): number => {
    return Math.min(finalConfig.retryDelay! * Math.pow(2, attemptIndex), 30000); // Max 30 seconds
  }, [finalConfig.retryDelay]);

  /**
   * Optimistic update helper
   */
  const performOptimisticUpdate = useCallback((queryKey: string[], updater: (oldData: any) => any) => {
    if (!finalConfig.enableOptimisticUpdates) return;

    const previousData = queryClient.getQueryData(queryKey);
    optimisticUpdateContext.current = { queryKey, previousData };
    
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, finalConfig.enableOptimisticUpdates]);

  /**
   * Rollback optimistic update
   */
  const rollbackOptimisticUpdate = useCallback(() => {
    if (optimisticUpdateContext.current) {
      const { queryKey, previousData } = optimisticUpdateContext.current;
      queryClient.setQueryData(queryKey, previousData);
      optimisticUpdateContext.current = null;
    }
  }, [queryClient]);

  /**
   * Query for email templates list
   */
  const {
    data: emailTemplatesData,
    isLoading: isLoadingList,
    isError: isErrorList,
    error: errorList,
    refetch: refetchList
  } = useQuery({
    queryKey: EMAIL_TEMPLATE_QUERY_KEYS.list(queryParams),
    queryFn: async (): Promise<EmailTemplateListResponse> => {
      const params = new URLSearchParams();
      
      if (queryParams?.filter) params.append('filter', queryParams.filter);
      if (queryParams?.sort) params.append('sort', queryParams.sort);
      if (queryParams?.fields) params.append('fields', queryParams.fields);
      if (queryParams?.limit) params.append('limit', queryParams.limit.toString());
      if (queryParams?.offset) params.append('offset', queryParams.offset.toString());
      if (queryParams?.include_count) params.append('include_count', 'true');
      if (queryParams?.include_inactive) params.append('include_inactive', 'true');

      const url = `/system/email_template${params.toString() ? `?${params.toString()}` : ''}`;
      
      return apiClient.get(url);
    },
    staleTime: finalConfig.staleTime,
    cacheTime: finalConfig.cacheTime,
    enabled: finalConfig.enableCache,
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay,
    onError: (error) => {
      finalConfig.onError?.(error);
    }
  });

  /**
   * Query for single email template
   */
  const {
    data: emailTemplateData,
    isLoading: isLoadingTemplate,
    isError: isErrorTemplate,
    error: errorTemplate,
    refetch: refetchTemplate
  } = useQuery({
    queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(templateId!),
    queryFn: async (): Promise<EmailTemplateResponse> => {
      return apiClient.get(`/system/email_template/${templateId}`);
    },
    enabled: !!templateId && finalConfig.enableCache,
    staleTime: finalConfig.staleTime,
    cacheTime: finalConfig.cacheTime,
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay,
    onError: (error) => {
      finalConfig.onError?.(error);
    }
  });

  /**
   * Create email template mutation
   */
  const createMutation = useMutation({
    mutationFn: async (data: EmailTemplateRequest): Promise<EmailTemplateCreateResponse> => {
      return apiClient.post('/system/email_template', { resource: [data] });
    },
    onMutate: async (newTemplate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists() });

      // Optimistic update
      if (finalConfig.enableOptimisticUpdates) {
        const queryKey = EMAIL_TEMPLATE_QUERY_KEYS.list(queryParams);
        performOptimisticUpdate(queryKey, (old: EmailTemplateListResponse | undefined) => {
          if (!old) return old;
          
          const optimisticTemplate: EmailTemplate = {
            id: -1, // Temporary ID
            ...newTemplate,
            is_active: newTemplate.is_active ?? true,
            created_date: new Date().toISOString(),
            last_modified_date: new Date().toISOString()
          };

          return {
            ...old,
            resource: [...old.resource, optimisticTemplate],
            meta: { count: old.meta.count + 1 }
          };
        });
      }
    },
    onSuccess: (response, variables) => {
      // Clear optimistic update context
      optimisticUpdateContext.current = null;
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.all });
      
      // Show success notification
      notification.success(
        `Email template "${variables.name}" created successfully`,
        'Template Created'
      );
      
      finalConfig.onSuccess?.(response);
    },
    onError: (error: ApiError, variables) => {
      // Rollback optimistic update
      rollbackOptimisticUpdate();
      
      // Show error notification
      notification.error(
        `Failed to create email template "${variables.name}": ${error.message}`,
        'Creation Failed'
      );
      
      finalConfig.onError?.(error);
    },
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay
  });

  /**
   * Update email template mutation
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmailTemplateRequest }): Promise<EmailTemplateUpdateResponse> => {
      return apiClient.post(`/system/email_template/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists() });

      // Optimistic update for detail view
      if (finalConfig.enableOptimisticUpdates && templateId === id) {
        const detailQueryKey = EMAIL_TEMPLATE_QUERY_KEYS.detail(id);
        performOptimisticUpdate(detailQueryKey, (old: EmailTemplateResponse | undefined) => {
          if (!old?.resource?.[0]) return old;
          
          return {
            ...old,
            resource: [{
              ...old.resource[0],
              ...data,
              last_modified_date: new Date().toISOString()
            }]
          };
        });

        // Also update list view
        const listQueryKey = EMAIL_TEMPLATE_QUERY_KEYS.list(queryParams);
        performOptimisticUpdate(listQueryKey, (old: EmailTemplateListResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            resource: old.resource.map(template => 
              template.id === id 
                ? { ...template, ...data, last_modified_date: new Date().toISOString() }
                : template
            )
          };
        });
      }
    },
    onSuccess: (response, { id, data }) => {
      // Clear optimistic update context
      optimisticUpdateContext.current = null;
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.all });
      
      // Show success notification
      notification.success(
        `Email template "${data.name}" updated successfully`,
        'Template Updated'
      );
      
      finalConfig.onSuccess?.(response);
    },
    onError: (error: ApiError, { data }) => {
      // Rollback optimistic update
      rollbackOptimisticUpdate();
      
      // Show error notification
      notification.error(
        `Failed to update email template "${data.name}": ${error.message}`,
        'Update Failed'
      );
      
      finalConfig.onError?.(error);
    },
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay
  });

  /**
   * Delete email template mutation
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      return apiClient.delete(`/system/email_template/${id}`);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists() });

      // Get template name for notification
      const templateData = queryClient.getQueryData<EmailTemplateResponse>(
        EMAIL_TEMPLATE_QUERY_KEYS.detail(id)
      );
      const templateName = templateData?.resource?.[0]?.name || 'template';

      // Optimistic update
      if (finalConfig.enableOptimisticUpdates) {
        const listQueryKey = EMAIL_TEMPLATE_QUERY_KEYS.list(queryParams);
        performOptimisticUpdate(listQueryKey, (old: EmailTemplateListResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            resource: old.resource.filter(template => template.id !== id),
            meta: { count: Math.max(0, old.meta.count - 1) }
          };
        });
      }

      return { templateName };
    },
    onSuccess: (response, id, context) => {
      // Clear optimistic update context
      optimisticUpdateContext.current = null;
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists() });
      
      // Show success notification
      notification.success(
        `Email template "${context?.templateName}" deleted successfully`,
        'Template Deleted'
      );
      
      finalConfig.onSuccess?.(response);
    },
    onError: (error: ApiError, id, context) => {
      // Rollback optimistic update
      rollbackOptimisticUpdate();
      
      // Show error notification
      notification.error(
        `Failed to delete email template "${context?.templateName}": ${error.message}`,
        'Deletion Failed'
      );
      
      finalConfig.onError?.(error);
    },
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay
  });

  /**
   * Duplicate email template mutation
   */
  const duplicateMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: number; newName: string }): Promise<EmailTemplateCreateResponse> => {
      // First get the template to duplicate
      const templateResponse: EmailTemplateResponse = await apiClient.get(`/system/email_template/${id}`);
      const originalTemplate = templateResponse.resource[0];
      
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      // Create duplicate with new name
      const duplicateData: EmailTemplateRequest = {
        ...originalTemplate,
        name: newName,
        // Remove system fields
        id: undefined as any,
        created_date: undefined as any,
        last_modified_date: undefined as any,
        created_by_id: undefined,
        last_modified_by_id: undefined
      };

      return apiClient.post('/system/email_template', { resource: [duplicateData] });
    },
    onSuccess: (response, { newName }) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.all });
      
      // Show success notification
      notification.success(
        `Email template duplicated as "${newName}" successfully`,
        'Template Duplicated'
      );
      
      finalConfig.onSuccess?.(response);
    },
    onError: (error: ApiError, { newName }) => {
      // Show error notification
      notification.error(
        `Failed to duplicate email template as "${newName}": ${error.message}`,
        'Duplication Failed'
      );
      
      finalConfig.onError?.(error);
    },
    retry: finalConfig.retryCount,
    retryDelay: calculateRetryDelay
  });

  /**
   * Preview email template mutation
   */
  const previewMutation = useMutation({
    mutationFn: async ({ id, testData }: { id: number; testData?: Record<string, any> }): Promise<EmailTemplatePreview> => {
      const body = testData ? { test_data: testData } : {};
      return apiClient.post(`/system/email_template/${id}/preview`, body);
    },
    onError: (error: ApiError) => {
      notification.error(
        `Failed to preview template: ${error.message}`,
        'Preview Failed'
      );
    }
  });

  /**
   * Test email template mutation
   */
  const testMutation = useMutation({
    mutationFn: async (test: EmailTemplateTest): Promise<EmailTemplateTestResult> => {
      return apiClient.post(`/system/email_template/${test.template_id}/test`, test);
    },
    onSuccess: (result, test) => {
      if (result.success) {
        notification.success(
          `Test email sent successfully to ${test.test_email}`,
          'Test Email Sent'
        );
      } else {
        notification.warning(
          result.message || 'Test email validation completed with warnings',
          'Test Completed'
        );
      }
    },
    onError: (error: ApiError, test) => {
      notification.error(
        `Failed to test template: ${error.message}`,
        'Test Failed'
      );
    }
  });

  /**
   * Cache management functions
   */
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.all });
  }, [queryClient]);

  const refreshTemplate = useCallback((id: number) => {
    queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(id) });
  }, [queryClient]);

  /**
   * CRUD operation wrappers with proper error handling
   */
  const createTemplate = useCallback(async (data: EmailTemplateRequest): Promise<EmailTemplateOperationResult> => {
    try {
      const response = await createMutation.mutateAsync(data);
      return {
        success: true,
        data: response.resource?.[0] ? { ...data, id: response.resource[0].id } as EmailTemplate : undefined,
        message: 'Template created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create template',
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_ERROR' }]
      };
    }
  }, [createMutation]);

  const updateTemplate = useCallback(async (id: number, data: EmailTemplateRequest): Promise<EmailTemplateOperationResult> => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return {
        success: true,
        data: { ...data, id } as EmailTemplate,
        message: 'Template updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update template',
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error', code: 'UPDATE_ERROR' }]
      };
    }
  }, [updateMutation]);

  const deleteTemplate = useCallback(async (id: number): Promise<EmailTemplateOperationResult> => {
    try {
      await deleteMutation.mutateAsync(id);
      return {
        success: true,
        message: 'Template deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete template',
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error', code: 'DELETE_ERROR' }]
      };
    }
  }, [deleteMutation]);

  const duplicateTemplate = useCallback(async (id: number, newName: string): Promise<EmailTemplateOperationResult> => {
    try {
      const response = await duplicateMutation.mutateAsync({ id, newName });
      return {
        success: true,
        data: response.resource?.[0] ? { id: response.resource[0].id, name: newName } as EmailTemplate : undefined,
        message: 'Template duplicated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to duplicate template',
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error', code: 'DUPLICATE_ERROR' }]
      };
    }
  }, [duplicateMutation]);

  const previewTemplate = useCallback(async (id: number, testData?: Record<string, any>): Promise<EmailTemplatePreview> => {
    return previewMutation.mutateAsync({ id, testData });
  }, [previewMutation]);

  const testTemplate = useCallback(async (test: EmailTemplateTest): Promise<EmailTemplateTestResult> => {
    return testMutation.mutateAsync(test);
  }, [testMutation]);

  // Compute derived state
  const emailTemplates = useMemo(() => emailTemplatesData?.resource || [], [emailTemplatesData]);
  const emailTemplate = useMemo(() => emailTemplateData?.resource?.[0], [emailTemplateData]);
  const isLoading = isLoadingList || isLoadingTemplate;
  const isError = isErrorList || isErrorTemplate;
  const error = (errorList || errorTemplate) as ApiError | null;
  const refetch = templateId ? refetchTemplate : refetchList;

  return {
    // Query operations
    emailTemplates,
    emailTemplate,
    isLoading,
    isError,
    error,
    refetch,
    
    // Mutation operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Template operations
    previewTemplate,
    testTemplate,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPreviewing: previewMutation.isPending,
    isTesting: testMutation.isPending,
    
    // Cache management
    invalidateQueries,
    refreshTemplate,
    rollbackOptimisticUpdate
  };
}

/**
 * Export hook and types for external use
 */
export type { UseEmailTemplateReturn, EmailTemplateHookConfig };
export default useEmailTemplate;