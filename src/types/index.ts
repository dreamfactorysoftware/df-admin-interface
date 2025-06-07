/**
 * @fileoverview Central type exports for DreamFactory Admin Interface
 * @description Provides convenient access to all application types, interfaces, and utilities
 * Enables clean imports throughout the React application while maintaining TypeScript tree-shaking optimization
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - TypeScript 5.8+ compatibility with React 19 server components
 * - Tree-shaking optimized exports for development velocity
 * - Logical type groupings for enhanced developer experience
 * - Namespace exports for complex type hierarchies
 * - Development vs production export patterns
 */

// =============================================================================
// CORE API TYPES
// =============================================================================

/**
 * Core API types for HTTP communication, authentication, and DreamFactory integration
 * Provides foundation for SWR/React Query integration and Next.js API routes
 */
export type {
  // HTTP Request/Response patterns
  ApiResponse,
  ApiRequest,
  ApiError,
  ApiErrorDetails,
  ApiSuccessResponse,
  
  // Generic list and pagination
  ListResponse,
  PaginationMetadata,
  FilterOptions,
  SortOptions,
  SearchParams,
  
  // Authentication headers and tokens
  AuthHeaders,
  BearerToken,
  SessionToken,
  ApiKey,
  
  // DreamFactory API compatibility
  DreamFactoryResponse,
  SystemApiResponse,
  ResourceListResponse,
  
  // Next.js server component support
  ServerActionResult,
  ServerComponentProps,
  
  // SWR/React Query integration
  CacheConfig,
  MutationOptions,
  QueryOptions,
  
  // Zod schema validation types
  ValidationResult,
  SchemaValidation,
  RuntimeTypeCheck,
} from './api'

// =============================================================================
// DATABASE & SERVICE TYPES
// =============================================================================

/**
 * Database service configuration and connection management types
 * Supports all DreamFactory database connectors with React Query integration
 */
export type {
  // Database connection configuration
  DatabaseConnection,
  DatabaseConfig,
  ConnectionParams,
  DatabaseDriver,
  DatabaseType,
  
  // SSL and security settings
  SSLConfig,
  SSLMode,
  TrustStoreConfig,
  CertificateConfig,
  
  // Connection pooling and performance
  PoolConfig,
  ConnectionPool,
  PoolStatistics,
  PerformanceMetrics,
  
  // Connection testing and validation
  ConnectionTest,
  TestResult,
  ConnectionStatus,
  ValidationErrors,
  
  // Multi-database support
  MySQLConfig,
  PostgreSQLConfig,
  MongoDBConfig,
  OracleConfig,
  SnowflakeConfig,
  SQLServerConfig,
  
  // React Hook Form schemas
  DatabaseFormData,
  ConnectionFormSchema,
  DatabaseFormState,
} from './database'

/**
 * Service management types for API generation and deployment
 * Supports OpenAPI specification generation with Next.js integration
 */
export type {
  // Service configuration
  ServiceConfig,
  ServiceDefinition,
  ServiceMetadata,
  ServiceStatus,
  ServiceType,
  
  // API endpoint generation
  EndpointConfig,
  EndpointDefinition,
  HTTPMethod,
  RouteParameter,
  QueryParameter,
  
  // OpenAPI specification
  OpenAPISpec,
  OpenAPIPath,
  OpenAPISchema,
  OpenAPIResponse,
  OpenAPIParameter,
  
  // Service deployment
  DeploymentConfig,
  DeploymentStatus,
  ServiceHealth,
  MonitoringMetrics,
  
  // Wizard and generation flow
  GenerationStep,
  WizardState,
  GenerationProgress,
  GenerationResult,
} from './services'

// =============================================================================
// SCHEMA & METADATA TYPES
// =============================================================================

/**
 * Database schema discovery and metadata management types
 * Supports hierarchical tree structures with virtual scrolling for large datasets
 */
export type {
  // Schema discovery
  SchemaMetadata,
  TableMetadata,
  FieldMetadata,
  IndexMetadata,
  ConstraintMetadata,
  
  // Hierarchical tree structure
  SchemaNode,
  TableNode,
  FieldNode,
  TreeNodeType,
  NodeExpansion,
  
  // Relationships and foreign keys
  TableRelationship,
  ForeignKey,
  RelationshipType,
  ReferentialAction,
  
  // Field types and constraints
  FieldType,
  FieldConstraints,
  FieldDefault,
  FieldValidation,
  DataTypeMapping,
  
  // Large dataset support
  VirtualScrollConfig,
  PaginatedSchema,
  LazyLoadConfig,
  ProgressiveLoading,
  
  // Schema introspection
  IntrospectionResult,
  MetadataCache,
  SchemaVersion,
  SchemaComparison,
  
  // React Query optimization
  SchemaQueryKey,
  SchemaCache,
  InvalidationStrategy,
} from './schema'

