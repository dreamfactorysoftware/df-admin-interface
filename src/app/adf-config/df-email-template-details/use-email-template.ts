/**
 * Custom React hook for email template CRUD operations with intelligent caching.
 * 
 * Provides comprehensive email template management functionality using React Query
 * for intelligent caching, optimistic updates, and automatic error recovery.
 * Replaces Angular service injection patterns with modern React hooks architecture
 * optimized for React 19 and Next.js 15.1+.
 * 
 * Features:
 * - SWR/React Query for intelligent caching and synchronization
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Optimistic updates with automatic rollback on errors
 * - Comprehensive error handling and retry logic
 * - Cache invalidation strategies for related queries
 * 
 * @fileoverview Email template CRUD operations hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from '../../../lib/api-client';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Email template entity interface
 */
export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  defaults?: any;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}

/**
 * Email template payload for create/update operations
 */
export interface EmailTemplatePayload {
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
}

/**
 * Email template list response from API
 */
export interface EmailTemplateListResponse {
  success: boolean;
  resource: EmailTemplate[];
  meta?: {
    count?: number;
    limit?: number;
    offset?: number;
  };
}

/**
 * Email template detail response from API
 */
export interface EmailTemplateResponse {
  success: boolean;
  resource: EmailTemplate;
}

/**
 * Email template create/update response from API
 */
export interface EmailTemplateMutationResponse {
  success: boolean;
  resource: EmailTemplate | EmailTemplate[];
}

/**
 * Hook options for email template operations
 */
export interface UseEmailTemplateOptions {
  /** Enable background revalidation on focus */
  revalidateOnFocus?: boolean;
  /** Enable background revalidation on reconnect */
  revalidateOnReconnect?: boolean;
  /** Cache time in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  /** Stale time in milliseconds (default: 1 minute) */
  staleTime?: number;
  /** Retry configuration */
  retry?: number | boolean;
  /** Success callback for mutations */
  onSuccess?: (data: any) => void;
  /** Error callback for mutations */
  onError?: (error: Error) => void;
}

/**
 * Query filters for email template list
 */
export interface EmailTemplateFilters {
  /** Filter by name pattern */
  name?: string;
  /** Filter by description pattern */
  description?: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Include total count in response */
  includeCount?: boolean;
}

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Query key factory for email template queries
 * Provides consistent cache key generation with type safety
 */
