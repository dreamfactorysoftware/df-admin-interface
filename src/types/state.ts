/**
 * Application State Management Types
 * 
 * Comprehensive type definitions for Zustand stores, React Query cache management,
 * server state synchronization, and component state patterns. Supports both client
 * and server-side state with React 19 concurrent features and Next.js SSR/ISR.
 * 
 * @fileoverview State management types for the DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, Zustand 5.0.3, TanStack React Query 5.79.2
 */

import type { StateCreator, UseBoundStore } from 'zustand';
import type { 
  QueryClient, 
  QueryKey, 
  QueryObserverOptions,
  MutationObserverOptions,
  UseQueryResult,
  UseMutationResult,
  InfiniteQueryObserverOptions,
  UseInfiniteQueryResult
} from '@tanstack/react-query';
import type { SWRConfiguration, SWRResponse } from 'swr';

// Re-export dependency types when available
// These will be properly typed once the dependency files are created
export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
};

// =============================================================================
// CORE STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Base state slice definition for Zustand stores
 * Provides common patterns for all state slices
 */
export interface BaseStateSlice {
  /** State loading indicators */
  isLoading: boolean;
  /** Error state management */
  error: string | null;
  /** Last updated timestamp */
  lastUpdated: number | null;
  /** Reset slice to initial state */
  reset: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * State creator type with enhanced typing for Zustand
 * Supports middleware and devtools integration
 */
export type StateSliceCreator<T> = StateCreator<
  T,
  [['zustand/devtools', never]],
  [],
  T
>;

/**
 * Store subscription callback type
 * For reactive state updates across components
 */
export type StoreSubscriber<T = any> = (state: T, prevState: T) => void;

// =============================================================================
// AUTHENTICATION STATE MANAGEMENT
// =============================================================================

/**
 * Authentication state slice
 * Manages user session, login status, and permissions
 */
export interface AuthState extends BaseStateSlice {
  /** Current authenticated user */
  user: User | null;
  /** Authentication token */
  token: string | null;
  /** Session expiration timestamp */
  expiresAt: number | null;
  /** Login loading state */
  isLoggingIn: boolean;
  /** Session refresh state */
  isRefreshing: boolean;
  
  // Actions
  /** Set authenticated user and token */
  setAuth: (user: User, token: string, expiresAt: number) => void;
  /** Clear authentication state */
  logout: () => void;
  /** Update user profile */
  updateUser: (updates: Partial<User>) => void;
  /** Set login loading state */
  setLoggingIn: (loading: boolean) => void;
  /** Set session refresh state */
  setRefreshing: (refreshing: boolean) => void;
  /** Check if session is valid */
  isSessionValid: () => boolean;
}

/**
 * Authentication store configuration
 */
export interface AuthStoreConfig {
  /** Enable persistent storage */
  persist: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Enable automatic token refresh */
  autoRefresh: boolean;
}

// =============================================================================
// UI STATE MANAGEMENT
// =============================================================================

/**
 * UI theme and preferences state
 */
export interface UIState extends BaseStateSlice {
  /** Current theme mode */
  theme: 'light' | 'dark' | 'system';
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Active navigation item */
  activeNavItem: string | null;
  /** Global loading overlay */
  globalLoading: boolean;
  /** Notification queue */
  notifications: NotificationItem[];
  /** Modal stack */
  modals: ModalItem[];
  
  // Actions
  /** Toggle theme mode */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  /** Toggle sidebar state */
  toggleSidebar: () => void;
  /** Set sidebar state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Set active navigation item */
  setActiveNavItem: (item: string | null) => void;
  /** Set global loading state */
  setGlobalLoading: (loading: boolean) => void;
  /** Add notification */
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  /** Remove notification */
  removeNotification: (id: string) => void;
  /** Open modal */
  openModal: (modal: Omit<ModalItem, 'id'>) => void;
  /** Close modal */
  closeModal: (id: string) => void;
  /** Close top modal */
  closeTopModal: () => void;
}

/**
 * Notification item structure
 */
export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
  duration?: number;
  actions?: NotificationAction[];
}

/**
 * Notification action button
 */
export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

/**
 * Modal item structure
 */
export interface ModalItem {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  options?: ModalOptions;
}

/**
 * Modal configuration options
 */
export interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  backdrop?: boolean;
  keyboard?: boolean;
  className?: string;
}

// =============================================================================
// SERVICE STATE MANAGEMENT
// =============================================================================

/**
 * Database service state slice
 * Manages database connections and configurations
 */
export interface ServiceState extends BaseStateSlice {
  /** List of available services */
  services: DatabaseService[];
  /** Currently selected service */
  currentService: DatabaseService | null;
  /** Service creation state */
  isCreating: boolean;
  /** Service testing state */
  isTesting: boolean;
  /** Last connection test results */
  testResults: Record<string, ServiceTestResult>;
  
  // Actions
  /** Set services list */
  setServices: (services: DatabaseService[]) => void;
  /** Add new service */
  addService: (service: DatabaseService) => void;
  /** Update existing service */
  updateService: (id: string, updates: Partial<DatabaseService>) => void;
  /** Remove service */
  removeService: (id: string) => void;
  /** Set current service */
  setCurrentService: (service: DatabaseService | null) => void;
  /** Set service creation state */
  setCreating: (creating: boolean) => void;
  /** Set service testing state */
  setTesting: (testing: boolean) => void;
  /** Update test result */
  setTestResult: (serviceId: string, result: ServiceTestResult) => void;
}

/**
 * Database service configuration
 */
export interface DatabaseService {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake';
  config: DatabaseConnectionConfig;
  status: 'active' | 'inactive' | 'error';
  lastTested: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database connection configuration
 */
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
  maxConnections?: number;
  [key: string]: any; // Allow additional driver-specific options
}

/**
 * Service connection test result
 */
export interface ServiceTestResult {
  success: boolean;
  message: string;
  duration: number;
  timestamp: number;
  details?: {
    version?: string;
    capabilities?: string[];
    tableCount?: number;
  };
}

// =============================================================================
// SCHEMA STATE MANAGEMENT
// =============================================================================

/**
 * Schema discovery state slice
 * Manages database schema exploration and metadata
 */
export interface SchemaState extends BaseStateSlice {
  /** Schema metadata by service ID */
  schemas: Record<string, DatabaseSchema>;
  /** Current schema being viewed */
  currentSchema: DatabaseSchema | null;
  /** Expanded tree nodes */
  expandedNodes: Set<string>;
  /** Selected table/entity */
  selectedTable: string | null;
  /** Schema discovery progress */
  discoveryProgress: Record<string, SchemaDiscoveryProgress>;
  
  // Actions
  /** Set schema for service */
  setSchema: (serviceId: string, schema: DatabaseSchema) => void;
  /** Set current schema */
  setCurrentSchema: (schema: DatabaseSchema | null) => void;
  /** Toggle node expansion */
  toggleNode: (nodeId: string) => void;
  /** Set selected table */
  setSelectedTable: (tableId: string | null) => void;
  /** Update discovery progress */
  setDiscoveryProgress: (serviceId: string, progress: SchemaDiscoveryProgress) => void;
  /** Clear schema data */
  clearSchema: (serviceId: string) => void;
}

/**
 * Database schema structure
 */
export interface DatabaseSchema {
  serviceId: string;
  tables: SchemaTable[];
  views: SchemaView[];
  relationships: SchemaRelationship[];
  indexes: SchemaIndex[];
  discoveredAt: number;
  version: string;
}

/**
 * Schema table definition
 */
export interface SchemaTable {
  id: string;
  name: string;
  schema?: string;
  fields: SchemaField[];
  primaryKey: string[];
  constraints: SchemaConstraint[];
  rowCount?: number;
  size?: number;
}

/**
 * Schema field definition
 */
export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  maxLength?: number;
  precision?: number;
  scale?: number;
  autoIncrement?: boolean;
}

/**
 * Schema view definition
 */
export interface SchemaView {
  id: string;
  name: string;
  definition: string;
  fields: SchemaField[];
}

/**
 * Schema relationship definition
 */
