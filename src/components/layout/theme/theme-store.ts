/**
 * Specialized Zustand theme store for DreamFactory Admin Interface.
 * Complements the main app store with advanced theme functionality, system preference detection,
 * and performance-optimized theme state management with persistence middleware.
 * 
 * This store provides granular theme utilities, accessibility features, and seamless integration
 * with the existing application store patterns for unified state management.
 */

import React from 'react';
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import type {
  ThemeMode,
  ResolvedTheme,
  ThemeProviderConfig,
  ThemeTransition,
  SystemThemeConfig,
  ThemeUtils,
  THEME_ERROR_CODES,
  ThemeError,
  ThemeCSSProperties,
  ThemeColorPalette,
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
} from '@/types/theme';
import { useAppStore } from '@/stores/app-store';

/**
 * Extended theme state interface with advanced functionality.
 * Provides comprehensive theme management beyond basic light/dark switching.
 */
export interface ExtendedThemeState {
  // Core Theme State
  /** Current theme mode (synced with app store) */
  theme: ThemeMode;
  
  /** Resolved theme after system preference detection */
  resolvedTheme: ResolvedTheme;
  
  /** Detected system theme preference */
  systemTheme: ResolvedTheme;
  
  /** Whether theme system is fully initialized */
  mounted: boolean;
  
  // Theme Configuration
  /** Theme provider configuration */
  config: ThemeProviderConfig;
  
  /** Theme transition settings */
  transition: ThemeTransition;
  
  /** System theme detection configuration */
  systemConfig: SystemThemeConfig;
  
  // Theme Utilities and Accessibility
  /** Current theme color palette */
  colorPalette: ThemeColorPalette;
  
  /** Accessibility compliance checking enabled */
  accessibilityMode: boolean;
  
  /** High contrast mode for accessibility */
  highContrastMode: boolean;
  
  /** Reduced motion preference detection */
  reducedMotion: boolean;
  
  // Performance Tracking
  /** Theme change performance metrics */
  performanceMetrics: {
    lastThemeChangeTime: number;
    averageChangeTime: number;
    changeCount: number;
  };
  
  /** Active theme-based subscriptions for cleanup */
  activeSubscriptions: Set<string>;
  
  // Actions
  /** Set theme with app store synchronization */
  setTheme: (theme: ThemeMode) => void;
  
  /** Set resolved theme */
  setResolvedTheme: (theme: ResolvedTheme) => void;
  
  /** Initialize theme system */
  initialize: () => Promise<void>;
  
  /** Detect and set system theme preference */
  detectSystemTheme: () => ResolvedTheme;
  
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  
  /** Reset theme to system preference */
  resetToSystem: () => void;
  
  /** Update theme configuration */
  updateConfig: (config: Partial<ThemeProviderConfig>) => void;
  
  /** Update transition settings */
  updateTransition: (transition: Partial<ThemeTransition>) => void;
  
  /** Toggle accessibility mode */
  toggleAccessibilityMode: () => void;
  
  /** Toggle high contrast mode */
  toggleHighContrastMode: () => void;
  
  /** Apply theme with performance tracking */
  applyTheme: (theme: ResolvedTheme) => Promise<void>;
  
  /** Get accessible color combination */
  getAccessibleColors: (theme?: ResolvedTheme) => ThemeCSSProperties;
  
  /** Calculate contrast ratio between colors */
  calculateContrastRatio: (foreground: string, background: string) => number;
  
  /** Check WCAG compliance */
  checkAccessibility: (foreground: string, background: string, level?: 'AA' | 'AAA') => boolean;
  
  /** Subscribe to theme changes with cleanup */
  subscribeToThemeChanges: (callback: (theme: ResolvedTheme) => void) => () => void;
  
  /** Clean up all subscriptions */
  cleanup: () => void;
}

/**
 * Default theme color palette configuration.
 * Provides comprehensive color definitions for light and dark themes.
 */
const defaultColorPalette: ThemeColorPalette = {
  light: {
    '--theme-background': '#ffffff',
    '--theme-foreground': '#0f172a',
    '--theme-primary': '#3b82f6',
    '--theme-secondary': '#64748b',
    '--theme-accent': '#06b6d4',
    '--theme-border': '#e2e8f0',
    '--theme-input': '#f8fafc',
    '--theme-ring': '#3b82f6',
  },
  dark: {
    '--theme-background': '#0f172a',
    '--theme-foreground': '#f8fafc',
    '--theme-primary': '#60a5fa',
    '--theme-secondary': '#94a3b8',
    '--theme-accent': '#22d3ee',
    '--theme-border': '#334155',
    '--theme-input': '#1e293b',
    '--theme-ring': '#60a5fa',
  },
};

