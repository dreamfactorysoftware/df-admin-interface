/**
 * Service Selection and Navigation State Management
 * 
 * Migrated from Angular DfCurrentServiceService to React hooks with localStorage persistence.
 * Provides reactive service selection state management with cross-component synchronization
 * and service-related navigation state handling across route changes.
 * 
 * This module replaces Angular BehaviorSubject-based current service ID tracking with
 * type-safe React storage patterns while maintaining cross-tab synchronization and
 * SSR compatibility for Next.js 15.1.
 */

import { useCallback, useEffect } from 'react';
import { useLocalStorage, useSessionStorage, storageUtils } from './ssr-storage';
import { 
  STORAGE_KEYS, 
  ServiceState, 
  DatabaseServiceType, 
  ServiceStatus,
  StorageResult 
} from './types';
import { LocalStorage, SessionStorage } from './storage-utils';

// =============================================================================
// Constants and Default Values
// =============================================================================

/**
 * Default service state matching Angular DfCurrentServiceService patterns
 * -1 indicates no service selected (maintains Angular compatibility)
 */
const DEFAULT_SERVICE_STATE: ServiceState = {
  currentServiceId: -1,
  currentServiceType: null,
  currentServiceName: null,
  currentServiceStatus: 'inactive',
  recentServiceIds: [],
  navigationContext: {
    currentSchema: null,
    currentTable: null,
    viewMode: 'list',
  },
};

/**
 * Storage keys for service state persistence
 */
const SERVICE_STORAGE_KEYS = {
  CURRENT_SERVICE_ID: STORAGE_KEYS.CURRENT_SERVICE_ID,
  CURRENT_SERVICE_TYPE: 'currentServiceType',
  CURRENT_SERVICE_NAME: 'currentServiceName',
  CURRENT_SERVICE_STATUS: 'currentServiceStatus',
  RECENT_SERVICE_IDS: 'recentServiceIds',
  NAVIGATION_CONTEXT: 'serviceNavigationContext',
} as const;

/**
 * Maximum number of recent services to track
 */
const MAX_RECENT_SERVICES = 10;

// =============================================================================
// Service State Management Hook
// =============================================================================

/**
 * Main service state management hook
 * Replaces Angular DfCurrentServiceService with React patterns
 * 
 * @returns Service state and management functions
 */
