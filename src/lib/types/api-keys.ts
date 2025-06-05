/**
 * API Key Management Types
 * 
 * Type definitions for API key management functionality, maintaining full 
 * compatibility with existing backend contracts while supporting React 
 * component integration patterns and workflows.
 * 
 * This module preserves all existing API key data contracts and provides
 * enhanced type safety for React-based administrative interfaces.
 */

/**
 * Individual API key information structure
 * 
 * Represents a single API key with its name and value. Used throughout
 * the React component hierarchy for displaying and managing API keys
 * in administrative interfaces.
 * 
 * @interface ApiKeyInfo
 * @property {string} name - Human-readable name for the API key
 * @property {string} apiKey - The actual API key value
 */
export interface ApiKeyInfo {
  name: string;
  apiKey: string;
}

/**
 * Service-specific API keys collection
 * 
 * Associates multiple API keys with a specific service ID. Used in
 * React components for managing service-level API key configurations
 * and bulk operations.
 * 
 * @interface ServiceApiKeys
 * @property {number} serviceId - Unique identifier for the service
 * @property {ApiKeyInfo[]} keys - Array of API keys associated with the service
 */
export interface ServiceApiKeys {
  serviceId: number;
  keys: ApiKeyInfo[];
}

/**
 * API key form data structure for React Hook Form integration
 * 
 * Defines the shape of form data when creating or editing API keys
 * in React components. Provides type safety for form validation
 * and submission workflows.
 * 
 * @interface ApiKeyFormData
 * @extends {Omit<ApiKeyInfo, 'apiKey'>}
 * @property {string} name - Name for the new API key
 * @property {boolean} [generateKey] - Whether to auto-generate the key
 */
export interface ApiKeyFormData extends Omit<ApiKeyInfo, 'apiKey'> {
  generateKey?: boolean;
}

/**
 * API key component props for React integration
 * 
 * Standard props interface for React components that display or
 * manage API key information. Ensures consistent prop typing
 * across the component hierarchy.
 * 
 * @interface ApiKeyComponentProps
 * @property {ApiKeyInfo[]} apiKeys - Array of API keys to display
 * @property {(key: ApiKeyInfo) => void} [onEdit] - Handler for edit operations
 * @property {(keyName: string) => void} [onDelete] - Handler for delete operations
 * @property {(formData: ApiKeyFormData) => void} [onCreate] - Handler for create operations
 * @property {boolean} [loading] - Loading state for async operations
 * @property {string} [error] - Error message for display
 */
export interface ApiKeyComponentProps {
  apiKeys: ApiKeyInfo[];
  onEdit?: (key: ApiKeyInfo) => void;
  onDelete?: (keyName: string) => void;
  onCreate?: (formData: ApiKeyFormData) => void;
  loading?: boolean;
  error?: string;
}

/**
 * Service API key management props for React components
 * 
 * Props interface for components that manage API keys at the service level.
 * Provides type safety for service-specific API key operations and batch
 * management workflows.
 * 
 * @interface ServiceApiKeyProps
 * @property {ServiceApiKeys} serviceApiKeys - Service and its associated API keys
 * @property {(serviceId: number, formData: ApiKeyFormData) => void} [onAddKey] - Handler for adding keys to service
 * @property {(serviceId: number, keyName: string) => void} [onRemoveKey] - Handler for removing keys from service
 * @property {boolean} [loading] - Loading state for service operations
 * @property {string} [error] - Error message for service-level operations
 */
export interface ServiceApiKeyProps {
  serviceApiKeys: ServiceApiKeys;
  onAddKey?: (serviceId: number, formData: ApiKeyFormData) => void;
  onRemoveKey?: (serviceId: number, keyName: string) => void;
  loading?: boolean;
  error?: string;
}

/**
 * API key validation result for form integration
 * 
 * Result structure for API key validation operations. Used in
 * React Hook Form validation workflows and real-time validation
 * feedback in administrative interfaces.
 * 
 * @interface ApiKeyValidationResult
 * @property {boolean} isValid - Whether the API key is valid
 * @property {string} [error] - Error message if validation fails
 * @property {string} [field] - Field name that failed validation
 */
export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Type guard for ApiKeyInfo validation
 * 
 * Runtime type checking function to validate API key objects.
 * Useful for ensuring data integrity in React components that
 * receive API key data from external sources.
 * 
 * @param obj - Object to validate
 * @returns {boolean} True if object is a valid ApiKeyInfo
 */
export function isApiKeyInfo(obj: unknown): obj is ApiKeyInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ApiKeyInfo).name === 'string' &&
    typeof (obj as ApiKeyInfo).apiKey === 'string'
  );
}

/**
 * Type guard for ServiceApiKeys validation
 * 
 * Runtime type checking function to validate service API key objects.
 * Ensures data structure integrity for React components handling
 * service-level API key collections.
 * 
 * @param obj - Object to validate
 * @returns {boolean} True if object is a valid ServiceApiKeys
 */
export function isServiceApiKeys(obj: unknown): obj is ServiceApiKeys {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ServiceApiKeys).serviceId === 'number' &&
    Array.isArray((obj as ServiceApiKeys).keys) &&
    (obj as ServiceApiKeys).keys.every(isApiKeyInfo)
  );
}

/**
 * API key management utility types for React components
 */

/**
 * Action types for API key operations in React components
 */
export type ApiKeyAction = 'create' | 'edit' | 'delete' | 'view';

/**
 * API key operation result for async operations
 */
export interface ApiKeyOperationResult {
  success: boolean;
  data?: ApiKeyInfo | ServiceApiKeys;
  error?: string;
}

/**
 * API key table row data for React table components
 * 
 * Extended API key information for table display with additional
 * metadata useful for administrative interfaces.
 */
export interface ApiKeyRowData extends ApiKeyInfo {
  id?: string;
  createdAt?: string;
  lastUsed?: string;
  isActive?: boolean;
}

/**
 * Service API key summary for dashboard components
 * 
 * Aggregated information about API keys for service overview
 * components and dashboard statistics.
 */
export interface ServiceApiKeySummary {
  serviceId: number;
  serviceName: string;
  totalKeys: number;
  activeKeys: number;
  lastActivity?: string;
}