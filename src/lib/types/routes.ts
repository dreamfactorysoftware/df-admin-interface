/**
 * Next.js App Router Route Constants and Navigation Types
 * 
 * Provides type-safe navigation identifiers for the file-based routing system.
 * Replaces Angular Router enum with Next.js route patterns and path utilities.
 * 
 * @version 2.0.0
 * @since React/Next.js Migration
 * @compatibility Next.js 15.1+, React 19
 */

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

/**
 * Core application routes following Next.js app router file-based structure
 */
export const ROUTES = {
  // Root routes
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  
  // API Connections routes
  API_CONNECTIONS: '/api-connections',
  API_CONNECTIONS_DATABASE: '/api-connections/database',
  API_CONNECTIONS_DATABASE_CREATE: '/api-connections/database/create',
  API_CONNECTIONS_DATABASE_SERVICE: '/api-connections/database/[service]',
  
  // API Security routes  
  API_SECURITY: '/api-security',
  API_SECURITY_ROLES: '/api-security/roles',
  API_SECURITY_ROLES_CREATE: '/api-security/roles/create',
  API_SECURITY_ROLES_DETAIL: '/api-security/roles/[id]',
  API_SECURITY_LIMITS: '/api-security/limits',
  API_SECURITY_LIMITS_CREATE: '/api-security/limits/create',
  API_SECURITY_LIMITS_DETAIL: '/api-security/limits/[id]',
  
  // System Settings routes
  SYSTEM_SETTINGS: '/system-settings',
  SYSTEM_SETTINGS_CACHE: '/system-settings/cache',
  SYSTEM_SETTINGS_CORS: '/system-settings/cors',
  SYSTEM_SETTINGS_EMAIL_TEMPLATES: '/system-settings/email-templates',
  SYSTEM_SETTINGS_EMAIL_TEMPLATES_CREATE: '/system-settings/email-templates/create',
  SYSTEM_SETTINGS_EMAIL_TEMPLATES_DETAIL: '/system-settings/email-templates/[id]',
  SYSTEM_SETTINGS_LOOKUP_KEYS: '/system-settings/lookup-keys',
  SYSTEM_SETTINGS_REPORTS: '/system-settings/reports',
  SYSTEM_SETTINGS_SCHEDULER: '/system-settings/scheduler',
  SYSTEM_SETTINGS_SCHEDULER_CREATE: '/system-settings/scheduler/create',
  SYSTEM_SETTINGS_SCHEDULER_DETAIL: '/system-settings/scheduler/[id]',
  SYSTEM_SETTINGS_SYSTEM_INFO: '/system-settings/system-info',
  
  // Admin Settings routes
  ADMIN_SETTINGS: '/admin-settings',
  
  // ADF-specific routes (legacy compatibility)
  ADF_HOME: '/adf-home',
  ADF_ADMINS: '/adf-admins',
  ADF_ADMINS_CREATE: '/adf-admins/create',
  ADF_ADMINS_DETAIL: '/adf-admins/[id]',
  ADF_API_DOCS: '/adf-api-docs',
  ADF_API_DOCS_SERVICES: '/adf-api-docs/services',
  ADF_APPS: '/adf-apps',
  ADF_CONFIG: '/adf-config',
  ADF_EVENT_SCRIPTS: '/adf-event-scripts',
  ADF_EVENT_SCRIPTS_CREATE: '/adf-event-scripts/create',
  ADF_EVENT_SCRIPTS_DETAIL: '/adf-event-scripts/[name]',
  ADF_FILES: '/adf-files',
  ADF_LIMITS: '/adf-limits',
  ADF_LIMITS_CREATE: '/adf-limits/create',
  ADF_LIMITS_DETAIL: '/adf-limits/[id]',
  ADF_PROFILE: '/adf-profile',
  ADF_REPORTS: '/adf-reports',
  ADF_ROLES: '/adf-roles',
  ADF_SCHEMA: '/adf-schema',
  ADF_SCHEMA_DATABASES: '/adf-schema/databases',
  ADF_SCHEMA_TABLES: '/adf-schema/tables',
  ADF_SCHEMA_TABLES_DETAIL: '/adf-schema/tables/[tableId]',
  ADF_SCHEMA_FIELDS: '/adf-schema/fields',
  ADF_SCHEMA_FIELDS_CREATE: '/adf-schema/fields/new',
  ADF_SCHEMA_FIELDS_DETAIL: '/adf-schema/fields/[fieldId]',
  ADF_SCHEMA_RELATIONSHIPS: '/adf-schema/relationships',
  ADF_SCHEDULER: '/adf-scheduler',
  ADF_SERVICES: '/adf-services',
  ADF_SERVICES_CREATE: '/adf-services/create',
  ADF_SERVICES_DETAIL: '/adf-services/[serviceId]',
  ADF_USERS: '/adf-users',
  ADF_USERS_CREATE: '/adf-users/create',
  ADF_USERS_DETAIL: '/adf-users/[id]',
  ADF_USER_MANAGEMENT: '/adf-user-management',
  
  // Debug and development routes
  DEBUG: '/debug',
  
  // Authentication callback routes
  SAML_CALLBACK: '/saml-callback',
} as const;

