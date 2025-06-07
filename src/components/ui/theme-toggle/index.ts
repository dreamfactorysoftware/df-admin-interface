/**
 * Theme Toggle Component System - Barrel Export
 * 
 * Centralized export hub for theme toggle components, variants, utilities, and TypeScript types.
 * Provides clean imports for React 19/Next.js 15.1 applications with tree-shaking optimization.
 * 
 * Features:
 * - Main ThemeToggle component with full accessibility support
 * - Preset component variants for common use cases
 * - Comprehensive variant utilities using class-variance-authority
 * - TypeScript type definitions for type-safe usage
 * - Design tokens and animation utilities
 * - Theme state management types
 * 
 * Usage Examples:
 * ```tsx
 * // Basic usage
 * import { ThemeToggle } from '@/components/ui/theme-toggle';
 * 
 * // Preset variants
 * import { CompactThemeToggle, DetailedThemeToggle } from '@/components/ui/theme-toggle';
 * 
 * // Utility functions and variants
 * import { 
 *   themeToggleVariants, 
 *   getThemeToggleClasses,
 *   themeToggleAnimations 
 * } from '@/components/ui/theme-toggle';
 * 
 * // Type definitions
 * import type { 
 *   ThemeToggleProps, 
 *   ThemeToggleVariantProps,
 *   ThemeMode 
 * } from '@/components/ui/theme-toggle';
 * ```
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// Main component exports
export {
  ThemeToggle,
  CompactThemeToggle,
  DetailedThemeToggle,
  KeyboardThemeToggle,
  type ThemeToggleProps,
} from './theme-toggle';

// Variant system exports
export {
  themeToggleVariants,
  getThemeToggleClasses,
  themeToggleIconSizes,
  themeToggleAnimations,
  themeToggleAriaLabels,
  themeToggleDesignTokens,
  type ThemeToggleVariantProps,
} from './theme-toggle-variants';

// Theme type definitions (re-exported for convenience)
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextState,
  ThemeProviderConfig,
  ThemeUtils,
  UseThemeReturn,
  ThemeStorage,
  ThemeTransition,
  SystemThemeConfig,
  ThemeError,
  ThemeValidation,
  ThemeCSSProperties,
  ThemeColorPalette,
} from '@/types/theme';

// Theme constants (re-exported for convenience)
export {
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
  THEME_ERROR_CODES,
} from '@/types/theme';

/**
 * Default export for convenient importing
 * Provides the main ThemeToggle component as default export
 * while maintaining named exports for all variants and utilities
 * 
 * @example
 * ```tsx
 * import ThemeToggle from '@/components/ui/theme-toggle';
 * // or
 * import { ThemeToggle } from '@/components/ui/theme-toggle';
 * ```
 */
export { ThemeToggle as default } from './theme-toggle';

/**
 * Utility function for creating custom theme toggle variants
 * Combines the theme toggle variant system with custom styling
 * 
 * @param props - Theme toggle variant props
 * @param customClasses - Additional CSS classes to apply
 * @returns Merged CSS class string optimized for Tailwind CSS
 * 
 * @example
 * ```tsx
 * import { createThemeToggleClasses } from '@/components/ui/theme-toggle';
 * 
 * const customClasses = createThemeToggleClasses(
 *   { variant: 'outline', size: 'lg', themeState: 'dark' },
 *   'custom-shadow border-4'
 * );
 * ```
 */
export const createThemeToggleClasses = getThemeToggleClasses;

/**
 * Theme toggle configuration presets for common scenarios
 * Provides pre-configured props objects for frequently used theme toggle setups
 */
