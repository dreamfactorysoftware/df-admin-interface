/**
 * @fileoverview Barrel export file for ADF API Docs services
 * @description Exports useApiKeys hook and related types for clean module importing
 * 
 * Provides a centralized export point for all API key management functionality
 * within the adf-api-docs services directory, enabling consistent imports
 * across components while following Next.js 15.1+ conventions.
 * 
 * @version 1.0.0
 * @author DreamFactory Team
 * 
 * Key Features:
 * - Modern React/Next.js module organization standards
 * - TypeScript 5.8+ enhanced template literal types and improved inference
 * - Clean component imports following barrel export patterns
 * - Enhanced developer experience with centralized type exports
 * - React Query-powered API key management with intelligent caching
 */

// =============================================================================
// CORE HOOK EXPORTS
// =============================================================================

/**
 * Export the primary useApiKeys hook for API key management
 * Replaces Angular ApiKeysService with React Query-powered data fetching
 * 
 * Features:
 * - Service-specific API key retrieval with intelligent caching
 * - React Query integration for background synchronization
 * - Optimistic updates and error handling
 * - Compatible with Next.js server components and SSR
 */
export { useApiKeys } from './useApiKeys';

/**
 * Export default hook for convenient importing
 * Supports both named and default import patterns
 */
export { useApiKeys as default } from './useApiKeys';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core API key interface for type safety
 * Maintains compatibility with existing DreamFactory API structure
 */
export interface ApiKeyInfo {
  /** Human-readable name/label for the API key */
  name: string;
  
  /** The actual API key value */
  apiKey: string;
  
  /** Optional API key identifier */
  id?: number;
  
  /** Associated role information */
  role?: {
    id: number;
    name: string;
  };
  
  /** Service access permissions */
  serviceAccess?: Array<{
    serviceId: number;
    serviceName: string;
    component: string;
  }>;
  
  /** Key metadata */
  metadata?: {
    createdAt?: string;
    lastUsed?: string;
    expiresAt?: string;
  };
}

/**
 * Service-specific API keys collection
 * Organizes keys by service ID for efficient lookup
 */
export interface ServiceApiKeys {
  /** Service identifier */
  serviceId: number;
  
  /** Array of API keys for this service */
  keys: ApiKeyInfo[];
  
  /** Cache timestamp for React Query optimization */
  lastFetched?: Date;
}

/**
 * API key hook configuration options
 * Customizes hook behavior for different use cases
 */
export interface UseApiKeysOptions {
  /** Service ID to fetch keys for (-1 for all services) */
  serviceId?: number;
  
  /** Enable automatic refetching on window focus */
  refetchOnWindowFocus?: boolean;
  
  /** Cache time in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  
  /** Stale time in milliseconds (default: 1 minute) */
  staleTime?: number;
  
  /** Enable background refetching */
  refetchInBackground?: boolean;
  
  /** Retry configuration */
  retry?: boolean | number | ((failureCount: number, error: Error) => boolean);
}

/**
 * API key hook return type
 * Provides comprehensive state and actions for components
 */
export interface UseApiKeysReturn {
  /** Current API keys data */
  data: ApiKeyInfo[] | undefined;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Data fetching state */
  isFetching: boolean;
  
  /** Stale data indicator */
  isStale: boolean;
  
  /** Manual refetch function */
  refetch: () => Promise<ApiKeyInfo[]>;
  
  /** Clear cache for this service */
  invalidate: () => Promise<void>;
  
  /** Mutation functions for key management */
  mutations: {
    /** Create new API key */
    createKey: (keyData: Partial<ApiKeyInfo>) => Promise<ApiKeyInfo>;
    
    /** Update existing API key */
    updateKey: (keyId: number, keyData: Partial<ApiKeyInfo>) => Promise<ApiKeyInfo>;
    
    /** Delete API key */
    deleteKey: (keyId: number) => Promise<void>;
  };
}

/**
 * Error types for API key operations
 * Provides detailed error information for better UX
 */
export interface ApiKeyError extends Error {
  /** HTTP status code */
  status?: number;
  
  /** Error code from API */
  code?: string;
  
  /** Detailed error context */
  context?: {
    serviceId?: number;
    operation?: 'fetch' | 'create' | 'update' | 'delete';
    timestamp?: Date;
  };
}

// =============================================================================
// UTILITY TYPE EXPORTS
// =============================================================================

/**
 * Type guard for ApiKeyInfo validation
 * Ensures type safety at runtime
 */
export type ApiKeyInfoGuard = (obj: any) => obj is ApiKeyInfo;

/**
 * Extract API key names type utility
 * Useful for type-safe key selection
 */
export type ApiKeyNames<T extends readonly ApiKeyInfo[]> = T[number]['name'];

/**
 * Conditional API key type based on service context
 * Enables context-specific typing
 */
export type ConditionalApiKey<T extends number> = T extends -1 
  ? ApiKeyInfo[] 
  : ServiceApiKeys;

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Default configuration for API key management
 * Optimized for React Query performance requirements
 */
export const DEFAULT_API_KEYS_CONFIG: Required<UseApiKeysOptions> = {
  serviceId: -1,
  refetchOnWindowFocus: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes - meets cache performance requirements
  staleTime: 1 * 60 * 1000,  // 1 minute - ensures fresh data
  refetchInBackground: true,
  retry: 3,
} as const;

/**
 * Query key factory for React Query cache management
 * Provides consistent cache key generation
 */
export const apiKeysQueryKeys = {
  /** Base key for all API key queries */
  all: ['apiKeys'] as const,
  
  /** Service-specific keys */
  byService: (serviceId: number) => ['apiKeys', 'service', serviceId] as const,
  
  /** Global keys (all services) */
  global: () => ['apiKeys', 'global'] as const,
  
  /** Keys with filters */
  filtered: (filters: Record<string, any>) => ['apiKeys', 'filtered', filters] as const,
} as const;

// =============================================================================
// DEPRECATED EXPORTS (For Migration Compatibility)
// =============================================================================

/**
 * @deprecated Use ApiKeyInfo instead
 * Maintained for backward compatibility during migration
 */
export type LegacyApiKeyInfo = ApiKeyInfo;

/**
 * @deprecated Use useApiKeys instead
 * Maintained for smooth Angular to React migration
 */
export type ApiKeysService = {
  getApiKeysForService: (serviceId: number) => Promise<ApiKeyInfo[]>;
  clearCache: () => void;
};

// =============================================================================
// TYPE EXPORT AGGREGATION
// =============================================================================

/**
 * Comprehensive type export for external consumption
 * Enables clean destructured imports
 */
export type {
  // Primary interfaces
  ApiKeyInfo,
  ServiceApiKeys,
  UseApiKeysOptions,
  UseApiKeysReturn,
  ApiKeyError,
  
  // Utility types
  ApiKeyInfoGuard,
  ApiKeyNames,
  ConditionalApiKey,
  
  // Legacy compatibility
  LegacyApiKeyInfo,
  ApiKeysService,
};

/**
 * Re-export all types from useApiKeys module for convenience
 * Ensures comprehensive type coverage without duplication
 */
export type * from './useApiKeys';