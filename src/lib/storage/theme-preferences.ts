/**
 * Theme and UI Preference Management Utilities
 * 
 * Migrated from Angular DfThemeService to React/Next.js architecture.
 * Provides comprehensive theme state management, dark mode support, system preference
 * detection, and table row count preferences with localStorage persistence and
 * React hook integration.
 * 
 * This module replaces Angular BehaviorSubject patterns with React hooks while
 * maintaining backward compatibility with existing preference storage keys.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './ssr-storage';
import { STORAGE_KEYS, type ThemeMode, type ThemePreferences, type UIPreferences } from './types';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Default theme preferences matching Angular DfThemeService defaults
 */
export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  mode: 'system',
  isDarkMode: false,
  currentTableRowNum: 25,
  followSystemTheme: true,
};

/**
 * Default UI preferences for extended customization
 */
export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  sidebarCollapsed: false,
  tablePageSize: 25,
  autoRefreshSchemas: true,
  showAdvancedOptions: false,
  dateFormat: 'yyyy-MM-dd',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

/**
 * Table row count options available to users
 */
export const TABLE_ROW_COUNT_OPTIONS = [10, 25, 50, 100, 200] as const;

/**
 * CSS class names for theme application
 */
export const THEME_CLASSES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// =============================================================================
// Theme Detection and System Integration
// =============================================================================

/**
 * Detects system theme preference using matchMedia API
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
export function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'; // SSR fallback
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('System theme detection failed:', error);
    return 'light';
  }
}

/**
 * Resolves the effective theme mode based on preference and system setting
 * @param mode - Theme mode preference ('light', 'dark', or 'system')
 * @returns Effective theme ('light' or 'dark')
 */
export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return detectSystemTheme();
  }
  return mode;
}

/**
 * Applies theme to document element using CSS classes
 * @param theme - Theme to apply ('light' or 'dark')
 */
export function applyThemeToDocument(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const documentElement = document.documentElement;
  
  // Remove existing theme classes
  documentElement.classList.remove(THEME_CLASSES.LIGHT, THEME_CLASSES.DARK);
  
  // Apply new theme class
  documentElement.classList.add(theme === 'dark' ? THEME_CLASSES.DARK : THEME_CLASSES.LIGHT);
  
  // Update data attribute for CSS variable cascading
  documentElement.setAttribute('data-theme', theme);
  
  // Dispatch custom event for components that need to respond to theme changes
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
}

// =============================================================================
// React Hooks for Theme Management
// =============================================================================

/**
 * Core theme preferences hook with localStorage persistence
 * Replaces Angular DfThemeService BehaviorSubject patterns
 */
export function useThemePreferences(): {
  preferences: ThemePreferences;
  updatePreferences: (updates: Partial<ThemePreferences>) => void;
  resetPreferences: () => void;
  isLoading: boolean;
} {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<ThemePreferences>(
    STORAGE_KEYS.IS_DARK_MODE, // Maintain compatibility with existing key
    {
      defaultValue: DEFAULT_THEME_PREFERENCES,
      syncAcrossTabs: true,
    }
  );

  const [isLoading, setIsLoading] = useState(true);

  // Mark loading as complete after initial load
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    clearPreferences();
    setPreferences(DEFAULT_THEME_PREFERENCES);
  }, [clearPreferences, setPreferences]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
}

/**
 * Enhanced theme state hook with system preference detection and auto-switching
 * Provides the primary interface for theme management across the application
 */
