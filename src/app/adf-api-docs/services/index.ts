/**
 * API Documentation Services - Barrel Export
 * 
 * Centralized export point for all API key management functionality within the
 * adf-api-docs services directory. Provides clean module importing for React hooks
 * and related types, following Next.js 15.1+ conventions and modern React patterns.
 * 
 * This module replaces the Angular ApiKeysService with React Query-powered hooks,
 * maintaining functional parity while leveraging modern data fetching patterns
 * for enhanced caching, background synchronization, and optimistic updates.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024
 */

// ============================================================================
// PRIMARY HOOK EXPORTS
// ============================================================================

/**
 * Main API keys management hook
 * 
 * Replaces Angular ApiKeysService with React Query-powered data fetching,
 * providing intelligent caching, background synchronization, and automatic
 * re-validation for API key management workflows.
 * 
 * Features:
 * - Real-time API key retrieval per service ID
 * - Intelligent caching with background refresh
 * - Optimistic updates for better UX
 * - Error handling with React Error Boundary integration
 * - Server-side rendering compatibility
 * 
 * @example
 * ```tsx
 * import { useApiKeys } from '@/app/adf-api-docs/services';
 * 
 * function ApiKeySelector({ serviceId }: { serviceId: number }) {
 *   const { 
 *     apiKeys, 
 *     isLoading, 
 *     error, 
 *     refetch,
 *     clearCache 
 *   } = useApiKeys(serviceId);
 * 
 *   if (isLoading) return <div>Loading API keys...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <select>
 *       {apiKeys.map(key => (
 *         <option key={key.name} value={key.apiKey}>
 *           {key.name} - {key.apiKey.substring(0, 8)}...
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export { useApiKeys } from './useApiKeys';

// ============================================================================
// TYPE DEFINITIONS EXPORTS
// ============================================================================

/**
 * Core API key information interface
 * 
 * Represents a single API key entry with name and token information.
 * Migrated from Angular ApiKeyInfo type to maintain backward compatibility
 * while adding enhanced TypeScript 5.8+ template literal types.
 * 
 * @interface ApiKeyInfo
 * @property {string} name - Human-readable name for the API key
 * @property {string} apiKey - The actual API key token (typically 32-64 characters)
 * @property {number} [roleId] - Associated role ID for RBAC integration
 * @property {string} [description] - Optional description of the key's purpose
 * @property {Date} [createdAt] - Timestamp when the key was created
 * @property {Date} [expiresAt] - Optional expiration timestamp
 * @property {boolean} [isActive] - Whether the key is currently active
 * @property {string[]} [permissions] - Associated permissions for the key
 * 
 * @example
 * ```typescript
 * const apiKey: ApiKeyInfo = {
 *   name: 'Production API Access',
 *   apiKey: 'sk_live_abcd1234...',
 *   roleId: 1,
 *   description: 'Production environment access key',
 *   createdAt: new Date('2024-01-15'),
 *   isActive: true,
 *   permissions: ['read', 'write']
 * };
 * ```
 */
export type { ApiKeyInfo } from './useApiKeys';

/**
 * Service-specific API keys mapping interface
 * 
 * Maps service IDs to their associated API key collections, enabling
 * efficient caching and batch operations across multiple services.
 * 
 * @interface ServiceApiKeys
 * @property {Record<number, ApiKeyInfo[]>} keys - Service ID to API keys mapping
 * @property {Date} lastUpdated - Timestamp of last cache update
 * @property {number} cacheVersion - Version number for cache invalidation
 * 
 * @example
 * ```typescript
 * const serviceKeys: ServiceApiKeys = {
 *   keys: {
 *     1: [{ name: 'DB Key 1', apiKey: 'key1...' }],
 *     2: [{ name: 'DB Key 2', apiKey: 'key2...' }]
 *   },
 *   lastUpdated: new Date(),
 *   cacheVersion: 1
 * };
 * ```
 */
export type { ServiceApiKeys } from './useApiKeys';

/**
 * API key query configuration options
 * 
 * Enhanced configuration interface for React Query integration,
 * providing fine-grained control over caching, refetching, and
 * background synchronization behaviors.
 * 
 * @interface ApiKeyQueryOptions
 * @extends UseQueryOptions from @tanstack/react-query
 * 
 * @example
 * ```typescript
 * const options: ApiKeyQueryOptions = {
 *   enabled: serviceId > 0,
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 *   cacheTime: 10 * 60 * 1000, // 10 minutes
 *   refetchOnWindowFocus: false,
 *   retry: 3
 * };
 * ```
 */
export type { ApiKeyQueryOptions } from './useApiKeys';

/**
 * API key mutation configuration for create/update/delete operations
 * 
 * Configuration interface for API key modification operations,
 * including optimistic updates and error handling strategies.
 * 
 * @interface ApiKeyMutationOptions
 * @extends UseMutationOptions from @tanstack/react-query
 */
