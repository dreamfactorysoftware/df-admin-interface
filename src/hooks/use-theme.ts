/**
 * Theme hook for accessing and managing application theme state
 * Integrates with Zustand store for consistent theme management across the application
 * 
 * @file src/hooks/use-theme.ts
 * @since 1.0.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme types supported by the application
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Resolved theme type (system preference resolved)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme store interface
 */
interface ThemeStore {
  /**
   * Current theme setting
   */
  theme: Theme;
  
  /**
   * Resolved theme (system preference resolved)
   */
  resolvedTheme: ResolvedTheme;
  
  /**
   * System theme preference
   */
  systemTheme: ResolvedTheme;
  
  /**
   * Set theme preference
   */
  setTheme: (theme: Theme) => void;
  
  /**
   * Update system theme (called by media query listener)
   */
  setSystemTheme: (systemTheme: ResolvedTheme) => void;
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => void;
}

/**
 * Zustand store for theme management with persistence
 */
const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      systemTheme: 'light',
      
      setTheme: (theme: Theme) => {
        set((state) => ({
          theme,
          resolvedTheme: theme === 'system' ? state.systemTheme : theme,
        }));
      },
      
      setSystemTheme: (systemTheme: ResolvedTheme) => {
        set((state) => ({
          systemTheme,
          resolvedTheme: state.theme === 'system' ? systemTheme : state.resolvedTheme,
        }));
      },
      
      toggleTheme: () => {
        const { theme, resolvedTheme } = get();
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        set({
          theme: newTheme,
          resolvedTheme: newTheme,
        });
      },
    }),
    {
      name: 'df-admin-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/**
 * Hook for accessing and managing theme state
 * Automatically handles system preference detection and updates
 * 
 * @returns Theme store state and actions
 */
export function useTheme() {
  const store = useThemeStore();
  
  // Initialize system theme detection on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      store.setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    
    // Set initial system theme
    updateSystemTheme();
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, [store]);
  
  // Apply theme to document
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const { resolvedTheme } = store;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(resolvedTheme);
    
    // Set data attribute for additional styling hooks
    root.setAttribute('data-theme', resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  }, [store.resolvedTheme]);
  
  return store;
}

/**
 * Hook for getting theme-aware class names
 * Utility hook for components that need theme-specific styling
 * 
 * @param lightClasses - Classes for light theme
 * @param darkClasses - Classes for dark theme
 * @returns Combined class string based on current theme
 */
export function useThemeClasses(lightClasses: string, darkClasses: string): string {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkClasses : lightClasses;
}

/**
 * Hook for detecting if dark theme is active
 * Simple utility for conditional logic based on theme
 * 
 * @returns Boolean indicating if dark theme is active
 */
export function useIsDarkTheme(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
}

// Add React import for useEffect
import React from 'react';