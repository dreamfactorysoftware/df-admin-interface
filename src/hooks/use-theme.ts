/**
 * Theme Management Hook
 * 
 * Comprehensive theme management hook that handles dark/light mode switching,
 * system preference detection, and Tailwind CSS integration. Replaces Angular 
 * DfThemeService with React state management, localStorage persistence, and 
 * dynamic CSS class application for seamless theme transitions.
 * 
 * Features:
 * - Light/dark/system theme preference management
 * - Automatic system theme detection with prefers-color-scheme
 * - localStorage persistence with cross-tab synchronization
 * - Tailwind CSS integration with dynamic class application
 * - Smooth theme transitions with accessibility considerations
 * - Table pagination row count preferences
 * - WCAG 2.1 AA compliance for color contrast
 * 
 * @fileoverview Theme management hook for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './use-local-storage';
import type {
  ThemeMode,
  ResolvedTheme,
  UseThemeReturn,
  ThemeUtils,
  ThemeCSSProperties,
  ThemeTransition,
  SystemThemeConfig,
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
} from '../types/theme';

// =============================================================================
// THEME CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default theme configuration values
 */
const THEME_CONFIG = {
  ...DEFAULT_THEME_CONFIG,
  transitionDuration: 150, // milliseconds
  transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  debounceDelay: 100, // milliseconds for system theme detection
} as const;

/**
 * CSS custom properties for theme variables
 */
const THEME_CSS_VARS: Record<ResolvedTheme, ThemeCSSProperties> = {
  light: {
    '--theme-background': 'hsl(0 0% 100%)',
    '--theme-foreground': 'hsl(240 10% 3.9%)',
    '--theme-primary': 'hsl(240 5.9% 10%)',
    '--theme-secondary': 'hsl(240 4.8% 95.9%)',
    '--theme-accent': 'hsl(240 4.8% 95.9%)',
    '--theme-border': 'hsl(240 5.9% 90%)',
    '--theme-input': 'hsl(240 5.9% 90%)',
    '--theme-ring': 'hsl(240 5% 64.9%)',
  },
  dark: {
    '--theme-background': 'hsl(240 10% 3.9%)',
    '--theme-foreground': 'hsl(0 0% 98%)',
    '--theme-primary': 'hsl(0 0% 98%)',
    '--theme-secondary': 'hsl(240 3.7% 15.9%)',
    '--theme-accent': 'hsl(240 3.7% 15.9%)',
    '--theme-border': 'hsl(240 3.7% 15.9%)',
    '--theme-input': 'hsl(240 3.7% 15.9%)',
    '--theme-ring': 'hsl(240 4.9% 83.9%)',
  },
};

/**
 * Accessible color pairs for WCAG compliance
 */
const ACCESSIBLE_COLORS = {
  light: {
    text: '#1f2937', // gray-800
    background: '#ffffff', // white
    primary: '#3b82f6', // blue-500
    secondary: '#6b7280', // gray-500
  },
  dark: {
    text: '#f9fafb', // gray-50
    background: '#111827', // gray-900
    primary: '#60a5fa', // blue-400
    secondary: '#9ca3af', // gray-400
  },
} as const;

/**
 * Default pagination preferences
 */
