/**
 * @fileoverview Central exports file providing convenient access to all application types and interfaces
 * 
 * This file serves as the primary entry point for all TypeScript type definitions throughout the
 * React/Next.js DreamFactory Admin Interface. It replaces scattered Angular type imports with 
 * organized re-exports optimized for TypeScript 5.8+ tree-shaking capabilities.
 * 
 * Key Features:
 * - Enhanced IntelliSense and debugging capabilities for React 19 compatibility
 * - Server component typing support for Next.js 15.1+
 * - Logical type groupings for improved development velocity
 * - Namespace exports for complex type hierarchies
 * - Development vs production export patterns
 * 
 * Performance Considerations:
 * - Tree-shaking optimization ensures only used types are bundled
 * - Lazy loading support for large type definitions
 * - Optimized import paths for faster compilation with Turbopack
 * 
 * @version 1.0.0
 * @requires TypeScript 5.8+
 * @requires React 19
 * @requires Next.js 15.1+
 */

// =============================================================================
// CORE API TYPES
// =============================================================================

/**
 * Core API types for HTTP communication, pagination, and error handling
 * Used throughout the application for DreamFactory backend integration
 */
export type {
  // HTTP Request/Response patterns
  ApiRequest,
  ApiResponse,
  ApiError,
  ApiSuccess,
  
  // Generic list responses and pagination
  ListResponse,
  PaginationMeta,
  SortOptions,
  FilterOptions,
  
  // Authentication headers and tokens
  AuthHeaders,
  SessionToken,
  ApiKey,
  
  // Error handling structures
  ValidationError,
  ServerError,
  NetworkError,
  
  // Next.js API route compatibility
  ApiRouteHandler,
  NextApiRequest,
  NextApiResponse,
  
  // Zod schema validation types
  ApiSchema,
  ValidationResult,
  SchemaError,
} from './api';

// =============================================================================
// DATABASE & SERVICE TYPES
// =============================================================================

/**
 * Database service configuration and connection management types
 * Supports all DreamFactory database connectors with React Query integration
 */
export type {
  // Database connection configurations
  DatabaseConfig,
  ConnectionParams,
  DatabaseDriver,
  DatabaseType,
  SSLConfig,
  PoolingConfig,
  
  // Connection testing and validation
  ConnectionTest,
  ConnectionStatus,
  ConnectionError,
  TestResult,
  
  // Database service definitions
  DatabaseService,
  ServiceConfig,
  ServiceStatus,
  ServiceHealth,
  
  // Multi-database support
  SupportedDatabases,
  DriverCapabilities,
  DatabaseFeatures,
  
  // React Query integration types
  DatabaseQuery,
  DatabaseMutation,
  CacheConfig,
} from './database';

/**
 * Database schema discovery and metadata types
 * Optimized for large datasets (1000+ tables) with virtual scrolling
 */
export type {
  // Schema metadata structures
  DatabaseSchema,
  TableMetadata,
  FieldDefinition,
  IndexDefinition,
  ConstraintDefinition,
  
  // Relationship mapping
  TableRelationship,
  ForeignKey,
  ReferenceDefinition,
  RelationshipType,
  
  // Hierarchical tree structures
  SchemaTree,
  TreeNode,
  TreeExpansion,
  NavigationState,
  
  // Virtual scrolling for performance
  VirtualizedList,
  ScrollPosition,
  ViewportConfig,
  LazyLoadingState,
  
  // Progressive loading patterns
  SchemaDiscovery,
  LoadingProgress,
  PartialSchema,
  SchemaCache,
} from './schema';

/**
 * Service management and API generation types
 * Supports OpenAPI specification generation with Next.js integration
 */
export type {
  // Service configuration
  ServiceDefinition,
  ServiceSettings,
  ServiceMetadata,
  ServiceDeployment,
  
  // API endpoint generation
  EndpointConfig,
  HTTPMethod,
  ParameterDefinition,
  ResponseSchema,
  
  // OpenAPI specification
  OpenAPISpec,
  OpenAPIPath,
  OpenAPIComponent,
  SwaggerDefinition,
  
  // Preview interface
  PreviewConfig,
  PreviewResponse,
  PreviewError,
  MockData,
  
  // Generation workflow
  GenerationStep,
  GenerationConfig,
  GenerationResult,
  GenerationError,
} from './services';

