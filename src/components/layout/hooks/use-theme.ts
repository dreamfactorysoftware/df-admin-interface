/**
 * Custom React hook for comprehensive theme management in DreamFactory Admin Interface.
 * 
 * Provides theme state management, system theme detection, localStorage persistence,
 * and Tailwind CSS integration for dynamic theme switching.
 * 
 * Replaces Angular DfThemeService with React hook patterns and Zustand state management.
 * 
 * Features:
 * - Light/dark/system theme preferences with automatic switching
 * - System theme detection using prefers-color-scheme media query
 * - Seamless Zustand store integration for global state management
 * - Tailwind CSS class application with dynamic CSS variable injection
 * - localStorage persistence (handled by Zustand persist middleware)
 * - WCAG 2.1 AA compliant theme switching with proper announcements
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Theme type definitions aligned with design system requirements.
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme configuration interface for advanced customization.
 */
export interface ThemeConfig {
  /** Enable smooth transitions when switching themes */
  enableTransitions?: boolean;
  /** Disable theme switching temporarily */
  disabled?: boolean;
  /** Force a specific theme regardless of user preference */
  forcedTheme?: ResolvedTheme;
  /** Custom storage key for theme persistence */
  storageKey?: string;
  /** Announce theme changes to screen readers */
  announceChanges?: boolean;
}

/**
 * Theme context data returned by the hook.
 */
export interface ThemeData {
  /** Current theme setting ('light' | 'dark' | 'system') */
  theme: ThemeMode;
  /** Resolved theme based on system preference if theme is 'system' */
  resolvedTheme: ResolvedTheme;
  /** Detected system theme preference */
  systemTheme: ResolvedTheme;
  /** Whether the component has mounted (prevents hydration mismatch) */
  mounted: boolean;
  /** Whether the current theme is dark */
  isDark: boolean;
  /** Whether the current theme is light */
  isLight: boolean;
  /** Whether system preference is being used */
  isSystemTheme: boolean;
  /** Update theme setting */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark modes */
  toggleTheme: () => void;
  /** Apply theme classes to document */
  applyTheme: (theme?: ResolvedTheme) => void;
  /** Check if theme switching is available */
  canSwitchTheme: boolean;
}

