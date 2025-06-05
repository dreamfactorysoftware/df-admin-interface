/**
 * @fileoverview Next.js routing types for DreamFactory Admin Interface
 * 
 * Provides comprehensive type-safe routing configuration including page parameters,
 * search parameters, route handlers, middleware patterns, and dynamic route configurations.
 * Supports Next.js App Router with React Server Components, file-based routing,
 * and enhanced performance with SEO capabilities.
 * 
 * @version 2.0.0
 * @since 2024-12-19
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { Metadata } from 'next';

// ================================================================================================
// CORE ROUTE DEFINITIONS
// ================================================================================================

/**
 * Application route paths with type safety for Next.js App Router
 * Supports file-based routing with dynamic segments and catch-all routes
 */
export type AppRoutes = 
  | '/'
  | '/login'
  | '/profile'
  | '/debug'
  | '/saml-callback'
  // API Connections routes
  | '/api-connections'
  | '/api-connections/database'
  | '/api-connections/database/create'
  | `/api-connections/database/${string}`
  | `/api-connections/database/${string}/schema`
  | `/api-connections/database/${string}/generate`
  // Admin settings routes
  | '/admin-settings'
  | '/admin-settings/users'
  | '/admin-settings/users/create'
  | `/admin-settings/users/${string}`
  | '/admin-settings/roles'
  | '/admin-settings/roles/create'
  | `/admin-settings/roles/${string}`
  // System settings routes
  | '/system-settings'
  | '/system-settings/config'
  | '/system-settings/cache'
  | '/system-settings/cors'
  | '/system-settings/email-templates'
  | '/system-settings/email-templates/create'
  | `/system-settings/email-templates/${string}`
  | '/system-settings/lookup-keys'
  | '/system-settings/scheduler'
  | '/system-settings/scheduler/create'
  | `/system-settings/scheduler/${string}`
  | '/system-settings/reports'
  | '/system-settings/system-info'
  // API Security routes
  | '/api-security'
  | '/api-security/roles'
  | '/api-security/roles/create'
  | `/api-security/roles/${string}`
  | '/api-security/limits'
  | '/api-security/limits/create'
  | `/api-security/limits/${string}`
  // Legacy ADF routes (maintaining backward compatibility)
  | '/adf-home'
  | '/adf-services'
  | '/adf-schema'
  | '/adf-users'
  | '/adf-admins'
  | '/adf-apps'
  | '/adf-config'
  | '/adf-event-scripts'
  | '/adf-files'
  | '/adf-limits'
  | '/adf-profile'
  | '/adf-reports'
  | '/adf-user-management'
  | '/adf-scheduler'
  | '/adf-api-docs';

/**
 * API route paths for Next.js API handlers
 * Supports serverless functions and route handlers
 */
export type ApiRoutes =
  | '/api/auth'
  | '/api/auth/login'
  | '/api/auth/logout'
  | '/api/auth/refresh'
  | '/api/auth/validate'
  | '/api/services'
  | `/api/services/${string}`
  | `/api/services/${string}/test`
  | `/api/services/${string}/schema`
  | `/api/services/${string}/generate`
  | '/api/users'
  | `/api/users/${string}`
  | '/api/roles'
  | `/api/roles/${string}`
  | '/api/health'
  | '/api/config'
  | '/api/preview'
  | `/api/preview/${string}`;

// ================================================================================================
// ROUTE PARAMETER TYPES
// ================================================================================================

/**
 * Dynamic route parameters for type-safe routing
 * Covers all dynamic segments in the application
 */
export interface RouteParams {
  // Database service routes
  service?: string;
  serviceId?: string;
  
  // User management routes
  id?: string;
  userId?: string;
  
  // Role management routes
  roleId?: string;
  
  // Table and field management
  tableId?: string;
  fieldId?: string;
  
  // Email template management
  templateId?: string;
  
  // Scheduler management
  schedulerId?: string;
  
  // Event script management
  scriptName?: string;
  name?: string;
  
  // Catch-all parameters
  slug?: string[];
  path?: string[];
}

/**
 * Search parameters for URL query strings
 * Supports filtering, pagination, and view state
 */
export interface SearchParams {
  // Pagination parameters
  page?: string;
  limit?: string;
  offset?: string;
  
  // Filtering parameters
  search?: string;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  
  // Database service specific
  type?: string;
  status?: string;
  
  // Schema discovery specific
  table?: string;
  view?: string;
  field?: string;
  expand?: string;
  
  // API generation specific
  step?: string;
  method?: string;
  endpoint?: string;
  
  // User interface state
  tab?: string;
  modal?: string;
  sidebar?: string;
  
