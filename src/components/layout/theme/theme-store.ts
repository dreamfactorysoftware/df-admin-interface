/**
 * Zustand theme store integration providing performance-optimized theme state management.
 * Complements React context provider with Zustand's performance benefits for complex scenarios.
 * Integrates with existing application store patterns for unified state management.
 * 
 * This store provides:
 * - Performance-optimized selectors for theme state access
 * - Specialized persist middleware for theme preferences
 * - System theme detection and synchronization
 * - Type-safe theme state management with TypeScript
 * - Integration with existing app store for consistency
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { useAppStore } from '@/stores/app-store';

/**
 * Theme preference types supporting light, dark, and system detection.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme type for actual application of theme styles.
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * System theme detection capabilities.
 */
export interface SystemThemeState {
  /** Current system preference detected via media query */
  systemPreference: ResolvedTheme;
  
  /** Whether system theme detection is supported */
  supportsSystemTheme: boolean;
  
  /** Whether currently listening to system theme changes */
  isListening: boolean;
}

/**
 * Theme animation and transition control.
 */
export interface ThemeTransitionState {
  /** Whether theme transitions are currently disabled */
  transitionsDisabled: boolean;
  
  /** Whether theme is currently being changed */
  isChanging: boolean;
  
  /** Transition duration in milliseconds */
  transitionDuration: number;
}

/**
 * Theme store state interface combining all theme-related state.
 */
export interface ThemeStoreState {
  // Core theme state
  /** Current theme preference */
  theme: ThemeMode;
  
  /** Resolved theme based on preference and system detection */
  resolvedTheme: ResolvedTheme;
  
  /** Previous resolved theme for transition tracking */
  previousTheme: ResolvedTheme | null;
  
  // System theme detection
  systemTheme: SystemThemeState;
  
  // Transition management
  transitions: ThemeTransitionState;
  
  // Theme preference history for analytics
  /** Theme change history for user preference analytics */
  changeHistory: Array<{
    from: ThemeMode;
    to: ThemeMode;
    timestamp: number;
    trigger: 'user' | 'system' | 'initial';
  }>;
  
  // Actions
  /** Set theme preference with optional transition control */
  setTheme: (theme: ThemeMode, options?: { disableTransition?: boolean; trigger?: 'user' | 'system' }) => void;
  
  /** Update resolved theme (internal use for system detection) */
  setResolvedTheme: (theme: ResolvedTheme) => void;
  
  /** Update system theme preference */
  updateSystemTheme: (theme: ResolvedTheme) => void;
  
  /** Enable or disable theme transitions */
  setTransitionsEnabled: (enabled: boolean) => void;
  
  /** Initialize system theme listener */
  initializeSystemThemeListener: () => void;
  
  /** Cleanup system theme listener */
  cleanupSystemThemeListener: () => void;
  
  /** Sync with app store theme state */
  syncWithAppStore: () => void;
  
  /** Get theme analytics data */
  getThemeAnalytics: () => {
    currentTheme: ThemeMode;
    resolvedTheme: ResolvedTheme;
    systemPreference: ResolvedTheme;
    changeCount: number;
    lastChanged: number | null;
    userPrefersDark: boolean;
    userPrefersSystem: boolean;
  };
  
  /** Reset theme to system default */
  resetToSystemDefault: () => void;
}

/**
 * Default system theme state.
 */
const defaultSystemTheme: SystemThemeState = {
  systemPreference: 'light',
  supportsSystemTheme: typeof window !== 'undefined' && window.matchMedia !== undefined,
  isListening: false,
};

/**
 * Default transition state.
 */
const defaultTransitions: ThemeTransitionState = {
  transitionsDisabled: false,
  isChanging: false,
  transitionDuration: 150,
};

/**
 * Media query for system theme detection.
 */
let systemThemeMediaQuery: MediaQueryList | null = null;

/**
 * Media query change handler for system theme updates.
 */
let systemThemeHandler: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Performance-optimized theme store using Zustand with persistence.
 * Complements React context provider with additional performance benefits.
 */