// =============================================================================
// USER MANAGEMENT & AUTHENTICATION
// =============================================================================

/**
 * User management and authentication types
 * Supports JWT-based authentication with Next.js middleware integration
 */
export type {
  // User profiles and authentication
  User,
  UserProfile,
  UserCredentials,
  LoginRequest,
  LoginResponse,
  
  // Session management
  Session,
  SessionData,
  SessionToken,
  SessionExpiry,
  TokenRefresh,
  
  // Role-based access control
  Role,
  Permission,
  RoleAssignment,
  AccessLevel,
  ResourcePermission,
  
  // Admin and user management
  AdminUser,
  UserManagement,
  UserRegistration,
  PasswordReset,
  AccountActivation,
  
  // Next.js middleware integration
  AuthMiddleware,
  ProtectedRoute,
  AuthContext,
  AuthProvider,
  
  // JWT and token handling
  JWTPayload,
  TokenValidation,
  TokenDecoding,
  RefreshStrategy,
} from './user'

/**
 * Authentication flow and security types
 * Supports SAML/OAuth integration with React context patterns
 */
export type {
  // Authentication methods
  AuthMethod,
  AuthProvider,
  OAuthConfig,
  SAMLConfig,
  LDAPConfig,
  
  // Login and logout flows
  LoginFlow,
  LogoutFlow,
  AuthRedirect,
  CallbackHandler,
  
  // Security and encryption
  EncryptionConfig,
  HashingAlgorithm,
  SecurityPolicy,
  PasswordPolicy,
  
  // Multi-factor authentication
  MFAConfig,
  TOTPConfig,
  SMSConfig,
  EmailConfig,
  
  // Next.js middleware patterns
  MiddlewareConfig,
  RouteProtection,
  AuthGuard,
  PermissionCheck,
  
  // React hooks and context
  UseAuthHook,
  AuthHookReturn,
  AuthContextValue,
  SecurityContext,
} from './auth'

// =============================================================================
// UI & FORM MANAGEMENT
// =============================================================================

/**
 * React UI component types with Tailwind CSS and Headless UI integration
 * Provides WCAG 2.1 AA compliant component interfaces
 */
export type {
  // Component props and variants
  ComponentProps,
  ComponentVariants,
  StyleVariants,
  ThemeConfig,
  
  // Tailwind CSS integration
  TailwindConfig,
  UtilityClasses,
  ResponsiveBreakpoints,
  ColorPalette,
  
  // Headless UI components
  DialogProps,
  DropdownProps,
  TabsProps,
  ComboboxProps,
  ToggleProps,
  
  // Form UI components
  InputProps,
  SelectProps,
  TextareaProps,
  CheckboxProps,
  RadioProps,
  
  // Navigation and layout
  NavigationProps,
  SidebarProps,
  HeaderProps,
  BreadcrumbProps,
  
  // Data display components
  TableProps,
  CardProps,
  ListProps,
  GridProps,
  
  // Accessibility compliance
  A11yProps,
  AriaAttributes,
  KeyboardNavigation,
  ScreenReaderSupport,
  
  // class-variance-authority types
  CVAConfig,
  VariantProps,
  ClassVariants,
} from './ui'

/**
 * React Hook Form configuration with Zod validation
 * Provides comprehensive form validation with real-time feedback
 */
export type {
  // Form configuration
  FormConfig,
  FormSchema,
  FormValidation,
  FormState,
  FormErrors,
  
  // React Hook Form integration
  UseFormConfig,
  UseFormReturn,
  FieldValues,
  FormProvider,
  
  // Zod schema validation
  ZodSchema,
  ValidationSchema,
  SchemaInference,
  ValidationError,
  
  // Dynamic forms
  DynamicField,
  FieldConfig,
  ConditionalLogic,
  FieldDependency,
  
  // Form components
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  
  // Validation timing
  ValidationTrigger,
  RealTimeValidation,
  DebounceConfig,
  ValidationStrategy,
  
  // Form submission
  SubmitHandler,
  FormSubmission,
  SubmissionResult,
  ErrorHandling,
} from './forms'

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Application state management with Zustand and React Query
 * Supports both client and server-side state with React 19 concurrent features
 */
