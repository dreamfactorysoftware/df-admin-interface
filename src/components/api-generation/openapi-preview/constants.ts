/**
 * OpenAPI Preview Constants
 * 
 * Configuration constants and default values for OpenAPI preview components including 
 * SwaggerUI configuration, theme settings, API documentation display options, and 
 * default parameter values. Provides centralized configuration for the API documentation 
 * viewing experience with React 19 and Next.js 15.1 integration.
 * 
 * @fileoverview Constants for OpenAPI preview functionality with @swagger-ui/react integration
 * @version 1.0.0
 * @since React 19.0, Next.js 15.1, @swagger-ui/react
 */

import type { SwaggerUIConfig, OpenAPIPreviewProps } from './types';
import type { ApiResponse, RequestConfig } from '@/lib/api-client';

// ============================================================================
// SwaggerUI Configuration Constants
// ============================================================================

/**
 * Default SwaggerUI configuration for consistent documentation rendering
 * Optimized for DreamFactory API documentation with enhanced user experience
 */
export const DEFAULT_SWAGGER_UI_CONFIG: SwaggerUIConfig = {
  // Layout and display settings
  layout: 'BaseLayout',
  deepLinking: true,
  displayOperationId: false,
  displayRequestDuration: true,
  
  // Model and expansion settings
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  docExpansion: 'list',
  
  // Interactive features
  tryItOutEnabled: true,
  filter: true,
  showExtensions: false,
  showCommonExtensions: false,
  
  // Sorting and organization
  operationsSorter: 'alpha',
  tagsSorter: 'alpha',
  maxDisplayedTags: 50,
  
  // Authentication and persistence
  persistAuthorization: true,
  
  // Validation and external docs
  validatorUrl: null, // Disable online validation for privacy
  
  // Performance optimizations
  requestInterceptor: undefined, // Set at runtime
  responseInterceptor: undefined, // Set at runtime
  
  // DreamFactory-specific extensions
  'x-dreamfactory-service': undefined,
  'x-dreamfactory-baseUrl': undefined,
  'x-dreamfactory-apiKey': undefined,
  'x-dreamfactory-sessionToken': undefined,
} as const;

/**
 * SwaggerUI theme configuration for light and dark modes
 * Integrates with Tailwind CSS design system and DreamFactory branding
 */
export const SWAGGER_UI_THEMES = {
  light: {
    primary: '#6366f1',        // Primary brand color
    secondary: '#f59e0b',      // Secondary accent
    background: '#ffffff',     // Main background
    surface: '#f8fafc',        // Card backgrounds
    text: '#1e293b',          // Primary text
    textSecondary: '#64748b',  // Secondary text
    border: '#e2e8f0',        // Border color
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    success: '#10b981',       // Success states
    warning: '#f59e0b',       // Warning states
    error: '#ef4444',         // Error states
    info: '#3b82f6',          // Info states
  },
  dark: {
    primary: '#818cf8',        // Lighter primary for dark mode
    secondary: '#fbbf24',      // Lighter accent for dark mode
    background: '#0f172a',     // Dark background
    surface: '#1e293b',        // Dark card backgrounds
    text: '#f1f5f9',          // Light text
    textSecondary: '#94a3b8',  // Secondary light text
    border: '#334155',        // Dark border
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    success: '#34d399',       // Success states for dark
    warning: '#fbbf24',       // Warning states for dark
    error: '#f87171',         // Error states for dark
    info: '#60a5fa',          // Info states for dark
  },
} as const;

/**
 * Custom CSS styles for SwaggerUI theming integration
 */
