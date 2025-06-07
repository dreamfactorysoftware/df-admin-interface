/**
 * Navigation Structure Types for Next.js App Router Integration
 * 
 * Defines menu hierarchies and routing patterns for React components,
 * supporting file-based routing with dynamic routes and icon integration.
 * 
 * @version 2.0.0
 * @since React/Next.js Migration
 * @compatibility Next.js 15.1+, React 19, @heroicons/react 2.0+
 */

import type { 
  RouteValue, 
  RouteParams, 
  BreadcrumbConfig,
  generateRoute 
} from './routes';

// ============================================================================
// ICON TYPES FOR REACT INTEGRATION
// ============================================================================

/**
 * Heroicons icon component type for React integration
 * Replaces Angular Material icon strings with React components
 */
export type HeroIconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

/**
 * Icon specification supporting both Heroicons and custom icons
 */
export interface IconSpec {
  /** Heroicon component (outline variant preferred for navigation) */
  heroIcon?: HeroIconComponent;
  /** Custom icon component for specialized use cases */
  customIcon?: React.ComponentType<{ className?: string }>;
  /** Fallback icon name for server-side rendering */
  fallbackName?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Icon size variants for different navigation contexts
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Icon theme variants for light/dark mode support
 */
export type IconTheme = 'light' | 'dark' | 'auto';

// ============================================================================
// NAVIGATION ITEM TYPES
// ============================================================================

/**
 * Base navigation item interface supporting Next.js App Router patterns
 */
export interface BaseNavItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display text for the navigation item */
  label: string;
  /** Optional description for tooltips or accessibility */
  description?: string;
  /** Icon configuration for React components */
  icon?: IconSpec;
  /** Whether this item is currently active */
  active?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Custom CSS classes for styling */
  className?: string;
  /** Accessibility attributes */
  ariaAttributes?: Record<string, string>;
}

/**
 * Navigation link item for direct routing
 */
export interface NavLinkItem extends BaseNavItem {
  type: 'link';
  /** Next.js route path (supports dynamic routes) */
  href: RouteValue | string;
  /** External link indicator */
  external?: boolean;
  /** Open in new tab/window */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Prefetch behavior for Next.js Link component */
  prefetch?: boolean;
}

/**
 * Navigation group item for organizing related links
 */
export interface NavGroupItem extends BaseNavItem {
  type: 'group';
  /** Child navigation items */
  children: NavItem[];
  /** Whether the group is collapsible */
  collapsible?: boolean;
  /** Whether the group is initially collapsed */
  defaultCollapsed?: boolean;
  /** Maximum number of visible children before "show more" */
  maxVisible?: number;
}

/**
 * Navigation divider for visual separation
 */
