/**
 * State Management Types for DreamFactory Admin Interface
 * 
 * Comprehensive state management type definitions supporting:
 * - Zustand stores for global client state
 * - React Query for intelligent server state caching
 * - SWR for stale-while-revalidate data fetching
 * - Next.js SSR/ISR integration
 * - React 19 concurrent features
 * - Optimistic update patterns
 * 
 * Performance Requirements:
 * - Cache hit responses under 50ms
 * - Real-time validation under 100ms
 * - Middleware processing under 100ms
 */

import { StateCreator, StoreApi } from 'zustand';
import { QueryClient, UseQueryOptions, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import { SWRConfiguration, SWRResponse } from 'swr';

// ==============================================================================
// CORE STATE TYPES
// ==============================================================================

/**
 * Base state interface for all Zustand stores
 */
export interface BaseState {
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error state with optional error object */
  error: string | null;
  /** Last updated timestamp for cache invalidation */
  lastUpdated: number;
}

/**
 * State creator with enhanced TypeScript inference for Zustand stores
 */
export type StateSlice<T> = StateCreator<
  T,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  T
>;

/**
 * Store subscription callback type for reactive state updates
 */
export type StoreSubscription<T> = (state: T, previousState: T) => void;

// ==============================================================================
// USER STATE MANAGEMENT
// ==============================================================================

/**
 * User session data converted from Angular DfUserDataService
 */
export interface UserSession {
  /** User ID from DreamFactory API */
  id: number;
  /** Display name for the authenticated user */
  displayName: string;
  /** Primary email address */
  email: string;
  /** Session token for API authentication */
  sessionToken: string;
  /** System administrator privilege flag */
  isSysAdmin: boolean;
  /** Root administrator privilege flag */
  isRootAdmin: boolean;
  /** Associated role ID for RBAC */
  roleId?: number;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Phone number for contact */
  phone?: string;
  /** Last login timestamp */
  lastLoginDate?: string;
  /** Session expiration timestamp */
  expiresAt?: number;
}

/**
 * User authentication state slice for Zustand store
 */
export interface UserState extends BaseState {
  /** Current authenticated user session */
  user: UserSession | null;
  /** Authentication status flag */
  isAuthenticated: boolean;
  /** Session token storage key */
  sessionToken: string | null;
  /** User's restricted access permissions */
  restrictedAccess: string[];
  /** Available system roles for the user */
  availableRoles: Array<{ id: number; name: string; }>;
  
  // Actions
  /** Set user session data */
  setUser: (user: UserSession | null) => void;
  /** Update authentication status */
  setAuthenticated: (isAuthenticated: boolean) => void;
  /** Store session token securely */
  setSessionToken: (token: string | null) => void;
  /** Update restricted access list */
  setRestrictedAccess: (access: string[]) => void;
  /** Clear all user data and logout */
  logout: () => void;
  /** Refresh user session data */
  refreshUser: () => Promise<void>;
}

// ==============================================================================
// SERVICE STATE MANAGEMENT
// ==============================================================================

/**
 * Database service configuration converted from Angular DfCurrentServiceService
 */
export interface DatabaseService {
  /** Service identifier */
  id: number;
  /** Service display name */
  name: string;
  /** Service type (database, auth, etc.) */
  type: string;
  /** Service description */
  description?: string;
  /** Service configuration parameters */
  config: Record<string, any>;
  /** Service active status */
  isActive: boolean;
  /** Service creation timestamp */
  createdDate?: string;
  /** Last modification timestamp */
  lastModifiedDate?: string;
}

/**
 * Current service selection state slice
 */
export interface ServiceState extends BaseState {
  /** Currently selected service ID */
  currentServiceId: number;
  /** List of available services */
  services: DatabaseService[];
  /** Currently selected service details */
  currentService: DatabaseService | null;
  /** Service connection test results */
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
  /** Last connection test timestamp */
  lastConnectionTest: number | null;
  
  // Actions
  /** Set the current active service */
  setCurrentServiceId: (id: number) => void;
  /** Update the services list */
  setServices: (services: DatabaseService[]) => void;
  /** Clear current service selection */
  clearCurrentService: () => void;
  /** Test database connection */
  testConnection: (serviceId: number) => Promise<boolean>;
  /** Refresh services list */
  refreshServices: () => Promise<void>;
}

// ==============================================================================
// APPLICATION UI STATE
// ==============================================================================

/**
 * Global UI state for layout, theme, and navigation
 */
export interface UIState extends BaseState {
  /** Current theme selection */
  theme: 'light' | 'dark' | 'system';
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Navigation drawer open state for mobile */
  drawerOpen: boolean;
  /** Active loading spinners by key */
  loadingSpinners: Record<string, boolean>;
  /** Global notification messages */
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    autoHide?: boolean;
    duration?: number;
  }>;
  /** Current page title */
  pageTitle: string;
  /** Breadcrumb navigation items */
  breadcrumbs: Array<{ label: string; href?: string; }>;
  
  // Actions
  /** Toggle theme between light/dark */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
  /** Toggle mobile navigation drawer */
  toggleDrawer: () => void;
  /** Show/hide loading spinner by key */
  setLoading: (key: string, loading: boolean) => void;
  /** Add notification message */
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  /** Remove notification by ID */
  removeNotification: (id: string) => void;
  /** Set page title and breadcrumbs */
  setPageContext: (title: string, breadcrumbs: UIState['breadcrumbs']) => void;
}