/**
 * Default transition configuration for smooth theme changes.
 */
const defaultTransition: ThemeTransition = {
  duration: THEME_CONSTANTS.CSS_TRANSITION_DURATION,
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  properties: ['background-color', 'border-color', 'color', 'box-shadow'],
  disabled: false,
};

/**
 * System theme detection configuration.
 */
const defaultSystemConfig: SystemThemeConfig = {
  darkModeQuery: THEME_CONSTANTS.SYSTEM_QUERY,
  autoUpdate: true,
};

/**
 * Utility functions for theme management.
 * Provides reusable functionality for theme operations and accessibility checking.
 */
const themeUtils: ThemeUtils = {
  getSystemTheme: (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('Failed to detect system theme preference:', error);
      return 'light';
    }
  },
  
  isThemeSupported: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'matchMedia' in window && typeof window.matchMedia === 'function';
  },
  
  isValidTheme: (theme: string): theme is ThemeMode => {
    return ['light', 'dark', 'system'].includes(theme);
  },
  
  getAccessibleColors: (theme: ResolvedTheme = 'light'): ThemeCSSProperties => {
    return defaultColorPalette[theme];
  },
  
  applyTheme: async (theme: ResolvedTheme, selector = ':root'): Promise<void> => {
    if (typeof document === 'undefined') return;
    
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      throw new ThemeError(`Selector "${selector}" not found`, THEME_ERROR_CODES.PROVIDER_NOT_FOUND);
    }
    
    // Apply theme classes
    element.classList.remove('theme-light', 'theme-dark');
    element.classList.add(`theme-${theme}`);
    
    // Apply CSS custom properties
    const colors = themeUtils.getAccessibleColors(theme);
    Object.entries(colors).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
    
    // Update data attribute
    element.setAttribute(THEME_CONSTANTS.THEME_ATTRIBUTE, theme);
  },
  
  removeTheme: (selector = ':root'): void => {
    if (typeof document === 'undefined') return;
    
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;
    
    element.classList.remove('theme-light', 'theme-dark');
    element.removeAttribute(THEME_CONSTANTS.THEME_ATTRIBUTE);
    
    // Remove CSS custom properties
    Object.keys(defaultColorPalette.light).forEach(property => {
      element.style.removeProperty(property);
    });
  },
  
  getContrastRatio: (foreground: string, background: string): number => {
    // Simplified contrast ratio calculation
    // In a real implementation, this would use proper color parsing and luminance calculation
    const getLuminance = (color: string): number => {
      // Placeholder implementation - should use proper color conversion
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Simplified sRGB to linear RGB conversion
      const [rLinear, gLinear, bLinear] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      // Calculate relative luminance
      return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },
  
  meetsAccessibilityStandards: (
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    isLargeText = false
  ): boolean => {
    const ratio = themeUtils.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
    
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },
};

/**
 * Specialized theme store with advanced functionality.
 * Provides performance-optimized theme management with persistence and system integration.
 */