export type { ApiKeyMutationOptions } from './useApiKeys';

/**
 * API key validation result interface
 * 
 * Result structure for API key validation operations, including
 * validation status, error details, and suggested actions.
 * 
 * @interface ApiKeyValidationResult
 * @property {boolean} isValid - Whether the API key is valid
 * @property {string} [error] - Error message if validation failed
 * @property {Date} [checkedAt] - Timestamp of validation check
 * @property {string[]} [warnings] - Non-blocking validation warnings
 */
export type { ApiKeyValidationResult } from './useApiKeys';

// ============================================================================
// UTILITY FUNCTION EXPORTS
// ============================================================================

/**
 * API key query key factory
 * 
 * Standardized query key generation for React Query cache management.
 * Provides consistent cache key structure for efficient invalidation
 * and cache segmentation across different API key operations.
 * 
 * @example
 * ```typescript
 * import { apiKeyQueryKeys } from '@/app/adf-api-docs/services';
 * 
 * // Get query keys for service-specific API keys
 * const serviceKeys = apiKeyQueryKeys.service(serviceId);
 * 
 * // Get query keys for all API keys
 * const allKeys = apiKeyQueryKeys.all();
 * 
 * // Invalidate cache
 * await queryClient.invalidateQueries({ 
 *   queryKey: apiKeyQueryKeys.service(serviceId) 
 * });
 * ```
 */
export { apiKeyQueryKeys } from './useApiKeys';

/**
 * API key formatting utilities
 * 
 * Collection of utility functions for API key display, masking,
 * and validation to ensure consistent presentation across components.
 * 
 * @example
 * ```typescript
 * import { formatApiKey, maskApiKey, validateApiKeyFormat } from '@/app/adf-api-docs/services';
 * 
 * const masked = maskApiKey('sk_live_abcd1234efgh5678', 8); // "sk_live_abcd1234..."
 * const isValid = validateApiKeyFormat('sk_live_abcd1234efgh5678'); // true
 * const formatted = formatApiKey('sk_live_abcd1234efgh5678', 'preview'); // "sk_live_abcd1234"
 * ```
 */
export { 
  formatApiKey, 
  maskApiKey, 
  validateApiKeyFormat,
  getApiKeyPreview 
} from './useApiKeys';

/**
 * API key cache management utilities
 * 
 * Advanced cache management functions for manual cache manipulation,
 * bulk operations, and cache optimization strategies.
 * 
 * @example
 * ```typescript
 * import { clearApiKeyCache, refreshAllApiKeys, bulkUpdateApiKeys } from '@/app/adf-api-docs/services';
 * 
 * // Clear cache for specific service
 * await clearApiKeyCache(serviceId);
 * 
 * // Refresh all cached API keys
 * await refreshAllApiKeys();
 * 
 * // Bulk update multiple service keys
 * await bulkUpdateApiKeys([
 *   { serviceId: 1, keys: [newKey1] },
 *   { serviceId: 2, keys: [newKey2] }
 * ]);
 * ```
 */
export {
  clearApiKeyCache,
  refreshAllApiKeys,
  bulkUpdateApiKeys,
  optimisticUpdateApiKey
} from './useApiKeys';

// ============================================================================
// REACT QUERY INTEGRATION EXPORTS
// ============================================================================

/**
 * Pre-configured React Query options for API key operations
 * 
 * Optimized default configurations for different API key query scenarios,
 * balancing performance, user experience, and data freshness requirements.
 * 
 * @example
 * ```typescript
 * import { defaultApiKeyQueryOptions, realtimeApiKeyOptions } from '@/app/adf-api-docs/services';
 * 
 * // Use default options for most cases
 * const { data } = useQuery({
 *   ...defaultApiKeyQueryOptions,
 *   queryKey: ['apiKeys', serviceId],
 *   queryFn: () => fetchApiKeys(serviceId)
 * });
 * 
 * // Use realtime options for critical updates
 * const { data } = useQuery({
 *   ...realtimeApiKeyOptions,
 *   queryKey: ['apiKeys', serviceId],
 *   queryFn: () => fetchApiKeys(serviceId)
 * });
 * ```
 */
export {
  defaultApiKeyQueryOptions,
  realtimeApiKeyOptions,
  backgroundApiKeyOptions,
  cachedApiKeyOptions
} from './useApiKeys';

/**
 * API key mutation factories
 * 
 * Pre-configured mutation functions for common API key operations,
 * including optimistic updates, error handling, and cache invalidation.
 * 
 * @example
 * ```typescript
 * import { createApiKeyMutation, updateApiKeyMutation, deleteApiKeyMutation } from '@/app/adf-api-docs/services';
 * 
 * const createMutation = useMutation(createApiKeyMutation({
 *   onSuccess: (data, variables) => {
 *     // Handle successful creation
 *     toast.success(`API key "${data.name}" created successfully`);
 *   },
 *   onError: (error) => {
 *     // Handle creation error
 *     toast.error(`Failed to create API key: ${error.message}`);
 *   }
 * }));
 * ```
 */