// ==============================================================================
// COMBINED APP STORE TYPE
// ==============================================================================

/**
 * Combined application store type with all state slices
 */
export type AppStore = UserState & ServiceState & UIState;

/**
 * Zustand store API type for the combined application store
 */
export type AppStoreApi = StoreApi<AppStore>;

// ==============================================================================
// REACT QUERY TYPES
// ==============================================================================

/**
 * Enhanced query options with performance optimizations
 */
export interface QueryOptions<TData, TError = Error, TQueryKey extends QueryKey = QueryKey>
  extends UseQueryOptions<TData, TError, TData, TQueryKey> {
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Cache time override for performance requirements */
  cacheTime?: number;
  /** Stale time for background revalidation */
  staleTime?: number;
  /** Retry configuration for failed requests */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  /** Background refetch configuration */
  refetchInterval?: number | false;
}

/**
 * Enhanced mutation options with optimistic updates
 */
export interface MutationOptions<TData, TError = Error, TVariables = unknown, TContext = unknown>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Optimistic update function */
  onOptimisticUpdate?: (variables: TVariables) => TContext;
  /** Rollback function for failed optimistic updates */
  onOptimisticError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
}

/**
 * Server state management configuration
 */
export interface ServerStateConfig {
  /** Query client instance */
  queryClient: QueryClient;
  /** Default cache time (10 minutes) */
  defaultCacheTime: number;
  /** Default stale time (5 minutes) */
  defaultStaleTime: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay function */
  retryDelay: (attemptIndex: number) => number;
  /** Global error handler */
  onError?: (error: Error) => void;
}

/**
 * Query invalidation patterns for cache management
 */
export interface QueryInvalidation {
  /** Exact query keys to invalidate */
  exact?: QueryKey[];
  /** Query key prefixes to invalidate */
  prefixes?: QueryKey[];
  /** Invalidate all queries */
  all?: boolean;
  /** Refetch active queries after invalidation */
  refetchActive?: boolean;
}

// ==============================================================================
// SWR TYPES
// ==============================================================================

/**
 * Enhanced SWR configuration with performance optimizations
 */
export interface SWRConfig extends SWRConfiguration {
  /** Dedupe interval for request deduplication */
  dedupingInterval?: number;
  /** Focus revalidation throttle */
  focusThrottleInterval?: number;
  /** Loading timeout */
  loadingTimeout?: number;
  /** Error retry count */
  errorRetryCount?: number;
  /** Error retry interval */
  errorRetryInterval?: number;
  /** Cache provider for custom storage */
  provider?: () => Map<string, any>;
  /** Global error handler */
  onError?: (error: Error, key: string) => void;
  /** Global success handler */
  onSuccess?: (data: any, key: string) => void;
}

/**
 * SWR response with enhanced type safety
 */
export interface SWRResponseEnhanced<TData, TError = Error> extends SWRResponse<TData, TError> {
  /** Optimistic data for immediate UI updates */
  optimisticData?: TData;
  /** Update optimistic data */
  setOptimisticData: (data: TData) => void;
  /** Clear optimistic data */
  clearOptimisticData: () => void;
}

// ==============================================================================
// DUAL QUERY SUPPORT
// ==============================================================================

/**
 * Dual query configuration for SWR + React Query
 */
export interface DualQueryConfig<TData, TError = Error> {
  /** Primary fetching strategy */
  primary: 'swr' | 'react-query';
  /** SWR configuration */
  swr?: SWRConfig;
  /** React Query configuration */
  reactQuery?: QueryOptions<TData, TError>;
  /** Data synchronization strategy */
  sync?: 'bidirectional' | 'swr-to-rq' | 'rq-to-swr';
  /** Conflict resolution strategy */
  conflictResolution?: 'latest-wins' | 'primary-wins' | 'merge';
}

