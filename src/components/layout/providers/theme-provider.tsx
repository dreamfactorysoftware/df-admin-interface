/**
 * React theme context provider managing light/dark theme state, user theme preferences, and CSS variable injection.
 * 
 * This component replaces the Angular DfThemeService with React context patterns, providing comprehensive
 * theme management including system preference detection, localStorage persistence, and Tailwind CSS 4.1+
 * integration with real-time theme updates and accessibility support.
 * 
 * @version 1.0.0
 * @requires React 19.0.0 for enhanced context performance and concurrent features
 * @requires Tailwind CSS 4.1+ for utility-first styling and dark mode class strategy
 * @see Section 3.2.1 - Tailwind CSS 4.1+ utility-first styling framework
 * @see Section 3.2.2 - React context API state management patterns
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ThemeContextValue, 
  ThemeProviderProps, 
  ThemeState, 
  ThemeActions, 
  ThemeMode,
  ThemeConfig,
  ThemeCustomizations 
} from './provider-types';

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
 * Default theme configuration for DreamFactory Admin Interface.
 * Provides comprehensive color palette and component styling aligned with brand guidelines.
 */
const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'dreamfactory-default',
  name: 'DreamFactory Default',
  description: 'Default DreamFactory Admin Interface theme',
  className: 'dreamfactory-theme',
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Main brand color
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Secondary accent
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#6366f1',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  components: {
    button: {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white',
      secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
      danger: 'bg-error-500 hover:bg-error-600 text-white',
      ghost: 'bg-transparent hover:bg-secondary-100 text-secondary-900',
    },
    input: {
      base: 'border border-border-primary rounded-md px-3 py-2',
      focus: 'border-border-focus ring-2 ring-primary-500 ring-opacity-20',
      error: 'border-error-500 ring-2 ring-error-500 ring-opacity-20',
      disabled: 'bg-secondary-100 text-secondary-400 cursor-not-allowed',
    },
    card: {
      base: 'bg-background-primary border border-border-primary rounded-lg shadow-sm',
      header: 'border-b border-border-primary px-6 py-4',
      content: 'px-6 py-4',
      footer: 'border-t border-border-primary px-6 py-4',
    },
    navigation: {
      base: 'flex items-center space-x-4',
      item: 'px-3 py-2 rounded-md text-sm font-medium',
      active: 'bg-primary-500 text-white',
      hover: 'bg-secondary-100 text-secondary-900',
    },
  },
};

/**
 * Default theme customizations.
 * Provides empty customization object that can be extended by applications.
 */
const DEFAULT_CUSTOMIZATIONS: ThemeCustomizations = {
  cssVariables: {},
  componentOverrides: {},
  animations: {},
  breakpoints: {},
};

// =============================================================================
// Context Creation and Types
// =============================================================================

/**
 * Theme context for providing theme state and actions throughout the component tree.
 * Initialized with null to enforce proper provider usage.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Add display name for debugging
ThemeContext.displayName = 'ThemeContext';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Detects the system's preferred color scheme.
 * Uses the matchMedia API to check for dark mode preference.
 * 
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'; // Default to light mode on server
  }

  try {
    return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('Unable to detect system theme preference:', error);
    return 'light';
  }
};

/**
 * Loads theme preference from localStorage with validation.
 * Replaces Angular service-based storage with browser localStorage.
 * 
 * @returns The stored theme preference or 'system' as default
 */
const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }

    // Migrate legacy boolean storage from Angular implementation
    const legacyDarkMode = localStorage.getItem('isDarkMode');
    if (legacyDarkMode !== null) {
      const isLegacyDark = JSON.parse(legacyDarkMode);
      localStorage.removeItem('isDarkMode'); // Clean up legacy key
      return isLegacyDark ? 'dark' : 'light';
    }
  } catch (error) {
    console.warn('Unable to load theme from localStorage:', error);
  }

  return 'system';
};

/**
 * Saves theme preference to localStorage.
 * Provides persistent storage for user theme preferences.
 * 
 * @param theme - The theme mode to store
 */
const saveThemeToStorage = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Unable to save theme to localStorage:', error);
  }
};

/**
 * Resolves the effective theme based on user preference and system setting.
 * 
 * @param themeMode - User's theme preference
 * @param systemTheme - System's preferred theme
 * @returns The resolved theme ('light' or 'dark')
 */
const resolveTheme = (themeMode: ThemeMode, systemTheme: 'light' | 'dark'): 'light' | 'dark' => {
  return themeMode === 'system' ? systemTheme : themeMode;
};

/**
 * Applies theme to document and updates CSS classes.
 * Integrates with Tailwind CSS 4.1+ dark mode class strategy.
 * 
 * @param resolvedTheme - The resolved theme to apply
 */
