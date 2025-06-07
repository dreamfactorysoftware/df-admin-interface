/**
 * Email templates management hook
 * Provides CRUD operations, caching, and state management for email templates
 * Replaces Angular EMAIL_TEMPLATES_SERVICE_TOKEN with React Query patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import {
  EmailTemplate,
  EmailTemplatePayload,
  EmailTemplateListResponse,
  EmailTemplateQueryOptions,
  EmailTemplateStore,
  EMAIL_TEMPLATE_CONSTANTS,
  EMAIL_TEMPLATE_QUERY_KEYS,
} from '@/types/email-templates';
import type { GenericListResponse } from '@/types/api';

// Zustand store for email template workflow state
const useEmailTemplateStore = create<EmailTemplateStore>()(
  devtools(
    (set, get) => ({
      // State
      selectedTemplate: undefined,
      isCreating: false,
      isEditing: false,
      filters: {},
      searchQuery: '',
      sortBy: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_SORT,
      sortOrder: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_ORDER,
      currentPage: 1,
      pageSize: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_PAGE_SIZE,

      // Actions
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setCreating: (creating) => set({ isCreating: creating }),
      setEditing: (editing) => set({ isEditing: editing }),
      setFilters: (filters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...filters },
          currentPage: 1, // Reset to first page when filtering
        })),
      setSearchQuery: (query) => 
        set({ 
          searchQuery: query,
          currentPage: 1, // Reset to first page when searching
        }),
      setSorting: (sortBy, order) => 
        set({ 
          sortBy, 
          sortOrder: order,
          currentPage: 1, // Reset to first page when sorting
        }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setPageSize: (size) => 
        set({ 
          pageSize: size,
          currentPage: 1, // Reset to first page when changing page size
        }),
      resetFilters: () => 
        set({
          filters: {},
          searchQuery: '',
          currentPage: 1,
        }),
      resetWorkflow: () => 
        set({
          selectedTemplate: undefined,
          isCreating: false,
          isEditing: false,
          filters: {},
          searchQuery: '',
          sortBy: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_SORT,
          sortOrder: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_ORDER,
          currentPage: 1,
          pageSize: EMAIL_TEMPLATE_CONSTANTS.DEFAULT_PAGE_SIZE,
        }),
    }),
    { name: 'email-template-store' }
  )
);

// API functions
const emailTemplateApi = {
  async getAll(options: EmailTemplateQueryOptions = {}): Promise<EmailTemplateListResponse> {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.filter) params.append('filter', options.filter);
    if (options.fields) params.append('fields', options.fields);
    if (options.sort) params.append('sort', options.sort);
    if (options.order) params.append('order', options.order);

    const response = await apiClient.get<GenericListResponse<EmailTemplate>>(
      `/api/v2/system/email_template?${params.toString()}`
    );

    return {
      resource: response.resource,
      meta: response.meta,
    };
  },

  async getById(id: number): Promise<EmailTemplate> {
    const response = await apiClient.get<EmailTemplate>(
      `/api/v2/system/email_template/${id}?fields=*`
    );
    return response;
  },

  async create(payload: EmailTemplatePayload): Promise<EmailTemplate> {
    const response = await apiClient.post<EmailTemplate>(
      '/api/v2/system/email_template',
      payload
    );
    return response;
  },

  async update(id: number, payload: Partial<EmailTemplatePayload>): Promise<EmailTemplate> {
    const response = await apiClient.patch<EmailTemplate>(
      `/api/v2/system/email_template/${id}`,
      payload
    );
    return response;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v2/system/email_template/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.delete('/api/v2/system/email_template', {
      data: { ids },
    });
  },
};

// Main hook for email templates management
export function useEmailTemplates() {
  const queryClient = useQueryClient();
  const store = useEmailTemplateStore();

  // Build query options from store state
  const queryOptions = useMemo<EmailTemplateQueryOptions>(() => {
    const options: EmailTemplateQueryOptions = {
      limit: store.pageSize,
      offset: (store.currentPage - 1) * store.pageSize,
      fields: '*',
    };

    // Add sorting
    if (store.sortBy) {
      options.sort = store.sortBy;
      options.order = store.sortOrder;
    }

    // Build filter string
    const filters: string[] = [];
    
    if (store.searchQuery) {
      // Search across name and description
      filters.push(`(name like "%${store.searchQuery}%" or description like "%${store.searchQuery}%")`);
    }

    if (store.filters.name) {
      filters.push(`name like "%${store.filters.name}%"`);
    }

    if (store.filters.description) {
      filters.push(`description like "%${store.filters.description}%"`);
    }

    if (store.filters.dateRange?.start) {
      filters.push(`created_date >= "${store.filters.dateRange.start}"`);
    }

    if (store.filters.dateRange?.end) {
      filters.push(`created_date <= "${store.filters.dateRange.end}"`);
    }

    if (filters.length > 0) {
      options.filter = filters.join(' and ');
    }

    return options;
  }, [store]);

  // Email templates list query
  const emailTemplatesQuery = useQuery({
    queryKey: EMAIL_TEMPLATE_QUERY_KEYS.list(queryOptions),
    queryFn: () => emailTemplateApi.getAll(queryOptions),
    staleTime: EMAIL_TEMPLATE_CONSTANTS.STALE_TIME,
    gcTime: EMAIL_TEMPLATE_CONSTANTS.CACHE_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Email template detail query
  const useEmailTemplate = (id?: number) => {
    return useQuery({
      queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(id!),
      queryFn: () => emailTemplateApi.getById(id!),
      enabled: !!id,
      staleTime: EMAIL_TEMPLATE_CONSTANTS.STALE_TIME,
      gcTime: EMAIL_TEMPLATE_CONSTANTS.CACHE_TIME,
    });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: emailTemplateApi.create,
    onSuccess: () => {
      // Invalidate and refetch email templates list
      queryClient.invalidateQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists(),
      });
      store.setCreating(false);
    },
    onError: (error) => {
      console.error('Failed to create email template:', error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmailTemplatePayload> }) =>
      emailTemplateApi.update(id, payload),
    onSuccess: (updatedTemplate) => {
      // Update specific template in cache
      queryClient.setQueryData(
        EMAIL_TEMPLATE_QUERY_KEYS.detail(updatedTemplate.id),
        updatedTemplate
      );
      // Invalidate list to refresh
      queryClient.invalidateQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists(),
      });
      store.setEditing(false);
      store.setSelectedTemplate(undefined);
    },
    onError: (error) => {
      console.error('Failed to update email template:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: emailTemplateApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(deletedId),
      });
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists(),
      });
      // Clear selection if deleted template was selected
      if (store.selectedTemplate?.id === deletedId) {
        store.setSelectedTemplate(undefined);
      }
    },
    onError: (error) => {
      console.error('Failed to delete email template:', error);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: emailTemplateApi.bulkDelete,
    onSuccess: () => {
      // Invalidate all email template queries
      queryClient.invalidateQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.all,
      });
      store.setSelectedTemplate(undefined);
    },
    onError: (error) => {
      console.error('Failed to bulk delete email templates:', error);
    },
  });

  // Refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: EMAIL_TEMPLATE_QUERY_KEYS.lists(),
    });
  }, [queryClient]);

  // Prefetch template details
  const prefetchTemplate = useCallback(
    (id: number) => {
      queryClient.prefetchQuery({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(id),
        queryFn: () => emailTemplateApi.getById(id),
        staleTime: EMAIL_TEMPLATE_CONSTANTS.STALE_TIME,
      });
    },
    [queryClient]
  );

  return {
    // Data
    emailTemplates: emailTemplatesQuery.data?.resource || [],
    totalCount: emailTemplatesQuery.data?.meta.total || 0,
    
    // Loading states
    isLoading: emailTemplatesQuery.isLoading,
    isFetching: emailTemplatesQuery.isFetching,
    isError: emailTemplatesQuery.isError,
    error: emailTemplatesQuery.error,
    
    // Mutations
    createEmailTemplate: createMutation.mutate,
    updateEmailTemplate: updateMutation.mutate,
    deleteEmailTemplate: deleteMutation.mutate,
    bulkDeleteEmailTemplates: bulkDeleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    
    // Store state and actions
    ...store,
    
    // Utility functions
    refresh,
    prefetchTemplate,
    useEmailTemplate,
  };
}

// Export store for direct access if needed
export { useEmailTemplateStore };

// Export API functions for direct use
export { emailTemplateApi };