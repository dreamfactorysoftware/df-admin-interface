/**
 * Custom React hook for comprehensive theme management in DreamFactory Admin Interface.
 * 
 * This hook replaces the Angular DfThemeService with React patterns, providing:
 * - Theme state management with light, dark, and system preference options
 * - LocalStorage persistence for theme preferences across browser sessions
 * - System theme detection with automatic switching based on user OS preferences
 * - Tailwind CSS integration with dynamic class application for theme changes
 * - Theme context provider integration for global theme state access
 * 
 * Integrates with Zustand state management and React context patterns for optimal performance
 * and maintainability in the React 19/Next.js 15.1 environment.
 * 
 * @version 1.0.0
 * @requires React 19.0.0 for enhanced hook performance and concurrent features
 * @requires Zustand 4.5.0 for lightweight state management
 * @requires Tailwind CSS 4.1+ for utility-first styling framework
 * @see Section 7.1.1 - Core UI Technologies framework stack
 * @see Section 4.3.1 - React Context State Flow patterns
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { 
  ThemeMode, 
  ResolvedTheme, 
  UseThemeReturn,
  ThemeStorage,
  ThemeUtils,
} from '@/types/theme';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * LocalStorage key for theme preference persistence.
 * Replaces Angular service-based storage with browser localStorage.
 */
const THEME_STORAGE_KEY = 'df-admin-theme';

/**
 * CSS class name applied to document element for dark mode.
 * Integrates with Tailwind CSS 4.1+ dark mode class strategy.
 */
const DARK_MODE_CLASS = 'dark';

/**
 * Media query for system theme preference detection.
 * Used with matchMedia API for automatic system theme updates.
 */
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * Transition CSS to prevent flash during theme changes.
 * Applied temporarily when switching themes for smooth transitions.
 */
const TRANSITION_DISABLE_CSS = `
*,
*::before,
*::after {
  transition-duration: 0s !important;
  animation-duration: 0s !important;
  animation-delay: 0s !important;
}
`;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Detects the system's preferred color scheme using matchMedia API.
 * Provides fallback handling for environments where matchMedia is unavailable.
 * 
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') {
    return 'light'; // Default to light mode on server
  }

  try {
    return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('useTheme: Unable to detect system theme preference:', error);
    return 'light';
  }
};

/**
 * Validates if a given theme mode is supported.
 * Provides type-safe theme validation for runtime checks.
 * 
 * @param theme - Theme value to validate
 * @returns True if theme is a valid ThemeMode
 */
const isValidTheme = (theme: string): theme is ThemeMode => {
  return ['light', 'dark', 'system'].includes(theme);
};

/**
 * Resolves the effective theme based on user preference and system setting.
 * Handles the 'system' theme mode by detecting actual system preference.
 * 
 * @param themeMode - User's theme preference
 * @param systemTheme - System's preferred theme
 * @returns The resolved theme ('light' or 'dark')
 */
