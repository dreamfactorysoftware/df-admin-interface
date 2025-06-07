/**
 * Navigation Component Type Definitions for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive TypeScript interfaces for navigation components supporting React 19,
 * Next.js 15.1 App Router, Zustand state management, and WCAG 2.1 accessibility compliance.
 * 
 * Key Features:
 * - Type-safe navigation item structure with metadata support
 * - Integration with Next.js router and dynamic routing patterns
 * - Zustand store integration for navigation state management
 * - RBAC-enabled navigation with user permission validation
 * - Internationalization support for multi-language navigation labels
 * - Accessibility props for WCAG 2.1 AA compliance
 * - Responsive navigation states for mobile and desktop experiences
 * - Theme-aware navigation with dark/light mode support
 * 
 * @fileoverview Navigation type definitions with React 19 and Next.js integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { UserProfile, AdminProfile, RoleType, SystemPermission } from '@/types/user';
import { ApiResponse } from '@/types/api';

// ============================================================================
// NAVIGATION ITEM TYPES
// ============================================================================

/**
 * Core navigation item structure supporting hierarchical menu systems
 * Enhanced for React 19 component integration and Next.js App Router
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display label supporting i18n key references */
  label: string;
  /** Next.js route path or external URL */
  href?: string;
  /** Icon component or icon name for display */
  icon?: ReactNode | string;
  /** Badge/notification content for the item */
  badge?: string | number;
  /** Badge variant for styling */
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Whether the item is currently active/selected */
  active?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is visible to the current user */
  visible?: boolean;
  /** Tooltip text for additional context */
  tooltip?: string;
  /** Child navigation items for nested menus */
  children?: NavigationItem[];
  /** Sort order for positioning */
  order?: number;
  /** Custom CSS classes for styling */
  className?: string;
  /** Accessibility metadata */
  accessibility?: NavigationAccessibility;
  /** Permission requirements */
  permissions?: NavigationPermissions;
  /** Internationalization metadata */
  i18n?: NavigationI18n;
  /** Custom metadata for extensibility */
  metadata?: Record<string, any>;
}

/**
 * Navigation accessibility props for WCAG 2.1 AA compliance
 */
export interface NavigationAccessibility {
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Accessible description for complex items */
  ariaDescription?: string;
  /** ARIA role override */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Skip link target */
  skipTarget?: boolean;
  /** Landmark role for navigation sections */
  landmark?: 'navigation' | 'banner' | 'main' | 'complementary' | 'contentinfo';
  /** Keyboard shortcut */
  keyboardShortcut?: string;
  /** Whether the item is expanded (for collapsible items) */
  ariaExpanded?: boolean;
  /** Controls relationship for ARIA */
  ariaControls?: string;
  /** Live region announcements */
  ariaLive?: 'off' | 'polite' | 'assertive';
}

/**
 * Navigation permission requirements for RBAC integration
 */
export interface NavigationPermissions {
  /** Required user permissions to view/access the item */
  requiredPermissions?: string[];
  /** Required user roles to view/access the item */
  requiredRoles?: string[];
  /** System permissions for admin-level access */
  systemPermissions?: SystemPermission[];
  /** Whether admin access is required */
  adminOnly?: boolean;
  /** Whether to hide or disable when unauthorized */
  unauthorizedBehavior?: 'hide' | 'disable' | 'show';
  /** Custom permission validator function */
  customValidator?: (user: UserProfile | AdminProfile | null) => boolean;
}

/**
 * Navigation internationalization metadata
 */
export interface NavigationI18n {
  /** Translation key for the label */
  labelKey?: string;
  /** Translation key for the tooltip */
  tooltipKey?: string;
  /** Translation namespace */
  namespace?: string;
  /** Default fallback values */
  fallback?: {
    label?: string;
    tooltip?: string;
  };
  /** Interpolation values for dynamic translations */
  interpolation?: Record<string, string | number>;
}

/**
 * Navigation item with computed state for rendering
 */
export interface ComputedNavigationItem extends NavigationItem {
  /** Computed visibility based on permissions and state */
  isVisible: boolean;
  /** Computed accessibility state */
  isAccessible: boolean;
  /** Computed active state including child matching */
  isActive: boolean;
  /** Resolved display label with i18n */
  displayLabel: string;
  /** Resolved tooltip with i18n */
  displayTooltip?: string;
  /** Nesting level for styling */
  level: number;
  /** Parent item reference */
  parent?: ComputedNavigationItem;
  /** Flattened path for breadcrumbs */
  path: ComputedNavigationItem[];
}

