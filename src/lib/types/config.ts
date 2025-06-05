/**
 * CORS Configuration Data Types
 * 
 * Provides type definitions for Cross-Origin Resource Sharing (CORS) configuration
 * management in the DreamFactory Admin Interface. This module maintains full API 
 * compatibility with the DreamFactory backend while supporting React component 
 * integration patterns for administrative configuration workflows.
 * 
 * Key Features:
 * - Backend API compatibility for CORS configuration endpoints
 * - React Hook Form integration support for configuration forms
 * - Type-safe CORS policy management with validation
 * - Next.js environment configuration patterns
 * - Real-time configuration updates with SWR caching
 * 
 * @module CorsConfiguration
 * @since 1.0.0 (React/Next.js Migration)
 */

/**
 * CORS Configuration Data Interface
 * 
 * Represents a complete CORS configuration entry with all metadata fields
 * required for DreamFactory backend API compatibility. This interface is used
 * throughout the React application for CORS policy display, editing, and
 * validation workflows.
 * 
 * @interface CorsConfigData
 * @description Complete CORS configuration with audit trail information
 * 
 * @example
 * ```typescript
 * // React component usage with SWR data fetching
 * const { data: corsConfigs } = useSWR<CorsConfigData[]>(
 *   '/api/v2/system/cors',
 *   fetcher,
 *   {
 *     revalidateOnFocus: false,
 *     dedupingInterval: 30000, // 30 seconds
 *   }
 * );
 * 
 * // React Hook Form integration for editing
 * const { register, handleSubmit, formState: { errors } } = useForm<CorsConfigFormData>({
 *   resolver: zodResolver(corsConfigSchema),
 *   defaultValues: {
 *     origin: corsConfig.origin,
 *     method: corsConfig.method,
 *     header: corsConfig.header,
 *     // ... other fields
 *   }
 * });
 * ```
 */
export interface CorsConfigData {
  /** Unique identifier for the CORS configuration entry */
  id: number;
  
  /** Origin patterns allowed for cross-origin requests (e.g., "*", "https://example.com") */
  origin: string;
  
  /** HTTP methods allowed for CORS requests */
  method: string[];
  
  /** Headers allowed in CORS requests */
  header: string;
  
  /** Additional headers exposed to client in CORS responses */
  exposedHeader: string | null;
  
  /** Path pattern this CORS configuration applies to (e.g., "/api/*") */
  path: string;
  
  /** Maximum cache time for preflight requests in seconds */
  maxAge: number;
  
  /** Whether credentials (cookies, auth headers) are allowed in CORS requests */
  supportsCredentials: boolean;
  
  /** Whether this CORS configuration is currently active */
  enabled: boolean;
  
  /** Human-readable description of this CORS configuration */
  description: string;
  
  /** ID of the user who created this configuration */
  createdById: number | null;
  
  /** ISO 8601 timestamp when this configuration was created */
  createdDate: string | null;
  
  /** ID of the user who last modified this configuration */
  lastModifiedById: number | null;
  
  /** ISO 8601 timestamp when this configuration was last modified */
  lastModifiedDate: string | null;
}

/**
 * CORS Configuration Form Data
 * 
 * Streamlined interface for React Hook Form integration, focusing on user-editable
 * fields while excluding system-managed metadata. This interface is designed for
 * form validation with Zod schemas and real-time input handling.
 * 
 * @interface CorsConfigFormData
 * @description User-editable CORS configuration fields for form components
 * 
 * @example
 * ```typescript
 * // Zod validation schema for form data
 * const corsConfigFormSchema = z.object({
 *   origin: z.string().min(1, 'Origin is required'),
 *   method: z.array(z.string()).min(1, 'At least one method must be selected'),
 *   header: z.string().min(1, 'Header configuration is required'),
 *   exposedHeader: z.string().nullable(),
 *   path: z.string().min(1, 'Path pattern is required'),
 *   maxAge: z.number().min(0, 'Max age must be non-negative'),
 *   supportsCredentials: z.boolean(),
 *   enabled: z.boolean(),
 *   description: z.string().min(1, 'Description is required'),
 * });
 * 
 * type CorsConfigFormData = z.infer<typeof corsConfigFormSchema>;
 * ```
 */
export interface CorsConfigFormData {
  /** Origin patterns for CORS requests */
  origin: string;
  
  /** Allowed HTTP methods for CORS */
  method: string[];
  
  /** Allowed headers in CORS requests */
  header: string;
  
  /** Headers exposed to client in responses */
  exposedHeader: string | null;
  
  /** Path pattern for CORS application */
  path: string;
  
  /** Preflight cache duration in seconds */
  maxAge: number;
  
  /** Whether to allow credentials in CORS requests */
  supportsCredentials: boolean;
  
  /** Whether this CORS configuration is active */
  enabled: boolean;
  
  /** Description of this CORS configuration */
  description: string;
}

/**
 * CORS Configuration Create Payload
 * 
 * Payload interface for creating new CORS configurations via the DreamFactory API.
 * This interface matches the expected request body format for POST operations.
 * 
 * @interface CreateCorsConfigPayload
 * @description Request payload for creating CORS configurations
 */
export interface CreateCorsConfigPayload extends CorsConfigFormData {}

/**
 * CORS Configuration Update Payload
 * 
 * Payload interface for updating existing CORS configurations. Includes the
 * required ID field along with all editable configuration fields.
 * 
 * @interface UpdateCorsConfigPayload
 * @description Request payload for updating CORS configurations
 */