const resolveTheme = (themeMode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme => {
  return themeMode === 'system' ? systemTheme : themeMode;
};

/**
 * Applies theme classes to document and updates CSS custom properties.
 * Integrates with Tailwind CSS 4.1+ dark mode class strategy and provides
 * enhanced theming through CSS custom properties.
 * 
 * @param resolvedTheme - The resolved theme to apply
 * @param selector - CSS selector for theme application (default: ':root')
 */
const applyTheme = (resolvedTheme: ResolvedTheme, selector: string = ':root'): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const documentElement = document.documentElement;
    
    // Apply Tailwind CSS dark mode class
    if (resolvedTheme === 'dark') {
      documentElement.classList.add(DARK_MODE_CLASS);
    } else {
      documentElement.classList.remove(DARK_MODE_CLASS);
    }

    // Update meta theme-color for mobile browser chrome theming
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#1e293b' : '#ffffff'
      );
    }

    // Update CSS custom properties for enhanced theming support
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--df-bg-primary', '#1e293b');
      root.style.setProperty('--df-bg-secondary', '#334155');
      root.style.setProperty('--df-bg-tertiary', '#475569');
      root.style.setProperty('--df-text-primary', '#f8fafc');
      root.style.setProperty('--df-text-secondary', '#cbd5e1');
      root.style.setProperty('--df-text-tertiary', '#94a3b8');
      root.style.setProperty('--df-border-primary', '#475569');
      root.style.setProperty('--df-border-secondary', '#334155');
    } else {
      root.style.setProperty('--df-bg-primary', '#ffffff');
      root.style.setProperty('--df-bg-secondary', '#f8fafc');
      root.style.setProperty('--df-bg-tertiary', '#f1f5f9');
      root.style.setProperty('--df-text-primary', '#1e293b');
      root.style.setProperty('--df-text-secondary', '#475569');
      root.style.setProperty('--df-text-tertiary', '#64748b');
      root.style.setProperty('--df-border-primary', '#e2e8f0');
      root.style.setProperty('--df-border-secondary', '#cbd5e1');
    }

    // Set data attribute for additional styling hooks
    documentElement.setAttribute('data-theme', resolvedTheme);
  } catch (error) {
    console.warn('useTheme: Unable to apply theme to document:', error);
  }
};

/**
 * Removes theme classes and CSS properties from document.
 * Provides cleanup functionality for theme removal.
 * 
 * @param selector - CSS selector for theme removal (default: ':root')
 */
const removeTheme = (selector: string = ':root'): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const documentElement = document.documentElement;
    documentElement.classList.remove(DARK_MODE_CLASS);
    documentElement.removeAttribute('data-theme');

    // Remove custom CSS properties
    const root = document.documentElement;
    const propertiesToRemove = [
      '--df-bg-primary',
      '--df-bg-secondary',
      '--df-bg-tertiary',
      '--df-text-primary',
      '--df-text-secondary',
      '--df-text-tertiary',
      '--df-border-primary',
      '--df-border-secondary',
    ];

    propertiesToRemove.forEach(property => {
      root.style.removeProperty(property);
    });
  } catch (error) {
    console.warn('useTheme: Unable to remove theme from document:', error);
  }
};

/**
 * Disables CSS transitions temporarily to prevent flash during theme changes.
 * Provides smooth theme transition experience by preventing jarring visual changes.
 */
const disableTransitions = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const css = document.createElement('style');
    css.appendChild(document.createTextNode(TRANSITION_DISABLE_CSS));
    document.head.appendChild(css);

    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          document.head.removeChild(css);
        } catch (error) {
          // Ignore errors if element was already removed
        }
      });
    });
  } catch (error) {
    console.warn('useTheme: Unable to disable transitions:', error);
  }
};

/**
 * Calculates contrast ratio between two colors for accessibility validation.
 * Used for ensuring WCAG compliance in theme color combinations.
 * 
 * @param foreground - Foreground color (hex format)
 * @param background - Background color (hex format)
 * @returns Contrast ratio as a number
 */
const getContrastRatio = (foreground: string, background: string): number => {
  // Simplified contrast ratio calculation
  // In a production app, you'd want a more robust color parsing library
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  try {
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (lightest + 0.05) / (darkest + 0.05);
  } catch (error) {
    console.warn('useTheme: Unable to calculate contrast ratio:', error);
    return 1; // Fallback to minimum contrast
  }
};

/**
 * Checks if color combination meets WCAG accessibility standards.
 * Validates contrast ratios for accessibility compliance.
 * 
 * @param foreground - Foreground color
 * @param background - Background color
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether text is considered large
 * @returns True if combination meets standards
 */
const meetsAccessibilityStandards = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const contrastRatio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  }
  
  // AA level
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
};

/**
 * Gets accessible color palette for the current theme.
 * Provides theme-appropriate colors that meet accessibility standards.
 * 
 * @param theme - The resolved theme
 * @returns Object with accessible color values
 */
