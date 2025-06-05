/**
 * Navigation Component Types
 * 
 * Comprehensive TypeScript interfaces for navigation components including
 * navigation items, user data interfaces, breadcrumb structures, and
 * component props. Provides strict typing for React 19 patterns,
 * Next.js integration, and Zustand state management.
 */

import { ComponentType, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// =============================================================================
// CORE NAVIGATION STRUCTURES
// =============================================================================

/**
 * Base navigation item structure for sidebar, mobile menu, and breadcrumbs
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display label for the navigation item */
  label: string;
  /** URL path for navigation (Next.js router compatible) */
  href?: string;
  /** Lucide icon component for visual representation */
  icon?: LucideIcon;
  /** Optional description for accessibility and tooltips */
  description?: string;
  /** Badge content (e.g., notification count, status) */
  badge?: string | number;
  /** Badge variant for styling */
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Child navigation items for nested menus */
  children?: NavigationItem[];
  /** Whether the item is currently active/selected */
  active?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is expanded (for collapsible items) */
  expanded?: boolean;
  /** External link indicator */
  external?: boolean;
  /** Target for external links */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Required permissions to access this navigation item */
  permissions?: string[];
  /** Role-based access requirements */
  roles?: UserRole[];
  /** Feature flags that control visibility */
  features?: string[];
  /** Custom data attributes for testing and analytics */
  dataAttributes?: Record<string, string>;
  /** Sort order for navigation items */
  order?: number;
  /** Section grouping for organizing navigation */
  section?: string;
  /** Internationalization key for labels */
  i18nKey?: string;
  /** Custom CSS classes */
  className?: string;
  /** Click handler for custom actions */
  onClick?: () => void;
}

/**
 * Navigation section for grouping related items
 */
export interface NavigationSection {
  /** Unique identifier for the section */
  id: string;
  /** Section title */
  title: string;
  /** Internationalization key for section title */
  i18nKey?: string;
  /** Navigation items in this section */
  items: NavigationItem[];
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Whether the section is expanded by default */
  defaultExpanded?: boolean;
  /** Required permissions to view this section */
  permissions?: string[];
  /** Sort order for sections */
  order?: number;
  /** Icon for the section header */
  icon?: LucideIcon;
  /** Section description */
  description?: string;
}

/**
 * Complete navigation structure with sections and metadata
 */
export interface NavigationStructure {
  /** Navigation sections */
  sections: NavigationSection[];
  /** Application metadata */
  metadata: {
    /** Application name */
    appName: string;
    /** Application version */
    version: string;
    /** User information */
    user: NavigationUser;
    /** Environment information */
    environment?: string;
    /** Build information */
    buildId?: string;
  };
  /** Navigation configuration */
  config: NavigationConfig;
}

/**
 * Navigation configuration options
 */
export interface NavigationConfig {
  /** Whether navigation is collapsible */
  collapsible: boolean;
  /** Default collapsed state */
  defaultCollapsed: boolean;
  /** Whether to show icons */
  showIcons: boolean;
  /** Whether to show badges */
  showBadges: boolean;
  /** Whether to enable keyboard navigation */
  keyboardNavigation: boolean;
  /** Animation preferences */
  animations: {
    /** Enable expand/collapse animations */
    enabled: boolean;
    /** Animation duration in milliseconds */
    duration: number;
    /** Animation easing function */
    easing: string;
  };
  /** Mobile behavior configuration */
  mobile: {
    /** Breakpoint for mobile navigation */
    breakpoint: number;
    /** Whether to use drawer on mobile */
    useDrawer: boolean;
    /** Drawer placement */
    drawerPlacement: 'left' | 'right' | 'top' | 'bottom';
    /** Whether to show overlay on mobile */
    showOverlay: boolean;
  };
  /** Accessibility configuration */
  accessibility: {
    /** Whether to announce navigation changes */
    announceChanges: boolean;
    /** Skip navigation link text */
    skipNavText: string;
    /** Focus management options */
    focusManagement: boolean;
    /** High contrast mode support */
    highContrast: boolean;
  };
  /** Search configuration */
  search: {
    /** Whether search is enabled */
    enabled: boolean;
    /** Search placeholder text */
    placeholder: string;
    /** Minimum characters for search */
    minCharacters: number;
    /** Search debounce delay */
    debounceDelay: number;
    /** Whether to highlight search results */
    highlightResults: boolean;
  };
}