  // Authentication parameters
  redirect?: string;
  token?: string;
  
  // Preview and testing
  preview?: string;
  test?: string;
  
  // Error handling
  error?: string;
  message?: string;
  
  // Feature flags and configuration
  feature?: string;
  config?: string;
  
  // Time range filters
  from?: string;
  to?: string;
  
  // Selection state
  selected?: string;
  multi?: string[];
}

// ================================================================================================
// PAGE COMPONENT TYPES
// ================================================================================================

/**
 * Props for Next.js page components with type-safe parameters
 * Supports both dynamic routes and search parameters
 */
export interface PageProps<
  TParams extends Record<string, any> = RouteParams,
  TSearchParams extends Record<string, any> = SearchParams
> {
  params: TParams;
  searchParams: TSearchParams;
}

/**
 * Props for Next.js layout components
 * Supports nested layouts and shared UI state
 */
export interface LayoutProps {
  children: React.ReactNode;
  params?: RouteParams;
}

/**
 * Props for Next.js loading components
 * Supports streaming UI and progressive loading
 */
export interface LoadingProps {
  params?: RouteParams;
}

/**
 * Props for Next.js error components
 * Supports error boundaries and recovery actions
 */
export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  params?: RouteParams;
}

/**
 * Props for Next.js not-found components
 * Supports custom 404 pages with context
 */
export interface NotFoundProps {
  params?: RouteParams;
}

// ================================================================================================
// ROUTE HANDLER TYPES
// ================================================================================================

/**
 * Request context for API route handlers
 * Includes parameters and request data
 */
export interface RouteHandlerContext<TParams extends Record<string, any> = RouteParams> {
  params: TParams;
}

/**
 * API route handler function signature
 * Supports all HTTP methods with type safety
 */
export type RouteHandler<TParams extends Record<string, any> = RouteParams> = (
  request: NextRequest,
  context: RouteHandlerContext<TParams>
) => Promise<NextResponse> | NextResponse | Promise<Response> | Response;

/**
 * API route configuration for different HTTP methods
 */
export interface RouteHandlers<TParams extends Record<string, any> = RouteParams> {
  GET?: RouteHandler<TParams>;
  POST?: RouteHandler<TParams>;
  PUT?: RouteHandler<TParams>;
  PATCH?: RouteHandler<TParams>;
  DELETE?: RouteHandler<TParams>;
  HEAD?: RouteHandler<TParams>;
  OPTIONS?: RouteHandler<TParams>;
}

// ================================================================================================
// MIDDLEWARE TYPES
// ================================================================================================

/**
 * Middleware configuration for route protection
 * Supports authentication, authorization, and request processing
 */
export interface MiddlewareConfig {
  matcher: string | string[];
  unstable_allowDynamic?: string[];
}

/**
 * Authentication middleware context
 * Provides session and user information
 */
export interface AuthMiddlewareContext {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  session?: {
    token: string;
    expires: Date;
    refreshToken?: string;
  };
}

/**
 * Middleware function signature for request processing
 * Supports authentication, logging, and request transformation
 */
export type MiddlewareFunction = (
  request: NextRequest,
  context?: AuthMiddlewareContext
) => Promise<NextResponse> | NextResponse;

// ================================================================================================
// NAVIGATION TYPES
// ================================================================================================

/**
 * Navigation state for application routing
 * Supports breadcrumbs and navigation history
 */
export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  breadcrumbs: Breadcrumb[];
  isLoading: boolean;
}

/**
 * Breadcrumb item for navigation trail
 */
export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: string;
  current?: boolean;
}

/**
 * Route metadata for enhanced navigation
 * Supports page titles, descriptions, and access control
 */
export interface RouteMetadata {
  title: string;
  description?: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: string[];
  permissions?: string[];
  category?: string;
  order?: number;
}

// ================================================================================================
// DYNAMIC ROUTE GENERATION
// ================================================================================================

/**
 * Dynamic route configuration for API endpoint management
 * Supports runtime route generation and service discovery
 */
export interface DynamicRouteConfig {
  pattern: string;
  component: string;
  loader?: string;
  params?: RouteParams;
  metadata?: RouteMetadata;
}

/**
 * Service-based route configuration
 * Generates routes based on database services
 */
export interface ServiceRouteConfig {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  routes: {
    schema: string;
    generate: string;
    docs: string;
    test: string;
  };
}

/**
 * Route generator for dynamic service endpoints
 */
export interface RouteGenerator {
  generateServiceRoutes: (serviceId: string) => ServiceRouteConfig;
  generateTableRoutes: (serviceId: string, tableName: string) => DynamicRouteConfig[];
  generateApiRoutes: (serviceId: string) => DynamicRouteConfig[];
}

