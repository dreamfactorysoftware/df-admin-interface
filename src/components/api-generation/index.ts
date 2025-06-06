/**
 * @fileoverview API Generation Module - Central Export Barrel
 * 
 * Comprehensive export file for all API generation components, hooks, types, and utilities
 * implementing F-003: REST API Endpoint Generation feature per Section 2.1 Feature Catalog.
 * 
 * This module replaces Angular adf-api-docs components with React 19/Next.js 15.1 architecture,
 * providing clean imports and public API surface for:
 * - Generation Wizard workflow for guided API creation
 * - Endpoint Configuration for HTTP method and parameter setup
 * - OpenAPI Preview with interactive documentation
 * - Security Configuration for RBAC and API key management
 * - Type-safe interfaces and utility functions
 * 
 * Supports React/Next.js Integration Requirements for modular component architecture
 * with tree-shaking friendly exports optimized for Turbopack build performance per
 * Section 0.1.1 technical scope.
 * 
 * @see Technical Specification Section 2.1 Feature Catalog F-003
 * @see React/Next.js Integration Requirements for modular component architecture
 * @see Section 0.2.1 - React/Next.js module organization patterns
 * 
 * @module APIGeneration
 * @version 1.0.0
 */

// =============================================================================
// GENERATION WIZARD COMPONENTS
// =============================================================================

/**
 * Complete API generation wizard providing guided workflow for database table
 * selection, endpoint configuration, security setup, and OpenAPI generation.
 * 
 * Replaces Angular reactive forms with React Hook Form + Zod validation,
 * implementing multi-step wizard with progress tracking and state persistence.
 * 
 * Features:
 * - Multi-step wizard navigation with validation
 * - React Query-powered schema discovery
 * - Real-time configuration preview
 * - Zustand state management integration
 * - TanStack Virtual for large table lists
 * 
 * @see Section 4.4.3.2 - API generation workflow implementation
 */
export {
  // Primary wizard components
  GenerationWizard,
  WizardLayout,
  WizardProvider,
  
  // Individual wizard steps
  TableSelection,
  EndpointConfiguration as WizardEndpointConfiguration,
  GenerationPreview,
  GenerationProgress,
  
  // Wizard navigation and state hooks
  useWizard,
  useWizardNavigation,
  useOpenAPIPreview,
  
  // Wizard type definitions
  type WizardState,
  type WizardActions,
  type WizardStep,
  type WizardLayoutProps,
  type TableSelectionProps,
  type GenerationPreviewProps,
  type GenerationProgressProps,
  
  // Wizard configuration constants
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
  HTTP_METHODS,
  DEFAULT_ENDPOINT_CONFIG,
  VALIDATION_RULES,
  REACT_QUERY_CONFIG,
  
  // Test utilities for wizard components
  TestUtilities as WizardTestUtilities
} from './generation-wizard';

// =============================================================================
// ENDPOINT CONFIGURATION COMPONENTS
// =============================================================================

/**
 * Comprehensive endpoint configuration components for HTTP method selection,
 * parameter building, query configuration, and security rules.
 * 
 * Replaces Angular Material components with Tailwind CSS + Headless UI,
 * implementing real-time validation and preview capabilities.
 * 
 * Features:
 * - HTTP method selection with conditional options
 * - Dynamic parameter builder with drag-and-drop
 * - Query configuration with filtering and pagination
 * - Security rules configuration
 * - Real-time validation with Zod schemas
 * 
 * @see React/Next.js Integration Requirements for forms and validation
 */
export {
  // Main endpoint configuration form
  EndpointConfigForm,
  
  // HTTP method and parameter configuration
  HttpMethodSelector,
  ParameterBuilder,
  QueryConfiguration,
  
  // Security and validation configuration
  SecurityConfiguration as EndpointSecurityConfiguration,
  ValidationRules,
  
  // Preview and testing components
  PreviewPanel,
  
  // Endpoint configuration types
  type EndpointConfigFormProps,
  type HttpMethodSelectorProps,
  type ParameterBuilderProps,
  type QueryConfigurationProps,
  type ValidationRulesProps,
  type PreviewPanelProps,
  
  // Configuration data types
  type EndpointConfiguration,
  type MethodConfiguration,
  type EndpointParameter,
  type QueryConfig,
  type ValidationConfig,
  type SecurityConfig,
  
  // Utility types
  type HTTPMethod,
  type ParameterType,
  type FilterOperator,
  type ValidationRule,
  
  // Configuration schemas for validation
  endpointConfigSchema,
  parameterSchema,
  queryConfigSchema,
  validationConfigSchema,
  securityConfigSchema
} from './endpoint-configuration';