export function useTheme(): {
  // Current state
  currentTheme: 'light' | 'dark';
  themeMode: ThemeMode;
  isDarkMode: boolean;
  isSystemTheme: boolean;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Preferences
  preferences: ThemePreferences;
  updatePreferences: (updates: Partial<ThemePreferences>) => void;
  
  // Utility
  isLoading: boolean;
} {
  const { preferences, updatePreferences, isLoading } = useThemePreferences();
  
  // Track system theme changes
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => detectSystemTheme());

  // Set up system theme change listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // Dispatch system theme change event
      window.dispatchEvent(new CustomEvent('systemThemeChange', { 
        detail: { theme: newSystemTheme } 
      }));
    };

    // Use modern addEventListener if available, fallback to deprecated addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // @ts-ignore - deprecated but needed for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // @ts-ignore - deprecated but needed for older browsers
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Calculate current effective theme
  const currentTheme = useMemo(() => {
    if (preferences.mode === 'system') {
      return systemTheme;
    }
    return preferences.mode;
  }, [preferences.mode, systemTheme]);

  // Derived state
  const isDarkMode = currentTheme === 'dark';
  const isSystemTheme = preferences.mode === 'system';

  // Apply theme to document when it changes
  useEffect(() => {
    if (!isLoading) {
      applyThemeToDocument(currentTheme);
      
      // Update isDarkMode in preferences to maintain compatibility
      if (preferences.isDarkMode !== isDarkMode) {
        updatePreferences({ isDarkMode });
      }
    }
  }, [currentTheme, isDarkMode, isLoading, preferences.isDarkMode, updatePreferences]);

  // Set theme mode
  const setThemeMode = useCallback((mode: ThemeMode) => {
    updatePreferences({ 
      mode,
      followSystemTheme: mode === 'system',
    });
  }, [updatePreferences]);

  // Toggle between light and dark (or switch to light/dark if in system mode)
  const toggleTheme = useCallback(() => {
    if (preferences.mode === 'system') {
      // If in system mode, switch to the opposite of current system theme
      setThemeMode(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setThemeMode(preferences.mode === 'dark' ? 'light' : 'dark');
    }
  }, [preferences.mode, systemTheme, setThemeMode]);

  return {
    // Current state
    currentTheme,
    themeMode: preferences.mode,
    isDarkMode,
    isSystemTheme,
    
    // Actions
    setThemeMode,
    toggleTheme,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Utility
    isLoading,
  };
}

/**
 * Table row count preference hook with validation
 * Manages pagination preferences with reactive updates
 */
export function useTableRowCount(): {
  rowCount: number;
  setRowCount: (count: number) => void;
  availableOptions: readonly number[];
  isValidRowCount: (count: number) => boolean;
} {
  const { preferences, updatePreferences } = useThemePreferences();

  const setRowCount = useCallback((count: number) => {
    if (TABLE_ROW_COUNT_OPTIONS.includes(count as any)) {
      updatePreferences({ currentTableRowNum: count });
    } else {
      console.warn(`Invalid row count: ${count}. Must be one of:`, TABLE_ROW_COUNT_OPTIONS);
    }
  }, [updatePreferences]);

  const isValidRowCount = useCallback((count: number): boolean => {
    return TABLE_ROW_COUNT_OPTIONS.includes(count as any);
  }, []);

  return {
    rowCount: preferences.currentTableRowNum,
    setRowCount,
    availableOptions: TABLE_ROW_COUNT_OPTIONS,
    isValidRowCount,
  };
}

/**
 * Extended UI preferences hook for additional customization options
 * Provides comprehensive UI state management beyond core theme preferences
 */
export function useUIPreferences(): {
  preferences: UIPreferences;
  updatePreferences: (updates: Partial<UIPreferences>) => void;
  resetPreferences: () => void;
  
  // Convenience accessors
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  tablePageSize: number;
  setTablePageSize: (size: number) => void;
  autoRefreshSchemas: boolean;
  setAutoRefreshSchemas: (autoRefresh: boolean) => void;
} {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<UIPreferences>(
    STORAGE_KEYS.SIDEBAR_COLLAPSED, // Use existing sidebar key as base
    {
      defaultValue: DEFAULT_UI_PREFERENCES,
      syncAcrossTabs: true,
    }
  );

  const updatePreferences = useCallback((updates: Partial<UIPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    clearPreferences();
    setPreferences(DEFAULT_UI_PREFERENCES);
  }, [clearPreferences, setPreferences]);

  // Convenience setters
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    updatePreferences({ sidebarCollapsed: collapsed });
  }, [updatePreferences]);

  const setTablePageSize = useCallback((size: number) => {
    updatePreferences({ tablePageSize: size });
  }, [updatePreferences]);

  const setAutoRefreshSchemas = useCallback((autoRefresh: boolean) => {
    updatePreferences({ autoRefreshSchemas: autoRefresh });
  }, [updatePreferences]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    
    // Convenience accessors
    sidebarCollapsed: preferences.sidebarCollapsed,
    setSidebarCollapsed,
    tablePageSize: preferences.tablePageSize,
    setTablePageSize,
    autoRefreshSchemas: preferences.autoRefreshSchemas,
    setAutoRefreshSchemas,
  };
}

