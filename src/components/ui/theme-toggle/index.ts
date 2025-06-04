/**
 * Theme Toggle Component System - Barrel Export Index
 * 
 * Centralized exports for the theme toggle component system providing clean import patterns
 * for React 19/Next.js 15.1 applications. Supports tree-shaking optimization and follows
 * established UI component library structure for maintainable, scalable theme management.
 * 
 * This barrel export enables consumers to import components, utilities, and types through
 * a single entry point while maintaining optimal bundle size through selective imports.
 * 
 * Features:
 * - Main ThemeToggle component with WCAG 2.1 AA compliance
 * - Pre-configured component variants for common use cases
 * - Styling utilities and design tokens for customization
 * - Complete TypeScript type definitions for type safety
 * - Theme management utilities and helper functions
 * - Accessibility-first design with proper ARIA support
 * 
 * @example
 * ```tsx
 * // Import main component
 * import { ThemeToggle } from '@/components/ui/theme-toggle';
 * 
 * // Import with utilities
 * import { 
 *   ThemeToggle, 
 *   ThemeToggleVariants,
 *   getThemeToggleClasses 
 * } from '@/components/ui/theme-toggle';
 * 
 * // Import types for custom implementations
 * import type { 
 *   ThemeToggleProps, 
 *   ThemeMode,
 *   ThemeToggleVariantProps 
 * } from '@/components/ui/theme-toggle';
 * ```
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main ThemeToggle component - WCAG 2.1 AA compliant theme switcher
 * 
 * Primary export providing three-state theme switching with full accessibility support.
 * Supports light, dark, and system preference modes with proper ARIA labeling,
 * keyboard navigation, and minimum 44x44px touch targets for mobile accessibility.
 */
export { 
  ThemeToggle,
  type ThemeToggleProps 
} from './theme-toggle';

/**
 * Compact variant for constrained spaces and mobile interfaces
 * 
 * Pre-configured ThemeToggle with compact layout optimized for headers,
 * navigation bars, and mobile-first responsive designs.
 */
export { CompactThemeToggle } from './theme-toggle';

/**
 * Pre-configured theme toggle variants for common use cases
 * 
 * Provides ready-to-use component configurations including:
 * - Header: Compact design for navigation bars
 * - Settings: Full-featured for settings pages  
 * - Mobile: Mobile-optimized with enhanced touch targets
 * - HighContrast: Enhanced accessibility for vision needs
 */
export { ThemeToggleVariants } from './theme-toggle';

/**
 * Default export for convenient importing
 * 
 * Enables `import ThemeToggle from '@/components/ui/theme-toggle'` syntax
 * following React 19/Next.js 15.1 conventions for component libraries.
 */
export { default } from './theme-toggle';

// =============================================================================
// STYLING AND VARIANT EXPORTS
// =============================================================================

/**
 * Class Variance Authority (CVA) configuration for theme toggle styling
 * 
 * Base variant function providing systematic styling with WCAG compliance.
 * Includes variants for size, visual style, theme states, and loading conditions.
 */
export { 
  themeToggleVariants,
  type ThemeToggleVariantProps 
} from './theme-toggle-variants';

/**
 * Utility function for creating theme toggle classes with proper merging
 * 
 * Combines variant classes with custom classes using tailwind-merge to resolve
 * conflicts and ensure consistent styling application.
 * 
 * @param props - Variant props for styling configuration
 * @param className - Additional custom classes for extension
 * @returns Merged class string with conflicts resolved
 */
export { getThemeToggleClasses } from './theme-toggle-variants';

/**
 * Design system utilities and constants for theme toggle styling
 * 
 * Provides consistent sizing, animations, accessibility labels, and design tokens
 * for building custom theme toggle implementations or extending existing ones.
 */
export {
  themeToggleIconSizes,
  themeToggleAnimations,
  themeToggleAriaLabels,
  themeToggleDesignTokens
} from './theme-toggle-variants';

// =============================================================================
// THEME MANAGEMENT TYPE EXPORTS
// =============================================================================

/**
 * Core theme type definitions for type-safe theme management
 * 
 * Essential types for theme mode selection, resolved theme states,
 * and system preference handling throughout the application.
 */
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextState,
  UseThemeReturn
} from '@/types/theme';

/**
 * Theme provider and configuration types
 * 
 * Types for configuring theme providers, storage options, and transition
 * behaviors for comprehensive theme management systems.
 */
export type {
  ThemeProviderConfig,
  ThemeStorage,
  ThemeTransition,
  SystemThemeConfig
} from '@/types/theme';

/**
 * Theme utility and validation types
 * 
 * Types for theme utility functions, validation schemas, and error handling
 * to ensure robust theme management with proper type safety.
 */
