/**
 * Service State Management Utilities
 * 
 * Migrated from Angular DfCurrentServiceService to React patterns.
 * Provides service selection state management, localStorage persistence,
 * and cross-tab synchronization for service navigation workflows.
 * 
 * Key Features:
 * - Current service ID tracking with localStorage persistence
 * - Cross-tab synchronization via storage events
 * - Service navigation state management
 * - Type-safe storage operations
 * - Service state reset for logout scenarios
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

// Storage key constants
const STORAGE_KEYS = {
  CURRENT_SERVICE_ID: 'currentServiceId',
  SERVICE_NAVIGATION_STATE: 'serviceNavigationState',
} as const;

// Type definitions for service state
export interface ServiceNavigationState {
  lastVisitedPath?: string;
  selectedTablesSchema?: string[];
  expandedNodes?: string[];
  lastUpdated: number;
}

export interface ServiceState {
  currentServiceId: number;
  navigationState?: ServiceNavigationState;
}

// Default values
const DEFAULT_SERVICE_ID = -1;
const DEFAULT_NAVIGATION_STATE: ServiceNavigationState = {
  lastUpdated: Date.now(),
};

/**
 * Browser environment detection for SSR compatibility
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Safe localStorage operations with error handling
 */
const storageUtils = {
  /**
   * Get item from localStorage with JSON parsing
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    if (!isBrowser) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with JSON serialization
   */
  setItem: <T>(key: string, value: T): void => {
    if (!isBrowser) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localStorage item "${key}":`, error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item "${key}":`, error);
    }
  },
};

/**
 * Service ID storage operations
 */
export const serviceIdStorage = {
  /**
   * Get current service ID from localStorage
   */
  getCurrentServiceId: (): number => {
    return storageUtils.getItem(STORAGE_KEYS.CURRENT_SERVICE_ID, DEFAULT_SERVICE_ID);
  },

  /**
   * Set current service ID in localStorage
   */
  setCurrentServiceId: (id: number): void => {
    storageUtils.setItem(STORAGE_KEYS.CURRENT_SERVICE_ID, id);
    // Trigger storage event for cross-tab synchronization
    if (isBrowser) {
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.CURRENT_SERVICE_ID,
        newValue: String(id),
        storageArea: localStorage,
      }));
    }
  },

  /**
   * Clear current service ID from localStorage
   */
  clearCurrentServiceId: (): void => {
    storageUtils.removeItem(STORAGE_KEYS.CURRENT_SERVICE_ID);
    // Trigger storage event for cross-tab synchronization
    if (isBrowser) {
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.CURRENT_SERVICE_ID,
        newValue: null,
        storageArea: localStorage,
      }));
    }
  },
};

/**
 * Service navigation state operations
 */
export const serviceNavigationStorage = {
  /**
   * Get service navigation state from localStorage
   */
  getNavigationState: (serviceId: number): ServiceNavigationState => {
    if (serviceId === DEFAULT_SERVICE_ID) return DEFAULT_NAVIGATION_STATE;
    
    const key = `${STORAGE_KEYS.SERVICE_NAVIGATION_STATE}_${serviceId}`;
    return storageUtils.getItem(key, DEFAULT_NAVIGATION_STATE);
  },

  /**
   * Set service navigation state in localStorage
   */
  setNavigationState: (serviceId: number, state: Partial<ServiceNavigationState>): void => {
    if (serviceId === DEFAULT_SERVICE_ID) return;
    
    const key = `${STORAGE_KEYS.SERVICE_NAVIGATION_STATE}_${serviceId}`;
    const currentState = storageUtils.getItem(key, DEFAULT_NAVIGATION_STATE);
    const updatedState: ServiceNavigationState = {
      ...currentState,
      ...state,
      lastUpdated: Date.now(),
    };
    
    storageUtils.setItem(key, updatedState);
  },

  /**
   * Clear navigation state for a specific service
   */
  clearNavigationState: (serviceId: number): void => {
    if (serviceId === DEFAULT_SERVICE_ID) return;
    
    const key = `${STORAGE_KEYS.SERVICE_NAVIGATION_STATE}_${serviceId}`;
    storageUtils.removeItem(key);
  },

  /**
   * Clear all navigation states (for logout scenarios)
   */
  clearAllNavigationStates: (): void => {
    if (!isBrowser) return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.SERVICE_NAVIGATION_STATE)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};