export const SWAGGER_UI_CUSTOM_STYLES = {
  light: `
    .swagger-ui {
      font-family: 'Inter', system-ui, sans-serif;
    }
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info { 
      margin: 20px 0; 
    }
    .swagger-ui .scheme-container { 
      background: ${SWAGGER_UI_THEMES.light.surface}; 
      border: 1px solid ${SWAGGER_UI_THEMES.light.border};
      border-radius: 0.5rem;
      box-shadow: ${SWAGGER_UI_THEMES.light.shadow};
    }
    .swagger-ui .opblock { 
      border: 1px solid ${SWAGGER_UI_THEMES.light.border};
      border-radius: 0.375rem;
      margin-bottom: 1rem;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.light.info}; 
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.light.success}; 
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.light.warning}; 
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.light.error}; 
    }
    .swagger-ui .btn.authorize { 
      background: ${SWAGGER_UI_THEMES.light.primary}; 
      border-color: ${SWAGGER_UI_THEMES.light.primary}; 
    }
    .swagger-ui .btn.execute { 
      background: ${SWAGGER_UI_THEMES.light.primary}; 
      border-color: ${SWAGGER_UI_THEMES.light.primary}; 
    }
    .swagger-ui .response-col_status { 
      font-family: 'JetBrains Mono', 'Menlo', 'Monaco', monospace; 
    }
    .swagger-ui .highlight-code { 
      font-family: 'JetBrains Mono', 'Menlo', 'Monaco', monospace; 
    }
  `,
  dark: `
    .swagger-ui {
      font-family: 'Inter', system-ui, sans-serif;
      background: ${SWAGGER_UI_THEMES.dark.background};
      color: ${SWAGGER_UI_THEMES.dark.text};
    }
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info { 
      margin: 20px 0; 
      color: ${SWAGGER_UI_THEMES.dark.text};
    }
    .swagger-ui .scheme-container { 
      background: ${SWAGGER_UI_THEMES.dark.surface}; 
      border: 1px solid ${SWAGGER_UI_THEMES.dark.border};
      border-radius: 0.5rem;
      box-shadow: ${SWAGGER_UI_THEMES.dark.shadow};
    }
    .swagger-ui .opblock { 
      background: ${SWAGGER_UI_THEMES.dark.surface};
      border: 1px solid ${SWAGGER_UI_THEMES.dark.border};
      border-radius: 0.375rem;
      margin-bottom: 1rem;
    }
    .swagger-ui .opblock-summary { 
      border-color: ${SWAGGER_UI_THEMES.dark.border}; 
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.dark.info}; 
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.dark.success}; 
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.dark.warning}; 
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { 
      background: ${SWAGGER_UI_THEMES.dark.error}; 
    }
    .swagger-ui .btn.authorize { 
      background: ${SWAGGER_UI_THEMES.dark.primary}; 
      border-color: ${SWAGGER_UI_THEMES.dark.primary}; 
    }
    .swagger-ui .btn.execute { 
      background: ${SWAGGER_UI_THEMES.dark.primary}; 
      border-color: ${SWAGGER_UI_THEMES.dark.primary}; 
    }
    .swagger-ui .response-col_status { 
      font-family: 'JetBrains Mono', 'Menlo', 'Monaco', monospace; 
      color: ${SWAGGER_UI_THEMES.dark.text};
    }
    .swagger-ui .highlight-code { 
      font-family: 'JetBrains Mono', 'Menlo', 'Monaco', monospace; 
    }
    .swagger-ui .wrapper { 
      background: ${SWAGGER_UI_THEMES.dark.background}; 
    }
    .swagger-ui .model-box { 
      background: ${SWAGGER_UI_THEMES.dark.surface}; 
      border: 1px solid ${SWAGGER_UI_THEMES.dark.border}; 
    }
  `,
} as const;

// ============================================================================
// React Query Configuration Constants
// ============================================================================

/**
 * React Query configuration for optimal API documentation data fetching
 * Optimized for F-006 API Documentation and Testing requirements
 */
