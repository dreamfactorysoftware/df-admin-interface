/**
 * Navigation structure types for Next.js App Router integration
 * 
 * Defines menu hierarchies and routing patterns for React components,
 * supporting file-based routing, dynamic routes, and permission-based filtering.
 * 
 * Replaces Angular router-specific navigation patterns with Next.js
 * App Router conventions while maintaining functional parity.
 */

import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Base navigation item interface for Next.js App Router
 * Supports both static and dynamic routes with parameter patterns
 */
export interface NavItem {
  /** Unique identifier for the navigation item */
  id: string;
  
  /** Display label for the navigation item - supports i18n keys */
  label: string;
  
  /** Next.js App Router path - supports dynamic routes with [param] syntax */
  href?: string;
  
  /** Lucide React icon component for consistent iconography */
  icon?: LucideIcon;
  
  /** Alt text for accessibility - required when icon is present */
  iconAlt?: string;
  
  /** Child navigation items for hierarchical menus */
  children?: NavItem[];
  
  /** Required permissions to display this nav item */
  permissions?: string[];
  
  /** Whether this item should only show for admin users */
  adminOnly?: boolean;
  
  /** Whether this item is currently disabled */
  disabled?: boolean;
  
  /** Optional badge content (e.g., notification count) */
  badge?: string | number;
  
  /** Badge variant for styling */
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning';
  
  /** Whether the item should open in a new tab */
  external?: boolean;
  
  /** CSS classes for custom styling */
  className?: string;
  
  /** Whether to show this item in breadcrumbs */
  hiddenInBreadcrumbs?: boolean;
  
  /** Custom metadata for extensibility */
  meta?: Record<string, any>;
}

/**
 * Navigation group for organizing related nav items
 * Supports collapsible sections and visual separation
 */
export interface NavGroup {
  /** Unique identifier for the navigation group */
  id: string;
  
  /** Display label for the group */
  label: string;
  
  /** Navigation items within this group */
  items: NavItem[];
  
  /** Whether the group is collapsible */
  collapsible?: boolean;
  
  /** Default collapsed state for collapsible groups */
  defaultCollapsed?: boolean;
  
  /** Required permissions to display this group */
  permissions?: string[];
  
  /** Whether to show a separator after this group */
  separator?: boolean;
  
  /** Custom metadata for the group */
  meta?: Record<string, any>;
}

/**
 * Main navigation configuration interface
 * Defines the complete navigation structure for the application
 */
export interface NavigationConfig {
  /** Navigation groups organized by functional area */
  groups: NavGroup[];
  
  /** Quick access items for header/toolbar */
  quickAccess?: NavItem[];
  
  /** User menu items */
  userMenu?: NavItem[];
  
  /** Footer navigation items */
  footer?: NavItem[];
  
  /** Configuration metadata */
  meta?: {
    /** Version of the navigation schema */
    version: string;
    /** Last updated timestamp */
    lastUpdated: Date;
    /** Additional configuration options */
    [key: string]: any;
  };
}

/**
 * Navigation state for managing active routes and UI state
 */
export interface NavigationState {
  /** Currently active route path */
  activeRoute: string;
  
  /** Previous route for back navigation */
  previousRoute?: string;
  
  /** Breadcrumb trail for current route */
  breadcrumbs: BreadcrumbItem[];
  
  /** Whether mobile navigation menu is open */
  mobileMenuOpen: boolean;
  
  /** Whether sidebar is collapsed in desktop view */
  sidebarCollapsed: boolean;
  
  /** Expanded navigation groups */
  expandedGroups: string[];
  
  /** Search query for navigation filtering */
  searchQuery?: string;
  
  /** Loading state for navigation data */
  loading: boolean;
  
  /** Error state for navigation loading */
  error?: string;
}

/**
 * Breadcrumb item for navigation context
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  
  /** Navigation path - undefined for current page */
  href?: string;
  
  /** Icon for the breadcrumb item */
  icon?: LucideIcon;
  
  /** Whether this is the current page */
  current?: boolean;
  
  /** Additional metadata */
  meta?: Record<string, any>;
}

/**
 * Route parameter definition for dynamic routes
 */
export interface RouteParam {
  /** Parameter name (without brackets) */
  name: string;
  
  /** Whether the parameter is optional */
  optional?: boolean;
  
  /** Parameter validation pattern */
  pattern?: RegExp;
  
  /** Description for documentation */
  description?: string;
}

/**
 * Route definition for complex navigation scenarios
 */
export interface RouteDefinition {
  /** Route pattern with Next.js dynamic syntax */
  pattern: string;
  
  /** Human-readable route name */
  name: string;
  
  /** Route parameters */
  params?: RouteParam[];
  
  /** Whether authentication is required */
  requiresAuth?: boolean;
  
  /** Required permissions for access */
  permissions?: string[];
  
  /** Page metadata */
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Navigation action interface for interactive elements
 */
export interface NavigationAction {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon for the action */
  icon?: LucideIcon;
  
  /** Click handler function */
  onClick: () => void | Promise<void>;
  
  /** Whether the action is currently loading */
  loading?: boolean;
  
  /** Whether the action is disabled */
  disabled?: boolean;
  
  /** Action variant for styling */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Navigation hook return type for useNavigation hook
 */
export interface NavigationHookReturn {
  /** Current navigation state */
  state: NavigationState;
  
  /** Navigation configuration */
  config: NavigationConfig;
  
  /** Function to navigate to a route */
  navigateTo: (href: string, options?: { replace?: boolean; shallow?: boolean }) => void;
  
  /** Function to toggle mobile menu */
  toggleMobileMenu: () => void;
  
  /** Function to toggle sidebar collapse */
  toggleSidebar: () => void;
  