const getAccessibleColors = (theme: ResolvedTheme) => {
  return theme === 'dark' 
    ? {
        text: '#f8fafc',
        background: '#1e293b',
        primary: '#6366f1',
        secondary: '#64748b',
      }
    : {
        text: '#1e293b',
        background: '#ffffff',
        primary: '#4f46e5',
        secondary: '#64748b',
      };
};

// =============================================================================
// Theme Storage Implementation
// =============================================================================

/**
 * LocalStorage implementation for theme persistence.
 * Replaces Angular service-based storage with browser localStorage.
 */
const themeStorage: ThemeStorage = {
  getTheme: (): ThemeMode | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && isValidTheme(stored)) {
        return stored as ThemeMode;
      }

      // Handle legacy Angular storage migration
      const legacyDarkMode = localStorage.getItem('isDarkMode');
      if (legacyDarkMode !== null) {
        const isLegacyDark = JSON.parse(legacyDarkMode);
        localStorage.removeItem('isDarkMode'); // Clean up legacy key
        const migratedTheme = isLegacyDark ? 'dark' : 'light';
        
        // Save migrated theme
        localStorage.setItem(THEME_STORAGE_KEY, migratedTheme);
        return migratedTheme;
      }
    } catch (error) {
      console.warn('useTheme: Unable to load theme from localStorage:', error);
    }

    return null;
  },

  setTheme: (theme: ThemeMode): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('useTheme: Unable to save theme to localStorage:', error);
    }
  },

  removeTheme: (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.warn('useTheme: Unable to remove theme from localStorage:', error);
    }
  },

  isAvailable: (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__theme_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
};

// =============================================================================
// Main Hook Implementation
// =============================================================================

/**
 * Custom React hook for comprehensive theme management.
 * 
 * Provides complete theme functionality including state management, persistence,
 * system detection, and Tailwind CSS integration. Replaces Angular DfThemeService
 * with modern React patterns and Zustand state management.
 * 
 * @returns Complete theme management interface with state and utilities
 */