// =============================================================================
// USER DATA INTERFACES
// =============================================================================

/**
 * User information for navigation display and permissions
 * Aligned with DreamFactory API user schema
 */
export interface NavigationUser {
  /** User unique identifier */
  id: number;
  /** User email address */
  email: string;
  /** User display name */
  name?: string;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** User avatar URL */
  avatar?: string;
  /** User roles */
  roles: UserRole[];
  /** User permissions */
  permissions: UserPermission[];
  /** User preferences */
  preferences: UserPreferences;
  /** User status */
  status: UserStatus;
  /** Last login timestamp */
  lastLogin?: string;
  /** User creation timestamp */
  createdAt: string;
  /** User modification timestamp */
  updatedAt: string;
  /** Whether user is system administrator */
  isAdmin: boolean;
  /** Whether user is active */
  isActive: boolean;
  /** User session information */
  session?: UserSession;
  /** User's default API key */
  apiKey?: string;
  /** User timezone */
  timezone?: string;
  /** User locale */
  locale?: string;
}

/**
 * User role definition aligned with DreamFactory RBAC
 */
export interface UserRole {
  /** Role unique identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role display label */
  label?: string;
  /** Role description */
  description?: string;
  /** Role permissions */
  permissions: string[];
  /** Whether role is active */
  isActive: boolean;
  /** Whether role is system default */
  isDefault: boolean;
  /** Role creation timestamp */
  createdAt: string;
  /** Role modification timestamp */
  updatedAt: string;
  /** Role type */
  type: 'system' | 'custom';
  /** Role hierarchy level */
  level?: number;
  /** Parent role ID for inheritance */
  parentId?: number;
}

/**
 * User permission structure for granular access control
 */
export interface UserPermission {
  /** Permission unique identifier */
  id: string;
  /** Permission name */
  name: string;
  /** Permission display label */
  label?: string;
  /** Permission description */
  description?: string;
  /** Resource the permission applies to */
  resource: string;
  /** Action the permission allows */
  action: PermissionAction;
  /** Permission scope */
  scope: PermissionScope;
  /** Whether permission is granted */
  granted: boolean;
  /** Permission conditions */
  conditions?: PermissionCondition[];
  /** Permission metadata */
  metadata?: Record<string, any>;
}

/**
 * Permission actions that can be performed on resources
 */
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'list' 
  | 'execute' 
  | 'manage' 
  | 'admin';

/**
 * Permission scope levels
 */
export type PermissionScope = 
  | 'global' 
  | 'service' 
  | 'resource' 
  | 'record' 
  | 'field';

/**
 * Permission condition for conditional access
 */
export interface PermissionCondition {
  /** Condition field */
  field: string;
  /** Condition operator */
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'not_contains';
  /** Condition value */
  value: any;
  /** Condition logic operator */
  logic?: 'and' | 'or';
}

/**
 * User status enumeration
 */
export type UserStatus = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'suspended' 
  | 'expired';

/**
 * User session information
 */
export interface UserSession {
  /** Session token */
  token: string;
  /** Session expiration timestamp */
  expiresAt: string;
  /** Session creation timestamp */
  createdAt: string;
  /** Session last activity timestamp */
  lastActivity: string;
  /** Client IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Session identifier */
  sessionId: string;
  /** Whether session is remembered */
  remember: boolean;
}

/**
 * User preferences for navigation and UI customization
 */
