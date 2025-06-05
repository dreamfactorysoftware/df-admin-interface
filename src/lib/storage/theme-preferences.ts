/**
 * Theme and UI preference management utilities migrated from Angular DfThemeService.
 * Handles dark mode toggle state, table row count preferences, and other UI customization 
 * settings with localStorage persistence and React hook integration.
 * 
 * This module provides type-safe, SSR-compatible React hooks for managing theme preferences
 * that replace Angular's BehaviorSubject-based theme state management.
 */

import { useCallback, useEffect, useMemo, useState, useLayoutEffect } from 'react';

// Storage keys for theme preferences
export const THEME_STORAGE_KEYS = {
  DARK_MODE: 'isDarkMode',
  TABLE_ROW_COUNT: 'currentTableRowNum',
  SYSTEM_THEME_PREFERENCE: 'systemThemePreference',
} as const;

// Default values for theme preferences
export const THEME_DEFAULTS = {
  DARK_MODE: false,
  TABLE_ROW_COUNT: 10,
  SYSTEM_THEME_PREFERENCE: true,
} as const;

// Theme preference types
export interface ThemePreferences {
  isDarkMode: boolean;
  tableRowCount: number;
  systemThemePreference: boolean;
}

export interface ThemeContextValue extends ThemePreferences {
  toggleTheme: () => void;
  setDarkMode: (isDarkMode: boolean) => void;
  setTableRowCount: (count: number) => void;
  setSystemThemePreference: (enabled: boolean) => void;
  appliedTheme: 'light' | 'dark';
}

// Utility function to check if we're in a browser environment (SSR-safe)
const isBrowser = typeof window !== 'undefined';

// Utility function to get system theme preference
const getSystemTheme = (): boolean => {
  if (!isBrowser) return THEME_DEFAULTS.DARK_MODE;
  
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.warn('Failed to detect system theme preference:', error);
    return THEME_DEFAULTS.DARK_MODE;
  }
};

// Type-safe localStorage operations with error handling
const getStoredValue = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn(`Failed to parse stored value for key "${key}":`, error);
    return defaultValue;
  }
};