  /** Function to expand/collapse navigation group */
  toggleGroup: (groupId: string) => void;
  
  /** Function to set search query */
  setSearchQuery: (query: string) => void;
  
  /** Function to check if user has permission for nav item */
  hasPermission: (permissions?: string[]) => boolean;
  
  /** Function to get filtered navigation items based on permissions */
  getFilteredNavigation: () => NavigationConfig;
  
  /** Function to generate breadcrumbs for current route */
  generateBreadcrumbs: (pathname: string) => BreadcrumbItem[];
}

/**
 * Navigation context type for React Context
 */
export interface NavigationContextType {
  /** Navigation state and actions */
  navigation: NavigationHookReturn;
  
  /** Whether navigation is initialized */
  initialized: boolean;
  
  /** Loading state for navigation initialization */
  loading: boolean;
  
  /** Error state for navigation initialization */
  error?: string;
}

/**
 * Permission checker function type
 */
export type PermissionChecker = (permissions: string[]) => boolean;

/**
 * Navigation filter function type
 */
export type NavigationFilter = (item: NavItem, context: { 
  user: any; 
  permissions: string[]; 
  searchQuery?: string; 
}) => boolean;

/**
 * Breadcrumb generator function type
 */
export type BreadcrumbGenerator = (pathname: string, config: NavigationConfig) => BreadcrumbItem[];

/**
 * Navigation event types for analytics and tracking
 */
export type NavigationEventType = 
  | 'navigate'
  | 'search'
  | 'expand'
  | 'collapse'
  | 'toggle-sidebar'
  | 'toggle-mobile-menu';

/**
 * Navigation event data structure
 */
export interface NavigationEvent {
  /** Event type */
  type: NavigationEventType;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Route or item that triggered the event */
  target: string;
  
  /** Additional event data */
  data?: Record<string, any>;
  
  /** User context when event occurred */
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
  };
}

/**
 * Default navigation structure for DreamFactory Admin Interface
 * This represents the standard menu hierarchy for the application
 */
export const DEFAULT_NAVIGATION: NavigationConfig = {
  groups: [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/',
          permissions: ['view_dashboard']
        }
      ]
    },
    {
      id: 'api-management',
      label: 'API Management',
      items: [
        {
          id: 'api-connections',
          label: 'API Connections',
          href: '/api-connections',
          children: [
            {
              id: 'database-services',
              label: 'Database Services',
              href: '/api-connections/database',
              permissions: ['view_services']
            }
          ]
        },
        {
          id: 'api-security',
          label: 'API Security',
          href: '/api-security',
          children: [
            {
              id: 'roles',
              label: 'Roles',
              href: '/api-security/roles',
              permissions: ['manage_roles']
            },
            {
              id: 'limits',
              label: 'Limits',
              href: '/api-security/limits',
              permissions: ['manage_limits']
            }
          ]
        }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      items: [
        {
          id: 'admin-settings',
          label: 'Admin Settings',
          href: '/admin-settings',
          adminOnly: true
        },
        {
          id: 'system-settings',
          label: 'System Settings',
          href: '/system-settings',
          adminOnly: true
        }
      ]
    }
  ],
  quickAccess: [
    {
      id: 'create-service',
      label: 'Create Service',
      href: '/api-connections/database/create'
    }
  ],
  userMenu: [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/profile/settings'
    }
  ],
  meta: {
    version: '1.0.0',
    lastUpdated: new Date()
  }
};

/**
 * Route patterns for dynamic route matching
 */
export const ROUTE_PATTERNS = {
  // Dashboard routes
  HOME: '/',
  
  // API Connection routes
  API_CONNECTIONS: '/api-connections',
  DATABASE_SERVICES: '/api-connections/database',
  CREATE_SERVICE: '/api-connections/database/create',
  SERVICE_DETAIL: '/api-connections/database/[service]',
  SERVICE_SCHEMA: '/api-connections/database/[service]/schema',
  SERVICE_GENERATE: '/api-connections/database/[service]/generate',
  
  // API Security routes
  API_SECURITY: '/api-security',
  ROLES: '/api-security/roles',
  ROLE_DETAIL: '/api-security/roles/[id]',
  CREATE_ROLE: '/api-security/roles/create',
  LIMITS: '/api-security/limits',
  LIMIT_DETAIL: '/api-security/limits/[id]',
  CREATE_LIMIT: '/api-security/limits/create',
  
  // Administration routes
  ADMIN_SETTINGS: '/admin-settings',
  SYSTEM_SETTINGS: '/system-settings',
  
  // User routes
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',
  
  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout'
} as const;

/**
 * Type for route pattern values
 */
export type RoutePattern = typeof ROUTE_PATTERNS[keyof typeof ROUTE_PATTERNS];

/**
 * Function to check if a route matches a pattern
 */
export function matchesRoute(pathname: string, pattern: RoutePattern): boolean {
  // Convert Next.js pattern to regex
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // Replace [param] with regex group
    .replace(/\//g, '\\/'); // Escape forward slashes
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Function to extract parameters from a route
 */
export function extractParams(pathname: string, pattern: RoutePattern): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Get parameter names from pattern
  const paramMatches = pattern.match(/\[([^\]]+)\]/g);
  if (!paramMatches) return params;
  
  const paramNames = paramMatches.map(match => match.slice(1, -1));
  
  // Convert pattern to regex and extract values
  const regexPattern = pattern.replace(/\[([^\]]+)\]/g, '([^/]+)');
  const regex = new RegExp(regexPattern);
  const matches = pathname.match(regex);
  
  if (matches) {
    paramNames.forEach((name, index) => {
      params[name] = matches[index + 1];
    });
  }
  
  return params;
}