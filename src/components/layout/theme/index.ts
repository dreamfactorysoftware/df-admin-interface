/**
 * Theme Management Barrel Exports
 * 
 * Centralized export hub for all theme management components, hooks, utilities, and types.
 * Provides clean API surface for application-wide theme consumption with proper tree-shaking support.
 * 
 * This barrel file exports:
 * - Core theme components (ThemeProvider, ThemeToggle)
 * - React hooks for theme state management
 * - Zustand store integration for performance optimization
 * - Utility functions for theme operations and accessibility
 * - TypeScript types for theme-related interfaces
 * - Configuration constants and accessibility standards
 * 
 * @example
 * ```tsx
 * // Core theme components
 * import { ThemeProvider, ThemeToggle } from '@/components/layout/theme';
 * 
 * // Theme hooks
 * import { useTheme, useThemeUtils } from '@/components/layout/theme';
 * 
 * // Store-based theme management
 * import { useThemeStore, useThemeMode } from '@/components/layout/theme';
 * 
 * // Utility functions
 * import { detectSystemTheme, validateContrast } from '@/components/layout/theme';
 * 
 * // Type definitions
 * import type { ThemeMode, ResolvedTheme } from '@/components/layout/theme';
 * ```
 */

// =============================================================================
// CORE THEME COMPONENTS
// =============================================================================

/**
 * Theme Provider Component - React Context Provider for Theme State
 * 
 * Primary theme provider using React 19 context API for theme state management.
 * Handles theme persistence, system preference detection, and Tailwind CSS integration.
 */
export { 
  ThemeProvider,
  useTheme as useThemeContext,
  useThemeUtils as useThemeContextUtils,
  default as ThemeProviderDefault 
} from './theme-provider';

/**
 * Theme Toggle Components - Interactive Theme Selection Controls
 * 
 * Accessible theme toggle components with WCAG 2.1 AA compliance.
 * Includes variants for different UI contexts (compact, labeled).
 */
export { 
  ThemeToggle,
  CompactThemeToggle,
  LabeledThemeToggle,
  default as ThemeToggleDefault 
} from './theme-toggle';

// =============================================================================
// REACT HOOKS FOR THEME MANAGEMENT
// =============================================================================

/**
 * Primary Theme Hook - Complete Theme Management Interface
 * 
 * Comprehensive hook providing theme state, actions, and utilities.
 * Preferred hook for most theme-related operations.
 */
export { 
  useTheme,
  isValidTheme,
  getSystemTheme,
  createThemeStorage,
  default as useThemeDefault 
} from './use-theme';

// =============================================================================
// ZUSTAND STORE INTEGRATION
// =============================================================================

/**
 * Performance-Optimized Theme Store
 * 
 * Zustand-based theme store for high-performance scenarios and complex state management.
 * Provides fine-grained selectors to prevent unnecessary re-renders.
 */
export { 
  useThemeStore,
  useThemeMode,
  useSystemTheme,
  useThemeTransitions,
  useThemeAnalytics,
  useResolvedTheme,
  useThemePreference,
  useIsSystemTheme,
  useThemeClass,
  useThemeInitialization,
  isDarkTheme 
} from './theme-store';

// =============================================================================
// THEME UTILITIES AND HELPERS
// =============================================================================

/**
 * System Theme Detection and Validation
 */
export {
  detectSystemTheme,
  createSystemThemeListener,
  validateTheme,
  sanitizeTheme,
  resolveTheme,
} from './theme-utils';

/**
 * Theme Storage Management
 */
export {
  getStoredTheme,
  setStoredTheme,
  clearStoredTheme,
} from './theme-utils';

/**
 * CSS Class and DOM Management
 */
export {
  applyThemeClasses,
  updateMetaThemeColor,
  disableTransitions,
  applyTheme,
} from './theme-utils';

/**
 * Accessibility and WCAG Compliance Utilities
 */
