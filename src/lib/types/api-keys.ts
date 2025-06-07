/**
 * API Key Management Types
 * 
 * Provides TypeScript interfaces for API key management within the DreamFactory Admin Interface.
 * These types maintain full compatibility with existing backend API contracts while supporting
 * React component integration patterns for administrative UI functionality.
 * 
 * @version 1.0.0
 * @author DreamFactory Team
 * @since React Migration v1.0
 */

/**
 * Core API key information interface
 * 
 * Represents individual API key details used throughout the admin interface.
 * This interface maintains strict compatibility with DreamFactory Core API responses
 * and provides type safety for React components handling API key data.
 * 
 * @interface ApiKeyInfo
 * @example
 * ```typescript
 * const apiKey: ApiKeyInfo = {
 *   name: "Production API Key",
 *   apiKey: "4f8c2e1a3b9d7f5e6c8a2b4d1e9f3a7c"
 * };
 * ```
 */
export interface ApiKeyInfo {
  /** Human-readable name for the API key (e.g., "Production Mobile App", "Development Testing") */
  name: string;
  
  /** The actual API key string used for authentication with DreamFactory APIs */
  apiKey: string;
}

/**
 * Service-associated API keys interface
 * 
 * Links database services with their associated API keys, supporting multi-key
 * configurations for different environments or applications. Used primarily
 * in React components for service configuration and API key management workflows.
 * 
 * @interface ServiceApiKeys
 * @example
 * ```typescript
 * const serviceKeys: ServiceApiKeys = {
 *   serviceId: 42,
 *   keys: [
 *     { name: "Production", apiKey: "prod_key_123" },
 *     { name: "Staging", apiKey: "staging_key_456" }
 *   ]
 * };
 * ```
 */
export interface ServiceApiKeys {
  /** Unique identifier for the database service */
  serviceId: number;
  
  /** Array of API keys associated with this service */
  keys: ApiKeyInfo[];
}

/**
 * API key creation request payload
 * 
 * Interface for new API key creation requests sent to the DreamFactory backend.
 * Used by React forms and API client methods for creating new API keys.
 * 
 * @interface CreateApiKeyRequest
 * @example
 * ```typescript
 * const createRequest: CreateApiKeyRequest = {
 *   name: "New Mobile App Key",
 *   description: "API key for mobile application access",
 *   expires_at: "2024-12-31T23:59:59Z"
 * };
 * ```
 */
export interface CreateApiKeyRequest {
  /** Descriptive name for the new API key */
  name: string;
  
  /** Optional description explaining the key's purpose */
  description?: string;
  
  /** Optional expiration timestamp (ISO 8601 format) */
  expires_at?: string;
}

/**
 * Complete API key details including metadata
 * 
 * Extended interface containing full API key information including creation
 * timestamps, expiration details, and usage tracking. Used by React components
 * for detailed API key management views.
 * 
 * @interface ApiKeyDetails
 * @extends ApiKeyInfo
 * @example
 * ```typescript
 * const keyDetails: ApiKeyDetails = {
 *   name: "Production API Key",
 *   apiKey: "4f8c2e1a3b9d7f5e6c8a2b4d1e9f3a7c",
 *   id: 123,
 *   description: "Main production environment key",
 *   created_at: "2024-01-15T10:30:00Z",
 *   expires_at: "2024-12-31T23:59:59Z",
 *   is_active: true,
 *   last_used_at: "2024-06-01T14:22:15Z"
 * };
 * ```
 */
export interface ApiKeyDetails extends ApiKeyInfo {
  /** Unique database identifier for the API key */
  id: number;
  
  /** Optional description of the key's purpose */
  description?: string;
  
  /** Creation timestamp (ISO 8601 format) */
  created_at: string;
  
  /** Expiration timestamp (ISO 8601 format), null if no expiration */
  expires_at?: string | null;
  
  /** Active status of the API key */
  is_active: boolean;
  
  /** Last usage timestamp (ISO 8601 format), null if never used */
  last_used_at?: string | null;
}

/**
 * API key validation result
 * 
 * Interface for API key validation responses from the backend.
 * Used by React components to display validation status and handle
 * authentication workflows.
 * 
 * @interface ApiKeyValidationResult
 * @example
 * ```typescript
 * const validation: ApiKeyValidationResult = {
 *   isValid: true,
 *   keyInfo: {
 *     name: "Production API Key",
 *     apiKey: "4f8c2e1a3b9d7f5e6c8a2b4d1e9f3a7c"
 *   },
 *   permissions: ["database.*", "api.*"],
 *   expiresIn: 86400
 * };
 * ```
 */
export interface ApiKeyValidationResult {
  /** Whether the API key is valid and active */
  isValid: boolean;
  
  /** API key information if validation successful */
  keyInfo?: ApiKeyInfo;
  
  /** Array of permissions granted to this API key */
  permissions?: string[];
  
  /** Time until expiration in seconds, null if no expiration */
  expiresIn?: number | null;
  
  /** Error message if validation failed */
  error?: string;
}

/**
 * React hook return type for API key management
 * 
 * Standardized interface for React hooks that manage API key operations.
 * Provides consistent typing for loading states, error handling, and
 * CRUD operations across API key management components.
 * 
 * @interface UseApiKeysResult
 * @template T - The type of API key data being managed
 * @example
 * ```typescript
 * const {
 *   apiKeys,
 *   isLoading,
 *   error,
 *   createApiKey,
 *   deleteApiKey,
 *   refreshKeys
 * } = useApiKeys();
 * ```
 */
