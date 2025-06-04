/**
 * Configuration constants and default values for OpenAPI preview components.
 * Provides centralized configuration for SwaggerUI, theming, React Query caching,
 * and user experience parameters supporting F-006: API Documentation and Testing.
 */

/**
 * SwaggerUI Configuration Constants
 * Based on @swagger-ui/react requirements and F-006 specifications
 */
export const SWAGGER_UI_CONFIG = {
  // Core SwaggerUI options for consistent documentation rendering
  displayOperationId: false,
  displayRequestDuration: true,
  docExpansion: 'list' as const,
  filter: true,
  showExtensions: true,
  showCommonExtensions: true,
  tryItOutEnabled: true,
  requestInterceptor: undefined, // Will be set dynamically for auth injection
  responseInterceptor: undefined,
  
  // UI Layout configuration
  layout: 'BaseLayout' as const,
  deepLinking: true,
  persistAuthorization: false, // Security best practice - don't persist auth
  showMutatedRequest: true,
  supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'] as const,
  
  // Performance optimizations
  syntaxHighlight: {
    activated: true,
    theme: 'agate' as const,
  },
  
  // Request/Response display options
  defaultModelRendering: 'example' as const,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  
  // API exploration options
  showRequestHeaders: true,
  showResponseHeaders: true,
  maxDisplayedTags: 100,
  
  // Plugin configuration
  plugins: [],
  presets: [],
} as const;

/**
 * Theme Configuration for SwaggerUI Dark/Light Mode Integration
 * Supports consistent theming per React/Next.js Integration Requirements
 */
