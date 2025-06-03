/**
 * Storage Services Hooks
 * 
 * React Query hooks for storage services management in the DreamFactory Admin Interface.
 * Provides optimized data fetching and caching for storage services used by event scripts.
 * 
 * Features:
 * - React Query integration with intelligent caching
 * - Service filtering and selection
 * - Cache hit responses under 50ms
 * - Error handling with retry logic
 * - Server-side rendering support
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { ServiceQueryKeys, Service, ServiceListResponse, ServiceListFilters, ServiceAPIResponse } from '@/types/services';

// ============================================================================
// STORAGE SERVICE TYPES
// ============================================================================

/**
 * Storage service types that can be used for script storage
 */
const STORAGE_SERVICE_TYPES = [
  'local_file',
  'aws_s3',
  'azure_blob',
  'gcs',
  'ftp',
  'sftp'
] as const;

export type StorageServiceType = typeof STORAGE_SERVICE_TYPES[number];

/**
 * Storage service option for script configuration
 */
export interface StorageServiceOption {
  id: number;
  name: string;
  label: string;
  type: StorageServiceType;
  config: {
    container?: string;
    path?: string;
    region?: string;
    host?: string;
    port?: number;
  };
  isActive: boolean;
  description?: string;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all services with optional filtering
 */
export function useServices(filters?: ServiceListFilters) {
  return useQuery({
    queryKey: ServiceQueryKeys.list(filters || {}),
    queryFn: async (): Promise<ServiceListResponse> => {
      const params = new URLSearchParams();
      
      if (filters?.type) params.append('type', filters.type);
      if (filters?.group) params.append('group', filters.group);
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `/system/service${queryString ? `?${queryString}` : ''}`;
      
      const response: ServiceAPIResponse<ServiceListResponse> = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch services');
      }
      
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to fetch only storage services that can be used for script storage
 */
export function useStorageServices() {
  const { data: allServices, ...queryResult } = useServices({
    active: true
  });

  const storageServices = useMemo((): StorageServiceOption[] => {
    if (!allServices?.services) return [];
    
    return allServices.services
      .filter(service => STORAGE_SERVICE_TYPES.includes(service.type as StorageServiceType))
      .map(service => ({
        id: service.id,
        name: service.name,
        label: service.label,
        type: service.type as StorageServiceType,
        config: {
          container: service.config?.container,
          path: service.config?.path,
          region: service.config?.region,
          host: service.config?.host,
          port: service.config?.port
        },
        isActive: service.isActive,
        description: service.description
      }))
      .sort((a, b) => {
        // Sort local_file first, then alphabetically
        if (a.type === 'local_file' && b.type !== 'local_file') return -1;
        if (a.type !== 'local_file' && b.type === 'local_file') return 1;
        return a.label.localeCompare(b.label);
      });
  }, [allServices]);

  return {
    ...queryResult,
    data: storageServices
  };
}

/**
 * Hook to fetch a specific storage service by ID
 */
export function useStorageService(serviceId: number) {
  const { data: storageServices, ...queryResult } = useStorageServices();
  
  const service = useMemo(() => {
    if (!storageServices || !serviceId) return undefined;
    return storageServices.find(s => s.id === serviceId);
  }, [storageServices, serviceId]);

  return {
    ...queryResult,
    data: service
  };
}

/**
 * Hook to fetch local file storage services only
 */
export function useLocalFileServices() {
  const { data: storageServices, ...queryResult } = useStorageServices();
  
  const localFileServices = useMemo(() => {
    if (!storageServices) return [];
    return storageServices.filter(service => service.type === 'local_file');
  }, [storageServices]);

  return {
    ...queryResult,
    data: localFileServices
  };
}

/**
 * Hook to fetch cloud storage services (non-local)
 */
export function useCloudStorageServices() {
  const { data: storageServices, ...queryResult } = useStorageServices();
  
  const cloudStorageServices = useMemo(() => {
    if (!storageServices) return [];
    return storageServices.filter(service => service.type !== 'local_file');
  }, [storageServices]);

  return {
    ...queryResult,
    data: cloudStorageServices
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get storage service options formatted for select components
 */
export function useStorageServiceOptions() {
  const { data: storageServices, ...queryResult } = useStorageServices();
  
  const options = useMemo(() => {
    if (!storageServices) return [];
    
    return storageServices.map(service => ({
      value: service.id.toString(),
      label: `${service.label} (${service.type})`,
      type: service.type,
      disabled: !service.isActive,
      service
    }));
  }, [storageServices]);

  return {
    ...queryResult,
    data: options
  };
}

/**
 * Hook to validate storage service configuration
 */
export function useStorageServiceValidation(serviceId?: number) {
  const { data: service } = useStorageService(serviceId || 0);
  
  return useMemo(() => {
    if (!service) return { isValid: false, errors: [] };
    
    const errors: string[] = [];
    
    // Validate based on service type
    switch (service.type) {
      case 'local_file':
        // Local file services are generally always valid if active
        break;
        
      case 'aws_s3':
        if (!service.config.region) {
          errors.push('AWS S3 region is required');
        }
        break;
        
      case 'azure_blob':
        if (!service.config.container) {
          errors.push('Azure Blob container is required');
        }
        break;
        
      case 'gcs':
        if (!service.config.container) {
          errors.push('Google Cloud Storage bucket is required');
        }
        break;
        
      case 'ftp':
      case 'sftp':
        if (!service.config.host) {
          errors.push('FTP/SFTP host is required');
        }
        break;
    }
    
    if (!service.isActive) {
      errors.push('Storage service is not active');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [service]);
}

/**
 * Hook to prefetch storage services for better UX
 */
export function usePrefetchStorageServices() {
  const queryClient = useQueryClient();
  
  return useMemo(() => ({
    prefetchStorageServices: () => {
      queryClient.prefetchQuery({
        queryKey: ServiceQueryKeys.list({ active: true }),
        queryFn: async () => {
          const response: ServiceAPIResponse<ServiceListResponse> = await apiClient.get('/system/service?active=true');
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to fetch services');
          }
          return response.data!;
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
    }
  }), [queryClient]);
}

/**
 * Hook to get storage path suggestions based on service type
 */
export function useStoragePathSuggestions(serviceType?: StorageServiceType) {
  return useMemo(() => {
    if (!serviceType) return [];
    
    const baseSuggestions = [
      'scripts/',
      'scripts/events/',
      'scripts/api/',
      'scripts/custom/'
    ];
    
    switch (serviceType) {
      case 'local_file':
        return [
          ...baseSuggestions,
          'storage/scripts/',
          'app/scripts/',
          'resources/scripts/'
        ];
        
      case 'aws_s3':
      case 'azure_blob':
      case 'gcs':
        return [
          ...baseSuggestions,
          'dreamfactory/scripts/',
          'applications/scripts/',
          'serverless/functions/'
        ];
        
      case 'ftp':
      case 'sftp':
        return [
          ...baseSuggestions,
          'public_html/scripts/',
          'www/scripts/',
          'htdocs/scripts/'
        ];
        
      default:
        return baseSuggestions;
    }
  }, [serviceType]);
}

// ============================================================================
// GROUPED EXPORTS
// ============================================================================

/**
 * All storage service query hooks grouped for convenience
 */
export const storageServiceQueries = {
  useServices,
  useStorageServices,
  useStorageService,
  useLocalFileServices,
  useCloudStorageServices,
  useStorageServiceOptions
};

/**
 * All storage service utility hooks grouped for convenience
 */
export const storageServiceUtils = {
  useStorageServiceValidation,
  usePrefetchStorageServices,
  useStoragePathSuggestions
};