export function useServiceState() {
  // Core service ID with cross-tab synchronization
  const [currentServiceId, setCurrentServiceId] = useLocalStorage<number>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_ID,
    {
      defaultValue: DEFAULT_SERVICE_STATE.currentServiceId,
      syncAcrossTabs: true,
    }
  );

  // Service metadata with localStorage persistence
  const [currentServiceType, setCurrentServiceType] = useLocalStorage<DatabaseServiceType | null>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_TYPE,
    {
      defaultValue: DEFAULT_SERVICE_STATE.currentServiceType,
      syncAcrossTabs: true,
    }
  );

  const [currentServiceName, setCurrentServiceName] = useLocalStorage<string | null>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_NAME,
    {
      defaultValue: DEFAULT_SERVICE_STATE.currentServiceName,
      syncAcrossTabs: true,
    }
  );

  const [currentServiceStatus, setCurrentServiceStatus] = useLocalStorage<ServiceStatus>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_STATUS,
    {
      defaultValue: DEFAULT_SERVICE_STATE.currentServiceStatus,
      syncAcrossTabs: true,
    }
  );

  // Recent services tracking
  const [recentServiceIds, setRecentServiceIds] = useLocalStorage<number[]>(
    SERVICE_STORAGE_KEYS.RECENT_SERVICE_IDS,
    {
      defaultValue: DEFAULT_SERVICE_STATE.recentServiceIds,
      syncAcrossTabs: true,
    }
  );

  // Navigation context for service detail views
  const [navigationContext, setNavigationContext] = useSessionStorage<ServiceState['navigationContext']>(
    SERVICE_STORAGE_KEYS.NAVIGATION_CONTEXT,
    {
      defaultValue: DEFAULT_SERVICE_STATE.navigationContext,
    }
  );

  // =============================================================================
  // Service Selection Functions
  // =============================================================================

  /**
   * Sets the currently selected service
   * Maintains compatibility with Angular DfCurrentServiceService.setCurrentServiceId()
   * 
   * @param serviceId - Service ID to select (-1 for none)
   * @param serviceType - Optional service type
   * @param serviceName - Optional service name
   * @param serviceStatus - Optional service status
   */
  const selectService = useCallback((
    serviceId: number,
    serviceType?: DatabaseServiceType | null,
    serviceName?: string | null,
    serviceStatus?: ServiceStatus
  ) => {
    // Update current service
    setCurrentServiceId(serviceId);
    
    if (serviceType !== undefined) {
      setCurrentServiceType(serviceType);
    }
    
    if (serviceName !== undefined) {
      setCurrentServiceName(serviceName);
    }
    
    if (serviceStatus !== undefined) {
      setCurrentServiceStatus(serviceStatus);
    }

    // Update recent services if valid service ID
    if (serviceId > 0) {
      setRecentServiceIds(prev => {
        const updated = [serviceId, ...prev.filter(id => id !== serviceId)];
        return updated.slice(0, MAX_RECENT_SERVICES);
      });
    }

    // Clear navigation context when switching services
    if (serviceId !== currentServiceId) {
      setNavigationContext(DEFAULT_SERVICE_STATE.navigationContext);
    }
  }, [
    currentServiceId,
    setCurrentServiceId,
    setCurrentServiceType,
    setCurrentServiceName,
    setCurrentServiceStatus,
    setRecentServiceIds,
    setNavigationContext,
  ]);

  /**
   * Clears the current service selection
   * Maintains compatibility with Angular DfCurrentServiceService.clearCurrentService()
   */
  const clearService = useCallback(() => {
    setCurrentServiceId(DEFAULT_SERVICE_STATE.currentServiceId);
    setCurrentServiceType(DEFAULT_SERVICE_STATE.currentServiceType);
    setCurrentServiceName(DEFAULT_SERVICE_STATE.currentServiceName);
    setCurrentServiceStatus(DEFAULT_SERVICE_STATE.currentServiceStatus);
    setNavigationContext(DEFAULT_SERVICE_STATE.navigationContext);
  }, [
    setCurrentServiceId,
    setCurrentServiceType,
    setCurrentServiceName,
    setCurrentServiceStatus,
    setNavigationContext,
  ]);

  /**
   * Updates the current service status
   * Used for connection testing and health monitoring
   * 
   * @param status - New service status
   */
  const updateServiceStatus = useCallback((status: ServiceStatus) => {
    setCurrentServiceStatus(status);
  }, [setCurrentServiceStatus]);

  // =============================================================================
  // Navigation Context Functions
  // =============================================================================

  /**
   * Updates the navigation context for service detail views
   * Handles schema, table, and view mode state
   * 
   * @param context - Partial navigation context to update
   */
  const updateNavigationContext = useCallback((
    context: Partial<ServiceState['navigationContext']>
  ) => {
    setNavigationContext(prev => ({
      ...prev,
      ...context,
    }));
  }, [setNavigationContext]);

  /**
   * Sets the current schema being viewed
   * 
   * @param schema - Schema name or null to clear
   */
  const setCurrentSchema = useCallback((schema: string | null) => {
    updateNavigationContext({ 
      currentSchema: schema,
      currentTable: null, // Clear table when changing schema
    });
  }, [updateNavigationContext]);

  /**
   * Sets the current table being viewed
   * 
   * @param table - Table name or null to clear
   */
  const setCurrentTable = useCallback((table: string | null) => {
    updateNavigationContext({ currentTable: table });
  }, [updateNavigationContext]);

  /**
   * Sets the current view mode
   * 
   * @param viewMode - View mode ('list', 'tree', or 'grid')
   */
  const setViewMode = useCallback((viewMode: 'list' | 'tree' | 'grid') => {
    updateNavigationContext({ viewMode });
  }, [updateNavigationContext]);

  // =============================================================================
  // Recent Services Management
  // =============================================================================

  /**
   * Adds a service to the recent services list
   * 
   * @param serviceId - Service ID to add
   */
  const addToRecentServices = useCallback((serviceId: number) => {
    if (serviceId > 0) {
      setRecentServiceIds(prev => {
        const updated = [serviceId, ...prev.filter(id => id !== serviceId)];
        return updated.slice(0, MAX_RECENT_SERVICES);
      });
    }
  }, [setRecentServiceIds]);

  /**
   * Removes a service from the recent services list
   * 
   * @param serviceId - Service ID to remove
   */
  const removeFromRecentServices = useCallback((serviceId: number) => {
    setRecentServiceIds(prev => prev.filter(id => id !== serviceId));
  }, [setRecentServiceIds]);

  /**
   * Clears the recent services list
   */
  const clearRecentServices = useCallback(() => {
    setRecentServiceIds(DEFAULT_SERVICE_STATE.recentServiceIds);
  }, [setRecentServiceIds]);

  // =============================================================================
  // State Reset Functions
  // =============================================================================

  /**
   * Resets all service state to default values
   * Used for logout scenarios and complete state clearing
   */
  const resetServiceState = useCallback(() => {
    setCurrentServiceId(DEFAULT_SERVICE_STATE.currentServiceId);
    setCurrentServiceType(DEFAULT_SERVICE_STATE.currentServiceType);
    setCurrentServiceName(DEFAULT_SERVICE_STATE.currentServiceName);
    setCurrentServiceStatus(DEFAULT_SERVICE_STATE.currentServiceStatus);
    setRecentServiceIds(DEFAULT_SERVICE_STATE.recentServiceIds);
    setNavigationContext(DEFAULT_SERVICE_STATE.navigationContext);
  }, [
    setCurrentServiceId,
    setCurrentServiceType,
    setCurrentServiceName,
    setCurrentServiceStatus,
    setRecentServiceIds,
    setNavigationContext,
  ]);

  // =============================================================================
  // Computed State
  // =============================================================================

  /**
   * Complete service state object
   */
  const serviceState: ServiceState = {
    currentServiceId,
    currentServiceType,
    currentServiceName,
    currentServiceStatus,
    recentServiceIds,
    navigationContext,
  };

  /**
   * Whether a service is currently selected
   */
  const hasSelectedService = currentServiceId > 0;

  /**
   * Whether the current service is active/connected
   */
  const isServiceActive = currentServiceStatus === 'active';

  /**
   * Whether navigation context has schema information
   */
  const hasSchemaContext = navigationContext.currentSchema !== null;

  /**
   * Whether navigation context has table information
   */
  const hasTableContext = navigationContext.currentTable !== null;

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Current state
    serviceState,
    currentServiceId,
    currentServiceType,
    currentServiceName,
    currentServiceStatus,
    recentServiceIds,
    navigationContext,

    // Computed state
    hasSelectedService,
    isServiceActive,
    hasSchemaContext,
    hasTableContext,

    // Service selection functions
    selectService,
    clearService,
    updateServiceStatus,

    // Navigation context functions
    updateNavigationContext,
    setCurrentSchema,
    setCurrentTable,
    setViewMode,

    // Recent services management
    addToRecentServices,
    removeFromRecentServices,
    clearRecentServices,

    // State reset
    resetServiceState,
  };
}