const DEFAULT_PAGINATION = {
  rowsPerPage: 25,
  availablePageSizes: [10, 25, 50, 100] as const,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely access window object for SSR compatibility
 */
const getWindow = (): Window | undefined => {
  return typeof window !== 'undefined' ? window : undefined;
};

/**
 * Safely access document object for SSR compatibility
 */
const getDocument = (): Document | undefined => {
  return typeof document !== 'undefined' ? document : undefined;
};

/**
 * Check if we're running in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Detect system color scheme preference
 */
const getSystemTheme = (): ResolvedTheme => {
  if (!isBrowser()) return 'light';
  
  const mediaQuery = getWindow()?.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery?.matches ? 'dark' : 'light';
};

/**
 * Check if theme detection is supported by the browser
 */
const isThemeSupported = (): boolean => {
  if (!isBrowser()) return false;
  
  try {
    const mediaQuery = getWindow()?.matchMedia('(prefers-color-scheme: dark)');
    return !!mediaQuery;
  } catch {
    return false;
  }
};

/**
 * Validate if a string is a valid theme mode
 */
const isValidTheme = (theme: string): theme is ThemeMode => {
  return ['light', 'dark', 'system'].includes(theme);
};

/**
 * Apply CSS custom properties to document root
 */
const applyCSSVariables = (theme: ResolvedTheme): void => {
  if (!isBrowser()) return;
  
  const root = getDocument()?.documentElement;
  if (!root) return;
  
  const variables = THEME_CSS_VARS[theme];
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

/**
 * Apply theme class to document
 */
const applyThemeClass = (theme: ResolvedTheme, selector: string = ':root'): void => {
  if (!isBrowser()) return;
  
  const doc = getDocument();
  if (!doc) return;
  
  // Remove existing theme classes
  if (selector === ':root') {
    doc.documentElement.classList.remove('light', 'dark');
    doc.documentElement.classList.add(theme);
  } else {
    const element = doc.querySelector(selector);
    if (element) {
      element.classList.remove('light', 'dark');
      element.classList.add(theme);
    }
  }
  
  // Apply CSS variables
  applyCSSVariables(theme);
};

/**
 * Remove theme classes from document
 */
const removeThemeClass = (selector: string = ':root'): void => {
  if (!isBrowser()) return;
  
  const doc = getDocument();
  if (!doc) return;
  
  if (selector === ':root') {
    doc.documentElement.classList.remove('light', 'dark');
  } else {
    const element = doc.querySelector(selector);
    if (element) {
      element.classList.remove('light', 'dark');
    }
  }
};

/**
 * Convert hex color to RGB values
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance of a color
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
const getContrastRatio = (foreground: string, background: string): number => {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) return 1;
  
  const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color combination meets WCAG accessibility standards
 */
const meetsAccessibilityStandards = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const contrast = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? contrast >= 4.5 : contrast >= 7;
  }
  
  return isLargeText ? contrast >= 3 : contrast >= 4.5;
};

/**
 * Disable transitions temporarily to prevent flash during theme change
 */