export const SWAGGER_UI_THEMES = {
  light: {
    primaryColor: '#6366f1', // Primary brand color from Tailwind config
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderColor: '#e5e7eb',
    headerBackgroundColor: '#f9fafb',
    codeBackgroundColor: '#f3f4f6',
    buttonColor: '#6366f1',
    buttonHoverColor: '#4f46e5',
    errorColor: '#ef4444',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    
    // Custom CSS variables for SwaggerUI styling
    css: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { 
        background: #f9fafb; 
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
      .swagger-ui .btn.authorize { 
        background-color: #6366f1; 
        border-color: #6366f1; 
      }
      .swagger-ui .btn.authorize:hover { 
        background-color: #4f46e5; 
        border-color: #4f46e5; 
      }
    `,
  },
  
  dark: {
    primaryColor: '#818cf8', // Lighter variant for dark mode
    backgroundColor: '#111827',
    textColor: '#f3f4f6',
    borderColor: '#374151',
    headerBackgroundColor: '#1f2937',
    codeBackgroundColor: '#374151',
    buttonColor: '#818cf8',
    buttonHoverColor: '#a5b4fc',
    errorColor: '#f87171',
    successColor: '#34d399',
    warningColor: '#fbbf24',
    
    // Custom CSS variables for dark mode SwaggerUI styling
    css: `
      .swagger-ui { 
        filter: invert(1) hue-rotate(180deg); 
        background: #111827 !important;
      }
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui img { filter: invert(1) hue-rotate(180deg); }
      .swagger-ui .scheme-container { 
        background: #1f2937; 
        border: 1px solid #374151;
        border-radius: 8px;
      }
    `,
  },
} as const;

/**
 * API Documentation Display Parameters and Pagination Settings
 * Optimized for large dataset handling per F-002-RQ-002 requirements
 */
export const API_DOCS_DISPLAY = {
  // Table pagination configuration
  pageSize: {
    default: 25,
    options: [10, 25, 50, 100] as const,
    max: 100, // Performance limit for table rendering
  },
  
  // Virtual scrolling configuration for large datasets
  virtualScrolling: {
    enabled: true,
    itemHeight: 52, // Height in pixels for each table row
    bufferSize: 10, // Number of items to render outside viewport
    threshold: 100, // Enable virtualization above this item count
  },
  
  // Search and filtering
  search: {
    debounceMs: 300, // Delay before triggering search
    minCharacters: 2, // Minimum characters to start searching
    maxResults: 1000, // Maximum search results to display
  },
  
  // Service listing display options
  serviceDisplay: {
    showDescription: true,
    showType: true,
    showStatus: true,
    showLastModified: true,
    showActionButtons: true,
  },
  
  // Column configuration for service table
  columns: {
    name: { sortable: true, filterable: true, width: '25%' },
    type: { sortable: true, filterable: true, width: '15%' },
    description: { sortable: false, filterable: false, width: '35%' },
    status: { sortable: true, filterable: true, width: '10%' },
    lastModified: { sortable: true, filterable: false, width: '15%' },
  },
} as const;

/**
 * React Query Configuration Constants for API Documentation Data Fetching
 * Optimized for caching and performance per React/Next.js Integration Requirements
 */
export const REACT_QUERY_CONFIG = {
  // API documentation queries
  apiDocs: {
    staleTime: 5 * 60 * 1000, // 5 minutes - API docs don't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes - Keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnMount: false, // Use cached data on mount
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Service listing queries
  services: {
    staleTime: 2 * 60 * 1000, // 2 minutes - Services may change more frequently
    cacheTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: true, // Refetch on tab focus for real-time updates
    refetchOnMount: true, // Always check for updates on mount
    retry: 2, // Fewer retries for real-time data
    retryDelay: 1000, // Fixed delay for faster feedback
  },
  
  // API keys queries
  apiKeys: {
    staleTime: 1 * 60 * 1000, // 1 minute - API keys can change
    cacheTime: 3 * 60 * 1000, // 3 minutes cache time
    refetchOnWindowFocus: true, // Ensure fresh API keys
    refetchOnMount: true, // Always validate on mount
    retry: 1, // Single retry for security-sensitive data
    retryDelay: 500, // Quick retry for immediate feedback
  },
  
  // OpenAPI specification queries
  openApiSpec: {
    staleTime: 10 * 60 * 1000, // 10 minutes - Specs are relatively stable
    cacheTime: 15 * 60 * 1000, // 15 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch specs on focus
    refetchOnMount: false, // Use cached specs
    retry: 3, // Multiple retries for large spec files
    retryDelay: (attemptIndex: number) => Math.min(2000 * 2 ** attemptIndex, 30000),
  },
} as const;

/**
 * Clipboard and Notification Timing Constants for User Experience Consistency
 * Provides consistent feedback timing across the application
 */
export const USER_EXPERIENCE = {
  // Clipboard operations
  clipboard: {
    successNotificationDuration: 2000, // 2 seconds for success message
    errorNotificationDuration: 4000, // 4 seconds for error message
    copyTimeout: 5000, // 5 seconds timeout for clipboard operations
  },
  
  // Loading states
  loading: {
    minimumDuration: 300, // Minimum loading time to prevent flashing
    debounceTime: 150, // Debounce loading indicators
    skeletonDelay: 500, // Delay before showing skeleton loaders
  },
  
  // Toast notifications
  notifications: {
    default: 3000, // 3 seconds default
    success: 2000, // 2 seconds for success
    error: 5000, // 5 seconds for errors
    warning: 4000, // 4 seconds for warnings
    info: 3000, // 3 seconds for info
  },
  
  // Animation durations (matching Tailwind config)
  animations: {
    fadeIn: 300, // 0.3s fade in
    slideIn: 300, // 0.3s slide in
    modalTransition: 200, // 0.2s modal open/close
    tooltipDelay: 500, // 0.5s tooltip appear delay
  },
  
  // Form interaction timing
  forms: {
    validationDebounce: 300, // 300ms debounce for form validation
    autoSaveDelay: 2000, // 2 seconds delay for auto-save
    fieldFocusTimeout: 100, // 100ms focus timeout
  },
} as const;

/**
 * API Key Preview Configuration for Security and Display
 * Implements secure API key handling with preview truncation
 */
export const API_KEY_CONFIG = {
  // Security settings
  security: {
    previewLength: 8, // Show first 8 characters
    maskCharacter: '•', // Character used for masking
    showFullKeyOnHover: false, // Never show full key on hover for security
    copyFullKey: true, // Allow copying full key to clipboard
    autoHideTimeout: 30000, // 30 seconds auto-hide for displayed keys
  },
  
  // Display formatting
  display: {
    prefixLength: 4, // Show first 4 characters
    suffixLength: 4, // Show last 4 characters
    separatorPattern: '...', // Pattern between prefix and suffix
    maxDisplayLength: 32, // Maximum characters to display
    truncateThreshold: 20, // Truncate keys longer than this
  },
  
  // Copy behavior
  copy: {
    includeBearer: false, // Don't include "Bearer " prefix when copying
    trimWhitespace: true, // Remove whitespace from copied keys
    successMessage: 'API key copied to clipboard',
    errorMessage: 'Failed to copy API key',
    timeout: 2000, // Timeout for copy operation
  },
  
  // Validation
  validation: {
    minLength: 8, // Minimum key length
    maxLength: 512, // Maximum key length
    allowedCharacters: /^[a-zA-Z0-9\-_\.]+$/, // Allowed characters pattern
    requiredPrefix: '', // No required prefix
  },
} as const;

/**
 * SwaggerUI Plugin Configuration for Enhanced Functionality
 * Supports F-006 API Documentation and Testing requirements
 */
export const SWAGGER_UI_PLUGINS = {
  // Request interceptor for authentication
  requestInterceptor: {
    injectApiKey: true, // Automatically inject selected API key
    addTimestamp: true, // Add timestamp to requests for debugging
    logRequests: process.env.NODE_ENV === 'development', // Log in development
  },
  
  // Response interceptor for enhanced feedback
  responseInterceptor: {
    logResponses: process.env.NODE_ENV === 'development', // Log in development
    enhanceErrors: true, // Provide enhanced error messages
    trackTiming: true, // Track request/response timing
  },
  
  // Custom plugins
  customPlugins: {
    downloadSpec: true, // Enable spec download functionality
    copyUrl: true, // Enable URL copying for endpoints
    apiKeyManager: true, // Enable API key management integration
    themeToggle: true, // Enable theme switching
  },
} as const;

/**
 * File Download Configuration for OpenAPI Specifications
 * Supports spec download functionality per F-006 requirements
 */
export const FILE_DOWNLOAD = {
  // Download options
  formats: {
    json: {
      enabled: true,
      mimeType: 'application/json',
      extension: '.json',
      indent: 2, // Pretty print with 2-space indentation
    },
    yaml: {
      enabled: true,
      mimeType: 'application/x-yaml',
      extension: '.yaml',
      indent: 2, // YAML indentation
    },
  },
  
  // File naming
  naming: {
    includeServiceName: true,
    includeTimestamp: false, // Don't include timestamp by default
    prefix: 'openapi-',
    suffix: '',
    dateFormat: 'YYYY-MM-DD', // Date format if timestamp enabled
  },
  
  // Download behavior
  behavior: {
    autoDownload: true, // Automatically trigger download
    openInNewTab: false, // Don't open in new tab
    showConfirmation: true, // Show confirmation message
    timeout: 30000, // 30 second timeout for large specs
  },
} as const;

/**
 * Error Handling Configuration for API Documentation Components
 * Provides consistent error handling across the OpenAPI preview system
 */
export const ERROR_HANDLING = {
  // Error types and their handling
  types: {
    networkError: {
      retryable: true,
      maxRetries: 3,
      retryDelay: 1000,
      userMessage: 'Network error occurred. Please check your connection.',
    },
    authenticationError: {
      retryable: false,
      maxRetries: 0,
      retryDelay: 0,
      userMessage: 'Authentication failed. Please check your API key.',
    },
    notFoundError: {
      retryable: false,
      maxRetries: 0,
      retryDelay: 0,
      userMessage: 'API documentation not found for this service.',
    },
    serverError: {
      retryable: true,
      maxRetries: 2,
      retryDelay: 2000,
      userMessage: 'Server error occurred. Please try again later.',
    },
    validationError: {
      retryable: false,
      maxRetries: 0,
      retryDelay: 0,
      userMessage: 'Invalid API specification format.',
    },
  },
  
  // Error display configuration
  display: {
    showStackTrace: process.env.NODE_ENV === 'development',
    showErrorCode: true,
    showRetryButton: true,
    autoHideSuccess: true,
    autoHideDelay: 5000,
  },
  
  // Logging configuration
  logging: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    includeContext: true,
    includeUserAgent: false, // Don't log user agent for privacy
  },
} as const;

/**
 * Performance Monitoring Constants
 * Supports performance tracking for F-006 API Documentation components
 */
export const PERFORMANCE = {
  // Metrics tracking
  metrics: {
    trackSwaggerUILoad: true,
    trackSpecParseTime: true,
    trackRenderTime: true,
    trackUserInteractions: process.env.NODE_ENV === 'development',
  },
  
  // Performance thresholds
  thresholds: {
    swaggerUILoadTime: 2000, // 2 seconds max load time
    specParseTime: 1000, // 1 second max parse time
    renderTime: 500, // 500ms max render time
    searchResponseTime: 300, // 300ms max search response
  },
  
  // Optimization settings
  optimization: {
    enableVirtualization: true, // Enable virtual scrolling
    lazyLoadSpecs: true, // Lazy load OpenAPI specs
    preloadNextPage: false, // Don't preload next page
    cacheSize: 50, // Maximum number of cached items
  },
} as const;

// Type exports for better TypeScript integration
export type SwaggerUIConfig = typeof SWAGGER_UI_CONFIG;
export type SwaggerUITheme = typeof SWAGGER_UI_THEMES.light;
export type ApiDocsDisplay = typeof API_DOCS_DISPLAY;
export type ReactQueryConfig = typeof REACT_QUERY_CONFIG;
export type UserExperience = typeof USER_EXPERIENCE;
export type ApiKeyConfig = typeof API_KEY_CONFIG;
export type ErrorHandling = typeof ERROR_HANDLING;
export type Performance = typeof PERFORMANCE;