// =============================================================================
// Utility Hooks for Specific Use Cases
// =============================================================================

/**
 * Hook for tracking only the current service ID
 * Lightweight alternative for components that only need service ID
 * 
 * @returns Current service ID and setter function
 */
export function useCurrentServiceId(): [number, (serviceId: number) => void] {
  const [currentServiceId, setCurrentServiceId] = useLocalStorage<number>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_ID,
    {
      defaultValue: DEFAULT_SERVICE_STATE.currentServiceId,
      syncAcrossTabs: true,
    }
  );

  return [currentServiceId, setCurrentServiceId];
}

/**
 * Hook for service navigation context only
 * Used by schema and table browsing components
 * 
 * @returns Navigation context and setter functions
 */
export function useServiceNavigation() {
  const [navigationContext, setNavigationContext] = useSessionStorage<ServiceState['navigationContext']>(
    SERVICE_STORAGE_KEYS.NAVIGATION_CONTEXT,
    {
      defaultValue: DEFAULT_SERVICE_STATE.navigationContext,
    }
  );

  const setCurrentSchema = useCallback((schema: string | null) => {
    setNavigationContext(prev => ({
      ...prev,
      currentSchema: schema,
      currentTable: null, // Clear table when changing schema
    }));
  }, [setNavigationContext]);

  const setCurrentTable = useCallback((table: string | null) => {
    setNavigationContext(prev => ({
      ...prev,
      currentTable: table,
    }));
  }, [setNavigationContext]);

  const setViewMode = useCallback((viewMode: 'list' | 'tree' | 'grid') => {
    setNavigationContext(prev => ({
      ...prev,
      viewMode,
    }));
  }, [setNavigationContext]);

  return {
    navigationContext,
    setCurrentSchema,
    setCurrentTable,
    setViewMode,
    hasSchemaContext: navigationContext.currentSchema !== null,
    hasTableContext: navigationContext.currentTable !== null,
  };
}