export interface NavDividerItem {
  type: 'divider';
  /** Unique identifier */
  id: string;
  /** Optional label for semantic dividers */
  label?: string;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Navigation action item for interactive elements
 */
export interface NavActionItem extends BaseNavItem {
  type: 'action';
  /** Action handler function */
  onAction: () => void | Promise<void>;
  /** Loading state for async actions */
  loading?: boolean;
  /** Action variant for styling */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Union type for all navigation item types
 */
export type NavItem = NavLinkItem | NavGroupItem | NavDividerItem | NavActionItem;

// ============================================================================
// NAVIGATION MENU STRUCTURE
// ============================================================================

/**
 * Navigation menu configuration for main application navigation
 */
export interface NavigationMenu {
  /** Menu identifier */
  id: string;
  /** Menu title */
  title?: string;
  /** Menu items */
  items: NavItem[];
  /** Menu orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Menu size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Menu theme variant */
  theme?: 'light' | 'dark' | 'auto';
  /** Whether menu supports search */
  searchable?: boolean;
  /** Whether menu is collapsible */
  collapsible?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Sidebar navigation configuration
 */
export interface SidebarNavigation extends NavigationMenu {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Collapsed width in pixels */
  collapsedWidth?: number;
  /** Expanded width in pixels */
  expandedWidth?: number;
  /** Collapse/expand animation duration */
  animationDuration?: number;
  /** Whether to show tooltips when collapsed */
  showTooltipsWhenCollapsed?: boolean;
  /** Footer content configuration */
  footer?: {
    items: NavItem[];
    className?: string;
  };
}

/**
 * Top navigation bar configuration
 */
export interface TopNavigation extends NavigationMenu {
  /** Logo configuration */
  logo?: {
    src: string;
    alt: string;
    href?: string;
    width?: number;
    height?: number;
  };
  /** User menu configuration */
  userMenu?: {
    trigger: NavItem;
    items: NavItem[];
  };
  /** Search configuration */
  search?: {
    placeholder: string;
    onSearch: (query: string) => void;
    className?: string;
  };
}

/**
 * Breadcrumb navigation configuration
 */
export interface BreadcrumbNavigation {
  /** Breadcrumb items */
  items: BreadcrumbConfig[];
  /** Maximum number of visible items */
  maxItems?: number;
  /** Separator icon or text */
  separator?: IconSpec | string;
  /** Whether to show home icon */
  showHome?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Tab navigation configuration for sub-page navigation
 */
export interface TabNavigation {
  /** Tab items */
  items: NavLinkItem[];
  /** Active tab identifier */
  activeTab?: string;
  /** Tab variant */
  variant?: 'default' | 'pills' | 'underline';
  /** Tab size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether tabs are scrollable */
  scrollable?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// NAVIGATION STATE MANAGEMENT
// ============================================================================

/**
 * Navigation state for managing active states and user interactions
 */
export interface NavigationState {
  /** Currently active route */
  activeRoute: string;
  /** Navigation history for back/forward */
  history: string[];
  /** Whether navigation is loading */
  loading: boolean;
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** User permissions for route access */
  permissions: Record<string, boolean>;
  /** Navigation preferences */
  preferences: NavigationPreferences;
}

/**
 * User preferences for navigation behavior
 */
export interface NavigationPreferences {
  /** Remember sidebar collapsed state */
  rememberSidebarState: boolean;
  /** Auto-collapse sidebar on mobile */
  autoCollapseMobile: boolean;
  /** Show breadcrumbs */
  showBreadcrumbs: boolean;
  /** Animation preferences */
  enableAnimations: boolean;
  /** Keyboard navigation enabled */
  enableKeyboardNav: boolean;
}

// ============================================================================
// NAVIGATION GUARDS AND PERMISSIONS
// ============================================================================

/**
 * Navigation guard result for route protection
 */
export interface NavigationGuardResult {
  /** Whether navigation is allowed */
  allowed: boolean;
  /** Redirect route if navigation is blocked */
  redirectTo?: string;
  /** Error message for blocked navigation */
  reason?: string;
}

/**
 * Navigation guard function type
 */
export type NavigationGuard = (
  route: string,
  params?: RouteParams
) => NavigationGuardResult | Promise<NavigationGuardResult>;

/**
 * Navigation context for managing guards and permissions
 */
export interface NavigationContext {
  /** Authentication guard */
  authGuard: NavigationGuard;
  /** Role-based access control guard */
  roleGuard: NavigationGuard;
  /** Feature flag guard */
  featureGuard: NavigationGuard;
  /** Custom guards */
  customGuards: NavigationGuard[];
}

// ============================================================================
// NAVIGATION UTILITIES AND HELPERS
// ============================================================================

/**
 * Navigation item builder for creating menu items programmatically
 */
export interface NavItemBuilder {
  /** Create a link item */
  link(config: Omit<NavLinkItem, 'type'>): NavLinkItem;
  /** Create a group item */
  group(config: Omit<NavGroupItem, 'type'>): NavGroupItem;
  /** Create a divider item */
  divider(config: Omit<NavDividerItem, 'type'>): NavDividerItem;
  /** Create an action item */
  action(config: Omit<NavActionItem, 'type'>): NavActionItem;
}

/**
 * Navigation analytics tracking configuration
 */
export interface NavigationAnalytics {
  /** Track navigation events */
  trackNavigation: boolean;
  /** Track menu interactions */
  trackMenuInteractions: boolean;
  /** Custom event tracking function */
  onNavigationEvent?: (event: NavigationEvent) => void;
}

/**
 * Navigation event types for analytics
 */
export interface NavigationEvent {
  /** Event type */
  type: 'route_change' | 'menu_click' | 'sidebar_toggle' | 'search_use';
  /** Event metadata */
  metadata: {
    from?: string;
    to?: string;
    itemId?: string;
    query?: string;
    timestamp: number;
  };
}

// ============================================================================
// RESPONSIVE NAVIGATION TYPES
// ============================================================================

/**
 * Responsive navigation configuration for different screen sizes
 */
export interface ResponsiveNavigation {
  /** Desktop navigation configuration */
  desktop: {
    sidebar: SidebarNavigation;
    topNav: TopNavigation;
  };
  /** Tablet navigation configuration */
  tablet: {
    sidebar?: SidebarNavigation;
    topNav: TopNavigation;
    bottomNav?: NavigationMenu;
  };
  /** Mobile navigation configuration */
  mobile: {
    topNav: TopNavigation;
    bottomNav?: NavigationMenu;
    drawerNav?: SidebarNavigation;
  };
  /** Breakpoints for responsive behavior */
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Navigation layout configuration
 */
export interface NavigationLayout {
  /** Layout type */
  type: 'sidebar' | 'top' | 'mixed' | 'drawer';
  /** Responsive configuration */
  responsive: ResponsiveNavigation;
  /** Global navigation settings */
  settings: {
    enableSearch: boolean;
    enableBreadcrumbs: boolean;
    enableUserMenu: boolean;
    enableNotifications: boolean;
    enableThemeToggle: boolean;
  };
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * Accessibility configuration for navigation components
 */
export interface NavigationAccessibility {
  /** ARIA landmark roles */
  landmarks: boolean;
  /** Skip links for keyboard navigation */
  skipLinks: boolean;
  /** Focus management */
  focusManagement: boolean;
  /** Screen reader announcements */
  announcements: boolean;
  /** High contrast mode support */
  highContrast: boolean;
  /** Reduced motion support */
  reducedMotion: boolean;
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigation {
  /** Enable arrow key navigation */
  arrowKeys: boolean;
  /** Enable tab navigation */
  tabNavigation: boolean;
  /** Enable escape key to close */
  escapeToClose: boolean;
  /** Enable enter/space activation */
  enterSpaceActivation: boolean;
  /** Custom keyboard shortcuts */
  shortcuts: KeyboardShortcut[];
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key combination */
  keys: string[];
  /** Action to perform */
  action: () => void;
  /** Description for help menu */
  description: string;
  /** Whether shortcut is global */
  global?: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Core navigation types
  BaseNavItem,
  NavLinkItem,
  NavGroupItem,
  NavDividerItem,
  NavActionItem,
  NavItem,
  
  // Menu configurations
  NavigationMenu,
  SidebarNavigation,
  TopNavigation,
  BreadcrumbNavigation,
  TabNavigation,
  
  // State management
  NavigationState,
  NavigationPreferences,
  
  // Guards and permissions
  NavigationGuardResult,
  NavigationGuard,
  NavigationContext,
  
  // Utilities
  NavItemBuilder,
  NavigationAnalytics,
  NavigationEvent,
  
  // Responsive and layout
  ResponsiveNavigation,
  NavigationLayout,
  
  // Accessibility
  NavigationAccessibility,
  KeyboardNavigation,
  KeyboardShortcut,
  
  // Icon types
  HeroIconComponent,
  IconSpec,
  IconSize,
  IconTheme,
};

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default navigation preferences
 */
export const DEFAULT_NAV_PREFERENCES: NavigationPreferences = {
  rememberSidebarState: true,
  autoCollapseMobile: true,
  showBreadcrumbs: true,
  enableAnimations: true,
  enableKeyboardNav: true,
};

/**
 * Default responsive breakpoints
 */
export const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY: NavigationAccessibility = {
  landmarks: true,
  skipLinks: true,
  focusManagement: true,
  announcements: true,
  highContrast: true,
  reducedMotion: true,
};

/**
 * Default keyboard navigation configuration
 */
export const DEFAULT_KEYBOARD_NAV: KeyboardNavigation = {
  arrowKeys: true,
  tabNavigation: true,
  escapeToClose: true,
  enterSpaceActivation: true,
  shortcuts: [],
};