export const useThemeStore = create<ExtendedThemeState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial State
        theme: 'system',
        resolvedTheme: 'light',
        systemTheme: 'light',
        mounted: false,
        config: DEFAULT_THEME_CONFIG,
        transition: defaultTransition,
        systemConfig: defaultSystemConfig,
        colorPalette: defaultColorPalette,
        accessibilityMode: false,
        highContrastMode: false,
        reducedMotion: false,
        performanceMetrics: {
          lastThemeChangeTime: 0,
          averageChangeTime: 0,
          changeCount: 0,
        },
        activeSubscriptions: new Set(),
        
        // Core Actions
        setTheme: (theme: ThemeMode) => {
          const startTime = performance.now();
          
          set((state) => {
            // Synchronize with app store
            useAppStore.getState().setTheme(theme);
            
            const resolvedTheme = theme === 'system' ? state.systemTheme : theme;
            
            // Update performance metrics
            const endTime = performance.now();
            const changeTime = endTime - startTime;
            const newMetrics = {
              lastThemeChangeTime: changeTime,
              changeCount: state.performanceMetrics.changeCount + 1,
              averageChangeTime: 
                (state.performanceMetrics.averageChangeTime * state.performanceMetrics.changeCount + changeTime) / 
                (state.performanceMetrics.changeCount + 1),
            };
            
            return {
              theme,
              resolvedTheme,
              performanceMetrics: newMetrics,
            };
          }, false, 'setTheme');
          
          // Apply theme asynchronously
          const { resolvedTheme } = get();
          get().applyTheme(resolvedTheme);
        },
        
        setResolvedTheme: (resolvedTheme: ResolvedTheme) => {
          set({ resolvedTheme }, false, 'setResolvedTheme');
          useAppStore.getState().setResolvedTheme(resolvedTheme);
          get().applyTheme(resolvedTheme);
        },
        
        initialize: async (): Promise<void> => {
          if (typeof window === 'undefined') return;
          
          // Detect system theme
          const systemTheme = themeUtils.getSystemTheme();
          
          // Check for reduced motion preference
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          // Set up system theme listener
          if (themeUtils.isThemeSupported()) {
            const mediaQuery = window.matchMedia(THEME_CONSTANTS.SYSTEM_QUERY);
            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
              const newSystemTheme = e.matches ? 'dark' : 'light';
              set((state) => {
                const resolvedTheme = state.theme === 'system' ? newSystemTheme : state.resolvedTheme;
                return { systemTheme: newSystemTheme, resolvedTheme };
              }, false, 'systemThemeChange');
              
              if (get().theme === 'system') {
                get().applyTheme(get().resolvedTheme);
              }
            };
            
            mediaQuery.addEventListener('change', handleSystemThemeChange);
            
            // Store cleanup function
            const subscriptions = get().activeSubscriptions;
            subscriptions.add('systemThemeListener');
          }
          
          set((state) => ({
            systemTheme,
            resolvedTheme: state.theme === 'system' ? systemTheme : state.theme as ResolvedTheme,
            reducedMotion,
            mounted: true,
          }), false, 'initialize');
          
          // Apply initial theme
          await get().applyTheme(get().resolvedTheme);
        },
        
        detectSystemTheme: (): ResolvedTheme => {
          const systemTheme = themeUtils.getSystemTheme();
          set({ systemTheme }, false, 'detectSystemTheme');
          return systemTheme;
        },
        
        toggleTheme: () => {
          const currentResolved = get().resolvedTheme;
          const newTheme = currentResolved === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },
        
        resetToSystem: () => {
          get().setTheme('system');
        },
        
        updateConfig: (newConfig: Partial<ThemeProviderConfig>) => {
          set((state) => ({
            config: { ...state.config, ...newConfig }
          }), false, 'updateConfig');
        },
        
        updateTransition: (newTransition: Partial<ThemeTransition>) => {
          set((state) => ({
            transition: { ...state.transition, ...newTransition }
          }), false, 'updateTransition');
        },
        
        toggleAccessibilityMode: () => {
          set((state) => ({ accessibilityMode: !state.accessibilityMode }), false, 'toggleAccessibilityMode');
        },
        
        toggleHighContrastMode: () => {
          set((state) => ({ highContrastMode: !state.highContrastMode }), false, 'toggleHighContrastMode');
        },
        
        // Advanced Theme Utilities
        applyTheme: async (theme: ResolvedTheme): Promise<void> => {
          const { config, transition, reducedMotion } = get();
          
          try {
            // Disable transitions if user prefers reduced motion
            if (reducedMotion && !transition.disabled) {
              document.documentElement.style.setProperty('--theme-transition', 'none');
            }
            
            await themeUtils.applyTheme(theme, config.selector);
            
            // Re-enable transitions
            if (reducedMotion && !transition.disabled) {
              setTimeout(() => {
                document.documentElement.style.removeProperty('--theme-transition');
              }, 0);
            }
          } catch (error) {
            console.error('Failed to apply theme:', error);
            throw error;
          }
        },
        
        getAccessibleColors: (theme?: ResolvedTheme): ThemeCSSProperties => {
          const targetTheme = theme || get().resolvedTheme;
          return themeUtils.getAccessibleColors(targetTheme);
        },
        
        calculateContrastRatio: themeUtils.getContrastRatio,
        
        checkAccessibility: themeUtils.meetsAccessibilityStandards,
        
        subscribeToThemeChanges: (callback: (theme: ResolvedTheme) => void) => {
          const unsubscribe = useThemeStore.subscribe(
            (state) => state.resolvedTheme,
            callback
          );
          
          const subscriptionId = Math.random().toString(36).substr(2, 9);
          get().activeSubscriptions.add(subscriptionId);
          
          return () => {
            unsubscribe();
            get().activeSubscriptions.delete(subscriptionId);
          };
        },
        
        cleanup: () => {
          const subscriptions = get().activeSubscriptions;
          subscriptions.clear();
          
          // Remove theme classes and properties
          themeUtils.removeTheme(get().config.selector);
        },
      })),
      {
        name: THEME_CONSTANTS.STORAGE_KEY,
        // Persist only essential theme preferences
        partialize: (state) => ({
          theme: state.theme,
          accessibilityMode: state.accessibilityMode,
          highContrastMode: state.highContrastMode,
          config: {
            defaultTheme: state.config.defaultTheme,
            enableSystem: state.config.enableSystem,
            disableTransitionOnChange: state.config.disableTransitionOnChange,
          },
          transition: state.transition,
        }),
        version: 1,
      }
    ),
    {
      name: 'DreamFactory Theme Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Performance-optimized selectors for theme state access.
 * Provides granular subscriptions to minimize unnecessary re-renders.
 */

/** Core theme state selector */
export const useThemeState = () => useThemeStore((state) => ({
  theme: state.theme,
  resolvedTheme: state.resolvedTheme,
  systemTheme: state.systemTheme,
  mounted: state.mounted,
}));

/** Theme actions selector */
export const useThemeActions = () => useThemeStore((state) => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  resetToSystem: state.resetToSystem,
  initialize: state.initialize,
}));