// ============================================================================
// BREADCRUMB TYPES
// ============================================================================

/**
 * Breadcrumb item for navigation trail display
 */
export interface BreadcrumbItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path for navigation */
  href?: string;
  /** Whether this is the current/active item */
  isCurrent?: boolean;
  /** Icon for the breadcrumb item */
  icon?: ReactNode | string;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** Accessibility props */
  accessibility?: Pick<NavigationAccessibility, 'ariaLabel' | 'ariaDescription'>;
}

/**
 * Breadcrumb trail configuration
 */
export interface BreadcrumbTrail {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator between items */
  separator?: ReactNode | string;
  /** Maximum number of items to display */
  maxItems?: number;
  /** Whether to show home/root link */
  showHome?: boolean;
  /** Home item configuration */
  homeItem?: Omit<BreadcrumbItem, 'isCurrent'>;
  /** Overflow behavior for long trails */
  overflowBehavior?: 'truncate' | 'collapse' | 'scroll';
}

/**
 * Route-based breadcrumb generation configuration
 */
export interface RouteBreadcrumbConfig {
  /** Route path pattern */
  path: string;
  /** Label generation strategy */
  labelStrategy: 'static' | 'dynamic' | 'api' | 'metadata';
  /** Static label (when strategy is 'static') */
  staticLabel?: string;
  /** Dynamic label resolver (when strategy is 'dynamic') */
  dynamicLabel?: (params: Record<string, string>) => string | Promise<string>;
  /** API endpoint for label fetching (when strategy is 'api') */
  apiEndpoint?: string;
  /** Metadata key for label (when strategy is 'metadata') */
  metadataKey?: string;
  /** Icon for this route level */
  icon?: ReactNode | string;
  /** Whether to exclude from breadcrumbs */
  exclude?: boolean;
  /** Custom href override */
  href?: string | ((params: Record<string, string>) => string);
}

// ============================================================================
// NAVIGATION STATE TYPES
// ============================================================================

/**
 * Global navigation state for Zustand store integration
 */
export interface NavigationState {
  /** Current route information */
  currentRoute: CurrentRoute;
  /** Sidebar/drawer state */
  sidebar: SidebarState;
  /** Mobile navigation state */
  mobile: MobileNavigationState;
  /** Breadcrumb state */
  breadcrumbs: BreadcrumbState;
  /** Search state */
  search: NavigationSearchState;
  /** Theme preferences */
  theme: ThemeState;
  /** Loading states */
  loading: NavigationLoadingState;
  /** User preferences */
  preferences: NavigationPreferences;
}

/**
 * Current route information
 */
export interface CurrentRoute {
  /** Current pathname */
  pathname: string;
  /** Route parameters */
  params: Record<string, string>;
  /** Search parameters */
  searchParams: Record<string, string>;
  /** Route metadata */
  metadata?: Record<string, any>;
  /** Matched navigation item */
  navigationItem?: ComputedNavigationItem;
  /** Route title */
  title?: string;
  /** Route description */
  description?: string;
}

/**
 * Sidebar/drawer state configuration
 */
export interface SidebarState {
  /** Whether sidebar is open/expanded */
  isOpen: boolean;
  /** Whether sidebar is collapsed (mini mode) */
  isCollapsed: boolean;
  /** Whether sidebar is pinned (won't auto-close) */
  isPinned: boolean;
  /** Sidebar width in pixels */
  width: number;
  /** Collapsed width in pixels */
  collapsedWidth: number;
  /** Selected navigation item ID */
  selectedItemId?: string;
  /** Expanded item IDs for tree navigation */
  expandedItems: Set<string>;
  /** Hover state for collapsed sidebar */
  isHovering: boolean;
  /** Resize state */
  isResizing: boolean;
}

/**
 * Mobile navigation state
 */
export interface MobileNavigationState {
  /** Whether mobile menu is open */
  isOpen: boolean;
  /** Whether mobile menu is animating */
  isAnimating: boolean;
  /** Current mobile navigation mode */
  mode: 'slide' | 'push' | 'overlay';
  /** Whether to show overlay backdrop */
  showOverlay: boolean;
  /** Gesture state for swipe navigation */
  gesture: MobileGestureState;
  /** Bottom tab navigation state */
  bottomTabs: BottomTabState;
}

/**
 * Mobile gesture state for touch navigation
 */
