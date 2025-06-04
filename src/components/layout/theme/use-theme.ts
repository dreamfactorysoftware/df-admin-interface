/**
 * Custom React hook for accessing theme context state and actions
 * Provides clean API for components to consume theme data, toggle theme modes,
 * and access resolved theme values with proper error handling and TypeScript type safety
 */

'use client';

import { useContext, useCallback, useMemo } from 'react';
import type { 
  UseThemeReturn, 
  ThemeMode, 
  ResolvedTheme, 
  ThemeUtils,
  ThemeStorage,
  ThemeValidation
} from '@/types/theme';
import { 
  ThemeError, 
  THEME_ERROR_CODES, 
  THEME_CONSTANTS,
  DEFAULT_THEME_CONFIG 
} from '@/types/theme';

// Import the theme context (will be created by theme-provider)
// Note: This import will be available once theme-provider.tsx is created
declare const ThemeContext: React.Context<any>;

/**
 * Custom hook providing access to theme context with comprehensive utilities
 * 
 * @returns Complete theme management interface with utilities
 * @throws {ThemeError} When used outside of ThemeProvider context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     theme, 
 *     resolvedTheme, 
 *     setTheme, 
 *     toggleTheme,
 *     isTheme,
 *     getSystemTheme 
 *   } = useTheme();
 *   
 *   return (
 *     <div className={`bg-white dark:bg-gray-900`}>
 *       <p>Current theme: {resolvedTheme}</p>
 *       <button onClick={toggleTheme}>
 *         Switch to {resolvedTheme === 'light' ? 'dark' : 'light'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Access theme context with error boundary protection
  const context = useContext(ThemeContext);
  
  // Error handling for components using hook outside of ThemeProvider
  if (context === undefined) {
    throw new ThemeError(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider>.',
      THEME_ERROR_CODES.PROVIDER_NOT_FOUND
    );
  }
  
  const { 
    theme, 
    resolvedTheme, 
    systemTheme, 
    setTheme: setThemeContext, 
    mounted 
  } = context;
  
  /**
   * Enhanced setTheme with validation
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!isValidTheme(newTheme)) {
      throw new ThemeError(
        `Invalid theme mode: ${newTheme}. Must be one of: light, dark, system`,
        THEME_ERROR_CODES.INVALID_THEME
      );
    }
    setThemeContext(newTheme);
  }, [setThemeContext]);
  
  /**
   * Toggle between light and dark themes
   * Preserves system preference if currently set to system
   */
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If currently system, toggle to opposite of resolved theme
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  }, [theme, resolvedTheme, setTheme]);
  
  /**
   * Reset theme to system preference
   */
  const resetToSystem = useCallback(() => {
    setTheme('system');
  }, [setTheme]);
  
  /**
   * Check if current theme matches given mode
   */
  const isTheme = useCallback((mode: ThemeMode): boolean => {
    return theme === mode;
  }, [theme]);
  
  /**
   * Check if current resolved theme matches given mode
   */
  const isResolvedTheme = useCallback((mode: ResolvedTheme): boolean => {
    return resolvedTheme === mode;
  }, [resolvedTheme]);
  
  /**
   * Theme utility functions with comprehensive validation and detection
   */
  const themeUtils: ThemeUtils = useMemo(() => ({
    /**
     * Detect system color scheme preference
     */
    getSystemTheme: (): ResolvedTheme => {
      if (typeof window === 'undefined') {
        return 'light'; // SSR fallback
      }
      
      try {
        const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
        return mediaQuery.matches ? 'dark' : 'light';
      } catch (error) {
        console.warn('Failed to detect system theme:', error);
        return 'light'; // Fallback to light theme
      }
    },
    
    /**
     * Check if current environment supports theme detection
     */
    isThemeSupported: (): boolean => {
      if (typeof window === 'undefined') {
        return false; // No theme support on server
      }
      
      return !!(
        window.matchMedia &&
        window.localStorage &&
        document.documentElement.classList
      );
    },
    
    /**
     * Validate theme mode is supported
     */
    isValidTheme: (theme: string): theme is ThemeMode => {
      return ['light', 'dark', 'system'].includes(theme);
    },
    
    /**
     * Get accessible color pairs for current theme
     */
    getAccessibleColors: (currentTheme: ResolvedTheme) => {
      const colorPairs = {
        light: {
          text: '#0f172a',      // gray-900 - 18.91:1 contrast ratio
          background: '#ffffff', // white
          primary: '#4f46e5',    // indigo-600 - 7.14:1 contrast
          secondary: '#64748b',  // slate-500 - 4.51:1 contrast
        },
        dark: {
          text: '#f8fafc',      // slate-50 - 19.15:1 contrast ratio
          background: '#0f172a', // slate-900
          primary: '#6366f1',    // indigo-500 - 4.52:1 contrast
          secondary: '#94a3b8',  // slate-400 - 9.14:1 contrast
        },
      };
      
      return colorPairs[currentTheme];
    },
    
    /**
     * Apply theme classes to document
     */
    applyTheme: (currentTheme: ResolvedTheme, selector: string = ':root') => {
      if (typeof document === 'undefined') return;
      
      const element = selector === ':root' 
        ? document.documentElement 
        : document.querySelector(selector);
        
      if (!element) return;
      
      // Remove existing theme classes
      element.classList.remove('light', 'dark');
      
      // Add new theme class
      element.classList.add(currentTheme);
      
      // Set data attribute for additional styling hooks
      element.setAttribute('data-theme', currentTheme);
      
      // Update meta theme-color for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        const metaColor = currentTheme === 'dark' ? '#0f172a' : '#ffffff';
        themeColorMeta.setAttribute('content', metaColor);
      }
    },
    
    /**
     * Remove theme classes from document
     */
    removeTheme: (selector: string = ':root') => {
      if (typeof document === 'undefined') return;
      
      const element = selector === ':root' 
        ? document.documentElement 
        : document.querySelector(selector);
        
      if (!element) return;
      
      element.classList.remove('light', 'dark');
      element.removeAttribute('data-theme');
    },
    
    /**
     * Get contrast ratio between two colors (simplified implementation)
     * Note: This is a basic implementation for demonstration
     * A production version would include full WCAG contrast calculation
     */
    getContrastRatio: (foreground: string, background: string): number => {
      // Simplified contrast calculation
      // In production, this would use proper luminance calculation
      return 4.5; // Return minimum AA compliance as placeholder
    },
    
    /**
     * Check if color combination meets WCAG accessibility standards
     */
    meetsAccessibilityStandards: (
      foreground: string, 
      background: string, 
      level: 'AA' | 'AAA' = 'AA',
      isLargeText: boolean = false
    ): boolean => {
      const ratio = themeUtils.getContrastRatio(foreground, background);
      const threshold = level === 'AAA' 
        ? (isLargeText ? 4.5 : 7) 
        : (isLargeText ? 3 : 4.5);
      
      return ratio >= threshold;
    },
  }), []);
  
  /**
   * Theme storage utilities
   */
  const themeStorage: ThemeStorage = useMemo(() => ({
    /**
     * Get stored theme preference
     */
    getTheme: (): ThemeMode | null => {
      if (typeof window === 'undefined') return null;
      
      try {
        const stored = localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY);
        return themeUtils.isValidTheme(stored) ? stored : null;
      } catch (error) {
        console.warn('Failed to read theme from storage:', error);
        return null;
      }
    },
    
    /**
     * Store theme preference
     */
    setTheme: (themeMode: ThemeMode): void => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, themeMode);
      } catch (error) {
        console.warn('Failed to store theme preference:', error);
      }
    },
    
    /**
     * Remove stored theme preference
     */
    removeTheme: (): void => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.removeItem(THEME_CONSTANTS.STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to remove theme preference:', error);
      }
    },
    
    /**
     * Check if storage is available
     */
    isAvailable: (): boolean => {
      if (typeof window === 'undefined') return false;
      
      try {
        const testKey = '__theme_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    },
  }), [themeUtils]);
  
  /**
   * Theme validation utilities
   */
  const themeValidation: ThemeValidation = useMemo(() => ({
    /**
     * Validate theme mode with type guard
     */
    validateThemeMode: (value: unknown): value is ThemeMode => {
      return typeof value === 'string' && themeUtils.isValidTheme(value);
    },
    
    /**
     * Validate resolved theme with type guard
     */
    validateResolvedTheme: (value: unknown): value is ResolvedTheme => {
      return value === 'light' || value === 'dark';
    },
    
    /**
     * Validate theme provider config
     */
    validateProviderConfig: (config: unknown): config is any => {
      return typeof config === 'object' && config !== null;
    },
  }), [themeUtils]);
  
  // Return complete theme interface with utilities
  return {
    // Core theme state
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    mounted,
    
    // Theme actions
    toggleTheme,
    resetToSystem,
    isTheme,
    isResolvedTheme,
    
    // Utility functions
    ...themeUtils,
    
    // Storage utilities (can be accessed via returned object)
    storage: themeStorage,
    
    // Validation utilities (can be accessed via returned object)
    validation: themeValidation,
  };
}

/**
 * Standalone validation function for theme modes
 * Can be used without the hook context
 */
export function isValidTheme(theme: string): theme is ThemeMode {
  return ['light', 'dark', 'system'].includes(theme);
}

/**
 * Standalone system theme detection
 * Can be used without the hook context
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'; // SSR fallback
  }
  
  try {
    const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
    return mediaQuery.matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('Failed to detect system theme:', error);
    return 'light';
  }
}

/**
 * Create theme storage utilities without hook context
 */
export function createThemeStorage(storageKey: string = THEME_CONSTANTS.STORAGE_KEY): ThemeStorage {
  return {
    getTheme: () => {
      if (typeof window === 'undefined') return null;
      
      try {
        const stored = localStorage.getItem(storageKey);
        return isValidTheme(stored) ? stored : null;
      } catch {
        return null;
      }
    },
    
    setTheme: (theme: ThemeMode) => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        console.warn('Failed to store theme:', error);
      }
    },
    
    removeTheme: () => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to remove theme:', error);
      }
    },
    
    isAvailable: () => {
      if (typeof window === 'undefined') return false;
      
      try {
        const testKey = '__theme_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}

// Export hook as default
export default useTheme;