export interface UserPreferences {
  /** Theme preference */
  theme: ThemePreference;
  /** Language/locale preference */
  language: string;
  /** Timezone preference */
  timezone: string;
  /** Navigation preferences */
  navigation: NavigationPreferences;
  /** Dashboard preferences */
  dashboard: DashboardPreferences;
  /** Table display preferences */
  tables: TablePreferences;
  /** Notification preferences */
  notifications: NotificationPreferences;
  /** Accessibility preferences */
  accessibility: AccessibilityPreferences;
}

/**
 * Navigation-specific user preferences
 */
export interface NavigationPreferences {
  /** Whether sidebar is collapsed by default */
  sidebarCollapsed: boolean;
  /** Preferred navigation sections to show */
  visibleSections: string[];
  /** Hidden navigation items */
  hiddenItems: string[];
  /** Pinned navigation items */
  pinnedItems: string[];
  /** Navigation item order customization */
  customOrder: Record<string, number>;
  /** Whether to show navigation search */
  showSearch: boolean;
  /** Whether to show navigation tooltips */
  showTooltips: boolean;
  /** Preferred mobile navigation behavior */
  mobileDrawer: boolean;
}

/**
 * Dashboard layout preferences
 */
export interface DashboardPreferences {
  /** Default page to show on login */
  defaultPage: string;
  /** Widget visibility and order */
  widgets: DashboardWidget[];
  /** Refresh interval for dashboard data */
  refreshInterval: number;
  /** Whether to auto-refresh data */
  autoRefresh: boolean;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  /** Widget unique identifier */
  id: string;
  /** Widget type */
  type: string;
  /** Widget title */
  title: string;
  /** Widget position */
  position: { x: number; y: number; w: number; h: number };
  /** Whether widget is visible */
  visible: boolean;
  /** Widget configuration */
  config: Record<string, any>;
}

/**
 * Table display preferences
 */
export interface TablePreferences {
  /** Default page size for tables */
  defaultPageSize: number;
  /** Preferred page size options */
  pageSizeOptions: number[];
  /** Whether to show table borders */
  showBorders: boolean;
  /** Whether to show row numbers */
  showRowNumbers: boolean;
  /** Whether to enable row selection */
  enableSelection: boolean;
  /** Table density preference */
  density: 'compact' | 'standard' | 'comfortable';
  /** Column width preferences */
  columnWidths: Record<string, number>;
  /** Column visibility preferences */
  columnVisibility: Record<string, boolean>;
  /** Column order preferences */
  columnOrder: Record<string, string[]>;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** Whether to show system notifications */
  showSystemNotifications: boolean;
  /** Whether to show error notifications */
  showErrorNotifications: boolean;
  /** Whether to show success notifications */
  showSuccessNotifications: boolean;
  /** Whether to play notification sounds */
  playSounds: boolean;
  /** Notification position on screen */
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Notification duration in milliseconds */
  duration: number;
  /** Maximum number of notifications to show */
  maxNotifications: number;
  /** Whether to group similar notifications */
  groupSimilar: boolean;
}

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
  /** Reduced motion preference */
  reduceMotion: boolean;
  /** High contrast mode */
  highContrast: boolean;
  /** Large text preference */
  largeText: boolean;
  /** Screen reader optimization */
  screenReaderOptimized: boolean;
  /** Keyboard navigation preference */
  keyboardNavigation: boolean;
  /** Focus outline visibility */
  showFocusOutlines: boolean;
  /** Color blind friendly mode */
  colorBlindFriendly: boolean;
  /** Alternative text for images */
  showAltText: boolean;
}

// =============================================================================
// BREADCRUMB STRUCTURES
// =============================================================================

/**
 * Breadcrumb item for route-based navigation
 */