export interface MobileGestureState {
  /** Whether gesture is active */
  isActive: boolean;
  /** Gesture direction */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Gesture progress (0-1) */
  progress: number;
  /** Start coordinates */
  startCoordinates?: { x: number; y: number };
  /** Current coordinates */
  currentCoordinates?: { x: number; y: number };
}

/**
 * Bottom tab navigation state for mobile
 */
export interface BottomTabState {
  /** Whether bottom tabs are visible */
  isVisible: boolean;
  /** Selected tab ID */
  selectedTabId?: string;
  /** Tab items */
  tabs: NavigationItem[];
  /** Badge counts for tabs */
  badgeCounts: Record<string, number>;
}

/**
 * Breadcrumb state management
 */
export interface BreadcrumbState {
  /** Current breadcrumb trail */
  trail: BreadcrumbTrail;
  /** Whether breadcrumbs are loading */
  isLoading: boolean;
  /** Cache for dynamic breadcrumb labels */
  labelCache: Map<string, string>;
  /** Configuration for route-based breadcrumbs */
  routeConfigs: RouteBreadcrumbConfig[];
}

/**
 * Navigation search state
 */
export interface NavigationSearchState {
  /** Whether search is active/open */
  isActive: boolean;
  /** Current search query */
  query: string;
  /** Search results */
  results: NavigationSearchResult[];
  /** Whether search is loading */
  isLoading: boolean;
  /** Recent searches */
  recentSearches: string[];
  /** Search suggestions */
  suggestions: string[];
  /** Highlighted result index */
  highlightedIndex: number;
}

/**
 * Navigation search result item
 */
export interface NavigationSearchResult {
  /** Result ID */
  id: string;
  /** Result title */
  title: string;
  /** Result description */
  description?: string;
  /** Result type */
  type: 'page' | 'action' | 'setting' | 'help';
  /** Navigation path */
  href: string;
  /** Match relevance score */
  score: number;
  /** Highlighted text segments */
  highlights?: { start: number; end: number }[];
  /** Icon for the result */
  icon?: ReactNode | string;
  /** Category for grouping */
  category?: string;
}

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * Theme state for navigation components
 */
export interface ThemeState {
  /** Current theme mode */
  mode: ThemeMode;
  /** System theme preference */
  systemTheme: 'light' | 'dark';
  /** Custom theme colors */
  colors?: ThemeColors;
  /** Whether high contrast is enabled */
  highContrast: boolean;
  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
  /** Font size preference */
  fontSize: 'small' | 'medium' | 'large';
  /** Navigation-specific theme settings */
  navigation: NavigationTheme;
}

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

/**
 * Theme color configuration
 */