/**
 * Custom React hook for comprehensive theme management.
 * 
 * Integrates with Zustand app store and provides system theme detection,
 * Tailwind CSS class application, and accessibility features.
 * 
 * @param config - Optional theme configuration
 * @returns Theme management interface
 * 
 * @example
 * ```tsx
 * function ThemeToggleButton() {
 *   const { theme, toggleTheme, isDark, mounted } = useTheme();
 *   
 *   if (!mounted) return null; // Prevent hydration mismatch
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDark ? '☀️ Light' : '🌙 Dark'} Mode
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function ThemeAwareComponent() {
 *   const { resolvedTheme, isSystemTheme } = useTheme();
 *   
 *   return (
 *     <div className={`
 *       ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
 *       ${isSystemTheme ? 'border-blue-500' : 'border-gray-300'}
 *     `}>
 *       Content adapts to theme
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(config: ThemeConfig = {}): ThemeData {
  const {
    enableTransitions = true,
    disabled = false,
    forcedTheme,
    storageKey = 'dreamfactory-admin-theme',
    announceChanges = true,
  } = config;

  // Access Zustand store theme state
  const {
    theme,
    resolvedTheme,
    setTheme: setStoreTheme,
    setResolvedTheme,
  } = useAppStore((state) => ({
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    setTheme: state.setTheme,
    setResolvedTheme: state.setResolvedTheme,
  }));

  /**
   * System theme detection using prefers-color-scheme media query.
   * Updates resolved theme when system preference changes.
   */
  useEffect(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme: ResolvedTheme = mediaQuery.matches ? 'dark' : 'light';

    // Update resolved theme based on current theme setting
    const newResolvedTheme = forcedTheme || (theme === 'system' ? systemTheme : theme);
    
    if (newResolvedTheme !== resolvedTheme) {
      setResolvedTheme(newResolvedTheme);
    }

    /**
     * Handle system theme preference changes.
     * Automatically updates resolved theme when user changes OS theme.
     */
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const newSystemTheme: ResolvedTheme = event.matches ? 'dark' : 'light';
      
      // Only update if currently using system theme
      if (theme === 'system' && !forcedTheme) {
        setResolvedTheme(newSystemTheme);
        
        // Announce theme change to screen readers
        if (announceChanges) {
          announceThemeChange(newSystemTheme, 'system');
        }
      }
    };

    // Add event listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Cleanup event listener
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, resolvedTheme, setResolvedTheme, forcedTheme, announceChanges]);

  /**
   * Apply theme classes to document root and manage CSS variables.
   * Integrates with Tailwind CSS dark mode and provides custom properties.
   */
  const applyTheme = useCallback((targetTheme?: ResolvedTheme) => {
    if (typeof window === 'undefined' || disabled) return;

    const themeToApply = targetTheme || forcedTheme || resolvedTheme;
    const root = document.documentElement;

    // Temporarily disable transitions if requested
    if (!enableTransitions) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
      );
      document.head.appendChild(css);
      
      // Re-enable transitions after a frame
      requestAnimationFrame(() => {
        document.head.removeChild(css);
      });
    }

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class for Tailwind CSS
    root.classList.add(themeToApply);
    
    // Set data attribute for additional styling hooks
    root.setAttribute('data-theme', themeToApply);
    root.setAttribute('data-color-scheme', themeToApply);

    // Update CSS custom properties for dynamic theming
    const cssVariables = getCSSVariablesForTheme(themeToApply);
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(themeToApply);

    // Update favicon if theme-specific versions exist
    updateFavicon(themeToApply);
  }, [resolvedTheme, forcedTheme, disabled, enableTransitions]);

  /**
   * Set theme with validation and accessibility announcements.
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (disabled || !['light', 'dark', 'system'].includes(newTheme)) return;

    // Update store theme (automatically persisted by Zustand)
    setStoreTheme(newTheme);

    // Determine and apply resolved theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme: ResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
    const newResolvedTheme = forcedTheme || (newTheme === 'system' ? systemTheme : newTheme);
    
    setResolvedTheme(newResolvedTheme);

    // Announce theme change to screen readers
    if (announceChanges) {
      announceThemeChange(newResolvedTheme, newTheme);
    }
  }, [disabled, setStoreTheme, setResolvedTheme, forcedTheme, announceChanges]);

  /**
   * Toggle between light and dark themes.
   * If currently on system, switches to opposite of current system preference.
   */
  const toggleTheme = useCallback(() => {
    if (disabled) return;

    let newTheme: ThemeMode;
    
    if (theme === 'system') {
      // If on system theme, switch to opposite of current resolved theme
      newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    } else {
      // Toggle between light and dark
      newTheme = theme === 'dark' ? 'light' : 'dark';
    }
    
    setTheme(newTheme);
  }, [theme, resolvedTheme, setTheme, disabled]);

  // Apply theme whenever resolved theme changes
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Detect system theme preference for reference
  const systemTheme = useMemo<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  }, []);

  // Computed theme properties
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystemTheme = theme === 'system';
  const canSwitchTheme = !disabled && !forcedTheme;
  
  // Prevent hydration mismatch by checking if component has mounted
  const mounted = typeof window !== 'undefined';

  return {
    theme,
    resolvedTheme: forcedTheme || resolvedTheme,
    systemTheme,
    mounted,
    isDark,
    isLight,
    isSystemTheme,
    setTheme,
    toggleTheme,
    applyTheme,
    canSwitchTheme,
  };
}

/**
 * Get CSS custom properties for the specified theme.
 * Provides dynamic color values for advanced theming beyond Tailwind classes.
 */
