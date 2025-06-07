/**
 * Current Service Management Hook
 * 
 * Manages selected database service state, localStorage persistence, and service-related
 * operations. Replaces Angular DfCurrentServiceService with React state management and
 * localStorage synchronization for service selection workflows across the application.
 * 
 * Features:
 * - Current service ID state management with localStorage persistence
 * - Service selection workflows with automatic state updates and validation
 * - Service clearing functionality for logout and reset scenarios
 * - Integration with service listing and validation for selected service verification
 * - Fallback handling for invalid service IDs with automatic cleanup
 * - Service context sharing across components with reactive updates
 * 
 * @fileoverview Current service context hook for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './use-local-storage';
import type {
  DatabaseService,
  ServiceId,
  CurrentServiceState,
  CurrentServiceActions,
  UseCurrentServiceReturn,
  UseCurrentServiceOptions,
  ServiceValidationResult,
  ServiceSelectionEvent,
  CurrentServiceStorageData,
  ServiceChangeReason,
  CurrentServiceError,
  DatabaseServiceQueryKeys,
} from '../types/database-service';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default configuration for current service management
 */
const DEFAULT_OPTIONS: Required<Omit<UseCurrentServiceOptions, 'onServiceChange' | 'onValidationFailed' | 'onServiceCleared'>> = {
  autoValidate: true,
  autoClearInvalid: true,
  enableAutoRefresh: false,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  storageKey: 'currentServiceId',
  defaultServiceId: null,
} as const;

/**
 * Storage configuration for current service data
 */
const STORAGE_CONFIG = {
  version: 1,
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours
  syncAcrossTabs: true,
  serialize: true,
} as const;

/**
 * Query configuration for service validation
 */
const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates if a service ID is properly formatted
 */
const isValidServiceId = (serviceId: unknown): serviceId is number => {
  return typeof serviceId === 'number' && Number.isInteger(serviceId) && serviceId > 0;
};

/**
 * Creates storage data structure from service information
 */
const createStorageData = (serviceId: ServiceId, service?: DatabaseService): CurrentServiceStorageData => ({
  serviceId,
  timestamp: Date.now(),
  version: STORAGE_CONFIG.version,
  metadata: service ? {
    serviceName: service.name,
    serviceType: service.type,
    lastValidated: Date.now(),
  } : undefined,
});

/**
 * Extracts service ID from various input types
 */
const extractServiceId = (input: ServiceId | DatabaseService): ServiceId => {
  if (input === null || typeof input === 'number') {
    return input;
  }
  if (typeof input === 'object' && 'id' in input) {
    return input.id;
  }
  return null;
};

/**
 * Creates a service selection event object
 */