export interface ThemeColors {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  /** Border colors */
  border: {
    default: string;
    muted: string;
    strong: string;
  };
  /** Status colors */
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

/**
 * Navigation-specific theme configuration
 */
export interface NavigationTheme {
  /** Navigation background opacity */
  backgroundOpacity: number;
  /** Whether to use blur effects */
  useBlur: boolean;
  /** Border radius preference */
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  /** Shadow intensity */
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'strong';
  /** Animation preferences */
  animations: {
    /** Whether to enable navigation animations */
    enabled: boolean;
    /** Animation duration in milliseconds */
    duration: number;
    /** Animation easing function */
    easing: string;
  };
}

// ============================================================================
// NAVIGATION LOADING STATES
// ============================================================================

/**
 * Loading states for navigation components
 */
export interface NavigationLoadingState {
  /** Whether navigation data is loading */
  isLoading: boolean;
  /** Whether navigation is initializing */
  isInitializing: boolean;
  /** Whether permissions are loading */
  isLoadingPermissions: boolean;
  /** Whether user data is loading */
  isLoadingUser: boolean;
  /** Loading states for specific sections */
  sections: Record<string, boolean>;
  /** Error states */
  errors: Record<string, string>;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * User navigation preferences
 */
export interface NavigationPreferences {
  /** Preferred navigation layout */
  layout: 'sidebar' | 'topbar' | 'hybrid';
  /** Whether to auto-collapse sidebar */
  autoCollapse: boolean;
  /** Whether to show navigation icons */
  showIcons: boolean;
  /** Whether to show navigation badges */
  showBadges: boolean;
  /** Whether to group navigation items */
  groupItems: boolean;
  /** Default expanded groups */
  defaultExpandedGroups: string[];
  /** Pinned navigation items */
  pinnedItems: string[];
  /** Hidden navigation items */
  hiddenItems: string[];
  /** Custom item order */
  customOrder: Record<string, number>;
  /** Search preferences */
  search: {
    /** Whether to enable search */
    enabled: boolean;
    /** Whether to show recent searches */
    showRecent: boolean;
    /** Maximum recent searches to keep */
    maxRecent: number;
    /** Whether to include help content in search */
    includeHelp: boolean;
  };
}

// ============================================================================
// NAVIGATION ACTIONS AND EVENTS
// ============================================================================

/**
 * Navigation action types for state management
 */
export type NavigationAction = 
  | 'navigate'
  | 'toggle_sidebar'
  | 'collapse_sidebar'
  | 'expand_sidebar'
  | 'pin_sidebar'
  | 'unpin_sidebar'
  | 'toggle_mobile_menu'
  | 'set_theme'
  | 'toggle_search'
  | 'update_preferences'
  | 'reset_navigation';

/**
 * Navigation event handlers
 */
export interface NavigationEventHandlers {
  /** Navigation item click handler */
  onNavigate?: (item: NavigationItem, event: MouseEvent) => void;
  /** Navigation item key handler */
  onKeyDown?: (item: NavigationItem, event: KeyboardEvent) => void;
  /** Sidebar state change handler */
  onSidebarChange?: (state: Partial<SidebarState>) => void;
  /** Mobile menu state change handler */
  onMobileMenuChange?: (isOpen: boolean) => void;
  /** Theme change handler */
  onThemeChange?: (theme: ThemeMode) => void;
  /** Search state change handler */
  onSearchChange?: (state: Partial<NavigationSearchState>) => void;
  /** Breadcrumb navigation handler */
  onBreadcrumbNavigate?: (item: BreadcrumbItem, event: MouseEvent) => void;
  /** Preference change handler */
  onPreferenceChange?: (preferences: Partial<NavigationPreferences>) => void;
}

/**
 * Navigation event data
 */
export interface NavigationEvent {
  /** Event type */
  type: NavigationAction;
  /** Event timestamp */
  timestamp: number;
  /** Event payload */
  payload?: any;
  /** User context */
  user?: UserProfile | AdminProfile;
  /** Route context */
  route?: string;
  /** Source component */
  source?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Base navigation component props
 */
export interface BaseNavigationProps {
  /** CSS class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Child components */
  children?: ReactNode;
  /** Test ID for automated testing */
  testId?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
}

/**
 * Main navigation component props
 */
export interface MainNavigationProps extends BaseNavigationProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Current user for permission evaluation */
  user?: UserProfile | AdminProfile;
  /** Event handlers */
  handlers?: NavigationEventHandlers;
  /** Navigation state */
  state?: Partial<NavigationState>;
  /** Theme configuration */
  theme?: Partial<ThemeState>;
  /** Accessibility configuration */
  accessibility?: {
    /** Skip link text */
    skipLinkText?: string;
    /** Landmark label */
    landmarkLabel?: string;
    /** Keyboard navigation enabled */
    keyboardNavigation?: boolean;
  };
}

/**
 * Sidebar navigation component props
 */
export interface SidebarNavigationProps extends MainNavigationProps {
  /** Sidebar configuration */
  sidebar: SidebarState;
  /** Whether sidebar can be resized */
  resizable?: boolean;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Resize handle position */
  resizeHandle?: 'left' | 'right';
}

/**
 * Mobile navigation component props
 */
export interface MobileNavigationProps extends MainNavigationProps {
  /** Mobile navigation state */
  mobile: MobileNavigationState;
  /** Gesture configuration */
  gestures?: {
    /** Whether swipe gestures are enabled */
    enabled: boolean;
    /** Swipe threshold in pixels */
    threshold: number;
    /** Swipe velocity threshold */
    velocityThreshold: number;
  };
  /** Bottom tabs configuration */
  bottomTabs?: BottomTabState;
}

/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps extends BaseNavigationProps {
  /** Breadcrumb trail */
  trail: BreadcrumbTrail;
  /** Event handlers */
  onNavigate?: (item: BreadcrumbItem, event: MouseEvent) => void;
  /** Whether to use structured data markup */
  structuredData?: boolean;
  /** Custom separator component */
  separator?: ReactNode;
  /** Maximum items to display before truncation */
  maxItems?: number;
}

/**
 * Navigation search component props
 */
export interface NavigationSearchProps extends BaseNavigationProps {
  /** Search state */
  search: NavigationSearchState;
  /** Search configuration */
  config?: {
    /** Placeholder text */
    placeholder?: string;
    /** Search debounce delay in milliseconds */
    debounceDelay?: number;
    /** Minimum query length */
    minQueryLength?: number;
    /** Maximum results to display */
    maxResults?: number;
    /** Search categories to include */
    categories?: string[];
  };
  /** Event handlers */
  onSearch?: (query: string) => void;
  onSelect?: (result: NavigationSearchResult) => void;
  onClear?: () => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Navigation item visitor function for tree traversal
 */
export type NavigationItemVisitor = (
  item: NavigationItem, 
  level: number, 
  parent?: NavigationItem
) => boolean | void;

/**
 * Navigation permission evaluator function
 */
export type PermissionEvaluator = (
  item: NavigationItem,
  user: UserProfile | AdminProfile | null
) => boolean;

/**
 * Theme resolver function
 */
export type ThemeResolver = (
  theme: ThemeState,
  context: 'sidebar' | 'mobile' | 'breadcrumb' | 'search'
) => Partial<ThemeColors>;

/**
 * Route matcher function for navigation highlighting
 */
export type RouteMatcher = (
  itemHref: string,
  currentPath: string,
  exact?: boolean
) => boolean;

// ============================================================================
// API INTEGRATION TYPES
// ============================================================================

/**
 * Navigation data API response
 */
export interface NavigationApiResponse extends ApiResponse<NavigationItem[]> {
  /** User-specific permissions for filtering */
  permissions?: string[];
  /** Navigation metadata */
  metadata?: {
    /** Last updated timestamp */
    lastUpdated: string;
    /** Version hash for cache busting */
    version: string;
    /** User-specific customizations */
    customizations?: Record<string, any>;
  };
}

/**
 * Navigation preference update request
 */
export interface NavigationPreferenceUpdateRequest {
  /** User ID */
  userId: number;
  /** Preferences to update */
  preferences: Partial<NavigationPreferences>;
  /** Update timestamp */
  timestamp?: string;
}

/**
 * Navigation analytics event
 */
export interface NavigationAnalyticsEvent {
  /** Event type */
  event: 'navigate' | 'search' | 'toggle' | 'customize';
  /** Item or query involved */
  target: string;
  /** User context */
  userId?: number;
  /** Session context */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Event timestamp */
  timestamp: number;
}

// ============================================================================
// HOOKS AND STORE TYPES
// ============================================================================

/**
 * Navigation store actions for Zustand integration
 */
export interface NavigationStoreActions {
  // State updates
  setCurrentRoute: (route: Partial<CurrentRoute>) => void;
  updateSidebar: (state: Partial<SidebarState>) => void;
  updateMobile: (state: Partial<MobileNavigationState>) => void;
  updateBreadcrumbs: (state: Partial<BreadcrumbState>) => void;
  updateSearch: (state: Partial<NavigationSearchState>) => void;
  setTheme: (theme: Partial<ThemeState>) => void;
  updatePreferences: (preferences: Partial<NavigationPreferences>) => void;
  
