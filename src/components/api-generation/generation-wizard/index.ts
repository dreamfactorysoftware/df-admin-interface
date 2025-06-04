/**
 * @fileoverview API Generation Wizard Module - Main Export File
 * 
 * Centralized export file for the API generation wizard module providing clean imports
 * for all wizard components, hooks, types, and utilities. Implements F-003: REST API 
 * Endpoint Generation workflow with React Hook Form-powered configuration interfaces
 * per Section 2.1 Feature Catalog.
 * 
 * Supports React/Next.js Integration Requirements for modular component architecture
 * with tree-shaking friendly exports optimized for Turbopack build performance per
 * Section 0.1.1 technical scope.
 * 
 * @module GenerationWizard
 * @version 1.0.0
 */

// ============================================================================
// MAIN WIZARD COMPONENTS
// ============================================================================

/**
 * Primary wizard layout component providing the main container structure,
 * step navigation, progress indication, and coordinated step rendering for
 * the API generation workflow.
 * 
 * Features:
 * - Multi-step wizard navigation with validation
 * - Progress indication and step validation
 * - React Hook Form integration across steps
 * - Responsive design with Tailwind CSS
 * - WCAG 2.1 AA accessibility compliance
 */
export { WizardLayout } from './wizard-layout';

/**
 * React context provider component managing global wizard state, step navigation,
 * and shared functionality across all generation wizard components. Implements
 * Zustand store integration for wizard state management per React/Next.js
 * Integration Requirements.
 * 
 * Features:
 * - Zustand-powered state management
 * - React Query integration for real-time preview
 * - Multi-step form state persistence
 * - Context-based component communication
 */
export { WizardProvider } from './wizard-provider';

// ============================================================================
// WIZARD STEP COMPONENTS
// ============================================================================

/**
 * First wizard step component for database table selection with multi-select
 * functionality, search filtering, and virtual scrolling for large schemas.
 * 
 * Features:
 * - TanStack Virtual for efficient rendering of 1000+ tables
 * - Multi-select with batch operations
 * - Real-time search and filtering
 * - React Query-powered schema discovery
 */
export { TableSelection } from './table-selection';

/**
 * Second wizard step component for HTTP method and endpoint parameter
 * configuration using React Hook Form with real-time validation.
 * 
 * Features:
 * - HTTP method selection (GET, POST, PUT, PATCH, DELETE)
 * - Dynamic parameter configuration
 * - Real-time validation with Zod schemas
 * - Next.js serverless function integration for preview
 */
export { EndpointConfiguration } from './endpoint-configuration';

/**
 * Third wizard step component providing real-time OpenAPI specification
 * preview with interactive documentation display.
 * 
 * Features:
 * - @swagger-ui/react integration for interactive preview
 * - Real-time OpenAPI generation via Next.js serverless functions
 * - Configuration validation before final generation
 * - Error handling and recovery workflows
 */
export { GenerationPreview } from './generation-preview';

/**
 * Final wizard step component for API generation progress tracking,
 * success confirmation, and navigation to generated API documentation.
 * 
 * Features:
 * - Real-time progress indication with React Query mutations
 * - Success/error handling with user feedback
 * - Automatic navigation to API documentation
 * - Generation result persistence
 */
export { GenerationProgress } from './generation-progress';

// ============================================================================
// CONTEXT HOOKS AND UTILITIES
// ============================================================================

/**
 * Primary hook for accessing wizard state and actions throughout the
 * component tree. Provides type-safe access to Zustand store.
 * 
 * @throws {Error} If used outside of WizardProvider context
 */
export { useWizard } from './wizard-provider';

/**
 * Specialized hook for wizard navigation with step validation logic
 * and conditional navigation controls.
 * 
 * Features:
 * - Step validation before navigation
 * - Conditional navigation permissions
 * - Progress tracking integration
 */
export { useWizardNavigation } from './wizard-provider';

/**
 * Hook for OpenAPI preview generation and validation with React Query
 * integration for real-time updates and intelligent caching.
 * 
 * Features:
 * - Real-time preview generation
 * - Automatic cache invalidation
 * - Error handling and retry logic
 * - Specification validation
 */
export { useOpenAPIPreview } from './wizard-provider';

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * Core wizard type definitions for state management, step data,
 * and component interfaces with React 19 patterns and TypeScript 5.8+ support.
 */
export type {
  // Wizard state and navigation types
  WizardState,
  WizardActions,
  WizardStep,
  
  // Database schema types
  DatabaseTable,
  DatabaseField,
  FieldType,
  ForeignKeyRelation,
  ReferentialAction,
  
  // Step-specific data types
  TableSelectionData,
  TableFilter,
  VirtualScrollConfig,
  EndpointConfiguration,
  MethodConfiguration,
  EndpointParameter,
  ParameterValidation,
  RequestSchema,
  ResponseSchema,
  ResponseFormatOptions,
  EndpointSecurity,
  APIKeyPermission,
  RateLimitConfig,
  CORSConfig,
  
  // OpenAPI generation types
  OpenAPISpec,
  APIInfo,
  APIContact,
  APILicense,
  APIServer,
  ServerVariable,
  PathItem,
  Operation,
  Parameter,
  RequestBody,
  MediaType,
  Example,
  Response,
  Header,
  Schema,
  APIComponents,
  SecurityScheme,
  SecurityRequirement,
  APITag,
  ExternalDocumentation,
  
  // Generation result types
  GenerationResult,
  GenerationStatistics,
  
  // React component prop interfaces
  BaseWizardProps,
  WizardLayoutProps,
  TableSelectionProps,
  EndpointConfigurationProps,
  GenerationPreviewProps,
  GenerationProgressProps,
  WizardProviderProps,
  
  // Form data types for React Hook Form integration
  TableSelectionFormData,
  EndpointConfigurationFormData,
  WizardStateFormData
} from './types';