export const THEME_TOGGLE_PRESETS = {
  /**
   * Compact preset for toolbars and navigation
   * Small size with ghost variant for minimal visual impact
   */
  toolbar: {
    size: 'sm' as const,
    variant: 'ghost' as const,
    showLabels: false,
    announceChanges: true,
  },

  /**
   * Settings page preset with full feature visibility
   * Large size with labels and detailed feedback
   */
  settings: {
    size: 'lg' as const,
    variant: 'outline' as const,
    showLabels: true,
    showCurrentState: true,
    announceChanges: true,
  },

  /**
   * Card preset for dashboard widgets
   * Medium size with secondary variant for cards
   */
  card: {
    size: 'md' as const,
    variant: 'secondary' as const,
    showLabels: false,
    showCurrentState: true,
  },

  /**
   * Mobile-optimized preset
   * Large touch targets with enhanced accessibility
   */
  mobile: {
    size: 'lg' as const,
    variant: 'default' as const,
    showLabels: false,
    announceChanges: true,
    tooltip: 'Tap to change theme',
  },

  /**
   * Minimal preset for integration in tight spaces
   * Extra small size with minimal visual styling
   */
  minimal: {
    size: 'sm' as const,
    variant: 'ghost' as const,
    showLabels: false,
    showCurrentState: false,
    announceChanges: false,
  },
} as const;

/**
 * Theme toggle accessibility helpers
 * Utility functions for enhanced accessibility support
 */
export const themeToggleA11y = {
  /**
   * Generate comprehensive ARIA label for theme toggle
   * @param currentTheme - Current theme mode
   * @returns ARIA label string
   */
  generateAriaLabel: (currentTheme: ThemeMode): string => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 
                    currentTheme === 'dark' ? 'system' : 'light';
    return `Theme toggle, currently ${currentTheme} mode. Press to switch to ${nextTheme} mode.`;
  },

  /**
   * Generate theme description for screen readers
   * @param theme - Theme mode
   * @param resolved - Resolved theme
   * @returns Description string
   */
  generateDescription: (theme: ThemeMode, resolved: ResolvedTheme): string => {
    const descriptions = {
      light: 'Uses light colors with dark text for better visibility in bright environments',
      dark: 'Uses dark colors with light text to reduce eye strain in low light conditions',
      system: `Automatically follows your device preference, currently using ${resolved} theme`,
    };
    return descriptions[theme];
  },

  /**
   * Get keyboard shortcuts for theme toggle
   * @returns Keyboard shortcuts object
   */
  getKeyboardShortcuts: () => ({
    toggle: ['Enter', 'Space'],
    next: ['ArrowRight', 'ArrowDown'],
    previous: ['ArrowLeft', 'ArrowUp'],
  }),
} as const;

/**
 * Theme toggle integration helpers
 * Utilities for integrating theme toggle with various UI patterns
 */
export const themeToggleIntegration = {
  /**
   * Header navigation integration props
   * Optimized for header/navigation bar usage
   */
  headerProps: {
    ...THEME_TOGGLE_PRESETS.toolbar,
    className: 'ml-auto',
    'aria-label': 'Toggle theme',
  },

  /**
   * Sidebar integration props
   * Optimized for sidebar placement
   */
  sidebarProps: {
    ...THEME_TOGGLE_PRESETS.settings,
    orientation: 'vertical' as const,
    className: 'w-full justify-start',
  },

  /**
   * Modal/dialog integration props
   * Optimized for modal and dialog usage
   */
  modalProps: {
    ...THEME_TOGGLE_PRESETS.card,
    className: 'self-start',
  },

  /**
   * Form integration props
   * Optimized for form field usage
   */
  formProps: {
    ...THEME_TOGGLE_PRESETS.settings,
    className: 'flex-shrink-0',
  },
} as const;

/**
 * Type utility for theme toggle preset keys
 * Enables type-safe usage of preset configurations
 */
export type ThemeTogglePreset = keyof typeof THEME_TOGGLE_PRESETS;

/**
 * Type utility for theme toggle integration keys
 * Enables type-safe usage of integration configurations
 */
export type ThemeToggleIntegration = keyof typeof themeToggleIntegration;

/**
 * React hook for theme toggle state management
 * Provides reactive theme toggle state with local storage persistence
 * 
 * Note: This is a convenience re-export. The actual implementation
 * should use the useTheme hook from the theme provider context.
 */
export { useTheme as useThemeToggle } from '@/components/layout/theme/use-theme';