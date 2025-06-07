/**
 * Database Service Types
 * 
 * Core TypeScript interfaces and type definitions for database service management,
 * extending React component types for comprehensive database service operations.
 * Provides type-safe contracts for current service management and database operations.
 * 
 * @fileoverview Core database service types for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// Re-export core database service types from component types for centralized access
export type {
  DatabaseDriver,
  ServiceTier,
  ServiceStatus,
  DatabaseType,
  DatabaseConfig,
  DatabaseService,
  ServiceType,
  ConfigSchema,
  ConfigFieldType,
  LabelType,
  SSLConfig,
  PoolingConfig,
  DatabaseOptions,
  ConnectionTestResult,
  ConnectionTestStatus,
  ConnectionMetadata,
  GenericListResponse,
  ApiErrorResponse,
  ResponseMetadata,
  DatabaseConnectionInput,
  ConnectionTestInput,
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  ServiceRow,
} from '../components/database-service/types';

export {
  DatabaseConnectionSchema,
  ConnectionTestSchema,
  DatabaseServiceQueryKeys,
} from '../components/database-service/types';

// =============================================================================
// CURRENT SERVICE SPECIFIC TYPES
// =============================================================================

/**
 * Current service state interface for hook management
 */
export interface CurrentServiceState {
  /** Currently selected service ID */
  currentServiceId: number | null;
  
  /** Currently selected service object (if available) */
  currentService: DatabaseService | null;
  
  /** Loading state for service operations */
  isLoading: boolean;
  
  /** Error state for service operations */
  error: string | null;
  
  /** Last update timestamp */
  lastUpdated: number | null;
}

/**
 * Current service actions interface
 */
export interface CurrentServiceActions {
  /** Set the current service by ID */
  setCurrentService: (serviceId: number | null) => void;
  
  /** Set the current service by service object */
  setCurrentServiceObject: (service: DatabaseService | null) => void;
  
  /** Clear the current service */
  clearCurrentService: () => void;
  
  /** Refresh current service data */
  refreshCurrentService: () => Promise<void>;
  
  /** Validate current service exists */
  validateCurrentService: () => Promise<boolean>;
}

/**
 * Complete current service context type
 */
export type CurrentServiceContextType = CurrentServiceState & CurrentServiceActions;

/**
 * Current service hook return type
 */
export interface UseCurrentServiceReturn extends CurrentServiceContextType {
  /** Check if a service is currently selected */
  hasCurrentService: boolean;
  
  /** Get current service name (if available) */
  currentServiceName: string | null;
  
  /** Get current service type (if available) */
  currentServiceType: DatabaseDriver | null;
  
  /** Check if current service is active */
  isCurrentServiceActive: boolean;
}

/**
 * Current service hook options
 */
export interface UseCurrentServiceOptions {
  /** Auto-validate service on mount */
  autoValidate?: boolean;
  
  /** Auto-clear invalid services */
  autoClearInvalid?: boolean;
  
  /** Enable automatic refresh */
  enableAutoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Storage key for localStorage */
  storageKey?: string;
  
  /** Default service ID on initialization */
  defaultServiceId?: number | null;
  
  /** Callback when service changes */
  onServiceChange?: (service: DatabaseService | null) => void;
  
  /** Callback when service validation fails */
  onValidationFailed?: (serviceId: number) => void;
  
  /** Callback when service is cleared */
  onServiceCleared?: () => void;
}

/**
 * Service validation result
 */
export interface ServiceValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Service object if valid */
  service?: DatabaseService;
  
  /** Validation error message if invalid */
  error?: string;
  
  /** Whether service was found but inactive */
  isInactive?: boolean;
  
  /** Whether service was found but not accessible */
  isNotAccessible?: boolean;
}

/**
 * Service selection event data
 */
export interface ServiceSelectionEvent {
  /** Previous service ID */
  previousServiceId: number | null;
  
  /** New service ID */
  newServiceId: number | null;
  
  /** Previous service object */
  previousService: DatabaseService | null;
  
  /** New service object */
  newService: DatabaseService | null;
  
  /** Selection timestamp */
  timestamp: number;
  
  /** Selection source */
  source: 'user' | 'auto' | 'validation' | 'storage' | 'default';
}

/**
 * Current service storage data structure
 */
export interface CurrentServiceStorageData {
  /** Service ID */
  serviceId: number | null;
  