export const emailTemplateKeys = {
  /** All email template queries */
  all: ['email-templates'] as const,
  
  /** All list queries */
  lists: () => [...emailTemplateKeys.all, 'list'] as const,
  
  /** Specific list query with filters */
  list: (filters?: EmailTemplateFilters) => 
    [...emailTemplateKeys.lists(), filters] as const,
  
  /** All detail queries */
  details: () => [...emailTemplateKeys.all, 'detail'] as const,
  
  /** Specific detail query */
  detail: (id: number) => 
    [...emailTemplateKeys.details(), id] as const,
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/** Email template API endpoints */
const EMAIL_TEMPLATE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/system/email_template`,
  DETAIL: (id: number) => `${API_BASE_URL}/system/email_template/${id}`,
  CREATE: `${API_BASE_URL}/system/email_template`,
  UPDATE: (id: number) => `${API_BASE_URL}/system/email_template/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/system/email_template/${id}`,
} as const;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom React hook for email template CRUD operations
 * 
 * @param options Configuration options for the hook
 * @returns Object containing query/mutation functions and state
 */
export function useEmailTemplate(options: UseEmailTemplateOptions = {}) {
  const queryClient = useQueryClient();
  
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute  
    retry = 3,
    onSuccess,
    onError,
  } = options;

  // ============================================================================
  // Query Functions
  // ============================================================================

  /**
   * Get email template list with optional filtering
   */
  const useEmailTemplateList = useCallback((
    filters?: EmailTemplateFilters,
    queryOptions?: Partial<UseQueryOptions<EmailTemplateListResponse>>
  ) => {
    return useQuery({
      queryKey: emailTemplateKeys.list(filters),
      queryFn: async (): Promise<EmailTemplateListResponse> => {
        const params: Record<string, any> = {};
        
        if (filters) {
          if (filters.name) params.filter = `name like '%${filters.name}%'`;
          if (filters.description) {
            const descFilter = `description like '%${filters.description}%'`;
            params.filter = params.filter 
              ? `${params.filter} AND ${descFilter}`
              : descFilter;
          }
          if (filters.limit !== undefined) params.limit = filters.limit;
          if (filters.offset !== undefined) params.offset = filters.offset;
          if (filters.includeCount !== undefined) params.include_count = filters.includeCount;
        }
        
        return apiGet<EmailTemplateListResponse>(EMAIL_TEMPLATE_ENDPOINTS.LIST, {
          additionalParams: Object.entries(params).map(([key, value]) => ({ key, value })),
          includeCount: filters?.includeCount,
        });
      },
      staleTime,
      cacheTime,
      retry,
      refetchOnWindowFocus: revalidateOnFocus,
      refetchOnReconnect: revalidateOnReconnect,
      ...queryOptions,
    });
  }, [staleTime, cacheTime, retry, revalidateOnFocus, revalidateOnReconnect]);

  /**
   * Get single email template by ID
   */
  const useEmailTemplateDetail = useCallback((
    id: number,
    queryOptions?: Partial<UseQueryOptions<EmailTemplateResponse>>
  ) => {
    return useQuery({
      queryKey: emailTemplateKeys.detail(id),
      queryFn: async (): Promise<EmailTemplateResponse> => {
        return apiGet<EmailTemplateResponse>(EMAIL_TEMPLATE_ENDPOINTS.DETAIL(id), {
          fields: '*',
        });
      },
      staleTime,
      cacheTime,
      retry,
      refetchOnWindowFocus: revalidateOnFocus,
      refetchOnReconnect: revalidateOnReconnect,
      enabled: !!id && id > 0,
      ...queryOptions,
    });
  }, [staleTime, cacheTime, retry, revalidateOnFocus, revalidateOnReconnect]);

  // ============================================================================
  // Mutation Functions  
  // ============================================================================

  /**
   * Create new email template mutation
   */
  const useCreateEmailTemplate = useCallback(() => {
    return useMutation({
      mutationFn: async (payload: EmailTemplatePayload): Promise<EmailTemplateMutationResponse> => {
        return apiPost<EmailTemplateMutationResponse>(EMAIL_TEMPLATE_ENDPOINTS.CREATE, {
          resource: [payload],
        }, {
          snackbarSuccess: 'emailTemplates.alerts.createSuccess',
        });
      },
      onMutate: async (newTemplate: EmailTemplatePayload) => {
        // Cancel any outgoing refetches to avoid optimistic update conflicts
        await queryClient.cancelQueries({ queryKey: emailTemplateKeys.lists() });

        // Snapshot the previous value for potential rollback
        const previousTemplates = queryClient.getQueryData<EmailTemplateListResponse>(
          emailTemplateKeys.list()
        );

        // Optimistically update the cache
        if (previousTemplates) {
          const optimisticTemplate: EmailTemplate = {
            id: Date.now(), // Temporary ID
            ...newTemplate,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString(),
          };

          queryClient.setQueryData<EmailTemplateListResponse>(
            emailTemplateKeys.list(),
            {
              ...previousTemplates,
              resource: [optimisticTemplate, ...previousTemplates.resource],
              meta: previousTemplates.meta ? {
                ...previousTemplates.meta,
                count: (previousTemplates.meta.count || 0) + 1,
              } : undefined,
            }
          );
        }

        return { previousTemplates };
      },
      onError: (error: Error, newTemplate: EmailTemplatePayload, context) => {
        // Rollback optimistic update
        if (context?.previousTemplates) {
          queryClient.setQueryData(
            emailTemplateKeys.list(),
            context.previousTemplates
          );
        }
        
        onError?.(error);
      },
      onSuccess: (data: EmailTemplateMutationResponse) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() });
        
        onSuccess?.(data);
      },
      retry,
    });
  }, [queryClient, retry, onSuccess, onError]);

  /**
   * Update existing email template mutation
   */
  const useUpdateEmailTemplate = useCallback(() => {
    return useMutation({
      mutationFn: async ({ 
        id, 
        payload 
      }: { 
        id: number; 
        payload: EmailTemplatePayload 
      }): Promise<EmailTemplateMutationResponse> => {
        return apiPut<EmailTemplateMutationResponse>(
          EMAIL_TEMPLATE_ENDPOINTS.UPDATE(id), 
          payload,
          {
            snackbarSuccess: 'emailTemplates.alerts.updateSuccess',
          }
        );
      },
      onMutate: async ({ id, payload }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: emailTemplateKeys.detail(id) });
        await queryClient.cancelQueries({ queryKey: emailTemplateKeys.lists() });

        // Snapshot previous values
        const previousTemplate = queryClient.getQueryData<EmailTemplateResponse>(
          emailTemplateKeys.detail(id)
        );
        const previousTemplates = queryClient.getQueryData<EmailTemplateListResponse>(
          emailTemplateKeys.list()
        );

        // Optimistically update detail cache
        if (previousTemplate) {
          const optimisticTemplate: EmailTemplate = {
            ...previousTemplate.resource,
            ...payload,
            lastModifiedDate: new Date().toISOString(),
          };

          queryClient.setQueryData<EmailTemplateResponse>(
            emailTemplateKeys.detail(id),
            {
              ...previousTemplate,
              resource: optimisticTemplate,
            }
          );
        }

        // Optimistically update list cache
        if (previousTemplates) {
          const updatedResource = previousTemplates.resource.map(template =>
            template.id === id
              ? { ...template, ...payload, lastModifiedDate: new Date().toISOString() }
              : template
          );

          queryClient.setQueryData<EmailTemplateListResponse>(
            emailTemplateKeys.list(),
            {
              ...previousTemplates,
              resource: updatedResource,
            }
          );
        }

        return { previousTemplate, previousTemplates };
      },
      onError: (error: Error, { id }, context) => {
        // Rollback optimistic updates
        if (context?.previousTemplate) {
          queryClient.setQueryData(
            emailTemplateKeys.detail(id),
            context.previousTemplate
          );
        }
        if (context?.previousTemplates) {
          queryClient.setQueryData(
            emailTemplateKeys.list(),
            context.previousTemplates
          );
        }
        
        onError?.(error);
      },
      onSuccess: (data: EmailTemplateMutationResponse, { id }) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: emailTemplateKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() });
        
        onSuccess?.(data);
      },
      retry,
    });
  }, [queryClient, retry, onSuccess, onError]);

  /**
   * Delete email template mutation
   */
  const useDeleteEmailTemplate = useCallback(() => {
    return useMutation({
      mutationFn: async (id: number): Promise<void> => {
        return apiDelete<void>(EMAIL_TEMPLATE_ENDPOINTS.DELETE(id), {
          snackbarSuccess: 'emailTemplates.alerts.deleteSuccess',
        });
      },
      onMutate: async (id: number) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: emailTemplateKeys.lists() });

        // Snapshot previous values
        const previousTemplates = queryClient.getQueryData<EmailTemplateListResponse>(
          emailTemplateKeys.list()
        );

        // Optimistically remove from cache
        if (previousTemplates) {
          const filteredResource = previousTemplates.resource.filter(
            template => template.id !== id
          );

          queryClient.setQueryData<EmailTemplateListResponse>(
            emailTemplateKeys.list(),
            {
              ...previousTemplates,
              resource: filteredResource,
              meta: previousTemplates.meta ? {
                ...previousTemplates.meta,
                count: Math.max((previousTemplates.meta.count || 0) - 1, 0),
              } : undefined,
            }
          );
        }

        return { previousTemplates };
      },
      onError: (error: Error, id: number, context) => {
        // Rollback optimistic update
        if (context?.previousTemplates) {
          queryClient.setQueryData(
            emailTemplateKeys.list(),
            context.previousTemplates
          );
        }
        
        onError?.(error);
      },
      onSuccess: (data: void, id: number) => {
        // Remove detail cache and invalidate list
        queryClient.removeQueries({ queryKey: emailTemplateKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() });
        
        onSuccess?.(data);
      },
      retry,
    });
  }, [queryClient, retry, onSuccess, onError]);

  // ============================================================================
  // Cache Management Functions
  // ============================================================================

  /**
   * Manually invalidate all email template queries
   */
  const invalidateEmailTemplates = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
  }, [queryClient]);

  /**
   * Manually invalidate email template list queries
   */
  const invalidateEmailTemplateList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() });
  }, [queryClient]);

  /**
   * Manually invalidate specific email template detail
   */
  const invalidateEmailTemplateDetail = useCallback(async (id: number) => {
    await queryClient.invalidateQueries({ queryKey: emailTemplateKeys.detail(id) });
  }, [queryClient]);

  /**
   * Prefetch email template list
   */
  const prefetchEmailTemplateList = useCallback(async (filters?: EmailTemplateFilters) => {
    await queryClient.prefetchQuery({
      queryKey: emailTemplateKeys.list(filters),
      queryFn: async (): Promise<EmailTemplateListResponse> => {
        const params: Record<string, any> = {};
        
        if (filters) {
          if (filters.name) params.filter = `name like '%${filters.name}%'`;
          if (filters.description) {
            const descFilter = `description like '%${filters.description}%'`;
            params.filter = params.filter 
              ? `${params.filter} AND ${descFilter}`
              : descFilter;
          }
          if (filters.limit !== undefined) params.limit = filters.limit;
          if (filters.offset !== undefined) params.offset = filters.offset;
          if (filters.includeCount !== undefined) params.include_count = filters.includeCount;
        }
        
        return apiGet<EmailTemplateListResponse>(EMAIL_TEMPLATE_ENDPOINTS.LIST, {
          additionalParams: Object.entries(params).map(([key, value]) => ({ key, value })),
          includeCount: filters?.includeCount,
        });
      },
      staleTime,
    });
  }, [queryClient, staleTime]);

  /**
   * Prefetch email template detail
   */
  const prefetchEmailTemplateDetail = useCallback(async (id: number) => {
    await queryClient.prefetchQuery({
      queryKey: emailTemplateKeys.detail(id),
      queryFn: async (): Promise<EmailTemplateResponse> => {
        return apiGet<EmailTemplateResponse>(EMAIL_TEMPLATE_ENDPOINTS.DETAIL(id), {
          fields: '*',
        });
      },
      staleTime,
    });
  }, [queryClient, staleTime]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return useMemo(() => ({
    // Query hooks
    useEmailTemplateList,
    useEmailTemplateDetail,
    
    // Mutation hooks
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    useDeleteEmailTemplate,
    
    // Cache management
    invalidateEmailTemplates,
    invalidateEmailTemplateList,
    invalidateEmailTemplateDetail,
    prefetchEmailTemplateList,
    prefetchEmailTemplateDetail,
    
    // Query key factory (useful for external cache manipulation)
    queryKeys: emailTemplateKeys,
  }), [
    useEmailTemplateList,
    useEmailTemplateDetail,
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    useDeleteEmailTemplate,
    invalidateEmailTemplates,
    invalidateEmailTemplateList,
    invalidateEmailTemplateDetail,
    prefetchEmailTemplateList,
    prefetchEmailTemplateDetail,
  ]);
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Convenience hook for email template list operations
 */
export function useEmailTemplateList(
  filters?: EmailTemplateFilters,
  options?: UseEmailTemplateOptions
) {
  const { useEmailTemplateList: useList } = useEmailTemplate(options);
  return useList(filters);
}

/**
 * Convenience hook for email template detail operations
 */
export function useEmailTemplateDetail(
  id: number,
  options?: UseEmailTemplateOptions
) {
  const { useEmailTemplateDetail: useDetail } = useEmailTemplate(options);
  return useDetail(id);
}

/**
 * Convenience hook for email template mutations
 */
export function useEmailTemplateMutations(options?: UseEmailTemplateOptions) {
  const { 
    useCreateEmailTemplate,
    useUpdateEmailTemplate,
    useDeleteEmailTemplate 
  } = useEmailTemplate(options);
  
  return {
    createEmailTemplate: useCreateEmailTemplate(),
    updateEmailTemplate: useUpdateEmailTemplate(),
    deleteEmailTemplate: useDeleteEmailTemplate(),
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useEmailTemplate;