export const useThemeStore = create<ThemeStoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          theme: 'system',
          resolvedTheme: 'light',
          previousTheme: null,
          systemTheme: defaultSystemTheme,
          transitions: defaultTransitions,
          changeHistory: [],
          
          // Core theme actions
          setTheme: (theme, options = {}) => {
            const { disableTransition = false, trigger = 'user' } = options;
            const currentState = get();
            const previousTheme = currentState.theme;
            
            // Disable transitions temporarily if requested
            if (disableTransition) {
              set({ transitions: { ...currentState.transitions, transitionsDisabled: true } });
              
              // Re-enable transitions after a short delay
              setTimeout(() => {
                set(state => ({ 
                  transitions: { ...state.transitions, transitionsDisabled: false } 
                }));
              }, currentState.transitions.transitionDuration);
            }
            
            // Calculate resolved theme
            let resolvedTheme: ResolvedTheme;
            if (theme === 'system') {
              resolvedTheme = currentState.systemTheme.systemPreference;
            } else {
              resolvedTheme = theme;
            }
            
            // Update state
            set(state => ({
              theme,
              resolvedTheme,
              previousTheme: state.resolvedTheme,
              transitions: {
                ...state.transitions,
                isChanging: true,
              },
              changeHistory: [
                ...state.changeHistory.slice(-9), // Keep last 10 entries
                {
                  from: previousTheme,
                  to: theme,
                  timestamp: Date.now(),
                  trigger,
                },
              ],
            }));
            
            // Sync with app store
            const appStore = useAppStore.getState();
            appStore.setTheme(theme);
            appStore.setResolvedTheme(resolvedTheme);
            
            // Clear changing state after transition
            setTimeout(() => {
              set(state => ({
                transitions: {
                  ...state.transitions,
                  isChanging: false,
                }
              }));
            }, currentState.transitions.transitionDuration);
          },
          
          setResolvedTheme: (resolvedTheme) => {
            set(state => ({
              resolvedTheme,
              previousTheme: state.resolvedTheme,
            }));
            
            // Sync with app store
            const appStore = useAppStore.getState();
            appStore.setResolvedTheme(resolvedTheme);
          },
          
          updateSystemTheme: (systemPreference) => {
            const currentState = get();
            
            set(state => ({
              systemTheme: {
                ...state.systemTheme,
                systemPreference,
              },
            }));
            
            // Update resolved theme if currently using system preference
            if (currentState.theme === 'system') {
              get().setResolvedTheme(systemPreference);
            }
          },
          
          setTransitionsEnabled: (enabled) => {
            set(state => ({
              transitions: {
                ...state.transitions,
                transitionsDisabled: !enabled,
              },
            }));
          },
          
          initializeSystemThemeListener: () => {
            if (typeof window === 'undefined' || !window.matchMedia) {
              return;
            }
            
            const currentState = get();
            if (currentState.systemTheme.isListening) {
              return;
            }
            
            // Create media query for system theme detection
            systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Set initial system preference
            get().updateSystemTheme(systemThemeMediaQuery.matches ? 'dark' : 'light');
            
            // Create change handler
            systemThemeHandler = (e: MediaQueryListEvent) => {
              get().updateSystemTheme(e.matches ? 'dark' : 'light');
            };
            
            // Add listener
            systemThemeMediaQuery.addEventListener('change', systemThemeHandler);
            
            // Update listening state
            set(state => ({
              systemTheme: {
                ...state.systemTheme,
                isListening: true,
                supportsSystemTheme: true,
              },
            }));
          },
          
          cleanupSystemThemeListener: () => {
            if (systemThemeMediaQuery && systemThemeHandler) {
              systemThemeMediaQuery.removeEventListener('change', systemThemeHandler);
              systemThemeMediaQuery = null;
              systemThemeHandler = null;
            }
            
            set(state => ({
              systemTheme: {
                ...state.systemTheme,
                isListening: false,
              },
            }));
          },
          
          syncWithAppStore: () => {
            const appStore = useAppStore.getState();
            const currentState = get();
            
            // Sync theme state with app store
            if (appStore.theme !== currentState.theme) {
              set({ theme: appStore.theme });
            }
            
            if (appStore.resolvedTheme !== currentState.resolvedTheme) {
              set({ resolvedTheme: appStore.resolvedTheme });
            }
          },
          
          getThemeAnalytics: () => {
            const state = get();
            const now = Date.now();
            const recentChanges = state.changeHistory.filter(
              change => now - change.timestamp < 86400000 // Last 24 hours
            );
            
            return {
              currentTheme: state.theme,
              resolvedTheme: state.resolvedTheme,
              systemPreference: state.systemTheme.systemPreference,
              changeCount: state.changeHistory.length,
              lastChanged: state.changeHistory.length > 0 
                ? state.changeHistory[state.changeHistory.length - 1].timestamp 
                : null,
              userPrefersDark: recentChanges.some(change => change.to === 'dark'),
              userPrefersSystem: state.theme === 'system',
            };
          },
          
          resetToSystemDefault: () => {
            get().setTheme('system', { trigger: 'system' });
          },
        }),
        {
          name: 'dreamfactory-theme-store',
          // Persist only essential theme preferences
          partialize: (state) => ({
            theme: state.theme,
            changeHistory: state.changeHistory.slice(-5), // Keep last 5 changes
            transitions: {
              transitionDuration: state.transitions.transitionDuration,
              transitionsDisabled: false, // Always reset to false on load
            },
          }),
          // Storage version for migration handling
          version: 1,
          // Custom storage engine with error handling
          storage: {
            getItem: (name: string) => {
              try {
                const item = localStorage.getItem(name);
                return item ? JSON.parse(item) : null;
              } catch (error) {
                console.warn('Failed to read theme preferences from localStorage:', error);
                return null;
              }
            },
            setItem: (name: string, value: any) => {
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (error) {
                console.warn('Failed to save theme preferences to localStorage:', error);
              }
            },
            removeItem: (name: string) => {
              try {
                localStorage.removeItem(name);
              } catch (error) {
                console.warn('Failed to remove theme preferences from localStorage:', error);
              }
            },
          },
        }
      )
    ),
    {
      name: 'DreamFactory Theme Store',
      // Enable dev tools only in development
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Performance-optimized selector hooks for theme state.
 * These hooks provide fine-grained subscriptions to prevent unnecessary re-renders.
 */

/** Core theme state selector */
export const useThemeMode = () => useThemeStore(state => ({
  theme: state.theme,
  resolvedTheme: state.resolvedTheme,
  previousTheme: state.previousTheme,
  setTheme: state.setTheme,
}));

/** System theme detection selector */
export const useSystemTheme = () => useThemeStore(state => ({
  systemPreference: state.systemTheme.systemPreference,
  supportsSystemTheme: state.systemTheme.supportsSystemTheme,
  isListening: state.systemTheme.isListening,
  updateSystemTheme: state.updateSystemTheme,
  initializeSystemThemeListener: state.initializeSystemThemeListener,
  cleanupSystemThemeListener: state.cleanupSystemThemeListener,
}));

/** Theme transition state selector */
export const useThemeTransitions = () => useThemeStore(state => ({
  transitionsDisabled: state.transitions.transitionsDisabled,
  isChanging: state.transitions.isChanging,
  transitionDuration: state.transitions.transitionDuration,
  setTransitionsEnabled: state.setTransitionsEnabled,
}));

/** Theme analytics selector */
export const useThemeAnalytics = () => useThemeStore(state => ({
  changeHistory: state.changeHistory,
  getAnalytics: state.getThemeAnalytics,
}));

/** Lightweight theme selector for components that only need resolved theme */
export const useResolvedTheme = () => useThemeStore(state => state.resolvedTheme);

/** Lightweight theme preference selector */
export const useThemePreference = () => useThemeStore(state => state.theme);

/**
 * Utility function to check if a theme is dark.
 * @param theme - Theme to check
 * @returns True if theme is dark
 */
export const isDarkTheme = (theme: ResolvedTheme): boolean => theme === 'dark';

/**
 * Utility function to check if using system theme preference.
 * @returns True if currently using system preference
 */
export const useIsSystemTheme = () => useThemeStore(state => state.theme === 'system');

/**
 * Utility function to get theme CSS class for Tailwind.
 * @returns CSS class name for current theme
 */
export const useThemeClass = () => useThemeStore(state => state.resolvedTheme);

/**
 * Hook for theme initialization in React components.
 * Handles system theme listener setup and app store synchronization.
 */
export const useThemeInitialization = () => {
  const {
    initializeSystemThemeListener,
    cleanupSystemThemeListener,
    syncWithAppStore,
    supportsSystemTheme,
  } = useThemeStore();

  return {
    initialize: () => {
      if (supportsSystemTheme) {
        initializeSystemThemeListener();
      }
      syncWithAppStore();
    },
    cleanup: cleanupSystemThemeListener,
    sync: syncWithAppStore,
  };
};