  /** Storage timestamp */
  timestamp: number;
  
  /** Storage version for migration */
  version: number;
  
  /** Service metadata for validation */
  metadata?: {
    serviceName?: string;
    serviceType?: DatabaseDriver;
    lastValidated?: number;
  };
}

/**
 * Service list update event
 */
export interface ServiceListUpdateEvent {
  /** Updated services list */
  services: DatabaseService[];
  
  /** Services that were added */
  added: DatabaseService[];
  
  /** Services that were removed */
  removed: DatabaseService[];
  
  /** Services that were updated */
  updated: DatabaseService[];
  
  /** Whether current service was affected */
  currentServiceAffected: boolean;
  
  /** Update timestamp */
  timestamp: number;
}

/**
 * Service operation context
 */
export interface ServiceOperationContext {
  /** Operation type */
  operation: 'select' | 'clear' | 'refresh' | 'validate' | 'create' | 'update' | 'delete';
  
  /** Service ID being operated on */
  serviceId?: number;
  
  /** Service object being operated on */
  service?: DatabaseService;
  
  /** Operation timestamp */
  timestamp: number;
  
  /** Operation source */
  source: string;
  
  /** Additional operation metadata */
  metadata?: Record<string, any>;
}

// =============================================================================
// UTILITY TYPES FOR CURRENT SERVICE MANAGEMENT
// =============================================================================

/**
 * Service ID type (can be number or null)
 */
export type ServiceId = number | null;

/**
 * Service selection mode
 */
export type ServiceSelectionMode = 'manual' | 'auto' | 'restore' | 'fallback';

/**
 * Current service error types
 */
export type CurrentServiceError = 
  | 'SERVICE_NOT_FOUND'
  | 'SERVICE_INACTIVE'
  | 'SERVICE_NOT_ACCESSIBLE'
  | 'VALIDATION_FAILED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Service change reason
 */
export type ServiceChangeReason = 
  | 'user_selection'
  | 'service_created'
  | 'service_updated'
  | 'service_deleted'
  | 'service_deactivated'
  | 'session_restored'
  | 'validation_failed'
  | 'manual_clear'
  | 'auto_clear'
  | 'logout_clear';

// =============================================================================
// CONSTANTS AND DEFAULTS
// =============================================================================

/**
 * Default storage key for current service
 */
export const DEFAULT_CURRENT_SERVICE_STORAGE_KEY = 'currentServiceId' as const;

/**
 * Default refresh interval (5 minutes)
 */
export const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000 as const;

/**
 * Storage version for migration
 */
export const CURRENT_SERVICE_STORAGE_VERSION = 1 as const;

/**
 * Maximum age for cached service data (10 minutes)
 */
export const MAX_SERVICE_CACHE_AGE = 10 * 60 * 1000 as const;

/**
 * Default validation timeout (5 seconds)
 */
export const DEFAULT_VALIDATION_TIMEOUT = 5000 as const;

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if a value is a valid service ID
 */
export function isValidServiceId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Type guard to check if a service is active
 */
export function isServiceActive(service: DatabaseService): boolean {
  return service.is_active === true;
}

/**
 * Type guard to check if a service is accessible
 */
export function isServiceAccessible(service: DatabaseService): boolean {
  return service.is_active && !service.deletable === false;
}

/**
 * Type guard to check if storage data is valid
 */
export function isValidStorageData(data: unknown): data is CurrentServiceStorageData {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  return (
    (obj.serviceId === null || isValidServiceId(obj.serviceId)) &&
    typeof obj.timestamp === 'number' &&
    typeof obj.version === 'number'
  );
}

/**
 * Utility to create a storage data object
 */
export function createStorageData(
  serviceId: number | null,
  service?: DatabaseService
): CurrentServiceStorageData {
  return {
    serviceId,
    timestamp: Date.now(),
    version: CURRENT_SERVICE_STORAGE_VERSION,
    metadata: service ? {
      serviceName: service.name,
      serviceType: service.type,
      lastValidated: Date.now(),
    } : undefined,
  };
}

/**
 * Utility to extract service ID from various inputs
 */
export function extractServiceId(input: ServiceId | DatabaseService): ServiceId {
  if (input === null || typeof input === 'number') {
    return input;
  }
  if (typeof input === 'object' && 'id' in input) {
    return input.id;
  }
  return null;
}