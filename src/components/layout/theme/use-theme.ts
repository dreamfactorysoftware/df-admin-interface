'use client';

/**
 * Enhanced Theme Hook for DreamFactory Admin Interface
 * 
 * Custom React hook providing comprehensive access to theme context state, actions,
 * and utility methods. Replaces Angular service injection pattern with React context
 * consumption, offering type-safe theme management with extensive validation and
 * detection capabilities.
 * 
 * Features:
 * - Complete theme context access with error boundary protection
 * - Utility methods for theme validation, detection, and accessibility checking
 * - TypeScript generics for type-safe theme value access and manipulation
 * - System theme detection with browser compatibility checking
 * - WCAG 2.1 AA compliance utilities for accessible color combinations
 * - Theme persistence and storage management integration
 * 
 * @version 1.0.0
 * @since React 19.0.0
 */

import { useContext, useMemo, useCallback } from 'react';
import { 
  ThemeMode, 
  ResolvedTheme, 
  UseThemeReturn,
  ThemeError,
  THEME_ERROR_CODES,
  THEME_CONSTANTS
} from '@/types/theme';
import { ThemeContext } from './theme-provider';

/**
 * System theme detection utility functions
 * Provides safe browser compatibility checking and fallback handling
 */
const systemThemeUtils = {
  /**
   * Detect current system color scheme preference
   * @returns System theme preference (light or dark)
   */
  getSystemTheme: (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('System theme detection failed:', error);
      return 'light';
    }
  },

  /**
   * Check if current environment supports theme detection
   * @returns Boolean indicating theme detection support
   */
  isThemeSupported: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      return 'matchMedia' in window && 
             typeof window.matchMedia === 'function' &&
             window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY).media !== 'not all';
    } catch (error) {
      return false;
    }
  },

  /**
   * Validate theme mode is supported
   * @param theme - Theme value to validate
   * @returns Type predicate for ThemeMode
   */
  isValidTheme: (theme: string): theme is ThemeMode => {
    return ['light', 'dark', 'system'].includes(theme);
  }
};

/**
 * Color accessibility utility functions
 * Implements WCAG 2.1 guidelines for color contrast and accessibility
 */
