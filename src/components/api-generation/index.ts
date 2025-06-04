/**
 * API Generation Components Export Barrel
 * 
 * Central export file providing clean imports and public API surface for all
 * API generation components in the React/Next.js DreamFactory Admin Interface.
 * 
 * Supports F-003: REST API Endpoint Generation per Section 2.1 Feature Catalog
 * with React Hook Form-powered configuration interfaces, real-time OpenAPI
 * specification preview using Next.js serverless functions, and intelligent
 * caching via React Query for optimal configuration management.
 * 
 * @fileoverview Export barrel for API generation component ecosystem
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1.0
 */

// =============================================================================
// CORE GENERATION COMPONENTS
// =============================================================================

/**
 * Main API Generation Wizard Component
 * 
 * React Hook Form-powered multi-step wizard for configuring REST API endpoints
 * with real-time validation under 100ms response time. Supports comprehensive
 * endpoint configuration workflows including HTTP method selection, parameter
 * configuration, and security rules assignment.
 */
export { default as GenerationWizard } from './generation-wizard';
export type { GenerationWizardProps, GenerationStep, WizardStepProps } from './generation-wizard';

/**
 * Endpoint Configuration Component
 * 
 * Detailed endpoint parameter configuration interface with support for query
 * parameters, filters, pagination, and custom endpoint behavior configuration.
 * Integrates with React Query for intelligent configuration caching.
 */
export { default as EndpointConfiguration } from './endpoint-configuration';
export type { 
  EndpointConfigurationProps, 
  EndpointConfig, 
  HttpMethod, 
  ParameterConfig,
  FilterConfig,
  PaginationConfig
} from './endpoint-configuration';

/**
 * OpenAPI Preview Component
 * 
 * Real-time OpenAPI specification preview using Next.js API Routes at
 * `/api/preview/{serviceName}/{endpoint}` for server-side endpoint validation
 * and structure visualization. Supports interactive documentation and testing.
 */
export { default as OpenAPIPreview } from './openapi-preview';
export type { 
  OpenAPIPreviewProps, 
  OpenAPISpec, 
  ApiEndpoint, 
  EndpointPreview,
  SpecGenerationOptions
} from './openapi-preview';

/**
 * Security Configuration Component
 * 
 * Role-based access controls, API key management, and endpoint-level security
 * rules configuration. Integrates with Next.js middleware for request
 * interception and token validation with secure session handling.
 */
export { default as SecurityConfiguration } from './security-configuration';
export type { 
  SecurityConfigurationProps, 
  SecurityRule, 
  AccessLevel, 
  ApiKeyConfig,
  RolePermission,
  EndpointSecurity
} from './security-configuration';

// =============================================================================
// GENERATION WIZARD SUB-COMPONENTS
// =============================================================================

/**
 * Generation Wizard Step Components
 * 
 * Individual step components for the multi-step API generation workflow,
 * supporting database table selection, endpoint configuration, security
 * setup, and final review steps.
 */
export { 
  TableSelectionStep,
  EndpointConfigStep,
  SecurityConfigStep,
  ReviewStep,
  type StepComponentProps
} from './generation-wizard';

// =============================================================================
// ENDPOINT CONFIGURATION SUB-COMPONENTS
// =============================================================================

/**
 * Endpoint Configuration Sub-Components
 * 
 * Specialized components for different aspects of endpoint configuration
 * including HTTP method selection, parameter management, and filter setup.
 */
export {
  HttpMethodSelector,
  ParameterManager,
  FilterBuilder,
  PaginationSetup,
  type HttpMethodSelectorProps,
  type ParameterManagerProps,
  type FilterBuilderProps,
  type PaginationSetupProps
} from './endpoint-configuration';

// =============================================================================
// OPENAPI PREVIEW SUB-COMPONENTS
// =============================================================================

/**
 * OpenAPI Preview Sub-Components
 * 
 * Components for displaying and interacting with OpenAPI specifications
 * including specification viewer, endpoint testing interface, and documentation
 * generation controls.
 */
export {
  SpecificationViewer,
  EndpointTester,
  DocumentationGenerator,
  type SpecificationViewerProps,
  type EndpointTesterProps,
  type DocumentationGeneratorProps
} from './openapi-preview';

// =============================================================================
// SECURITY CONFIGURATION SUB-COMPONENTS
// =============================================================================

/**
 * Security Configuration Sub-Components
 * 
 * Components for managing different aspects of API security including
 * role management, API key configuration, and access control rules.
 */
export {
  RoleManager,
  ApiKeyManager,
  AccessControlBuilder,
  type RoleManagerProps,
  type ApiKeyManagerProps,
  type AccessControlBuilderProps
} from './security-configuration';

// =============================================================================
// SHARED HOOKS AND UTILITIES
// =============================================================================

/**
 * API Generation Hooks
 * 
 * Custom React hooks for API generation workflows using SWR/React Query
 * for intelligent caching and synchronization with backend services.
 * Provides hooks for generation status, configuration management, and
 * real-time preview updates.
 */
export {
  useApiGeneration,
  useEndpointConfiguration,
  useOpenAPIPreview,
  useSecurityConfiguration,
  useGenerationWizard,
  type UseApiGenerationOptions,
  type UseEndpointConfigurationOptions,
  type UseOpenAPIPreviewOptions,
  type UseSecurityConfigurationOptions,
  type UseGenerationWizardOptions
} from './generation-wizard';

export {
  useEndpointValidation,
  useParameterConfig,
  useFilterValidation,
  type UseEndpointValidationOptions,
  type UseParameterConfigOptions,
  type UseFilterValidationOptions
} from './endpoint-configuration';

