/**
 * Database Service Component Module - Main Export Index
 * 
 * This barrel export file provides centralized access to all database service components, hooks,
 * types, and utilities. Designed to support React 19 stable features with TypeScript 5.8+ module
 * system and Turbopack optimization for enhanced tree-shaking performance.
 * 
 * The module implements comprehensive database service management functionality including:
 * - Service list management with virtualization for 1000+ tables per Section 5.2
 * - Service creation and configuration workflows with React Hook Form integration  
 * - Real-time connection testing with SWR caching under 50ms per integration requirements
 * - Multi-database support (MySQL, PostgreSQL, Oracle, MongoDB, Snowflake) per F-001
 * - Zustand state management with React Query for intelligent server-state caching
 * 
 * @fileoverview Centralized exports for database service component ecosystem
 * @version 1.0.0
 * @since 2024-01-01
 */

// =============================================================================
// CORE PROVIDER COMPONENT
// =============================================================================

/**
 * Main database service provider component that manages global state, configuration,
 * and shared functionality across all database service components.
 * 
 * Features:
 * - Zustand store integration for service list state management
 * - SWR configuration for real-time connection testing and caching
 * - React Query setup for advanced service management operations
 * - Support for all database types per F-001 requirements
 * - Context provider for sharing configuration across component tree
 */
export {
  DatabaseServiceProvider,
  useDatabaseServiceContext,
  useDatabaseServiceActions,
  useDatabaseServiceState,
  useSelectedService,
  useDatabaseServiceStore,
  default as Provider
} from './database-service-provider';

// =============================================================================
// SERVICE LIST COMPONENTS AND HOOKS
// =============================================================================

/**
 * Service list module exports for database service management interface.
 * Implements table virtualization for large datasets and CRUD operations.
 */
export {
  // Main service list components
  ServiceListContainer,
  ServiceListTable,
  
  // Service list hooks for data fetching and state management
  useServiceList,
  useServiceListFilters,
  useServiceListMutations,
  useServiceListVirtualization,
  useServiceListSelection,
  useServiceConnectionStatus,
  useServiceListExport,
  
  // Service list types and interfaces
  type ServiceListContainerProps,
  type ServiceListTableProps,
  type ServiceListFilters,
  type ServiceListSorting,
  type ServiceListPagination,
  type ServiceListVirtualizationConfig,
  type ServiceListSelectionState,
  type ServiceListExportOptions
} from './service-list';

// =============================================================================
// SERVICE FORM COMPONENTS AND HOOKS
// =============================================================================

/**
 * Service form module exports for database service creation and configuration.
 * Implements multi-step wizard workflow with dynamic schema-driven fields.
 */
export {
  // Main service form components
  ServiceFormContainer,
  ServiceFormWizard,
  ServiceFormFields,
  PaywallModal,
  
  // Service form hooks for wizard navigation and data operations
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields,
  useServiceConnectionTest as useFormConnectionTest,
  useServiceFormPaywall,
  useServiceFormSecurity,
  useServiceFormSubmission,
  
  // Service form types and validation schemas
  type ServiceFormContainerProps,
  type ServiceFormWizardProps,
  type ServiceFormFieldsProps,
  type PaywallModalProps,
  type ServiceFormStep,
  type ServiceFormWizardState,
  type ServiceFormFieldConfig,
  type ServiceFormSecurityConfig,
  type ServiceFormSubmissionState
} from './service-form';

// =============================================================================
// CONNECTION TESTING COMPONENTS AND HOOKS
// =============================================================================

/**
 * Connection testing module exports for real-time database connection validation.
 * Implements SWR-powered testing with intelligent caching and retry logic.
 */
export {
  // Connection test components
  ConnectionTestButton,
  ConnectionStatusIndicator,
  TestResultDisplay,
  
  // Connection test hook for real-time validation
  useConnectionTest,
  
  // Connection test types
  type ConnectionTestButtonProps,
  type ConnectionStatusIndicatorProps,
  type TestResultDisplayProps,
  type ConnectionTestHookReturn,
  type ConnectionTestOptions
} from './connection-test';

// =============================================================================
// DATABASE SERVICE HOOKS (RESOLVERS REPLACEMENT)
// =============================================================================

/**
 * Database service hooks that replace Angular resolvers with React Query integration.
 * Provides intelligent caching and background synchronization for service data.
 */
export {
  // Data fetching hooks
  useServices,
  useServiceTypes,
  useSystemEvents,
  
  // Hook return types
  type UseServicesReturn,
  type UseServiceTypesReturn,
  type UseSystemEventsReturn,
  type UseServicesOptions,
  type UseServiceTypesOptions,
  type UseSystemEventsOptions
} from './hooks';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Comprehensive type definitions for database service operations.
 * Provides type safety across all database service components and workflows.
 */
export type {
  // Core database service types
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
  
  // Connection testing types
  ConnectionTestResult,
  ConnectionTestStatus,
  ConnectionMetadata,
  SSLConfig,
  PoolingConfig,
  DatabaseOptions,
  
  // API response types
  GenericListResponse,
  ApiErrorResponse,
  ResponseMetadata,
  
  // Component prop interfaces
  DatabaseServiceListProps,
  DatabaseServiceFormProps,
  ConnectionTestProps,
  ConnectionStatusProps,
  DatabaseServiceProviderProps,
  BaseComponentProps,
  
  // State management types
  DatabaseServiceState,
  DatabaseServiceActions,
  DatabaseServiceContextType,
  
  // Hook return types
  UseConnectionTestReturn,
  UseServiceTypesReturn,
  UseServicesReturn,
  
  // SWR and React Query integration types
  DatabaseServiceSWRConfig,
  DatabaseServiceSWRResponse,
  DatabaseServiceQueryOptions,
  DatabaseServiceMutationOptions,
  
  // Utility types
  PartialBy,
  RequiredBy,
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  ServiceRow,
  
  // Timeout and configuration types
  ConnectionTimeouts,
  SWRConfig,
  ReactQueryConfig
} from './types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schemas for type-safe form handling and data validation.
 * Provides real-time validation under 100ms per React/Next.js integration requirements.
 */
