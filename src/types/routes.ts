/**
 * Next.js App Router Route Types
 * 
 * Comprehensive routing types for Next.js 15.1 App Router with React Server Components (RSC),
 * middleware authentication patterns, dynamic route generation, and type-safe navigation.
 * Supports file-based routing with enhanced performance and SEO capabilities.
 * 
 * @version Next.js 15.1+
 * @requires React 19, TypeScript 5.8+
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UserPermissions, UserRole } from './auth';

// ============================================================================
// Route Constants and Enums
// ============================================================================

/**
 * Route paths enum corresponding to Next.js file-based routing structure
 * Replaces Angular ROUTES enum with Next.js app router conventions
 */
export enum AppRoutes {
  // Root routes
  HOME = '/',
  
  // Authentication routes
  AUTH = '/auth',
  LOGIN = '/login',
  RESET_PASSWORD = '/reset-password',
  FORGOT_PASSWORD = '/forgot-password',
  REGISTER = '/register',
  USER_INVITE = '/user-invite',
  REGISTER_CONFIRM = '/register-confirm',
  SAML_CALLBACK = '/saml-callback',
  
  // Main application routes
  PROFILE = '/profile',
  
  // API Connections
  API_CONNECTIONS = '/api-connections',
  DATABASE = '/api-connections/database',
  SCRIPTING = '/api-connections/scripting',
  NETWORK = '/api-connections/network',
  FILE = '/api-connections/file',
  UTILITY = '/api-connections/utility',
  
  // API Security
  API_SECURITY = '/api-security',
  ROLES = '/api-security/roles',
  LIMITS = '/api-security/limits',
  
  // System Settings
  SYSTEM_SETTINGS = '/system-settings',
  SYSTEM_INFO = '/system-settings/system-info',
  CORS = '/system-settings/cors',
  CACHE = '/system-settings/cache',
  EMAIL_TEMPLATES = '/system-settings/email-templates',
  LOOKUP_KEYS = '/system-settings/lookup-keys',
  SCHEDULER = '/system-settings/scheduler',
  REPORTS = '/system-settings/reports',
  
  // Admin Settings
  ADMIN_SETTINGS = '/admin-settings',
  ADMINS = '/admin-settings/admins',
  USERS = '/admin-settings/users',
  SCHEMA = '/admin-settings/schema',
  FILES = '/admin-settings/files',
  
  // Special routes
  DEBUG = '/debug',
  ERROR = '/error',
  LICENSE_EXPIRED = '/license-expired',
  
  // Legacy ADF routes (for migration compatibility)
  ADF_HOME = '/adf-home',
  ADF_REPORTS = '/adf-reports',
  ADF_PROFILE = '/adf-profile',
  ADF_LIMITS = '/adf-limits',
  ADF_FILES = '/adf-files',
  ADF_EVENT_SCRIPTS = '/adf-event-scripts',
  ADF_CONFIG = '/adf-config',
  ADF_APPS = '/adf-apps',
  ADF_API_DOCS = '/adf-api-docs',
  ADF_ADMINS = '/adf-admins',
  ADF_USERS = '/adf-users',
  ADF_USER_MANAGEMENT = '/adf-user-management',
  ADF_SERVICES = '/adf-services',
  ADF_SCHEMA = '/adf-schema',
  ADF_SCHEDULER = '/adf-scheduler',
  ADF_ROLES = '/adf-roles',
}

/**
 * Action types for CRUD operations in dynamic routes
 */
export enum RouteActions {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
}

// ============================================================================
// Page Component Types
// ============================================================================

/**
 * Standard page props interface for Next.js App Router pages
 * Supports both static and dynamic routes with server component compatibility
 */
export interface PageProps<
  TParams extends Record<string, string | string[]> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {}
> {
  params: TParams;
  searchParams: TSearchParams;
}

/**
 * Layout component props interface
 */
export interface LayoutProps {
  children: React.ReactNode;
  params?: Record<string, string | string[]>;
}