const disableTransitions = (duration: number = 100): void => {
  if (!isBrowser()) return;
  
  const doc = getDocument();
  if (!doc) return;
  
  const css = `
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      transition-delay: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-delay: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  
  const style = doc.createElement('style');
  style.textContent = css;
  doc.head.appendChild(style);
  
  // Re-enable transitions after specified duration
  setTimeout(() => {
    doc.head.removeChild(style);
  }, duration);
};

// =============================================================================
// PAGINATION MANAGEMENT INTERFACE
// =============================================================================

/**
 * Table pagination preferences interface
 */
export interface PaginationPreferences {
  /** Number of rows per page */
  rowsPerPage: number;
  
  /** Available page size options */
  availablePageSizes: readonly number[];
  
  /** Set number of rows per page */
  setRowsPerPage: (rows: number) => void;
  
  /** Get valid page sizes for current context */
  getValidPageSizes: () => readonly number[];
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Comprehensive theme management hook
 * 
 * @param config Optional configuration for theme behavior
 * @returns Theme state and utility functions
 * 
 * @example
 * ```typescript
 * function App() {
 *   const { 
 *     theme, 
 *     resolvedTheme, 
 *     setTheme, 
 *     toggleTheme,
 *     mounted,
 *     paginationPrefs
 *   } = useTheme();
 * 
 *   if (!mounted) {
 *     return <div>Loading...</div>;
 *   }
 * 
 *   return (
 *     <div className={resolvedTheme}>
 *       <button onClick={toggleTheme}>
 *         Switch to {resolvedTheme === 'light' ? 'dark' : 'light'} mode
 *       </button>
 *       <select 
 *         value={paginationPrefs.rowsPerPage}
 *         onChange={(e) => paginationPrefs.setRowsPerPage(Number(e.target.value))}
 *       >
 *         {paginationPrefs.availablePageSizes.map(size => (
 *           <option key={size} value={size}>{size} rows</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(config?: {
  /** Custom storage key for theme persistence */
  storageKey?: string;
  
  /** Default theme when no preference is stored */
  defaultTheme?: ThemeMode;
  
  /** Disable automatic transitions during theme changes */
  disableTransitionOnChange?: boolean;
  
  /** Custom CSS selector for theme application */
  selector?: string;
  
  /** System theme detection configuration */
  systemConfig?: SystemThemeConfig;
  
  /** Theme transition configuration */
  transitionConfig?: ThemeTransition;
}): UseThemeReturn & {
  /** Pagination preferences management */
  paginationPrefs: PaginationPreferences;
} {
  const {
    storageKey = THEME_CONFIG.storageKey,
    defaultTheme = THEME_CONFIG.defaultTheme,
    disableTransitionOnChange = THEME_CONFIG.disableTransitionOnChange,
    selector = THEME_CONFIG.selector,
    systemConfig = {},
    transitionConfig = {},
  } = config || {};

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  // Theme preferences storage
  const [storedTheme, setStoredTheme] = useLocalStorage<ThemeMode>(storageKey, {
    defaultValue: defaultTheme,
    syncAcrossTabs: true,
    version: 1,
    validator: (value): value is ThemeMode => isValidTheme(value as string),
  });

  // Pagination preferences storage
  const [storedRowsPerPage, setStoredRowsPerPage] = useLocalStorage<number>('df-admin-rows-per-page', {
    defaultValue: DEFAULT_PAGINATION.rowsPerPage,
    syncAcrossTabs: true,
    version: 1,
    validator: (value): value is number => {
      return typeof value === 'number' && 
             DEFAULT_PAGINATION.availablePageSizes.includes(value as any);
    },
  });

  // Local state
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const [mounted, setMounted] = useState(false);
  
  // Refs for avoiding stale closures and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const mediaQueryRef = useRef<MediaQueryList>();

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const theme = storedTheme || defaultTheme;
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // =============================================================================
  // THEME UTILITIES
  // =============================================================================

  const themeUtils: ThemeUtils = {
    getSystemTheme,
    isThemeSupported,
    isValidTheme,
    
    getAccessibleColors: (themeMode: ResolvedTheme) => ACCESSIBLE_COLORS[themeMode],
    
    applyTheme: (themeMode: ResolvedTheme, customSelector?: string) => {
      applyThemeClass(themeMode, customSelector || selector);
    },
    
    removeTheme: (customSelector?: string) => {
      removeThemeClass(customSelector || selector);
    },
    
    getContrastRatio,
    meetsAccessibilityStandards,
  };

  // =============================================================================
  // THEME MANAGEMENT FUNCTIONS
  // =============================================================================

  /**
   * Update theme preference with transition handling
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!mounted || !isValidTheme(newTheme)) return;
    
    // Disable transitions if configured
    if (disableTransitionOnChange && !transitionConfig.disabled) {
      disableTransitions(transitionConfig.duration || THEME_CONFIG.transitionDuration);
    }
    
    // Update stored theme
    setStoredTheme(newTheme);
    
    // Apply theme immediately if not system-dependent
    if (newTheme !== 'system') {
      applyThemeClass(newTheme, selector);
    } else {
      applyThemeClass(systemTheme, selector);
    }
  }, [
    mounted,
    disableTransitionOnChange,
    transitionConfig,
    setStoredTheme,
    selector,
    systemTheme,
  ]);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    const currentResolved = theme === 'system' ? systemTheme : theme;
    const newTheme: ThemeMode = currentResolved === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, systemTheme, setTheme]);

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

  // =============================================================================
  // PAGINATION MANAGEMENT
  // =============================================================================

  /**
   * Set number of rows per page with validation
   */
  const setRowsPerPage = useCallback((rows: number) => {
    if (DEFAULT_PAGINATION.availablePageSizes.includes(rows as any)) {
      setStoredRowsPerPage(rows);
    }
  }, [setStoredRowsPerPage]);

  /**
   * Get valid page sizes for current context
   */
  const getValidPageSizes = useCallback((): readonly number[] => {
    return DEFAULT_PAGINATION.availablePageSizes;
  }, []);

  const paginationPrefs: PaginationPreferences = {
    rowsPerPage: storedRowsPerPage || DEFAULT_PAGINATION.rowsPerPage,
    availablePageSizes: DEFAULT_PAGINATION.availablePageSizes,
    setRowsPerPage,
    getValidPageSizes,
  };

  // =============================================================================
  // SYSTEM THEME DETECTION
  // =============================================================================

  /**
   * Handle system theme changes with debouncing
   */
  const handleSystemThemeChange = useCallback((e: MediaQueryListEvent) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the system theme update
    debounceTimerRef.current = setTimeout(() => {
      const newSystemTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // If currently using system theme, apply the new theme
      if (theme === 'system') {
        applyThemeClass(newSystemTheme, selector);
      }
      
      // Call custom callback if provided
      systemConfig.onSystemThemeChange?.(newSystemTheme);
    }, systemConfig.autoUpdate !== false ? (THEME_CONFIG.debounceDelay) : 0);
  }, [theme, selector, systemConfig]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Initialize theme system on mount
   */
  useEffect(() => {
    // Mark as mounted for SSR compatibility
    setMounted(true);
    
    // Initialize system theme detection
    if (isThemeSupported()) {
      const mediaQuery = getWindow()?.matchMedia(
        systemConfig.darkModeQuery || THEME_CONSTANTS.SYSTEM_QUERY
      );
      
      if (mediaQuery) {
        mediaQueryRef.current = mediaQuery;
        
        // Set initial system theme
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        
        // Add event listener for system theme changes
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handleSystemThemeChange);
        }
      }
    }
    
    // Apply initial theme
    const initialResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    applyThemeClass(initialResolvedTheme, selector);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (mediaQueryRef.current) {
        if (mediaQueryRef.current.removeEventListener) {
          mediaQueryRef.current.removeEventListener('change', handleSystemThemeChange);
        } else {
          // Fallback for older browsers
          mediaQueryRef.current.removeListener(handleSystemThemeChange);
        }
      }
    };
  }, [theme, selector, systemConfig, handleSystemThemeChange]);

  /**
   * Apply theme when resolved theme changes
   */
  useEffect(() => {
    if (mounted) {
      applyThemeClass(resolvedTheme, selector);
    }
  }, [mounted, resolvedTheme, selector]);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // Core theme state
    theme,
    resolvedTheme,
    systemTheme,
    mounted,
    
    // Theme management functions
    setTheme,
    toggleTheme,
    resetToSystem,
    
    // Theme utilities
    ...themeUtils,
    
    // Theme checking functions
    isTheme,
    isResolvedTheme,
    
    // Pagination preferences
    paginationPrefs,
  };
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * Simple theme hook for basic usage without pagination
 */
export function useSimpleTheme(): {
  theme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  mounted: boolean;
} {
  const { theme: themeMode, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme();
  
  return {
    theme: resolvedTheme,
    setTheme,
    toggleTheme,
    mounted,
  };
}

/**
 * Theme-aware styling hook
 */
export function useThemeStyles() {
  const { resolvedTheme, getAccessibleColors } = useTheme();
  
  const colors = getAccessibleColors(resolvedTheme);
  
  const getThemeClass = useCallback((lightClass: string, darkClass: string): string => {
    return resolvedTheme === 'light' ? lightClass : darkClass;
  }, [resolvedTheme]);
  
  const getConditionalClasses = useCallback((classes: {
    light?: string;
    dark?: string;
    common?: string;
  }): string => {
    const { light = '', dark = '', common = '' } = classes;
    const themeClass = resolvedTheme === 'light' ? light : dark;
    return `${common} ${themeClass}`.trim();
  }, [resolvedTheme]);
  
  return {
    theme: resolvedTheme,
    colors,
    getThemeClass,
    getConditionalClasses,
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { UseThemeReturn, PaginationPreferences };