// ============================================================================
// DYNAMIC ROUTE TYPES
// ============================================================================

/**
 * Type for dynamic route segments using Next.js bracket notation
 */
export type DynamicRouteSegment = `[${string}]`;

/**
 * Type for catch-all route segments using Next.js spread notation  
 */
export type CatchAllRouteSegment = `[...${string}]`;

/**
 * Type for optional catch-all route segments
 */
export type OptionalCatchAllRouteSegment = `[[...${string}]]`;

/**
 * Union type of all route constants
 */
export type RouteValue = typeof ROUTES[keyof typeof ROUTES];

/**
 * Extract dynamic parameter names from route patterns
 */
export type ExtractRouteParams<T extends string> = T extends `${string}[${infer P}]${infer Rest}`
  ? P | ExtractRouteParams<Rest>
  : never;

// ============================================================================
// ROUTE PARAMETER TYPES
// ============================================================================

/**
 * Type definitions for route parameters based on dynamic segments
 */
export interface RouteParams {
  // Service-specific parameters
  service: string;
  serviceId: string;
  
  // Generic ID parameters
  id: string;
  tableId: string;
  fieldId: string;
  
  // Event script parameters
  name: string;
}

/**
 * Service route parameters
 */
export interface ServiceRouteParams {
  service: string;
}

/**
 * Generic detail route parameters
 */
export interface DetailRouteParams {
  id: string;
}

/**
 * Table-specific route parameters
 */
export interface TableRouteParams {
  tableId: string;
}

/**
 * Field-specific route parameters
 */
export interface FieldRouteParams {
  fieldId: string;
}

/**
 * Event script route parameters
 */
export interface EventScriptRouteParams {
  name: string;
}

// ============================================================================
// ROUTE UTILITIES
// ============================================================================

/**
 * Generate a route URL with parameters
 * @param route - The route pattern
 * @param params - Parameters to substitute in the route
 * @returns The generated route URL
 */
export function generateRoute<T extends Record<string, string>>(
  route: string,
  params: T
): string {
  let result = route;
  
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`[${key}]`, encodeURIComponent(value));
  }
  
  return result;
}

/**
 * Generate a service detail route
 * @param serviceId - The service identifier
 * @returns The service detail route URL
 */
export function generateServiceRoute(serviceId: string): string {
  return generateRoute(ROUTES.API_CONNECTIONS_DATABASE_SERVICE, { service: serviceId });
}

/**
 * Generate a role detail route
 * @param roleId - The role identifier
 * @returns The role detail route URL
 */
export function generateRoleRoute(roleId: string): string {
  return generateRoute(ROUTES.API_SECURITY_ROLES_DETAIL, { id: roleId });
}

/**
 * Generate a limits detail route
 * @param limitId - The limit identifier
 * @returns The limit detail route URL
 */
export function generateLimitRoute(limitId: string): string {
  return generateRoute(ROUTES.API_SECURITY_LIMITS_DETAIL, { id: limitId });
}

/**
 * Generate a user detail route
 * @param userId - The user identifier
 * @returns The user detail route URL
 */
export function generateUserRoute(userId: string): string {
  return generateRoute(ROUTES.ADF_USERS_DETAIL, { id: userId });
}

/**
 * Generate an admin detail route
 * @param adminId - The admin identifier
 * @returns The admin detail route URL
 */
export function generateAdminRoute(adminId: string): string {
  return generateRoute(ROUTES.ADF_ADMINS_DETAIL, { id: adminId });
}

/**
 * Generate a table detail route
 * @param tableId - The table identifier
 * @returns The table detail route URL
 */
export function generateTableRoute(tableId: string): string {
  return generateRoute(ROUTES.ADF_SCHEMA_TABLES_DETAIL, { tableId });
}

/**
 * Generate a field detail route
 * @param fieldId - The field identifier
 * @returns The field detail route URL
 */
export function generateFieldRoute(fieldId: string): string {
  return generateRoute(ROUTES.ADF_SCHEMA_FIELDS_DETAIL, { fieldId });
}

/**
 * Generate an event script detail route
 * @param scriptName - The script name
 * @returns The event script detail route URL
 */
export function generateEventScriptRoute(scriptName: string): string {
  return generateRoute(ROUTES.ADF_EVENT_SCRIPTS_DETAIL, { name: scriptName });
}

/**
 * Generate a scheduler detail route
 * @param schedulerId - The scheduler identifier
 * @returns The scheduler detail route URL
 */
export function generateSchedulerRoute(schedulerId: string): string {
  return generateRoute(ROUTES.SYSTEM_SETTINGS_SCHEDULER_DETAIL, { id: schedulerId });
}

/**
 * Generate an email template detail route
 * @param templateId - The template identifier
 * @returns The email template detail route URL
 */