/**
 * Error page props for error.tsx components
 */
export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Not found page props
 */
export interface NotFoundPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Loading page props
 */
export interface LoadingPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Global error page props
 */
export interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ============================================================================
// Dynamic Route Parameters
// ============================================================================

/**
 * Service-related dynamic route parameters
 */
export interface ServiceRouteParams {
  service: string;
  serviceId?: string;
}

/**
 * Database schema route parameters
 */
export interface SchemaRouteParams {
  service: string;
  table?: string;
  tableId?: string;
  field?: string;
  fieldId?: string;
  relation?: string;
  relationId?: string;
}

/**
 * User management route parameters
 */
export interface UserRouteParams {
  id: string;
  userId?: string;
}

/**
 * Admin management route parameters
 */
export interface AdminRouteParams {
  id: string;
  adminId?: string;
}

/**
 * Role management route parameters
 */
export interface RoleRouteParams {
  id: string;
  roleId?: string;
}

/**
 * Limit management route parameters
 */
export interface LimitRouteParams {
  id: string;
  limitId?: string;
}

/**
 * Email template route parameters
 */
export interface EmailTemplateRouteParams {
  id: string;
  templateId?: string;
}

/**
 * Script route parameters
 */
export interface ScriptRouteParams {
  name: string;
  scriptName?: string;
}

/**
 * Scheduler route parameters
 */
export interface SchedulerRouteParams {
  id: string;
  schedulerId?: string;
}

/**
 * File browser route parameters
 */
export interface FileRouteParams {
  entity: string;
  path?: string[];
}

// ============================================================================
// Search Parameters (Query Parameters)
// ============================================================================

/**
 * Common search parameters for list pages
 */
export interface ListSearchParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: string;
  tab?: string;
}

/**
 * Service list search parameters
 */
export interface ServiceListSearchParams extends ListSearchParams {
  type?: string;
  group?: string;
  active?: string;
}

/**
 * Schema browser search parameters
 */
export interface SchemaSearchParams extends ListSearchParams {
  expand?: string;
  includeSystem?: string;
  includeTables?: string;
  includeViews?: string;
}

/**
 * User list search parameters
 */
export interface UserListSearchParams extends ListSearchParams {
  role?: string;
  active?: string;
  verified?: string;
}

/**
 * API documentation search parameters
 */
export interface ApiDocsSearchParams {
  service?: string;
  version?: string;
  format?: 'json' | 'yaml';
  expand?: string;
}

/**
 * Debug page search parameters
 */
export interface DebugSearchParams {
  level?: 'debug' | 'info' | 'warn' | 'error';
  source?: string;
  timestamp?: string;
}

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Authentication middleware configuration
 */
export interface AuthMiddlewareConfig {
  /**
   * Routes that require authentication
   */
  protectedRoutes: string[];
  
  /**
   * Routes accessible without authentication
   */
  publicRoutes: string[];
  
  /**
   * Login redirect path
   */
  loginPath: string;
  
  /**
   * Default redirect after login
   */
  defaultRedirect: string;
  
  /**
   * Session token cookie name
   */
  sessionCookieName: string;
  
  /**
   * Token validation endpoint
   */
  validateTokenEndpoint: string;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  /**
   * Required authentication level
   */
  requireAuth: boolean;
  
  /**
   * Required user roles
   */
  requiredRoles?: UserRole[];
  
  /**
   * Required permissions
   */
  requiredPermissions?: UserPermissions[];
  
  /**
   * License requirements
   */
  requireLicense?: boolean;
  
  /**
   * Admin-only access
   */
  adminOnly?: boolean;
  
  /**
   * Root admin only access
   */
  rootAdminOnly?: boolean;
}

/**
 * Middleware request context
 */
export interface MiddlewareRequestContext {
  /**
   * Extracted user information
   */
  user?: {
    id: string;
    email: string;
    roles: UserRole[];
    permissions: UserPermissions[];
    isAdmin: boolean;
    isRootAdmin: boolean;
  };
  