// =============================================================================
// AUTHENTICATION & SECURITY TYPES
// =============================================================================

/**
 * Authentication and authorization types for Next.js middleware patterns
 * Supports JWT validation and role-based access control
 */
export type {
  // Authentication payloads
  LoginCredentials,
  LoginResponse,
  AuthenticationState,
  SessionData,
  
  // JWT and token management
  JWTPayload,
  TokenValidation,
  RefreshToken,
  TokenExpiry,
  
  // Session management
  SessionConfig,
  SessionStorage,
  CookieOptions,
  SessionMiddleware,
  
  // Role-based access control
  UserRole,
  Permission,
  RoleAssignment,
  AccessControl,
  
  // Security policies
  SecurityRule,
  SecurityPolicy,
  AuthenticationMethod,
  AuthorizationRule,
  
  // Next.js middleware integration
  MiddlewareRequest,
  MiddlewareResponse,
  AuthMiddleware,
  SecurityContext,
} from './auth';

/**
 * User management types including profiles, administration, and role assignments
 * Compatible with Next.js server components and SSR
 */
export type {
  // User profiles and data
  UserProfile,
  UserData,
  UserPreferences,
  UserSettings,
  
  // User management
  UserManagement,
  UserRegistration,
  UserUpdate,
  UserDeletion,
  
  // Admin configurations
  AdminUser,
  AdminConfig,
  AdminPermissions,
  AdminSettings,
  
  // Profile management
  ProfileForm,
  ProfileValidation,
  ProfileUpdate,
  ProfileError,
  
  // User session data
  UserSession,
  SessionUser,
  ActiveSession,
  SessionHistory,
} from './user';

// =============================================================================
// UI & FORM TYPES
// =============================================================================

/**
 * React UI component types with Tailwind CSS and Headless UI integration
 * Ensures WCAG 2.1 AA accessibility compliance
 */
export type {
  // Form component types
  FormField,
  FormSchema,
  FormValidation,
  FormState,
  
  // Table and data display
  TableConfig,
  TableColumn,
  TableRow,
  TableAction,
  
  // Dialog and modal interfaces
  DialogProps,
  ModalConfig,
  ConfirmDialog,
  AlertDialog,
  
  // Navigation structures
  NavigationItem,
  MenuConfig,
  BreadcrumbItem,
  TabConfig,
  
  // Responsive design tokens
  BreakpointConfig,
  SpacingConfig,
  ColorConfig,
  TypographyConfig,
  
  // Accessibility types
  A11yProps,
  AriaLabels,
  KeyboardNavigation,
  ScreenReaderText,
  
  // Component variants with class-variance-authority
  VariantConfig,
  ComponentVariants,
  StyleVariants,
  ConditionalStyles,
} from './ui';

/**
 * React Hook Form configuration with Zod validation
 * Provides real-time validation under 100ms performance target
 */
export type {
  // React Hook Form integration
  FormConfig,
  FormMethods,
  FormErrors,
  FormSubmission,
  
  // Dynamic form generation
  DynamicForm,
  ConditionalField,
  FieldDependency,
  FormLogic,
  
  // Validation schemas
  ValidationSchema,
  ValidationRule,
  ValidationMessage,
  ValidationError as FormValidationError,
  
  // Performance optimization
  FormPerformance,
  ValidationTiming,
  RenderOptimization,
  FormMetrics,
  
  // Accessibility in forms
  FormAccessibility,
  FieldLabeling,
  ErrorMessaging,
  FormNavigation,
} from './forms';

// =============================================================================
// STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Application state management with Zustand and React Query
 * Supports both client and server state with React 19 concurrent features
 */