const createSelectionEvent = (
  previousService: DatabaseService | null,
  newService: DatabaseService | null,
  source: ServiceSelectionEvent['source']
): ServiceSelectionEvent => ({
  previousServiceId: previousService?.id || null,
  newServiceId: newService?.id || null,
  previousService,
  newService,
  timestamp: Date.now(),
  source,
});

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Current Service Management Hook
 * 
 * Provides comprehensive current service state management with localStorage persistence,
 * automatic validation, and reactive updates. Manages the selected database service
 * context throughout the application lifecycle.
 * 
 * @param options - Configuration options for hook behavior
 * @returns Current service state and management functions
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const {
 *   currentService,
 *   currentServiceId,
 *   setCurrentService,
 *   clearCurrentService,
 *   hasCurrentService,
 *   isLoading,
 *   error
 * } = useCurrentService();
 * 
 * // With custom options
 * const {
 *   currentService,
 *   setCurrentService,
 *   validateCurrentService
 * } = useCurrentService({
 *   autoValidate: true,
 *   autoClearInvalid: true,
 *   onServiceChange: (service) => {
 *     console.log('Service changed:', service?.name);
 *   },
 *   onValidationFailed: (serviceId) => {
 *     console.log('Service validation failed:', serviceId);
 *   }
 * });
 * 
 * // Setting current service
 * const handleServiceSelect = (service: DatabaseService) => {
 *   setCurrentService(service.id);
 * };
 * 
 * // Clearing current service
 * const handleLogout = () => {
 *   clearCurrentService();
 * };
 * ```
 */
export function useCurrentService(
  options: UseCurrentServiceOptions = {}
): UseCurrentServiceReturn {
  // Merge options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Query client for cache management
  const queryClient = useQueryClient();
  
  // Refs for stable references
  const optionsRef = useRef(options);
  const configRef = useRef(config);
  
  // Update refs when options change
  useEffect(() => {
    optionsRef.current = options;
    configRef.current = { ...DEFAULT_OPTIONS, ...options };
  }, [options]);

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  // LocalStorage persistence for service ID
  const [storageData, setStorageData, removeStorageData, isStorageLoading] = useLocalStorage<CurrentServiceStorageData>(
    config.storageKey,
    {
      defaultValue: createStorageData(config.defaultServiceId),
      version: STORAGE_CONFIG.version,
      expiresIn: STORAGE_CONFIG.expiresIn,
      syncAcrossTabs: STORAGE_CONFIG.syncAcrossTabs,
      serialize: STORAGE_CONFIG.serialize,
      validator: (value): value is CurrentServiceStorageData => {
        if (!value || typeof value !== 'object') return false;
        const data = value as Record<string, unknown>;
        return (
          (data.serviceId === null || isValidServiceId(data.serviceId)) &&
          typeof data.timestamp === 'number' &&
          typeof data.version === 'number'
        );
      },
      migrator: (oldValue, newVersion) => {
        // Handle storage migration if needed
        if (newVersion > oldValue.version) {
          return createStorageData(
            oldValue.value?.serviceId || null,
            undefined
          );
        }
        return oldValue.value;
      },
    }
  );

  // Current service state
  const [currentState, setCurrentState] = useState<CurrentServiceState>({
    currentServiceId: null,
    currentService: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Service validation error tracking
  const [validationError, setValidationError] = useState<CurrentServiceError | null>(null);

  // =============================================================================
  // SERVICE VALIDATION QUERY
  // =============================================================================

  // Get services list for validation
  const { data: servicesList } = useQuery({
    queryKey: ['database-services', 'list'] as const,
    queryFn: async () => {
      // This would normally call the API, but for now we'll use cached data
      const cachedServices = queryClient.getQueryData(['database-services', 'list']);
      return cachedServices as DatabaseService[] || [];
    },
    ...QUERY_CONFIG,
    enabled: !!currentState.currentServiceId,
  });

  // Service validation query
  const {
    data: validationResult,
    isLoading: isValidating,
    error: validationQueryError,
    refetch: revalidateService,
  } = useQuery({
    queryKey: ['current-service-validation', currentState.currentServiceId] as const,
    queryFn: async (): Promise<ServiceValidationResult> => {
      const serviceId = currentState.currentServiceId;
      
      if (!isValidServiceId(serviceId)) {
        return {
          isValid: false,
          error: 'Invalid service ID',
        };
      }

      try {
        // Find service in cached list first
        const service = servicesList?.find(s => s.id === serviceId);
        
        if (!service) {
          return {
            isValid: false,
            error: 'Service not found',
          };
        }

        if (!service.is_active) {
          return {
            isValid: false,
            service,
            error: 'Service is inactive',
            isInactive: true,
          };
        }

        return {
          isValid: true,
          service,
        };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        };
      }
    },
    ...QUERY_CONFIG,
    enabled: !!(currentState.currentServiceId && config.autoValidate && servicesList),
    onSuccess: (result) => {
      if (result.isValid && result.service) {
        setCurrentState(prev => ({
          ...prev,
          currentService: result.service!,
          error: null,
          lastUpdated: Date.now(),
        }));
        setValidationError(null);
      } else if (!result.isValid && config.autoClearInvalid) {
        // Auto-clear invalid service
        handleClearService('validation_failed');
        setValidationError(result.error as CurrentServiceError || 'VALIDATION_FAILED');
        
        // Notify callback
        if (optionsRef.current.onValidationFailed && currentState.currentServiceId) {
          optionsRef.current.onValidationFailed(currentState.currentServiceId);
        }
      }
    },
    onError: (error) => {
      setValidationError('NETWORK_ERROR');
      if (config.autoClearInvalid) {
        handleClearService('validation_failed');
      }
    },
  });

  // =============================================================================
  // STATE SYNCHRONIZATION
  // =============================================================================

  // Initialize state from storage
  useEffect(() => {
    if (!isStorageLoading && storageData) {
      const serviceId = storageData.serviceId;
      setCurrentState(prev => ({
        ...prev,
        currentServiceId: serviceId,
        lastUpdated: storageData.timestamp,
      }));
    }
  }, [storageData, isStorageLoading]);

  // Update loading state
  useEffect(() => {
    setCurrentState(prev => ({
      ...prev,
      isLoading: isStorageLoading || isValidating,
    }));
  }, [isStorageLoading, isValidating]);

  // Update error state
  useEffect(() => {
    const error = validationError || 
                 (validationQueryError ? 'NETWORK_ERROR' : null) ||
                 (validationResult && !validationResult.isValid ? 'VALIDATION_FAILED' : null);
    
    setCurrentState(prev => ({
      ...prev,
      error: error,
    }));
  }, [validationError, validationQueryError, validationResult]);

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  /**
   * Internal handler for service changes
   */
  const handleServiceChange = useCallback((
    newServiceId: ServiceId,
    newService: DatabaseService | null,
    reason: ServiceChangeReason
  ) => {
    const previousService = currentState.currentService;
    
    // Update storage
    if (newServiceId !== null) {
      const storageData = createStorageData(newServiceId, newService || undefined);
      setStorageData(storageData);
    } else {
      removeStorageData();
    }

    // Update state
    setCurrentState(prev => ({
      ...prev,
      currentServiceId: newServiceId,
      currentService: newService,
      lastUpdated: Date.now(),
      error: null,
    }));

    // Clear validation error
    setValidationError(null);

    // Invalidate validation query
    queryClient.invalidateQueries(['current-service-validation']);

    // Notify callback
    if (optionsRef.current.onServiceChange) {
      optionsRef.current.onServiceChange(newService);
    }

    // Create selection event for potential listeners
    const selectionEvent = createSelectionEvent(
      previousService,
      newService,
      reason === 'user_selection' ? 'user' : 'auto'
    );
    
    // Could emit this event if needed for other components
    // eventEmitter.emit('service-selection-changed', selectionEvent);
  }, [currentState.currentService, setStorageData, removeStorageData, queryClient]);

  /**
   * Internal handler for clearing service
   */
  const handleClearService = useCallback((reason: ServiceChangeReason) => {
    handleServiceChange(null, null, reason);
    
    if (optionsRef.current.onServiceCleared) {
      optionsRef.current.onServiceCleared();
    }
  }, [handleServiceChange]);

  // =============================================================================
  // PUBLIC ACTIONS
  // =============================================================================

  /**
   * Set current service by ID or service object
   */
  const setCurrentService = useCallback((input: ServiceId | DatabaseService) => {
    const serviceId = extractServiceId(input);
    const service = typeof input === 'object' ? input : null;
    
    if (serviceId === currentState.currentServiceId) {
      return; // No change needed
    }

    handleServiceChange(serviceId, service, 'user_selection');
  }, [currentState.currentServiceId, handleServiceChange]);

  /**
   * Set current service by service object
   */
  const setCurrentServiceObject = useCallback((service: DatabaseService | null) => {
    const serviceId = service?.id || null;
    handleServiceChange(serviceId, service, 'user_selection');
  }, [handleServiceChange]);

  /**
   * Clear current service
   */
  const clearCurrentService = useCallback(() => {
    handleClearService('manual_clear');
  }, [handleClearService]);

  /**
   * Refresh current service data
   */
  const refreshCurrentService = useCallback(async () => {
    if (!currentState.currentServiceId) {
      return;
    }

    try {
      await revalidateService();
    } catch (error) {
      setValidationError('NETWORK_ERROR');
    }
  }, [currentState.currentServiceId, revalidateService]);

  /**
   * Validate current service
   */
  const validateCurrentService = useCallback(async (): Promise<boolean> => {
    if (!currentState.currentServiceId) {
      return false;
    }

    try {
      const result = await revalidateService();
      return result.data?.isValid || false;
    } catch (error) {
      return false;
    }
  }, [currentState.currentServiceId, revalidateService]);

  // =============================================================================
  // AUTO REFRESH LOGIC
  // =============================================================================

  // Auto refresh timer
  useEffect(() => {
    if (!config.enableAutoRefresh || !currentState.currentServiceId) {
      return;
    }

    const interval = setInterval(() => {
      refreshCurrentService();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.enableAutoRefresh, config.refreshInterval, currentState.currentServiceId, refreshCurrentService]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const hasCurrentService = !!currentState.currentServiceId;
  const currentServiceName = currentState.currentService?.name || null;
  const currentServiceType = currentState.currentService?.type || null;
  const isCurrentServiceActive = currentState.currentService?.is_active || false;

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // State
    currentServiceId: currentState.currentServiceId,
    currentService: currentState.currentService,
    isLoading: currentState.isLoading,
    error: currentState.error,
    lastUpdated: currentState.lastUpdated,

    // Actions
    setCurrentService,
    setCurrentServiceObject,
    clearCurrentService,
    refreshCurrentService,
    validateCurrentService,

    // Computed values
    hasCurrentService,
    currentServiceName,
    currentServiceType,
    isCurrentServiceActive,
  };
}

// =============================================================================
// CONTEXT PROVIDER HOOK
// =============================================================================

/**
 * Hook for providing current service context to child components
 * 
 * @param options - Configuration options
 * @returns Context provider value
 * 
 * @example
 * ```typescript
 * function CurrentServiceProvider({ children }: { children: React.ReactNode }) {
 *   const currentServiceContext = useCurrentServiceContext();
 *   
 *   return (
 *     <CurrentServiceContext.Provider value={currentServiceContext}>
 *       {children}
 *     </CurrentServiceContext.Provider>
 *   );
 * }
 * ```
 */
export function useCurrentServiceContext(options: UseCurrentServiceOptions = {}) {
  return useCurrentService(options);
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Simple hook that just returns the current service ID
 */
export function useCurrentServiceId(): ServiceId {
  const { currentServiceId } = useCurrentService({ autoValidate: false });
  return currentServiceId;
}

/**
 * Simple hook that just returns the current service object
 */
export function useCurrentServiceObject(): DatabaseService | null {
  const { currentService } = useCurrentService();
  return currentService;
}

/**
 * Hook that returns whether any service is currently selected
 */
export function useHasCurrentService(): boolean {
  const { hasCurrentService } = useCurrentService({ autoValidate: false });
  return hasCurrentService;
}

/**
 * Hook for service clearing on logout
 */
export function useCurrentServiceLogout() {
  const { clearCurrentService } = useCurrentService({ autoValidate: false });
  
  return useCallback(() => {
    clearCurrentService();
  }, [clearCurrentService]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  UseCurrentServiceReturn,
  UseCurrentServiceOptions,
  ServiceValidationResult,
  ServiceSelectionEvent,
  CurrentServiceState,
  CurrentServiceActions,
};

// Default export
export default useCurrentService;