  /**
   * Session information
   */
  session?: {
    token: string;
    expiresAt: Date;
    refreshToken?: string;
  };
  
  /**
   * Request metadata
   */
  metadata: {
    userAgent: string;
    ip: string;
    timestamp: Date;
    route: string;
  };
}

/**
 * Middleware response type
 */
export type MiddlewareResponse = 
  | NextResponse
  | Response
  | Promise<NextResponse>
  | Promise<Response>;

/**
 * Next.js middleware function type
 */
export type MiddlewareFunction = (
  request: NextRequest,
  context?: MiddlewareRequestContext
) => MiddlewareResponse;

// ============================================================================
// API Route Handler Types
// ============================================================================

/**
 * API route context for dynamic routes
 */
export interface ApiRouteContext<TParams = Record<string, string | string[]>> {
  params: TParams;
}

/**
 * API route handler type for Next.js App Router
 */
export type ApiRouteHandler<TParams = Record<string, string | string[]>> = (
  request: NextRequest,
  context: ApiRouteContext<TParams>
) => Promise<NextResponse> | NextResponse;

/**
 * HTTP methods supported by API routes
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * API route methods configuration
 */
export interface ApiRouteMethods {
  GET?: ApiRouteHandler;
  POST?: ApiRouteHandler;
  PUT?: ApiRouteHandler;
  PATCH?: ApiRouteHandler;
  DELETE?: ApiRouteHandler;
  OPTIONS?: ApiRouteHandler;
  HEAD?: ApiRouteHandler;
}

/**
 * API route configuration for DreamFactory proxy
 */
export interface DreamFactoryApiRoute {
  /**
   * Target DreamFactory endpoint
   */
  endpoint: string;
  
  /**
   * HTTP method mappings
   */
  methods: HttpMethod[];
  
  /**
   * Request transformation
   */
  transformRequest?: (request: NextRequest) => NextRequest | Promise<NextRequest>;
  
  /**
   * Response transformation
   */
  transformResponse?: (response: Response) => Response | Promise<Response>;
  
  /**
   * Authentication requirements
   */
  requireAuth: boolean;
  
  /**
   * Rate limiting configuration
   */
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// ============================================================================
// Route Generation and Navigation Types
// ============================================================================

/**
 * Route generation options
 */
export interface RouteGenerationOptions {
  /**
   * Base URL for absolute URLs
   */
  baseUrl?: string;
  
  /**
   * Query parameters to append
   */
  searchParams?: Record<string, string | string[] | undefined>;
  
  /**
   * URL fragment/hash
   */
  hash?: string;
  
  /**
   * Whether to generate absolute URL
   */
  absolute?: boolean;
}

/**
 * Navigation options for Next.js router
 */
export interface NavigationOptions {
  /**
   * Replace current history entry
   */
  replace?: boolean;
  
  /**
   * Scroll to top after navigation
   */
  scroll?: boolean;
  
  /**
   * Shallow routing (preserves page state)
   */
  shallow?: boolean;
}

/**
 * Typed route builder for type-safe navigation
 */
export interface TypedRoute<
  TParams extends Record<string, string | string[]> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {}
> {
  /**
   * Route path template
   */
  path: string;
  
  /**
   * Build URL with parameters
   */
  build(params: TParams, searchParams?: TSearchParams, options?: RouteGenerationOptions): string;
  
  /**
   * Navigate to route
   */
  navigate(params: TParams, searchParams?: TSearchParams, options?: NavigationOptions): void;
  
  /**
   * Get route matcher for middleware
   */
  matcher(): RegExp;
}

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Route configuration for the application
 */
export interface RouteConfig {
  /**
   * Route path
   */
  path: AppRoutes | string;
  
  /**
   * Route protection settings
   */
  protection: RouteProtection;
  
  /**
   * Middleware configuration
   */
  middleware?: string[];
  