/**
 * Dual query response combining SWR and React Query
 */
export interface DualQueryResponse<TData, TError = Error> {
  /** Combined data from both sources */
  data?: TData;
  /** Loading state from either source */
  isLoading: boolean;
  /** Error from either source */
  error?: TError;
  /** Validation state */
  isValidating: boolean;
  /** Mutation function */
  mutate: (data?: TData) => Promise<TData | undefined>;
  /** SWR-specific response */
  swr: SWRResponseEnhanced<TData, TError>;
  /** React Query-specific response */
  reactQuery: {
    data?: TData;
    isLoading: boolean;
    error?: TError;
    refetch: () => void;
  };
}

// ==============================================================================
// SERVER COMPONENT INTEGRATION
// ==============================================================================

/**
 * Server component state hydration
 */
export interface ServerStateHydration {
  /** Initial server-rendered data */
  initialData: Record<string, any>;
  /** Hydration timestamp */
  hydratedAt: number;
  /** Client-side revalidation needed */
  needsRevalidation: boolean;
  /** Server component props */
  serverProps?: Record<string, any>;
}

/**
 * SSR/ISR state synchronization
 */
export interface SSRStateSynchronization {
  /** Server-rendered state */
  serverState: Partial<AppStore>;
  /** Client state differences */
  clientDiff: Partial<AppStore>;
  /** Synchronization status */
  syncStatus: 'pending' | 'synchronized' | 'conflict';
  /** Last sync timestamp */
  lastSync: number;
  /** Resolve state conflicts */
  resolveConflicts: () => void;
}

// ==============================================================================
// CONCURRENT FEATURES (REACT 19)
// ==============================================================================

/**
 * React 19 concurrent rendering state
 */
export interface ConcurrentState {
  /** Transition state for non-urgent updates */
  isPending: boolean;
  /** Start transition for state updates */
  startTransition: (callback: () => void) => void;
  /** Defer updates for better UX */
  useDeferredValue: <T>(value: T) => T;
  /** Suspense boundary control */
  suspenseKeys: Set<string>;
}

/**
 * Optimistic update state for React 19
 */
export interface OptimisticUpdateState<T> {
  /** Current optimistic value */
  optimisticState: T;
  /** Add optimistic update */
  addOptimistic: (action: T | ((state: T) => T)) => void;
  /** Pending optimistic updates */
  pending: boolean;
  /** Rollback all optimistic updates */
  rollback: () => void;
}

// ==============================================================================
// CACHE MANAGEMENT
// ==============================================================================

/**
 * Cache entry metadata for performance monitoring
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Cache creation timestamp */
  createdAt: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Access count for LRU eviction */
  accessCount: number;
  /** TTL for automatic expiration */
  ttl?: number;
  /** Validation function */
  isValid?: () => boolean;
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Cache hit ratio */
  hitRatio: number;
  /** Average response time for hits */
  avgHitTime: number;
  /** Average response time for misses */
  avgMissTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Number of cached entries */
  entryCount: number;
}

/**
 * Cache invalidation strategy
 */
export interface CacheInvalidationStrategy {
  /** Time-based invalidation */
  ttl?: number;
  /** Tag-based invalidation */
  tags?: string[];
  /** Version-based invalidation */
  version?: string;
  /** Custom validation function */
  validate?: (entry: CacheEntry<any>) => boolean;
  /** Invalidation dependencies */
  dependencies?: string[];
}

// ==============================================================================
// TYPE UTILITIES
// ==============================================================================

/**
 * Extract state type from a Zustand store
 */
export type StateOf<T> = T extends StoreApi<infer S> ? S : never;

/**
 * Extract actions from a state interface
 */
export type ActionsOf<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

/**
 * Extract data properties from a state interface
 */
export type DataOf<T> = Omit<T, keyof ActionsOf<T>>;

/**
 * Make state properties reactive
 */
export type ReactiveState<T> = {
  readonly [K in keyof T]: T[K];
} & {
  /** Subscribe to state changes */
  subscribe: (listener: (state: T) => void) => () => void;
  /** Get current state snapshot */
  getState: () => T;
};

// ==============================================================================
// EXPORTS
// ==============================================================================

/**
 * Re-export commonly used types for convenience
 */
export type {
  StateCreator,
  StoreApi,
  QueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  SWRConfiguration,
  SWRResponse,
};

/**
 * Default export containing all state management types
 */
export default {
  BaseState,
  UserState,
  ServiceState,
  UIState,
  AppStore,
  ServerStateConfig,
  DualQueryConfig,
  ConcurrentState,
  OptimisticUpdateState,
  CacheMetrics,
  CacheInvalidationStrategy,
};