// =============================================================================
// OPENAPI PREVIEW COMPONENTS
// =============================================================================

/**
 * Interactive OpenAPI documentation and testing components using @swagger-ui/react
 * with enhanced testing capabilities and API key management.
 * 
 * Replaces Angular SwaggerUI integration with React components,
 * implementing F-006: API Documentation and Testing requirements.
 * 
 * Features:
 * - Interactive SwaggerUI documentation viewer
 * - API documentation service listing
 * - API key selection and management
 * - Real-time specification generation
 * - Clipboard utilities for API keys
 * 
 * @see Section 2.1 Feature Catalog F-006
 */
export {
  // Primary OpenAPI components
  OpenAPIViewer,
  ApiDocsList,
  ApiKeySelector,
  
  // OpenAPI configuration and utilities
  SWAGGER_UI_CONFIG,
  DEFAULT_SWAGGER_THEME,
  PREVIEW_SETTINGS,
  
  // OpenAPI types and interfaces
  type OpenAPIViewerProps,
  type ApiDocsListProps,
  type ApiKeySelectorProps,
  type OpenAPISpecification,
  type APIDocumentationInfo,
  type APIKeyInfo,
  type SwaggerUIConfig,
  
  // Validation schemas
  openAPISpecificationSchema,
  apiDocumentationInfoSchema,
  apiKeyInfoSchema,
  
  // Re-exported hooks for convenience
  useAPIKeys,
  useApiDocs,
  useClipboard,
  useServices,
  
  // Test utilities
  TestUtilities as OpenAPITestUtilities
} from './openapi-preview';

// =============================================================================
// SECURITY CONFIGURATION COMPONENTS
// =============================================================================

/**
 * Comprehensive API security configuration components implementing
 * role-based access control, API key management, and endpoint-level permissions.
 * 
 * Replaces Angular guards with Next.js middleware patterns,
 * implementing F-004: API Security Configuration requirements.
 * 
 * Features:
 * - Role-based access control configuration
 * - API key administration and management
 * - Endpoint-level security rules
 * - Security policy configuration
 * - Real-time permission validation
 * 
 * @see Section 4.5 - Security and Authentication Flows
 * @see Section 2.1 Feature Catalog F-004
 */
export {
  // Primary security components
  SecurityConfigForm,
  ApiKeyManager,
  RoleBasedAccessControl,
  EndpointPermissions,
  
  // Security context and providers
  SecurityConfigProvider,
  useSecurityConfig,
  withSecurityContext,
  
  // Security management hooks
  useApiKeys as useSecurityApiKeys,
  
  // Security utility functions
  calculateVerbMask,
  getMethodsFromVerbMask,
  hasMethod,
  toggleMethod,
  hasRequestorType,
  toggleRequestorType,
  validatePermissions,
  validateEndpointRule,
  buildFilterExpression,
  mergeSecurityConfigs,
  
  // Security type definitions
  type SecurityConfiguration,
  type SecurityConfigFormData,
  type Role,
  type RolePermission,
  type ApiKeyInfo as SecurityApiKeyInfo,
  type EndpointPermission,
  type EndpointRule,
  type VerbMask,
  type RequestorMask,
  type SecurityPolicy,
  
  // Security constants
  HTTP_VERBS,
  REQUESTOR_TYPES,
  DEFAULT_SECURITY_CONFIG,
  SECURITY_MODULE_INFO
} from './security-configuration';

// =============================================================================
// SHARED TYPES AND INTERFACES
// =============================================================================

/**
 * Comprehensive type definitions for API generation functionality,
 * providing type safety across all components and workflows.
 * 
 * Supports TypeScript 5.8+ with strict type checking and React 19 patterns.
 */
export type {
  // Core API generation types
  APIGenerationConfig,
  APIGenerationResult,
  APIGenerationStatus,
  GenerationStatistics,
  
  // Database schema types
  DatabaseTable,
  DatabaseField,
  DatabaseRelation,
  FieldType,
  ReferentialAction,
  
  // HTTP and API types
  HTTPMethod,
  HTTPStatus,
  ContentType,
  HeaderConfig,
  
  // OpenAPI specification types
  OpenAPISpec,
  APIInfo,
  APIContact,
  APILicense,
  APIServer,
  PathItem,
  Operation,
  Parameter,
  RequestBody,
  Response,
  Schema,
  APIComponents,
  SecurityScheme,
  
  // Form and validation types
  FormValidationError,
  ValidationResult,
  FieldValidation,
  
  // React component prop types
  BaseComponentProps,
  FormComponentProps,
  ConfigurationProps,
  PreviewProps,
  
  // State management types
  APIGenerationState,
  ConfigurationState,
  PreviewState,
  SecurityState,
  
  // Error and status types
  APIError,
  ConfigurationError,
  ValidationError,
  GenerationError
} from '../types/api-generation';

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Utility functions for API generation, configuration management,
 * and data transformation supporting the component ecosystem.
 */