const applyThemeToDocument = (resolvedTheme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const documentElement = document.documentElement;
    
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

    // Update CSS custom properties for enhanced theming
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--df-bg-primary', '#1e293b');
      root.style.setProperty('--df-bg-secondary', '#334155');
      root.style.setProperty('--df-text-primary', '#f8fafc');
      root.style.setProperty('--df-text-secondary', '#cbd5e1');
    } else {
      root.style.setProperty('--df-bg-primary', '#ffffff');
      root.style.setProperty('--df-bg-secondary', '#f8fafc');
      root.style.setProperty('--df-text-primary', '#1e293b');
      root.style.setProperty('--df-text-secondary', '#475569');
    }
  } catch (error) {
    console.warn('Unable to apply theme to document:', error);
  }
};

/**
 * Disables CSS transitions temporarily to prevent flash during theme changes.
 * Provides smooth theme transition experience.
 */
const disableTransitions = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const css = document.createElement('style');
    css.appendChild(document.createTextNode(
      `*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important;animation-delay:0s!important;}`
    ));
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
    console.warn('Unable to disable transitions:', error);
  }
};

// =============================================================================
// Theme Provider Component
// =============================================================================

/**
 * ThemeProvider component that manages application theme state and provides context.
 * 
 * Replaces Angular DfThemeService with React context patterns, integrating with
 * Tailwind CSS 4.1+ theming and browser localStorage persistence.
 * 
 * @param props - Provider props including children and configuration options
 * @returns JSX element wrapping children with theme context
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystemDetection = true,
  storageKey = THEME_STORAGE_KEY,
  themes = [DEFAULT_THEME_CONFIG],
  defaultValue,
  config,
  debug = false,
}: ThemeProviderProps): JSX.Element {
  // =============================================================================
  // State Management
  // =============================================================================

  // Theme mode state (user preference)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (defaultValue?.theme) {
      return defaultValue.theme;
    }
    return getStoredTheme() || defaultTheme;
  });

  // System preference state
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    return getSystemTheme();
  });

  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false);

  // CSS variables loaded state
  const [cssVariablesLoaded, setCssVariablesLoaded] = useState(false);

  // Theme customizations state
  const [customizations, setCustomizations] = useState<ThemeCustomizations>(() => {
    return { ...DEFAULT_CUSTOMIZATIONS, ...(config?.customizations || {}) };
  });

  // =============================================================================
  // Computed Values
  // =============================================================================

  // Resolve the effective theme
  const resolvedTheme = useMemo(() => {
    return resolveTheme(theme, systemPreference);
  }, [theme, systemPreference]);

  // Current theme configuration
  const currentThemeConfig = useMemo(() => {
    return themes[0] || DEFAULT_THEME_CONFIG;
  }, [themes]);

  // =============================================================================
  // Actions
  // =============================================================================

  /**
   * Sets the theme mode and persists to storage.
   * Replaces Angular service setThemeMode with React state management.
   */
  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (debug) {
      console.log('ThemeProvider: Setting theme to', newTheme);
    }

    setThemeState(newTheme);
    saveThemeToStorage(newTheme);
    
    // Disable transitions to prevent flash
    disableTransitions();
  }, [debug]);

  /**
   * Toggles between light and dark themes.
   * Provides convenience method for theme switching.
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  /**
   * Applies custom theme configuration.
   * Enables runtime theme customization capabilities.
   */
  const applyCustomTheme = useCallback((customConfig: Partial<ThemeConfig>) => {
    if (debug) {
      console.log('ThemeProvider: Applying custom theme configuration', customConfig);
    }
    
    // Custom theme application logic would go here
    // For now, we'll update customizations
    setCustomizations(prev => ({
      ...prev,
      componentOverrides: {
        ...prev.componentOverrides,
        ...customConfig.components,
      },
    }));
  }, [debug]);

  /**
   * Resets theme to default configuration.
   * Provides mechanism to restore original theme settings.
   */
  const resetTheme = useCallback(() => {
    if (debug) {
      console.log('ThemeProvider: Resetting theme to default');
    }
    
    setTheme('system');
    setCustomizations(DEFAULT_CUSTOMIZATIONS);
  }, [setTheme, debug]);

  /**
   * Exports current theme configuration.
   * Enables theme configuration persistence and sharing.
   */
  const exportTheme = useCallback((): ThemeConfig => {
    return {
      ...currentThemeConfig,
      // Apply any customizations
    };
  }, [currentThemeConfig]);

  /**
   * Imports theme configuration.
   * Enables external theme configuration loading.
   */
  const importTheme = useCallback((config: ThemeConfig) => {
    if (debug) {
      console.log('ThemeProvider: Importing theme configuration', config);
    }
    
    // Theme import logic would go here
    applyCustomTheme(config);
  }, [applyCustomTheme, debug]);

  /**
   * Updates theme customizations.
   * Provides granular control over theme appearance.
   */
  const updateCustomizations = useCallback((newCustomizations: Partial<ThemeCustomizations>) => {
    if (debug) {
      console.log('ThemeProvider: Updating customizations', newCustomizations);
    }
    
    setCustomizations(prev => ({
      ...prev,
      ...newCustomizations,
    }));
  }, [debug]);

  // =============================================================================
  // Effects
  // =============================================================================

  /**
   * Initialize theme system and set up system preference monitoring.
   * Replaces Angular constructor logic with React effect patterns.
   */
  useEffect(() => {
    if (!enableSystemDetection || typeof window === 'undefined') {
      setIsInitialized(true);
      return;
    }

    let mediaQuery: MediaQueryList | undefined;

    try {
      mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        if (debug) {
          console.log('ThemeProvider: System theme changed to', newSystemTheme);
        }
        setSystemPreference(newSystemTheme);
      };

      // Set initial system preference
      setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

      // Listen for system theme changes
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleSystemThemeChange);
      }

      setIsInitialized(true);

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
      console.warn('ThemeProvider: Error setting up system theme detection:', error);
      setIsInitialized(true);
    }
  }, [enableSystemDetection, debug]);

  /**
   * Apply resolved theme to document when theme changes.
   * Integrates with Tailwind CSS dark mode class strategy.
   */
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (debug) {
      console.log('ThemeProvider: Applying resolved theme:', resolvedTheme);
    }

    applyThemeToDocument(resolvedTheme);
    setCssVariablesLoaded(true);
  }, [resolvedTheme, isInitialized, debug]);

  /**
   * Apply custom CSS variables from theme customizations.
   * Enables dynamic styling updates.
   */
  useEffect(() => {
    if (typeof document === 'undefined' || !cssVariablesLoaded) {
      return;
    }

    const root = document.documentElement;
    
    // Apply custom CSS variables
    Object.entries(customizations.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    if (debug) {
      console.log('ThemeProvider: Applied custom CSS variables', customizations.cssVariables);
    }
  }, [customizations.cssVariables, cssVariablesLoaded, debug]);

  // =============================================================================
  // Context Value Construction
  // =============================================================================

  /**
   * Theme state object for context value.
   */
  const themeState: ThemeState = useMemo(() => ({
    theme,
    systemPreference,
    isInitialized,
    cssVariablesLoaded,
    availableThemes: themes,
    customizations,
  }), [theme, systemPreference, isInitialized, cssVariablesLoaded, themes, customizations]);

  /**
   * Theme actions object for context value.
   */
  const themeActions: ThemeActions = useMemo(() => ({
    setTheme,
    toggleTheme,
    applyCustomTheme,
    resetTheme,
    exportTheme,
    importTheme,
    updateCustomizations,
  }), [setTheme, toggleTheme, applyCustomTheme, resetTheme, exportTheme, importTheme, updateCustomizations]);

  /**
   * Complete context value with state, actions, and metadata.
   */
  const contextValue: ThemeContextValue = useMemo(() => ({
    value: themeState,
    isLoading: !isInitialized,
    error: null, // Theme operations rarely fail, but this maintains interface consistency
    actions: themeActions,
  }), [themeState, isInitialized, themeActions]);

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// Custom Hook for Theme Context Access
// =============================================================================

/**
 * Custom hook for accessing theme context.
 * Provides typed access to theme state and actions with proper error handling.
 * 
 * @returns Theme context value with state and actions
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider>.'
    );
  }

  return context;
}

// =============================================================================
// Additional Utility Hooks
// =============================================================================

/**
 * Hook that returns the resolved theme value.
 * Convenient access to the effective theme without full context.
 * 
 * @returns The resolved theme ('light' or 'dark')
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { value } = useTheme();
  return resolveTheme(value.theme, value.systemPreference);
}

/**
 * Hook that returns system theme preference.
 * Provides access to system theme without full context.
 * 
 * @returns The system's preferred theme
 */
export function useSystemTheme(): 'light' | 'dark' {
  const { value } = useTheme();
  return value.systemPreference;
}

/**
 * Hook that returns whether theme system is initialized.
 * Useful for preventing flash of unstyled content.
 * 
 * @returns True if theme system is ready
 */
export function useThemeInitialized(): boolean {
  const { value } = useTheme();
  return value.isInitialized;
}

// =============================================================================
// Default Export
// =============================================================================

export default ThemeProvider;

// =============================================================================
// Type Exports for External Use
// =============================================================================

export type {
  ThemeContextValue,
  ThemeProviderProps,
  ThemeState,
  ThemeActions,
  ThemeMode,
  ThemeConfig,
  ThemeCustomizations,
} from './provider-types';