export {
  // Validation schemas
  DatabaseConnectionSchema,
  ConnectionTestSchema,
  
  // Query keys for React Query cache management
  DatabaseServiceQueryKeys,
  
  // Inferred types from schemas
  type DatabaseConnectionInput,
  type ConnectionTestInput
} from './types';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Database service constants, configuration values, and default settings.
 * Provides centralized configuration for optimal performance and maintainability.
 */
export {
  // Database type definitions and support matrix
  DATABASE_TYPES,
  DATABASE_TYPE_LIST,
  DATABASE_TYPES_BY_TIER,
  
  // Default configurations for each database type
  DEFAULT_DATABASE_CONFIGS,
  
  // API endpoint URLs and routing patterns
  DATABASE_SERVICE_ENDPOINTS,
  
  // Connection timeouts and retry configuration
  CONNECTION_TIMEOUTS,
  CONNECTION_RETRY_CONFIG,
  
  // SWR configuration for data fetching optimization
  DATABASE_SERVICE_SWR_CONFIG as SWR_CONFIG,
  
  // React Query configuration for server-state management
  DATABASE_SERVICE_REACT_QUERY_CONFIG as REACT_QUERY_CONFIG,
  
  // Validation rules and constraints
  DATABASE_VALIDATION_RULES,
  
  // UI component configuration
  DATABASE_SERVICE_UI_CONFIG,
  
  // Feature flags and capabilities
  DATABASE_FEATURE_FLAGS,
  
  // Error and success messages
  DATABASE_ERROR_MESSAGES,
  DATABASE_SUCCESS_MESSAGES
} from './constants';

// =============================================================================
// CONVENIENCE RE-EXPORTS FOR COMMON PATTERNS
// =============================================================================

/**
 * Commonly used combinations and convenience exports for enhanced developer experience.
 * These re-exports provide convenient access to frequently used patterns.
 */

// Combined hook exports for service management
export const DatabaseServiceHooks = {
  // Context and provider hooks
  useContext: useDatabaseServiceContext,
  useActions: useDatabaseServiceActions,
  useState: useDatabaseServiceState,
  useSelectedService,
  
  // Data fetching hooks
  useServices,
  useServiceTypes,
  useSystemEvents,
  
  // Connection testing hooks
  useConnectionTest,
  
  // Service list management hooks
  useServiceList,
  useServiceListFilters,
  useServiceListMutations,
  
  // Service form management hooks
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields
};

// Component collections for easy imports
export const DatabaseServiceComponents = {
  // Provider component
  Provider: DatabaseServiceProvider,
  
  // Service list components
  ServiceList: {
    Container: ServiceListContainer,
    Table: ServiceListTable
  },
  
  // Service form components
  ServiceForm: {
    Container: ServiceFormContainer,
    Wizard: ServiceFormWizard,
    Fields: ServiceFormFields,
    PaywallModal
  },
  
  // Connection test components
  ConnectionTest: {
    Button: ConnectionTestButton,
    StatusIndicator: ConnectionStatusIndicator,
    ResultDisplay: TestResultDisplay
  }
};

// Configuration objects for easy access
export const DatabaseServiceConfig = {
  // Database type definitions
  types: DATABASE_TYPES,
  typeList: DATABASE_TYPE_LIST,
  typesByTier: DATABASE_TYPES_BY_TIER,
  
  // Default configurations
  defaults: DEFAULT_DATABASE_CONFIGS,
  
  // API endpoints
  endpoints: DATABASE_SERVICE_ENDPOINTS,
  
  // Timeouts and performance settings
  timeouts: CONNECTION_TIMEOUTS,
  retryConfig: CONNECTION_RETRY_CONFIG,
  
  // Caching configuration
  swr: DATABASE_SERVICE_SWR_CONFIG,
  reactQuery: DATABASE_SERVICE_REACT_QUERY_CONFIG,
  
  // Validation and UI configuration
  validation: DATABASE_VALIDATION_RULES,
  ui: DATABASE_SERVICE_UI_CONFIG,
  features: DATABASE_FEATURE_FLAGS,
  
  // Messages and feedback
  messages: {
    error: DATABASE_ERROR_MESSAGES,
    success: DATABASE_SUCCESS_MESSAGES
  }
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the main DatabaseServiceProvider component
 * for convenient import patterns: import DatabaseService from './database-service'
 */
export default DatabaseServiceProvider;

// =============================================================================
// MODULE METADATA AND VERSIONING
// =============================================================================

/**
 * Module metadata for version tracking and compatibility checking
 */
export const DatabaseServiceModule = {
  version: '1.0.0',
  compatible: {
    react: '>=19.0.0',
    nextjs: '>=15.1.0',
    typescript: '>=5.8.0'
  },
  dependencies: {
    '@tanstack/react-query': '^5.79.2',
    'swr': '^2.2.0',
    'zustand': '^4.5.0',
    'react-hook-form': '^7.52.0',
    'zod': '^3.22.0',
    '@headlessui/react': '^2.0.0',
    'tailwindcss': '^4.1.0'
  },
  description: 'Comprehensive database service management components for React/Next.js applications',
  author: 'DreamFactory Admin Interface Team',
  license: 'MIT'
} as const;