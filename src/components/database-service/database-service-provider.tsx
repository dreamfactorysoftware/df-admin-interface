/**
 * Database Service Provider Component
 * 
 * React context provider component that manages global database service state,
 * configuration, and shared functionality across all database service components.
 * Implements Zustand store integration for service list state management and 
 * provides context for service operations.
 * 
 * Migrated from Angular service dependency injection to React Context API with
 * Zustand state management, integrating SWR configuration for connection testing
 * and React Query setup for service management.
 * 
 * @fileoverview Database service provider with Zustand and SWR integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { SWRConfig } from 'swr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { apiClient } from '../../lib/api-client';
import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  GenericListResponse,
  DatabaseServiceSWRConfig,
  ServiceQueryParams,
  DatabaseConnectionFormData,
} from './types';

// =============================================================================
// ZUSTAND STORE INTERFACES
// =============================================================================

/**
 * Database service store state interface
 * Manages service list, selected service, and operation status
 */
interface DatabaseServiceStoreState {
  // Service list management
  services: DatabaseService[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Query parameters
  queryParams: ServiceQueryParams;
  
  // Selected service management
  selectedServiceId: number | null;
  selectedService: DatabaseService | null;
  
  // Operation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTesting: boolean;
  
  // Connection test state
  lastTestResult: ConnectionTestResult | null;
  testHistory: ConnectionTestResult[];
  
  // UI state
  showInactive: boolean;
  sidebarCollapsed: boolean;
  viewMode: 'list' | 'grid' | 'table';
  
  // Cache management
  cacheTimestamp: number | null;
  staleTreshold: number;
}

/**
 * Database service store actions interface
 */
interface DatabaseServiceStoreActions {
  // Service list actions
  setServices: (services: DatabaseService[], metadata?: { total: number; pages: number }) => void;
  addService: (service: DatabaseService) => void;
  updateService: (id: number, updates: Partial<DatabaseService>) => void;
  removeService: (id: number) => void;
  clearServices: () => void;
  
  // Loading and error state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Query parameter actions
  updateQueryParams: (params: Partial<ServiceQueryParams>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setTypeFilter: (type: DatabaseDriver | null) => void;
  setStatusFilter: (status: ServiceStatus | null) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Selected service actions
  selectService: (service: DatabaseService | null) => void;
  selectServiceById: (id: number | null) => void;
  clearSelection: () => void;
  
  // Operation state actions
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setTesting: (testing: boolean) => void;
  
  // Connection test actions
  setTestResult: (result: ConnectionTestResult) => void;
  addTestToHistory: (result: ConnectionTestResult) => void;
  clearTestHistory: () => void;
  
  // UI actions
  toggleShowInactive: () => void;
  setShowInactive: (show: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: 'list' | 'grid' | 'table') => void;
  
  // Cache actions
  refreshCache: () => void;
  invalidateCache: () => void;
  isDataStale: () => boolean;
  
  // Bulk actions
  resetStore: () => void;
  updateLastActivity: () => void;
}

/**
 * Complete Zustand store type
 */
type DatabaseServiceStore = DatabaseServiceStoreState & DatabaseServiceStoreActions;

// =============================================================================
// ZUSTAND STORE IMPLEMENTATION
// =============================================================================

/**
 * Default query parameters for service list
 */
const defaultQueryParams: ServiceQueryParams = {
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc',
};

/**
 * Default store state
 */
const defaultState: DatabaseServiceStoreState = {
  // Service list state
  services: [],
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 20,
  loading: false,
  error: null,
  lastUpdated: null,
  
  // Query state
  queryParams: defaultQueryParams,
  
  // Selection state
  selectedServiceId: null,
  selectedService: null,
  
  // Operation states
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isTesting: false,
  
  // Test state
  lastTestResult: null,
  testHistory: [],
  
  // UI state
  showInactive: false,
  sidebarCollapsed: false,
  viewMode: 'table',
  
  // Cache state
  cacheTimestamp: null,
  staleTreshold: 5 * 60 * 1000, // 5 minutes
};

/**
 * Database service Zustand store with persistence and subscribers
 */
const useDatabaseServiceStore = create<DatabaseServiceStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultState,
        