/**
 * Hook for recent services tracking
 * Used by service selection components and navigation menus
 * 
 * @returns Recent services and management functions
 */
export function useRecentServices() {
  const [recentServiceIds, setRecentServiceIds] = useLocalStorage<number[]>(
    SERVICE_STORAGE_KEYS.RECENT_SERVICE_IDS,
    {
      defaultValue: DEFAULT_SERVICE_STATE.recentServiceIds,
      syncAcrossTabs: true,
    }
  );

  const addService = useCallback((serviceId: number) => {
    if (serviceId > 0) {
      setRecentServiceIds(prev => {
        const updated = [serviceId, ...prev.filter(id => id !== serviceId)];
        return updated.slice(0, MAX_RECENT_SERVICES);
      });
    }
  }, [setRecentServiceIds]);

  const removeService = useCallback((serviceId: number) => {
    setRecentServiceIds(prev => prev.filter(id => id !== serviceId));
  }, [setRecentServiceIds]);

  const clearAll = useCallback(() => {
    setRecentServiceIds([]);
  }, [setRecentServiceIds]);

  return {
    recentServiceIds,
    addService,
    removeService,
    clearAll,
    hasRecentServices: recentServiceIds.length > 0,
  };
}

// =============================================================================
// SSR-Safe Utility Functions
// =============================================================================

/**
 * SSR-safe function to get current service ID
 * Can be used in server components and API routes
 * 
 * @returns Current service ID or default (-1)
 */
export function getCurrentServiceId(): number {
  return storageUtils.getLocalStorage<number>(
    SERVICE_STORAGE_KEYS.CURRENT_SERVICE_ID,
    DEFAULT_SERVICE_STATE.currentServiceId
  );
}

/**
 * SSR-safe function to get complete service state
 * Can be used in server components and API routes
 * 
 * @returns Current service state or defaults
 */
export function getServiceState(): ServiceState {
  return {
    currentServiceId: storageUtils.getLocalStorage<number>(
      SERVICE_STORAGE_KEYS.CURRENT_SERVICE_ID,
      DEFAULT_SERVICE_STATE.currentServiceId
    ),
    currentServiceType: storageUtils.getLocalStorage<DatabaseServiceType | null>(
      SERVICE_STORAGE_KEYS.CURRENT_SERVICE_TYPE,
      DEFAULT_SERVICE_STATE.currentServiceType
    ),
    currentServiceName: storageUtils.getLocalStorage<string | null>(
      SERVICE_STORAGE_KEYS.CURRENT_SERVICE_NAME,
      DEFAULT_SERVICE_STATE.currentServiceName
    ),
    currentServiceStatus: storageUtils.getLocalStorage<ServiceStatus>(
      SERVICE_STORAGE_KEYS.CURRENT_SERVICE_STATUS,
      DEFAULT_SERVICE_STATE.currentServiceStatus
    ),
    recentServiceIds: storageUtils.getLocalStorage<number[]>(
      SERVICE_STORAGE_KEYS.RECENT_SERVICE_IDS,
      DEFAULT_SERVICE_STATE.recentServiceIds
    ),
    navigationContext: storageUtils.getSessionStorage<ServiceState['navigationContext']>(
      SERVICE_STORAGE_KEYS.NAVIGATION_CONTEXT,
      DEFAULT_SERVICE_STATE.navigationContext
    ),
  };
}