export interface SchemaRelationship {
  id: string;
  name: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * Schema index definition
 */
export interface SchemaIndex {
  id: string;
  name: string;
  table: string;
  fields: string[];
  unique: boolean;
  type: string;
}

/**
 * Schema constraint definition
 */
export interface SchemaConstraint {
  name: string;
  type: 'primary' | 'foreign' | 'unique' | 'check';
  fields: string[];
  reference?: {
    table: string;
    fields: string[];
  };
}

/**
 * Schema discovery progress tracking
 */
export interface SchemaDiscoveryProgress {
  phase: 'connecting' | 'discovering' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0-100
  tablesDiscovered: number;
  totalTables?: number;
  currentTable?: string;
  message: string;
  startedAt: number;
  duration?: number;
}

// =============================================================================
// SERVER STATE MANAGEMENT (React Query)
// =============================================================================

/**
 * Enhanced React Query configuration with DreamFactory optimizations
 */
export interface DreamFactoryQueryConfig extends QueryObserverOptions {
  /** Cache hit target under 50ms */
  cacheOptimization?: boolean;
  /** Enable background synchronization */
  backgroundSync?: boolean;
  /** Service-specific cache invalidation */
  serviceInvalidation?: string[];
  /** SSR/ISR compatibility mode */
  ssrMode?: boolean;
}

/**
 * SWR configuration with DreamFactory optimizations
 */
export interface DreamFactorySWRConfig extends SWRConfiguration {
  /** Cache hit target under 50ms */
  cacheOptimization?: boolean;
  /** Service-specific revalidation triggers */
  serviceRevalidation?: string[];
  /** Connection test optimization */
  connectionTestMode?: boolean;
}

/**
 * Optimistic update configuration
 */
export interface OptimisticUpdateConfig<TData, TVariables> {
  /** Optimistic update function */
  optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
  /** Rollback function on error */
  rollback: (context: { previousData: TData | undefined }) => void;
  /** Success confirmation */
  onSuccess?: (data: TData, variables: TVariables, context: any) => void;
  /** Error handling */
  onError?: (error: Error, variables: TVariables, context: any) => void;
}

/**
 * Server state query result with enhanced typing
 */
export type EnhancedQueryResult<TData, TError = Error> = UseQueryResult<TData, TError> & {
  /** Cache hit status */
  isCacheHit: boolean;
  /** Background sync status */
  isBackgroundSyncing: boolean;
  /** Last cache update timestamp */
  lastCacheUpdate: number | null;
};

/**
 * Server state mutation result with optimistic updates
 */
export type EnhancedMutationResult<TData, TError = Error, TVariables = void, TContext = unknown> = 
  UseMutationResult<TData, TError, TVariables, TContext> & {
    /** Optimistic update status */
    isOptimistic: boolean;
    /** Rollback function */
    rollback: () => void;
  };

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Cache management configuration
 */
export interface CacheConfig {
  /** Default stale time (5 minutes) */
  defaultStaleTime: number;
  /** Default cache time (10 minutes) */
  defaultCacheTime: number;
  /** Connection test cache (30 seconds) */
  connectionTestStaleTime: number;
  /** Schema discovery cache (15 minutes) */
  schemaDiscoveryStaleTime: number;
  /** Service list cache (5 minutes) */
  serviceListStaleTime: number;
  /** Enable cache persistence */
  persistCache: boolean;
  /** Cache size limits */
  maxCacheSize: number;
}

/**
 * Cache invalidation strategies
 */
export interface CacheInvalidationStrategy {
  /** Invalidate on service changes */
  serviceChanges: boolean;
  /** Invalidate on schema updates */
  schemaUpdates: boolean;
  /** Invalidate on authentication changes */
  authChanges: boolean;
  /** Custom invalidation rules */
  customRules: CacheInvalidationRule[];
}

/**
 * Cache invalidation rule
 */
export interface CacheInvalidationRule {
  /** Rule identifier */
  id: string;
  /** Query keys to invalidate */
  queryKeys: QueryKey[];
  /** Trigger conditions */
  triggers: string[];
  /** Debounce delay */
  debounce?: number;
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  /** Cache hit ratio */
  hitRatio: number;
  /** Average response time */
  averageResponseTime: number;
  /** Cache size */
  cacheSize: number;
  /** Background sync frequency */
  backgroundSyncCount: number;
  /** Last optimization timestamp */
  lastOptimized: number;
}

// =============================================================================
// REACT 19 CONCURRENT FEATURES
// =============================================================================

/**
 * Concurrent state management with React 19 features
 */
export interface ConcurrentStateConfig {
  /** Enable React 18+ concurrent rendering */
  enableConcurrentMode: boolean;
  /** Suspense boundary integration */
  suspenseIntegration: boolean;
  /** Transition management */
  transitionManagement: boolean;
  /** Selective hydration support */
  selectiveHydration: boolean;
}

/**
 * State transition management
 */
export interface StateTransition {
  /** Transition identifier */
  id: string;
  /** Current state */
  current: any;
  /** Next state */
  next: any;
  /** Transition progress */
  progress: number;
  /** Is transition pending */
  isPending: boolean;
  /** Start transition */
  startTransition: (callback: () => void) => void;
}

/**
 * Suspense-compatible state hooks
 */
export interface SuspenseStateHook<TData> {
  /** Data with suspense */
  data: TData;
  /** Error state */
  error: Error | null;
  /** Refresh function */
  refresh: () => void;
  /** Suspend if loading */
  suspend: boolean;
}

// =============================================================================
// STORE COMPOSITION
// =============================================================================

/**
 * Root application store combining all state slices
 */
export interface RootStore extends 
  AuthState,
  UIState,
  ServiceState,
  SchemaState {
  /** Store metadata */
  _meta: {
    version: string;
    initialized: boolean;
    lastAction: string | null;
    actionHistory: string[];
  };
  
  /** Initialize store */
  initialize: () => Promise<void>;
  /** Persist store state */
  persist: () => Promise<void>;
  /** Restore store state */
  restore: () => Promise<void>;
  /** Reset entire store */
  resetAll: () => void;
}

/**
 * Store middleware configuration
 */
export interface StoreMiddleware {
  /** Enable Redux DevTools */
  devtools: boolean;
  /** Enable persistence */
  persistence: boolean;
  /** Logger configuration */
  logger: {
    enabled: boolean;
    collapsed: boolean;
    filter: (action: string) => boolean;
  };
  /** Immer integration */
  immer: boolean;
}

/**
 * Store provider props
 */
export interface StoreProviderProps {
  children: React.ReactNode;
  /** Initial state */
  initialState?: Partial<RootStore>;
  /** Middleware configuration */
  middleware?: Partial<StoreMiddleware>;
  /** SSR hydration data */
  hydrationData?: any;
}

// =============================================================================
// HOOK TYPE DEFINITIONS
// =============================================================================

/**
 * Custom state hook return type
 */
export interface StateHookReturn<T> {
  /** Current state value */
  state: T;
  /** State setter */
  setState: (value: T | ((prev: T) => T)) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Reset function */
  reset: () => void;
}

/**
 * Async state hook return type
 */
export interface AsyncStateHookReturn<T> extends StateHookReturn<T> {
  /** Execute async operation */
  execute: (...args: any[]) => Promise<T>;
  /** Cancel pending operation */
  cancel: () => void;
  /** Is operation pending */
  isPending: boolean;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Zustand store type utility
 */
export type Store<T> = UseBoundStore<StateCreator<T, [], [], T>>;

/**
 * State selector utility type
 */
export type StateSelector<TState, TResult> = (state: TState) => TResult;

/**
 * State updater utility type
 */
export type StateUpdater<T> = (state: T) => void | T;

/**
 * Query cache utilities
 */
export type QueryCacheUtils = {
  invalidate: (queryKey: QueryKey) => void;
  remove: (queryKey: QueryKey) => void;
  clear: () => void;
  getQueryData: <T>(queryKey: QueryKey) => T | undefined;
  setQueryData: <T>(queryKey: QueryKey, data: T) => void;
};

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance tracking */
  enabled: boolean;
  /** Cache hit time threshold (50ms) */
  cacheHitThreshold: number;
  /** State update batch size */
  batchSize: number;
  /** Memory usage monitoring */
  memoryMonitoring: boolean;
  /** Performance metrics collection */
  metricsCollection: boolean;
}

/**
 * State performance metrics
 */
export interface StatePerformanceMetrics {
  /** State update frequency */
  updateFrequency: number;
  /** Average render time */
  averageRenderTime: number;
  /** Memory usage */
  memoryUsage: number;
  /** Cache performance */
  cachePerformance: CacheMetrics;
  /** Last measurement timestamp */
  lastMeasured: number;
}

// Default export for convenience
export default RootStore;