  // Actions
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  pinSidebar: (pinned: boolean) => void;
  toggleMobileMenu: () => void;
  setSelectedItem: (itemId: string) => void;
  expandItem: (itemId: string, expanded: boolean) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // Utilities
  resetNavigation: () => void;
  loadUserPreferences: (userId: number) => Promise<void>;
  saveUserPreferences: (userId: number) => Promise<void>;
}

/**
 * Navigation hook return type
 */
export interface UseNavigationReturn {
  /** Current navigation state */
  state: NavigationState;
  /** Navigation actions */
  actions: NavigationStoreActions;
  /** Computed navigation items with permissions applied */
  computedItems: ComputedNavigationItem[];
  /** Current user for permission evaluation */
  user: UserProfile | AdminProfile | null;
  /** Whether navigation is loading */
  isLoading: boolean;
  /** Navigation errors */
  errors: Record<string, string>;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export commonly used types for convenience
export type {
  NavigationItem,
  ComputedNavigationItem,
  BreadcrumbItem,
  BreadcrumbTrail,
  NavigationState,
  ThemeState,
  NavigationPreferences,
  NavigationEventHandlers,
  MainNavigationProps,
  SidebarNavigationProps,
  MobileNavigationProps,
  BreadcrumbProps,
};

// Export utility types
export type {
  NavigationItemVisitor,
  PermissionEvaluator,
  ThemeResolver,
  RouteMatcher,
};

// Export store and hook types
export type {
  NavigationStoreActions,
  UseNavigationReturn,
};