export {
  // Configuration utilities
  validateAPIConfiguration,
  mergeConfigurations,
  normalizeConfiguration,
  
  // OpenAPI utilities
  generateOpenAPISpec,
  validateOpenAPISpec,
  transformSchemaToOpenAPI,
  
  // HTTP utilities
  buildEndpointURL,
  formatHTTPMethod,
  validateHTTPResponse,
  
  // Form utilities
  createFormSchema,
  validateFormData,
  transformFormValues,
  
  // Data transformation utilities
  mapDatabaseToAPI,
  transformTableToEndpoint,
  generateParameterDefinitions,
  
  // Validation utilities
  validateEndpointConfiguration,
  validateSecurityConfiguration,
  validateParameterConfiguration,
  
  // Helper functions
  formatAPIDocumentation,
  generateAPIKey,
  calculatePermissions,
  buildFilterQuery
} from '../lib/api-generation-utils';

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Configuration constants and default values for API generation components.
 * Optimized for Turbopack tree-shaking and consistent behavior across components.
 */
export const API_GENERATION_CONFIG = {
  // Performance thresholds per React/Next.js Integration Requirements
  VALIDATION_TIMEOUT: 100, // milliseconds - Real-time validation under 100ms
  PREVIEW_TIMEOUT: 2000, // milliseconds - API responses under 2 seconds
  CACHE_TTL: 300000, // milliseconds - 5 minutes cache for React Query
  
  // API generation limits
  MAX_PARAMETERS: 50,
  MAX_TABLES_PER_GENERATION: 100,
  MAX_FIELDS_PER_TABLE: 200,
  
  // HTTP method configuration
  SUPPORTED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
  DEFAULT_METHODS: ['GET', 'POST', 'PUT', 'DELETE'] as const,
  
  // Security defaults
  DEFAULT_AUTH_METHODS: ['API_KEY', 'SESSION_TOKEN'] as const,
  DEFAULT_PERMISSIONS: {
    GET: ['read'],
    POST: ['create'],
    PUT: ['update'],
    PATCH: ['update'],
    DELETE: ['delete']
  } as const,
  
  // OpenAPI configuration
  OPENAPI_VERSION: '3.0.3',
  DEFAULT_API_VERSION: '1.0.0',
  
  // UI configuration
  WIZARD_STEPS_COUNT: 4,
  ITEMS_PER_PAGE: 25,
  VIRTUAL_SCROLL_THRESHOLD: 1000
} as const;

/**
 * Error messages and validation constants for consistent user feedback.
 */
export const API_GENERATION_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_HTTP_METHOD: 'Invalid HTTP method selected',
    INVALID_PARAMETER_TYPE: 'Invalid parameter type',
    DUPLICATE_PARAMETER: 'Parameter name already exists',
    INVALID_SECURITY_CONFIG: 'Invalid security configuration'
  },
  GENERATION: {
    SUCCESS: 'API generation completed successfully',
    FAILED: 'API generation failed',
    IN_PROGRESS: 'Generating API endpoints...',
    VALIDATING: 'Validating configuration...'
  },
  PREVIEW: {
    LOADING: 'Loading preview...',
    ERROR: 'Failed to generate preview',
    NO_DATA: 'No data available for preview'
  }
} as const;

// =============================================================================
// REACT QUERY CONFIGURATION
// =============================================================================

/**
 * React Query configuration optimized for API generation workflows
 * with intelligent caching and synchronization per integration requirements.
 */