export {
  getContrastRatio,
  validateContrast,
  validateUIContrast,
  getAccessibleColorPairs,
  getFocusRingStyles,
  validateTouchTarget,
  createThemeAwareClasses,
  announceThemeChange,
} from './theme-utils';

/**
 * High-Level Theme Operations
 */
export {
  setTheme as setThemeUtility,
  initializeTheme,
} from './theme-utils';

/**
 * Theme Configuration Constants
 */
export {
  THEME_CONFIG,
  THEME_COLORS,
  ACCESSIBILITY_CONFIG,
} from './theme-utils';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Core Theme Types
 * 
 * Essential type definitions for theme modes and resolved themes.
 * Compatible across all theme management implementations.
 */
export type { ThemeMode, ResolvedTheme } from '@/types/theme';

/**
 * Theme Provider Types
 */
export type { 
  ThemeProviderConfig,
  ThemeContextState,
  UseThemeReturn,
  ThemeUtils,
  ThemeStorage,
  ThemeValidation,
} from '@/types/theme';

/**
 * Theme Toggle Component Types
 */
export type { ThemeToggleProps } from './theme-toggle';

/**
 * Theme Store Types
 */
export type {
  SystemThemeState,
  ThemeTransitionState,
  ThemeStoreState,
} from './theme-store';

/**
 * Theme Utility Types
 */
export type {
  Theme,
  ResolvedTheme as UtilResolvedTheme,
  ThemeConfig,
  AccessibilityConfig,
  ThemeColors,
} from './theme-utils';

// =============================================================================
// CONVENIENCE EXPORTS AND ALIASES
// =============================================================================

/**
 * Most commonly used exports for quick access
 * Reduces import complexity for standard use cases
 */
export {
  ThemeProvider as Provider,
  ThemeToggle as Toggle,
  useTheme as useThemeHook,
  useResolvedTheme as useCurrentTheme,
  useThemeMode as useThemeState,
  detectSystemTheme as getSystemPreference,
  validateTheme as isValidThemeMode,
  applyTheme as applyThemeStyles,
};

/**
 * Grouped exports for specific use cases
 * Provides organized access to related functionality
 */

/**
 * Core theme management bundle - most essential exports
 */
export const ThemeCore = {
  Provider: ThemeProvider,
  Toggle: ThemeToggle,
  useTheme,
  useResolvedTheme,
  detectSystemTheme,
  validateTheme,
} as const;

/**
 * Accessibility utilities bundle
 */
export const ThemeAccessibility = {
  getContrastRatio,
  validateContrast,
  validateUIContrast,
  getAccessibleColorPairs,
  getFocusRingStyles,
  validateTouchTarget,
  announceThemeChange,
  ACCESSIBILITY_CONFIG,
} as const;

/**
 * Advanced theme management bundle
 */
export const ThemeAdvanced = {
  useThemeStore,
  useThemeAnalytics,
  useThemeInitialization,
  createSystemThemeListener,
  initializeTheme,
  setTheme: setThemeUtility,
} as const;

/**
 * Development and debugging utilities
 */
export const ThemeDebug = {
  getSystemTheme,
  createThemeStorage,
  getStoredTheme,
  clearStoredTheme,
  disableTransitions,
  THEME_CONFIG,
} as const;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the most commonly used theme functionality
 * Suitable for applications that need basic theme management
 */
const themeDefaults = {
  // Core components
  Provider: ThemeProvider,
  Toggle: ThemeToggle,
  
  // Primary hooks
  useTheme,
  useResolvedTheme,
  
  // Essential utilities
  detectSystemTheme,
  validateTheme,
  applyTheme,
  
  // Types (for re-export)
  Core: ThemeCore,
  Accessibility: ThemeAccessibility,
  Advanced: ThemeAdvanced,
  Debug: ThemeDebug,
} as const;

export default themeDefaults;