        // Service list actions
        setServices: (services, metadata) => {
          set({
            services,
            totalItems: metadata?.total ?? services.length,
            totalPages: metadata?.pages ?? Math.ceil(services.length / get().pageSize),
            lastUpdated: Date.now(),
            cacheTimestamp: Date.now(),
            error: null,
          });
        },
        
        addService: (service) => {
          const { services } = get();
          set({
            services: [service, ...services],
            totalItems: get().totalItems + 1,
            lastUpdated: Date.now(),
          });
        },
        
        updateService: (id, updates) => {
          const { services, selectedService } = get();
          const updatedServices = services.map(service =>
            service.id === id ? { ...service, ...updates } : service
          );
          
          set({
            services: updatedServices,
            selectedService: selectedService?.id === id 
              ? { ...selectedService, ...updates } 
              : selectedService,
            lastUpdated: Date.now(),
          });
        },
        
        removeService: (id) => {
          const { services, selectedService } = get();
          set({
            services: services.filter(service => service.id !== id),
            selectedService: selectedService?.id === id ? null : selectedService,
            selectedServiceId: get().selectedServiceId === id ? null : get().selectedServiceId,
            totalItems: Math.max(0, get().totalItems - 1),
            lastUpdated: Date.now(),
          });
        },
        
        clearServices: () => {
          set({
            services: [],
            totalItems: 0,
            totalPages: 0,
            selectedService: null,
            selectedServiceId: null,
            lastUpdated: Date.now(),
          });
        },
        
        // Loading and error actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // Query parameter actions
        updateQueryParams: (params) => {
          set({
            queryParams: { ...get().queryParams, ...params },
          });
        },
        
        setPage: (page) => {
          set({
            currentPage: page,
            queryParams: { ...get().queryParams, page },
          });
        },
        
        setPageSize: (size) => {
          set({
            pageSize: size,
            currentPage: 1, // Reset to first page
            queryParams: { ...get().queryParams, limit: size, page: 1 },
          });
        },
        
        setSearch: (search) => {
          set({
            currentPage: 1, // Reset to first page
            queryParams: { 
              ...get().queryParams, 
              search: search || undefined,
              page: 1 
            },
          });
        },
        
        setTypeFilter: (type) => {
          set({
            currentPage: 1,
            queryParams: {
              ...get().queryParams,
              type: type || undefined,
              page: 1,
            },
          });
        },
        
        setStatusFilter: (status) => {
          set({
            currentPage: 1,
            queryParams: {
              ...get().queryParams,
              status: status || undefined,
              page: 1,
            },
          });
        },
        
        setSorting: (sortBy, sortOrder) => {
          set({
            queryParams: { ...get().queryParams, sortBy, sortOrder },
          });
        },
        
        // Selection actions
        selectService: (service) => {
          set({
            selectedService: service,
            selectedServiceId: service?.id ?? null,
          });
        },
        
        selectServiceById: (id) => {
          const { services } = get();
          const service = id ? services.find(s => s.id === id) ?? null : null;
          set({
            selectedServiceId: id,
            selectedService: service,
          });
        },
        
        clearSelection: () => {
          set({
            selectedService: null,
            selectedServiceId: null,
          });
        },
        