export const REACT_QUERY_CONFIG = {
  // Cache time for OpenAPI specifications (5 minutes)
  OPENAPI_SPEC_STALE_TIME: 5 * 60 * 1000,
  OPENAPI_SPEC_CACHE_TIME: 10 * 60 * 1000,
  
  // Cache time for API documentation metadata (2 minutes)
  API_DOCS_STALE_TIME: 2 * 60 * 1000,
  API_DOCS_CACHE_TIME: 5 * 60 * 1000,
  
  // Cache time for service information (30 seconds)
  SERVICE_INFO_STALE_TIME: 30 * 1000,
  SERVICE_INFO_CACHE_TIME: 2 * 60 * 1000,
  
  // Cache time for API testing results (immediate refresh)
  API_TEST_STALE_TIME: 0,
  API_TEST_CACHE_TIME: 30 * 1000,
  
  // Retry configuration
  RETRY_COUNT: 3,
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // Refetch configuration
  REFETCH_ON_WINDOW_FOCUS: false,
  REFETCH_ON_RECONNECT: true,
  REFETCH_ON_MOUNT: true,
  
  // Background refetch intervals
  BACKGROUND_REFETCH_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Query keys for React Query operations
 * Provides consistent naming for cache management
 */
export const QUERY_KEYS = {
  // OpenAPI specification queries
  OPENAPI_SPEC: (serviceId: string) => ['openapi-spec', serviceId] as const,
  OPENAPI_SPEC_LIST: () => ['openapi-spec-list'] as const,
  
  // API documentation queries
  API_DOCS: (serviceId: string) => ['api-docs', serviceId] as const,
  API_DOCS_LIST: () => ['api-docs-list'] as const,
  
  // Service information queries
  SERVICE_INFO: (serviceId: string) => ['service-info', serviceId] as const,
  SERVICE_LIST: () => ['service-list'] as const,
  
  // API testing queries
  API_TEST: (testId: string) => ['api-test', testId] as const,
  API_TEST_HISTORY: (serviceId: string) => ['api-test-history', serviceId] as const,
  
  // API key management queries
  API_KEYS: () => ['api-keys'] as const,
  API_KEY: (keyId: string) => ['api-key', keyId] as const,
  API_KEY_VALIDATION: (key: string) => ['api-key-validation', key] as const,
} as const;

// ============================================================================
// API Documentation Display Configuration
// ============================================================================

/**
 * Default parameters for API documentation display and pagination
 * Optimized for user experience and performance
 */
export const API_DOCS_DISPLAY_CONFIG = {
  // Pagination settings
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  MAX_PAGE_SIZE: 100,
  
  // Search and filtering
  SEARCH_DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 500,
  
  // Sorting options
  SORT_OPTIONS: [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'method', label: 'HTTP Method' },
    { value: 'lastModified', label: 'Last Modified' },
  ] as const,
  DEFAULT_SORT: 'name' as const,
  DEFAULT_SORT_ORDER: 'asc' as const,
  
  // Grouping options
  GROUP_OPTIONS: [
    { value: 'none', label: 'No Grouping' },
    { value: 'type', label: 'By Service Type' },
    { value: 'method', label: 'By HTTP Method' },
    { value: 'tag', label: 'By Tag' },
  ] as const,
  DEFAULT_GROUP: 'type' as const,
  
  // Display preferences
  SHOW_DEPRECATED: false,
  SHOW_INTERNAL: false,
  SHOW_EXAMPLES: true,
  SHOW_DESCRIPTIONS: true,
  COMPACT_MODE: false,
  
  // Export options
  EXPORT_FORMATS: [
    { value: 'openapi', label: 'OpenAPI 3.0 JSON', extension: '.json' },
    { value: 'postman', label: 'Postman Collection', extension: '.json' },
    { value: 'curl', label: 'cURL Commands', extension: '.sh' },
    { value: 'markdown', label: 'Markdown Documentation', extension: '.md' },
  ] as const,
} as const;

/**
 * API endpoint categorization for better organization
 * Maps endpoint patterns to user-friendly categories
 */
