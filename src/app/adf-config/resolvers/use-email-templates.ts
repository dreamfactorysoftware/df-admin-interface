/**
 * Email Templates React Query Hooks
 * 
 * React Query-based custom hooks providing both email template list (useEmailTemplates) 
 * and individual email template details (useEmailTemplate) data fetching with advanced 
 * caching and related data loading. Replaces the Angular DfEmailTemplatesResolver and 
 * DfEmailTemplateDetailsResolver by implementing React Query useQuery hooks with TTL 
 * configuration, conditional parameter handling for template ID extraction, and 
 * specialized field selection patterns including role relationship loading.
 * 
 * Performance Requirements:
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - TanStack React Query 5.0.0 for complex server-state management
 * - TTL configuration: staleTime: 300s, cacheTime: 900s with automatic background revalidation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiListResponse, ApiRequestOptions } from '@/types/api';

// Email template types - importing from the migrated types
interface EmailTemplate {
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
 * Query Keys for React Query caching
 * Follows TanStack React Query best practices for query key structure
 */
export const emailTemplatesKeys = {
  all: ['email-templates'] as const,
  lists: () => [...emailTemplatesKeys.all, 'list'] as const,
  list: (options?: ApiRequestOptions) => [...emailTemplatesKeys.lists(), options] as const,
  details: () => [...emailTemplatesKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...emailTemplatesKeys.details(), id] as const,
} as const;

/**
 * React Query configuration optimized for email template data fetching
 * Implements TTL configuration per React/Next.js Integration Requirements
 */
const EMAIL_TEMPLATES_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 300 seconds - Data is fresh for 5 minutes
  gcTime: 15 * 60 * 1000,   // 900 seconds - Keep in cache for 15 minutes (renamed from cacheTime in React Query v5)
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: 'stale' as const,
} as const;

/**
 * Custom hook for fetching email templates list
 * 
 * Replaces Angular DfEmailTemplatesResolver by implementing React Query useQuery 
 * hooks with intelligent caching and background revalidation. Transforms getAll 
 * with include_count placeholder to React Query list fetching per Section 4.2 
 * error handling and validation.
 * 
 * @param options - API request options for filtering, pagination, etc.
 * @param queryOptions - Additional React Query options
 * @returns React Query result with email templates list
 * 
 * @example
 * ```tsx
 * const { data: templates, isLoading, error, refetch } = useEmailTemplates({
 *   limit: 50,
 *   sort: 'name',
 *   include_count: true
 * });
 * ```
 */