        // Operation state actions
        setCreating: (creating) => set({ isCreating: creating }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setDeleting: (deleting) => set({ isDeleting: deleting }),
        setTesting: (testing) => set({ isTesting: testing }),
        
        // Test actions
        setTestResult: (result) => {
          set({
            lastTestResult: result,
          });
        },
        
        addTestToHistory: (result) => {
          const { testHistory } = get();
          const updatedHistory = [result, ...testHistory].slice(0, 10); // Keep last 10 tests
          set({
            testHistory: updatedHistory,
            lastTestResult: result,
          });
        },
        
        clearTestHistory: () => {
          set({
            testHistory: [],
            lastTestResult: null,
          });
        },
        
        // UI actions
        toggleShowInactive: () => {
          set({ showInactive: !get().showInactive });
        },
        
        setShowInactive: (show) => set({ showInactive: show }),
        
        toggleSidebar: () => {
          set({ sidebarCollapsed: !get().sidebarCollapsed });
        },
        
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        setViewMode: (mode) => set({ viewMode: mode }),
        
        // Cache actions
        refreshCache: () => {
          set({ cacheTimestamp: Date.now() });
        },
        
        invalidateCache: () => {
          set({ cacheTimestamp: null });
        },
        
        isDataStale: () => {
          const { cacheTimestamp, staleTreshold } = get();
          if (!cacheTimestamp) return true;
          return Date.now() - cacheTimestamp > staleTreshold;
        },
        
        // Utility actions
        resetStore: () => {
          set(defaultState);
        },
        
        updateLastActivity: () => {
          set({ lastUpdated: Date.now() });
        },
      }),
      {
        name: 'database-service-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only UI preferences and selected service
          showInactive: state.showInactive,
          sidebarCollapsed: state.sidebarCollapsed,
          viewMode: state.viewMode,
          pageSize: state.pageSize,
          selectedServiceId: state.selectedServiceId,
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration logic for version upgrades
            return {
              ...defaultState,
              ...persistedState,
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// =============================================================================
// REACT CONTEXT IMPLEMENTATION
// =============================================================================

/**
 * Database service context interface
 */
interface DatabaseServiceContextValue {
  // Zustand store hook
  useStore: typeof useDatabaseServiceStore;
  
  // Store selectors for performance optimization
  selectors: {
    services: () => DatabaseService[];
    selectedService: () => DatabaseService | null;
    loading: () => boolean;
    error: () => string | null;
    queryParams: () => ServiceQueryParams;
    isOperationInProgress: () => boolean;
    testResult: () => ConnectionTestResult | null;
  };
  
  // Common actions (pre-bound for convenience)
  actions: {
    refreshServices: () => void;
    testConnection: (config: DatabaseConnectionFormData) => Promise<ConnectionTestResult>;
    createService: (data: DatabaseConnectionFormData) => Promise<DatabaseService>;
    updateService: (id: number, data: Partial<DatabaseConnectionFormData>) => Promise<DatabaseService>;
    deleteService: (id: number) => Promise<void>;
  };
  
  // Configuration
  config: {
    staleTreshold: number;
    maxRetries: number;
    retryDelay: number;
    cacheTime: number;
  };
}

/**
 * Database service React context
 */
const DatabaseServiceContext = createContext<DatabaseServiceContextValue | null>(null);

// =============================================================================
// SWR CONFIGURATION
// =============================================================================

/**
 * Default SWR configuration for database services
 */
const defaultSWRConfig: DatabaseServiceSWRConfig = {
  // Performance optimization
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateOnInterval: 30000, // 30 seconds for service list
  dedupingInterval: 2000, // 2 seconds deduping
  
  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  focusThrottleInterval: 5000,
  
  // Loading behavior
  loadingTimeout: 10000,
  keepPreviousData: true,
  
  // Fetcher function with error handling
  fetcher: async (url: string) => {
    try {
      const response = await apiClient.get(url);
      if (response.error) {
        throw new Error(response.error.message || 'API request failed');
      }
      return response.data || response.resource;
    } catch (error) {
      console.error('SWR fetcher error:', error);
      throw error;
    }
  },
  
  // Error handler
  onError: (error, key) => {
    console.error(`SWR error for key ${key}:`, error);
    // Update store with error state
    useDatabaseServiceStore.getState().setError(error.message);
  },
  
  // Success handler
  onSuccess: (data, key) => {
    console.debug(`SWR success for key ${key}:`, data);
    // Clear any existing errors
    useDatabaseServiceStore.getState().clearError();
  },
};

// =============================================================================
// REACT QUERY CLIENT CONFIGURATION
// =============================================================================

/**
 * React Query client with optimized configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false, // Disable automatic polling
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      // Mutation retry configuration
      retry: 1,
      retryDelay: 1000,
      
      // Error handling
      throwOnError: false,
      
      // Optimistic updates
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['database-services'] });
      },
      
      onError: (error, variables, context) => {
        console.error('Mutation error:', error);
        useDatabaseServiceStore.getState().setError(error.message);
      },
      
      onSettled: () => {
        // Always refetch after mutation
        queryClient.invalidateQueries({ queryKey: ['database-services'] });
      },
    },
  },
});

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Database Service Provider Props
 */
interface DatabaseServiceProviderProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Custom SWR configuration */
  swrConfig?: Partial<DatabaseServiceSWRConfig>;
  
  /** Custom store configuration */
  storeConfig?: {
    staleTreshold?: number;
    maxRetries?: number;
    retryDelay?: number;
    cacheTime?: number;
  };
  
  /** Enable React Query DevTools */
  enableDevTools?: boolean;
  
  /** Debug mode */
  debug?: boolean;
}

/**
 * Database Service Provider Component
 * 
 * Provides global state management and context for database service operations.
 * Integrates Zustand store with SWR and React Query for comprehensive data management.
 */
export function DatabaseServiceProvider({
  children,
  swrConfig = {},
  storeConfig = {},
  enableDevTools = process.env.NODE_ENV === 'development',
  debug = false,
}: DatabaseServiceProviderProps) {
  // Merge configurations
  const finalSWRConfig = useMemo(() => ({
    ...defaultSWRConfig,
    ...swrConfig,
  }), [swrConfig]);
  
  const finalStoreConfig = useMemo(() => ({
    staleTreshold: 5 * 60 * 1000,
    maxRetries: 3,
    retryDelay: 1000,
    cacheTime: 10 * 60 * 1000,
    ...storeConfig,
  }), [storeConfig]);
  
  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('DatabaseServiceProvider initialized with config:', {
        swrConfig: finalSWRConfig,
        storeConfig: finalStoreConfig,
      });
    }
  }, [debug, finalSWRConfig, finalStoreConfig]);
  
  // Store selectors for performance optimization
  const selectors = useMemo(() => ({
    services: () => useDatabaseServiceStore((state) => state.services),
    selectedService: () => useDatabaseServiceStore((state) => state.selectedService),
    loading: () => useDatabaseServiceStore((state) => state.loading),
    error: () => useDatabaseServiceStore((state) => state.error),
    queryParams: () => useDatabaseServiceStore((state) => state.queryParams),
    isOperationInProgress: () => useDatabaseServiceStore((state) => 
      state.isCreating || state.isUpdating || state.isDeleting || state.isTesting
    ),
    testResult: () => useDatabaseServiceStore((state) => state.lastTestResult),
  }), []);
  
  // Common actions with error handling
  const actions = useMemo(() => ({
    refreshServices: () => {
      // Trigger cache invalidation
      useDatabaseServiceStore.getState().invalidateCache();
      queryClient.invalidateQueries({ queryKey: ['database-services'] });
    },
    
    testConnection: async (config: DatabaseConnectionFormData): Promise<ConnectionTestResult> => {
      const store = useDatabaseServiceStore.getState();
      store.setTesting(true);
      
      try {
        const response = await apiClient.post('/system/service/_test', config);
        const result = response.data as ConnectionTestResult;
        
        store.setTestResult(result);
        store.addTestToHistory(result);
        
        return result;
      } catch (error) {
        const errorResult: ConnectionTestResult = {
          success: false,
          message: error instanceof Error ? error.message : 'Connection test failed',
          timestamp: new Date().toISOString(),
          duration: 0,
          status: 'error',
        };
        
        store.setTestResult(errorResult);
        store.addTestToHistory(errorResult);
        
        throw error;
      } finally {
        store.setTesting(false);
      }
    },
    
    createService: async (data: DatabaseConnectionFormData): Promise<DatabaseService> => {
      const store = useDatabaseServiceStore.getState();
      store.setCreating(true);
      
      try {
        const response = await apiClient.post('/system/service', data);
        const service = response.data as DatabaseService;
        
        store.addService(service);
        store.selectService(service);
        
        return service;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to create service');
        throw error;
      } finally {
        store.setCreating(false);
      }
    },
    
    updateService: async (id: number, data: Partial<DatabaseConnectionFormData>): Promise<DatabaseService> => {
      const store = useDatabaseServiceStore.getState();
      store.setUpdating(true);
      
      try {
        const response = await apiClient.put(`/system/service/${id}`, data);
        const updatedService = response.data as DatabaseService;
        
        store.updateService(id, updatedService);
        
        return updatedService;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to update service');
        throw error;
      } finally {
        store.setUpdating(false);
      }
    },
    
    deleteService: async (id: number): Promise<void> => {
      const store = useDatabaseServiceStore.getState();
      store.setDeleting(true);
      
      try {
        await apiClient.delete(`/system/service/${id}`);
        store.removeService(id);
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to delete service');
        throw error;
      } finally {
        store.setDeleting(false);
      }
    },
  }), []);
  
  // Context value
  const contextValue: DatabaseServiceContextValue = useMemo(() => ({
    useStore: useDatabaseServiceStore,
    selectors,
    actions,
    config: finalStoreConfig,
  }), [selectors, actions, finalStoreConfig]);
  
  // Store subscription for debugging
  useEffect(() => {
    if (!debug) return;
    
    const unsubscribe = useDatabaseServiceStore.subscribe(
      (state) => state,
      (state) => {
        console.debug('Database service store updated:', state);
      }
    );
    
    return unsubscribe;
  }, [debug]);
  
  return (
    <DatabaseServiceContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <SWRConfig value={finalSWRConfig}>
          {children}
          {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
        </SWRConfig>
      </QueryClientProvider>
    </DatabaseServiceContext.Provider>
  );
}