// =============================================================================
// Theme Context Provider Utilities
// =============================================================================

/**
 * Theme context value interface for provider integration
 */
export interface ThemeContextValue {
  // Theme state
  currentTheme: 'light' | 'dark';
  themeMode: ThemeMode;
  isDarkMode: boolean;
  isSystemTheme: boolean;
  
  // Theme actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Table preferences
  tableRowCount: number;
  setTableRowCount: (count: number) => void;
  
  // UI preferences
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Combined theme state hook for provider integration
 * Provides all theme-related state and actions in a single hook
 */
export function useThemeContext(): ThemeContextValue {
  const themeState = useTheme();
  const tableState = useTableRowCount();
  const uiState = useUIPreferences();

  return {
    // Theme state
    currentTheme: themeState.currentTheme,
    themeMode: themeState.themeMode,
    isDarkMode: themeState.isDarkMode,
    isSystemTheme: themeState.isSystemTheme,
    
    // Theme actions
    setThemeMode: themeState.setThemeMode,
    toggleTheme: themeState.toggleTheme,
    
    // Table preferences
    tableRowCount: tableState.rowCount,
    setTableRowCount: tableState.setRowCount,
    
    // UI preferences
    sidebarCollapsed: uiState.sidebarCollapsed,
    setSidebarCollapsed: uiState.setSidebarCollapsed,
    
    // Loading state
    isLoading: themeState.isLoading,
  };
}

// =============================================================================
// Migration Helper Functions
// =============================================================================

/**
 * Migrates legacy theme preferences from Angular implementation
 * Handles conversion of old storage keys to new format
 */
export function migrateLegacyThemePreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    // Check for legacy isDarkMode boolean value
    const legacyDarkMode = localStorage.getItem('isDarkMode');
    const legacyTableRowNum = localStorage.getItem('currentTableRowNum');

    if (legacyDarkMode !== null || legacyTableRowNum !== null) {
      const migratedPreferences: Partial<ThemePreferences> = {};

      // Migrate dark mode preference
      if (legacyDarkMode !== null) {
        const isDark = legacyDarkMode === 'true';
        migratedPreferences.mode = isDark ? 'dark' : 'light';
        migratedPreferences.isDarkMode = isDark;
        migratedPreferences.followSystemTheme = false;
      }

      // Migrate table row count
      if (legacyTableRowNum !== null) {
        const rowCount = parseInt(legacyTableRowNum, 10);
        if (!isNaN(rowCount) && TABLE_ROW_COUNT_OPTIONS.includes(rowCount as any)) {
          migratedPreferences.currentTableRowNum = rowCount;
        }
      }

      // Store migrated preferences
      const currentPreferences = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE) || 
        JSON.stringify(DEFAULT_THEME_PREFERENCES)
      );

      localStorage.setItem(
        STORAGE_KEYS.IS_DARK_MODE,
        JSON.stringify({
          ...currentPreferences,
          ...migratedPreferences,
        })
      );

      // Clean up legacy keys
      localStorage.removeItem('isDarkMode');
      localStorage.removeItem('currentTableRowNum');

      console.info('Successfully migrated legacy theme preferences');
    }
  } catch (error) {
    console.warn('Failed to migrate legacy theme preferences:', error);
  }
}

/**
 * Validates and repairs theme preferences if corrupted
 * Ensures preferences always contain valid values
 */