export interface UpdateCorsConfigPayload extends CorsConfigFormData {
  /** ID of the CORS configuration to update */
  id: number;
}

/**
 * CORS Configuration List Response
 * 
 * Response interface for CORS configuration list endpoints, providing metadata
 * for pagination and collection management in React components.
 * 
 * @interface CorsConfigListResponse
 * @description API response for CORS configuration collections
 */
export interface CorsConfigListResponse {
  /** Array of CORS configuration entries */
  resource: CorsConfigData[];
  
  /** Total count of CORS configurations */
  count: number;
  
  /** Metadata for pagination and collection state */
  meta?: {
    /** Current page number (1-based) */
    page?: number;
    
    /** Number of items per page */
    perPage?: number;
    
    /** Total number of pages */
    totalPages?: number;
  };
}

/**
 * HTTP Methods for CORS Configuration
 * 
 * Standard HTTP methods that can be configured for CORS policies.
 * This enum provides type safety for method selection in React components.
 * 
 * @enum HttpMethod
 * @description Available HTTP methods for CORS configuration
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Common CORS Header Configurations
 * 
 * Predefined header configurations for common CORS scenarios. These constants
 * can be used in React select components and form defaults.
 * 
 * @constant CORS_HEADER_PRESETS
 * @description Common header configurations for CORS policies
 */
export const CORS_HEADER_PRESETS = {
  /** Allow all headers */
  ALL: '*',
  
  /** Standard content headers */
  CONTENT: 'Content-Type, Content-Length, Accept, Authorization',
  
  /** API authentication headers */
  API_AUTH: 'Content-Type, Authorization, X-API-Key, X-Requested-With',
  
  /** Custom application headers */
  CUSTOM: 'Content-Type, Authorization, X-Custom-Header',
  
  /** Minimal headers for basic requests */
  MINIMAL: 'Content-Type, Accept',
} as const;

/**
 * Common CORS Origin Patterns
 * 
 * Predefined origin patterns for typical deployment scenarios. These can be
 * used as suggestions in React form components for origin configuration.
 * 
 * @constant CORS_ORIGIN_PRESETS
 * @description Common origin patterns for CORS policies
 */
export const CORS_ORIGIN_PRESETS = {
  /** Allow all origins (development only) */
  ALL: '*',
  
  /** Local development origins */
  LOCALHOST: 'http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000',
  
  /** HTTPS only origins */
  HTTPS_ONLY: 'https://*',
  
  /** Specific domain pattern */
  DOMAIN: 'https://*.example.com',
  
  /** Multiple specific domains */
  MULTIPLE: 'https://app.example.com,https://admin.example.com',
} as const;

/**
 * CORS Configuration Validation Rules
 * 
 * Validation constants for CORS configuration fields, used in React Hook Form
 * validation and Zod schema definitions.
 * 
 * @constant CORS_VALIDATION
 * @description Validation rules for CORS configuration fields
 */
export const CORS_VALIDATION = {
  /** Maximum length for origin field */
  ORIGIN_MAX_LENGTH: 2048,
  
  /** Maximum length for header field */
  HEADER_MAX_LENGTH: 1024,
  
  /** Maximum length for path field */
  PATH_MAX_LENGTH: 512,
  
  /** Maximum length for description field */
  DESCRIPTION_MAX_LENGTH: 255,
  
  /** Minimum max age value */
  MIN_MAX_AGE: 0,
  
  /** Maximum max age value (24 hours) */
  MAX_MAX_AGE: 86400,
  
  /** Default max age value (10 minutes) */
  DEFAULT_MAX_AGE: 600,
} as const;

/**
 * Type guard to check if an object is a valid CorsConfigData
 * 
 * @param obj - Object to validate
 * @returns True if object matches CorsConfigData interface
 */
export function isCorsConfigData(obj: unknown): obj is CorsConfigData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const config = obj as Record<string, unknown>;
  
  return (
    typeof config.id === 'number' &&
    typeof config.origin === 'string' &&
    Array.isArray(config.method) &&
    typeof config.header === 'string' &&
    typeof config.path === 'string' &&
    typeof config.maxAge === 'number' &&
    typeof config.supportsCredentials === 'boolean' &&
    typeof config.enabled === 'boolean' &&
    typeof config.description === 'string'
  );
}

/**
 * React Hook Form Integration Types
 * 
 * Additional types to support React Hook Form integration patterns for
 * CORS configuration management workflows.
 */

/**
 * CORS Configuration Form Field Names
 * 
 * Type-safe field names for React Hook Form registration and validation.
 * This ensures consistency across form components and validation schemas.
 */
export type CorsConfigFormField = keyof CorsConfigFormData;

/**
 * CORS Configuration Form Errors
 * 
 * Error structure for React Hook Form validation, providing detailed
 * field-level error information for user feedback.
 */
export type CorsConfigFormErrors = Partial<Record<CorsConfigFormField, {
  message?: string;
  type?: string;
}>>;

/**
 * SWR Configuration for CORS Data Fetching
 * 
 * Optimized SWR configuration for CORS configuration data fetching,
 * providing intelligent caching and revalidation patterns.
 */
export interface CorsConfigSWRConfig {
  /** Revalidate on window focus */
  revalidateOnFocus: boolean;
  
  /** Deduplication interval in milliseconds */
  dedupingInterval: number;
  
  /** Error retry count */
  errorRetryCount: number;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Default SWR configuration for CORS data
 */
export const DEFAULT_CORS_SWR_CONFIG: CorsConfigSWRConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  refreshInterval: undefined, // No automatic refresh
};