export type {
  // Zustand store patterns
  StoreConfig,
  StoreActions,
  StoreState,
  StoreSlice,
  
  // React Query cache management
  QueryConfig,
  QueryKey,
  QueryResult,
  MutationConfig,
  
  // Server state synchronization
  ServerState,
  CacheStrategy,
  SyncConfig,
  StateHydration,
  
  // Optimistic updates
  OptimisticUpdate,
  UpdateStrategy,
  RollbackConfig,
  UpdateError,
  
  // Concurrent features support
  ConcurrentState,
  SuspenseConfig,
  TransitionConfig,
  DeferredState,
  
  // Performance monitoring
  StateMetrics,
  CacheMetrics,
  SyncPerformance,
  StateProfiler,
} from './state';

// =============================================================================
// CONFIGURATION & ENVIRONMENT TYPES
// =============================================================================

/**
 * Application configuration with Next.js runtime support
 * Supports environment variables, build settings, and feature flags
 */
export type {
  // Environment configuration
  EnvironmentConfig,
  EnvironmentVariables,
  RuntimeConfig,
  BuildConfig,
  
  // Feature flags
  FeatureFlag,
  FeatureConfig,
  FeatureToggle,
  FeatureState,
  
  // API endpoints configuration
  EndpointConfig as ConfigEndpoint,
  APIConfig,
  ServiceEndpoints,
  ConnectionConfig,
  
  // Security configuration
  SecurityConfig,
  CorsConfig,
  CSPConfig,
  SecurityHeaders,
  
  // Performance configuration
  PerformanceConfig,
  CacheConfig as ConfigCache,
  OptimizationConfig,
  MonitoringConfig,
} from './config';

/**
 * Zod validation schemas for runtime type checking
 * Provides compile-time inference with comprehensive error messages
 */
export type {
  // Core validation types
  ValidationSchema as ZodSchema,
  ValidationResult as ZodResult,
  ValidationError as ZodError,
  SchemaInfer,
  
  // Form validation
  FormValidationSchema,
  FieldValidation,
  ConditionalValidation,
  AsyncValidation,
  
  // API validation
  RequestValidation,
  ResponseValidation,
  ParameterValidation,
  HeaderValidation,
  
  // Database validation
  DatabaseValidation,
  SchemaValidation,
  ConnectionValidation,
  ServiceValidation,
  
  // Custom validators
  CustomValidator,
  ValidatorFunction,
  ValidationContext,
  ValidationRule as ZodRule,
} from './validation';

// =============================================================================
// ROUTING & NAVIGATION TYPES
// =============================================================================

/**
 * Next.js routing types with file-based routing and server components
 * Supports dynamic routes and middleware patterns
 */
export type {
  // Page and layout components
  PageProps,
  LayoutProps,
  PageParams,
  SearchParams,
  
  // Route configurations
  RouteConfig,
  DynamicRoute,
  RouteParams,
  RouteHandler,
  
  // Middleware patterns
  MiddlewareConfig,
  RouteMiddleware,
  AuthenticationMiddleware,
  SecurityMiddleware,
  
  // Navigation state
  NavigationState,
  RouteState,
  HistoryState,
  NavigationError,
  
  // Server component integration
  ServerComponentProps,
  ClientComponentProps,
  HydrationProps,
  StaticProps,
} from './routes';

// =============================================================================
// TESTING TYPES
// =============================================================================

/**
 * Testing utilities for Vitest, React Testing Library, and Mock Service Worker
 * Ensures comprehensive test coverage with performance optimization
 */
export type {
  // Vitest configuration
  TestConfig,
  TestSuite,
  TestCase,
  TestResult,
  
  // React Testing Library
  RenderOptions,
  RenderResult,
  ComponentTest,
  HookTest,
  
  // Mock Service Worker
  MockHandler,
  MockResponse,
  MockError,
  MockConfig,
  
  // Test fixtures
  TestFixture,
  MockData as TestMockData,
  TestUser,
  TestDatabase,
  
  // Performance testing
  PerformanceTest,
  LoadTest,
  BenchmarkTest,
  MetricsTest,
  
  // Accessibility testing
  A11yTest,
  A11yReport,
  A11yViolation,
  A11yConfig,
} from './testing';