export function validateThemePreferences(preferences: any): ThemePreferences {
  const validated: ThemePreferences = { ...DEFAULT_THEME_PREFERENCES };

  if (preferences && typeof preferences === 'object') {
    // Validate theme mode
    if (['light', 'dark', 'system'].includes(preferences.mode)) {
      validated.mode = preferences.mode;
    }

    // Validate isDarkMode
    if (typeof preferences.isDarkMode === 'boolean') {
      validated.isDarkMode = preferences.isDarkMode;
    }

    // Validate table row count
    if (
      typeof preferences.currentTableRowNum === 'number' &&
      TABLE_ROW_COUNT_OPTIONS.includes(preferences.currentTableRowNum as any)
    ) {
      validated.currentTableRowNum = preferences.currentTableRowNum;
    }

    // Validate followSystemTheme
    if (typeof preferences.followSystemTheme === 'boolean') {
      validated.followSystemTheme = preferences.followSystemTheme;
    }
  }

  return validated;
}

// =============================================================================
// Event Handling Utilities
// =============================================================================

/**
 * Sets up theme change event listeners for cross-component communication
 * @param callback - Function to call when theme changes
 * @returns Cleanup function to remove listeners
 */
export function setupThemeChangeListener(
  callback: (theme: 'light' | 'dark') => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR safety
  }

  const handleThemeChange = (event: CustomEvent<{ theme: 'light' | 'dark' }>) => {
    callback(event.detail.theme);
  };

  const handleSystemThemeChange = (event: CustomEvent<{ theme: 'light' | 'dark' }>) => {
    // Only respond to system theme changes if following system theme
    const preferences = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE) || 
      JSON.stringify(DEFAULT_THEME_PREFERENCES)
    );
    
    if (preferences.mode === 'system') {
      callback(event.detail.theme);
    }
  };

  // Type assertion for custom events
  window.addEventListener('themeChange', handleThemeChange as EventListener);
  window.addEventListener('systemThemeChange', handleSystemThemeChange as EventListener);

  return () => {
    window.removeEventListener('themeChange', handleThemeChange as EventListener);
    window.removeEventListener('systemThemeChange', handleSystemThemeChange as EventListener);
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets the current theme without using React hooks
 * Useful for utilities and non-React contexts
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'; // SSR fallback
  }

  try {
    const preferences = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE) || 
      JSON.stringify(DEFAULT_THEME_PREFERENCES)
    );

    if (preferences.mode === 'system') {
      return detectSystemTheme();
    }

    return preferences.mode;
  } catch (error) {
    console.warn('Failed to get current theme:', error);
    return 'light';
  }
}

/**
 * Gets the current table row count without using React hooks
 */
export function getCurrentTableRowCount(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_PREFERENCES.currentTableRowNum;
  }

  try {
    const preferences = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE) || 
      JSON.stringify(DEFAULT_THEME_PREFERENCES)
    );

    return preferences.currentTableRowNum || DEFAULT_THEME_PREFERENCES.currentTableRowNum;
  } catch (error) {
    console.warn('Failed to get current table row count:', error);
    return DEFAULT_THEME_PREFERENCES.currentTableRowNum;
  }
}

/**
 * Initializes theme preferences on application startup
 * Should be called early in the application lifecycle
 */
export function initializeThemePreferences(): void {
  // Migrate legacy preferences if needed
  migrateLegacyThemePreferences();
  
  // Apply current theme to document
  const currentTheme = getCurrentTheme();
  applyThemeToDocument(currentTheme);
  
  // Set up initial CSS custom properties if needed
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--initial-theme', currentTheme);
  }
}

// =============================================================================
// Export All Public APIs
// =============================================================================

export {
  // Types (re-exported from types.ts for convenience)
  type ThemeMode,
  type ThemePreferences,
  type UIPreferences,
};

export default {
  // Constants
  DEFAULT_THEME_PREFERENCES,
  DEFAULT_UI_PREFERENCES,
  TABLE_ROW_COUNT_OPTIONS,
  THEME_CLASSES,
  
  // Core functions
  detectSystemTheme,
  resolveThemeMode,
  applyThemeToDocument,
  getCurrentTheme,
  getCurrentTableRowCount,
  initializeThemePreferences,
  
  // React hooks
  useTheme,
  useThemePreferences,
  useTableRowCount,
  useUIPreferences,
  useThemeContext,
  
  // Migration utilities
  migrateLegacyThemePreferences,
  validateThemePreferences,
  
  // Event handling
  setupThemeChangeListener,
};