  /**
   * Route metadata
   */
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    noIndex?: boolean;
  };
  
  /**
   * Performance settings
   */
  performance?: {
    /**
     * Enable static generation
     */
    static?: boolean;
    
    /**
     * Revalidation interval for ISR
     */
    revalidate?: number | false;
    
    /**
     * Runtime configuration
     */
    runtime?: 'nodejs' | 'edge';
  };
}

/**
 * Complete application route configuration
 */
export interface ApplicationRoutes {
  /**
   * Route configurations by path
   */
  routes: Record<string, RouteConfig>;
  
  /**
   * Global middleware configuration
   */
  middleware: AuthMiddlewareConfig;
  
  /**
   * Error page configurations
   */
  errorPages: {
    notFound: string;
    serverError: string;
    unauthorized: string;
    forbidden: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract route parameters from path string
 */
export type ExtractRouteParams<T extends string> = T extends `${infer _Start}[${infer Param}]${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : {};

/**
 * Route parameter validation schema
 */
export interface RouteParamValidation {
  /**
   * Parameter name
   */
  name: string;
  
  /**
   * Validation pattern
   */
  pattern: RegExp;
  
  /**
   * Optional parameter
   */
  optional?: boolean;
  
  /**
   * Transform function
   */
  transform?: (value: string) => any;
}

/**
 * Dynamic route metadata for API generation
 */
export interface DynamicRouteMetadata {
  /**
   * Route pattern
   */
  pattern: string;
  
  /**
   * Parameter definitions
   */
  parameters: RouteParamValidation[];
  
  /**
   * OpenAPI specification
   */
  openapi?: {
    summary: string;
    description: string;
    tags: string[];
    parameters: Array<{
      name: string;
      in: 'path' | 'query' | 'header';
      required: boolean;
      schema: any;
    }>;
  };
}

// ============================================================================
// Route Building Utilities
// ============================================================================

/**
 * Build typed route helpers
 */
export interface RouteBuilder {
  /**
   * Create typed route for service management
   */
  service: <T extends ServiceRouteParams>(params: T) => TypedRoute<T>;
  
  /**
   * Create typed route for schema management
   */
  schema: <T extends SchemaRouteParams>(params: T) => TypedRoute<T>;
  
  /**
   * Create typed route for user management
   */
  user: <T extends UserRouteParams>(params: T) => TypedRoute<T>;
  
  /**
   * Create typed route for admin management
   */
  admin: <T extends AdminRouteParams>(params: T) => TypedRoute<T>;
  
  /**
   * Create typed route for role management
   */
  role: <T extends RoleRouteParams>(params: T) => TypedRoute<T>;
  
  /**
   * Build arbitrary route with parameters
   */
  build: <T extends Record<string, string | string[]>>(
    template: string,
    params: T,
    searchParams?: Record<string, string | string[] | undefined>
  ) => string;
}

// ============================================================================
// Server Component Types
// ============================================================================

/**
 * Server component page props with RSC support
 */
export interface ServerPageProps<
  TParams extends Record<string, string | string[]> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {}
> extends PageProps<TParams, TSearchParams> {
  /**
   * Server-side data fetching result
   */
  data?: any;
  
  /**
   * Error state from server-side data fetching
   */
  error?: Error;
}

/**
 * Server component metadata for SEO and performance
 */
export interface ServerComponentMetadata {
  /**
   * Page title
   */
  title: string;
  
  /**
   * Page description
   */
  description: string;
  
  /**
   * Open Graph metadata
   */
  openGraph?: {
    title: string;
    description: string;
    images?: string[];
  };
  
  /**
   * Twitter card metadata
   */
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    images?: string[];
  };
  
  /**
   * Canonical URL
   */
  canonical?: string;
  
  /**
   * Robots directive
   */
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
  };
}

// ============================================================================
// Export Types for Enhanced Development Experience
// ============================================================================

/**
 * Common page component type for Next.js App Router
 */
export type NextPage<
  TParams extends Record<string, string | string[]> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {}
> = React.FC<PageProps<TParams, TSearchParams>>;

/**
 * Server page component type with RSC support
 */
export type NextServerPage<
  TParams extends Record<string, string | string[]> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {}
> = React.FC<ServerPageProps<TParams, TSearchParams>>;

/**
 * Layout component type
 */
export type NextLayout = React.FC<LayoutProps>;

/**
 * Complete route type definitions for the application
 */
export interface RouteDefinitions {
  /**
   * Application routes enum
   */
  routes: typeof AppRoutes;
  
  /**
   * Route actions enum
   */
  actions: typeof RouteActions;
  
  /**
   * Page component types
   */
  components: {
    Page: typeof NextPage;
    ServerPage: typeof NextServerPage;
    Layout: typeof NextLayout;
  };
  
  /**
   * Route parameter types
   */
  params: {
    Service: ServiceRouteParams;
    Schema: SchemaRouteParams;
    User: UserRouteParams;
    Admin: AdminRouteParams;
    Role: RoleRouteParams;
    Limit: LimitRouteParams;
    EmailTemplate: EmailTemplateRouteParams;
    Script: ScriptRouteParams;
    Scheduler: SchedulerRouteParams;
    File: FileRouteParams;
  };
  
  /**
   * Search parameter types
   */
  searchParams: {
    List: ListSearchParams;
    ServiceList: ServiceListSearchParams;
    Schema: SchemaSearchParams;
    UserList: UserListSearchParams;
    ApiDocs: ApiDocsSearchParams;
    Debug: DebugSearchParams;
  };
}

/**
 * Re-export route constants for convenience
 */
export { AppRoutes as Routes, RouteActions as Actions };

/**
 * Type-safe route configuration
 */
export const routeConfig: ApplicationRoutes = {
  routes: {
    '/': {
      path: AppRoutes.HOME,
      protection: { requireAuth: true },
      metadata: { title: 'Dashboard', description: 'DreamFactory Admin Dashboard' },
      performance: { static: false, runtime: 'nodejs' }
    },
    '/api-connections': {
      path: AppRoutes.API_CONNECTIONS,
      protection: { requireAuth: true },
      metadata: { title: 'API Connections', description: 'Manage API service connections' }
    },
    '/api-security': {
      path: AppRoutes.API_SECURITY,
      protection: { requireAuth: true },
      metadata: { title: 'API Security', description: 'Configure API security settings' }
    },
    '/system-settings': {
      path: AppRoutes.SYSTEM_SETTINGS,
      protection: { requireAuth: true, adminOnly: true },
      metadata: { title: 'System Settings', description: 'System configuration and settings' }
    },
    '/admin-settings': {
      path: AppRoutes.ADMIN_SETTINGS,
      protection: { requireAuth: true, adminOnly: true },
      metadata: { title: 'Admin Settings', description: 'Administrative settings and management' }
    },
    '/login': {
      path: AppRoutes.LOGIN,
      protection: { requireAuth: false },
      metadata: { title: 'Login', description: 'DreamFactory Admin Login' },
      performance: { static: true, revalidate: false }
    },
    '/profile': {
      path: AppRoutes.PROFILE,
      protection: { requireAuth: true },
      metadata: { title: 'Profile', description: 'User profile settings' }
    }
  },
  middleware: {
    protectedRoutes: [
      '/',
      '/api-connections',
      '/api-security',
      '/system-settings',
      '/admin-settings',
      '/profile'
    ],
    publicRoutes: [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/saml-callback',
      '/error',
      '/license-expired'
    ],
    loginPath: '/login',
    defaultRedirect: '/',
    sessionCookieName: 'session_token',
    validateTokenEndpoint: '/api/v2/user/session'
  },
  errorPages: {
    notFound: '/not-found',
    serverError: '/error',
    unauthorized: '/login',
    forbidden: '/error'
  }
};