export {
  useSpecGeneration,
  useEndpointPreview,
  useDocumentationExport,
  type UseSpecGenerationOptions,
  type UseEndpointPreviewOptions,
  type UseDocumentationExportOptions
} from './openapi-preview';

export {
  useRoleManagement,
  useApiKeyManagement,
  useAccessControl,
  type UseRoleManagementOptions,
  type UseApiKeyManagementOptions,
  type UseAccessControlOptions
} from './security-configuration';

// =============================================================================
// SHARED TYPES AND INTERFACES
// =============================================================================

/**
 * Core API Generation Types
 * 
 * Comprehensive type definitions for API generation workflows, endpoint
 * configurations, security rules, and OpenAPI specifications. Supports
 * TypeScript 5.8+ strict type safety throughout the component ecosystem.
 */
export type {
  // Core Generation Types
  ApiGenerationConfig,
  GenerationProgress,
  GenerationResult,
  GenerationError,
  
  // Database and Schema Types
  DatabaseService,
  TableMetadata,
  FieldMetadata,
  RelationshipMetadata,
  
  // Endpoint Types
  RestEndpoint,
  EndpointMethod,
  EndpointParameter,
  EndpointFilter,
  EndpointPagination,
  
  // Security Types
  SecurityPolicy,
  UserRole,
  Permission,
  ApiKey,
  AccessRule,
  
  // OpenAPI Types
  OpenApiDocument,
  ApiPath,
  ApiOperation,
  ApiSchema,
  ApiResponse,
  
  // Configuration Types
  GenerationSettings,
  PreviewSettings,
  ExportSettings,
  ValidationSettings,
  
  // Error and Status Types
  ValidationError,
  ConfigurationError,
  GenerationStatus,
  PreviewStatus
} from '../../../types/api-generation';

// =============================================================================
// UTILITIES AND HELPERS
// =============================================================================

/**
 * API Generation Utilities
 * 
 * Helper functions for API generation workflows including validation,
 * transformation, and formatting utilities. Optimized for Turbopack
 * tree-shaking and build performance.
 */
export {
  validateEndpointConfiguration,
  generateOpenApiSpec,
  formatSecurityRules,
  transformDatabaseSchema,
  validateApiConfiguration,
  generateEndpointCode,
  exportDocumentation,
  type ValidationResult,
  type TransformationOptions,
  type ExportOptions
} from './generation-wizard';

export {
  validateParameters,
  buildFilterQuery,
  formatPaginationConfig,
  type ParameterValidationResult,
  type FilterQueryOptions,
  type PaginationFormatOptions
} from './endpoint-configuration';

export {
  generatePreviewUrl,
  formatSpecification,
  validateOpenApiSpec,
  type PreviewUrlOptions,
  type SpecificationFormatOptions,
  type SpecValidationResult
} from './openapi-preview';

export {
  validateSecurityRules,
  generateApiKey,
  formatPermissions,
  type SecurityValidationResult,
  type ApiKeyGenerationOptions,
  type PermissionFormatOptions
} from './security-configuration';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * API Generation Constants
 * 
 * Configuration constants for API generation workflows including default
 * settings, validation rules, and performance parameters. Configured for
 * React/Next.js Integration Requirements and Turbopack optimization.
 */
export {
  DEFAULT_GENERATION_CONFIG,
  SUPPORTED_HTTP_METHODS,
  DEFAULT_SECURITY_RULES,
  OPENAPI_SPEC_VERSION,
  VALIDATION_TIMEOUTS,
  PREVIEW_UPDATE_INTERVALS,
  CACHE_CONFIGURATION
} from './generation-wizard';

export {
  DEFAULT_ENDPOINT_CONFIG,
  PARAMETER_TYPES,
  FILTER_OPERATORS,
  PAGINATION_DEFAULTS
} from './endpoint-configuration';

export {
  PREVIEW_MODES,
  EXPORT_FORMATS,
  DOCUMENTATION_TEMPLATES
} from './openapi-preview';

export {
  SECURITY_LEVELS,
  DEFAULT_PERMISSIONS,
  API_KEY_FORMATS
} from './security-configuration';

// =============================================================================
// EXPORT ORGANIZATION FOR TREE-SHAKING
// =============================================================================

/**
 * Named Export Groups for Optimized Imports
 * 
 * Organized exports for tree-shaking optimization with Turbopack build
 * system. Enables selective importing of component groups for enhanced
 * bundle size optimization and development build performance.
 */

// Core Components Group
export const CoreComponents = {
  GenerationWizard,
  EndpointConfiguration,
  OpenAPIPreview,
  SecurityConfiguration
} as const;

// Hook Groups for Selective Importing
export const GenerationHooks = {
  useApiGeneration,
  useEndpointConfiguration,
  useOpenAPIPreview,
  useSecurityConfiguration,
  useGenerationWizard
} as const;

export const ValidationHooks = {
  useEndpointValidation,
  useParameterConfig,
  useFilterValidation
} as const;

export const PreviewHooks = {
  useSpecGeneration,
  useEndpointPreview,
  useDocumentationExport
} as const;

export const SecurityHooks = {
  useRoleManagement,
  useApiKeyManagement,
  useAccessControl
} as const;

// Utility Groups for Selective Importing
export const ValidationUtils = {
  validateEndpointConfiguration,
  validateParameters,
  validateSecurityRules,
  validateOpenApiSpec
} as const;

export const GenerationUtils = {
  generateOpenApiSpec,
  generateEndpointCode,
  generatePreviewUrl,
  generateApiKey
} as const;

export const FormattingUtils = {
  formatSecurityRules,
  formatPaginationConfig,
  formatSpecification,
  formatPermissions
} as const;

/**
 * Default Export - Main API Generation Interface
 * 
 * Primary interface combining all core API generation functionality
 * for simplified importing and usage in application components.
 */
export { GenerationWizard as default };