const setStoredValue = <T>(key: string, value: T): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store value for key "${key}":`, error);
  }
};

/**
 * Custom hook for managing dark mode theme preference with localStorage persistence.
 * Migrates functionality from Angular DfThemeService.darkMode$ BehaviorSubject.
 * 
 * @returns Object containing dark mode state and setter functions
 */
export const useDarkMode = () => {
  // Initialize state with stored value or default
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => 
    getStoredValue(THEME_STORAGE_KEYS.DARK_MODE, THEME_DEFAULTS.DARK_MODE)
  );

  const [systemThemePreference, setSystemThemePreferenceState] = useState<boolean>(() =>
    getStoredValue(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE, THEME_DEFAULTS.SYSTEM_THEME_PREFERENCE)
  );

  // SSR-safe effect to sync with stored values after hydration
  useLayoutEffect(() => {
    if (isBrowser) {
      const storedDarkMode = getStoredValue(THEME_STORAGE_KEYS.DARK_MODE, THEME_DEFAULTS.DARK_MODE);
      const storedSystemPref = getStoredValue(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE, THEME_DEFAULTS.SYSTEM_THEME_PREFERENCE);
      
      setIsDarkModeState(storedDarkMode);
      setSystemThemePreferenceState(storedSystemPref);
    }
  }, []);

  // Listen for system theme changes when system preference is enabled
  useEffect(() => {
    if (!isBrowser || !systemThemePreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const systemIsDark = e.matches;
      setIsDarkModeState(systemIsDark);
      setStoredValue(THEME_STORAGE_KEYS.DARK_MODE, systemIsDark);
    };

    // Set initial theme based on system preference
    const systemIsDark = mediaQuery.matches;
    setIsDarkModeState(systemIsDark);
    setStoredValue(THEME_STORAGE_KEYS.DARK_MODE, systemIsDark);

    // Listen for changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [systemThemePreference]);

  // Setter function that updates both state and localStorage
  const setDarkMode = useCallback((newIsDarkMode: boolean) => {
    setIsDarkModeState(newIsDarkMode);
    setStoredValue(THEME_STORAGE_KEYS.DARK_MODE, newIsDarkMode);
    
    // Disable system theme preference when manually setting theme
    if (systemThemePreference) {
      setSystemThemePreferenceState(false);
      setStoredValue(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE, false);
    }
  }, [systemThemePreference]);

  // Toggle function for convenience
  const toggleTheme = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  // Setter for system theme preference
  const setSystemThemePreference = useCallback((enabled: boolean) => {
    setSystemThemePreferenceState(enabled);
    setStoredValue(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE, enabled);
    
    // If enabling system preference, immediately apply system theme
    if (enabled && isBrowser) {
      const systemIsDark = getSystemTheme();
      setIsDarkModeState(systemIsDark);
      setStoredValue(THEME_STORAGE_KEYS.DARK_MODE, systemIsDark);
    }
  }, []);

  // Compute the applied theme considering system preference
  const appliedTheme = useMemo<'light' | 'dark'>(() => {
    if (systemThemePreference && isBrowser) {
      return getSystemTheme() ? 'dark' : 'light';
    }
    return isDarkMode ? 'dark' : 'light';
  }, [isDarkMode, systemThemePreference]);

  return {
    isDarkMode,
    systemThemePreference,
    appliedTheme,
    setDarkMode,
    toggleTheme,
    setSystemThemePreference,
  };
};

/**
 * Custom hook for managing table row count preference with localStorage persistence.
 * Migrates functionality from Angular DfThemeService.currentTableRowNum$ BehaviorSubject.
 * 
 * @returns Object containing table row count state and setter function
 */
export const useTableRowCount = () => {
  // Initialize state with stored value or default
  const [tableRowCount, setTableRowCountState] = useState<number>(() => 
    getStoredValue(THEME_STORAGE_KEYS.TABLE_ROW_COUNT, THEME_DEFAULTS.TABLE_ROW_COUNT)
  );

  // SSR-safe effect to sync with stored value after hydration
  useLayoutEffect(() => {
    if (isBrowser) {
      const storedCount = getStoredValue(THEME_STORAGE_KEYS.TABLE_ROW_COUNT, THEME_DEFAULTS.TABLE_ROW_COUNT);
      setTableRowCountState(storedCount);
    }
  }, []);

  // Setter function that updates both state and localStorage
  const setTableRowCount = useCallback((count: number) => {
    // Validate the count to ensure it's a positive integer
    const validatedCount = Math.max(1, Math.min(100, Math.floor(count)));
    
    setTableRowCountState(validatedCount);
    setStoredValue(THEME_STORAGE_KEYS.TABLE_ROW_COUNT, validatedCount);
  }, []);

  return {
    tableRowCount,
    setTableRowCount,
  };
};

/**
 * Comprehensive theme preferences hook that combines all theme-related functionality.
 * Provides a complete interface for managing theme state across the application.
 * 
 * @returns Complete theme preferences state and management functions
 */
export const useThemePreferences = (): ThemeContextValue => {
  const {
    isDarkMode,
    systemThemePreference,
    appliedTheme,
    setDarkMode,
    toggleTheme,
    setSystemThemePreference,
  } = useDarkMode();

  const { tableRowCount, setTableRowCount } = useTableRowCount();

  return {
    isDarkMode,
    tableRowCount,
    systemThemePreference,
    appliedTheme,
    toggleTheme,
    setDarkMode,
    setTableRowCount,
    setSystemThemePreference,
  };
};

/**
 * Effect hook to apply theme classes to the document element.
 * Should be used in the root layout component to ensure theme consistency.
 * 
 * @param appliedTheme - The current applied theme ('light' | 'dark')
 */
export const useThemeEffect = (appliedTheme: 'light' | 'dark') => {
  useLayoutEffect(() => {
    if (!isBrowser) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(appliedTheme);
    
    // Update data attribute for CSS selectors
    root.setAttribute('data-theme', appliedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        appliedTheme === 'dark' ? '#1a1a1a' : '#ffffff'
      );
    }
  }, [appliedTheme]);
};

/**
 * Utility function to get the current theme preferences synchronously.
 * Useful for server-side operations or when hooks cannot be used.
 * 
 * @returns Current theme preferences from localStorage or defaults
 */
export const getThemePreferences = (): ThemePreferences => {
  return {
    isDarkMode: getStoredValue(THEME_STORAGE_KEYS.DARK_MODE, THEME_DEFAULTS.DARK_MODE),
    tableRowCount: getStoredValue(THEME_STORAGE_KEYS.TABLE_ROW_COUNT, THEME_DEFAULTS.TABLE_ROW_COUNT),
    systemThemePreference: getStoredValue(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE, THEME_DEFAULTS.SYSTEM_THEME_PREFERENCE),
  };
};

/**
 * Utility function to initialize theme preferences.
 * Loads initial theme state from localStorage and applies system theme if enabled.
 * Used during application bootstrap to ensure consistent theme state.
 */
export const initializeThemePreferences = (): void => {
  if (!isBrowser) return;

  try {
    const preferences = getThemePreferences();
    
    // Apply system theme if preference is enabled
    if (preferences.systemThemePreference) {
      const systemIsDark = getSystemTheme();
      setStoredValue(THEME_STORAGE_KEYS.DARK_MODE, systemIsDark);
    }
    
    // Apply theme to document immediately
    const appliedTheme = preferences.systemThemePreference 
      ? (getSystemTheme() ? 'dark' : 'light')
      : (preferences.isDarkMode ? 'dark' : 'light');
      
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(appliedTheme);
    document.documentElement.setAttribute('data-theme', appliedTheme);
    
  } catch (error) {
    console.error('Failed to initialize theme preferences:', error);
  }
};

/**
 * Type guard to validate theme preference objects
 */
export const isValidThemePreferences = (obj: any): obj is ThemePreferences => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isDarkMode === 'boolean' &&
    typeof obj.tableRowCount === 'number' &&
    typeof obj.systemThemePreference === 'boolean'
  );
};