/**
 * Utility function to clear all service state
 * Can be used in logout functions and state reset scenarios
 * 
 * @returns Success status of the clear operation
 */
export function clearAllServiceState(): StorageResult<void> {
  const results: StorageResult<void>[] = [];

  // Clear localStorage items
  results.push(LocalStorage.removeItem(SERVICE_STORAGE_KEYS.CURRENT_SERVICE_ID));
  results.push(LocalStorage.removeItem(SERVICE_STORAGE_KEYS.CURRENT_SERVICE_TYPE));
  results.push(LocalStorage.removeItem(SERVICE_STORAGE_KEYS.CURRENT_SERVICE_NAME));
  results.push(LocalStorage.removeItem(SERVICE_STORAGE_KEYS.CURRENT_SERVICE_STATUS));
  results.push(LocalStorage.removeItem(SERVICE_STORAGE_KEYS.RECENT_SERVICE_IDS));

  // Clear sessionStorage items
  results.push(SessionStorage.removeItem(SERVICE_STORAGE_KEYS.NAVIGATION_CONTEXT));

  // Check if any operations failed
  const hasErrors = results.some(result => !result.success);
  
  if (hasErrors) {
    const errors = results
      .filter(result => !result.success)
      .map(result => result.error)
      .join('; ');
    
    return { success: false, error: `Service state clear errors: ${errors}` };
  }

  return { success: true };
}

// =============================================================================
// Migration Helper Functions
// =============================================================================

/**
 * Migration helper for Angular to React service state patterns
 * Converts Angular BehaviorSubject data to React hook patterns
 * 
 * @param angularServiceData - Legacy Angular service data
 * @returns Migrated service state
 */
export function migrateAngularServiceState(angularServiceData: any): ServiceState {
  return {
    currentServiceId: angularServiceData?.currentServiceId ?? DEFAULT_SERVICE_STATE.currentServiceId,
    currentServiceType: angularServiceData?.currentServiceType ?? DEFAULT_SERVICE_STATE.currentServiceType,
    currentServiceName: angularServiceData?.currentServiceName ?? DEFAULT_SERVICE_STATE.currentServiceName,
    currentServiceStatus: angularServiceData?.currentServiceStatus ?? DEFAULT_SERVICE_STATE.currentServiceStatus,
    recentServiceIds: Array.isArray(angularServiceData?.recentServiceIds) 
      ? angularServiceData.recentServiceIds 
      : DEFAULT_SERVICE_STATE.recentServiceIds,
    navigationContext: {
      currentSchema: angularServiceData?.currentSchema ?? DEFAULT_SERVICE_STATE.navigationContext.currentSchema,
      currentTable: angularServiceData?.currentTable ?? DEFAULT_SERVICE_STATE.navigationContext.currentTable,
      viewMode: angularServiceData?.viewMode ?? DEFAULT_SERVICE_STATE.navigationContext.viewMode,
    },
  };
}

/**
 * Type guard to validate service state structure
 * 
 * @param value - Value to validate
 * @returns True if value is a valid ServiceState
 */
export function isValidServiceState(value: any): value is ServiceState {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.currentServiceId === 'number' &&
    (value.currentServiceType === null || typeof value.currentServiceType === 'string') &&
    (value.currentServiceName === null || typeof value.currentServiceName === 'string') &&
    typeof value.currentServiceStatus === 'string' &&
    Array.isArray(value.recentServiceIds) &&
    value.navigationContext &&
    typeof value.navigationContext === 'object'
  );
}

// =============================================================================
// Export All Functionality
// =============================================================================

export {
  DEFAULT_SERVICE_STATE,
  SERVICE_STORAGE_KEYS,
  MAX_RECENT_SERVICES,
};

export type {
  ServiceState,
  DatabaseServiceType,
  ServiceStatus,
} from './types';