function getCSSVariablesForTheme(theme: ResolvedTheme): Record<string, string> {
  const lightTheme = {
    '--df-bg-primary': '#ffffff',
    '--df-bg-secondary': '#f8fafc',
    '--df-text-primary': '#0f172a',
    '--df-text-secondary': '#475569',
    '--df-border-primary': '#e2e8f0',
    '--df-border-secondary': '#cbd5e1',
    '--df-accent-primary': '#6366f1',
    '--df-accent-secondary': '#f59e0b',
    '--df-success': '#16a34a',
    '--df-warning': '#d97706',
    '--df-error': '#dc2626',
    '--df-shadow': 'rgba(0, 0, 0, 0.1)',
    '--df-overlay': 'rgba(0, 0, 0, 0.5)',
  };

  const darkTheme = {
    '--df-bg-primary': '#0f172a',
    '--df-bg-secondary': '#1e293b',
    '--df-text-primary': '#f8fafc',
    '--df-text-secondary': '#cbd5e1',
    '--df-border-primary': '#334155',
    '--df-border-secondary': '#475569',
    '--df-accent-primary': '#818cf8',
    '--df-accent-secondary': '#fbbf24',
    '--df-success': '#4ade80',
    '--df-warning': '#fbbf24',
    '--df-error': '#f87171',
    '--df-shadow': 'rgba(0, 0, 0, 0.3)',
    '--df-overlay': 'rgba(0, 0, 0, 0.7)',
  };

  return theme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Update meta theme-color for mobile browsers.
 * Provides native mobile browser chrome theming.
 */
function updateMetaThemeColor(theme: ResolvedTheme): void {
  const themeColor = theme === 'dark' ? '#0f172a' : '#ffffff';
  
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeColorMeta);
  }
  
  themeColorMeta.setAttribute('content', themeColor);
}

/**
 * Update favicon based on theme if theme-specific versions exist.
 */
function updateFavicon(theme: ResolvedTheme): void {
  const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  
  if (faviconLink) {
    const currentHref = faviconLink.href;
    const themeSpecificHref = currentHref.replace(
      /favicon(-dark|-light)?\.ico/,
      `favicon-${theme}.ico`
    );
    
    // Only update if theme-specific favicon exists
    // (This would require a server check in production)
    if (theme === 'dark') {
      faviconLink.href = themeSpecificHref;
    }
  }
}

/**
 * Announce theme changes to screen readers for accessibility.
 * Provides WCAG 2.1 AA compliant status announcements.
 */
function announceThemeChange(resolvedTheme: ResolvedTheme, themeMode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  const message = themeMode === 'system' 
    ? `Theme automatically switched to ${resolvedTheme} mode based on system preference`
    : `Theme switched to ${resolvedTheme} mode`;

  // Create live region for screen reader announcement
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove announcement after screen readers have processed it
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Higher-order component for theme-aware styling.
 * Provides consistent theme integration patterns for components.
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { themeOverride?: ResolvedTheme }> {
  return function ThemedComponent({ themeOverride, ...props }: P & { themeOverride?: ResolvedTheme }) {
    const { resolvedTheme } = useTheme({ forcedTheme: themeOverride });
    
    return (
      <div data-theme={resolvedTheme} className={resolvedTheme}>
        <Component {...(props as P)} />
      </div>
    );
  };
}

/**
 * Utility function to generate theme-aware class names.
 * Simplifies conditional Tailwind class application.
 */
export function themeClasses(
  lightClasses: string,
  darkClasses: string,
  resolvedTheme?: ResolvedTheme
): string {
  const { resolvedTheme: currentTheme } = useTheme();
  const theme = resolvedTheme || currentTheme;
  
  return theme === 'dark' ? darkClasses : lightClasses;
}

/**
 * Theme persistence manager for advanced use cases.
 * Provides manual control over theme storage and retrieval.
 */
export const themeStorage = {
  /**
   * Get stored theme preference from localStorage.
   */
  getStoredTheme: (key = 'dreamfactory-admin-theme'): ThemeMode | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(key);
      return stored as ThemeMode || null;
    } catch {
      return null;
    }
  },

  /**
   * Set theme preference in localStorage.
   */
  setStoredTheme: (theme: ThemeMode, key = 'dreamfactory-admin-theme'): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, theme);
    } catch {
      // Silently fail if localStorage is unavailable
    }
  },

  /**
   * Clear stored theme preference.
   */
  clearStoredTheme: (key = 'dreamfactory-admin-theme'): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is unavailable
    }
  },
};