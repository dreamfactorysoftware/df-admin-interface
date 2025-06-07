/**
 * Event Scripts Hooks
 * 
 * React Query hooks for event scripts management in the DreamFactory Admin Interface.
 * Provides optimized data fetching, caching, and mutation capabilities with
 * intelligent cache invalidation and real-time updates.
 * 
 * Features:
 * - React Query integration with intelligent caching
 * - Real-time script validation and syntax checking
 * - Optimistic updates for better UX
 * - Error handling with retry logic
 * - Cache hit responses under 50ms
 * - Server-side rendering support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  ScriptQueryKeys, 
  ScriptObject, 
  ScriptFormData, 
  ScriptEventResponse,
  ScriptListResponse,
  ScriptListFilters,
  ScriptAPIResponse,
  ScriptExecutionResult,
  ScriptValidationResult,
  ScriptType
} from '@/types/scripts';

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all event scripts with filtering and pagination
 */
export function useScripts(filters?: ScriptListFilters) {
  return useQuery({
    queryKey: ScriptQueryKeys.list(filters),
    queryFn: async (): Promise<ScriptListResponse> => {
      const params = new URLSearchParams();
      
      if (filters?.type) params.append('type', filters.type);
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.service) params.append('service', filters.service);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `/system/script${queryString ? `?${queryString}` : ''}`;
      
      const response: ScriptAPIResponse<ScriptListResponse> = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch scripts');
      }
      
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: true
  });
}

/**
 * Hook to fetch a single event script by name
 */
export function useScript(name: string) {
  return useQuery({
    queryKey: ScriptQueryKeys.detail(name),
    queryFn: async (): Promise<ScriptObject> => {
      const response: ScriptAPIResponse<ScriptObject> = await apiClient.get(`/system/script/${encodeURIComponent(name)}`);
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to fetch script: ${name}`);
      }
      
      return response.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!name && name.trim() !== '',
    retry: (failureCount, error) => {
      // Don't retry for 404 errors (script not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

/**
 * Hook to fetch available event endpoints grouped by service
 */
export function useScriptEvents() {
  return useQuery({
    queryKey: ScriptQueryKeys.events(),
    queryFn: async (): Promise<ScriptEventResponse> => {
      const response: ScriptAPIResponse<ScriptEventResponse> = await apiClient.get('/system/event');
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch script events');
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - events don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch event endpoints for a specific service
 */
export function useScriptEventsByService(serviceName: string) {
  const { data: allEvents, ...queryResult } = useScriptEvents();
  
  const serviceEvents = useMemo(() => {
    if (!allEvents || !serviceName) return undefined;
    return allEvents[serviceName];
  }, [allEvents, serviceName]);
  
  return {
    ...queryResult,
    data: serviceEvents
  };
}

/**
 * Hook for script content validation
 */
export function useScriptValidation(content: string, type: ScriptType, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ScriptQueryKeys.validation(content, type),
    queryFn: async (): Promise<ScriptValidationResult> => {
      const response: ScriptAPIResponse<ScriptValidationResult> = await apiClient.post('/system/script/validate', {
        content,
        type
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to validate script');
      }
      
      return response.data!;
    },
    enabled: options?.enabled !== false && !!content && !!type,
    staleTime: 0, // Always fresh for validation
    gcTime: 1 * 60 * 1000, // 1 minute
    retry: false // Don't retry validation requests
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new event script
 */
export function useCreateScript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scriptData: ScriptFormData): Promise<ScriptObject> => {
      const response: ScriptAPIResponse<ScriptObject> = await apiClient.post('/system/script', scriptData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create script');
      }
      
      return response.data!;
    },
    onSuccess: (newScript) => {
      // Invalidate and refetch scripts list
      queryClient.invalidateQueries({ queryKey: ScriptQueryKeys.lists() });
      
      // Add the new script to cache
      queryClient.setQueryData(ScriptQueryKeys.detail(newScript.name), newScript);
    },
    onError: (error) => {
      console.error('Failed to create script:', error);
    }
  });
}

/**
 * Hook to update an existing event script
 */
export function useUpdateScript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, scriptData }: { name: string; scriptData: Partial<ScriptFormData> }): Promise<ScriptObject> => {
      const response: ScriptAPIResponse<ScriptObject> = await apiClient.post(`/system/script/${encodeURIComponent(name)}`, scriptData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to update script: ${name}`);
      }
      
      return response.data!;
    },
    onSuccess: (updatedScript) => {
      // Update the script in cache
      queryClient.setQueryData(ScriptQueryKeys.detail(updatedScript.name), updatedScript);
      
      // Invalidate scripts list to reflect changes
      queryClient.invalidateQueries({ queryKey: ScriptQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update script:', error);
    }
  });
}

