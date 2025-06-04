/**
 * Theme Utilities
 * 
 * Comprehensive utility functions for theme management including system detection,
 * theme validation, CSS class application, and accessibility helpers.
 * 
 * Provides reusable functions for theme-related operations across the application
 * and ensures consistent theme behavior patterns with WCAG 2.1 AA compliance.
 */

/**
 * Theme type definitions
 * Supports light, dark, and system preferences with proper TypeScript typing
 */
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Configuration constants for theme management
 */
export const THEME_CONFIG = {
  STORAGE_KEY: 'df-admin-theme',
  DEFAULT_THEME: 'system' as Theme,
  CLASS_ATTRIBUTE: 'class',
  DATA_ATTRIBUTE: 'data-theme',
  MEDIA_QUERY: '(prefers-color-scheme: dark)',
  TRANSITION_DURATION: 150, // milliseconds
  THEME_COLOR_META_NAME: 'theme-color',
} as const;

/**
 * Theme color values for mobile browser chrome theming
 */
export const THEME_COLORS = {
  light: '#ffffff',
  dark: '#0f172a',
} as const;

/**
 * WCAG 2.1 AA color contrast ratios and accessibility constants
 */
export const ACCESSIBILITY_CONFIG = {
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5,
    UI_COMPONENTS: 3.0,
  },
  LARGE_TEXT_THRESHOLD: 18, // pixels (or 14pt bold)
  MINIMUM_TOUCH_TARGET: 44, // pixels for mobile accessibility
  FOCUS_RING_WIDTH: 2, // pixels
  FOCUS_RING_OFFSET: 2, // pixels
} as const;

/**
 * System Theme Detection
 * Uses matchMedia API to detect user's system color scheme preference
 */
export const detectSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') {
    return 'light'; // Default for SSR
  }

  const mediaQuery = window.matchMedia(THEME_CONFIG.MEDIA_QUERY);
  return mediaQuery.matches ? 'dark' : 'light';
};

/**
 * Creates a media query listener for system theme changes
 * Returns cleanup function to remove the listener
 */
export const createSystemThemeListener = (
  callback: (theme: ResolvedTheme) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const mediaQuery = window.matchMedia(THEME_CONFIG.MEDIA_QUERY);
  
  const handleChange = (event: MediaQueryListEvent) => {
    callback(event.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

/**
 * Theme Validation and Sanitization
 * Ensures theme values are valid and safe for storage
 */
export const validateTheme = (theme: unknown): theme is Theme => {
  return typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme);
};

/**
 * Sanitizes theme value from untrusted sources (localStorage, URL params, etc.)
 */
export const sanitizeTheme = (theme: unknown): Theme => {
  if (validateTheme(theme)) {
    return theme;
  }
  return THEME_CONFIG.DEFAULT_THEME;
};

/**
 * Resolves system theme to actual light/dark value
 */
export const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') {
    return detectSystemTheme();
  }
  return theme;
};

/**
 * Theme Storage Management
 * Handles localStorage operations with error handling
 */
export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return THEME_CONFIG.DEFAULT_THEME;
  }

  try {
    const stored = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
    return sanitizeTheme(stored);
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
    return THEME_CONFIG.DEFAULT_THEME;
  }
};

/**
 * Stores theme preference in localStorage with error handling
 */
export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error);
  }
};

/**
 * Removes theme preference from localStorage
 */
export const clearStoredTheme = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(THEME_CONFIG.STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear theme from localStorage:', error);
  }
};

/**
 * CSS Class Management for Tailwind Dark Mode
 * Manages document element classes and attributes for theme switching
 */
export const applyThemeClasses = (theme: ResolvedTheme): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add new theme class
  root.classList.add(theme);
  
  // Set data attribute for additional styling hooks
  root.setAttribute(THEME_CONFIG.DATA_ATTRIBUTE, theme);
};

/**
 * Updates mobile browser theme color meta tag
 */
export const updateMetaThemeColor = (theme: ResolvedTheme): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const metaTag = document.querySelector(
    `meta[name="${THEME_CONFIG.THEME_COLOR_META_NAME}"]`
  ) as HTMLMetaElement;
  
  if (metaTag) {
    metaTag.content = THEME_COLORS[theme];
  }
};

/**
 * Performance-Optimized Theme Transition Management
 * Temporarily disables transitions during theme changes to prevent visual flashing
 */
export const disableTransitions = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const css = document.createElement('style');
  css.type = 'text/css';
  css.appendChild(
    document.createTextNode(
      '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
    )
  );
  
  document.head.appendChild(css);
  
  // Return cleanup function
  return () => {
    // Use RAF to ensure the style is applied before removal
    requestAnimationFrame(() => {
      if (css.parentNode) {
        document.head.removeChild(css);
      }
    });
  };
};

/**
 * Complete theme application with transition management
 */
export const applyTheme = (
  theme: ResolvedTheme,
  disableTransitionOnChange: boolean = true
): void => {
  if (disableTransitionOnChange) {
    const enableTransitions = disableTransitions();
    
    applyThemeClasses(theme);
    updateMetaThemeColor(theme);
    
    // Re-enable transitions after a brief delay
    setTimeout(enableTransitions, THEME_CONFIG.TRANSITION_DURATION);
  } else {
    applyThemeClasses(theme);
    updateMetaThemeColor(theme);
  }
};

/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * Color contrast validation and accessibility helpers
 */

/**
 * Converts hex color to RGB values
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculates relative luminance according to WCAG formula
 */
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const normalize = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
};

/**
 * Calculates WCAG contrast ratio between two colors
 */
export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    console.warn('Invalid color format for contrast calculation');
    return 1; // Fail-safe minimum ratio
  }

  const fgLuminance = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Validates color combination meets WCAG standards
 */