export interface BreadcrumbItem {
  /** Unique identifier for the breadcrumb item */
  id: string;
  /** Display label for the breadcrumb */
  label: string;
  /** URL path for navigation */
  href?: string;
  /** Icon for the breadcrumb item */
  icon?: LucideIcon;
  /** Whether this is the current page */
  current?: boolean;
  /** Whether the breadcrumb is clickable */
  clickable?: boolean;
  /** Internationalization key for the label */
  i18nKey?: string;
  /** Custom data for the breadcrumb */
  data?: Record<string, any>;
  /** Tooltip text */
  tooltip?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Breadcrumb navigation configuration
 */
export interface BreadcrumbNavigation {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Maximum number of items to show */
  maxItems?: number;
  /** Separator between breadcrumb items */
  separator?: string | ReactNode;
  /** Whether to show home icon at start */
  showHome?: boolean;
  /** Home icon component */
  homeIcon?: LucideIcon;
  /** Home URL */
  homeHref?: string;
  /** Whether to truncate long labels */
  truncateLabels?: boolean;
  /** Maximum label length */
  maxLabelLength?: number;
  /** Whether to show tooltips on truncated items */
  showTooltips?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Dynamic breadcrumb configuration based on routes
 */
export interface DynamicBreadcrumbConfig {
  /** Route patterns and their breadcrumb generators */
  patterns: BreadcrumbPattern[];
  /** Default breadcrumb for unknown routes */
  fallback?: BreadcrumbItem[];
  /** Whether to include query parameters in breadcrumbs */
  includeQuery?: boolean;
  /** Custom parameter resolvers */
  paramResolvers?: Record<string, BreadcrumbParamResolver>;
  /** Excluded route patterns */
  excludePatterns?: string[];
}

/**
 * Breadcrumb pattern for route matching
 */
export interface BreadcrumbPattern {
  /** Route pattern to match */
  pattern: string;
  /** Breadcrumb generator function */
  generator: BreadcrumbGenerator;
  /** Whether pattern is exact match */
  exact?: boolean;
  /** Pattern priority (higher wins) */
  priority?: number;
}

/**
 * Breadcrumb generator function type
 */
export type BreadcrumbGenerator = (
  params: Record<string, string>,
  query: Record<string, string>,
  path: string
) => BreadcrumbItem[] | Promise<BreadcrumbItem[]>;

/**
 * Parameter resolver for breadcrumb labels
 */
export type BreadcrumbParamResolver = (
  value: string,
  params: Record<string, string>,
  query: Record<string, string>
) => string | Promise<string>;

// =============================================================================
// THEME AND STYLING
// =============================================================================

/**
 * Theme preference enumeration
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Theme configuration for navigation components
 */
export interface NavigationTheme {
  /** Current theme mode */
  mode: ThemePreference;
  /** Custom CSS variables for theming */
  cssVariables?: Record<string, string>;
  /** Color scheme override */
  colorScheme?: 'light' | 'dark';
  /** Custom color palette */
  colors?: NavigationColorPalette;
  /** Typography settings */
  typography?: NavigationTypography;
  /** Spacing configuration */
  spacing?: NavigationSpacing;
  /** Border radius configuration */
  borderRadius?: NavigationBorderRadius;
  /** Shadow configuration */
  shadows?: NavigationShadows;
  /** Animation configuration */
  animations?: NavigationAnimations;
}

/**
 * Navigation color palette
 */
export interface NavigationColorPalette {
  /** Primary colors */
  primary: ColorShades;
  /** Secondary colors */
  secondary: ColorShades;
  /** Background colors */
  background: BackgroundColors;
  /** Text colors */
  text: TextColors;
  /** Border colors */
  border: BorderColors;
  /** Status colors */
  status: StatusColors;
}

/**
 * Color shades for primary/secondary colors
 */
export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Background color definitions
 */
export interface BackgroundColors {
  /** Primary background */
  primary: string;
  /** Secondary background */
  secondary: string;
  /** Tertiary background */
  tertiary: string;
  /** Surface background */
  surface: string;
  /** Overlay background */
  overlay: string;
}

/**
 * Text color definitions
 */
export interface TextColors {
  /** Primary text color */
  primary: string;
  /** Secondary text color */
  secondary: string;
  /** Muted text color */
  muted: string;
  /** Inverse text color */
  inverse: string;
  /** Accent text color */
  accent: string;
}

/**
 * Border color definitions
 */
export interface BorderColors {
  /** Default border color */
  default: string;
  /** Muted border color */
  muted: string;
  /** Accent border color */
  accent: string;
  /** Focus border color */
  focus: string;
}

/**
 * Status color definitions
 */
export interface StatusColors {
  /** Success color */
  success: string;
  /** Warning color */
  warning: string;
  /** Error color */
  error: string;
  /** Info color */
  info: string;
}

/**
 * Typography configuration
 */
export interface NavigationTypography {
  /** Font family stack */
  fontFamily: string;
  /** Font size scale */
  fontSize: Record<string, string>;
  /** Font weight scale */
  fontWeight: Record<string, string>;
  /** Line height scale */
  lineHeight: Record<string, string>;
  /** Letter spacing scale */
  letterSpacing: Record<string, string>;
}

/**
 * Spacing configuration
 */
export interface NavigationSpacing {
  /** Base spacing unit */
  unit: number;
  /** Spacing scale */
  scale: Record<string, string>;
  /** Component-specific spacing */
  components: {
    sidebar: Record<string, string>;
    breadcrumb: Record<string, string>;
    menu: Record<string, string>;
  };
}

/**
 * Border radius configuration
 */
export interface NavigationBorderRadius {
  /** Base border radius */
  base: string;
  /** Small border radius */
  sm: string;
  /** Medium border radius */
  md: string;
  /** Large border radius */
  lg: string;
  /** Full border radius */
  full: string;
}

/**
 * Shadow configuration
 */
export interface NavigationShadows {
  /** Small shadow */
  sm: string;
  /** Medium shadow */
  md: string;
  /** Large shadow */
  lg: string;
  /** Extra large shadow */
  xl: string;
  /** Inner shadow */
  inner: string;
}

/**
 * Animation configuration
 */
export interface NavigationAnimations {
  /** Transition duration */
  duration: Record<string, string>;
  /** Transition timing function */
  timing: Record<string, string>;
  /** Animation keyframes */
  keyframes: Record<string, Record<string, Record<string, string>>>;
}

// =============================================================================
// COMPONENT PROPS AND STATE
// =============================================================================

/**
 * Base props for all navigation components
 */
export interface BaseNavigationProps {
  /** Custom CSS class name */
  className?: string;
  /** Component children */
  children?: ReactNode;
  /** Test identifier for automation */
  'data-testid'?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Accessibility described by */
  'aria-describedby'?: string;
  /** Accessibility expanded state */
  'aria-expanded'?: boolean;
  /** Custom data attributes */
  dataAttributes?: Record<string, string>;
}

/**
 * Sidebar navigation component props
 */
export interface SidebarNavigationProps extends BaseNavigationProps {
  /** Navigation structure */
  navigation: NavigationStructure;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Collapse state change handler */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Navigation item click handler */
  onItemClick?: (item: NavigationItem) => void;
  /** Navigation item selection handler */
  onItemSelect?: (item: NavigationItem) => void;
  /** Current user for permission checking */
  user?: NavigationUser;
  /** Theme configuration */
  theme?: NavigationTheme;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Whether to show search */
  showSearch?: boolean;
  /** Search query */
  searchQuery?: string;
  /** Search change handler */
  onSearchChange?: (query: string) => void;
  /** Custom footer content */
  footer?: ReactNode;
  /** Custom header content */
  header?: ReactNode;
  /** Variant styling */
  variant?: 'default' | 'compact' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Mobile navigation component props
 */
export interface MobileNavigationProps extends BaseNavigationProps {
  /** Navigation structure */
  navigation: NavigationStructure;
  /** Whether mobile menu is open */
  open?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** Navigation item click handler */
  onItemClick?: (item: NavigationItem) => void;
  /** Current user for permission checking */
  user?: NavigationUser;
  /** Theme configuration */
  theme?: NavigationTheme;
  /** Drawer placement */
  placement?: 'left' | 'right' | 'top' | 'bottom';
  /** Whether to show overlay */
  showOverlay?: boolean;
  /** Custom trigger element */
  trigger?: ReactNode;
}

/**
 * Breadcrumb navigation component props
 */
export interface BreadcrumbNavigationProps extends BaseNavigationProps {
  /** Breadcrumb configuration */
  breadcrumbs: BreadcrumbNavigation;
  /** Item click handler */
  onItemClick?: (item: BreadcrumbItem) => void;
  /** Theme configuration */
  theme?: NavigationTheme;
  /** Loading state */
  loading?: boolean;
  /** Whether to show as skeleton while loading */
  skeleton?: boolean;
  /** Custom separator component */
  separator?: ReactNode;
  /** Variant styling */
  variant?: 'default' | 'minimal' | 'pills';
}

/**
 * Navigation state for Zustand store integration
 */
export interface NavigationState {
  /** Current navigation structure */
  navigation: NavigationStructure | null;
  /** Current route path */
  currentPath: string;
  /** Previous route path */
  previousPath: string | null;
  /** Breadcrumb navigation */
  breadcrumbs: BreadcrumbItem[];
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Mobile menu open state */
  mobileMenuOpen: boolean;
  /** Search query */
  searchQuery: string;
  /** Selected navigation item */
  selectedItem: NavigationItem | null;
  /** Navigation loading state */
  loading: boolean;
  /** Navigation error state */
  error: Error | null;
  /** User permissions cache */
  permissions: Set<string>;
  /** Theme preference */
  theme: ThemePreference;
  /** User preferences */
  preferences: UserPreferences;
}

/**
 * Navigation store actions
 */
export interface NavigationActions {
  /** Set navigation structure */
  setNavigation: (navigation: NavigationStructure) => void;
  /** Update current path */
  setCurrentPath: (path: string) => void;
  /** Update breadcrumbs */
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
  /** Set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle mobile menu */
  toggleMobileMenu: () => void;
  /** Set mobile menu open state */
  setMobileMenuOpen: (open: boolean) => void;
  /** Update search query */
  setSearchQuery: (query: string) => void;
  /** Clear search query */
  clearSearch: () => void;
  /** Select navigation item */
  selectItem: (item: NavigationItem) => void;
  /** Clear selected item */
  clearSelection: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: Error | null) => void;
  /** Update user permissions */
  updatePermissions: (permissions: string[]) => void;
  /** Set theme preference */
  setTheme: (theme: ThemePreference) => void;
  /** Update user preferences */
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  /** Reset navigation state */
  reset: () => void;
}

/**
 * Combined navigation store type
 */
export type NavigationStore = NavigationState & NavigationActions;

// =============================================================================
// ACCESSIBILITY AND INTERNATIONALIZATION
// =============================================================================

/**
 * Accessibility props for WCAG 2.1 AA compliance
 */
export interface AccessibilityProps {
  /** Accessibility role */
  role?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Accessibility described by */
  'aria-describedby'?: string;
  /** Accessibility expanded state */
  'aria-expanded'?: boolean;
  /** Accessibility selected state */
  'aria-selected'?: boolean;
  /** Accessibility current state */
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  /** Accessibility live region */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Accessibility controls */
  'aria-controls'?: string;
  /** Accessibility owns */
  'aria-owns'?: string;
  /** Accessibility has popup */
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Keyboard event handlers */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  /** Focus event handlers */
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * Internationalization configuration
 */
export interface I18nConfig {
  /** Current locale */
  locale: string;
  /** Available locales */
  availableLocales: string[];
  /** Fallback locale */
  fallbackLocale: string;
  /** Translation function */
  t: (key: string, params?: Record<string, any>) => string;
  /** Locale change handler */
  changeLocale: (locale: string) => void;
  /** Text direction for RTL support */
  dir: 'ltr' | 'rtl';
  /** Pluralization function */
  plural: (count: number, key: string) => string;
  /** Date/time formatting function */
  formatDateTime: (date: Date, format?: string) => string;
  /** Number formatting function */
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
}

/**
 * Navigation component with full internationalization support
 */
export interface I18nNavigationProps {
  /** Internationalization configuration */
  i18n: I18nConfig;
  /** Whether to auto-detect locale */
  autoDetectLocale?: boolean;
  /** Custom locale storage key */
  localeStorageKey?: string;
  /** Locale change animation */
  localeChangeAnimation?: boolean;
}

// =============================================================================
// RESPONSIVE AND MOBILE SUPPORT
// =============================================================================

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoints {
  /** Extra small screens */
  xs: number;
  /** Small screens */
  sm: number;
  /** Medium screens */
  md: number;
  /** Large screens */
  lg: number;
  /** Extra large screens */
  xl: number;
  /** 2x large screens */
  '2xl': number;
}

/**
 * Mobile navigation behavior configuration
 */
export interface MobileNavigationBehavior {
  /** Current screen size */
  screenSize: keyof ResponsiveBreakpoints;
  /** Whether device supports touch */
  touchDevice: boolean;
  /** Whether device supports hover */
  hoverDevice: boolean;
  /** Device orientation */
  orientation: 'portrait' | 'landscape';
  /** Safe area insets for mobile devices */
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Navigation behavior preferences */
  behavior: {
    /** Use swipe gestures */
    useSwipeGestures: boolean;
    /** Auto-collapse on route change */
    autoCollapseOnRoute: boolean;
    /** Show navigation overlay */
    showOverlay: boolean;
    /** Enable pull-to-refresh */
    pullToRefresh: boolean;
  };
}

/**
 * Touch gesture configuration for mobile navigation
 */
export interface TouchGestureConfig {
  /** Swipe threshold in pixels */
  swipeThreshold: number;
  /** Swipe velocity threshold */
  velocityThreshold: number;
  /** Maximum swipe time in milliseconds */
  maxSwipeTime: number;
  /** Gesture directions to enable */
  enabledDirections: ('left' | 'right' | 'up' | 'down')[];
  /** Gesture event handlers */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Re-export commonly used types for convenience
 */
export type {
  // Core React types
  ComponentType,
  ReactNode,
  
  // Lucide icon type
  LucideIcon,
};

/**
 * Navigation component variant types
 */
export type NavigationVariant = 'default' | 'compact' | 'minimal' | 'floating';
export type NavigationSize = 'sm' | 'md' | 'lg' | 'xl';
export type NavigationPlacement = 'left' | 'right' | 'top' | 'bottom';

/**
 * Common event handler types
 */
export type NavigationClickHandler = (item: NavigationItem) => void;
export type NavigationSelectHandler = (item: NavigationItem) => void;
export type NavigationSearchHandler = (query: string) => void;
export type NavigationCollapseHandler = (collapsed: boolean) => void;

/**
 * Navigation filter and search types
 */
export interface NavigationFilter {
  /** Filter query string */
  query?: string;
  /** Filter by sections */
  sections?: string[];
  /** Filter by permissions */
  permissions?: string[];
  /** Filter by roles */
  roles?: string[];
  /** Filter by features */
  features?: string[];
  /** Show only active items */
  activeOnly?: boolean;
  /** Show only enabled items */
  enabledOnly?: boolean;
}

/**
 * Navigation search result
 */
export interface NavigationSearchResult {
  /** Matched navigation item */
  item: NavigationItem;
  /** Match score (0-1) */
  score: number;
  /** Matched text segments */
  matches: SearchMatch[];
  /** Item path in navigation hierarchy */
  path: NavigationItem[];
}

/**
 * Search match information
 */
export interface SearchMatch {
  /** Field that matched */
  field: 'label' | 'description' | 'href';
  /** Matched text */
  text: string;
  /** Match indices in the text */
  indices: [number, number][];
}