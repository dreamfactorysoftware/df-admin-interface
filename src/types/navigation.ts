/**
 * Navigation types for the DreamFactory Admin Interface
 * Defines the structure for hierarchical navigation menus with permission-based filtering
 */

import type { ComponentType } from 'react';

/**
 * Navigation item interface supporting hierarchical menu structures
 * Used for building permission-based navigation menus with active state detection
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  
  /** Display label for the navigation item */
  label: string;
  
  /** Optional URL path for navigation (required for leaf nodes) */
  href?: string;
  
  /** Heroicon component for the navigation item */
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Optional description for tooltips and accessibility */
  description?: string;
  
  /** Required permissions to view this navigation item */
  permissions: string[];
  
  /** Child navigation items for hierarchical menus */
  children?: NavigationItem[];
  
  /** Whether the item is currently active (computed) */
  isActive?: boolean;
  
  /** Whether any child items are active (computed) */
  hasActiveChild?: boolean;
  
  /** Optional badge text (e.g., "New", "Beta") */
  badge?: string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** External link indicator */
  external?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Navigation breadcrumb item for page hierarchy display
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  
  /** Optional URL path for navigation */
  href?: string;
  
  /** Optional icon component */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Whether this is the current page */
  current?: boolean;
}

/**
 * Navigation state for the sidebar component
 */
export interface NavigationState {
  /** Currently selected navigation item ID */
  activeItemId?: string;
  
  /** List of expanded parent navigation items */
  expandedItems: string[];
  
  /** Search query for filtering navigation items */
  searchQuery?: string;
  
  /** Filtered navigation items based on search and permissions */
  filteredItems: NavigationItem[];
}

/**
 * Navigation configuration for different user roles
 */
export interface NavigationConfig {
  /** Navigation items for administrators */
  admin: NavigationItem[];
  
  /** Navigation items for regular users */
  user: NavigationItem[];
  
  /** Navigation items for read-only users */
  readonly: NavigationItem[];
  
  /** Public navigation items (no authentication required) */
  public: NavigationItem[];
}

/**
 * Navigation permissions mapping
 */
export interface NavigationPermissions {
  /** Permission to view API connections */
  'api-connections.read': boolean;
  
  /** Permission to manage database services */
  'database-services.read': boolean;
  
  /** Permission to view API security settings */
  'api-security.read': boolean;
  
  /** Permission to manage roles */
  'roles.read': boolean;
  
  /** Permission to manage API limits */
  'limits.read': boolean;
  
  /** Permission to view admin settings */
  'admin.read': boolean;
  
  /** Permission to manage administrators */
  'admins.read': boolean;
  
  /** Permission to manage users */
  'users.read': boolean;
  
  /** Permission to view system settings */
  'system.read': boolean;
  
  /** Permission to manage system configuration */
  'config.read': boolean;
  
  /** Permission to manage email templates */
  'email-templates.read': boolean;
  
  /** Permission to manage CORS settings */
  'cors.read': boolean;
  
  /** Permission to manage cache settings */
  'cache.read': boolean;
  
  /** Permission to manage scheduler */
  'scheduler.read': boolean;
  
  /** Permission to view reports */
  'reports.read': boolean;
  
  /** Permission to manage lookup keys */
  'lookup-keys.read': boolean;
  
  /** Permission to access file management */
  'files.read': boolean;
  
  /** Permission to view API documentation */
  'api-docs.read': boolean;
  
  /** Permission to view system logs */
  'logs.read': boolean;
}

/**
 * Navigation hook return type
 */
export interface UseNavigationReturn {
  /** All available navigation items */
  navigationItems: NavigationItem[];
  
  /** Filtered navigation items based on user permissions */
  filteredNavigationItems: NavigationItem[];
  
  /** Currently active navigation item */
  activeItem?: NavigationItem;
  
  /** Current breadcrumb trail */
  breadcrumbs: BreadcrumbItem[];
  
  /** Whether navigation is loading */
  isLoading: boolean;
  
  /** Navigation error state */
  error?: Error;
  
  /** Function to check if user has permission for navigation item */
  hasPermissionForItem: (item: NavigationItem) => boolean;
  
  /** Function to get navigation item by path */
  getItemByPath: (path: string) => NavigationItem | undefined;
  
  /** Function to get parent navigation item */
  getParentItem: (itemId: string) => NavigationItem | undefined;
  
  /** Function to expand/collapse navigation group */
  toggleItemExpansion: (itemId: string) => void;
  
  /** Function to search navigation items */
  searchItems: (query: string) => NavigationItem[];
}

/**
 * Navigation context type for provider pattern
 */
export interface NavigationContextType extends UseNavigationReturn {
  /** Navigation state */
  state: NavigationState;
  
  /** Update navigation state */
  updateState: (updates: Partial<NavigationState>) => void;
  
  /** Reset navigation state */
  resetState: () => void;
}

/**
 * Route metadata interface for dynamic navigation generation
 */
export interface RouteMetadata {
  /** Route path pattern */
  path: string;
  
  /** Page title for breadcrumbs */
  title: string;
  
  /** Optional parent route path */
  parent?: string;
  
  /** Required permissions to access route */
  permissions: string[];
  
  /** Whether route should appear in navigation */
  showInNavigation: boolean;
  
  /** Navigation item configuration */
  navigationItem?: Omit<NavigationItem, 'href'>;
}

/**
 * Mobile navigation state
 */
export interface MobileNavigationState {
  /** Whether mobile menu is open */
  isOpen: boolean;
  
  /** Current navigation level (for drill-down navigation) */
  currentLevel: number;
  
  /** Navigation history for back button */
  navigationHistory: string[];
  
  /** Currently viewed parent item in mobile drill-down */
  currentParent?: NavigationItem;
}

/**
 * Navigation analytics interface for tracking user behavior
 */
export interface NavigationAnalytics {
  /** Track navigation item click */
  trackItemClick: (itemId: string, path?: string) => void;
  
  /** Track search query */
  trackSearch: (query: string, resultCount: number) => void;
  
  /** Track sidebar toggle */
  trackSidebarToggle: (isCollapsed: boolean) => void;
  
  /** Track mobile menu usage */
  trackMobileMenuToggle: (isOpen: boolean) => void;
}

export default NavigationItem;