export const API_ENDPOINT_CATEGORIES = {
  // Database operations
  'GET /api/v2/{service}/_table': 'Database Tables',
  'GET /api/v2/{service}/_table/{table}': 'Table Records',
  'POST /api/v2/{service}/_table/{table}': 'Create Records',
  'PUT /api/v2/{service}/_table/{table}': 'Update Records',
  'DELETE /api/v2/{service}/_table/{table}': 'Delete Records',
  
  // Schema operations
  'GET /api/v2/{service}/_schema': 'Database Schema',
  'GET /api/v2/{service}/_schema/{table}': 'Table Schema',
  'POST /api/v2/{service}/_schema/{table}': 'Create Table',
  'PUT /api/v2/{service}/_schema/{table}': 'Update Table',
  'DELETE /api/v2/{service}/_schema/{table}': 'Drop Table',
  
  // System operations
  'GET /api/v2/system/service': 'System Services',
  'GET /api/v2/system/user': 'User Management',
  'GET /api/v2/system/role': 'Role Management',
  'GET /api/v2/system/config': 'System Configuration',
  
  // File operations
  'GET /api/v2/files': 'File Operations',
  'POST /api/v2/files': 'File Upload',
  'PUT /api/v2/files': 'File Update',
  'DELETE /api/v2/files': 'File Delete',
} as const;

// ============================================================================
// User Experience Configuration
// ============================================================================

/**
 * Clipboard and notification timing constants for consistent user experience
 * Optimized for accessibility and user feedback
 */
export const UX_CONFIG = {
  // Notification display durations (ms)
  NOTIFICATION_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  
  // Animation durations (ms)
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
    LOADING: 1000,
  },
  
  // Clipboard operations (ms)
  CLIPBOARD_FEEDBACK_DURATION: 1500,
  CLIPBOARD_SUCCESS_MESSAGE: 'Copied to clipboard!',
  CLIPBOARD_ERROR_MESSAGE: 'Failed to copy to clipboard',
  
  // Auto-refresh intervals (ms)
  AUTO_REFRESH_INTERVALS: {
    FAST: 30 * 1000,    // 30 seconds
    NORMAL: 60 * 1000,  // 1 minute
    SLOW: 5 * 60 * 1000, // 5 minutes
    OFF: 0,
  },
  DEFAULT_AUTO_REFRESH: 'NORMAL' as const,
  
  // Loading states
  SKELETON_ANIMATION_DURATION: 1200,
  LOADING_SPINNER_DELAY: 200, // Delay before showing spinner
  
  // Debounce timings
  SEARCH_DEBOUNCE: 300,
  RESIZE_DEBOUNCE: 150,
  SCROLL_DEBOUNCE: 100,
  
  // Toast position and styling
  TOAST_POSITION: 'bottom-right' as const,
  TOAST_MAX_VISIBLE: 5,
  TOAST_OFFSET: 16,
} as const;

/**
 * Keyboard shortcuts for API documentation interface
 * Enhances accessibility and power user experience
 */
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  TOGGLE_THEME: 'Ctrl+Shift+T',
  OPEN_SEARCH: 'Ctrl+K',
  ESCAPE: 'Escape',
  
  // Documentation navigation
  NEXT_ENDPOINT: 'j',
  PREV_ENDPOINT: 'k',
  EXPAND_ALL: 'Ctrl+Shift+E',
  COLLAPSE_ALL: 'Ctrl+Shift+C',
  
  // API testing shortcuts
  EXECUTE_REQUEST: 'Ctrl+Enter',
  CLEAR_RESPONSE: 'Ctrl+Shift+X',
  COPY_CURL: 'Ctrl+Shift+C',
  
  // Clipboard operations
  COPY_ENDPOINT: 'Ctrl+C',
  COPY_URL: 'Ctrl+Shift+U',
  COPY_RESPONSE: 'Ctrl+R',
} as const;

// ============================================================================
// API Key Configuration
// ============================================================================

/**
 * API key preview configuration including truncation and security settings
 * Ensures secure display while maintaining usability
 */