export type {
  // Zustand store patterns
  StoreConfig,
  StoreState,
  StoreActions,
  StoreSelectors,
  
  // Global application state
  AppState,
  UIState,
  UserState,
  NavigationState,
  
  // React Query cache management
  QueryState,
  MutationState,
  CacheManagement,
  InvalidationConfig,
  
  // Server state synchronization
  ServerState,
  SyncStrategy,
  BackgroundRefetch,
  OptimisticUpdate,
  
  // React 19 concurrent features
  ConcurrentState,
  TransitionState,
  SuspenseConfig,
  ErrorBoundaryState,
  
  // State persistence
  PersistConfig,
  LocalStorage,
  SessionStorage,
  StateHydration,
} from './state'

// =============================================================================
// CONFIGURATION & ENVIRONMENT
// =============================================================================

/**
 * Application configuration and environment types
 * Supports Next.js environment patterns with runtime configuration
 */
export type {
  // Environment configuration
  EnvironmentConfig,
  EnvVariables,
  ConfigValidation,
  RuntimeConfig,
  
  // Application settings
  AppConfig,
  FeatureFlags,
  APIConfig,
  DatabaseConfig,
  
  // Next.js configuration
  NextConfig,
  BuildConfig,
  DeploymentConfig,
  ServerConfig,
  
  // Development vs production
  DevConfig,
  ProdConfig,
  StagingConfig,
  TestConfig,
  
  // Feature toggles
  FeatureToggle,
  ToggleConfig,
  ConditionalFeature,
  FeatureGate,
} from './config'

// =============================================================================
// VALIDATION & SCHEMA
// =============================================================================

/**
 * Comprehensive validation schemas with Zod integration
 * Provides runtime type checking with compile-time inference
 */
export type {
  // Zod schema types
  ValidationSchema,
  SchemaType,
  InferredType,
  SchemaValidation,
  
  // Custom validators
  CustomValidator,
  ValidatorFunction,
  ValidationRule,
  ValidationContext,
  
  // Field validation
  FieldValidator,
  FieldValidation,
  ValidationTrigger,
  ValidationMessage,
  
  // Server-side validation
  ServerValidation,
  APIValidation,
  RequestValidation,
  ResponseValidation,
  
  // Validation utilities
  ValidationUtils,
  ValidationHelper,
  ErrorFormatter,
  MessageFormatter,
} from './validation'

// =============================================================================
// ROUTING & NAVIGATION
// =============================================================================

/**
 * Next.js routing types with server component support
 * Supports type-safe navigation with file-based routing
 */
export type {
  // Next.js App Router
  AppRouterConfig,
  RouteParams,
  SearchParams,
  PageProps,
  LayoutProps,
  
  // Dynamic routing
  DynamicRoute,
  RouteSegment,
  CatchAllRoute,
  OptionalCatchAll,
  
  // Navigation types
  NavigationItem,
  RouteConfig,
  BreadcrumbItem,
  MenuStructure,
  
  // Server components
  ServerComponent,
  ClientComponent,
  StaticParams,
  GenerateMetadata,
  
  // Middleware routing
  MiddlewareConfig,
  RouteProtection,
  RedirectConfig,
  RewriteConfig,
} from './routes'

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Testing utility types for Vitest and React Testing Library
 * Provides type safety for test fixtures, mocks, and testing utilities
 */
export type {
  // Vitest testing types
  VitestConfig,
  TestConfig,
  MockConfig,
  TestUtilities,
  
  // React Testing Library
  RTLConfig,
  RenderOptions,
  UserEventConfig,
  ScreenQueries,
  
  // Mock Service Worker
  MSWConfig,
  MockHandler,
  APIHandler,
  MockResponse,
  
  // Component testing
  ComponentTest,
  TestProps,
  TestFixture,
  TestScenario,
  
  // Performance testing
  PerformanceTest,
  BenchmarkConfig,
  TimingMetrics,
  MemoryMetrics,
  
  // Test utilities
  TestHelper,
  MockFactory,
  FixtureGenerator,
  TestDataBuilder,
} from './testing'

// =============================================================================
// NAMESPACE EXPORTS FOR COMPLEX TYPE HIERARCHIES
// =============================================================================