/**
 * Service ID store for cross-tab synchronization
 */
class ServiceIdStore {
  private listeners = new Set<() => void>();
  private currentValue: number;

  constructor() {
    this.currentValue = serviceIdStorage.getCurrentServiceId();
    
    if (isBrowser) {
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.CURRENT_SERVICE_ID) {
      const newValue = event.newValue ? parseInt(event.newValue, 10) : DEFAULT_SERVICE_ID;
      if (newValue !== this.currentValue) {
        this.currentValue = newValue;
        this.listeners.forEach(listener => listener());
      }
    }
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => {
    return this.currentValue;
  };

  getServerSnapshot = () => {
    return DEFAULT_SERVICE_ID;
  };

  setValue = (value: number) => {
    if (value !== this.currentValue) {
      this.currentValue = value;
      serviceIdStorage.setCurrentServiceId(value);
      this.listeners.forEach(listener => listener());
    }
  };

  clearValue = () => {
    this.currentValue = DEFAULT_SERVICE_ID;
    serviceIdStorage.clearCurrentServiceId();
    this.listeners.forEach(listener => listener());
  };
}

// Global store instance
const serviceIdStore = new ServiceIdStore();

/**
 * React hook for current service ID state with cross-tab synchronization
 * 
 * Replaces Angular DfCurrentServiceService BehaviorSubject pattern with React state management.
 * Provides reactive service ID state with localStorage persistence and cross-tab synchronization.
 * 
 * @returns Object with current service ID, setter, and clearing function
 */
export const useCurrentServiceId = () => {
  // Use useSyncExternalStore for cross-tab synchronization
  const currentServiceId = useSyncExternalStore(
    serviceIdStore.subscribe,
    serviceIdStore.getSnapshot,
    serviceIdStore.getServerSnapshot
  );

  /**
   * Set current service ID with persistence and cross-tab sync
   */
  const setCurrentServiceId = useCallback((id: number) => {
    serviceIdStore.setValue(id);
  }, []);

  /**
   * Clear current service ID (for logout scenarios)
   */
  const clearCurrentServiceId = useCallback(() => {
    serviceIdStore.clearValue();
  }, []);

  /**
   * Check if a service is currently selected
   */
  const hasSelectedService = currentServiceId !== DEFAULT_SERVICE_ID;

  return {
    currentServiceId,
    setCurrentServiceId,
    clearCurrentServiceId,
    hasSelectedService,
  };
};

/**
 * React hook for service navigation state management
 * 
 * Manages service-specific navigation state including expanded nodes,
 * selected tables, and last visited paths for service detail workflows.
 * 
 * @param serviceId - The service ID to manage navigation state for
 * @returns Object with navigation state and update functions
 */
export const useServiceNavigationState = (serviceId?: number) => {
  const { currentServiceId } = useCurrentServiceId();
  const targetServiceId = serviceId ?? currentServiceId;
  
  const [navigationState, setNavigationState] = useState<ServiceNavigationState>(() =>
    serviceNavigationStorage.getNavigationState(targetServiceId)
  );

  // Update navigation state when service ID changes
  useEffect(() => {
    const newState = serviceNavigationStorage.getNavigationState(targetServiceId);
    setNavigationState(newState);
  }, [targetServiceId]);

  /**
   * Update navigation state with persistence
   */
  const updateNavigationState = useCallback((updates: Partial<ServiceNavigationState>) => {
    const newState = { ...navigationState, ...updates };
    setNavigationState(newState);
    serviceNavigationStorage.setNavigationState(targetServiceId, updates);
  }, [navigationState, targetServiceId]);

  /**
   * Update last visited path
   */
  const updateLastVisitedPath = useCallback((path: string) => {
    updateNavigationState({ lastVisitedPath: path });
  }, [updateNavigationState]);

  /**
   * Update selected tables in schema
   */
  const updateSelectedTables = useCallback((tables: string[]) => {
    updateNavigationState({ selectedTablesSchema: tables });
  }, [updateNavigationState]);

  /**
   * Update expanded tree nodes
   */
  const updateExpandedNodes = useCallback((nodes: string[]) => {
    updateNavigationState({ expandedNodes: nodes });
  }, [updateNavigationState]);

  /**
   * Clear navigation state for current service
   */
  const clearNavigationState = useCallback(() => {
    const defaultState = DEFAULT_NAVIGATION_STATE;
    setNavigationState(defaultState);
    serviceNavigationStorage.clearNavigationState(targetServiceId);
  }, [targetServiceId]);

  return {
    navigationState,
    updateNavigationState,
    updateLastVisitedPath,
    updateSelectedTables,
    updateExpandedNodes,
    clearNavigationState,
  };
};

/**
 * Combined service state management hook
 * 
 * Provides comprehensive service state management including both
 * current service ID and navigation state management.
 * 
 * @returns Object with all service state operations
 */
export const useServiceState = () => {
  const serviceIdState = useCurrentServiceId();
  const navigationState = useServiceNavigationState();

  /**
   * Reset all service state (for logout scenarios)
   */
  const resetAllServiceState = useCallback(() => {
    serviceIdState.clearCurrentServiceId();
    serviceNavigationStorage.clearAllNavigationStates();
    navigationState.clearNavigationState();
  }, [serviceIdState, navigationState]);

  /**
   * Get complete service state
   */
  const getServiceState = useCallback((): ServiceState => {
    return {
      currentServiceId: serviceIdState.currentServiceId,
      navigationState: navigationState.navigationState,
    };
  }, [serviceIdState.currentServiceId, navigationState.navigationState]);

  return {
    // Service ID management
    ...serviceIdState,
    // Navigation state management
    ...navigationState,
    // Combined operations
    resetAllServiceState,
    getServiceState,
  };
};

/**
 * Service state persistence utilities for external components
 */
export const serviceStatePersistence = {
  // Re-export storage utilities for external access
  ...serviceIdStorage,
  ...serviceNavigationStorage,
  
  /**
   * Initialize service state from storage (for app initialization)
   */
  initializeFromStorage: (): ServiceState => {
    const currentServiceId = serviceIdStorage.getCurrentServiceId();
    const navigationState = serviceNavigationStorage.getNavigationState(currentServiceId);
    
    return {
      currentServiceId,
      navigationState,
    };
  },

  /**
   * Cleanup expired navigation states (utility for background cleanup)
   */
  cleanupExpiredStates: (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void => {
    if (!isBrowser) return;
    
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.SERVICE_NAVIGATION_STATE)) {
        try {
          const state = JSON.parse(localStorage.getItem(key) || '{}');
          if (state.lastUpdated && (now - state.lastUpdated) > maxAgeMs) {
            keysToRemove.push(key);
          }
        } catch {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Get all service IDs with stored navigation state
   */
  getStoredServiceIds: (): number[] => {
    if (!isBrowser) return [];
    
    const serviceIds: number[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.SERVICE_NAVIGATION_STATE)) {
        const match = key.match(/_(\d+)$/);
        if (match) {
          serviceIds.push(parseInt(match[1], 10));
        }
      }
    }
    
    return serviceIds;
  },
};

// Export default service state management interface
export default {
  useCurrentServiceId,
  useServiceNavigationState,
  useServiceState,
  serviceStatePersistence,
  STORAGE_KEYS,
};