export interface UseApiKeysResult<T = ApiKeyDetails> {
  /** Array of API keys */
  apiKeys: T[];
  
  /** Loading state for API operations */
  isLoading: boolean;
  
  /** Error state from API operations */
  error: Error | null;
  
  /** Function to create a new API key */
  createApiKey: (request: CreateApiKeyRequest) => Promise<T>;
  
  /** Function to delete an API key by ID */
  deleteApiKey: (keyId: number) => Promise<void>;
  
  /** Function to refresh the API keys list */
  refreshKeys: () => Promise<void>;
  
  /** Function to validate an API key */
  validateKey?: (apiKey: string) => Promise<ApiKeyValidationResult>;
}

/**
 * React form props for API key components
 * 
 * Standardized props interface for React components that handle API key
 * forms and user interactions. Supports both creation and editing workflows
 * with consistent callback patterns.
 * 
 * @interface ApiKeyFormProps
 * @example
 * ```typescript
 * const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
 *   initialData,
 *   onSubmit,
 *   onCancel,
 *   isLoading
 * }) => {
 *   // Component implementation
 * };
 * ```
 */
export interface ApiKeyFormProps {
  /** Initial form data for editing existing keys */
  initialData?: Partial<ApiKeyDetails>;
  
  /** Callback fired when form is submitted */
  onSubmit: (data: CreateApiKeyRequest) => Promise<void>;
  
  /** Callback fired when form is cancelled */
  onCancel?: () => void;
  
  /** Loading state to disable form during submission */
  isLoading?: boolean;
  
  /** Error message to display in form */
  error?: string | null;
}

/**
 * API key list component props
 * 
 * Props interface for React components that display lists of API keys
 * with management actions. Supports filtering, sorting, and bulk operations.
 * 
 * @interface ApiKeyListProps
 * @example
 * ```typescript
 * const ApiKeyList: React.FC<ApiKeyListProps> = ({
 *   apiKeys,
 *   onEdit,
 *   onDelete,
 *   onRefresh,
 *   isLoading
 * }) => {
 *   // Component implementation
 * };
 * ```
 */
export interface ApiKeyListProps {
  /** Array of API keys to display */
  apiKeys: ApiKeyDetails[];
  
  /** Callback fired when editing an API key */
  onEdit?: (key: ApiKeyDetails) => void;
  
  /** Callback fired when deleting an API key */
  onDelete?: (keyId: number) => Promise<void>;
  
  /** Callback fired when refreshing the list */
  onRefresh?: () => Promise<void>;
  
  /** Loading state for the list */
  isLoading?: boolean;
  
  /** Error state for the list */
  error?: string | null;
  
  /** Optional filter function for the keys */
  filterFn?: (key: ApiKeyDetails) => boolean;
}

/**
 * Type guard for checking if an object is a valid ApiKeyInfo
 * 
 * @param obj - Object to check
 * @returns True if object matches ApiKeyInfo interface
 * @example
 * ```typescript
 * if (isApiKeyInfo(data)) {
 *   // data is guaranteed to be ApiKeyInfo
 *   console.log(data.apiKey);
 * }
 * ```
 */
export function isApiKeyInfo(obj: any): obj is ApiKeyInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.apiKey === 'string'
  );
}

/**
 * Type guard for checking if an object is a valid ServiceApiKeys
 * 
 * @param obj - Object to check
 * @returns True if object matches ServiceApiKeys interface
 * @example
 * ```typescript
 * if (isServiceApiKeys(data)) {
 *   // data is guaranteed to be ServiceApiKeys
 *   console.log(data.serviceId, data.keys.length);
 * }
 * ```
 */
export function isServiceApiKeys(obj: any): obj is ServiceApiKeys {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.serviceId === 'number' &&
    Array.isArray(obj.keys) &&
    obj.keys.every(isApiKeyInfo)
  );
}

/**
 * Default values for API key forms
 * 
 * Provides sensible defaults for creating new API keys in React forms.
 * Used to initialize form state and provide consistent user experience.
 */
export const DEFAULT_API_KEY_FORM_VALUES: CreateApiKeyRequest = {
  name: '',
  description: '',
  expires_at: undefined,
};

/**
 * API key status enum for React components
 * 
 * Standardized status values for displaying API key states in the UI.
 * Used by React components for conditional styling and status indicators.
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

/**
 * Helper function to determine API key status
 * 
 * @param key - API key details to check
 * @returns Current status of the API key
 * @example
 * ```typescript
 * const status = getApiKeyStatus(keyDetails);
 * if (status === ApiKeyStatus.EXPIRED) {
 *   // Show expiration warning
 * }
 * ```
 */
export function getApiKeyStatus(key: ApiKeyDetails): ApiKeyStatus {
  if (!key.is_active) {
    return ApiKeyStatus.INACTIVE;
  }
  
  if (key.expires_at) {
    const expirationDate = new Date(key.expires_at);
    const now = new Date();
    
    if (expirationDate <= now) {
      return ApiKeyStatus.EXPIRED;
    }
  }
  
  return ApiKeyStatus.ACTIVE;
}

// Re-export core interfaces for backward compatibility
export type { ApiKeyInfo, ServiceApiKeys };