export type {
  ThemeUtils,
  ThemeValidation,
  ThemeCSSProperties,
  ThemeColorPalette
} from '@/types/theme';

/**
 * Theme error handling exports
 * 
 * Error class and constants for standardized theme error handling,
 * providing clear error codes and messaging for debugging and user feedback.
 */
export {
  ThemeError,
  THEME_ERROR_CODES
} from '@/types/theme';

/**
 * Default theme configuration and constants
 * 
 * Pre-configured default values and system constants for consistent
 * theme behavior across application instances and deployments.
 */
export {
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS
} from '@/types/theme';

// =============================================================================
// RE-EXPORT ORGANIZATION FOR TREE-SHAKING
// =============================================================================

/**
 * Grouped exports for selective importing and optimal tree-shaking
 * 
 * Organized exports enable consumers to import exactly what they need
 * while maintaining clear separation between components, utilities, and types.
 */

/**
 * Component exports - Main theme toggle components and variants
 */
export const ThemeToggleComponents = {
  ThemeToggle,
  CompactThemeToggle,
  ThemeToggleVariants,
} as const;

/**
 * Utility exports - Styling utilities, classes, and helper functions
 */
export const ThemeToggleUtils = {
  themeToggleVariants,
  getThemeToggleClasses,
  themeToggleIconSizes,
  themeToggleAnimations,
  themeToggleAriaLabels,
  themeToggleDesignTokens,
} as const;

/**
 * Configuration exports - Default configs and system constants
 */
export const ThemeToggleConfig = {
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
  THEME_ERROR_CODES,
} as const;

// =============================================================================
// COMPATIBILITY AND MIGRATION HELPERS
// =============================================================================

/**
 * Legacy compatibility exports for Angular to React migration
 * 
 * Provides familiar naming patterns for teams migrating from Angular Material
 * theme toggles to React implementations, easing the transition process.
 * 
 * @deprecated Use direct imports for new implementations
 */
export const LegacyThemeToggle = {
  /** @deprecated Use ThemeToggle instead */
  MatThemeToggle: ThemeToggle,
  /** @deprecated Use CompactThemeToggle instead */
  MatSlideToggle: CompactThemeToggle,
  /** @deprecated Use ThemeToggleVariants.Settings instead */
  ThemeSettingsToggle: ThemeToggleVariants.Settings,
} as const;

/**
 * Migration utilities for theme state conversion
 * 
 * Helper functions to assist with converting Angular Material theme states
 * to React theme management patterns during the migration process.
 * 
 * @deprecated Remove after migration completion
 */
export const MigrationHelpers = {
  /**
   * Convert Angular Material theme value to React theme mode
   * @deprecated Direct theme mode usage recommended
   */
  convertMatTheme: (matValue: string): ThemeMode => {
    switch (matValue) {
      case 'dark-theme':
        return 'dark';
      case 'light-theme':
        return 'light';
      default:
        return 'system';
    }
  },
  
  /**
   * Map Angular component props to React props
   * @deprecated Use ThemeToggleProps directly
   */
  mapAngularProps: (angularProps: Record<string, unknown>): Partial<ThemeToggleProps> => {
    return {
      disabled: Boolean(angularProps.disabled),
      className: String(angularProps.class || ''),
      ariaLabel: String(angularProps.ariaLabel || 'Select theme preference'),
    };
  },
} as const;

// =============================================================================
// DOCUMENTATION AND VERSION INFO
// =============================================================================

/**
 * Component system metadata for development and debugging
 */
export const ThemeToggleSystemInfo = {
  version: '1.0.0',
  lastUpdated: '2024-12-19',
  reactVersion: '19.0.0',
  nextjsVersion: '15.1.0',
  tailwindVersion: '4.1.0',
  wcagCompliance: 'AA',
  touchTargetCompliance: true,
  keyboardNavigationSupport: true,
  screenReaderSupport: true,
  
  /**
   * Feature support matrix
   */
  features: {
    lightMode: true,
    darkMode: true,
    systemMode: true,
    customVariants: true,
    accessibilityCompliance: true,
    keyboardNavigation: true,
    touchTargets: true,
    transitionAnimations: true,
    loadingStates: true,
    errorHandling: true,
  },
  
  /**
   * Supported environments
   */
  compatibility: {
    react: '>=19.0.0',
    nextjs: '>=15.1.0',
    typescript: '>=5.8.0',
    tailwindcss: '>=4.1.0',
    browsers: ['Chrome >=90', 'Firefox >=88', 'Safari >=14', 'Edge >=90'],
    devices: ['desktop', 'tablet', 'mobile'],
    assistiveTechnology: ['screenReaders', 'keyboardNavigation', 'voiceControl'],
  },
} as const;