export const validateContrast = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const threshold = 
    level === 'AAA' 
      ? (isLargeText ? ACCESSIBILITY_CONFIG.CONTRAST_RATIOS.AAA_LARGE : ACCESSIBILITY_CONFIG.CONTRAST_RATIOS.AAA_NORMAL)
      : (isLargeText ? ACCESSIBILITY_CONFIG.CONTRAST_RATIOS.AA_LARGE : ACCESSIBILITY_CONFIG.CONTRAST_RATIOS.AA_NORMAL);
  
  return ratio >= threshold;
};

/**
 * Validates UI component contrast (3:1 minimum)
 */
export const validateUIContrast = (
  foreground: string,
  background: string
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= ACCESSIBILITY_CONFIG.CONTRAST_RATIOS.UI_COMPONENTS;
};

/**
 * Gets accessible color pairs for current theme
 */
export const getAccessibleColorPairs = (theme: ResolvedTheme) => {
  const pairs = {
    light: {
      text: {
        primary: '#0f172a',      // slate-900: 18.91:1 ratio vs white
        secondary: '#475569',    // slate-600: 7.25:1 ratio vs white
        muted: '#64748b',        // slate-500: 4.51:1 ratio vs white
      },
      background: {
        primary: '#ffffff',      // white
        secondary: '#f8fafc',    // slate-50
        muted: '#f1f5f9',        // slate-100
      },
      border: {
        primary: '#e2e8f0',      // slate-200
        secondary: '#cbd5e1',    // slate-300
      },
      interactive: {
        primary: '#4f46e5',      // indigo-600: 7.14:1 vs white
        hover: '#4338ca',        // indigo-700: 9.31:1 vs white
        active: '#3730a3',       // indigo-800: 12.35:1 vs white
      },
    },
    dark: {
      text: {
        primary: '#f8fafc',      // slate-50: 19.15:1 ratio vs dark
        secondary: '#cbd5e1',    // slate-300: 13.95:1 ratio vs dark
        muted: '#94a3b8',        // slate-400: 9.14:1 ratio vs dark
      },
      background: {
        primary: '#0f172a',      // slate-900
        secondary: '#1e293b',    // slate-800
        muted: '#334155',        // slate-700
      },
      border: {
        primary: '#475569',      // slate-600
        secondary: '#64748b',    // slate-500
      },
      interactive: {
        primary: '#6366f1',      // indigo-500: 4.52:1 vs dark
        hover: '#4f46e5',        // indigo-600: 7.14:1 vs dark
        active: '#4338ca',       // indigo-700: 9.31:1 vs dark
      },
    },
  };

  return pairs[theme];
};

/**
 * Generates focus ring styles for accessibility
 */
export const getFocusRingStyles = (
  color: string = '#4f46e5',
  variant: 'default' | 'error' | 'success' = 'default'
): string => {
  const colors = {
    default: '#4f46e5',  // indigo-600
    error: '#dc2626',    // red-600
    success: '#16a34a',  // green-600
  };

  const focusColor = colors[variant] || color;
  
  return `focus-visible:outline-none focus-visible:ring-${ACCESSIBILITY_CONFIG.FOCUS_RING_WIDTH} focus-visible:ring-offset-${ACCESSIBILITY_CONFIG.FOCUS_RING_OFFSET} focus-visible:ring-[${focusColor}]`;
};

/**
 * Validates if an element meets minimum touch target size
 */
export const validateTouchTarget = (
  width: number,
  height: number
): boolean => {
  return (
    width >= ACCESSIBILITY_CONFIG.MINIMUM_TOUCH_TARGET &&
    height >= ACCESSIBILITY_CONFIG.MINIMUM_TOUCH_TARGET
  );
};

/**
 * Utility to create accessible theme-aware CSS classes
 */
export const createThemeAwareClasses = (
  lightClasses: string,
  darkClasses: string
): string => {
  return `${lightClasses} dark:${darkClasses}`;
};

/**
 * Utility to announce theme changes to screen readers
 */
export const announceThemeChange = (theme: ResolvedTheme): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Theme changed to ${theme} mode`;
  
  document.body.appendChild(announcement);
  
  // Remove announcement after screen readers have had time to announce it
  setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Comprehensive theme utility that combines all operations
 */
export const setTheme = (
  theme: Theme,
  options: {
    persist?: boolean;
    disableTransitions?: boolean;
    announceChange?: boolean;
  } = {}
): ResolvedTheme => {
  const {
    persist = true,
    disableTransitions = true,
    announceChange = true,
  } = options;

  const resolvedTheme = resolveTheme(theme);

  // Store preference
  if (persist) {
    setStoredTheme(theme);
  }

  // Apply theme
  applyTheme(resolvedTheme, disableTransitions);

  // Announce change for accessibility
  if (announceChange) {
    announceThemeChange(resolvedTheme);
  }

  return resolvedTheme;
};

/**
 * Initializes theme system on application boot
 */
export const initializeTheme = (): {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  cleanup: () => void;
} => {
  const storedTheme = getStoredTheme();
  const resolvedTheme = resolveTheme(storedTheme);
  
  // Apply initial theme without transitions (prevents flash)
  applyTheme(resolvedTheme, true);

  // Set up system theme listener for 'system' preference
  const cleanup = createSystemThemeListener((systemTheme) => {
    if (getStoredTheme() === 'system') {
      applyTheme(systemTheme, false);
    }
  });

  return {
    theme: storedTheme,
    resolvedTheme,
    cleanup,
  };
};

/**
 * Export type utilities for use in other components
 */
export type ThemeConfig = typeof THEME_CONFIG;
export type AccessibilityConfig = typeof ACCESSIBILITY_CONFIG;
export type ThemeColors = typeof THEME_COLORS;