export {
  createApiKeyMutation,
  updateApiKeyMutation,
  deleteApiKeyMutation,
  validateApiKeyMutation
} from './useApiKeys';

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

/**
 * API key operation types enumeration
 * 
 * Standardized operation types for API key management workflows,
 * enabling type-safe operation handling and consistent UI behavior.
 */
export { ApiKeyOperation } from './useApiKeys';

/**
 * Default configuration constants
 * 
 * Standard configuration values for API key management, including
 * cache durations, retry policies, and display preferences.
 */
export {
  API_KEY_CACHE_TIME,
  API_KEY_STALE_TIME,
  API_KEY_RETRY_COUNT,
  API_KEY_PREVIEW_LENGTH,
  DEFAULT_API_KEY_OPTIONS
} from './useApiKeys';

// ============================================================================
// ERROR HANDLING EXPORTS
// ============================================================================

/**
 * API key specific error types and utilities
 * 
 * Specialized error handling for API key operations, including
 * user-friendly error messages and recovery suggestions.
 * 
 * @example
 * ```typescript
 * import { ApiKeyError, isApiKeyError, handleApiKeyError } from '@/app/adf-api-docs/services';
 * 
 * try {
 *   await createApiKey(newKeyData);
 * } catch (error) {
 *   if (isApiKeyError(error)) {
 *     handleApiKeyError(error, {
 *       onDuplicate: () => toast.error('API key name already exists'),
 *       onUnauthorized: () => router.push('/login'),
 *       onGeneral: (err) => toast.error(`Error: ${err.message}`)
 *     });
 *   }
 * }
 * ```
 */
export type { ApiKeyError } from './useApiKeys';
export { isApiKeyError, handleApiKeyError, formatApiKeyError } from './useApiKeys';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export containing all API key management functionality
 * 
 * Comprehensive object export for scenarios requiring namespace-style imports
 * or when all functionality needs to be imported under a single identifier.
 * 
 * @example
 * ```typescript
 * import ApiKeysServices from '@/app/adf-api-docs/services';
 * 
 * function Component() {
 *   const { apiKeys, isLoading } = ApiKeysServices.useApiKeys(serviceId);
 *   const maskedKey = ApiKeysServices.maskApiKey(apiKeys[0]?.apiKey);
 *   
 *   return <div>{maskedKey}</div>;
 * }
 * ```
 */
const ApiKeysServices = {
  // Hooks
  useApiKeys,
  
  // Utilities
  formatApiKey,
  maskApiKey,
  validateApiKeyFormat,
  getApiKeyPreview,
  clearApiKeyCache,
  refreshAllApiKeys,
  bulkUpdateApiKeys,
  optimisticUpdateApiKey,
  
  // Query helpers
  apiKeyQueryKeys,
  defaultApiKeyQueryOptions,
  realtimeApiKeyOptions,
  backgroundApiKeyOptions,
  cachedApiKeyOptions,
  
  // Mutations
  createApiKeyMutation,
  updateApiKeyMutation,
  deleteApiKeyMutation,
  validateApiKeyMutation,
  
  // Error handling
  isApiKeyError,
  handleApiKeyError,
  formatApiKeyError
} as const;

export default ApiKeysServices;

// ============================================================================
// TYPE UTILITIES FOR EXTERNAL CONSUMPTION
// ============================================================================

/**
 * Type utility for extracting API key data from hook results
 * 
 * Helper type for components that need to work with API key data
 * without importing the full hook interface.
 */
export type ExtractApiKeyData<T> = T extends { apiKeys: infer U } ? U : never;

/**
 * Type utility for API key hook options
 * 
 * Helper type for creating custom API key hook wrappers or
 * configuration objects that extend the base options.
 */
export type ApiKeyHookOptions = Parameters<typeof useApiKeys>[1];

/**
 * Type utility for API key hook return type
 * 
 * Helper type for components that need to accept API key hook
 * results as props or work with the return value structure.
 */
export type ApiKeyHookResult = ReturnType<typeof useApiKeys>;

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Re-export common React Query types for API key operations
 * 
 * Convenience re-exports to avoid additional imports when working
 * with React Query patterns in API key management contexts.
 */
export type {
  UseQueryResult,
  UseMutationResult,
  QueryKey,
  MutationKey
} from '@tanstack/react-query';

/**
 * Re-export SWR types for alternative data fetching patterns
 * 
 * Support for components that prefer SWR over React Query
 * for API key data fetching and caching.
 */
export type {
  SWRResponse,
  SWRConfiguration,
  Key as SWRKey
} from 'swr';