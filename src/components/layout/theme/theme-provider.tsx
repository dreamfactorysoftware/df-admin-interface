'use client';

/**
 * Theme Provider Component for DreamFactory Admin Interface
 * 
 * React 19 context provider that manages application theme state including
 * light, dark, and system preference detection. Replaces Angular DfThemeService
 * with React context pattern, integrates with Tailwind CSS dark mode class strategy,
 * provides persistent theme storage, and supports system theme detection via media queries.
 * 
 * Features:
 * - React 19.0 stable context API for theme state management across the application
 * - Support for light, dark, and system theme preferences with automatic system detection
 * - Tailwind CSS 4.1+ dark mode integration using class strategy for theme switching
 * - LocalStorage persistence for user theme preferences with 'df-admin-theme' key
 * - System preference detection via matchMedia API with automatic updates on change
 * - Mobile browser theme-color meta tag updates for consistent native integration
 * - Theme transition disabling functionality to prevent flash during theme changes
 * 
 * @version 1.0.0
 * @since React 19.0.0
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  ReactNode 
} from 'react';
import { 
  ThemeMode, 
  ResolvedTheme, 
  ThemeContextState, 
  ThemeProviderConfig,
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
  ThemeError,
  THEME_ERROR_CODES
} from '@/types/theme';

/**
 * Theme context instance - provides theme state and methods to child components
 * Throws error if used outside of ThemeProvider to ensure proper provider wrapping
 */
const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

/**
 * Theme provider props interface extending standard React component props
 */
interface ThemeProviderProps extends Partial<ThemeProviderConfig> {
  /** Child components that will have access to theme context */
  children: ReactNode;
  /** Optional CSS class name for the provider wrapper */
  className?: string;
  /** Whether to apply theme immediately on mount (default: true) */
  forcedTheme?: ThemeMode;
  /** Custom theme color values for meta tag updates */
  themeColors?: {
    light: string;
    dark: string;
  };
}

/**
 * Storage utility for theme persistence in localStorage
 * Handles graceful fallback when localStorage is not available
 */
const themeStorage = {
  /**
   * Retrieve stored theme preference from localStorage
   * @returns Stored theme mode or null if not found/unavailable
   */
  getTheme: (): ThemeMode | null => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode;
      }
      return null;
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return null;
    }
  },

  /**
   * Store theme preference in localStorage
   * @param theme - Theme mode to store
   */
  setTheme: (theme: ThemeMode): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  },

  /**
   * Remove stored theme preference
   */
  removeTheme: (): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(THEME_CONSTANTS.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to remove theme from localStorage:', error);
    }
  }
};

/**
 * System theme detection utility using matchMedia API
 * Provides safe fallback for server-side rendering
 */
const systemThemeDetector = {
  /**
   * Get current system theme preference
   * @returns Current system theme (light or dark)
   */
  getSystemTheme: (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('Failed to detect system theme:', error);
      return 'light';
    }
  },

  /**
   * Add listener for system theme changes
   * @param callback - Function to call when system theme changes
   * @returns Cleanup function to remove the listener
   */
  addSystemThemeListener: (callback: (theme: ResolvedTheme) => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    try {
      const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
      const handleChange = (e: MediaQueryListEvent) => {
        callback(e.matches ? 'dark' : 'light');
      };

      // Modern browsers support addEventListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }

      return () => {};
    } catch (error) {
      console.warn('Failed to add system theme listener:', error);
      return () => {};
    }
  }
};

/**
 * Theme application utility for DOM manipulation
 * Handles Tailwind CSS class application and meta tag updates
 */
