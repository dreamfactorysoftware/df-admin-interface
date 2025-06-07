/**
 * Navigation Components Barrel Export
 * 
 * Centralized export file for navigation components following React 19 
 * conventions and Next.js 15.1 build optimization. Provides tree-shaking
 * friendly exports for the main SideNav component and navigation types.
 * 
 * Features:
 * - Tree-shaking optimized exports for minimal bundle size
 * - TypeScript 5.8+ strict type definitions
 * - React 19 component import patterns
 * - Grouped exports for better organization
 * - Re-exports for commonly used navigation utilities
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main SideNav component - Primary navigation system
 * Comprehensive sidebar navigation with responsive design, mobile drawer,
 * theme toggle, user profile menu, search functionality, and accessibility
 */
export { SideNav } from './side-nav';

/**
 * SideNav component props interface
 * TypeScript interface for SideNav component configuration and customization
 */
export type { SideNavProps } from './side-nav';

/**
 * Default export for dynamic imports and compatibility
 */
export { default } from './side-nav';

// =============================================================================
// CORE NAVIGATION TYPE EXPORTS
// =============================================================================

/**
 * Core navigation structures for sidebar and menu configuration
 */
export type {
  NavigationItem,
  NavigationSection,
  NavigationStructure,
  NavigationConfig,
} from './types';

/**
 * User and permission types for role-based access control
 */
export type {
  NavigationUser,
  UserRole,
  UserPermission,
  UserStatus,
  UserSession,
  UserPreferences,
  NavigationPreferences,
  PermissionAction,
  PermissionScope,
  PermissionCondition,
} from './types';

/**
 * Breadcrumb navigation types for route-based navigation
 */
export type {
  BreadcrumbItem,
  BreadcrumbNavigation,
  DynamicBreadcrumbConfig,
  BreadcrumbPattern,
  BreadcrumbGenerator,
  BreadcrumbParamResolver,
} from './types';

// =============================================================================
// THEME AND STYLING TYPE EXPORTS
// =============================================================================

/**
 * Theme and styling configuration types
 */
export type {
  ThemePreference,
  NavigationTheme,
  NavigationColorPalette,
  ColorShades,
  BackgroundColors,
  TextColors,
  BorderColors,
  StatusColors,
  NavigationTypography,
  NavigationSpacing,
  NavigationBorderRadius,
  NavigationShadows,
  NavigationAnimations,
} from './types';

// =============================================================================
// COMPONENT PROPS AND STATE TYPE EXPORTS
// =============================================================================

/**
 * Component prop interfaces for navigation components
 */
export type {
  BaseNavigationProps,
  SidebarNavigationProps,
  MobileNavigationProps,
  BreadcrumbNavigationProps,
} from './types';

/**
 * State management types for Zustand integration
 */
export type {
  NavigationState,
  NavigationActions,
  NavigationStore,
} from './types';

// =============================================================================
// ACCESSIBILITY AND I18N TYPE EXPORTS
// =============================================================================

/**
 * Accessibility types for WCAG 2.1 AA compliance
 */
export type {
  AccessibilityProps,
  I18nConfig,
  I18nNavigationProps,
} from './types';

// =============================================================================
// RESPONSIVE AND MOBILE TYPE EXPORTS
// =============================================================================

/**
 * Responsive and mobile navigation types
 */
export type {
  ResponsiveBreakpoints,
  MobileNavigationBehavior,
  TouchGestureConfig,
} from './types';

// =============================================================================
// UTILITY AND VARIANT TYPE EXPORTS
// =============================================================================

/**
 * Navigation variant and utility types
 */
export type {
  NavigationVariant,
  NavigationSize,
  NavigationPlacement,
  NavigationClickHandler,
  NavigationSelectHandler,
  NavigationSearchHandler,
  NavigationCollapseHandler,
} from './types';

/**
 * Search and filter types for navigation functionality
 */
export type {
  NavigationFilter,
  NavigationSearchResult,
  SearchMatch,
} from './types';

// =============================================================================
// DASHBOARD AND TABLE PREFERENCE TYPE EXPORTS
// =============================================================================

/**
 * Dashboard and table preference types for user customization
 */
export type {
  DashboardPreferences,
  DashboardWidget,
  TablePreferences,
  NotificationPreferences,
  AccessibilityPreferences,
} from './types';

// =============================================================================
// RE-EXPORTED COMMON TYPES
// =============================================================================

/**
 * Re-exported common types for convenience
 */
export type {
  ComponentType,
  ReactNode,
  LucideIcon,
} from './types';