// =============================================================================
// CONTEXT HOOK
// =============================================================================

/**
 * Hook to access database service context
 * 
 * @throws {Error} If used outside DatabaseServiceProvider
 * @returns Database service context value
 */
export function useDatabaseServiceContext(): DatabaseServiceContextValue {
  const context = useContext(DatabaseServiceContext);
  
  if (!context) {
    throw new Error(
      'useDatabaseServiceContext must be used within a DatabaseServiceProvider. ' +
      'Make sure to wrap your component tree with <DatabaseServiceProvider>.'
    );
  }
  
  return context;
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to access the Zustand store directly
 */
export function useDatabaseServiceStore(): DatabaseServiceStore {
  const { useStore } = useDatabaseServiceContext();
  return useStore();
}

/**
 * Hook to access store selectors
 */
export function useDatabaseServiceSelectors() {
  const { selectors } = useDatabaseServiceContext();
  return selectors;
}

/**
 * Hook to access common actions
 */
export function useDatabaseServiceActions() {
  const { actions } = useDatabaseServiceContext();
  return actions;
}

/**
 * Hook to access provider configuration
 */
export function useDatabaseServiceConfig() {
  const { config } = useDatabaseServiceContext();
  return config;
}

// =============================================================================
// EXPORT DEFAULT PROVIDER
// =============================================================================

export default DatabaseServiceProvider;

// Re-export types for external usage
export type { 
  DatabaseServiceContextValue,
  DatabaseServiceProviderProps,
  DatabaseServiceStore,
  DatabaseServiceStoreState,
  DatabaseServiceStoreActions,
};