export const API_GENERATION_QUERY_CONFIG = {
  // Query keys for consistent cache management
  QUERY_KEYS: {
    WIZARD_STATE: ['api-generation', 'wizard'] as const,
    SCHEMA_DISCOVERY: ['api-generation', 'schema'] as const,
    ENDPOINT_CONFIG: ['api-generation', 'endpoints'] as const,
    OPENAPI_PREVIEW: ['api-generation', 'openapi'] as const,
    SECURITY_CONFIG: ['api-generation', 'security'] as const,
    API_KEYS: ['api-generation', 'api-keys'] as const,
    SERVICES: ['api-generation', 'services'] as const
  },
  
  // Cache configuration for optimal performance
  CACHE_CONFIG: {
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)
  },
  
  // Mutation configuration for data modifications
  MUTATION_CONFIG: {
    retry: 1,
    retryDelay: 1000,
    onError: (error: Error) => {
      console.error('API Generation mutation error:', error);
    }
  }
} as const;

// =============================================================================
// MODULE METADATA AND FEATURE FLAGS
// =============================================================================

/**
 * Module metadata for debugging, monitoring, and feature management.
 */
export const API_GENERATION_MODULE_INFO = {
  version: '1.0.0',
  framework: 'React 19 + Next.js 15.1',
  replaces: 'Angular adf-api-docs components',
  features: [
    'Generation Wizard workflow',
    'Endpoint Configuration',
    'OpenAPI Preview and Documentation',
    'Security Configuration',
    'Real-time validation',
    'Interactive testing'
  ],
  requirements: ['F-003', 'F-004', 'F-006'],
  performance: {
    validationTimeout: '< 100ms',
    previewGeneration: '< 2s',
    cacheHitResponse: '< 50ms'
  },
  dependencies: {
    react: '^19.0.0',
    nextjs: '^15.1.0',
    reactHookForm: '^7.52.0',
    reactQuery: '^5.0.0',
    tailwindcss: '^4.1.0',
    zod: '^3.23.0'
  },
  lastUpdated: new Date().toISOString()
} as const;

/**
 * Feature flags for conditional functionality and A/B testing.
 */
export const API_GENERATION_FEATURE_FLAGS = {
  // Core features
  ENABLE_GENERATION_WIZARD: true,
  ENABLE_ENDPOINT_CONFIGURATION: true,
  ENABLE_OPENAPI_PREVIEW: true,
  ENABLE_SECURITY_CONFIGURATION: true,
  
  // Advanced features
  ENABLE_REAL_TIME_PREVIEW: true,
  ENABLE_BATCH_GENERATION: true,
  ENABLE_ADVANCED_VALIDATION: true,
  ENABLE_INTERACTIVE_TESTING: true,
  
  // Performance optimizations
  ENABLE_VIRTUAL_SCROLLING: true,
  ENABLE_INTELLIGENT_CACHING: true,
  ENABLE_BACKGROUND_SYNC: true,
  
  // Experimental features
  ENABLE_AI_SUGGESTIONS: false,
  ENABLE_COLLABORATIVE_EDITING: false,
  ENABLE_ADVANCED_ANALYTICS: false
} as const;

// =============================================================================
// MAIN EXPORT ALIASES
// =============================================================================

/**
 * Main component aliases for convenient imports throughout the application.
 * Provides both specific and general-purpose exports for different use cases.
 */

// Primary workflow component
export { GenerationWizard as APIGenerationWizard } from './generation-wizard';

// Configuration components
export { EndpointConfigForm as APIEndpointConfiguration } from './endpoint-configuration';
export { OpenAPIViewer as APIDocumentation } from './openapi-preview';
export { SecurityConfigForm as APISecurityConfiguration } from './security-configuration';

/**
 * Default export providing the complete API generation experience.
 * Useful for single-component imports and simplified integration.
 */
export { GenerationWizard as default } from './generation-wizard';

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL CONSUMPTION
// =============================================================================

/**
 * Re-export commonly used types for external consumers without requiring
 * deep imports from individual modules.
 */
export type {
  // Main component prop types
  GenerationWizardProps,
  EndpointConfigFormProps as APIEndpointConfigurationProps,
  OpenAPIViewerProps as APIDocumentationProps,
  SecurityConfigFormProps as APISecurityConfigurationProps,
  
  // Configuration types
  EndpointConfiguration as APIEndpointConfig,
  SecurityConfiguration as APISecurityConfig,
  OpenAPISpecification as APISpecification,
  
  // State management types
  WizardState as APIGenerationWizardState,
  SecurityState as APISecurityState
} from './generation-wizard';

/**
 * Module version for compatibility tracking and debugging
 */
export const MODULE_VERSION = '1.0.0';

/**
 * Compatibility information for version management
 */
export const COMPATIBILITY = {
  react: '^19.0.0',
  nextjs: '^15.1.0',
  node: '^20.0.0',
  typescript: '^5.8.0'
} as const;