const themeApplicator = {
  /**
   * Apply theme class to document element for Tailwind CSS
   * @param theme - Resolved theme to apply
   * @param disableTransition - Whether to disable CSS transitions during change
   */
  applyTheme: (theme: ResolvedTheme, disableTransition = false): void => {
    if (typeof window === 'undefined') return;

    try {
      const { documentElement } = document;
      
      // Disable transitions to prevent flash during theme change
      if (disableTransition) {
        const style = document.createElement('style');
        style.innerHTML = `
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);

        // Re-enable transitions after a frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.head.removeChild(style);
          });
        });
      }

      // Apply or remove dark class for Tailwind CSS
      if (theme === 'dark') {
        documentElement.classList.add('dark');
      } else {
        documentElement.classList.remove('dark');
      }

      // Update data attribute for additional styling support
      documentElement.setAttribute('data-theme', theme);
    } catch (error) {
      console.warn('Failed to apply theme to document:', error);
    }
  },

  /**
   * Update mobile browser theme-color meta tag
   * @param theme - Current resolved theme
   * @param customColors - Custom color values for themes
   */
  updateMetaThemeColor: (
    theme: ResolvedTheme, 
    customColors?: { light: string; dark: string }
  ): void => {
    if (typeof window === 'undefined') return;

    try {
      // Default theme colors matching DreamFactory brand
      const defaultColors = {
        light: '#ffffff',
        dark: '#0f172a'
      };

      const colors = customColors || defaultColors;
      const themeColor = colors[theme];

      // Find existing meta theme-color tag or create new one
      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTag);
      }

      metaTag.setAttribute('content', themeColor);
    } catch (error) {
      console.warn('Failed to update meta theme-color:', error);
    }
  }
};

/**
 * Theme Provider Component
 * 
 * Provides theme state management across the entire application using React 19 context.
 * Handles theme persistence, system preference detection, and Tailwind CSS integration.
 * 
 * @param props - Theme provider configuration and children
 * @returns Theme provider with context value
 */
export function ThemeProvider({
  children,
  className,
  defaultTheme = DEFAULT_THEME_CONFIG.defaultTheme,
  storageKey = DEFAULT_THEME_CONFIG.storageKey,
  enableSystem = DEFAULT_THEME_CONFIG.enableSystem,
  disableTransitionOnChange = DEFAULT_THEME_CONFIG.disableTransitionOnChange,
  forcedTheme,
  themeColors,
  ...config
}: ThemeProviderProps) {
  // Theme state management
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  /**
   * Resolve the current theme considering system preference
   */
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (forcedTheme && forcedTheme !== 'system') {
      return forcedTheme as ResolvedTheme;
    }
    
    if (theme === 'system') {
      return systemTheme;
    }
    
    return theme as ResolvedTheme;
  }, [theme, systemTheme, forcedTheme]);

  /**
   * Update theme preference and persist to storage
   */
  const setTheme = useCallback((newTheme: ThemeMode): void => {
    try {
      // Validate theme mode
      if (!['light', 'dark', 'system'].includes(newTheme)) {
        throw new ThemeError(
          `Invalid theme mode: ${newTheme}. Must be 'light', 'dark', or 'system'.`,
          THEME_ERROR_CODES.INVALID_THEME
        );
      }

      setThemeState(newTheme);
      
      // Persist to localStorage unless using forced theme
      if (!forcedTheme) {
        themeStorage.setTheme(newTheme);
      }
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  }, [forcedTheme]);

  /**
   * Initialize theme from storage or system preference on mount
   */
  useEffect(() => {
    try {
      // Skip initialization if theme is forced
      if (forcedTheme) {
        setMounted(true);
        return;
      }

      // Get stored theme preference
      const storedTheme = themeStorage.getTheme();
      
      if (storedTheme) {
        setThemeState(storedTheme);
      } else if (enableSystem) {
        // No stored preference, use system if enabled
        setThemeState('system');
      }

      // Detect initial system theme
      const initialSystemTheme = systemThemeDetector.getSystemTheme();
      setSystemTheme(initialSystemTheme);

      setMounted(true);
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      setMounted(true);
    }
  }, [forcedTheme, enableSystem]);

  /**
   * Set up system theme detection listener
   */
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const cleanup = systemThemeDetector.addSystemThemeListener((newSystemTheme) => {
      setSystemTheme(newSystemTheme);
    });

    return cleanup;
  }, [enableSystem]);

  /**
   * Apply theme changes to DOM
   */
  useEffect(() => {
    if (!mounted) return;

    try {
      // Apply theme class for Tailwind CSS
      themeApplicator.applyTheme(resolvedTheme, disableTransitionOnChange);
      
      // Update mobile browser theme color
      themeApplicator.updateMetaThemeColor(resolvedTheme, themeColors);
    } catch (error) {
      console.error('Failed to apply theme changes:', error);
    }
  }, [resolvedTheme, mounted, disableTransitionOnChange, themeColors]);

  /**
   * Context value providing theme state and methods
   */
  const contextValue = useMemo((): ThemeContextState => ({
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    mounted
  }), [theme, resolvedTheme, systemTheme, setTheme, mounted]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={className}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * 
 * Provides access to theme state and control methods. Must be used within
 * a ThemeProvider component tree.
 * 
 * @returns Theme context state and methods
 * @throws {ThemeError} When used outside of ThemeProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme('dark')}>
 *       Current theme: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextState {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new ThemeError(
      'useTheme must be used within a ThemeProvider. Make sure to wrap your component tree with <ThemeProvider>.',
      THEME_ERROR_CODES.PROVIDER_NOT_FOUND
    );
  }
  
  return context;
}

/**
 * Hook for theme utilities and convenience methods
 * 
 * Provides additional theme-related utilities beyond basic state management.
 * 
 * @returns Extended theme utilities and helper methods
 */
export function useThemeUtils() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return useMemo(() => ({
    /**
     * Toggle between light and dark themes
     * If current theme is system, toggles to the opposite of current resolved theme
     */
    toggleTheme: () => {
      if (theme === 'system') {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      } else {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    },

    /**
     * Reset theme to system preference
     */
    resetToSystem: () => {
      setTheme('system');
    },

    /**
     * Check if current theme matches given mode
     */
    isTheme: (mode: ThemeMode) => theme === mode,

    /**
     * Check if current resolved theme matches given mode
     */
    isResolvedTheme: (mode: ResolvedTheme) => resolvedTheme === mode,

    /**
     * Get system theme preference without affecting current theme
     */
    getSystemTheme: () => systemThemeDetector.getSystemTheme(),

    /**
     * Check if system theme detection is supported
     */
    isSystemThemeSupported: () => {
      return typeof window !== 'undefined' && 
             'matchMedia' in window && 
             typeof window.matchMedia === 'function';
    }
  }), [theme, resolvedTheme, setTheme]);
}

// Named exports for convenience
export { ThemeMode, ResolvedTheme, ThemeProviderConfig } from '@/types/theme';

// Default export
export default ThemeProvider;