/**
 * Namespace exports for organized type access
 * Enables both direct imports and namespace-based imports
 */

// API namespace for HTTP and communication types
export * as API from './api'

// Database namespace for all database-related types
export * as Database from './database'

// Schema namespace for metadata and discovery types
export * as Schema from './schema'

// Auth namespace for authentication and security types
export * as Auth from './auth'

// User namespace for user management types
export * as User from './user'

// UI namespace for component and styling types
export * as UI from './ui'

// Forms namespace for form management and validation
export * as Forms from './forms'

// State namespace for state management types
export * as State from './state'

// Config namespace for configuration types
export * as Config from './config'

// Routes namespace for routing and navigation types
export * as Routes from './routes'

// Testing namespace for test utilities and mocks
export * as Testing from './testing'

// =============================================================================
// CONVENIENCE TYPE UNIONS
// =============================================================================

/**
 * Convenience type unions for common patterns
 * Simplifies imports for frequently used type combinations
 */

// All form-related types
export type FormTypes = 
  | FormConfig 
  | FormSchema 
  | FormValidation 
  | ValidationSchema
  | ZodSchema

// All API-related types
export type APITypes = 
  | ApiResponse 
  | ApiRequest 
  | ApiError 
  | DreamFactoryResponse
  | AuthHeaders

// All component-related types
export type ComponentTypes = 
  | ComponentProps 
  | ComponentVariants 
  | DialogProps 
  | TableProps
  | NavigationProps

// All state-related types
export type StateTypes = 
  | AppState 
  | StoreConfig 
  | QueryState 
  | ServerState
  | CacheManagement

// All database-related types
export type DatabaseTypes = 
  | DatabaseConnection 
  | DatabaseConfig 
  | SchemaMetadata 
  | TableMetadata
  | ServiceConfig

// =============================================================================
// DEVELOPMENT VS PRODUCTION EXPORTS
// =============================================================================

/**
 * Conditional exports based on environment
 * Provides development-specific types while optimizing production builds
 */

// Development-only types (tree-shaken in production)
export type {
  // Debug and development utilities
  DebugConfig,
  DevToolsConfig,
  HotReloadConfig,
  SourceMapConfig,
} from './config'

// Export type for better tree-shaking in development
export type DevelopmentTypes = {
  debug: DebugConfig
  devtools: DevToolsConfig
  hotreload: HotReloadConfig
  sourcemap: SourceMapConfig
}

// =============================================================================
// TYPE UTILITIES AND HELPERS
// =============================================================================

/**
 * Utility types for enhanced TypeScript development experience
 * Provides helper types for complex type transformations
 */

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }
export type DeepRequired<T> = { [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P] }

// React-specific utility types
export type PropsWithClassName<T = {}> = T & { className?: string }
export type PropsWithChildren<T = {}> = T & { children?: React.ReactNode }
export type ComponentWithRef<T, R = HTMLElement> = React.ForwardRefExoticComponent<T & React.RefAttributes<R>>

// Form utility types
export type FormFieldProps<T> = {
  name: keyof T
  control: any
  rules?: object
  defaultValue?: T[keyof T]
}

// API utility types
export type ApiEndpoint<T = any> = {
  method: HTTPMethod
  path: string
  params?: Record<string, any>
  body?: T
  headers?: Record<string, string>
}

// =============================================================================
// DEFAULT EXPORT (for convenience)
// =============================================================================

/**
 * Default export containing commonly used types
 * Enables convenient default import pattern for most common types
 */
const CommonTypes = {
  // Most frequently used API types
  ApiResponse,
  ApiRequest,
  ApiError,
  
  // Most frequently used database types
  DatabaseConnection,
  DatabaseConfig,
  
  // Most frequently used form types
  FormConfig,
  FormSchema,
  
  // Most frequently used component types
  ComponentProps,
  ComponentVariants,
  
  // Most frequently used state types
  AppState,
  StoreConfig,
  
  // Most frequently used user types
  User,
  UserProfile,
  Session,
} as const

export default CommonTypes

/**
 * @example
 * // Direct type imports
 * import { ApiResponse, DatabaseConnection, FormConfig } from '@/types'
 * 
 * // Namespace imports
 * import { API, Database, Forms } from '@/types'
 * 
 * // Default import for common types
 * import CommonTypes from '@/types'
 * 
 * // Mixed import patterns
 * import CommonTypes, { API, Database } from '@/types'
 * import type { ComponentTypes, StateTypes } from '@/types'
 */