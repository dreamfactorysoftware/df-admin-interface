/**
 * React Query-based custom hooks for email template management.
 * 
 * Provides comprehensive email template data fetching with advanced caching,
 * TTL configuration, and related data loading. Replaces Angular DfEmailTemplatesResolver
 * and DfEmailTemplateDetailsResolver with React Query useQuery hooks optimized for
 * React 19 and Next.js 15.1+ environments.
 * 
 * Features:
 * - Intelligent caching with 300s stale time and 900s cache time
 * - Background revalidation for fresh data
 * - Optional parameter handling for template ID extraction
 * - Backend API compatibility with fields and related parameters
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @fileoverview Email template data fetching hooks
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { 
  GenericListResponse, 
  GenericErrorResponse 
} from '@/types/generic-http';
import type { EmailTemplate } from '@/types/email-templates';

// ============================================================================
// Query Key Factories
// ============================================================================

/**
 * Email template query key factory for consistent cache management
 */
export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  lists: () => [...emailTemplateKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...emailTemplateKeys.lists(), filters] as const,
  details: () => [...emailTemplateKeys.all, 'detail'] as const,
  detail: (id: number) => [...emailTemplateKeys.details(), id] as const,
} as const;

// ============================================================================
// Cache Configuration Constants
// ============================================================================

/**
 * React Query cache configuration for email templates
 * Per React/Next.js Integration Requirements: cache hit responses under 50ms
 */
const EMAIL_TEMPLATE_CACHE_CONFIG = {
  // Data is fresh for 5 minutes (300 seconds)
  staleTime: 5 * 60 * 1000,
  // Data stays in cache for 15 minutes (900 seconds)
  cacheTime: 15 * 60 * 1000,
  // Enable background refetch while stale
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
  // Retry failed requests up to 3 times
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// ============================================================================
// Email Templates List Hook
// ============================================================================

/**
 * Custom hook for fetching email templates list with intelligent caching.
 * 
 * Replaces Angular DfEmailTemplatesResolver by implementing React Query useQuery
 * with TTL configuration and background revalidation per Section 4.1 system workflows.
 * 
 * @param options - Query options for customization
 * @param options.includeCount - Whether to include total count in response
 * @param options.fields - Specific fields to retrieve (defaults to '*')
 * @param options.related - Related data to include (defaults to 'role_by_role_id')
 * @param options.enabled - Whether to enable the query (defaults to true)
 * @returns UseQueryResult containing email templates list data
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, error } = useEmailTemplates();
 * 
 * // With custom options
 * const { data, isLoading, error } = useEmailTemplates({
 *   includeCount: true,
 *   fields: 'id,name,description'
 * });
 * 
 * // Conditional fetching
 * const { data, isLoading, error } = useEmailTemplates({
 *   enabled: userHasPermission
 * });
 * ```
 */
export function useEmailTemplates(options: {
  includeCount?: boolean;
  fields?: string;
  related?: string;
  enabled?: boolean;
} = {}): UseQueryResult<GenericListResponse<EmailTemplate>, Error> {
  const {
    includeCount = false,
    fields = '*',
    related = 'role_by_role_id',
    enabled = true,
  } = options;

  return useQuery({
    queryKey: emailTemplateKeys.list({ includeCount, fields, related }),
    queryFn: async (): Promise<GenericListResponse<EmailTemplate>> => {
      try {
        // Build query parameters for backend API compatibility
        const params: Record<string, any> = {
          fields,
          related,
        };

        // Add include_count parameter if requested
        if (includeCount) {
          params.include_count = true;
        }

        // Call API endpoint for email templates
        const response = await apiGet<GenericListResponse<EmailTemplate>>(
          '/api/v2/system/email_template',
          {
            ...params,
            snackbarError: 'Failed to load email templates',
          }
        );

        return response;
      } catch (error) {
        // Transform error for consistent error handling
        if (error instanceof Error) {
          throw new Error(`Email templates fetch failed: ${error.message}`);
        }
        throw new Error('Unknown error occurred while fetching email templates');
      }
    },
    enabled,
    ...EMAIL_TEMPLATE_CACHE_CONFIG,
  });
}

// ============================================================================
// Email Template Details Hook
// ============================================================================

/**
 * Custom hook for fetching individual email template details with caching.
 * 
 * Replaces Angular DfEmailTemplateDetailsResolver by implementing React Query useQuery
 * with conditional parameter handling for template ID extraction per Section 7.1
 * Core UI Technologies.
 * 
 * @param id - Email template ID (optional, defaults to 0 for create mode)
 * @param options - Query options for customization
 * @param options.fields - Specific fields to retrieve (defaults to '*')
 * @param options.related - Related data to include (defaults to 'role_by_role_id')
 * @param options.enabled - Whether to enable the query (defaults to true when id > 0)
 * @returns UseQueryResult containing email template details data
 * 
 * @example
 * ```tsx
 * // Basic usage for editing existing template
 * const { data, isLoading, error } = useEmailTemplate(123);
 * 
 * // Create mode (no fetching)
 * const { data, isLoading, error } = useEmailTemplate(0);
 * 
 * // With custom options
 * const { data, isLoading, error } = useEmailTemplate(123, {
 *   fields: 'id,name,subject,bodyHtml',
 *   related: 'role_by_role_id'
 * });
 * 
 * // Conditional fetching based on ID
 * const { data, isLoading, error } = useEmailTemplate(templateId, {
 *   enabled: templateId > 0
 * });
 * ```
 */
export function useEmailTemplate(
  id: number = 0,
  options: {
    fields?: string;
    related?: string;
    enabled?: boolean;
  } = {}
): UseQueryResult<EmailTemplate | null, Error> {
  const {
    fields = '*',
    related = 'role_by_role_id',
    enabled,
  } = options;

  // Only enable query if ID is provided and > 0 (edit mode)
  const shouldFetch = enabled !== undefined ? enabled : id > 0;

  return useQuery({
    queryKey: emailTemplateKeys.detail(id),
    queryFn: async (): Promise<EmailTemplate | null> => {
      // Return null for create mode (id = 0)
      if (id <= 0) {
        return null;
      }

      try {
        // Build query parameters for backend API compatibility
        const params: Record<string, any> = {
          fields,
          related,
        };

        // Call API endpoint for specific email template
        const response = await apiGet<EmailTemplate>(
          `/api/v2/system/email_template/${id}`,
          {
            ...params,
            snackbarError: 'Failed to load email template',
          }
        );

        return response;
      } catch (error) {
        // Transform error for consistent error handling
        if (error instanceof Error) {
          throw new Error(`Email template fetch failed: ${error.message}`);
        }
        throw new Error('Unknown error occurred while fetching email template');
      }
    },
    enabled: shouldFetch,
    ...EMAIL_TEMPLATE_CACHE_CONFIG,
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useEmailTemplates,
  useEmailTemplate,
  emailTemplateKeys,
};