// =============================================================================
// JSDoc EXAMPLES FOR COMMON USAGE PATTERNS
// =============================================================================

/**
 * @example Basic theme setup
 * ```tsx
 * import { ThemeProvider, ThemeToggle, useTheme } from '@/components/layout/theme';
 * 
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system">
 *       <Header />
 *       <Main />
 *     </ThemeProvider>
 *   );
 * }
 * 
 * function Header() {
 *   return (
 *     <header>
 *       <h1>My App</h1>
 *       <ThemeToggle showLabels />
 *     </header>
 *   );
 * }
 * 
 * function Main() {
 *   const { theme, resolvedTheme, setTheme } = useTheme();
 *   
 *   return (
 *     <main className="bg-white dark:bg-gray-900">
 *       <p>Current theme: {resolvedTheme}</p>
 *       <button onClick={() => setTheme('dark')}>
 *         Use dark theme
 *       </button>
 *     </main>
 *   );
 * }
 * ```
 */

/**
 * @example Performance-optimized theme usage
 * ```tsx
 * import { 
 *   ThemeProvider, 
 *   useResolvedTheme, 
 *   useThemeMode 
 * } from '@/components/layout/theme';
 * 
 * function OptimizedComponent() {
 *   // Only re-renders when resolved theme changes
 *   const currentTheme = useResolvedTheme();
 *   
 *   return (
 *     <div className={`theme-${currentTheme}`}>
 *       Optimized for {currentTheme} theme
 *     </div>
 *   );
 * }
 * 
 * function ThemeControls() {
 *   // Only re-renders when theme mode or setTheme changes
 *   const { theme, setTheme } = useThemeMode();
 *   
 *   return (
 *     <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *       <option value="light">Light</option>
 *       <option value="dark">Dark</option>
 *       <option value="system">System</option>
 *     </select>
 *   );
 * }
 * ```
 */

/**
 * @example Accessibility-focused theme implementation
 * ```tsx
 * import { 
 *   ThemeProvider,
 *   ThemeToggle,
 *   useTheme,
 *   validateContrast,
 *   getAccessibleColorPairs 
 * } from '@/components/layout/theme';
 * 
 * function AccessibleComponent() {
 *   const { resolvedTheme } = useTheme();
 *   const colors = getAccessibleColorPairs(resolvedTheme);
 *   
 *   // Verify contrast meets WCAG AA standards
 *   const isAccessible = validateContrast(
 *     colors.text.primary,
 *     colors.background.primary,
 *     'AA'
 *   );
 *   
 *   return (
 *     <div 
 *       style={{
 *         color: colors.text.primary,
 *         backgroundColor: colors.background.primary,
 *       }}
 *       aria-label={`Content in ${resolvedTheme} theme`}
 *     >
 *       <p>WCAG AA Compliant: {isAccessible ? 'Yes' : 'No'}</p>
 *       <ThemeToggle 
 *         ariaLabel="Change color theme"
 *         showLabels 
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * @example Advanced theme store integration
 * ```tsx
 * import { 
 *   useThemeStore,
 *   useThemeAnalytics,
 *   useThemeInitialization 
 * } from '@/components/layout/theme';
 * 
 * function AdvancedThemeComponent() {
 *   const { initialize, cleanup } = useThemeInitialization();
 *   const { getAnalytics } = useThemeAnalytics();
 *   
 *   React.useEffect(() => {
 *     initialize();
 *     return cleanup;
 *   }, [initialize, cleanup]);
 *   
 *   const analytics = getAnalytics();
 *   
 *   return (
 *     <div>
 *       <p>Theme changes: {analytics.changeCount}</p>
 *       <p>Prefers dark: {analytics.userPrefersDark ? 'Yes' : 'No'}</p>
 *       <p>Uses system: {analytics.userPrefersSystem ? 'Yes' : 'No'}</p>
 *     </div>
 *   );
 * }
 * ```
 */