/** Theme configuration selector */
export const useThemeConfig = () => useThemeStore((state) => ({
  config: state.config,
  transition: state.transition,
  updateConfig: state.updateConfig,
  updateTransition: state.updateTransition,
}));

/** Accessibility features selector */
export const useThemeAccessibility = () => useThemeStore((state) => ({
  accessibilityMode: state.accessibilityMode,
  highContrastMode: state.highContrastMode,
  reducedMotion: state.reducedMotion,
  toggleAccessibilityMode: state.toggleAccessibilityMode,
  toggleHighContrastMode: state.toggleHighContrastMode,
  checkAccessibility: state.checkAccessibility,
  getAccessibleColors: state.getAccessibleColors,
}));

/** Theme utilities selector */
export const useThemeUtils = () => useThemeStore((state) => ({
  applyTheme: state.applyTheme,
  calculateContrastRatio: state.calculateContrastRatio,
  subscribeToThemeChanges: state.subscribeToThemeChanges,
  colorPalette: state.colorPalette,
}));

/** Performance metrics selector */
export const useThemePerformance = () => useThemeStore((state) => ({
  performanceMetrics: state.performanceMetrics,
  activeSubscriptions: state.activeSubscriptions,
  cleanup: state.cleanup,
}));

/**
 * Custom hook for comprehensive theme management.
 * Provides all theme functionality with performance optimization.
 */
export const useAdvancedTheme = () => {
  const themeState = useThemeState();
  const themeActions = useThemeActions();
  const themeConfig = useThemeConfig();
  const themeAccessibility = useThemeAccessibility();
  const themeUtils = useThemeUtils();
  
  return {
    ...themeState,
    ...themeActions,
    ...themeConfig,
    ...themeAccessibility,
    ...themeUtils,
    
    // Convenience methods
    isTheme: (mode: ThemeMode) => themeState.theme === mode,
    isResolvedTheme: (mode: ResolvedTheme) => themeState.resolvedTheme === mode,
    isDark: themeState.resolvedTheme === 'dark',
    isLight: themeState.resolvedTheme === 'light',
    isSystemTheme: themeState.theme === 'system',
  };
};

/**
 * Hook for theme synchronization with the main app store.
 * Ensures consistent theme state across both stores.
 */
export const useThemeSync = () => {
  const themeStore = useThemeStore();
  const appStore = useAppStore();
  
  // Sync theme changes from app store to theme store
  React.useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state) => state.theme,
      (theme) => {
        if (theme !== themeStore.theme) {
          themeStore.setTheme(theme);
        }
      }
    );
    
    return unsubscribe;
  }, [themeStore]);
  
  return {
    syncToAppStore: () => {
      appStore.setTheme(themeStore.theme);
      appStore.setResolvedTheme(themeStore.resolvedTheme);
    },
    syncFromAppStore: () => {
      themeStore.setTheme(appStore.theme);
      themeStore.setResolvedTheme(appStore.resolvedTheme);
    },
  };
};