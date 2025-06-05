/**
 * Navigation Components Barrel Export
 * 
 * Centralized exports for navigation components and types following React 19 patterns.
 * Optimized for tree-shaking with Next.js 15.1 and TypeScript 5.8+ type safety.
 * 
 * @module NavigationComponents
 */

// Main Navigation Component
export { SideNav } from './side-nav';

// Navigation Types and Interfaces
export type {
  NavigationItem,
  NavigationItemMetadata,
  NavigationState,
  NavigationProps,
  BreadcrumbItem,
  BreadcrumbProps,
  UserNavigationData,
  NavigationUserProps,
  NavigationTheme,
  NavigationPreferences,
  SideNavProps,
  MobileNavigationState,
  NavigationAccessibilityProps,
  NavigationRouteConfig,
  NavigationPermission,
  NavigationContext,
  NavigationEventHandlers,
} from './types';

// Navigation Constants and Utilities (re-exported for convenience)
export {
  NAVIGATION_ROUTES,
  DEFAULT_NAVIGATION_PREFERENCES,
  NAVIGATION_ICONS,
  NAVIGATION_BREAKPOINTS,
  NAVIGATION_ARIA_LABELS,
} from './types';

// Type Guards and Utilities
export {
  isNavigationItem,
  isValidNavigationRoute,
  getNavigationIcon,
  formatBreadcrumbPath,
  validateNavigationPermissions,
} from './types';

/**
 * Default export for backwards compatibility and easier imports
 * 
 * @example
 * ```tsx
 * import Navigation from '@/components/ui/navigation';
 * // or
 * import { SideNav } from '@/components/ui/navigation';
 * ```
 */
export { SideNav as default } from './side-nav';