export function useTheme(): UseThemeReturn {
  // =============================================================================
  // State Management with Zustand
  // =============================================================================

  const {
    theme,
    resolvedTheme: storedResolvedTheme,
    setTheme: setThemeInStore,
    setResolvedTheme: setResolvedThemeInStore,
  } = useAppStore(state => ({
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    setTheme: state.setTheme,
    setResolvedTheme: state.setResolvedTheme,
  }));

  // =============================================================================
  // System Theme Detection
  // =============================================================================

  /**
   * Gets current system theme preference.
   * Cached computation to avoid repeated matchMedia calls.
   */
  const systemTheme = useMemo(() => getSystemTheme(), []);

  /**
   * Resolves effective theme based on current settings.
   * Handles 'system' mode by using detected system preference.
   */
  const resolvedTheme = useMemo(() => {
    return resolveTheme(theme, systemTheme);
  }, [theme, systemTheme]);

  /**
   * Determines if theme system has been properly initialized.
   * Prevents flash of unstyled content during initialization.
   */
  const mounted = useMemo(() => {
    return typeof window !== 'undefined' && theme !== null;
  }, [theme]);

  // =============================================================================
  // Theme Actions
  // =============================================================================

  /**
   * Sets theme mode with persistence and immediate application.
   * Replaces Angular service setThemeMode with React state management.
   * 
   * @param newTheme - Theme mode to apply
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!isValidTheme(newTheme)) {
      console.warn('useTheme: Invalid theme mode:', newTheme);
      return;
    }

    // Disable transitions to prevent flash
    disableTransitions();

    // Update Zustand store
    setThemeInStore(newTheme);

    // Persist to localStorage
    themeStorage.setTheme(newTheme);

    // Update resolved theme
    const newResolvedTheme = resolveTheme(newTheme, systemTheme);
    setResolvedThemeInStore(newResolvedTheme);

    // Apply theme to document
    applyTheme(newResolvedTheme);
  }, [setThemeInStore, setResolvedThemeInStore, systemTheme]);

  /**
   * Toggles between light and dark themes.
   * Provides convenient theme switching functionality.
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  /**
   * Resets theme to system preference.
   * Provides quick access to system-based theming.
   */
  const resetToSystem = useCallback(() => {
    setTheme('system');
  }, [setTheme]);

  // =============================================================================
  // Theme Validation Functions
  // =============================================================================

  /**
   * Checks if current theme matches the given mode.
   * 
   * @param mode - Theme mode to check against
   * @returns True if current theme matches mode
   */
  const isTheme = useCallback((mode: ThemeMode): boolean => {
    return theme === mode;
  }, [theme]);

  /**
   * Checks if current resolved theme matches the given mode.
   * 
   * @param mode - Resolved theme mode to check against
   * @returns True if current resolved theme matches mode
   */
  const isResolvedTheme = useCallback((mode: ResolvedTheme): boolean => {
    return resolvedTheme === mode;
  }, [resolvedTheme]);

  // =============================================================================
  // Theme Utilities
  // =============================================================================

  /**
   * Theme utility functions for color management and accessibility.
   */
  const themeUtils: ThemeUtils = useMemo(() => ({
    getSystemTheme,
    isThemeSupported: () => typeof window !== 'undefined' && 'matchMedia' in window,
    isValidTheme,
    getAccessibleColors: (theme: ResolvedTheme) => getAccessibleColors(theme),
    applyTheme,
    removeTheme,
    getContrastRatio,
    meetsAccessibilityStandards,
  }), []);

  // =============================================================================
  // System Theme Change Detection
  // =============================================================================

  /**
   * Set up system theme change detection.
   * Monitors system preferences and updates theme accordingly.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    let mediaQuery: MediaQueryList;

    try {
      mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        
        // Only update if current theme is 'system'
        if (theme === 'system') {
          const newResolvedTheme = resolveTheme('system', newSystemTheme);
          setResolvedThemeInStore(newResolvedTheme);
          applyTheme(newResolvedTheme);
        }
      };

      // Add event listener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleSystemThemeChange);
      }

      // Cleanup function
      return () => {
        if (mediaQuery) {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
          } else {
            // Fallback for older browsers
            mediaQuery.removeListener(handleSystemThemeChange);
          }
        }
      };
    } catch (error) {
      console.warn('useTheme: Error setting up system theme detection:', error);
    }
  }, [theme, setResolvedThemeInStore]);

  // =============================================================================
  // Initial Theme Application
  // =============================================================================

  /**
   * Apply initial theme on mount and when resolved theme changes.
   * Ensures proper theme application after component mount.
   */
  useEffect(() => {
    if (!mounted) {
      return;
    }

    // Load theme from storage if not already set
    if (!theme) {
      const storedTheme = themeStorage.getTheme();
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        setTheme('system');
      }
      return;
    }

    // Apply current resolved theme
    const currentResolvedTheme = resolveTheme(theme, systemTheme);
    setResolvedThemeInStore(currentResolvedTheme);
    applyTheme(currentResolvedTheme);
  }, [mounted, theme, setTheme, setResolvedThemeInStore, systemTheme]);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Theme State
    theme,
    resolvedTheme,
    systemTheme,
    mounted,
    
    // Theme Actions
    setTheme,
    toggleTheme,
    resetToSystem,
    
    // Theme Validation
    isTheme,
    isResolvedTheme,
    
    // Theme Utilities
    ...themeUtils,
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default useTheme;

// =============================================================================
// Type Re-exports for Convenience
// =============================================================================

export type {
  ThemeMode,
  ResolvedTheme,
  UseThemeReturn,
  ThemeStorage,
  ThemeUtils,
} from '@/types/theme';