// ================================================================================================
// METADATA AND SEO TYPES
// ================================================================================================

/**
 * Page metadata for SEO and social sharing
 * Supports Next.js metadata API
 */
export interface PageMetadata extends Metadata {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Metadata generator function for dynamic pages
 */
export type MetadataGenerator<TParams extends Record<string, any> = RouteParams> = (
  props: {
    params: TParams;
    searchParams: SearchParams;
  }
) => Promise<PageMetadata> | PageMetadata;

// ================================================================================================
// ROUTE VALIDATION TYPES
// ================================================================================================

/**
 * Route validation configuration
 * Supports parameter validation and access control
 */
export interface RouteValidation {
  params?: Record<string, (value: string) => boolean>;
  searchParams?: Record<string, (value: string) => boolean>;
  requiresAuth?: boolean;
  roles?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

/**
 * Route guard function for access control
 */
export type RouteGuard<TParams extends Record<string, any> = RouteParams> = (
  request: NextRequest,
  params: TParams,
  context?: AuthMiddlewareContext
) => Promise<boolean> | boolean;

// ================================================================================================
// TYPE UTILITIES
// ================================================================================================

/**
 * Extract route parameters from a route string
 */
export type ExtractRouteParams<T extends string> = 
  T extends `${infer _Start}/[${infer Param}]${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<Rest>
    : T extends `${infer _Start}/[...${infer Param}]${infer Rest}`
    ? { [K in Param]: string[] } & ExtractRouteParams<Rest>
    : {};

/**
 * Generate typed route function
 */
export type TypedRoute<T extends AppRoutes> = (
  params?: ExtractRouteParams<T>,
  searchParams?: SearchParams
) => string;

/**
 * Route builder utility type
 */
export interface RouteBuilder {
  <T extends AppRoutes>(route: T): TypedRoute<T>;
  api<T extends ApiRoutes>(route: T): TypedRoute<T>;
}

// ================================================================================================
// EXPORT UTILITIES
// ================================================================================================

/**
 * Create a typed route builder for type-safe navigation
 */
export const createRouteBuilder = (): RouteBuilder => {
  const buildRoute = <T extends string>(route: T) => {
    return (params?: any, searchParams?: SearchParams): string => {
      let path = route as string;
      
      // Replace dynamic parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          path = path.replace(`[${key}]`, String(value));
          path = path.replace(`[...${key}]`, Array.isArray(value) ? value.join('/') : String(value));
        });
      }
      
      // Add search parameters
      if (searchParams) {
        const urlSearchParams = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => urlSearchParams.append(key, String(v)));
            } else {
              urlSearchParams.set(key, String(value));
            }
          }
        });
        
        const queryString = urlSearchParams.toString();
        if (queryString) {
          path += `?${queryString}`;
        }
      }
      
      return path;
    };
  };

  const builder = buildRoute as RouteBuilder;
  builder.api = buildRoute;
  
  return builder;
};

/**
 * Default route builder instance
 */
export const route = createRouteBuilder();

/**
 * Common route configurations for the application
 */
export const ROUTE_CONFIG: Record<string, RouteMetadata> = {
  '/': {
    title: 'Dashboard',
    description: 'DreamFactory Admin Console dashboard',
    requiresAuth: true,
    category: 'main',
    order: 1,
  },
  '/api-connections/database': {
    title: 'Database Services',
    description: 'Manage database connections and API services',
    requiresAuth: true,
    category: 'services',
    order: 2,
  },
  '/api-connections/database/create': {
    title: 'Create Database Service',
    description: 'Connect to your database and generate APIs',
    requiresAuth: true,
    category: 'services',
    order: 3,
  },
  '/admin-settings': {
    title: 'Admin Settings',
    description: 'System administration and configuration',
    requiresAuth: true,
    roles: ['admin'],
    category: 'admin',
    order: 10,
  },
  '/api-security': {
    title: 'API Security',
    description: 'Manage API security and access controls',
    requiresAuth: true,
    roles: ['admin'],
    category: 'security',
    order: 11,
  },
} as const;

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES: AppRoutes[] = [
  '/',
  '/api-connections',
  '/api-connections/database',
  '/admin-settings',
  '/api-security',
  '/profile',
] as const;

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES: AppRoutes[] = [
  '/login',
  '/saml-callback',
] as const;

/**
 * Admin-only routes that require special permissions
 */
export const ADMIN_ROUTES: AppRoutes[] = [
  '/admin-settings',
  '/system-settings',
  '/api-security',
] as const;