// =============================================================================
// NAMESPACE EXPORTS FOR COMPLEX TYPE HIERARCHIES
// =============================================================================

/**
 * Namespace exports for complex type hierarchies
 * Provides organized access to related type groups
 */

/** Database-related types namespace */
export * as Database from './database';

/** API communication types namespace */
export * as API from './api';

/** User management types namespace */  
export * as User from './user';

/** Authentication types namespace */
export * as Auth from './auth';

/** UI component types namespace */
export * as UI from './ui';

/** Form handling types namespace */
export * as Forms from './forms';

/** State management types namespace */
export * as State from './state';

/** Configuration types namespace */
export * as Config from './config';

/** Validation types namespace */
export * as Validation from './validation';

/** Routing types namespace */
export * as Routes from './routes';

/** Testing types namespace */
export * as Testing from './testing';

/** Schema discovery types namespace */
export * as Schema from './schema';

/** Service management types namespace */
export * as Services from './services';

// =============================================================================
// DEVELOPMENT VS PRODUCTION EXPORT PATTERNS
// =============================================================================

/**
 * Development-specific type exports
 * These types are only available in development builds for debugging and testing
 */
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    __NEXT_DATA__?: any;
  }
}

// Conditional development exports
export type {
  // Development debugging types
  DebugInfo,
  DevTools,
  PerformanceProfiler,
  ComponentProfiler,
  
  // Hot reload types
  HotReloadConfig,
  ModuleReplacement,
  UpdateState,
  ReloadEvent,
} from './testing';

/**
 * Type-only imports for optimal tree-shaking
 * Ensures TypeScript compilation efficiency with Turbopack
 */
export type * from './api';
export type * from './database';
export type * from './schema';
export type * from './user';
export type * from './ui';
export type * from './services';
export type * from './auth';
export type * from './forms';
export type * from './state';
export type * from './config';
export type * from './validation';
export type * from './routes';
export type * from './testing';

// =============================================================================
// UTILITY TYPE ALIASES FOR CONVENIENCE
// =============================================================================

/**
 * Common utility type aliases for enhanced developer experience
 * Provides convenient shortcuts for frequently used type patterns
 */

/** Commonly used API response type */
export type DefaultApiResponse<T = any> = ApiResponse<T>;

/** Standard pagination response */
export type PaginatedResponse<T = any> = ListResponse<T>;

/** Generic form submission handler */
export type FormSubmitHandler<T = any> = (data: T) => void | Promise<void>;

/** React component with children */
export type ComponentWithChildren<P = {}> = React.ComponentType<P & { children?: React.ReactNode }>;

/** Next.js page component type */
export type NextPageComponent<P = {}, IP = P> = React.ComponentType<P> & {
  getInitialProps?(ctx: any): IP | Promise<IP>;
};

/** Zustand store creator type */
export type StoreCreator<T> = (set: any, get: any) => T;

/** React Query options type */
export type QueryOptions<T = any> = {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  select?: (data: any) => T;
};

/**
 * Export default namespace for backwards compatibility
 * Maintains compatibility with existing import patterns during migration
 */
const TypesNamespace = {
  API,
  Database,
  User,
  Auth,
  UI,
  Forms,
  State,
  Config,
  Validation,
  Routes,
  Testing,
  Schema,
  Services,
} as const;

export default TypesNamespace;

// =============================================================================
// TYPE DOCUMENTATION AND EXAMPLES
// =============================================================================

/**
 * @example
 * // Import specific types
 * import type { DatabaseConfig, ApiResponse } from '@/types';
 * 
 * // Import namespace
 * import type { Database } from '@/types';
 * type MyConfig = Database.DatabaseConfig;
 * 
 * // Import everything from namespace
 * import type * as Types from '@/types';
 * type MyResponse = Types.API.ApiResponse<MyData>;
 * 
 * // Use utility aliases
 * import type { DefaultApiResponse, PaginatedResponse } from '@/types';
 * 
 * // Development-only imports
 * import type { DebugInfo } from '@/types';
 */