export function useEmailTemplates(
  options: ApiRequestOptions = {},
  queryOptions?: Omit<UseQueryOptions<ApiListResponse<EmailTemplate>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiListResponse<EmailTemplate>, Error> {
  return useQuery({
    queryKey: emailTemplatesKeys.list(options),
    queryFn: async (): Promise<ApiListResponse<EmailTemplate>> => {
      // Prepare API request options with backend compatibility
      const requestOptions: ApiRequestOptions = {
        // Maintain fields: '*' and related: 'role_by_role_id' parameters for backend API compatibility
        fields: '*',
        related: 'role_by_role_id',
        include_count: true,
        ...options, // Allow override of defaults
      };

      // Build query string for API request
      const queryParams = new URLSearchParams();
      
      if (requestOptions.fields) {
        queryParams.append('fields', Array.isArray(requestOptions.fields) ? requestOptions.fields.join(',') : requestOptions.fields);
      }
      
      if (requestOptions.related) {
        queryParams.append('related', Array.isArray(requestOptions.related) ? requestOptions.related.join(',') : requestOptions.related);
      }
      
      if (requestOptions.include_count !== undefined) {
        queryParams.append('include_count', String(requestOptions.include_count));
      }
      
      if (requestOptions.limit !== undefined) {
        queryParams.append('limit', String(requestOptions.limit));
      }
      
      if (requestOptions.offset !== undefined) {
        queryParams.append('offset', String(requestOptions.offset));
      }
      
      if (requestOptions.sort) {
        queryParams.append('order', requestOptions.sort);
      }
      
      if (requestOptions.filter) {
        queryParams.append('filter', requestOptions.filter);
      }

      // Construct API endpoint URL
      const endpoint = `/system/email_template${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      try {
        const response = await apiClient.get(endpoint);
        
        // Transform response to match expected ApiListResponse format
        return {
          resource: response.resource || [],
          meta: {
            count: response.resource?.length || 0,
            limit: requestOptions.limit || 0,
            offset: requestOptions.offset || 0,
            total: response.meta?.count || response.resource?.length || 0,
          },
        } as ApiListResponse<EmailTemplate>;
      } catch (error) {
        // Enhanced error handling per Section 4.2 error handling and validation
        console.error('Failed to fetch email templates:', error);
        throw new Error(
          error instanceof Error 
            ? `Email templates fetch failed: ${error.message}`
            : 'Failed to fetch email templates'
        );
      }
    },
    ...EMAIL_TEMPLATES_QUERY_CONFIG,
    ...queryOptions,
  });
}

/**
 * Custom hook for fetching individual email template details
 * 
 * Replaces Angular DfEmailTemplateDetailsResolver by implementing React Query 
 * useQuery hooks with conditional parameter handling for template ID extraction. 
 * Converts Angular ActivatedRouteSnapshot parameter access to hook parameters 
 * (id optional, defaulting to 0) per Section 7.1 Core UI Technologies.
 * 
 * @param id - Email template ID (optional, defaults to 0 for new templates)
 * @param queryOptions - Additional React Query options
 * @returns React Query result with email template details
 * 
 * @example
 * ```tsx
 * const { data: template, isLoading, error } = useEmailTemplate(templateId, {
 *   enabled: !!templateId && templateId > 0
 * });
 * ```
 */
export function useEmailTemplate(
  id: number | string = 0,
  queryOptions?: Omit<UseQueryOptions<EmailTemplate>, 'queryKey' | 'queryFn'>
): UseQueryResult<EmailTemplate, Error> {
  // Convert id to number if it's a string, maintaining Angular compatibility
  const templateId = typeof id === 'string' ? parseInt(id, 10) || 0 : id;
  
  return useQuery({
    queryKey: emailTemplatesKeys.detail(templateId),
    queryFn: async (): Promise<EmailTemplate> => {
      // Skip API call if ID is 0 or invalid (new template case)
      if (!templateId || templateId <= 0) {
        throw new Error('Invalid email template ID provided');
      }

      // Prepare API request options maintaining backend compatibility
      const queryParams = new URLSearchParams({
        // Maintain fields: '*' and related: 'role_by_role_id' parameters per Section 0.2.6 minimal change clause
        fields: '*',
        related: 'role_by_role_id',
      });

      // Construct API endpoint URL for individual template
      const endpoint = `/system/email_template/${templateId}?${queryParams.toString()}`;
      
      try {
        const response = await apiClient.get(endpoint);
        
        // Return the template data directly
        return response as EmailTemplate;
      } catch (error) {
        // Enhanced error handling with specific error context
        console.error(`Failed to fetch email template ${templateId}:`, error);
        throw new Error(
          error instanceof Error 
            ? `Email template ${templateId} fetch failed: ${error.message}`
            : `Failed to fetch email template ${templateId}`
        );
      }
    },
    // Only enable query if we have a valid ID
    enabled: templateId > 0 && (queryOptions?.enabled !== false),
    ...EMAIL_TEMPLATES_QUERY_CONFIG,
    ...queryOptions,
  });
}

/**
 * Utility function to invalidate email templates cache
 * Useful for cache invalidation after mutations (create, update, delete)
 * 
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 * 
 * const queryClient = useQueryClient();
 * 
 * // Invalidate all email templates queries
 * queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });
 * 
 * // Invalidate specific template
 * queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.detail(templateId) });
 * ```
 */
export { emailTemplatesKeys as invalidateEmailTemplatesKeys };

/**
 * Pre-configured query options for common use cases
 * Provides reusable configurations for different scenarios
 */
export const emailTemplatesQueryOptions = {
  /**
   * Configuration for real-time updates (shorter stale time)
   */
  realTime: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
  },
  
  /**
   * Configuration for background sync (longer stale time)
   */
  background: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
  
  /**
   * Configuration for one-time fetch (no automatic refetching)
   */
  static: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  },
} as const;

/**
 * Type exports for external usage
 */
export type { EmailTemplate };
export type EmailTemplatesListResult = UseQueryResult<ApiListResponse<EmailTemplate>, Error>;
export type EmailTemplateResult = UseQueryResult<EmailTemplate, Error>;