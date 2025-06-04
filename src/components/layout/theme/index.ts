/**
 * Theme Management Barrel Exports
 * 
 * Centralized export structure for all theme-related components, hooks, utilities,
 * and types. This barrel file provides clean import paths and supports tree-shaking
 * optimization for unused theme functionality.
 * 
 * @description Enables application-wide theme consumption with clean API surface
 * @supports React 19.0 stable with Next.js 15.1+ integration
 * @accessibility WCAG 2.1 AA compliant theme implementation
 */

// =============================================================================
// CORE THEME COMPONENTS
// =============================================================================

/**
 * ThemeProvider - React context provider for application-wide theme management
 * 
 * Provides theme state management including light/dark/system preferences,
 * automatic system detection, persistent storage, and Tailwind CSS integration.
 * 
 * @example
 * ```tsx
 * import { ThemeProvider } from '@/components/layout/theme'
 * 
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="system" storageKey="df-admin-theme">
 *       <YourApp />
 *     </ThemeProvider>
 *   )
 * }
 * ```
 */
export { ThemeProvider } from './theme-provider';

/**
 * ThemeToggle - Interactive component for switching between theme modes
 * 
 * Accessible theme toggle using Headless UI Switch with WCAG 2.1 AA compliance.
 * Supports three-state selection: light, dark, and system preferences.
 * 
 * @example
 * ```tsx
 * import { ThemeToggle } from '@/components/layout/theme'
 * 
 * function Header() {
 *   return (
 *     <div className="flex items-center gap-4">
 *       <ThemeToggle />
 *     </div>
 *   )
 * }
 * ```
 */
export { ThemeToggle } from './theme-toggle';

// =============================================================================
// THEME HOOKS AND STATE MANAGEMENT
// =============================================================================

/**
 * useTheme - Custom React hook for accessing theme context
 * 
 * Provides typed access to theme state, actions, and resolved values.
 * Includes error handling for components using hook outside ThemeProvider.
 * 
 * @example
 * ```tsx
 * import { useTheme } from '@/components/layout/theme'
 * 
 * function MyComponent() {
 *   const { theme, resolvedTheme, setTheme, systemTheme } = useTheme()
 *   
 *   return (
 *     <div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
 *       Current theme: {theme}
 *     </div>
 *   )
 * }
 * ```
 */
export { useTheme } from './use-theme';

/**
 * Theme Store Integration - Zustand store for advanced theme state management
 * 
 * Provides global theme state with persistence middleware, complementing
 * React context provider with performance benefits for complex scenarios.
 * 
 * @example
 * ```tsx
 * import { useThemeStore, themeStore } from '@/components/layout/theme'
 * 
 * function AdvancedThemeComponent() {
 *   const { theme, setTheme } = useThemeStore()
 *   
 *   // Direct store access for non-React contexts
 *   const currentTheme = themeStore.getState().theme
 *   
 *   return <div>Advanced theme management</div>
 * }
 * ```
 */
export { useThemeStore, themeStore } from './theme-store';

// =============================================================================
// THEME UTILITIES AND HELPERS
// =============================================================================

/**
 * Theme Utility Functions
 * 
 * Collection of utility functions for theme detection, validation,
 * CSS class management, and accessibility helpers.
 * 
 * @example
 * ```tsx
 * import { 
 *   detectSystemTheme, 
 *   validateTheme, 
 *   getThemeClasses,
 *   getAccessibleColors
 * } from '@/components/layout/theme'
 * 
 * const systemTheme = detectSystemTheme()
 * const isValid = validateTheme('dark')
 * const classes = getThemeClasses('dark', 'card')
 * const colors = getAccessibleColors('primary')
 * ```
 */
export {
  detectSystemTheme,
  validateTheme,
  sanitizeTheme,
  getThemeClasses,
  applyThemeTransition,
  getAccessibleColors,
  validateContrast,
  getContrastRatio,
  updateMetaThemeColor,
  createThemeMediaQuery,
  toggleDocumentTheme
} from './theme-utils';

// =============================================================================
// THEME TYPES AND INTERFACES
// =============================================================================

/**
 * Theme Type Definitions
 * 
 * TypeScript definitions for theme values, context interfaces,
 * and utility function parameters ensuring type safety.
 * 
 * @example
 * ```tsx
 * import type { 
 *   Theme, 
 *   ThemeContextType, 
 *   ThemeProviderProps,
 *   ThemeUtilityOptions 
 * } from '@/components/layout/theme'
 * 
 * const theme: Theme = 'dark'
 * const context: ThemeContextType = { theme, resolvedTheme: 'dark', setTheme, systemTheme }
 * ```
 */
export type {
  Theme,
  ThemeContextType,
  ThemeProviderProps,
  ThemeToggleProps,
  ThemeStoreState,
  ThemeStoreActions,
  ThemeUtilityOptions,
  AccessibleColorPair,
  ContrastValidationOptions,
  ThemeTransitionOptions
} from './theme-provider';

// Re-export additional types that might be defined in separate files
export type {
  ThemeValidationResult,
  SystemThemeDetection,
  ThemeClassConfiguration,
  AccessibilityThemeOptions
} from './theme-utils';

// =============================================================================
// THEME CONSTANTS AND CONFIGURATIONS
// =============================================================================

/**
 * Theme Constants and Default Configurations
 * 
 * Predefined theme values, storage keys, CSS class mappings,
 * and accessibility configurations for consistent usage.
 * 
 * @example
 * ```tsx
 * import { 
 *   THEME_VALUES, 
 *   DEFAULT_THEME_CONFIG,
 *   THEME_STORAGE_KEY,
 *   THEME_CSS_CLASSES 
 * } from '@/components/layout/theme'
 * 
 * const isValidTheme = THEME_VALUES.includes(userTheme)
 * const config = { ...DEFAULT_THEME_CONFIG, enableSystem: true }
 * ```
 */
export {
  THEME_VALUES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEME_CSS_CLASSES,
  ACCESSIBILITY_COLORS,
  CONTRAST_THRESHOLDS,
  DEFAULT_THEME_CONFIG
} from './theme-utils';

// =============================================================================
// BARREL EXPORT SUMMARY
// =============================================================================

/**
 * Complete Theme Management API
 * 
 * This barrel export provides:
 * 
 * Components:
 * - ThemeProvider: Context provider for theme state management
 * - ThemeToggle: Interactive theme switching component
 * 
 * Hooks:
 * - useTheme: React hook for theme context access
 * - useThemeStore: Zustand store hook for advanced state management
 * 
 * Utilities:
 * - detectSystemTheme: System preference detection
 * - validateTheme: Theme value validation
 * - getThemeClasses: CSS class management
 * - getAccessibleColors: WCAG compliance helpers
 * - Various accessibility and transition utilities
 * 
 * Types:
 * - Theme: Union type for theme values
 * - ThemeContextType: Context interface definition
 * - Various component and utility interfaces
 * 
 * Constants:
 * - THEME_VALUES: Supported theme options
 * - DEFAULT_THEME_CONFIG: Default configuration
 * - ACCESSIBILITY_COLORS: WCAG compliant color definitions
 * 
 * @supports Tree-shaking optimization for unused exports
 * @ensures TypeScript type safety with proper declarations
 * @maintains Clean import paths for consuming components
 * @provides WCAG 2.1 AA accessibility compliance
 */