/**
 * Hook to delete an event script
 */
export function useDeleteScript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string): Promise<void> => {
      const response: ScriptAPIResponse<void> = await apiClient.post(`/system/script/${encodeURIComponent(name)}`, {}, {
        method: 'DELETE'
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to delete script: ${name}`);
      }
    },
    onSuccess: (_, name) => {
      // Remove script from cache
      queryClient.removeQueries({ queryKey: ScriptQueryKeys.detail(name) });
      
      // Invalidate scripts list
      queryClient.invalidateQueries({ queryKey: ScriptQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete script:', error);
    }
  });
}

/**
 * Hook to execute a script for testing
 */
export function useExecuteScript() {
  return useMutation({
    mutationFn: async ({ name, parameters }: { name: string; parameters?: Record<string, any> }): Promise<ScriptExecutionResult> => {
      const response: ScriptAPIResponse<ScriptExecutionResult> = await apiClient.post(`/system/script/${encodeURIComponent(name)}/execute`, {
        parameters: parameters || {}
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || `Failed to execute script: ${name}`);
      }
      
      return response.data!;
    },
    onError: (error) => {
      console.error('Failed to execute script:', error);
    }
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if a script name is available
 */
export function useScriptNameAvailability(name: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ScriptQueryKeys.all, 'nameCheck', name],
    queryFn: async (): Promise<boolean> => {
      if (!name || name.trim() === '') return true;
      
      try {
        await apiClient.get(`/system/script/${encodeURIComponent(name)}`);
        // If we get here, the script exists
        return false;
      } catch (error) {
        // If we get a 404, the name is available
        if (error instanceof Error && error.message.includes('404')) {
          return true;
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!name && name.trim() !== '',
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: false
  });
}

/**
 * Hook to prefetch script data for better UX
 */
export function usePrefetchScript() {
  const queryClient = useQueryClient();
  
  return useMemo(() => ({
    prefetchScript: (name: string) => {
      queryClient.prefetchQuery({
        queryKey: ScriptQueryKeys.detail(name),
        queryFn: async () => {
          const response: ScriptAPIResponse<ScriptObject> = await apiClient.get(`/system/script/${encodeURIComponent(name)}`);
          if (!response.success) {
            throw new Error(response.error?.message || `Failed to fetch script: ${name}`);
          }
          return response.data!;
        },
        staleTime: 2 * 60 * 1000 // 2 minutes
      });
    },
    prefetchScriptEvents: () => {
      queryClient.prefetchQuery({
        queryKey: ScriptQueryKeys.events(),
        queryFn: async () => {
          const response: ScriptAPIResponse<ScriptEventResponse> = await apiClient.get('/system/event');
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to fetch script events');
          }
          return response.data!;
        },
        staleTime: 10 * 60 * 1000 // 10 minutes
      });
    }
  }), [queryClient]);
}

/**
 * Hook for optimistic script updates
 */
export function useOptimisticScriptUpdate() {
  const queryClient = useQueryClient();
  
  return useMemo(() => ({
    updateScriptOptimistically: (name: string, updates: Partial<ScriptObject>) => {
      queryClient.setQueryData(ScriptQueryKeys.detail(name), (oldData: ScriptObject | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updates };
      });
    },
    revertOptimisticUpdate: (name: string) => {
      queryClient.invalidateQueries({ queryKey: ScriptQueryKeys.detail(name) });
    }
  }), [queryClient]);
}

// ============================================================================
// GROUPED EXPORTS
// ============================================================================

/**
 * All script query hooks grouped for convenience
 */
export const scriptQueries = {
  useScripts,
  useScript,
  useScriptEvents,
  useScriptEventsByService,
  useScriptValidation,
  useScriptNameAvailability
};

/**
 * All script mutation hooks grouped for convenience
 */
export const scriptMutations = {
  useCreateScript,
  useUpdateScript,
  useDeleteScript,
  useExecuteScript
};

/**
 * All script utility hooks grouped for convenience
 */
export const scriptUtils = {
  usePrefetchScript,
  useOptimisticScriptUpdate
};