const accessibilityUtils = {
  /**
   * Get accessible color pair for current theme
   * @param theme - Resolved theme mode
   * @returns Object with accessible color values
   */
  getAccessibleColors: (theme: ResolvedTheme) => {
    const colorPairs = {
      light: {
        text: '#0f172a',           // slate-900
        background: '#ffffff',     // white
        primary: '#1e40af',        // blue-700
        secondary: '#64748b'       // slate-500
      },
      dark: {
        text: '#f8fafc',           // slate-50
        background: '#0f172a',     // slate-900
        primary: '#3b82f6',        // blue-500
        secondary: '#94a3b8'       // slate-400
      }
    };

    return colorPairs[theme];
  },

  /**
   * Convert hex color to RGB values
   * @param hex - Hex color string
   * @returns RGB values or null if invalid
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Calculate relative luminance of a color
   * @param color - RGB color object
   * @returns Relative luminance value
   */
  getRelativeLuminance: (color: { r: number; g: number; b: number }): number => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Get contrast ratio between two colors
   * @param foreground - Foreground color hex string
   * @param background - Background color hex string
   * @returns Contrast ratio value
   */
  getContrastRatio: (foreground: string, background: string): number => {
    const fgRgb = accessibilityUtils.hexToRgb(foreground);
    const bgRgb = accessibilityUtils.hexToRgb(background);
    
    if (!fgRgb || !bgRgb) return 1;
    
    const fgLuminance = accessibilityUtils.getRelativeLuminance(fgRgb);
    const bgLuminance = accessibilityUtils.getRelativeLuminance(bgRgb);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if color combination meets WCAG standards
   * @param foreground - Foreground color hex string
   * @param background - Background color hex string
   * @param level - WCAG compliance level ('AA' or 'AAA')
   * @param isLargeText - Whether text is considered large (14pt bold or 18pt+)
   * @returns Boolean indicating compliance
   */
  meetsAccessibilityStandards: (
    foreground: string, 
    background: string, 
    level: 'AA' | 'AAA' = 'AA',
    isLargeText = false
  ): boolean => {
    const ratio = accessibilityUtils.getContrastRatio(foreground, background);
    
    const thresholds = {
      AA: isLargeText ? 3 : 4.5,
      AAA: isLargeText ? 4.5 : 7
    };
    
    return ratio >= thresholds[level];
  }
};

/**
 * DOM manipulation utilities for theme application
 * Handles theme class application and cleanup with error handling
 */
const domUtils = {
  /**
   * Apply theme classes to document
   * @param theme - Resolved theme to apply
   * @param selector - CSS selector for theme application
   */
  applyTheme: (theme: ResolvedTheme, selector = ':root'): void => {
    if (typeof window === 'undefined') return;

    try {
      const targetElement = selector === ':root' 
        ? document.documentElement 
        : document.querySelector(selector);

      if (!targetElement) {
        console.warn(`Theme target element not found: ${selector}`);
        return;
      }

      // Apply Tailwind dark mode class
      if (theme === 'dark') {
        targetElement.classList.add('dark');
      } else {
        targetElement.classList.remove('dark');
      }

      // Set data attribute for additional styling hooks
      targetElement.setAttribute('data-theme', theme);
    } catch (error) {
      console.error('Failed to apply theme to DOM:', error);
    }
  },

  /**
   * Remove theme classes from document
   * @param selector - CSS selector for theme removal
   */
  removeTheme: (selector = ':root'): void => {
    if (typeof window === 'undefined') return;

    try {
      const targetElement = selector === ':root' 
        ? document.documentElement 
        : document.querySelector(selector);

      if (!targetElement) return;

      targetElement.classList.remove('dark');
      targetElement.removeAttribute('data-theme');
    } catch (error) {
      console.error('Failed to remove theme from DOM:', error);
    }
  }
};

/**
 * Enhanced Theme Hook
 * 
 * Provides comprehensive access to theme context state and utility methods.
 * Must be used within a ThemeProvider component tree for proper context access.
 * 
 * @returns Complete theme management interface with utilities
 * @throws {ThemeError} When used outside of ThemeProvider context
 * 
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { 
 *     theme, 
 *     resolvedTheme, 
 *     toggleTheme, 
 *     isTheme,
 *     meetsAccessibilityStandards 
 *   } = useTheme();
 *   
 *   const isAccessible = meetsAccessibilityStandards('#000000', '#ffffff');
 *   
 *   return (
 *     <button 
 *       onClick={toggleTheme}
 *       className={`theme-toggle ${resolvedTheme}`}
 *     >
 *       Switch to {isTheme('light') ? 'dark' : 'light'} mode
 *       {isAccessible && <span>✓ Accessible</span>}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Get theme context with error handling
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new ThemeError(
      'useTheme must be used within a ThemeProvider. Make sure to wrap your component tree with <ThemeProvider>.',
      THEME_ERROR_CODES.PROVIDER_NOT_FOUND
    );
  }

  const { theme, resolvedTheme, systemTheme, setTheme, mounted } = context;

  /**
   * Toggle between light and dark themes
   * Handles system theme mode by switching to opposite of resolved theme
   */
  const toggleTheme = useCallback((): void => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, resolvedTheme, setTheme]);

  /**
   * Reset theme to system preference
   * Switches current theme mode to 'system' for automatic detection
   */
  const resetToSystem = useCallback((): void => {
    setTheme('system');
  }, [setTheme]);

  /**
   * Check if current theme matches given mode
   * @param mode - Theme mode to compare against
   * @returns Boolean indicating theme match
   */
  const isTheme = useCallback((mode: ThemeMode): boolean => {
    return theme === mode;
  }, [theme]);

  /**
   * Check if current resolved theme matches given mode
   * @param mode - Resolved theme mode to compare against
   * @returns Boolean indicating resolved theme match
   */
  const isResolvedTheme = useCallback((mode: ResolvedTheme): boolean => {
    return resolvedTheme === mode;
  }, [resolvedTheme]);

  /**
   * Memoized utility methods for performance optimization
   * Provides stable references to prevent unnecessary re-renders
   */
  const utils = useMemo(() => ({
    // System theme detection utilities
    getSystemTheme: systemThemeUtils.getSystemTheme,
    isThemeSupported: systemThemeUtils.isThemeSupported,
    isValidTheme: systemThemeUtils.isValidTheme,

    // Accessibility utilities
    getAccessibleColors: accessibilityUtils.getAccessibleColors,
    getContrastRatio: accessibilityUtils.getContrastRatio,
    meetsAccessibilityStandards: accessibilityUtils.meetsAccessibilityStandards,

    // DOM manipulation utilities
    applyTheme: domUtils.applyTheme,
    removeTheme: domUtils.removeTheme
  }), []);

  /**
   * Return complete theme management interface
   * Combines context state with utility methods and convenience functions
   */
  return useMemo((): UseThemeReturn => ({
    // Theme context state
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    mounted,

    // Convenience methods
    toggleTheme,
    resetToSystem,
    isTheme,
    isResolvedTheme,

    // Utility methods
    ...utils
  }), [
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    mounted,
    toggleTheme,
    resetToSystem,
    isTheme,
    isResolvedTheme,
    utils
  ]);
}

/**
 * Type-safe theme hook for specific theme value access
 * Provides narrowed typing for components that only need specific theme values
 * 
 * @template T - Theme property to extract
 * @param property - Theme property name to access
 * @returns Specific theme value with proper typing
 * 
 * @example
 * ```tsx
 * function ThemeIndicator() {
 *   const currentTheme = useThemeValue('resolvedTheme');
 *   // currentTheme is typed as ResolvedTheme ('light' | 'dark')
 *   
 *   return <div>Current theme: {currentTheme}</div>;
 * }
 * ```
 */
export function useThemeValue<T extends keyof UseThemeReturn>(
  property: T
): UseThemeReturn[T] {
  const theme = useTheme();
  return theme[property];
}

/**
 * Conditional theme hook for performance optimization
 * Only re-renders when specific theme conditions change
 * 
 * @param condition - Function to determine when to update
 * @returns Theme context value only when condition is met
 * 
 * @example
 * ```tsx
 * function DarkModeOnlyComponent() {
 *   const isDark = useThemeCondition(
 *     (theme) => theme.resolvedTheme === 'dark'
 *   );
 *   
 *   if (!isDark) return null;
 *   
 *   return <div>This only renders in dark mode</div>;
 * }
 * ```
 */
export function useThemeCondition(
  condition: (theme: UseThemeReturn) => boolean
): boolean {
  const theme = useTheme();
  return useMemo(() => condition(theme), [theme, condition]);
}

// Re-export types for convenience
export type { 
  ThemeMode, 
  ResolvedTheme, 
  UseThemeReturn,
  ThemeError 
} from '@/types/theme';

// Default export
export default useTheme;