/**
 * Enum types for wizard workflow and configuration
 */
export {
  WizardStep,
  HTTPMethod,
  GenerationStatus,
  ParameterType,
  FilterOperator,
  FieldType,
  ReferentialAction
} from './types';

/**
 * Zod schema validators for React Hook Form integration and real-time validation
 */
export {
  TableSelectionSchema,
  EndpointParameterSchema,
  MethodConfigurationSchema,
  EndpointConfigurationSchema,
  WizardStateSchema
} from './types';

// ============================================================================
// WIZARD CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Wizard step configuration and navigation constants
 */
export {
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
  WIZARD_STEP_COUNT
} from './constants';

/**
 * HTTP method configuration for CRUD endpoint generation
 */
export {
  HTTP_METHODS,
  HTTP_METHOD_CONFIG,
  DEFAULT_ENABLED_METHODS
} from './constants';

/**
 * Default endpoint configuration parameters and validation rules
 */
export {
  DEFAULT_PAGINATION_CONFIG,
  DEFAULT_FILTER_CONFIG,
  DEFAULT_SORT_CONFIG,
  DEFAULT_FIELD_CONFIG,
  DEFAULT_RELATED_CONFIG,
  DEFAULT_ENDPOINT_CONFIG
} from './constants';

/**
 * Validation rules and error messages for wizard forms
 */
export {
  VALIDATION_RULES,
  VALIDATION_MESSAGES
} from './constants';

/**
 * React Query configuration for wizard data fetching optimization
 */
export {
  REACT_QUERY_CONFIG,
  WIZARD_QUERY_KEYS,
  WIZARD_MUTATION_CONFIG
} from './constants';

/**
 * UI constants for wizard interface consistency
 */
export {
  WIZARD_UI_CONFIG,
  WIZARD_LOADING_CONFIG
} from './constants';

/**
 * Type definitions derived from constants for type safety
 */
export type {
  WizardStep as WizardStepType,
  HttpMethod,
  ValidationField,
  WizardStepConfig,
  HttpMethodConfig,
  EndpointConfig,
  ValidationRules,
  WizardQueryKey
} from './constants';

// ============================================================================
// TEST UTILITIES (Development and Testing)
// ============================================================================

/**
 * Comprehensive test utilities for wizard component testing including
 * MSW handlers, mock data, render utilities, and test setup functions.
 * 
 * Features:
 * - MSW-powered API mocking
 * - React Testing Library utilities
 * - Vitest configuration and setup
 * - Comprehensive mock data fixtures
 * 
 * @example
 * ```typescript
 * import { renderWizardWithProvider, mockWizardData } from './test-utilities';
 * 
 * test('wizard navigation', () => {
 *   const { getByRole } = renderWizardWithProvider(<WizardLayout />, {
 *     initialState: mockWizardData.initialState
 *   });
 *   // Test implementation
 * });
 * ```
 */
export * as TestUtilities from './test-utilities';

// ============================================================================
// MAIN WIZARD ENTRY POINT
// ============================================================================

/**
 * Main wizard component alias for clean imports throughout the application.
 * Provides the complete API generation wizard experience with all steps
 * and functionality integrated.
 * 
 * @example
 * ```typescript
 * import { GenerationWizard } from '@/components/api-generation/generation-wizard';
 * 
 * export default function APIGenerationPage() {
 *   return (
 *     <GenerationWizard
 *       serviceName="customer-database"
 *       onComplete={(result) => {
 *         console.log('API generation completed:', result);
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export { WizardLayout as GenerationWizard } from './wizard-layout';

/**
 * Default export for the complete wizard experience
 * Supports both named and default import patterns for flexibility
 */
export { WizardLayout as default } from './wizard-layout';

// ============================================================================
// MODULE METADATA
// ============================================================================

/**
 * Module version for tracking and compatibility
 */
export const WIZARD_MODULE_VERSION = '1.0.0';

/**
 * Supported React version range for compatibility validation
 */
export const REACT_VERSION_REQUIREMENT = '^19.0.0';

/**
 * Supported Next.js version range for compatibility validation
 */
export const NEXTJS_VERSION_REQUIREMENT = '^15.1.0';

/**
 * Feature flags for conditional functionality
 */
export const WIZARD_FEATURE_FLAGS = {
  ENABLE_ADVANCED_CONFIGURATION: true,
  ENABLE_REAL_TIME_PREVIEW: true,
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_WIZARD_PERSISTENCE: true,
  ENABLE_ACCESSIBILITY_FEATURES: true,
  ENABLE_PERFORMANCE_MONITORING: true
} as const;

/**
 * Performance thresholds for monitoring and optimization
 */
export const PERFORMANCE_THRESHOLDS = {
  STEP_TRANSITION_TIME: 300, // milliseconds
  PREVIEW_GENERATION_TIME: 2000, // milliseconds  
  FORM_VALIDATION_TIME: 100, // milliseconds
  API_RESPONSE_TIME: 2000, // milliseconds
  VIRTUAL_SCROLL_THRESHOLD: 1000 // number of items
} as const;