export function generateEmailTemplateRoute(templateId: string): string {
  return generateRoute(ROUTES.SYSTEM_SETTINGS_EMAIL_TEMPLATES_DETAIL, { id: templateId });
}

// ============================================================================
// ROUTE GUARDS AND VALIDATORS
// ============================================================================

/**
 * Check if a route requires authentication
 * @param route - The route to check
 * @returns True if the route requires authentication
 */
export function requiresAuth(route: string): boolean {
  const publicRoutes = [ROUTES.LOGIN, ROUTES.SAML_CALLBACK];
  return !publicRoutes.includes(route as RouteValue);
}

/**
 * Check if a route is an admin-only route
 * @param route - The route to check
 * @returns True if the route requires admin privileges
 */
export function requiresAdmin(route: string): boolean {
  const adminRoutes = [
    ROUTES.ADMIN_SETTINGS,
    ROUTES.ADF_ADMINS,
    ROUTES.ADF_ADMINS_CREATE,
    ROUTES.ADF_CONFIG,
    ROUTES.SYSTEM_SETTINGS,
    ROUTES.SYSTEM_SETTINGS_CACHE,
    ROUTES.SYSTEM_SETTINGS_CORS,
    ROUTES.SYSTEM_SETTINGS_LOOKUP_KEYS,
    ROUTES.SYSTEM_SETTINGS_SYSTEM_INFO,
  ];
  
  return adminRoutes.some(adminRoute => route.startsWith(adminRoute));
}

/**
 * Check if a route is a dynamic route with parameters
 * @param route - The route to check
 * @returns True if the route contains dynamic segments
 */
export function isDynamicRoute(route: string): boolean {
  return route.includes('[') && route.includes(']');
}

/**
 * Extract parameter names from a dynamic route
 * @param route - The dynamic route pattern
 * @returns Array of parameter names
 */
export function extractParamNames(route: string): string[] {
  const matches = route.match(/\[([^\]]+)\]/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigation breadcrumb configuration
 */
export interface BreadcrumbConfig {
  label: string;
  route: string;
  icon?: string;
}

/**
 * Generate breadcrumbs for a given route
 * @param route - The current route
 * @param params - Route parameters for dynamic segments
 * @returns Array of breadcrumb configurations
 */
export function generateBreadcrumbs(
  route: string,
  params?: Record<string, string>
): BreadcrumbConfig[] {
  const breadcrumbs: BreadcrumbConfig[] = [
    { label: 'Home', route: ROUTES.HOME, icon: 'home' }
  ];

  // API Connections breadcrumbs
  if (route.startsWith('/api-connections')) {
    breadcrumbs.push({
      label: 'API Connections',
      route: ROUTES.API_CONNECTIONS,
      icon: 'database'
    });

    if (route.startsWith('/api-connections/database')) {
      breadcrumbs.push({
        label: 'Database Services',
        route: ROUTES.API_CONNECTIONS_DATABASE,
        icon: 'server'
      });

      if (params?.service) {
        breadcrumbs.push({
          label: params.service,
          route: generateServiceRoute(params.service),
          icon: 'settings'
        });
      }
    }
  }

  // API Security breadcrumbs
  if (route.startsWith('/api-security')) {
    breadcrumbs.push({
      label: 'API Security',
      route: ROUTES.API_SECURITY,
      icon: 'shield'
    });

    if (route.startsWith('/api-security/roles')) {
      breadcrumbs.push({
        label: 'Roles',
        route: ROUTES.API_SECURITY_ROLES,
        icon: 'users'
      });

      if (params?.id && route.includes('[id]')) {
        breadcrumbs.push({
          label: `Role ${params.id}`,
          route: generateRoleRoute(params.id),
          icon: 'user'
        });
      }
    }

    if (route.startsWith('/api-security/limits')) {
      breadcrumbs.push({
        label: 'Limits',
        route: ROUTES.API_SECURITY_LIMITS,
        icon: 'gauge'
      });

      if (params?.id && route.includes('[id]')) {
        breadcrumbs.push({
          label: `Limit ${params.id}`,
          route: generateLimitRoute(params.id),
          icon: 'clock'
        });
      }
    }
  }

  // System Settings breadcrumbs
  if (route.startsWith('/system-settings')) {
    breadcrumbs.push({
      label: 'System Settings',
      route: ROUTES.SYSTEM_SETTINGS,
      icon: 'settings'
    });
  }

  // Admin Settings breadcrumbs
  if (route.startsWith('/admin-settings')) {
    breadcrumbs.push({
      label: 'Admin Settings',
      route: ROUTES.ADMIN_SETTINGS,
      icon: 'admin'
    });
  }

  return breadcrumbs;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ROUTES;

export type {
  RouteValue,
  RouteParams,
  ServiceRouteParams,
  DetailRouteParams,
  TableRouteParams,
  FieldRouteParams,
  EventScriptRouteParams,
  BreadcrumbConfig,
  DynamicRouteSegment,
  CatchAllRouteSegment,
  OptionalCatchAllRouteSegment,
};