export const API_KEY_CONFIG = {
  // Display settings
  PREVIEW_LENGTH: 8,          // Characters to show at start
  PREVIEW_SUFFIX_LENGTH: 4,   // Characters to show at end
  MASKED_CHARACTER: '•',      // Character for masking
  SEPARATOR: '...',           // Separator between preview parts
  
  // Validation settings
  MIN_KEY_LENGTH: 32,
  MAX_KEY_LENGTH: 128,
  KEY_FORMAT_REGEX: /^[A-Za-z0-9_-]+$/,
  
  // Security settings
  AUTO_HIDE_DELAY: 30 * 1000, // Auto-hide full key after 30 seconds
  COPY_FEEDBACK_DURATION: 2000,
  MAX_VISIBLE_KEYS: 3,        // Maximum keys that can be visible at once
  
  // Generation settings
  DEFAULT_KEY_NAME_PREFIX: 'DreamFactory API Key',
  DEFAULT_EXPIRY_DAYS: 90,
  MAX_EXPIRY_DAYS: 365,
  
  // Permission templates
  PERMISSION_TEMPLATES: {
    READ_ONLY: {
      name: 'Read Only',
      actions: ['GET'] as const,
      description: 'Read-only access to all endpoints',
    },
    FULL_ACCESS: {
      name: 'Full Access',
      actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
      description: 'Full access to all endpoints',
    },
    SPECIFIC_SERVICE: {
      name: 'Service Specific',
      actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
      description: 'Access limited to specific service',
    },
  },
} as const;

/**
 * Rate limiting configuration for API key usage
 * Defines default limits and tier options
 */
export const RATE_LIMIT_CONFIG = {
  // Default limits
  DEFAULT_LIMITS: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 10,
  },
  
  // Limit tiers
  LIMIT_TIERS: {
    BASIC: {
      name: 'Basic',
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstLimit: 5,
    },
    STANDARD: {
      name: 'Standard',
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 10,
    },
    PREMIUM: {
      name: 'Premium',
      requestsPerMinute: 120,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
      burstLimit: 20,
    },
    UNLIMITED: {
      name: 'Unlimited',
      requestsPerMinute: 0, // 0 means unlimited
      requestsPerHour: 0,
      requestsPerDay: 0,
      burstLimit: 0,
    },
  },
} as const;

// ============================================================================
// Default Component Props
// ============================================================================

/**
 * Default props for OpenAPI preview components
 * Ensures consistent behavior across the application
 */
export const DEFAULT_OPENAPI_PREVIEW_PROPS: Partial<OpenAPIPreviewProps> = {
  theme: 'auto',
  showTryItOut: true,
  showCodeSamples: true,
  enableAuth: true,
  autoLoadSpec: true,
  refreshInterval: REACT_QUERY_CONFIG.BACKGROUND_REFETCH_INTERVAL,
} as const;

/**
 * Default request configuration for API client operations
 * Optimized for OpenAPI preview and testing scenarios
 */
export const DEFAULT_REQUEST_CONFIG: RequestConfig = {
  timeout: 30000,  // 30 seconds for API documentation requests
  retries: 2,      // Fewer retries for interactive operations
  cache: 'default',
} as const;

/**
 * Error messages for common scenarios
 * Provides consistent user-facing error communication
 */
export const ERROR_MESSAGES = {
  // API loading errors
  SPEC_LOAD_FAILED: 'Failed to load OpenAPI specification. Please try again.',
  SERVICE_NOT_FOUND: 'The requested service could not be found.',
  INVALID_SPEC: 'The OpenAPI specification is invalid or corrupted.',
  
  // Authentication errors
  INVALID_API_KEY: 'The provided API key is invalid or expired.',
  AUTHENTICATION_REQUIRED: 'Authentication is required to access this endpoint.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  
  // Network errors
  NETWORK_ERROR: 'A network error occurred. Please check your connection.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  SERVER_ERROR: 'A server error occurred. Please contact support if this persists.',
  
  // Validation errors
  INVALID_PARAMETERS: 'One or more parameters are invalid.',
  MISSING_REQUIRED_FIELD: 'A required field is missing.',
  INVALID_FORMAT: 'The provided data format is invalid.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_CANCELLED: 'The operation was cancelled.',
} as const;

/**
 * Success messages for user feedback
 * Provides consistent positive feedback communication
 */
export const SUCCESS_MESSAGES = {
  SPEC_LOADED: 'OpenAPI specification loaded successfully.',
  TEST_COMPLETED: 'API test completed successfully.',
  KEY_GENERATED: 'API key generated successfully.',
  CONFIG_SAVED: 'Configuration saved successfully.',
  EXPORT_COMPLETED: 'Documentation exported successfully.',
} as const;

// Export all constants for use throughout the application
export * from './types';